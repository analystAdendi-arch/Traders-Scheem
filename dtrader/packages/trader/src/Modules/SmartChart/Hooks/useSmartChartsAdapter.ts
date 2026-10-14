import React from 'react';
import { toJS } from 'mobx';

import {
    createSmartChartsChampionAdapter,
    TGetQuotes,
    TGranularity,
    TSubscribeQuotes,
    TUnsubscribeQuotes,
} from '../Adapters';
import { enrichActiveSymbols } from '../Adapters/transformers';

interface AccumulatorBarriersData {
    current_spot?: number;
    current_spot_time?: number;
    tick_update_timestamp?: number;
    accumulators_high_barrier?: string;
    accumulators_low_barrier?: string;
    barrier_spot_distance?: string;
    previous_spot_time?: number;
    underlying?: string;
}

interface TickData {
    pip_size: number;
    quote: number;
}

// Using any[] for activeSymbols to avoid complex type conflicts with different symbol formats
// This is acceptable as the symbols are processed by the adapter which handles type validation
interface UseSmartChartsAdapterConfig {
    debug?: boolean;
    activeSymbols?: any[];
    granularity?: number;
    is_accumulator?: boolean;
    updateAccumulatorBarriersData?: (data: AccumulatorBarriersData) => void;
    setTickData?: (data: TickData) => void;
    current_language?: string;
    minStartEpoch?: number; // If tick data doesn't cover this epoch, switch to candles
}

interface ChartData {
    activeSymbols: any[];
    tradingTimes?: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
}

interface UseSmartChartsAdapterReturn {
    smartChartsAdapter: ReturnType<typeof createSmartChartsChampionAdapter>;
    chartData: ChartData;
    isLoading: boolean;
    error: Error | null;
    getQuotes: TGetQuotes;
    subscribeQuotes: TSubscribeQuotes;
    unsubscribeQuotes: TUnsubscribeQuotes;
    retryFetchChartData: () => Promise<void>;
    isValidGranularity: (g: number) => g is TGranularity;
    shouldUseCandlesOverride: boolean; // True when tick data doesn't cover minStartEpoch
}

/**
 * Custom hook to manage SmartCharts Champion Adapter logic
 * Centralizes the common functionality used across all chart components
 */
