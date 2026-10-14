import { enrichActiveSymbols, MARKET_MAPPINGS } from '../transformers';

// Mock the symbol-categories-utils module
jest.mock('AppV2/Utils/symbol-categories-utils', () => ({
    getMarketDisplayName: jest.fn((market: string) => {
        const mappings: Record<string, string> = {
            forex: 'Forex',
            synthetic_index: 'Derived',
            indices: 'Stock Indices',
            stocks: 'Stocks',
            commodities: 'Commodities',
            cryptocurrency: 'Cryptocurrencies',
        };
        return mappings[market] || market;
    }),
    getSubmarketDisplayName: jest.fn((submarket: string) => {
        const mappings: Record<string, string> = {
            major_pairs: 'Major Pairs',
            random_index: 'Volatility Indices',
            crash_index: 'Crash/Boom',
            minor_pairs: 'Minor Pairs',
            exotic_pairs: 'Exotic Pairs',
        };
        return mappings[submarket] || submarket;
    }),
}));

describe('SmartChart Adapters - Transformers', () => {
    describe('MARKET_MAPPINGS', () => {
        it('should have valid market display names mapping', () => {
            expect(MARKET_MAPPINGS.MARKET_DISPLAY_NAMES).toBeInstanceOf(Map);
            expect(MARKET_MAPPINGS.MARKET_DISPLAY_NAMES.size).toBeGreaterThan(0);

            // Test specific mappings
            expect(MARKET_MAPPINGS.MARKET_DISPLAY_NAMES.get('synthetic_index')).toBe('Derived');
            expect(MARKET_MAPPINGS.MARKET_DISPLAY_NAMES.get('forex')).toBe('Forex');
            expect(MARKET_MAPPINGS.MARKET_DISPLAY_NAMES.get('indices')).toBe('Stock Indices');
        });

        it('should have valid submarket display names mapping', () => {
            expect(MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES).toBeInstanceOf(Map);
            expect(MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES.size).toBeGreaterThan(0);

            // Test specific mappings
            expect(MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES.get('major_pairs')).toBe('Major Pairs');
            expect(MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES.get('random_index')).toBe('Volatility Indices');
            expect(MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES.get('crash_index')).toBe('Crash/Boom');
        });
    });

    describe('enrichActiveSymbols', () => {
        const mockActiveSymbols = [
            {
                symbol: 'EURUSD',
                market: 'forex',
                submarket: 'major_pairs',
                display_name: 'EUR/USD',
            },
            {
                symbol: 'R_10',
                market: 'synthetic_index',
                submarket: 'random_index',
                display_name: 'Volatility 10 Index',
            },
        ];

        const mockTradingTimes = {
            markets: [
                {
                    name: 'Forex',
                    submarkets: [
                        {
                            name: 'Major Pairs',
                            symbols: [
                                {
                                    underlying_symbol: 'EURUSD',
                                    name: 'EUR/USD',
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'Derived',
                    submarkets: [
                        {
                            name: 'Volatility Indices',
                            symbols: [
                                {
                                    underlying_symbol: 'R_10',
                                    name: 'Volatility 10 Index',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        it('should return original symbols when active_symbols is empty or null', () => {
            expect(enrichActiveSymbols([], mockTradingTimes)).toEqual([]);
            expect(enrichActiveSymbols(null as any, mockTradingTimes)).toEqual(null);
            expect(enrichActiveSymbols(undefined as any, mockTradingTimes)).toEqual(undefined);
        });

        it('should return original symbols when trading_times has no markets', () => {
            const result = enrichActiveSymbols(mockActiveSymbols, {});
            expect(result).toEqual(mockActiveSymbols);
        });

        it('should return original symbols when trading_times is null', () => {
            const result = enrichActiveSymbols(mockActiveSymbols, null);
            expect(result).toEqual(mockActiveSymbols);
        });

        it('should enrich symbols with market display names', () => {
            const result = enrichActiveSymbols(mockActiveSymbols, mockTradingTimes);

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('market_display_name', 'Forex');
            expect(result[1]).toHaveProperty('market_display_name', 'Derived');
        });

        it('should enrich symbols with submarket display names', () => {
            const result = enrichActiveSymbols(mockActiveSymbols, mockTradingTimes);

            expect(result[0]).toHaveProperty('submarket_display_name', 'Major Pairs');
            expect(result[1]).toHaveProperty('submarket_display_name', 'Volatility Indices');
        });

        it('should handle symbols with underlying_symbol but no symbol property', () => {
            const symbolsWithUnderlying = [
                {
                    underlying_symbol: 'EURUSD',
                    market: 'forex',
                    submarket: 'major_pairs',
                },
            ];

            const result = enrichActiveSymbols(symbolsWithUnderlying, mockTradingTimes);

            expect(result[0]).toHaveProperty('symbol', 'EURUSD');
        });

        it('should handle malformed trading times data gracefully', () => {
            const malformedTradingTimes = {
                markets: [
                    {
                        // Missing name property
                        submarkets: null,
                    },
                    {
                        name: 'Forex',
                        submarkets: [
                            {
                                // Missing name property
                                symbols: [],
                            },
                        ],
                    },
                ],
            };

            const result = enrichActiveSymbols(mockActiveSymbols, malformedTradingTimes);

            // Should not throw error and return symbols (possibly without enrichment)
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('symbol', 'EURUSD');
        });

        it('should handle trading times with non-array markets', () => {
            const invalidTradingTimes = {
                markets: 'not an array',
            };

            const result = enrichActiveSymbols(mockActiveSymbols, invalidTradingTimes);
            expect(result).toEqual(mockActiveSymbols);
        });

        it('should use fallback display names when trading times data is incomplete', () => {
            const incompleteSymbols = [
                {
                    symbol: 'UNKNOWN',
                    market: 'unknown_market',
                    submarket: 'unknown_submarket',
                },
            ];

            const result = enrichActiveSymbols(incompleteSymbols, mockTradingTimes);

            // Should fallback to original market/submarket codes
            expect(result[0]).toHaveProperty('market_display_name', 'unknown_market');
            expect(result[0]).toHaveProperty('submarket_display_name', 'unknown_submarket');
        });

        it('should handle symbols with subgroup property', () => {
            const symbolsWithSubgroup = [
                {
                    symbol: 'TEST',
                    market: 'forex',
                    submarket: 'major_pairs',
                    subgroup: 'test_subgroup',
                },
            ];

            const result = enrichActiveSymbols(symbolsWithSubgroup, mockTradingTimes);

            expect(result[0]).toHaveProperty('subgroup_display_name');
        });

        it('should preserve original symbol properties', () => {
            const result = enrichActiveSymbols(mockActiveSymbols, mockTradingTimes);

            // Original properties should be preserved
            expect(result[0]).toHaveProperty('symbol', 'EURUSD');
            expect(result[0]).toHaveProperty('market', 'forex');
            expect(result[0]).toHaveProperty('submarket', 'major_pairs');
            expect(result[0]).toHaveProperty('display_name', 'EUR/USD');
        });

        it('should handle errors gracefully and return enriched symbols with fallbacks', () => {
            // Create a trading times object that will cause an error during processing
            const errorTradingTimes = {
                markets: [
                    {
                        name: 'Test',
                        submarkets: [
                            {
                                name: 'Test Submarket',
                                symbols: [
                                    {
                                        // This will cause an error when trying to access properties
                                        underlying_symbol: null,
                                        name: null,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            // Mock console.error to avoid noise in test output
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = enrichActiveSymbols(mockActiveSymbols, errorTradingTimes);

            // Should return symbols with fallback display names when error occurs
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('symbol', 'EURUSD');
            expect(result[0]).toHaveProperty('market_display_name', 'Forex');
            expect(result[0]).toHaveProperty('submarket_display_name', 'Major Pairs');
            expect(result[1]).toHaveProperty('symbol', 'R_10');
            expect(result[1]).toHaveProperty('market_display_name', 'Derived');
            expect(result[1]).toHaveProperty('submarket_display_name', 'Volatility Indices');

            consoleSpy.mockRestore();
        });
    });
});
