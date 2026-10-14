import { TActiveSymbolsResponse } from '@deriv/api';

type ActiveSymbols = NonNullable<TActiveSymbolsResponse['active_symbols']>;

/**
 * Orders markets with synthetic_index first if it exists, then alphabetically by underlying_symbol
 * @param active_symbols - Array of active symbols from the API
 * @returns Array of market names in the desired order
 */
export const getMarketsOrder = (active_symbols: ActiveSymbols): string[] => {
    const synthetic_index = 'synthetic_index';
    const has_synthetic_index = active_symbols.some(s => s.market === synthetic_index);

    return active_symbols
        .slice()
        .sort((a, b) => ((a.underlying_symbol || '') < (b.underlying_symbol || '') ? -1 : 1))
        .map(s => s.market)
        .reduce(
            (arr: string[], market: string) => {
                if (arr.indexOf(market) === -1) arr.push(market);
                return arr;
            },
            has_synthetic_index ? [synthetic_index] : []
        );
};

// Chart configuration constants
export const CHART_CONSTANTS = {
    // Timeout values
    WEBSOCKET_TIMEOUT: 30000, // 30 seconds

    // Chart spacing
    ACCUMULATOR_WHITESPACE: 190,
    BARRIER_WHITESPACE: 110,

    // Max ticks for mobile
    MAX_TICKS_MOBILE_TICK: 8,
    MAX_TICKS_MOBILE_CANDLE: 24,

    // Auto-remove timeout for closed positions
    CLOSED_POSITION_REMOVE_TIMEOUT: 8000, // 8 seconds

    // Chart margins
    LEFT_MARGIN_WITH_DRAWER: 328,
    LEFT_MARGIN_DEFAULT: 80,

    // Mobile chart positioning
    MOBILE_DRAWING_TOOL_POSITION: { x: 100, y: 100 },
    DESKTOP_DRAWING_TOOL_POSITION: { x: 400, y: 200 },

    // Y-axis margins
    Y_AXIS_MARGIN_MOBILE: 76,
    Y_AXIS_MARGIN_DESKTOP: 106,

    // Minimum left bars for accumulator on mobile
    ACCUMULATOR_MIN_LEFT_BARS_MOBILE: 3,
} as const;
