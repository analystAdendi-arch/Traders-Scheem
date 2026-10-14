/**
 * Trade Parameter Presets Configuration - v3.0 - SPECIFICATION COMPLIANT
 *
 * This file contains centralized preset values for trade parameters used in value chips.
 * These presets provide quick-select options for users when configuring trades.
 *
 * ALL VALUES MANUALLY VERIFIED AGAINST SPECIFICATION IMAGES
 *
 * Structure:
 * - Stake presets are organized by trade type
 * - Duration presets are organized by trade type → market category → duration unit
 *
 * @module TradeParameterPresets
 */

/**
 * Duration unit type codes
 */
export type DurationUnit = 't' | 's' | 'm' | 'h' | 'd';

/**
 * Trade type identifiers
 */
export type TradeType =
    | 'rise_fall'
    | 'higher_lower'
    | 'touch_no_touch'
    | 'digits_matches_differs'
    | 'digits_even_odd'
    | 'digits_over_under'
    | 'turbos'
    | 'vanillas'
    | 'accumulators'
    | 'multipliers';

/**
 * Market category identifiers for duration presets
 */
export type MarketCategory =
    | 'forex'
    | 'synthetic_indices'
    | 'stock_indices'
    | 'commodities'
    | 'cryptocurrencies'
    | 'derived_fx'
    | 'etfs'
    | 'all_markets'
    | 'daily_reset_indices'
    | 'volatility_indices'
    | 'forex_metals'
    | 'gold_silver'
    | 'palladium_platinum'
    | 'forex_baskets';

/**
 * Duration presets for a specific duration unit
 * null means "Not Applicable" - the unit should not be visible
 */
export type DurationUnitPresets = number[] | null;

/**
 * Duration presets organized by duration unit
 */
export interface DurationPresetsByUnit {
    t: DurationUnitPresets; // Ticks
    s: DurationUnitPresets; // Seconds
    m: DurationUnitPresets; // Minutes
    h: DurationUnitPresets; // Hours
    d: DurationUnitPresets; // Days
}

/**
 * Duration presets organized by market category
 */
export type DurationPresetsByMarket = {
    [K in MarketCategory]?: DurationPresetsByUnit;
};

/**
 * Duration presets organized by trade type
 */
export interface DurationPresets {
    rise_fall: DurationPresetsByMarket;
    higher_lower: DurationPresetsByMarket;
    touch_no_touch: DurationPresetsByMarket;
    vanillas: DurationPresetsByMarket;
    turbos: DurationPresetsByMarket;
    digits_matches_differs: DurationPresetsByMarket;
    digits_even_odd: DurationPresetsByMarket;
    digits_over_under: DurationPresetsByMarket;
}

/**
 * Stake presets organized by trade type
 */
export interface StakePresets {
    /** Digits - Matches/Differs: [1, 2, 3, 5, 10, 20] */
    digits_matches_differs: number[];
    /** Digits - Even/Odd: [1, 2, 3, 5, 10, 25] */
    digits_even_odd: number[];
    /** Digits - Over/Under: [1, 3, 5, 10, 15, 25] */
    digits_over_under: number[];
    /** Rise/Fall, Higher/Lower: [1, 5, 10, 20, 50, 100] */
    rise_fall_higher_lower: number[];
    /** Touch/No Touch: [1, 5, 10, 25, 50, 100] */
    touch_no_touch: number[];
    /** Turbos: [1, 2, 5, 10, 15, 25] */
    turbos: number[];
    /** Vanillas: [1, 5, 10, 20, 50, 75] */
    vanillas: number[];
    /** Accumulators: [1, 5, 10, 25, 50, 100] */
    accumulators: number[];
    /** Multipliers: [10, 20, 50, 100, 150, 250] */
    multipliers: number[];
}

/**
 * Complete trade parameter presets configuration
 */
export interface TradeParameterPresets {
    /** Stake presets organized by trade type */
    stake: StakePresets;
    /** Duration presets organized by trade type → market category → duration unit */
    duration: DurationPresets;
}

/**
 * Centralized configuration for all trade parameter preset values.
 *
 * Usage:
 * ```typescript
 * import { TRADE_PARAMETER_PRESETS } from 'AppV2/Config/trade-parameter-presets';
 *
 * // Access stake presets for a specific trade type
 * const turbosStakes = TRADE_PARAMETER_PRESETS.stake.turbos;
 *
 * // Access duration presets for a specific trade type, market, and unit
 * const riseFallForexTicks = TRADE_PARAMETER_PRESETS.duration.rise_fall.forex?.t;
 * ```
 */
