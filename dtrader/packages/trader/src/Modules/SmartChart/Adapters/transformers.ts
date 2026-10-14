/**
 * Data transformation utilities for SmartCharts Champion Adapter
 * Transforms existing Deriv data structures to SmartCharts Champion format
 */

import { getMarketDisplayName, getSubmarketDisplayName } from '../../../AppV2/Utils/symbol-categories-utils';

import type { ILogger } from './types';

/**
 * Logger implementation for transformers layer
 */
class TransformersLogger implements ILogger {
    private isDebugEnabled: boolean;

    constructor(debugEnabled: boolean = false) {
        this.isDebugEnabled = debugEnabled;
    }

    info(message: string, data?: any): void {
        if (this.isDebugEnabled) {
            // eslint-disable-next-line no-console
            console.info(`[Transformers] ${message}`, data || '');
        }
    }

    error(message: string, error?: any): void {
        if (this.isDebugEnabled) {
            // eslint-disable-next-line no-console
            console.error(`[Transformers] ${message}`, error || '');
        }
    }

    warn(message: string, data?: any): void {
        if (this.isDebugEnabled) {
            // eslint-disable-next-line no-console
            console.warn(`[Transformers] ${message}`, data || '');
        }
    }

    debug(message: string, data?: any): void {
        if (this.isDebugEnabled) {
            // eslint-disable-next-line no-console
            console.debug(`[Transformers] ${message}`, data || '');
        }
    }
}

// Create logger instance - debug mode can be controlled via environment or config
const logger = new TransformersLogger(process.env.NODE_ENV === 'development');

/**
 * Enriches active symbols with market display names from trading times
 */
export function enrichActiveSymbols(active_symbols: any[], trading_times: any) {
    if (!active_symbols || !active_symbols.length) {
        return active_symbols;
    }

    try {
        // Get trading times data
        if (!trading_times?.markets) {
            return active_symbols;
        }

        // Create lookup maps for efficient searching using symbol-categories-utils functions
        const market_display_names = new Map<string, string>();
        const submarket_display_names = new Map<string, string>();

        if (!trading_times.markets || !Array.isArray(trading_times.markets)) {
            return active_symbols;
        }

        try {
            trading_times.markets.forEach((market: any) => {
                // Use the name property directly as the display name
                if (market.name) {
                    market_display_names.set(market.name, market.name);
                }

                if (market.submarkets) {
                    market.submarkets.forEach((submarket: any) => {
                        // Use the name property directly as the display name
                        if (submarket.name && market.name) {
                            const key = `${market.name}_${submarket.name}`;
                            submarket_display_names.set(key, submarket.name);
                        }
                    });
                }
            });
        } catch (markets_error) {
            logger.error('Failed to process markets data in enrichActiveSymbols', markets_error);
            return active_symbols;
        }

        // Create symbol display names lookup
        const symbol_display_names = new Map<string, string>();

        trading_times.markets.forEach((market: any) => {
            if (market.submarkets) {
                market.submarkets.forEach((submarket: any) => {
                    if (submarket.symbols) {
                        submarket.symbols.forEach((symbol_info: any) => {
                            // Also handle underlying_symbol if present
                            if (symbol_info.underlying_symbol && symbol_info.name) {
                                symbol_display_names.set(symbol_info.underlying_symbol, symbol_info.name);
                            }
                        });
                    }
                });
            }
        });

        // Enrich each active symbol using symbol-categories-utils functions
        const enriched_symbols = active_symbols.map(symbol => {
            const enriched_symbol = { ...symbol };

            // Add market display name using getMarketDisplayName from symbol-categories-utils
            if (symbol.market) {
                // First try trading times lookup, then fall back to symbol-categories-utils mapping
                const trading_times_name = market_display_names.get(symbol.market);
                enriched_symbol.market_display_name = trading_times_name || getMarketDisplayName(symbol.market);
            }

            // Add submarket display name using getSubmarketDisplayName from symbol-categories-utils
            if (symbol.submarket) {
                // Try multiple lookup strategies for submarket
                let submarket_display_name = symbol.submarket;

                // 1. Try with market prefix from trading times
                if (symbol.market) {
                    const submarket_key = `${symbol.market}_${symbol.submarket}`;
                    submarket_display_name = submarket_display_names.get(submarket_key) || submarket_display_name;
                }

                // 2. Try direct submarket code lookup from trading times
                submarket_display_name = submarket_display_names.get(symbol.submarket) || submarket_display_name;

                // 3. Fall back to symbol-categories-utils mapping if not found in trading times
                if (submarket_display_name === symbol.submarket) {
                    submarket_display_name = getSubmarketDisplayName(symbol.submarket);
                }

                enriched_symbol.submarket_display_name = submarket_display_name;
            }

            // Add subgroup display name if available
            if (symbol.subgroup) {
                let subgroup_display_name = symbol.subgroup;

                // Try with market prefix from trading times
                if (symbol.market) {
                    const subgroup_key = `${symbol.market}_${symbol.subgroup}`;
                    subgroup_display_name = submarket_display_names.get(subgroup_key) || subgroup_display_name;
                }

                // Try direct subgroup code lookup from trading times
                subgroup_display_name = submarket_display_names.get(symbol.subgroup) || subgroup_display_name;

                // Fall back to symbol-categories-utils mapping if not found in trading times
                if (subgroup_display_name === symbol.subgroup) {
                    subgroup_display_name = getSubmarketDisplayName(symbol.subgroup);
                }

                enriched_symbol.subgroup_display_name = subgroup_display_name;
            }

            // Add symbol display name from trading times
            const symbol_code = symbol.underlying_symbol || symbol.symbol;
            if (symbol_code) {
                const symbol_display_name = symbol_display_names.get(symbol_code);
                if (symbol_display_name) {
                    enriched_symbol.display_name = symbol_display_name;
                }
            }

            if (symbol.underlying_symbol && !symbol.symbol) {
                enriched_symbol.symbol = symbol.underlying_symbol;
            }
            return enriched_symbol;
        });
        return enriched_symbols;
    } catch (error) {
        logger.error('Failed to enrich active symbols', error);
        return active_symbols;
    }
}

