/**
 * Deriv market-data layer shared by the Analysis Tool, the Scanner and the
 * AI Scanner.
 *
 * Every number those screens show comes through here, and everything here
 * comes from Deriv over the app's existing `api_base` socket:
 *   - `active_symbols` for the tradable market list
 *   - `contracts_for` for the contract types each market really offers
 *   - `ticks_history` for the analysis window
 *   - `ticks` (subscribe) for the live stream
 */
import { api_base } from '@/external/bot-skeleton';

import { pipToDecimals, quotesToDigits } from './digits';

export type TAnalysisSymbol = {
    symbol: string;
    display_name: string;
    market: string;
    market_display_name: string;
    submarket: string;
    submarket_display_name: string;
    decimals: number;
    is_open: boolean;
};

export type TTickHistory = {
    symbol: string;
    decimals: number;
    /** Oldest first. */
    quotes: number[];
    /** Oldest first, aligned with `quotes`. */
    digits: number[];
    epochs: number[];
};

export type TLiveTick = {
    symbol: string;
    quote: number;
    digit: number;
    epoch: number;
    decimals: number;
};

const DEFAULT_DECIMALS = 2;
const SYMBOLS_WAIT_TIMEOUT_MS = 12000;
const SOCKET_WAIT_TIMEOUT_MS = 12000;
const POLL_INTERVAL_MS = 200;

export class DerivDataError extends Error {
    code: string;

    constructor(message: string, code = 'deriv_error') {
        super(message);
        this.name = 'DerivDataError';
        this.code = code;
    }
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

type TApi = {
    connection?: { readyState?: number };
    send: (request: unknown) => Promise<any>;
    forget: (id: string) => Promise<any>;
    onMessage: () => { subscribe: (cb: (value: any) => void) => { unsubscribe: () => void } };
};

const getApi = (): TApi | null => ((api_base as unknown as { api: TApi | null })?.api ?? null);

export const isSocketOpen = (): boolean => getApi()?.connection?.readyState === 1;

/** Resolves once the shared Deriv socket is usable, or throws. */
export const waitForSocket = async (timeout_ms = SOCKET_WAIT_TIMEOUT_MS): Promise<TApi> => {
    const deadline = Date.now() + timeout_ms;
    while (Date.now() < deadline) {
        const api = getApi();
        if (api && api.connection?.readyState === 1) return api;
        await wait(POLL_INTERVAL_MS);
    }
    throw new DerivDataError('Not connected to Deriv. Check your connection and try again.', 'no_socket');
};

const RATE_LIMIT_CODES = ['RateLimit', 'RateLimitExceeded'];
const MAX_SEND_ATTEMPTS = 3;

/**
 * One Deriv request, with a back-off retry when the socket rate-limits us -
 * a full market sweep issues enough calls to hit that ceiling.
 */
const send = async <T = any>(request: Record<string, unknown>): Promise<T> => {
    let last_error: DerivDataError | null = null;

    for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt++) {
        const api = await waitForSocket();
        let response: any;
        try {
            response = await api.send(request);
        } catch (error: any) {
            response = error?.error ? error : { error: { message: error?.message } };
        }

        if (!response?.error) return response as T;

        last_error = new DerivDataError(
            response.error.message ?? 'Deriv API request failed',
            response.error.code ?? 'api_error'
        );
        if (!RATE_LIMIT_CODES.includes(last_error.code)) throw last_error;
        await wait(700 * (attempt + 1));
    }

    throw last_error ?? new DerivDataError('Deriv API request failed');
};

/* ------------------------------------------------------------------ symbols */

let symbols_cache: TAnalysisSymbol[] | null = null;
let symbols_promise: Promise<TAnalysisSymbol[]> | null = null;

const decimalsFor = (raw: any, pip_sizes: Record<string, number>): number => {
    const symbol = raw.underlying_symbol || raw.symbol;
    return (
        pipToDecimals(raw.pip_size) ??
        pipToDecimals(raw.pip) ??
        pipToDecimals(pip_sizes?.[symbol]) ??
        DEFAULT_DECIMALS
    );
};

const toAnalysisSymbol = (raw: any, pip_sizes: Record<string, number>): TAnalysisSymbol => {
    const symbol = raw.underlying_symbol || raw.symbol;
    return {
        symbol,
        // New Options API renamed display_name -> underlying_symbol_name.
        display_name:
            raw.display_name || raw.underlying_symbol_display_name || raw.underlying_symbol_name || symbol,
        market: raw.market ?? '',
        market_display_name: raw.market_display_name ?? raw.market ?? '',
        submarket: raw.submarket ?? '',
        submarket_display_name: raw.submarket_display_name ?? raw.submarket ?? '',
        decimals: decimalsFor(raw, pip_sizes),
        is_open: raw.exchange_is_open !== 0 && raw.exchange_is_open !== false && !raw.is_trading_suspended,
    };
};

