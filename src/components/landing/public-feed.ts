/**
 * Logged-out live data for the splash screen and front page, straight from
 * Deriv's public Options WebSocket (no login needed): the number of tradable
 * markets and a few streaming Volatility index prices for the ticker.
 */
import { DerivSocket } from '@/services/deriv-socket';

import brandConfig from '../../../brand.config.json';

export const TICKER_SYMBOLS = [
    { symbol: 'RDBULL', label: 'BULL MARKET' },
    { symbol: 'RDBEAR', label: 'BEAR MARKET' },
    { symbol: 'R_10', label: 'VOL 10' },
    { symbol: 'R_25', label: 'VOL 25' },
    { symbol: 'R_50', label: 'VOL 50' },
    { symbol: 'R_75', label: 'VOL 75' },
    { symbol: 'R_100', label: 'VOL 100' },
    { symbol: '1HZ10V', label: 'VOL 10 (1S)' },
    { symbol: '1HZ100V', label: 'VOL 100 (1S)' },
] as const;

export type TTickerQuote = { quote: number; prev: number; first: number; decimals: number };

export type TFeedState = {
    connected: boolean;
    markets: number | null;
    quotes: Record<string, TTickerQuote>;
};

const publicWsUrl = () => {
    const env = process.env.NEXT_PUBLIC_DERIV_ENV === 'staging' ? 'staging' : 'production';
    return `${brandConfig.platform.derivws.url[env].replace(/^http/, 'ws')}options/ws/public`;
};

let state: TFeedState = { connected: false, markets: null, quotes: {} };
const listeners = new Set<(next: TFeedState) => void>();
let socket: DerivSocket | null = null;
let starting = false;
let stop_timer: ReturnType<typeof setTimeout> | null = null;

const emit = (patch: Partial<TFeedState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener(state));
};

const decimalsOf = (quote: number, pip_size?: number) => {
    if (Number.isFinite(pip_size)) return Number(pip_size);
    const text = String(quote);
    return text.includes('.') ? text.split('.')[1].length : 2;
};

const start = async () => {
    if (socket || starting) return;
    starting = true;
    try {
        socket = await DerivSocket.open(publicWsUrl());
        emit({ connected: true });

        socket.onMessage(message => {
            if (message?.msg_type !== 'tick' || !message.tick) return;
            const { symbol, quote, pip_size } = message.tick;
            const value = Number(quote);
            if (!Number.isFinite(value)) return;
            const previous = state.quotes[symbol];
            emit({
                quotes: {
                    ...state.quotes,
                    [symbol]: {
                        quote: value,
                        prev: previous?.quote ?? value,
                        first: previous?.first ?? value,
                        decimals: decimalsOf(value, pip_size),
                    },
                },
            });
        });

        socket
            .send({ active_symbols: 'brief' })
            .then(response => emit({ markets: response?.active_symbols?.length ?? null }))
            .catch(() => undefined);

        TICKER_SYMBOLS.forEach(({ symbol }) => {
            socket?.send({ ticks: symbol, subscribe: 1 }).catch(() => undefined);
        });
    } catch {
        socket = null;
        emit({ connected: false });
    } finally {
        starting = false;
    }
};

const stop = () => {
    socket?.close();
    socket = null;
    state = { connected: false, markets: state.markets, quotes: {} };
};

/** Subscribe to the public feed; the socket closes shortly after the last listener leaves. */
export const subscribePublicFeed = (listener: (next: TFeedState) => void) => {
    if (stop_timer) {
        clearTimeout(stop_timer);
        stop_timer = null;
    }
    listeners.add(listener);
    listener(state);
    void start();
    return () => {
        listeners.delete(listener);
        if (!listeners.size) stop_timer = setTimeout(stop, 5000);
    };
};