// Market and Submarket Mappings
// @deprecated Use getMarketDisplayName and getSubmarketDisplayName from symbol-categories-utils.ts instead
export const MARKET_MAPPINGS = {
    MARKET_DISPLAY_NAMES: new Map([
        ['synthetic_index', 'Derived'],
        ['forex', 'Forex'],
        ['indices', 'Stock Indices'],
        ['stocks', 'Stocks'],
        ['commodities', 'Commodities'],
        ['cryptocurrency', 'Cryptocurrencies'],
        ['basket_index', 'Basket Indices'],
        ['random_index', 'Derived'],
    ]),

    SUBMARKET_DISPLAY_NAMES: new Map([
        // Derived submarkets
        ['random_index', 'Volatility Indices'],
        ['random_daily', 'Daily Reset Indices'],
        ['crash_index', 'Crash/Boom'],
        ['jump_index', 'Jump Indices'],
        ['step_index', 'Step Indices'],
        ['range_break', 'Range Break Indices'],

        // Forex submarkets
        ['major_pairs', 'Major Pairs'],
        ['minor_pairs', 'Minor Pairs'],
        ['exotic_pairs', 'Exotic Pairs'],
        ['smart_fx', 'Smart FX'],
        ['micro_pairs', 'Micro Pairs'],

        // Basket indices
        ['forex_basket', 'Forex Basket'],
        ['commodity_basket', 'Commodity Basket'],
        ['stock_basket', 'Stock Basket'],

        // Commodities
        ['metals', 'Metals'],
        ['energy', 'Energy'],

        // Cryptocurrencies submarkets
        ['crypto_index', 'Crypto Index'],
        ['non_stable_coin', 'Non-Stable Coins'],
        ['stable_coin', 'Stable Coins'],
        ['crypto_basket', 'Crypto Basket'],

        // Stock indices submarkets
        ['asian_indices', 'Asian Indices'],
        ['american_indices', 'American Indices'],
        ['european_indices', 'European Indices'],
        ['otc_index', 'OTC Indices'],
        ['europe_OTC', 'European OTC'],
        ['asia_oceania_OTC', 'Asia Oceania OTC'],
        ['americas_OTC', 'Americas OTC'],
        ['otc_indices', 'OTC Indices'],
        ['us_indices', 'US Indices'],
        ['stock_indices', 'Stock Indices'],
        ['indices', 'Indices'],
    ]),
};
