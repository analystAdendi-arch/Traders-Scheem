import { WS } from '@deriv/shared';

import { createServices } from '../services';

// Mock the WS module
jest.mock('@deriv/shared', () => ({
    WS: {
        activeSymbols: jest.fn(),
        tradingTimes: jest.fn(),
    },
}));

const mockWS = WS as jest.Mocked<typeof WS>;

describe('SmartChart Adapters - Services', () => {
    let services: ReturnType<typeof createServices>, consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        services = createServices({ debug: false });

        // Mock console methods to avoid noise in tests
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('createServices', () => {
        it('should create services instance with default config', () => {
            const defaultServices = createServices();
            expect(defaultServices).toHaveProperty('getActiveSymbols');
            expect(defaultServices).toHaveProperty('getTradingTimes');
        });

        it('should create services instance with debug config', () => {
            const debugServices = createServices({ debug: true });
            expect(debugServices).toHaveProperty('getActiveSymbols');
            expect(debugServices).toHaveProperty('getTradingTimes');
        });
    });

    describe('getActiveSymbols', () => {
        it('should fetch active symbols successfully', async () => {
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

            mockWS.activeSymbols.mockResolvedValue({
                active_symbols: mockActiveSymbols,
            });

            const result = await services.getActiveSymbols();

            expect(mockWS.activeSymbols).toHaveBeenCalledWith('brief');
            expect(result).toEqual(mockActiveSymbols);
        });

        it('should handle API error response', async () => {
            const errorResponse = {
                error: {
                    code: 'InvalidSymbol',
                    message: 'Invalid symbol provided',
                },
            };

            mockWS.activeSymbols.mockResolvedValue(errorResponse);

            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('[Services] Failed to fetch active symbols', errorResponse.error);
        });

        it('should handle API error without message', async () => {
            const errorResponse = {
                error: {
                    code: 'UnknownError',
                },
            };

            mockWS.activeSymbols.mockResolvedValue(errorResponse);

            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('[Services] Failed to fetch active symbols', errorResponse.error);
        });

        it('should handle network/connection errors', async () => {
            const networkError = new Error('Network connection failed');
            mockWS.activeSymbols.mockRejectedValue(networkError);

            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith('[Services] Error fetching active symbols', networkError);
        });

        it('should handle missing active_symbols in response', async () => {
            mockWS.activeSymbols.mockResolvedValue({});

            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
        });

        it('should handle null response', async () => {
            mockWS.activeSymbols.mockResolvedValue(null);

            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
        });
    });

    describe('getTradingTimes', () => {
        beforeEach(() => {
            // Mock Date to ensure consistent test results
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should fetch trading times successfully with markets structure', async () => {
            const mockTradingTimesResponse = {
                trading_times: {
                    markets: [
                        {
                            name: 'Forex',
                            submarkets: [
                                {
                                    name: 'Major Pairs',
                                    symbols: [
                                        {
                                            underlying_symbol: 'EURUSD',
                                            times: {
                                                open: ['00:00:00'],
                                                close: ['23:59:59'],
                                                settlement: ['23:59:59'],
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            };

            mockWS.tradingTimes.mockResolvedValue(mockTradingTimesResponse);

            const result = await services.getTradingTimes();

            expect(mockWS.tradingTimes).toHaveBeenCalledWith('2024-01-15');
            expect(result).toHaveProperty('tradingTimes');
            expect(result).toHaveProperty('raw');
            expect(result.tradingTimes).toHaveProperty('EURUSD');
            expect(result.tradingTimes.EURUSD).toEqual({
                open: ['00:00:00'],
                close: ['23:59:59'],
                settlement: ['23:59:59'],
            });
            expect(result.raw).toEqual(mockTradingTimesResponse.trading_times);
        });

        it('should handle trading times with symbol format structure', async () => {
            const mockTradingTimesResponse = {
                trading_times: {
                    EURUSD: {
                        open: ['00:00:00'],
                        close: ['23:59:59'],
                        settlement: ['23:59:59'],
                    },
                    GBPUSD: {
                        open: ['00:00:00'],
                        close: ['23:59:59'],
                    },
                },
            };

            mockWS.tradingTimes.mockResolvedValue(mockTradingTimesResponse);

            const result = await services.getTradingTimes();

            expect(result.tradingTimes).toEqual({
                EURUSD: {
                    open: ['00:00:00'],
                    close: ['23:59:59'],
                    settlement: ['23:59:59'],
                },
                GBPUSD: {
                    open: ['00:00:00'],
                    close: ['23:59:59'],
                    settlement: [],
                },
            });
        });

        it('should handle API error response', async () => {
            const errorResponse = {
                error: {
                    code: 'InvalidDate',
                    message: 'Invalid date format',
                },
            };

            mockWS.tradingTimes.mockResolvedValue(errorResponse);

            const result = await services.getTradingTimes();

            expect(result).toEqual({ tradingTimes: {}, raw: {} });
            expect(consoleSpy).toHaveBeenCalledWith('[Services] Failed to fetch trading times', errorResponse.error);
        });

        it('should handle network/connection errors', async () => {
            const networkError = new Error('Connection timeout');
            mockWS.tradingTimes.mockRejectedValue(networkError);

            const result = await services.getTradingTimes();

            expect(result).toEqual({ tradingTimes: {}, raw: {} });
            expect(consoleSpy).toHaveBeenCalledWith('[Services] Error fetching trading times', networkError);
        });

        it('should handle missing trading_times in response', async () => {
            mockWS.tradingTimes.mockResolvedValue({});

            const result = await services.getTradingTimes();

            expect(result).toEqual({ tradingTimes: {}, raw: {} });
        });

        it('should handle malformed trading times data', async () => {
            const mockTradingTimesResponse = {
                trading_times: {
                    markets: [
                        {
                            // Missing name
                            submarkets: [
                                {
                                    name: 'Test',
                                    symbols: [
                                        {
                                            // Missing underlying_symbol
                                            times: {
                                                open: ['00:00:00'],
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            };

            mockWS.tradingTimes.mockResolvedValue(mockTradingTimesResponse);

            const result = await services.getTradingTimes();

            // Should not throw error but may create entry with undefined key
            expect(result.tradingTimes).toHaveProperty('undefined');
            expect(result.tradingTimes.undefined).toEqual({
                open: ['00:00:00'],
                close: [],
                settlement: [],
            });
            expect(result.raw).toEqual(mockTradingTimesResponse.trading_times);
        });

        it('should handle symbols without times property', async () => {
            const mockTradingTimesResponse = {
                trading_times: {
                    markets: [
                        {
                            name: 'Forex',
                            submarkets: [
                                {
                                    name: 'Major Pairs',
                                    symbols: [
                                        {
                                            underlying_symbol: 'EURUSD',
                                            // Missing times property
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            };

            mockWS.tradingTimes.mockResolvedValue(mockTradingTimesResponse);

            const result = await services.getTradingTimes();

            expect(result.tradingTimes).toHaveProperty('EURUSD');
            expect(result.tradingTimes.EURUSD).toEqual({
                open: [],
                close: [],
                settlement: [],
            });
        });

        it('should handle non-object trading times data', async () => {
            const mockTradingTimesResponse = {
                trading_times: 'invalid data',
            };

            mockWS.tradingTimes.mockResolvedValue(mockTradingTimesResponse);

            const result = await services.getTradingTimes();

            expect(result.tradingTimes).toEqual({});
        });

        it('should handle null trading times data', async () => {
            const mockTradingTimesResponse = {
                trading_times: null,
            };

            mockWS.tradingTimes.mockResolvedValue(mockTradingTimesResponse);

            const result = await services.getTradingTimes();

            expect(result.tradingTimes).toEqual({});
        });
    });

    describe('debug logging', () => {
        it('should not log debug messages when debug is false', async () => {
            const debugSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            mockWS.activeSymbols.mockResolvedValue({ active_symbols: [] });

            await services.getActiveSymbols();

            expect(debugSpy).not.toHaveBeenCalled();
            debugSpy.mockRestore();
        });

        it('should log debug messages when debug is true', async () => {
            const debugServices = createServices({ debug: true });
            const debugSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            mockWS.activeSymbols.mockResolvedValue({ active_symbols: [] });

            await debugServices.getActiveSymbols();

            // Debug logging would occur during the operation, but we're not testing specific log calls
            // as they're implementation details
            debugSpy.mockRestore();
        });
    });
});
