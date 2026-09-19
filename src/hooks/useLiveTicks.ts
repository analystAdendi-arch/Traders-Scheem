import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchTickHistory, subscribeToTicks, TLiveTick } from '@/utils/analysis';

export type TLiveTicksState = {
    /** Oldest first, capped at the requested window. */
    quotes: number[];
    /** Oldest first, aligned with `quotes`. */
    digits: number[];
    decimals: number;
    last_quote: number | null;
    last_digit: number | null;
    /** Direction of the newest tick against the one before it. */
    last_direction: 'up' | 'down' | 'flat' | null;
    is_loading: boolean;
    is_streaming: boolean;
    error: string | null;
    /** Epoch of the newest tick. */
    updated_at: number | null;
};

const EMPTY: TLiveTicksState = {
    quotes: [],
    digits: [],
    decimals: 2,
    last_quote: null,
    last_digit: null,
    last_direction: null,
    is_loading: true,
    is_streaming: false,
    error: null,
    updated_at: null,
};

/**
 * A rolling window of Deriv ticks for one symbol: `ticks_history` for the
 * window, then the live `ticks` stream appended on top.
 */
export const useLiveTicks = (symbol: string | null, ticks: number) => {
    const [state, setState] = useState<TLiveTicksState>(EMPTY);
    const [reload_token, setReloadToken] = useState(0);
    const window_ref = useRef(ticks);
    window_ref.current = ticks;

    const refresh = useCallback(() => setReloadToken(token => token + 1), []);

    useEffect(() => {
        if (!symbol) {
            setState({ ...EMPTY, is_loading: false });
            return;
        }

        let cancelled = false;
        let unsubscribe: (() => void) | null = null;
        setState(prev => ({ ...prev, is_loading: true, error: null }));

        (async () => {
            try {
                const history = await fetchTickHistory(symbol, ticks);
                if (cancelled) return;

                const quotes = history.quotes.slice(-ticks);
                const digits = history.digits.slice(-ticks);
                const previous = quotes.length > 1 ? quotes[quotes.length - 2] : null;
                const latest = quotes.length ? quotes[quotes.length - 1] : null;

                setState({
                    quotes,
                    digits,
                    decimals: history.decimals,
                    last_quote: latest,
                    last_digit: digits.length ? digits[digits.length - 1] : null,
                    last_direction:
                        latest === null || previous === null
                            ? null
                            : latest > previous
                              ? 'up'
                              : latest < previous
                                ? 'down'
                                : 'flat',
                    is_loading: false,
                    is_streaming: false,
                    error: null,
                    updated_at: history.epochs.length ? history.epochs[history.epochs.length - 1] : null,
                });

                unsubscribe = subscribeToTicks(
                    symbol,
                    (tick: TLiveTick) => {
                        if (cancelled) return;
                        setState(prev => {
                            const limit = Math.max(10, window_ref.current);
                            const next_quotes = [...prev.quotes, tick.quote].slice(-limit);
                            const next_digits = [...prev.digits, tick.digit].slice(-limit);
                            const prev_quote = prev.last_quote;
                            return {
                                ...prev,
                                quotes: next_quotes,
                                digits: next_digits,
                                decimals: tick.decimals,
                                last_quote: tick.quote,
                                last_digit: tick.digit,
                                last_direction:
                                    prev_quote === null
                                        ? null
                                        : tick.quote > prev_quote
                                          ? 'up'
                                          : tick.quote < prev_quote
                                            ? 'down'
                                            : 'flat',
                                is_streaming: true,
                                error: null,
                                updated_at: tick.epoch,
                            };
                        });
                    },
                    error => {
                        if (cancelled) return;
                        setState(prev => ({ ...prev, is_streaming: false, error: error.message }));
                    }
                );
            } catch (error) {
                if (cancelled) return;
                setState(prev => ({
                    ...prev,
                    is_loading: false,
                    is_streaming: false,
                    error: error instanceof Error ? error.message : 'Could not load ticks from Deriv.',
                }));
            }
        })();

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, [symbol, ticks, reload_token]);

    return { ...state, refresh };
};

export default useLiveTicks;
