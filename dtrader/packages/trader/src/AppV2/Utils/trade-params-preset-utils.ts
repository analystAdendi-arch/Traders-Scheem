/**
 * Utility functions for mapping contract types and market data to preset configuration keys
 *
 * These functions bridge the gap between the runtime contract_type values and the
 * preset configuration structure defined in trade-parameter-presets.ts
 */

import { TRADE_TYPES } from '@deriv/shared';

import type { MarketCategory } from '../Config/trade-parameter-presets';

/**
 * Maps a contract_type to the corresponding trade type key used in preset configuration
 *
 * @param contract_type - The contract type from the trade store (e.g., 'match_diff', 'even_odd')
 * @returns The trade type key for preset lookup, or undefined if not found
 *
 * @example
 * ```typescript
 * mapContractTypeToTradeType('match_diff') // Returns: 'digits_matches_differs'
 * mapContractTypeToTradeType('even_odd') // Returns: 'digits_even_odd'
 * mapContractTypeToTradeType('rise_fall') // Returns: 'rise_fall_higher_lower'
 * ```
 */
export const mapContractTypeToStakePresetKey = (
    contract_type: string
):
    | 'digits_matches_differs'
    | 'digits_even_odd'
    | 'digits_over_under'
    | 'rise_fall_higher_lower'
    | 'touch_no_touch'
    | 'turbos'
    | 'vanillas'
    | 'accumulators'
    | 'multipliers'
    | undefined => {
    // Normalize contract_type to lowercase for comparison
    const normalized = contract_type.toLowerCase();

    // Digits subtypes
    if (normalized === TRADE_TYPES.MATCH_DIFF) {
        return 'digits_matches_differs';
    }
    if (normalized === TRADE_TYPES.EVEN_ODD) {
        return 'digits_even_odd';
    }
    if (normalized === TRADE_TYPES.OVER_UNDER) {
        return 'digits_over_under';
    }

    // Rise/Fall and Higher/Lower share the same presets
    if (
        normalized === TRADE_TYPES.RISE_FALL ||
        normalized === TRADE_TYPES.RISE_FALL_EQUAL ||
        normalized === TRADE_TYPES.HIGH_LOW
    ) {
        return 'rise_fall_higher_lower';
    }

    // Touch/No Touch
    if (normalized === TRADE_TYPES.TOUCH) {
        return 'touch_no_touch';
    }

    // Turbos (both LONG and SHORT)
    if (normalized === TRADE_TYPES.TURBOS.LONG || normalized === TRADE_TYPES.TURBOS.SHORT) {
        return 'turbos';
    }

    // Vanillas (both CALL and PUT)
    if (normalized === TRADE_TYPES.VANILLA.CALL || normalized === TRADE_TYPES.VANILLA.PUT) {
        return 'vanillas';
    }

    // Accumulators
    if (normalized === TRADE_TYPES.ACCUMULATOR) {
        return 'accumulators';
    }

    // Multipliers
    if (normalized === TRADE_TYPES.MULTIPLIER) {
        return 'multipliers';
    }

    return undefined;
};

/**
 * Maps a contract_type to the corresponding trade type key for duration presets
 *
 * @param contract_type - The contract type from the trade store
 * @returns The trade type key for duration preset lookup, or undefined if not found
 *
 * @example
 * ```typescript
 * mapContractTypeToDurationPresetKey('rise_fall') // Returns: 'rise_fall'
 * mapContractTypeToDurationPresetKey('high_low') // Returns: 'higher_lower'
 * ```
 */