const readSymbolsFromApiBase = (): TAnalysisSymbol[] => {
    const base = api_base as unknown as { active_symbols?: any[]; pip_sizes?: Record<string, number> };
    const pip_sizes = base.pip_sizes && typeof base.pip_sizes === 'object' ? base.pip_sizes : {};
    return (base.active_symbols ?? [])
        .map(raw => toAnalysisSymbol(raw, pip_sizes))
        .filter(s => !!s.symbol && !!s.display_name);
};

/**
 * Tradable markets, straight from Deriv's `active_symbols`. Nothing is
 * narrowed to a fixed allow-list here - callers filter by market or by the
 * contract types Deriv reports for a symbol.
 */
export const getAnalysisSymbols = async (force = false): Promise<TAnalysisSymbol[]> => {
    if (!force && symbols_cache?.length) return symbols_cache;
    if (!force && symbols_promise) return symbols_promise;

    symbols_promise = (async () => {
        const base = api_base as unknown as {
            has_active_symbols?: boolean;
            active_symbols_promise?: Promise<unknown> | null;
            getActiveSymbols?: () => Promise<any[] | undefined>;
        };

        // The app normally loads these at boot; kick it off if it has not run.
        if (!base.has_active_symbols && !base.active_symbols_promise && typeof base.getActiveSymbols === 'function') {
            base.active_symbols_promise = base.getActiveSymbols();
        }

        const deadline = Date.now() + SYMBOLS_WAIT_TIMEOUT_MS;
        while (Date.now() < deadline) {
            const list = readSymbolsFromApiBase();
            if (list.length) {
                symbols_cache = list;
                return list;
            }
            await wait(POLL_INTERVAL_MS);
        }

        // Last resort: ask Deriv directly.
        const response = await send<{ active_symbols: any[] }>({ active_symbols: 'brief' });
        const list = (response.active_symbols ?? []).map(raw => toAnalysisSymbol(raw, {}));
        if (!list.length) throw new DerivDataError('Deriv returned no tradable markets.', 'no_symbols');
        symbols_cache = list;
        return list;
    })();

    try {
        return await symbols_promise;
    } finally {
        symbols_promise = null;
    }
};

export const getSymbolMeta = async (symbol: string): Promise<TAnalysisSymbol | null> => {
    const list = await getAnalysisSymbols();
    return list.find(s => s.symbol === symbol) ?? null;
};

/* ----------------------------------------------------------- contracts_for */

const contract_types_cache = new Map<string, Set<string>>();
const contract_types_inflight = new Map<string, Promise<Set<string>>>();

/**
 * The contract types Deriv actually offers on a symbol (DIGITOVER, DIGITMATCH,
 * CALL, ...). The scanners build their strategy universe from this instead of
 * assuming a fixed menu.
 */
export const getContractTypes = async (symbol: string): Promise<Set<string>> => {
    const cached = contract_types_cache.get(symbol);
    if (cached) return cached;
    const inflight = contract_types_inflight.get(symbol);
    if (inflight) return inflight;

    const promise = (async () => {
        // Same request shape the bot builder uses on the Deriv Options API.
        const response = await send<{ contracts_for: { available: any[] } }>({ contracts_for: symbol });
        const available = response?.contracts_for?.available ?? [];
        const types = new Set<string>();
        available.forEach(contract => {
            if (typeof contract?.contract_type === 'string') types.add(contract.contract_type);
        });
        contract_types_cache.set(symbol, types);
        return types;
    })();

    contract_types_inflight.set(symbol, promise);
    try {
        return await promise;
    } finally {
        contract_types_inflight.delete(symbol);
    }
};

/* --------------------------------------------------------------- history */

export const fetchTickHistory = async (symbol: string, count: number): Promise<TTickHistory> => {
    const safe_count = Math.max(10, Math.min(5000, Math.trunc(count) || 500));
    const response = await send<any>({
        ticks_history: symbol,
        count: safe_count,
        end: 'latest',
        style: 'ticks',
    });

    const prices: (number | string)[] = response?.history?.prices ?? [];
    const times: number[] = response?.history?.times ?? [];
    if (!prices.length) throw new DerivDataError(`No tick history returned for ${symbol}.`, 'no_history');

    const meta = await getSymbolMeta(symbol);
    const decimals = pipToDecimals(response?.pip_size) ?? meta?.decimals ?? DEFAULT_DECIMALS;
    const quotes = prices.map(p => Number(p)).filter(Number.isFinite);

    return {
        symbol,
        decimals,
        quotes,
        digits: quotesToDigits(quotes, decimals),
        epochs: times.map(t => Number(t)),
    };
};