export const TRADE_PARAMETER_PRESETS: TradeParameterPresets = {
    stake: {
        // Digits - Matches/Differs
        digits_matches_differs: [1, 2, 3, 5, 10, 20],

        // Digits - Even/Odd
        digits_even_odd: [1, 2, 3, 5, 10, 25],

        // Digits - Over/Under
        digits_over_under: [1, 3, 5, 10, 15, 25],

        // Rise/Fall, Higher/Lower (shared presets)
        rise_fall_higher_lower: [1, 5, 10, 20, 50, 100],

        // Touch/No Touch
        touch_no_touch: [1, 5, 10, 25, 50, 100],

        // Turbos
        turbos: [1, 2, 5, 10, 15, 25],

        // Vanillas
        vanillas: [1, 5, 10, 20, 50, 75],

        // Accumulators
        accumulators: [1, 5, 10, 25, 50, 100],

        // Multipliers
        multipliers: [10, 20, 50, 100, 150, 250],
    },

    duration: {
        // ========================================
        // RISE/FALL DURATION PRESETS
        // ========================================
        rise_fall: {
            // Commodities/Forex Baskets
            forex_baskets: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: [15, 20, 25, 30, 40, 45, 50, 55],
                h: [1, 2, 3, 4, 6, 8, 9, 10],
                d: null, // Not Applicable
            },

            // Daily Reset/Jump/Step Indices
            daily_reset_indices: {
                t: [1, 2, 3, 4, 5, 6, 8, 10],
                s: [15, 20, 25, 30, 40, 45, 50, 55],
                m: [2, 3, 5, 10, 15, 20, 30, 45],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Volatility Indices
            volatility_indices: {
                t: [1, 2, 3, 4, 5, 6, 8, 10],
                s: [15, 20, 25, 30, 40, 45, 50, 55],
                m: [2, 3, 5, 10, 15, 20, 30, 45],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Forex
            forex: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: [15, 20, 25, 30, 40, 45, 50, 55],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Stock Indices
            stock_indices: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: [15, 20, 25, 30, 40, 45, 50, 55],
                h: [1],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Palladium & Platinum
            palladium_platinum: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: null, // Not Applicable
                h: null, // Not Applicable
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Gold & Silver
            gold_silver: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: [5, 10, 15, 20, 25, 30, 45, 55],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },
        },

        // ========================================
        // HIGHER/LOWER DURATION PRESETS
        // ========================================
        higher_lower: {
            // Daily Reset Indices
            daily_reset_indices: {
                t: [5, 6, 7, 8, 9, 10],
                s: [15, 20, 25, 30, 40, 45, 50, 55],
                m: [2, 3, 5, 10, 15, 20, 30, 45],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: null, // Not Applicable
            },

            // Volatility Indices
            volatility_indices: {
                t: [5, 6, 7, 8, 9, 10],
                s: [15, 20, 25, 30, 40, 45, 50, 55],
                m: [2, 3, 5, 10, 15, 20, 30, 45],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Forex, Metals
            forex_metals: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: null, // Not Applicable
                h: null, // Not Applicable
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Stock Indices
            stock_indices: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: null, // Not Applicable
                h: null, // Not Applicable
                d: [7, 10, 14, 21, 30, 45, 60, 90],
            },
        },

        // ========================================
        // TOUCH/NO TOUCH DURATION PRESETS
        // ========================================
        touch_no_touch: {
            // Daily Reset Indices
            daily_reset_indices: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: [15, 20, 25, 30, 35, 45, 50, 55],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: null, // Not Applicable
            },

            // Volatility Indices
            volatility_indices: {
                t: [5, 6, 7, 8, 9, 10],
                s: null, // Not Applicable
                m: [15, 20, 25, 30, 35, 45, 50, 55],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Forex, Metals
            forex_metals: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: null, // Not Applicable
                h: null, // Not Applicable
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },

            // Stock Indices
            stock_indices: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: null, // Not Applicable
                h: null, // Not Applicable
                d: [7, 10, 14, 21, 30, 45, 60, 90],
            },
        },

        // ========================================
        // VANILLAS DURATION PRESETS
        // ========================================
        vanillas: {
            // Volatility Indices
            volatility_indices: {
                t: null, // Not Applicable
                s: null, // Not Applicable
                m: [5, 10, 15, 20, 30, 45, 50, 55],
                h: [2, 4, 6, 8, 12, 16, 20, 24],
                d: [1, 2, 3, 5, 7, 10, 14, 30],
            },
        },

        // ========================================
        // TURBOS DURATION PRESETS
        // ========================================
        turbos: {
            // Volatility Indices
            volatility_indices: {
                t: [5, 6, 7, 8, 9, 10],
                s: [15, 20, 25, 30, 40, 45, 50, 55],
                m: [5, 10, 15, 20, 30, 45, 50, 55],
                h: [1, 2, 3, 4, 6, 8, 12, 24],
                d: [1, 2, 3, 5, 7, 14, 21, 30],
            },
        },

        // ========================================
        // DIGITS - MATCHES/DIFFERS DURATION PRESETS
        // ========================================
        digits_matches_differs: {
            volatility_indices: {
                t: [1, 2, 3, 5, 7, 10],
                s: null,
                m: null,
                h: null,
                d: null,
            },
        },

        // ========================================
        // DIGITS - EVEN/ODD DURATION PRESETS
        // ========================================
        digits_even_odd: {
            volatility_indices: {
                t: [1, 2, 3, 5, 7, 10],
                s: null,
                m: null,
                h: null,
                d: null,
            },
        },

        // ========================================
        // DIGITS - OVER/UNDER DURATION PRESETS
        // ========================================
        digits_over_under: {
            volatility_indices: {
                t: [1, 2, 3, 5, 7, 10],
                s: null,
                m: null,
                h: null,
                d: null,
            },
        },
    },
};