export const mapContractTypeToDurationPresetKey = (
    contract_type: string
):
    | 'rise_fall'
    | 'higher_lower'
    | 'touch_no_touch'
    | 'vanillas'
    | 'turbos'
    | 'digits_matches_differs'
    | 'digits_even_odd'
    | 'digits_over_under'
    | undefined => {
    const normalized = contract_type.toLowerCase();

    // Digits subtypes
    if (normalized === TRADE_TYPES.MATCH_DIFF) {
        return 'digits_matches_differs';
    }
    if (normalized === TRADE_TYPES.EVEN_ODD) {
        return 'digits_even_odd';
    }
    if (normalized === TRADE_TYPES.OVER_UNDER) {
        return 'digits_over_under';
    }

    // Rise/Fall (including equals variant)
    if (normalized === TRADE_TYPES.RISE_FALL || normalized === TRADE_TYPES.RISE_FALL_EQUAL) {
        return 'rise_fall';
    }

    // Higher/Lower
    if (normalized === TRADE_TYPES.HIGH_LOW) {
        return 'higher_lower';
    }

    // Touch/No Touch
    if (normalized === TRADE_TYPES.TOUCH) {
        return 'touch_no_touch';
    }

    // Vanillas (both CALL and PUT)
    if (normalized === TRADE_TYPES.VANILLA.CALL || normalized === TRADE_TYPES.VANILLA.PUT) {
        return 'vanillas';
    }

    // Turbos (both LONG and SHORT)
    if (normalized === TRADE_TYPES.TURBOS.LONG || normalized === TRADE_TYPES.TURBOS.SHORT) {
        return 'turbos';
    }

    return undefined;
};

/**
 * Maps symbol market data to the corresponding market category key used in preset configuration
 *
 * @param market - The market identifier (e.g., 'forex', 'synthetic_index')
 * @param submarket - Optional submarket identifier (e.g., 'random_index')
 * @param symbol - Optional symbol code for more precise categorization (e.g., 'frxXAUUSD')
 * @returns The market category key for preset lookup
 *
 * @example
 * ```typescript
 * mapSymbolToMarketCategory('forex') // Returns: 'forex'
 * mapSymbolToMarketCategory('synthetic_index', 'forex_basket') // Returns: 'forex_baskets'
 * mapSymbolToMarketCategory('synthetic_index', 'random_index') // Returns: 'volatility_indices'
 * mapSymbolToMarketCategory('synthetic_index', 'crash_index') // Returns: 'daily_reset_indices'
 * mapSymbolToMarketCategory('commodities', 'metals', 'frxXAUUSD') // Returns: 'gold_silver'
 * mapSymbolToMarketCategory('indices') // Returns: 'stock_indices'
 * mapSymbolToMarketCategory('cryptocurrency') // Returns: 'forex' (fallback)
 * ```
 */
