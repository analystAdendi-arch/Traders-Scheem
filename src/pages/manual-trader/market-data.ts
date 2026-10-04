/**
 * Cached market data for the trader: the market list, what each market offers
 * (contracts_for) and the five-minute price history behind the picker's sparklines.
 * Requests are queued a few at a time so opening the picker never floods the socket.
 */
import { send } from './deriv-stream';
import { TMarket, toMarket } from './trade-types';

const MAX_PARALLEL = 3;
let running = 0;
const queue: (() => void)[] = [];

const limited = <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const run = () => {
            running++;
            task()
                .then(resolve, reject)
                .finally(() => {
                    running--;
                    queue.shift()?.();
                });
        };
        if (running < MAX_PARALLEL) run();
        else queue.push(run);
    });

/* ---------------------------------------------------------------- markets */

let markets_promise: Promise<TMarket[]> | null = null;

export const loadMarkets = (): Promise<TMarket[]> => {
    if (!markets_promise) {
        markets_promise = send({ active_symbols: 'brief' })
            .then(response => (response.active_symbols || []).map(toMarket).filter((m: TMarket) => m.symbol))
            .catch(error => {
                markets_promise = null;
                throw error;
            });
    }
    return markets_promise;
};

/* ---------------------------------------------------------- contracts_for */

export type TOffer = {
    types: Set<string>;
    /** Raw contracts_for rows, for ranges and choices (multipliers, growth rates, barriers). */
    rows: any[];
};

const offers = new Map<string, Promise<TOffer>>();

export const loadOffer = (symbol: string): Promise<TOffer> => {
    let pending = offers.get(symbol);
    if (!pending) {
        pending = limited(() => send({ contracts_for: symbol })).then(response => {
            const rows = response?.contracts_for?.available || [];
            return { rows, types: new Set<string>(rows.map((r: any) => r.contract_type)) };
        });
        pending.catch(() => offers.delete(symbol));
        offers.set(symbol, pending);
    }
    return pending;
};

/** Which family a contracts_for row belongs to: ticks, intraday (s/m/h) or daily. */
const familyOf = (min_duration: unknown) => {
    const text = String(min_duration);
    if (text.endsWith('t')) return 't';
    if (text.endsWith('d')) return 'd';
    return 'i';
};

/**
 * The contracts_for row of a type for the chosen duration unit. A type has one row
 * per family, each with its own limits and default barrier - relative (+1.23) for
 * ticks and intraday, an absolute price for daily - so the family must match.
 */
export const offerRow = (offer: TOffer | null, contract_type: string, unit?: string) => {
    if (!offer) return null;
    const rows = offer.rows.filter(r => r.contract_type === contract_type);
    if (unit) {
        const want = unit === 't' ? 't' : unit === 'd' ? 'd' : 'i';
        const match = rows.find(r => familyOf(r.min_contract_duration) === want);
        if (match) return match;
    }
    return rows[0] ?? null;
};

/* -------------------------------------------------------------- sparklines */

export type TSpark = { prices: number[]; change: number };

const sparks = new Map<string, { at: number; promise: Promise<TSpark> }>();
const SPARK_TTL = 60_000;

/** Prices over the last five minutes and the percentage change across them. */
export const loadSpark = (symbol: string): Promise<TSpark> => {
    const cached = sparks.get(symbol);
    if (cached && Date.now() - cached.at < SPARK_TTL) return cached.promise;

    const now = Math.floor(Date.now() / 1000);
    const promise = limited(() =>
        send({ ticks_history: symbol, start: now - 300, end: 'latest', style: 'ticks', count: 300 })
    ).then(response => {
        const prices: number[] = (response?.history?.prices || []).map(Number);
        const first = prices[0];
        const last = prices[prices.length - 1];
        return { prices, change: first ? ((last - first) / first) * 100 : 0 };
    });
    promise.catch(() => sparks.delete(symbol));
    sparks.set(symbol, { at: Date.now(), promise });
    return promise;
};

/* --------------------------------------------------------------- favourites */

const FAV_KEY = 'ts-trader-favourites';

export const readFavourites = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    } catch {
        return [];
    }
};

export const writeFavourites = (list: string[]) => {
    try {
        localStorage.setItem(FAV_KEY, JSON.stringify(list));
    } catch {
        /* private mode: favourites last for the visit only */
    }
};