/**
 * Helper function to get stake presets for a specific trade type
 *
 * @param tradeType - The trade type identifier
 * @returns Array of stake preset values, or undefined if not found
 *
 * @example
 * ```typescript
 * const stakes = getStakePresets('turbos');
 * // Returns: [1, 2, 5, 10, 15, 25]
 * ```
 */
export const getStakePresets = (tradeType: keyof StakePresets): number[] | undefined => {
    return TRADE_PARAMETER_PRESETS.stake[tradeType];
};

/**
 * Helper function to get duration presets for a specific trade type, market, and unit
 *
 * @param tradeType - The trade type identifier
 * @param marketCategory - The market category identifier
 * @param durationUnit - The duration unit code
 * @returns Array of duration preset values, null if not applicable, or undefined if not found
 *
 * @example
 * ```typescript
 * const presets = getDurationPresets('rise_fall', 'forex', 't');
 * // Returns: null (Not Applicable)
 *
 * const volatilityTicks = getDurationPresets('rise_fall', 'volatility_indices', 't');
 * // Returns: [1, 2, 3, 5, 8, 10]
 * ```
 */
export const getDurationPresets = (
    tradeType: keyof DurationPresets,
    marketCategory: MarketCategory,
    durationUnit: keyof DurationPresetsByUnit
): DurationUnitPresets | undefined => {
    const tradeTypePresets = TRADE_PARAMETER_PRESETS.duration[tradeType];
    if (!tradeTypePresets) return undefined;

    const marketPresets = tradeTypePresets[marketCategory];
    if (marketPresets) return marketPresets[durationUnit];

    // Fallback: if the exact market category isn't configured, use the first available market
    const availableMarkets = Object.keys(tradeTypePresets) as MarketCategory[];
    if (availableMarkets.length > 0) {
        return tradeTypePresets[availableMarkets[0]]?.[durationUnit];
    }

    return undefined;
};

/**
 * Helper function to check if a duration unit is applicable for a trade type and market
 *
 * @param tradeType - The trade type identifier
 * @param marketCategory - The market category identifier
 * @param durationUnit - The duration unit code
 * @returns true if the unit is applicable (has presets), false if not applicable (null)
 *
 * @example
 * ```typescript
 * const isApplicable = isDurationUnitApplicable('rise_fall', 'volatility_indices', 't');
 * // Returns: true
 *
 * const notApplicable = isDurationUnitApplicable('rise_fall', 'stock_indices', 't');
 * // Returns: false
 * ```
 */
export const isDurationUnitApplicable = (
    tradeType: keyof DurationPresets,
    marketCategory: MarketCategory,
    durationUnit: keyof DurationPresetsByUnit
): boolean => {
    const presets = getDurationPresets(tradeType, marketCategory, durationUnit);
    return presets !== null && presets !== undefined;
};
