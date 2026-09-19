/**
 * Multi-market scan orchestration.
 *
 * Shared by the Scanner page (sweep every market, publish signals) and the AI
 * Scanner (pick the single best market/strategy pair). Which markets are
 * scanned and which strategies are considered are both discovered from Deriv
 * at run time - `active_symbols` for the market list, `contracts_for` for the
 * playable contracts on each one.
 */
import {
    DerivDataError,
    fetchTickHistory,
    getAnalysisSymbols,
    getContractTypes,
    TAnalysisSymbol,
} from './deriv-market-data';
import {
    analyseSymbol,
    buildStrategyUniverse,
    SUPPORTED_CONTRACT_TYPES,
    TEvaluateOptions,
    TSignal,
    TStrategyFamily,
    toSignal,
    TSymbolAnalysis,
} from './strategies';

export type TScanRow = TSymbolAnalysis & {
    market: string;
    market_display_name: string;
    signal: TSignal;
    /** Contract types Deriv offered for this symbol at scan time. */
    available_contract_types: string[];
};

export type TScanProgress = {
    completed: number;
    total: number;
    current_symbol: string;
    current_display_name: string;
};

export type TScanFailure = {
    symbol: string;
    display_name: string;
    reason: string;
};

export type TScanResult = {
    rows: TScanRow[];
    failures: TScanFailure[];
    ticks_per_symbol: number;
    scanned_at: number;
};

export type TScanOptions = {
    /** Ticks of history to analyse per market. */
    ticks: number;
    /** Restrict to these symbols; defaults to every digit-capable open market. */
    symbols?: string[];
    /** Restrict to these strategy families. */
    families?: TStrategyFamily[];
    /** Upper bound on markets scanned (0 / undefined = no limit). */
    max_symbols?: number;
    concurrency?: number;
    evaluate?: TEvaluateOptions;
    onProgress?: (progress: TScanProgress) => void;
    /** Flip `cancelled` to abort an in-flight scan. */
    cancellation?: { cancelled: boolean };
};

const DEFAULT_CONCURRENCY = 4;

class ScanCancelled extends Error {}

/* ------------------------------------------------- digit market discovery */

let digit_markets_cache: Set<string> | null = null;

/**
 * Which Deriv markets actually offer digit contracts. Probes one symbol per
 * market via `contracts_for` rather than assuming a list of market names.
 */
export const discoverDigitMarkets = async (): Promise<Set<string>> => {
    if (digit_markets_cache) return digit_markets_cache;

    const symbols = await getAnalysisSymbols();
    const by_market = new Map<string, TAnalysisSymbol[]>();
    symbols.forEach(symbol => {
        const list = by_market.get(symbol.market) ?? [];
        list.push(symbol);
        by_market.set(symbol.market, list);
    });

    const markets = new Set<string>();
    await Promise.all(
        Array.from(by_market.entries()).map(async ([market, list]) => {
            const probe = list.find(s => s.is_open) ?? list[0];
            if (!probe) return;
            try {
                const types = await getContractTypes(probe.symbol);
                if (SUPPORTED_CONTRACT_TYPES.some(type => types.has(type))) markets.add(market);
            } catch {
                /* a market we cannot probe is simply left out */
            }
        })
    );

    digit_markets_cache = markets;
    return markets;
};

/** Open markets the scanners can analyse, ordered by market then display name. */
export const getScannableSymbols = async (): Promise<TAnalysisSymbol[]> => {
    const [symbols, digit_markets] = await Promise.all([getAnalysisSymbols(), discoverDigitMarkets()]);
    return symbols
        .filter(s => s.is_open && digit_markets.has(s.market))
        .sort((a, b) => a.market.localeCompare(b.market) || a.display_name.localeCompare(b.display_name));
};

/* ----------------------------------------------------------- single market */

export const analyseMarket = async (
    symbol_meta: TAnalysisSymbol,
    ticks: number,
    options: { families?: TStrategyFamily[]; evaluate?: TEvaluateOptions } = {}
): Promise<TScanRow> => {
    const [history, available] = await Promise.all([
        fetchTickHistory(symbol_meta.symbol, ticks),
        getContractTypes(symbol_meta.symbol).catch(() => null),
    ]);

    let definitions = buildStrategyUniverse(available);
    if (options.families?.length) {
        definitions = definitions.filter(d => options.families?.includes(d.family));
    }
    if (!definitions.length) {
        throw new DerivDataError(`${symbol_meta.display_name} offers none of the analysed contracts.`, 'no_contracts');
    }

    const analysis = analyseSymbol(
        {
            symbol: symbol_meta.symbol,
            display_name: symbol_meta.display_name,
            decimals: history.decimals,
            quotes: history.quotes,
            digits: history.digits,
        },
        definitions,
        options.evaluate
    );

    return {
        ...analysis,
        market: symbol_meta.market,
        market_display_name: symbol_meta.market_display_name,
        signal: toSignal(analysis.best, analysis.last_digit),
        available_contract_types: available ? Array.from(available) : [],
    };
};

/* ------------------------------------------------------------- full sweep */

export const scanMarkets = async (options: TScanOptions): Promise<TScanResult> => {
    const { ticks, onProgress, cancellation } = options;
    const all = await getScannableSymbols();

    let targets = options.symbols?.length ? all.filter(s => options.symbols?.includes(s.symbol)) : all;
    if (options.max_symbols && options.max_symbols > 0) targets = targets.slice(0, options.max_symbols);

    if (!targets.length) {
        throw new DerivDataError('No open Deriv markets available to scan right now.', 'no_targets');
    }

    const rows: TScanRow[] = [];
    const failures: TScanFailure[] = [];
    let completed = 0;
    let cursor = 0;

    const report = (symbol: TAnalysisSymbol) =>
        onProgress?.({
            completed,
            total: targets.length,
            current_symbol: symbol.symbol,
            current_display_name: symbol.display_name,
        });

    report(targets[0]);

    const worker = async () => {
        for (;;) {
            if (cancellation?.cancelled) throw new ScanCancelled();
            const index = cursor++;
            if (index >= targets.length) return;
            const symbol_meta = targets[index];
            report(symbol_meta);
            try {
                const row = await analyseMarket(symbol_meta, ticks, {
                    families: options.families,
                    evaluate: options.evaluate,
                });
                rows.push(row);
            } catch (error) {
                failures.push({
                    symbol: symbol_meta.symbol,
                    display_name: symbol_meta.display_name,
                    reason: error instanceof Error ? error.message : 'Scan failed',
                });
            } finally {
                completed += 1;
                report(symbol_meta);
            }
        }
    };

    const workers = Array.from(
        { length: Math.max(1, Math.min(options.concurrency ?? DEFAULT_CONCURRENCY, targets.length)) },
        () => worker()
    );

    try {
        await Promise.all(workers);
    } catch (error) {
        if (error instanceof ScanCancelled) {
            return { rows, failures, ticks_per_symbol: ticks, scanned_at: Date.now() };
        }
        throw error;
    }

    rows.sort((a, b) => (b.best?.score ?? -Infinity) - (a.best?.score ?? -Infinity));

    return { rows, failures, ticks_per_symbol: ticks, scanned_at: Date.now() };
};

/** The single strongest market/strategy pair in a completed sweep. */
export const pickBest = (result: TScanResult): TScanRow | null => {
    const tradable = result.rows.filter(row => row.best && row.best.edge > 0);
    if (!tradable.length) return null;
    return tradable.reduce((best, row) => ((row.best?.score ?? 0) > (best.best?.score ?? 0) ? row : best));
};

export const resetScannerDiscovery = () => {
    digit_markets_cache = null;
};
