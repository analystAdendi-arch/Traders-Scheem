import { toJS } from 'mobx';

import { buildSmartChartsChampionAdapter, createSmartChartsChampionAdapter, transformations } from '../index';
import type { AdapterConfig, TGetQuotesRequest, TServices, TTransport } from '../types';

// Mock dependencies
jest.mock('mobx', () => ({
    toJS: jest.fn(data => data),
}));

jest.mock('../transport', () => ({
    createTransport: jest.fn(() => ({
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        unsubscribeAll: jest.fn(),
    })),
}));

jest.mock('../services', () => ({
    createServices: jest.fn(() => ({
        getActiveSymbols: jest.fn(),
        getTradingTimes: jest.fn(),
    })),
}));

jest.mock('../transformers', () => ({
    enrichActiveSymbols: jest.fn(symbols => symbols),
}));

const mockToJS = toJS as jest.MockedFunction<typeof toJS>;

describe('SmartChart Adapters - Main Index', () => {
    let mockTransport: jest.Mocked<TTransport>,
        mockServices: jest.Mocked<TServices>,
        consoleSpy: jest.SpyInstance,
        warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTransport = {
            send: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            unsubscribeAll: jest.fn(),
        };

        mockServices = {
            getActiveSymbols: jest.fn(),
            getTradingTimes: jest.fn(),
        };

        // Mock console methods to avoid noise in tests
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        // Reset toJS mock
        mockToJS.mockImplementation(data => data);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        warnSpy.mockRestore();
    });

    describe('transformations', () => {
        describe('toTGetQuotesResult', () => {
            it('should transform tick data (granularity = 0)', () => {
                const response = {
                    history: {
                        prices: [1.1234, 1.1235, 1.1236],
                        times: [1609459200, 1609459260, 1609459320],
                    },
                    echo_req: { ticks_history: 'EURUSD' },
                };

                const result = transformations.toTGetQuotesResult(response, 0);

                expect(result.quotes).toHaveLength(3);
                expect(result.quotes[0]).toEqual({
                    Date: '1609459200',
                    Close: 1.1234,
                    DT: new Date(1609459200 * 1000),
                });
                expect(result.meta?.symbol).toBe('EURUSD');
                expect(result.meta?.granularity).toBe(0);
            });

            it('should transform candle data (granularity > 0)', () => {
                const response = {
                    candles: [
                        {
                            epoch: 1609459200,
                            open: 1.123,
                            high: 1.124,
                            low: 1.122,
                            close: 1.1235,
                        },
                        {
                            epoch: 1609459260,
                            open: 1.1235,
                            high: 1.1245,
                            low: 1.1225,
                            close: 1.124,
                        },
                    ],
                    echo_req: { ticks_history: 'EURUSD' },
                };

                const result = transformations.toTGetQuotesResult(response, 60);

                expect(result.quotes).toHaveLength(2);
                expect(result.quotes[0]).toEqual({
                    Date: '1609459200',
                    Open: 1.123,
                    High: 1.124,
                    Low: 1.122,
                    Close: 1.1235,
                    DT: new Date(1609459200 * 1000),
                });
                expect(result.meta?.symbol).toBe('EURUSD');
                expect(result.meta?.granularity).toBe(60);
            });

            it('should handle fallback prices/times arrays', () => {
                const response = {
                    prices: [1.1234, 1.1235],
                    times: [1609459200, 1609459260],
                    echo_req: { ticks_history: 'EURUSD' },
                };

                const result = transformations.toTGetQuotesResult(response, 0);

                expect(result.quotes).toHaveLength(2);
                expect(result.quotes[0]).toEqual({
                    Date: '1609459200',
                    Close: 1.1234,
                    DT: new Date(1609459200 * 1000),
                });
            });

            it('should handle empty/null response', () => {
                const result = transformations.toTGetQuotesResult(null, 0);

                expect(result.quotes).toHaveLength(0);
                expect(result.meta?.symbol).toBe('');
                expect(result.meta?.granularity).toBe(0);
            });

            it('should include pip_size in meta when available', () => {
                const response = {
                    history: { prices: [1.1234], times: [1609459200] },
                    echo_req: { ticks_history: 'EURUSD' },
                    pip_size: 0.0001,
                };

                const result = transformations.toTGetQuotesResult(response, 0);

                expect(result.meta?.delay_amount).toBe(0.0001);
            });
        });

        describe('toTQuoteFromStream', () => {
            it('should transform tick stream message (granularity = 0)', () => {
                const message = {
                    tick: {
                        epoch: 1609459200,
                        quote: 1.1234,
                        symbol: 'EURUSD',
                    },
                };

                const result = transformations.toTQuoteFromStream(message, 0);

                expect(result).toEqual({
                    Date: '1609459200',
                    Close: 1.1234,
                    tick: message.tick,
                    DT: new Date(1609459200 * 1000),
                });
            });

            it('should transform ohlc stream message (granularity > 0)', () => {
                const message = {
                    ohlc: {
                        epoch: 1609459200,
                        open: 1.123,
                        high: 1.124,
                        low: 1.122,
                        close: 1.1235,
                    },
                };

                const result = transformations.toTQuoteFromStream(message, 60);

                expect(result).toEqual({
                    Date: '1609459200',
                    Open: 1.123,
                    High: 1.124,
                    Low: 1.122,
                    Close: 1.1235,
                    ohlc: message.ohlc,
                    DT: new Date(1609459200 * 1000),
                });
            });

            it('should handle fallback stream message', () => {
                const message = {
                    epoch: 1609459200,
                    quote: 1.1234,
                };

                const result = transformations.toTQuoteFromStream(message, 0);

                expect(result).toEqual({
                    Date: '1609459200',
                    Close: 1.1234,
                    DT: new Date(1609459200 * 1000),
                });
            });

            it('should handle message without epoch', () => {
                const message = {
                    quote: 1.1234,
                };

                const result = transformations.toTQuoteFromStream(message, 0);

                expect(result.Close).toBe(1.1234);
                expect(result.Date).toMatch(/^\d+(\.\d+)?$/); // Allow decimal timestamps
                expect(result.DT).toBeInstanceOf(Date);
            });
        });

        describe('toActiveSymbols', () => {
            it('should transform active symbols data', () => {
                const activeSymbolsData = [
                    {
                        underlying_symbol: 'EURUSD',
                        display_name: 'EUR/USD',
                        market: 'forex',
                        market_display_name: 'Forex',
                        submarket: 'major_pairs',
                        submarket_display_name: 'Major Pairs',
                        pip: 0.0001,
                        exchange_is_open: 1,
                    },
                    {
                        symbol: 'GBPUSD',
                        display_name: 'GBP/USD',
                        market: 'forex',
                        submarket: 'major_pairs',
                        pip_size: 0.0001,
                        is_trading_suspended: 0,
                    },
                ];

                const result = transformations.toActiveSymbols(activeSymbolsData);

                expect(result).toHaveLength(2);
                expect(result[0]).toEqual({
                    display_name: 'EUR/USD',
                    market: 'forex',
                    market_display_name: 'Forex',
                    subgroup: undefined,
                    subgroup_display_name: '',
                    submarket: 'major_pairs',
                    submarket_display_name: 'Major Pairs',
                    symbol: 'EURUSD',
                    symbol_type: '',
                    pip: 0.0001,
                    exchange_is_open: 1,
                    is_trading_suspended: 0,
                });
                expect(result[1].symbol).toBe('GBPUSD');
                expect(result[1].pip).toBe(0.0001);
            });

            it('should handle non-array input', () => {
                const result = transformations.toActiveSymbols(null as any);
                expect(result).toEqual([]);
            });

            it('should use default values for missing fields', () => {
                const activeSymbolsData = [{ symbol: 'TEST' }];
                const result = transformations.toActiveSymbols(activeSymbolsData);

                expect(result[0]).toEqual({
                    display_name: 'TEST',
                    market: undefined,
                    market_display_name: '',
                    subgroup: undefined,
                    subgroup_display_name: '',
                    submarket: undefined,
                    submarket_display_name: '',
                    symbol: 'TEST',
                    symbol_type: '',
                    pip: 0.01,
                    exchange_is_open: 0,
                    is_trading_suspended: 0,
                });
            });
        });

        describe('toTradingTimesMap', () => {
            it('should transform trading times data', () => {
                const tradingTimesData = {
                    EURUSD: {
                        open: ['00:00:00'],
                        close: ['23:59:59'],
                    },
                    GBPUSD: {
                        open: ['--'],
                        close: ['--'],
                    },
                };

                const result = transformations.toTradingTimesMap(tradingTimesData);

                expect(result).toEqual({
                    EURUSD: {
                        isOpen: true,
                        openTime: '00:00:00',
                        closeTime: '23:59:59',
                    },
                    GBPUSD: {
                        isOpen: false,
                        openTime: '--',
                        closeTime: '--',
                    },
                });
            });

            it('should handle null/undefined input', () => {
                expect(transformations.toTradingTimesMap(null)).toEqual({});
                expect(transformations.toTradingTimesMap(undefined)).toEqual({});
            });

            it('should handle missing open/close arrays', () => {
                const tradingTimesData = {
                    EURUSD: {},
                    GBPUSD: {
                        open: null,
                        close: null,
                    },
                };

                const result = transformations.toTradingTimesMap(tradingTimesData);

                expect(result.EURUSD).toEqual({
                    isOpen: false,
                    openTime: '--',
                    closeTime: '--',
                });
                expect(result.GBPUSD).toEqual({
                    isOpen: false,
                    openTime: '--',
                    closeTime: '--',
                });
            });
        });
    });

    describe('buildSmartChartsChampionAdapter', () => {
        let adapter: ReturnType<typeof buildSmartChartsChampionAdapter>, config: AdapterConfig;

        beforeEach(() => {
            config = { debug: false };
            adapter = buildSmartChartsChampionAdapter(mockTransport, mockServices, config);
        });

        describe('getQuotes', () => {
            it('should get historical quotes for ticks (granularity = 0)', async () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                    count: 100,
                };

                const mockResponse = {
                    history: {
                        prices: [1.1234, 1.1235],
                        times: [1609459200, 1609459260],
                    },
                    echo_req: { ticks_history: 'EURUSD' },
                };

                mockTransport.send.mockResolvedValue(mockResponse);

                const result = await adapter.getQuotes(request);

                expect(mockTransport.send).toHaveBeenCalledWith({
                    ticks_history: 'EURUSD',
                    end: 'latest',
                    count: 100,
                    adjust_start_time: 1,
                    style: 'ticks',
                });

                expect(result.quotes).toHaveLength(2);
                expect(result.meta?.symbol).toBe('EURUSD');
                expect(result.meta?.granularity).toBe(0);
            });

            it('should get historical quotes for candles (granularity > 0)', async () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 60,
                    start: 1609459200,
                };

                const mockResponse = {
                    candles: [
                        {
                            epoch: 1609459200,
                            open: 1.123,
                            high: 1.124,
                            low: 1.122,
                            close: 1.1235,
                        },
                    ],
                    echo_req: { ticks_history: 'EURUSD' },
                };

                mockTransport.send.mockResolvedValue(mockResponse);

                const result = await adapter.getQuotes(request);

                expect(mockTransport.send).toHaveBeenCalledWith({
                    ticks_history: 'EURUSD',
                    end: 'latest',
                    adjust_start_time: 1,
                    style: 'candles',
                    granularity: 60,
                    start: 1609459200,
                });

                expect(result.quotes).toHaveLength(1);
                expect(result.quotes[0]).toEqual({
                    Date: '1609459200',
                    Open: 1.123,
                    High: 1.124,
                    Low: 1.122,
                    Close: 1.1235,
                    DT: new Date(1609459200 * 1000),
                });
                expect(result.meta?.symbol).toBe('EURUSD');
                expect(result.meta?.granularity).toBe(60);
            });

            it('should handle transport errors gracefully', async () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                mockTransport.send.mockRejectedValue(new Error('Network error'));

                const result = await adapter.getQuotes(request);

                expect(result.quotes).toHaveLength(0);
                expect(result.meta?.symbol).toBe('EURUSD');
                expect(result.meta?.granularity).toBe(0);
                expect(consoleSpy).toHaveBeenCalledWith('[Adapter] Error in getQuotes:', expect.any(Error));
            });

            it('should use default values when not provided', async () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                mockTransport.send.mockResolvedValue({});

                await adapter.getQuotes(request);

                expect(mockTransport.send).toHaveBeenCalledWith({
                    ticks_history: 'EURUSD',
                    end: 'latest',
                    count: 1000,
                    adjust_start_time: 1,
                    style: 'ticks',
                });
            });
        });

        describe('subscribeQuotes', () => {
            it('should subscribe to tick quotes (granularity = 0)', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                const mockCallback = jest.fn();
                mockTransport.subscribe.mockReturnValue('subscription-id-123');

                const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

                expect(mockTransport.subscribe).toHaveBeenCalledWith(
                    {
                        ticks_history: 'EURUSD',
                        subscribe: 1,
                        end: 'latest',
                        count: 1,
                        style: 'ticks',
                    },
                    expect.any(Function)
                );

                expect(typeof unsubscribe).toBe('function');
            });

            it('should subscribe to candle quotes (granularity > 0)', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 60,
                };

                const mockCallback = jest.fn();
                mockTransport.subscribe.mockReturnValue('subscription-id-123');

                const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

                expect(mockTransport.subscribe).toHaveBeenCalledWith(
                    {
                        ticks_history: 'EURUSD',
                        subscribe: 1,
                        end: 'latest',
                        count: 1,
                        style: 'candles',
                        granularity: 60,
                    },
                    expect.any(Function)
                );

                expect(typeof unsubscribe).toBe('function');
            });

            it('should handle stream messages and call callback', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                const mockCallback = jest.fn();
                mockTransport.subscribe.mockReturnValue('subscription-id-123');

                adapter.subscribeQuotes(request, mockCallback);

                // Get the stream callback that was passed to transport.subscribe
                const streamCallback = mockTransport.subscribe.mock.calls[0][1];

                // Simulate a tick message
                const tickMessage = {
                    tick: {
                        epoch: 1609459200,
                        quote: 1.1234,
                        symbol: 'EURUSD',
                    },
                };

                streamCallback(tickMessage);

                expect(mockCallback).toHaveBeenCalledWith({
                    Date: '1609459200',
                    Close: 1.1234,
                    tick: tickMessage.tick,
                    DT: new Date(1609459200 * 1000),
                });
            });

            it('should handle stream transformation errors gracefully', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                const mockCallback = jest.fn(() => {
                    throw new Error('Callback error');
                });
                mockTransport.subscribe.mockReturnValue('subscription-id-123');

                adapter.subscribeQuotes(request, mockCallback);

                // Get the stream callback
                const streamCallback = mockTransport.subscribe.mock.calls[0][1];

                // This should not throw
                expect(() => streamCallback({ tick: { epoch: 1609459200, quote: 1.1234 } })).not.toThrow();
                expect(consoleSpy).toHaveBeenCalledWith(
                    '[Adapter] Error transforming stream message:',
                    expect.any(Error)
                );
            });

            it('should handle subscription errors gracefully', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                const mockCallback = jest.fn();
                mockTransport.subscribe.mockImplementation(() => {
                    throw new Error('Subscription failed');
                });

                const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

                expect(consoleSpy).toHaveBeenCalledWith('[Adapter] Error in subscribeQuotes:', expect.any(Error));
                expect(typeof unsubscribe).toBe('function');

                // Should be a no-op function
                expect(() => unsubscribe()).not.toThrow();
            });

            it('should return unsubscribe function that cleans up subscription', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                const mockCallback = jest.fn();
                mockTransport.subscribe.mockReturnValue('subscription-id-123');

                const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

                // Call unsubscribe
                unsubscribe();

                expect(mockTransport.unsubscribe).toHaveBeenCalledWith('subscription-id-123');
            });
        });

        describe('unsubscribeQuotes', () => {
            it('should unsubscribe from active subscription', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'EURUSD',
                    granularity: 0,
                };

                const mockCallback = jest.fn();
                mockTransport.subscribe.mockReturnValue('subscription-id-123');

                // First subscribe
                const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

                // Then unsubscribe using the convenience method
                adapter.unsubscribeQuotes(request);

                expect(mockTransport.unsubscribe).toHaveBeenCalledWith('subscription-id-123');
            });

            it('should handle unsubscribe from non-existent subscription', () => {
                const request: TGetQuotesRequest = {
                    symbol: 'NONEXISTENT',
                    granularity: 0,
                };

                adapter.unsubscribeQuotes(request);

                expect(warnSpy).toHaveBeenCalledWith('[Adapter] No active subscription found for:', 'NONEXISTENT-0');
            });
        });

        describe('getChartData', () => {
            it('should fetch and transform chart reference data', async () => {
                const mockActiveSymbols = [
                    {
                        symbol: 'EURUSD',
                        display_name: 'EUR/USD',
                        market: 'forex',
                    },
                ];

                const mockTradingTimes = {
                    tradingTimes: {
                        EURUSD: {
                            open: ['00:00:00'],
                            close: ['23:59:59'],
                        },
                    },
                    raw: {},
                };

                mockServices.getActiveSymbols.mockResolvedValue(mockActiveSymbols);
                mockServices.getTradingTimes.mockResolvedValue(mockTradingTimes);

                const result = await adapter.getChartData();

                expect(mockServices.getActiveSymbols).toHaveBeenCalled();
                expect(mockServices.getTradingTimes).toHaveBeenCalled();
                expect(mockToJS).toHaveBeenCalledWith(mockActiveSymbols);
                expect(mockToJS).toHaveBeenCalledWith(mockTradingTimes.tradingTimes);

                expect(result.activeSymbols).toEqual([
                    {
                        symbol: 'EURUSD',
                        display_name: 'EUR/USD',
                        market: 'forex',
                        market_display_name: '',
                        subgroup: undefined,
                        subgroup_display_name: '',
                        submarket: undefined,
                        submarket_display_name: '',
                        symbol_type: '',
                        pip: 0.01,
                        exchange_is_open: 0,
                        is_trading_suspended: 0,
                    },
                ]);
                expect(result.tradingTimes).toEqual({
                    EURUSD: {
                        isOpen: true,
                        openTime: '00:00:00',
                        closeTime: '23:59:59',
                    },
                });
            });

            it('should handle errors gracefully', async () => {
                mockServices.getActiveSymbols.mockRejectedValue(new Error('API error'));
                mockServices.getTradingTimes.mockRejectedValue(new Error('API error'));

                const result = await adapter.getChartData();

                expect(result.activeSymbols).toEqual([]);
                expect(result.tradingTimes).toEqual({});
                expect(consoleSpy).toHaveBeenCalledWith(
                    '[Adapter] Error fetching chart reference data',
                    expect.any(Error)
                );
            });

            it('should handle non-array active symbols', async () => {
                mockServices.getActiveSymbols.mockResolvedValue(null);
                mockServices.getTradingTimes.mockResolvedValue({ tradingTimes: {}, raw: {} });

                const result = await adapter.getChartData();

                expect(result.activeSymbols).toEqual([]);
            });

            it('should handle missing trading times data', async () => {
                mockServices.getActiveSymbols.mockResolvedValue([]);
                mockServices.getTradingTimes.mockResolvedValue(null);

                const result = await adapter.getChartData();

                expect(result.tradingTimes).toEqual({});
            });
        });

        it('should expose transport, services, and config', () => {
            expect(adapter.transport).toBe(mockTransport);
            expect(adapter.services).toBe(mockServices);
            expect(adapter.config).toBe(config);
        });
    });

    describe('createSmartChartsChampionAdapter', () => {
        it('should create adapter with default config', () => {
            const adapter = createSmartChartsChampionAdapter();

            expect(adapter).toHaveProperty('getQuotes');
            expect(adapter).toHaveProperty('subscribeQuotes');
            expect(adapter).toHaveProperty('unsubscribeQuotes');
            expect(adapter).toHaveProperty('getChartData');
            expect(adapter).toHaveProperty('transport');
            expect(adapter).toHaveProperty('services');
            expect(adapter).toHaveProperty('config');
        });

        it('should create adapter with custom config', () => {
            const config = { debug: true };
            const adapter = createSmartChartsChampionAdapter(config);

            expect(adapter.config).toEqual(config);
        });

        it('should create services that delegate to underlying service', async () => {
            const adapter = createSmartChartsChampionAdapter();

            // Test that our adapter services are properly created
            expect(adapter.services).toHaveProperty('getActiveSymbols');
            expect(adapter.services).toHaveProperty('getTradingTimes');
            expect(typeof adapter.services.getActiveSymbols).toBe('function');
            expect(typeof adapter.services.getTradingTimes).toBe('function');
        });
    });

    describe('AdapterLogger', () => {
        it('should not log info/debug when debug is false', () => {
            const infoSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

            const adapter = buildSmartChartsChampionAdapter(mockTransport, mockServices, { debug: false });

            // Trigger some logging by calling methods
            adapter.getQuotes({ symbol: 'TEST', granularity: 0 });

            expect(infoSpy).not.toHaveBeenCalled();
            expect(debugSpy).not.toHaveBeenCalled();

            infoSpy.mockRestore();
            debugSpy.mockRestore();
        });

        it('should log info/debug when debug is true', async () => {
            const infoSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

            const adapter = buildSmartChartsChampionAdapter(mockTransport, mockServices, { debug: true });

            mockServices.getActiveSymbols.mockResolvedValue([]);
            mockServices.getTradingTimes.mockResolvedValue({ tradingTimes: {}, raw: {} });

            await adapter.getChartData();

            expect(infoSpy).toHaveBeenCalled();

            infoSpy.mockRestore();
            debugSpy.mockRestore();
        });

        it('should always log errors regardless of debug setting', async () => {
            const adapter = buildSmartChartsChampionAdapter(mockTransport, mockServices, { debug: false });

            mockTransport.send.mockRejectedValue(new Error('Test error'));

            await adapter.getQuotes({ symbol: 'TEST', granularity: 0 });

            // Error should be logged even when debug is false
            expect(consoleSpy).toHaveBeenCalled();
        });
    });
});
