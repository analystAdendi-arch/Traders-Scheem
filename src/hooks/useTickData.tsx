import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';

export type TTickData = {
    quoteStr: string;
    quote: number;
    epoch: number;
    digit: number;
    pipSize: number;
};

export type TActiveSymbol = {
    symbol: string;
    display_name: string;
    pip_size?: number;
    market?: string;
    submarket?: string;
};

export type TPercentPair = {
    a: number;
    b: number;
};

export type TCircleDatum = {
    digit: number;
    count: number;
    percentage: number;
    color: string;
};

const DEFAULT_SYMBOL = '1HZ100V';
const DEFAULT_TICK_LIMIT = 1000;
const HEARTBEAT_INTERVAL_MS = 5000;
const STALL_THRESHOLD_MS = 12000;

type TTickDataContextValue = {
    availableSymbols: TActiveSymbol[];
    selectedSymbol: string;
    setSelectedSymbol: (s: string) => void;
    tickLimit: number;
    setTickLimit: (n: number) => void;
    ticksBuffer: TTickData[];
    latestTick: TTickData | null;
    currentPipSize: number;
    lastHitNumber: number | null;
    circleData: TCircleDatum[];
    isConnected: boolean;
    isLoadingTicks: boolean;
    connectionError: string | null;
    getLastDigit: (quoteValue: string | number, pipSize: number) => number;
    adjustPercentagePair: (rawA: number, rawB: number) => TPercentPair;
    computeEvenOdd: (ticks?: TTickData[]) => TPercentPair;
    computeOverUnder: (predictionDigit: number, ticks?: TTickData[]) => TPercentPair;
    computeMatchDiffer: (predictionDigit: number, ticks?: TTickData[]) => TPercentPair;
};

const TickDataContext = createContext<TTickDataContextValue | null>(null);

const derivePipSizeForSymbol = (symbol: string, enrichedSymbols: TActiveSymbol[]): number | undefined => {
    const s = enrichedSymbols.find(x => x.symbol === symbol);
    if (s && typeof s.pip_size === 'number' && Number.isFinite(s.pip_size)) return s.pip_size;
    const pipSizes: Record<string, number> | undefined =
        api_base.pip_sizes && typeof api_base.pip_sizes === 'object'
            ? (api_base.pip_sizes as Record<string, number>)
            : undefined;
    if (pipSizes && symbol in pipSizes && Number.isFinite(pipSizes[symbol])) return pipSizes[symbol];
    return undefined;
};

const formatPriceToFixed = (rawQuote: string | number, decimalPlaces: number): string => {
    const q = Number(rawQuote);
    const safePlaces = Number.isFinite(decimalPlaces) && decimalPlaces >= 0 ? decimalPlaces : 0;
    if (!Number.isFinite(q)) return Number(0).toFixed(safePlaces);
    return q.toFixed(safePlaces);
};

const extractLastDigit = (formattedPrice: string): number => {
    if (!formattedPrice || formattedPrice.length === 0) return 0;
    const ch = formattedPrice.slice(-1);
    const d = parseInt(ch, 10);
    return Number.isFinite(d) ? d : 0;
};

const waitForApiReady = (maxAttempts = 60, intervalMs = 250): Promise<void> => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            attempts++;
            if (api_base.api && api_base.api.connection && api_base.api.connection.readyState === 1) {
                resolve();
                return;
            }
            if (attempts >= maxAttempts) {
                reject(new Error('Timeout waiting for API connection'));
                return;
            }
            setTimeout(check, intervalMs);
        };
        check();
    });
};

const waitForActiveSymbols = (maxAttempts = 40, intervalMs = 300): Promise<void> => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            attempts++;
            if (api_base.has_active_symbols && Array.isArray(api_base.active_symbols) && api_base.active_symbols.length > 0) {
                resolve();
                return;
            }
            if (attempts >= maxAttempts) {
                reject(new Error('Timeout waiting for active symbols'));
                return;
            }
            setTimeout(check, intervalMs);
        };
        check();
    });
};