export const useSmartChartsAdapter = (config: UseSmartChartsAdapterConfig = {}): UseSmartChartsAdapterReturn => {
    const {
        debug = false,
        activeSymbols,
        granularity,
        is_accumulator,
        updateAccumulatorBarriersData,
        setTickData,
        current_language,
        minStartEpoch,
    } = config;

    // Store raw data for re-enrichment on language change
    const rawDataRef = React.useRef<{
        rawActiveSymbols: any[];
        rawTradingTimes: any;
    }>({
        rawActiveSymbols: [],
        rawTradingTimes: {},
    });

    // Initialize SmartCharts Champion Adapter
    const smartChartsAdapter = React.useMemo(() => {
        return createSmartChartsChampionAdapter({
            debug,
        });
    }, [debug]);

    // Chart data state
    const [chartData, setChartData] = React.useState<ChartData>({
        activeSymbols: activeSymbols ? toJS(activeSymbols) : [],
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);
    const [shouldUseCandlesOverride, setShouldUseCandlesOverride] = React.useState(false);

    // Type guard for granularity validation
    const isValidGranularity = React.useCallback((g: number): g is TGranularity => {
        return [0, 60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400].includes(g);
    }, []);

    // Fetch chart data including trading times
    const fetchChartData = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await smartChartsAdapter.getChartData();
            const { rawData, activeSymbols, tradingTimes } = data;
            rawDataRef.current = {
                rawActiveSymbols: rawData.activeSymbols,
                rawTradingTimes: rawData.tradingTimes,
            };

            setChartData({
                activeSymbols,
                tradingTimes,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error fetching chart data:', error);
            setError(error instanceof Error ? error : new Error('Failed to fetch chart data'));
        } finally {
            setIsLoading(false);
        }
    }, [smartChartsAdapter]);

    // Retry function for error recovery
    const retryFetchChartData = React.useCallback(async () => {
        await fetchChartData();
    }, [fetchChartData]);

    // Initialize chart data on mount and re-enrich when language changes
    const hasFetchedRef = React.useRef(false);
    const previousLanguageRef = React.useRef(current_language);
    const languageChangeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        // First time: fetch data
        if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchChartData();
            return;
        }

        // Language changed: re-enrich existing data after 2 second delay
        if (previousLanguageRef.current !== current_language) {
            previousLanguageRef.current = current_language;

            // Clear any existing timeout
            if (languageChangeTimeoutRef.current) {
                clearTimeout(languageChangeTimeoutRef.current);
            }

            // Add 2 second delay before re-enriching
            languageChangeTimeoutRef.current = setTimeout(() => {
                // Re-enrich the raw active symbols with updated language
                const { rawActiveSymbols, rawTradingTimes } = rawDataRef.current;
                const enrichedSymbols = enrichActiveSymbols(rawActiveSymbols, rawTradingTimes);

                setChartData(prev => ({
                    ...prev,
                    activeSymbols: enrichedSymbols,
                }));
            }, 2000);
        }

        // Cleanup timeout on unmount
        return () => {
            if (languageChangeTimeoutRef.current) {
                clearTimeout(languageChangeTimeoutRef.current);
            }
        };
    }, [fetchChartData, current_language]);

    // Memoized getQuotes function
    const getQuotes = React.useCallback<TGetQuotes>(
        async params => {
            if (!smartChartsAdapter) {
                throw new Error('Adapter not initialized');
            }

            // Validate granularity with type guard
            let validatedGranularity = isValidGranularity(params.granularity) ? params.granularity : 0;

            let result = await smartChartsAdapter.getQuotes({
                symbol: params.symbol,
                granularity: validatedGranularity,
                count: params.count,
                start: params.start,
                end: params.end,
            });

            // If requesting ticks and minStartEpoch is set, check if data covers it
            // If not, re-fetch with candles instead
            if (minStartEpoch && validatedGranularity === 0 && result.quotes.length > 0) {
                const earliestTimestamp = parseInt(result.quotes[0].Date);

                if (earliestTimestamp > minStartEpoch) {
                    // Tick data doesn't cover minStartEpoch, switch to candles (2-minute granularity)
                    validatedGranularity = 60;
                    setShouldUseCandlesOverride(true);
                    result = await smartChartsAdapter.getQuotes({
                        symbol: params.symbol,
                        granularity: validatedGranularity,
                        count: params.count,
                        start: params.start,
                        end: params.end,
                    });
                }
            }

            // Transform adapter result to SmartCharts Champion format
            if (validatedGranularity === 0) {
                // For ticks, return history format
                return {
                    history: {
                        prices: result.quotes.map(q => q.Close),
                        times: result.quotes.map(q => parseInt(q.Date)),
                    },
                };
            }
            // For candles, return candles format
            return {
                candles: result.quotes.map(q => ({
                    open: q.Open || q.Close,
                    high: q.High || q.Close,
                    low: q.Low || q.Close,
                    close: q.Close,
                    epoch: parseInt(q.Date),
                })),
            };
        },
        [smartChartsAdapter, isValidGranularity, minStartEpoch]
    );

    // Use refs to avoid stale closure issues in subscription callbacks
    const granularityRef = React.useRef(granularity);
    const isAccumulatorRef = React.useRef(is_accumulator);
    const updateAccumulatorBarriersDataRef = React.useRef(updateAccumulatorBarriersData);
    const setTickDataRef = React.useRef(setTickData);

    // Update refs when values change
    React.useEffect(() => {
        granularityRef.current = granularity;
        isAccumulatorRef.current = is_accumulator;
        updateAccumulatorBarriersDataRef.current = updateAccumulatorBarriersData;
        setTickDataRef.current = setTickData;
    }, [granularity, is_accumulator, updateAccumulatorBarriersData, setTickData]);

    // Memoized subscribeQuotes function
    const subscribeQuotes = React.useCallback<TSubscribeQuotes>(
        (params, callback) => {
            if (!smartChartsAdapter) {
                return () => {};
            }

            const passthrough_callback = (...args: [any]) => {
                callback(...args);

                // Handle tick data for non-tick granularities
                if ('ohlc' in args[0] && granularityRef.current !== 0 && setTickDataRef.current) {
                    const { close, pip_size } = args[0].ohlc as { close: string; pip_size: number };
                    if (close && pip_size) setTickDataRef.current({ pip_size, quote: Number(close) });
                }

                // Handle accumulator barriers data
                if (isAccumulatorRef.current && updateAccumulatorBarriersDataRef.current) {
                    let current_spot_data: AccumulatorBarriersData = {};

                    if ('tick' in args[0]) {
                        const { epoch, quote, symbol } = args[0].tick as any;
                        current_spot_data = {
                            current_spot: quote,
                            current_spot_time: epoch,
                            underlying: symbol,
                        };
                    } else if ('history' in args[0]) {
                        const { prices, times } = args[0].history as any;
                        const symbol = args[0].echo_req?.ticks_history;
                        current_spot_data = {
                            current_spot: prices?.[prices?.length - 1],
                            current_spot_time: times?.[times?.length - 1],
                            previous_spot_time: times?.[times?.length - 2],
                            underlying: symbol,
                        };
                    } else {
                        return;
                    }

                    updateAccumulatorBarriersDataRef.current(current_spot_data);
                }
            };

            // Validate granularity with type guard
            const validatedGranularity = isValidGranularity(params.granularity) ? params.granularity : 0;

            return smartChartsAdapter.subscribeQuotes(
                {
                    symbol: params.symbol,
                    granularity: validatedGranularity,
                },
                quote => {
                    passthrough_callback(quote);
                }
            );
        },
        [smartChartsAdapter, isValidGranularity]
    );

    // Memoized unsubscribeQuotes function
    const unsubscribeQuotes = React.useCallback<TUnsubscribeQuotes>(
        request => {
            if (smartChartsAdapter) {
                // If we have request details, use the adapter's unsubscribe method
                if (request?.symbol && typeof request.granularity !== 'undefined') {
                    // Validate granularity with type guard
                    const validatedGranularity = isValidGranularity(request.granularity) ? request.granularity : 0;
                    smartChartsAdapter.unsubscribeQuotes({
                        symbol: request.symbol,
                        granularity: validatedGranularity,
                    });
                } else {
                    // Fallback: unsubscribe all via transport
                    smartChartsAdapter.transport.unsubscribeAll('ticks');
                }
            }
        },
        [smartChartsAdapter, isValidGranularity]
    );

    // Cleanup effect to prevent memory leaks from subscriptions
    React.useEffect(() => {
        return () => {
            // Cleanup all subscriptions on unmount or when adapter changes
            if (smartChartsAdapter?.transport) {
                smartChartsAdapter.transport.unsubscribeAll('ticks');
            }
        };
    }, [smartChartsAdapter]);

    return {
        smartChartsAdapter,
        chartData,
        isLoading,
        error,
        getQuotes,
        subscribeQuotes,
        unsubscribeQuotes,
        retryFetchChartData,
        isValidGranularity,
        shouldUseCandlesOverride,
    };
};

export default useSmartChartsAdapter;