/* ------------------------------------------------------------ live stream */

type TStreamListener = (tick: TLiveTick) => void;

type TStream = {
    listeners: Set<TStreamListener>;
    subscription_id: string | null;
    message_subscription: { unsubscribe: () => void } | null;
    decimals: number;
};

const streams = new Map<string, TStream>();

const teardownStream = (symbol: string) => {
    const stream = streams.get(symbol);
    if (!stream) return;
    streams.delete(symbol);
    try {
        stream.message_subscription?.unsubscribe();
    } catch {
        /* socket already gone */
    }
    const api = getApi();
    if (stream.subscription_id && api && api.connection?.readyState === 1) {
        api.forget(stream.subscription_id).catch(() => undefined);
    }
};

/**
 * Live Deriv tick stream for one symbol. Multiple callers share a single
 * subscription; it is forgotten when the last listener leaves.
 */
export const subscribeToTicks = (
    symbol: string,
    listener: TStreamListener,
    onError?: (error: Error) => void
): (() => void) => {
    let stream = streams.get(symbol);

    if (!stream) {
        stream = {
            listeners: new Set(),
            subscription_id: null,
            message_subscription: null,
            decimals: DEFAULT_DECIMALS,
        };
        streams.set(symbol, stream);

        (async () => {
            try {
                const api = await waitForSocket();
                const current = streams.get(symbol);
                if (!current) return;

                const meta = await getSymbolMeta(symbol);
                current.decimals = meta?.decimals ?? DEFAULT_DECIMALS;

                current.message_subscription = api.onMessage().subscribe((message: any) => {
                    const data = message?.data ?? message;
                    if (data?.msg_type !== 'tick' || data?.tick?.symbol !== symbol) return;
                    const live = streams.get(symbol);
                    if (!live) return;
                    if (typeof data.tick.id === 'string') live.subscription_id = data.tick.id;

                    const quote = Number(data.tick.quote);
                    if (!Number.isFinite(quote)) return;
                    const decimals = live.decimals;
                    const digit = parseInt(quote.toFixed(decimals).slice(-1), 10);

                    const payload: TLiveTick = {
                        symbol,
                        quote,
                        digit: Number.isFinite(digit) ? digit : 0,
                        epoch: Number(data.tick.epoch) || 0,
                        decimals,
                    };
                    live.listeners.forEach(cb => {
                        try {
                            cb(payload);
                        } catch {
                            /* a bad listener must not kill the stream */
                        }
                    });
                });

                let response: any;
                try {
                    // The Options API streams ticks through a subscribed ticks_history,
                    // exactly as the bot's ticks service does; updates arrive as `tick`.
                    response = await api.send({
                        ticks_history: symbol,
                        count: 1,
                        end: 'latest',
                        style: 'ticks',
                        subscribe: 1,
                    });
                } catch (error: any) {
                    response = error?.error ? error : { error: { message: error?.message } };
                }

                if (response?.error) {
                    // Something else on this socket already streams the symbol
                    // (the bot, or another scanner view). The onMessage listener
                    // still receives those ticks, so keep the stream alive and
                    // leave the subscription for its owner to forget.
                    if (response.error.code !== 'AlreadySubscribed') {
                        throw new DerivDataError(
                            response.error.message ?? 'Tick subscription failed',
                            response.error.code
                        );
                    }
                    return;
                }

                const live = streams.get(symbol);
                if (live && typeof response?.subscription?.id === 'string') {
                    live.subscription_id = response.subscription.id;
                }
            } catch (error) {
                teardownStream(symbol);
                onError?.(error instanceof Error ? error : new Error('Tick subscription failed'));
            }
        })();
    }

    stream.listeners.add(listener);

    return () => {
        const current = streams.get(symbol);
        if (!current) return;
        current.listeners.delete(listener);
        if (current.listeners.size === 0) teardownStream(symbol);
    };
};

/** Drop every cache so the next read goes back to Deriv. */
export const resetMarketDataCaches = () => {
    symbols_cache = null;
    symbols_promise = null;
    contract_types_cache.clear();
    contract_types_inflight.clear();
    Array.from(streams.keys()).forEach(teardownStream);
};