const buildCircleDataSpec = (ticks: TTickData[]): TCircleDatum[] => {
    const totalLoadedTicks = ticks.length;
    const digitCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let i = 0; i < totalLoadedTicks; i++) {
        const d = ticks[i].digit;
        if (d >= 0 && d <= 9) digitCount[d] += 1;
    }

    const percentagesOneDecimal: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (totalLoadedTicks > 0) {
        for (let d = 0; d <= 9; d++) {
            const raw = (digitCount[d] / totalLoadedTicks) * 100;
            percentagesOneDecimal[d] = parseFloat(raw.toFixed(1));
        }
    }

    let sum = 0;
    for (let d = 0; d <= 9; d++) sum += percentagesOneDecimal[d];
    const diff = parseFloat((100 - sum).toFixed(1));
    if (Math.abs(diff) >= 0.05 && totalLoadedTicks > 0) {
        const steps = Math.round(Math.abs(diff) * 10);
        const delta = diff > 0 ? 0.1 : -0.1;
        const sortedDigitsDesc = Object.entries(digitCount)
            .map(([k, v]) => ({ digit: parseInt(k, 10), count: v }))
            .sort((a, b) => b.count - a.count);
        for (let i = 0; i < steps && i < sortedDigitsDesc.length; i++) {
            const digit = sortedDigitsDesc[i].digit;
            percentagesOneDecimal[digit] = parseFloat((percentagesOneDecimal[digit] + delta).toFixed(1));
        }
    }

    const lastOcc = new Array<number>(10).fill(-1);
    for (let i = totalLoadedTicks - 1; i >= 0; i--) {
        const d = ticks[i].digit;
        if (d >= 0 && d <= 9 && lastOcc[d] === -1) lastOcc[d] = i;
    }

    const ranked = Object.entries(digitCount)
        .map(([digitStr, count]) => {
            const digit = parseInt(digitStr, 10);
            return { digit, count, last: lastOcc[digit] };
        })
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return b.last - a.last;
        });

    const colors: Record<number, string> = {};
    ranked.forEach((r, idx) => {
        if (idx === 0) colors[r.digit] = 'green';
        else if (idx === 1) colors[r.digit] = 'blue';
        else if (idx === 2) colors[r.digit] = 'orange';
        else if (idx === ranked.length - 1) colors[r.digit] = 'red';
        else colors[r.digit] = 'white';
    });

    const data: TCircleDatum[] = [];
    for (let d = 0; d <= 9; d++) {
        data.push({
            digit: d,
            count: digitCount[d],
            percentage: percentagesOneDecimal[d],
            color: colors[d],
        });
    }
    return data;
};