export const mapSymbolToMarketCategory = (market?: string, submarket?: string, symbol?: string): MarketCategory => {
    if (!market) {
        // Default to forex when market is unknown - it has the most complete preset coverage
        return 'forex';
    }

    const normalized_market = market.toLowerCase();
    const normalized_submarket = submarket?.toLowerCase();
    const normalized_symbol = symbol?.toUpperCase();

    // Forex - check submarket for forex baskets first
    if (normalized_market === 'forex') {
        // Forex baskets (basket_forex, forex_basket, smart_fx submarkets)
        if (
            normalized_submarket === 'basket_forex' ||
            normalized_submarket === 'forex_basket' ||
            normalized_submarket === 'smart_fx'
        ) {
            return 'forex_baskets';
        }
        return 'forex';
    }

    // Synthetic Indices - check submarket for specific categories
    if (normalized_market === 'synthetic_index' || normalized_market === 'synthetic_indices') {
        // Volatility indices (random_index submarket)
        if (normalized_submarket === 'random_index' || normalized_submarket === 'random_indices') {
            return 'volatility_indices';
        }
        // Daily reset indices, Jump indices, Step indices, Crash/Boom indices, Range break indices
        // These all use the 'daily_reset_indices' presets as per config comments
        if (
            normalized_submarket === 'random_daily' ||
            normalized_submarket === 'daily_reset_indices' ||
            normalized_submarket === 'step_index' ||
            normalized_submarket === 'step_indices' ||
            normalized_submarket === 'jump_index' ||
            normalized_submarket === 'jump_indices' ||
            normalized_submarket === 'crash_index' ||
            normalized_submarket === 'crash_boom' ||
            normalized_submarket === 'range_break'
        ) {
            return 'daily_reset_indices';
        }
        // Baskets (forex basket, commodity basket) - uses forex_baskets presets
        if (
            normalized_submarket === 'commodity_basket' ||
            normalized_submarket === 'forex_basket' ||
            normalized_submarket === 'basket_forex' ||
            normalized_submarket === 'basket_commodities'
        ) {
            return 'forex_baskets';
        }
        // Default to volatility_indices for other synthetic index submarkets
        // to ensure presets are available (synthetic_indices is not defined in most trade type configs)
        return 'volatility_indices';
    }

    // Stock Indices
    if (
        normalized_market === 'indices' ||
        normalized_market === 'stock_index' ||
        normalized_market === 'stock_indices'
    ) {
        return 'stock_indices';
    }

    // Commodities - check for metals subcategories
    // Per config comment "Commodities/Forex Baskets", non-metal commodities use forex_baskets presets
    if (normalized_market === 'commodities' || normalized_market === 'commodity') {
        // For metals submarket, use symbol to distinguish between gold/silver and palladium/platinum
        if (normalized_submarket === 'metals') {
            // Gold (XAUUSD) and Silver (XAGUSD)
            if (normalized_symbol && (normalized_symbol.includes('XAU') || normalized_symbol.includes('XAG'))) {
                return 'gold_silver';
            }
            // Palladium (XPDUSD) and Platinum (XPTUSD)
            if (normalized_symbol && (normalized_symbol.includes('XPD') || normalized_symbol.includes('XPT'))) {
                return 'palladium_platinum';
            }
            // Default metals to gold_silver (most common metal category in presets)
            return 'gold_silver';
        }
        // Non-metal commodities (energy, etc.) - use forex_baskets presets
        return 'forex_baskets';
    }

    // Cryptocurrencies - use forex presets as closest match (similar trading hours/behavior)
    if (normalized_market === 'cryptocurrency' || normalized_market === 'cryptocurrencies') {
        return 'forex';
    }

    // Derived FX (basket indices) - map to forex_baskets
    if (
        normalized_market === 'basket_index' ||
        normalized_market === 'basket_indices' ||
        normalized_market === 'derived_fx'
    ) {
        return 'forex_baskets';
    }

    // ETFs - use stock_indices presets as closest match
    if (normalized_market === 'etf' || normalized_market === 'etfs') {
        return 'stock_indices';
    }

    // Default fallback for unknown markets - use forex as most common category
    return 'forex';
};

/**
 * Gets the market, submarket, and symbol from the active symbol data
 *
 * @param symbol - The symbol code (e.g., '1HZ100V', 'frxEURUSD')
 * @param active_symbols - The active symbols list from the API
 * @returns Object containing market, submarket, and symbol, or undefined if not found
 *
 * @example
 * ```typescript
 * const symbolData = getSymbolMarketData('1HZ100V', active_symbols);
 * // Returns: { market: 'synthetic_index', submarket: 'random_index', symbol: '1HZ100V' }
 * ```
 */
export const getSymbolMarketData = (
    symbol: string,
    active_symbols?: any[]
): { market?: string; submarket?: string; symbol?: string } | undefined => {
    if (!active_symbols || !symbol) {
        return undefined;
    }

    // FIX: The active_symbols array uses 'underlying_symbol' property, not 'symbol'
    // This matches the pattern used in barrier-input.tsx and other components
    const symbol_data = active_symbols.find((s: any) => s.underlying_symbol === symbol);

    if (!symbol_data) {
        return undefined;
    }

    return {
        market: symbol_data.market,
        submarket: symbol_data.submarket,
        symbol: symbol_data.underlying_symbol || symbol,
    };
};