export const TickDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [availableSymbols, setAvailableSymbols] = useState<TActiveSymbol[]>([]);
    const [selectedSymbol, setSelectedSymbolState] = useState<string>(DEFAULT_SYMBOL);
    const [tickLimit, setTickLimitState] = useState<number>(DEFAULT_TICK_LIMIT);
    const [ticksBuffer, setTicksBuffer] = useState<TTickData[]>([]);
    const [latestTick, setLatestTick] = useState<TTickData | null>(null);
    const [lastHitNumber, setLastHitNumber] = useState<number | null>(null);
    const [currentPipSize, setCurrentPipSize] = useState<number>(2);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoadingTicks, setIsLoadingTicks] = useState<boolean>(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const selectedSymbolRef = useRef<string>(selectedSymbol);
    const tickLimitRef = useRef<number>(tickLimit);
    const pipSizeRef = useRef<number>(currentPipSize);
    const isMountedRef = useRef(true);
    const onMessageSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const initSymbolsRef = useRef(false);
    const symbolChangeNonceRef = useRef(0);
    const lastTickEpochRef = useRef<number>(0);
    const connectionStatusRef = useRef(false);
    const availableSymbolsRef = useRef<TActiveSymbol[]>([]);
    const liveTickingForSymbolRef = useRef<string | null>(null);
    const tickSubscriptionIdRef = useRef<string | null>(null);

    /**
     * Forget only this provider's tick stream. `forget_all: ['ticks']` would also
     * cancel the running bot's feed and every other stream on the shared socket.
     */
    const forgetOwnTickStream = useCallback(async () => {
        const id = tickSubscriptionIdRef.current;
        tickSubscriptionIdRef.current = null;
        if (!id || !api_base.api) return;
        try {
            await (api_base.api as any).forget(id);
        } catch (_) {
            /* already gone */
        }
    }, []);

    useEffect(() => {
        selectedSymbolRef.current = selectedSymbol;
    }, [selectedSymbol]);

    useEffect(() => {
        tickLimitRef.current = Number.isFinite(tickLimit) && tickLimit > 0 ? tickLimit : DEFAULT_TICK_LIMIT;
    }, [tickLimit]);

    useEffect(() => {
        pipSizeRef.current = currentPipSize;
    }, [currentPipSize]);

    useEffect(() => {
        availableSymbolsRef.current = availableSymbols;
    }, [availableSymbols]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const getLastDigit = useCallback((quoteValue: string | number, pipSize: number): number => {
        const formatted = formatPriceToFixed(quoteValue, pipSize);
        return extractLastDigit(formatted);
    }, []);

    const adjustPercentagePair = useCallback((rawA: number, rawB: number): TPercentPair => {
        const validA = Number.isFinite(rawA) ? rawA : 50.0;
        const validB = Number.isFinite(rawB) ? rawB : 50.0;
        const a = parseFloat(validA.toFixed(1));
        const b = parseFloat(validB.toFixed(1));
        const diff = parseFloat((100 - (a + b)).toFixed(1));
        if (Math.abs(diff) < 0.05) return { a, b };
        if (diff > 0) return { a: parseFloat((a + diff).toFixed(1)), b };
        return { a, b: parseFloat((b + Math.abs(diff)).toFixed(1)) };
    }, []);

    const setTickLimit = useCallback((n: number) => {
        const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_TICK_LIMIT;
        tickLimitRef.current = safe;
        setTickLimitState(safe);
        setTicksBuffer(prev => {
            if (prev.length <= safe) return prev;
            return prev.slice(prev.length - safe);
        });
    }, []);

    const setSelectedSymbol = useCallback((s: string) => {
        if (!s || s === selectedSymbolRef.current) return;
        symbolChangeNonceRef.current += 1;
        liveTickingForSymbolRef.current = null;
        lastTickEpochRef.current = 0;
        selectedSymbolRef.current = s;
        setSelectedSymbolState(s);
    }, []);

    const circleData = useMemo(() => buildCircleDataSpec(ticksBuffer), [ticksBuffer]);

    const computeEvenOdd = useCallback(
        (ticks?: TTickData[]): TPercentPair => {
            const buffer = ticks ?? ticksBuffer;
            const totalLoadedTicks = buffer.length;
            if (totalLoadedTicks === 0) return { a: 50.0, b: 50.0 };
            let even = 0;
            for (let i = 0; i < totalLoadedTicks; i++) if (buffer[i].digit % 2 === 0) even += 1;
            const odd = totalLoadedTicks - even;
            return adjustPercentagePair((even / totalLoadedTicks) * 100, (odd / totalLoadedTicks) * 100);
        },
        [adjustPercentagePair, ticksBuffer]
    );

    const computeOverUnder = useCallback(
        (predictionDigit: number, ticks?: TTickData[]): TPercentPair => {
            const buffer = ticks ?? ticksBuffer;
            const totalLoadedTicks = buffer.length;
            if (totalLoadedTicks === 0) return { a: 50.0, b: 50.0 };
            const p = Number.isFinite(predictionDigit) ? predictionDigit : 5;
            let over = 0;
            let under = 0;
            for (let i = 0; i < totalLoadedTicks; i++) {
                const d = buffer[i].digit;
                if (d > p) over += 1;
                else if (d < p) under += 1;
            }
            const total = over + under;
            if (total === 0) return { a: 50.0, b: 50.0 };
            return adjustPercentagePair((over / total) * 100, (under / total) * 100);
        },
        [adjustPercentagePair, ticksBuffer]
    );

    const computeMatchDiffer = useCallback(
        (predictionDigit: number, ticks?: TTickData[]): TPercentPair => {
            const buffer = ticks ?? ticksBuffer;
            const totalLoadedTicks = buffer.length;
            if (totalLoadedTicks === 0) return { a: 50.0, b: 50.0 };
            const p = Number.isFinite(predictionDigit) ? predictionDigit : 5;
            let match = 0;
            for (let i = 0; i < totalLoadedTicks; i++) if (buffer[i].digit === p) match += 1;
            const differ = totalLoadedTicks - match;
            return adjustPercentagePair((match / totalLoadedTicks) * 100, (differ / totalLoadedTicks) * 100);
        },
        [adjustPercentagePair, ticksBuffer]
    );

    useEffect(() => {
        if (initSymbolsRef.current) return;
        initSymbolsRef.current = true;
        let mounted = true;

        const init = async () => {
            try {
                try { await waitForApiReady(80, 250); } catch (_) {}
                if (!mounted) return;

                if (!api_base.has_active_symbols || !Array.isArray(api_base.active_symbols) || api_base.active_symbols.length === 0) {
                    try { await api_base.getActiveSymbols(); } catch (_) {
                        try { await waitForActiveSymbols(30, 400); } catch (_) {}
                    }
                }
                if (!mounted) return;

                const pipSizes: Record<string, number> =
                    api_base.pip_sizes && typeof api_base.pip_sizes === 'object' ? (api_base.pip_sizes as Record<string, number>) : {};
                const rawSymbols: TActiveSymbol[] = (api_base.active_symbols || []).map((s: any) => {
                    const symbol = s.underlying_symbol || s.symbol;
                    const display_name =
                        s.display_name || s.underlying_symbol_name || s.underlying_symbol || s.symbol;
                    // Options API renamed `pip` -> `pip_size`.
                    const rawPip = s.pip_size ?? s.pip;
                    const pip_size = rawPip !== undefined && Number.isFinite(Number(rawPip))
                        ? Number(rawPip)
                        : pipSizes[symbol] !== undefined && Number.isFinite(pipSizes[symbol])
                          ? pipSizes[symbol]
                          : undefined;
                    return { symbol, display_name, pip_size, market: s.market, submarket: s.submarket };
                });
                const symbols = rawSymbols.filter(s => !!s.symbol && !!s.display_name);
                if (!mounted) return;
                availableSymbolsRef.current = symbols;
                setAvailableSymbols(symbols);

                const currentSel = selectedSymbolRef.current;
                const hasCurrent = symbols.some(s => s.symbol === currentSel);
                let finalSymbol = currentSel;
                if (!hasCurrent) {
                    const digitIndexSymbols = symbols.filter(s => {
                        const name = (s.display_name || s.symbol || '').toLowerCase();
                        return name.includes('volatility') || /\d+[zv]/i.test(s.symbol);
                    });
                    finalSymbol = (digitIndexSymbols[0] || symbols[0])?.symbol || DEFAULT_SYMBOL;
                }

                const finalPip = derivePipSizeForSymbol(finalSymbol, symbols);
                if (finalPip !== undefined && Number.isFinite(finalPip)) {
                    pipSizeRef.current = finalPip;
                    if (isMountedRef.current) setCurrentPipSize(finalPip);
                }

                symbolChangeNonceRef.current += 1;
                liveTickingForSymbolRef.current = null;
                selectedSymbolRef.current = finalSymbol;
                if (isMountedRef.current) {
                    setSelectedSymbolState('');
                    queueMicrotask(() => { if (isMountedRef.current) setSelectedSymbolState(finalSymbol); });
                }
            } catch (_err: any) {
                if (!mounted) return;
                setAvailableSymbols([]);
                setConnectionError(_err?.message || 'Failed to load markets');
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const ensureOnMessage = () => {
            if (!api_base.api) return false;
            if (onMessageSubscriptionRef.current) return true;
            try {
                onMessageSubscriptionRef.current = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
                    if (!data || data?.error) return;
                    if (data.msg_type !== 'tick') return;

                    const expected = selectedSymbolRef.current;
                    const tickSym = data.tick?.symbol;
                    if (!tickSym || tickSym !== expected) return;

                    const pipFromMsg =
                        data.tick.pip_size !== undefined && Number.isFinite(data.tick.pip_size)
                            ? Number(data.tick.pip_size)
                            : pipSizeRef.current;
                    const safePip = Number.isFinite(pipFromMsg) ? pipFromMsg : 0;
                    pipSizeRef.current = safePip;
                    if (safePip !== currentPipSize && isMountedRef.current) setCurrentPipSize(safePip);

                    const quoteRaw = data.tick.quote;
                    const formattedPrice = formatPriceToFixed(quoteRaw, safePip);
                    const lastDigit = parseInt(formattedPrice.slice(-1), 10) || 0;
                    const epoch = typeof data.tick.epoch === 'number' ? data.tick.epoch : Date.now() / 1000;

                    const tick: TTickData = {
                        quoteStr: formattedPrice,
                        quote: Number(formattedPrice),
                        epoch,
                        digit: lastDigit,
                        pipSize: safePip,
                    };

                    if (!isMountedRef.current) return;
                    if (!connectionStatusRef.current) {
                        connectionStatusRef.current = true;
                        setIsConnected(true);
                    }
                    setConnectionError(null);

                    const limit = tickLimitRef.current;
                    lastTickEpochRef.current = tick.epoch > 0 ? tick.epoch : Date.now() / 1000;
                    setTicksBuffer(prev => {
                        const appended = [...prev, tick];
                        if (appended.length <= limit) return appended;
                        const overflow = appended.length - limit;
                        return appended.slice(overflow);
                    });
                    setLatestTick(tick);
                    setLastHitNumber(tick.digit);
                });
                return true;
            } catch (_) {
                onMessageSubscriptionRef.current = null;
                return false;
            }
        };
        ensureOnMessage();
        const poller = setInterval(ensureOnMessage, 1000);
        return () => {
            clearInterval(poller);
            onMessageSubscriptionRef.current?.unsubscribe();
            onMessageSubscriptionRef.current = null;
        };
    }, [currentPipSize]);

    useEffect(() => {
        const symbol = selectedSymbolRef.current;
        if (!symbol) return;
        const currentNonce = symbolChangeNonceRef.current;
        let cancelled = false;

        const run = async () => {
            try {
                if (currentNonce !== symbolChangeNonceRef.current) return;
                try { await waitForApiReady(30, 200); } catch (_) {}
                if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;

                if (!api_base.api || api_base.api.connection?.readyState !== 1) {
                    if (cancelled || !isMountedRef.current) return;
                    setConnectionError('Connecting to Deriv...');
                    connectionStatusRef.current = false;
                    setIsConnected(false);
                    return;
                }
                if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;

                await forgetOwnTickStream();
                liveTickingForSymbolRef.current = null;

                if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;

                lastTickEpochRef.current = 0;
                setTicksBuffer([]);
                setLatestTick(null);
                setLastHitNumber(null);
                setIsLoadingTicks(true);
                setConnectionError(null);
                connectionStatusRef.current = true;
                setIsConnected(true);

                const localPip = derivePipSizeForSymbol(symbol, availableSymbolsRef.current);
                if (localPip !== undefined && localPip !== pipSizeRef.current) {
                    pipSizeRef.current = localPip;
                    if (isMountedRef.current && !cancelled) setCurrentPipSize(localPip);
                }

                if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;

                const selectedTickLimit = tickLimitRef.current;

                const historyRes = await (api_base.api as any).send({
                    ticks_history: symbol,
                    count: selectedTickLimit,
                    end: 'latest',
                    style: 'ticks',
                });

                if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;
                if (!isMountedRef.current) return;
                if (historyRes?.error) {
                    setConnectionError(historyRes.error.message || 'Ticks history failed');
                    connectionStatusRef.current = false;
                    setIsConnected(false);
                    setIsLoadingTicks(false);
                    return;
                }

                const pipSize = historyRes.pip_size !== undefined && Number.isFinite(historyRes.pip_size)
                    ? Number(historyRes.pip_size)
                    : pipSizeRef.current;
                const safePip = Number.isFinite(pipSize) ? pipSize : 0;
                if (safePip !== pipSizeRef.current) {
                    pipSizeRef.current = safePip;
                    setCurrentPipSize(safePip);
                }

                const historicalTicks: TTickData[] = [];
                if (historyRes?.history?.prices && historyRes?.history?.times) {
                    const prices: (string | number)[] = historyRes.history.prices;
                    const times: number[] = historyRes.history.times;
                    const limit = selectedTickLimit;
                    const startIdx = prices.length > limit ? prices.length - limit : 0;
                    for (let i = startIdx; i < prices.length; i++) {
                        const formattedPrice = formatPriceToFixed(prices[i], safePip);
                        const lastDigit = parseInt(formattedPrice.slice(-1), 10) || 0;
                        historicalTicks.push({
                            quoteStr: formattedPrice,
                            quote: Number(formattedPrice),
                            epoch: times[i] ?? Math.floor(Date.now() / 1000 - (prices.length - i)),
                            digit: lastDigit,
                            pipSize: safePip,
                        });
                    }
                }

                setTicksBuffer(historicalTicks);
                if (historicalTicks.length > 0) {
                    const last = historicalTicks[historicalTicks.length - 1];
                    setLatestTick({ quoteStr: last.quoteStr, quote: last.quote, epoch: last.epoch, digit: last.digit, pipSize: last.pipSize });
                    setLastHitNumber(last.digit);
                    lastTickEpochRef.current = last.epoch > 0 ? last.epoch : Date.now() / 1000;
                }

                setIsLoadingTicks(false);
                connectionStatusRef.current = true;
                setIsConnected(true);
                setConnectionError(null);

                if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;

                try {
                    // Without subscribe: 1 the API returns a single tick, not a stream.
                    const subRes = await (api_base.api as any).send({ ticks: symbol, subscribe: 1 });
                    const subscriptionId = subRes?.subscription?.id ?? null;
                    if (cancelled || currentNonce !== symbolChangeNonceRef.current) {
                        if (subscriptionId) (api_base.api as any).forget(subscriptionId).catch?.(() => {});
                        return;
                    }
                    if (!subRes?.error) {
                        tickSubscriptionIdRef.current = subscriptionId;
                        liveTickingForSymbolRef.current = symbol;
                    }
                } catch (_err: any) {
                    if (cancelled || currentNonce !== symbolChangeNonceRef.current) return;
                    setConnectionError(_err?.message || 'Live tick subscription failed');
                }
            } catch (err: any) {
                if (cancelled || currentNonce !== symbolChangeNonceRef.current || !isMountedRef.current) return;
                setConnectionError(err?.message || 'Stream error');
                connectionStatusRef.current = false;
                setIsConnected(false);
                setIsLoadingTicks(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [selectedSymbol]);

    useEffect(() => {
        const nonce = symbolChangeNonceRef.current;
        if (nonce === 0) return;
        const symbol = selectedSymbolRef.current;
        if (!symbol) return;
        const limit = tickLimitRef.current;
        setTicksBuffer(prev => prev.length > limit ? prev.slice(prev.length - limit) : prev);
    }, [tickLimit]);

    useEffect(() => {
        const heartbeat = setInterval(() => {
            if (!isMountedRef.current) return;
            const ready = !!(api_base.api && api_base.api.connection?.readyState === 1);
            if (ready !== connectionStatusRef.current) {
                connectionStatusRef.current = ready;
                setIsConnected(ready);
            }
            const now = Date.now() / 1000;
            const stalled =
                lastTickEpochRef.current > 0 &&
                liveTickingForSymbolRef.current === selectedSymbolRef.current &&
                // Epochs are in seconds; the threshold is in milliseconds.
                now - lastTickEpochRef.current > STALL_THRESHOLD_MS / 1000;
            if (ready && (liveTickingForSymbolRef.current !== selectedSymbolRef.current || stalled)) {
                symbolChangeNonceRef.current += 1;
                liveTickingForSymbolRef.current = null;
                lastTickEpochRef.current = 0;
                const sym = selectedSymbolRef.current;
                queueMicrotask(() => {
                    if (!isMountedRef.current) return;
                    setSelectedSymbolState('');
                    queueMicrotask(() => { if (isMountedRef.current) setSelectedSymbolState(sym); });
                });
            }
        }, HEARTBEAT_INTERVAL_MS);
        return () => clearInterval(heartbeat);
    }, []);

    useEffect(() => {
        return () => {
            onMessageSubscriptionRef.current?.unsubscribe();
            onMessageSubscriptionRef.current = null;
            void forgetOwnTickStream();
        };
    }, [forgetOwnTickStream]);

    const value: TTickDataContextValue = {
        availableSymbols,
        selectedSymbol,
        setSelectedSymbol,
        tickLimit,
        setTickLimit,
        ticksBuffer,
        latestTick,
        currentPipSize,
        lastHitNumber,
        circleData,
        isConnected,
        isLoadingTicks,
        connectionError,
        getLastDigit,
        adjustPercentagePair,
        computeEvenOdd,
        computeOverUnder,
        computeMatchDiffer,
    };

    return <TickDataContext.Provider value={value}>{children}</TickDataContext.Provider>;
};

export const useTickData = (): TTickDataContextValue => {
    const ctx = useContext(TickDataContext);
    if (!ctx) throw new Error('useTickData must be used within a TickDataProvider');
    return ctx;
};

export const useDerivTickStream = useTickData;
export default useTickData;
