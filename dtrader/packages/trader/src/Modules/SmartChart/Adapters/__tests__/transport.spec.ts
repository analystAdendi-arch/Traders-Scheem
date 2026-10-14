import { WS } from '@deriv/shared';

import { createTransport } from '../transport';

// Mock the WS module
jest.mock('@deriv/shared', () => ({
    WS: {
        subscribeTicksHistory: jest.fn(() => ({
            unsubscribe: jest.fn(),
        })),
        storage: {
            send: jest.fn(),
        },
    },
}));

const mockWS = WS as jest.Mocked<typeof WS>;

describe('SmartChart Adapters - Transport', () => {
    let transport: ReturnType<typeof createTransport>, consoleSpy: jest.SpyInstance, warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        transport = createTransport({ debug: false });

        // Mock console methods to avoid noise in tests
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        warnSpy.mockRestore();
    });

    describe('createTransport', () => {
        it('should create transport instance with default config', () => {
            const defaultTransport = createTransport();
            expect(defaultTransport).toHaveProperty('send');
            expect(defaultTransport).toHaveProperty('subscribe');
            expect(defaultTransport).toHaveProperty('unsubscribe');
            expect(defaultTransport).toHaveProperty('unsubscribeAll');
        });

        it('should create transport instance with debug config', () => {
            const debugTransport = createTransport({ debug: true });
            expect(debugTransport).toHaveProperty('send');
            expect(debugTransport).toHaveProperty('subscribe');
            expect(debugTransport).toHaveProperty('unsubscribe');
            expect(debugTransport).toHaveProperty('unsubscribeAll');
        });

        it('should create transport instance with custom timeout', () => {
            const customTransport = createTransport({ timeout: 5000 });
            expect(customTransport).toHaveProperty('send');
            expect(customTransport).toHaveProperty('subscribe');
            expect(customTransport).toHaveProperty('unsubscribe');
            expect(customTransport).toHaveProperty('unsubscribeAll');
        });
    });

    describe('send', () => {
        it('should send request successfully', async () => {
            const mockRequest = { active_symbols: 'brief' };
            const mockResponse = { active_symbols: [] };

            mockWS.storage.send.mockResolvedValue(mockResponse);

            const result = await transport.send(mockRequest);

            expect(mockWS.storage.send).toHaveBeenCalledWith(mockRequest);
            expect(result).toBe(mockResponse);
        });

        it('should handle request timeout', async () => {
            const mockRequest = { active_symbols: 'brief' };
            const timeoutTransport = createTransport({ timeout: 100 });

            // Mock a request that takes longer than timeout
            mockWS.storage.send.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));

            await expect(timeoutTransport.send(mockRequest)).rejects.toThrow('Request timeout after 100ms');
        });

        it('should handle request errors', async () => {
            const mockRequest = { active_symbols: 'brief' };
            const error = new Error('Network error');

            mockWS.storage.send.mockRejectedValue(error);

            await expect(transport.send(mockRequest)).rejects.toThrow('Network error');
            expect(consoleSpy).toHaveBeenCalledWith('[Transport] Request failed', { request: mockRequest, error });
        });
    });

    describe('subscribe', () => {
        it('should subscribe to ticks history with subscribe flag', () => {
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = { unsubscribe: jest.fn() };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            const result = transport.subscribe(mockRequest, mockCallback);

            expect(mockWS.subscribeTicksHistory).toHaveBeenCalledWith(mockRequest, expect.any(Function));
            expect(result).toMatch(/^EURUSD-\d+$/);
        });

        it('should handle callback errors gracefully', () => {
            const mockCallback = jest.fn(() => {
                throw new Error('Callback error');
            });
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = { unsubscribe: jest.fn() };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            // Get the wrapped callback that WS.subscribeTicksHistory receives
            transport.subscribe(mockRequest, mockCallback);
            const wrappedCallback = mockWS.subscribeTicksHistory.mock.calls[0][1];

            // Call the wrapped callback with test data
            expect(() => wrappedCallback({ test: 'data' })).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('[Transport] Error processing tick data', expect.any(Object));
        });

        it('should use fallback subscription for non-ticks_history requests', () => {
            const mockCallback = jest.fn();
            const mockRequest = {
                proposal: 1,
                amount: 10,
                basis: 'stake',
            };

            const result = transport.subscribe(mockRequest, mockCallback);

            expect(warnSpy).toHaveBeenCalledWith('[Transport] Using fallback subscription method', {
                request: mockRequest,
            });
            expect(result).toMatch(/^unknown-\d+$/);
        });

        it('should handle subscription creation errors', () => {
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            mockWS.subscribeTicksHistory.mockImplementation(() => {
                throw new Error('Subscription failed');
            });

            expect(() => transport.subscribe(mockRequest, mockCallback)).toThrow('Subscription failed');
            expect(consoleSpy).toHaveBeenCalledWith('[Transport] Failed to create subscription', expect.any(Object));
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe from active subscription successfully', () => {
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = { unsubscribe: jest.fn() };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            // First create a subscription
            const subscriptionId = transport.subscribe(mockRequest, mockCallback);

            // Then unsubscribe
            transport.unsubscribe(subscriptionId);

            expect(mockSubscriber.unsubscribe).toHaveBeenCalled();
        });

        it('should handle unsubscribe from non-existent subscription', () => {
            const subscriptionId = 'non-existent-123';

            // Should not throw
            expect(() => transport.unsubscribe(subscriptionId)).not.toThrow();
            expect(warnSpy).toHaveBeenCalledWith('[Transport] Subscription not found for unsubscribe', {
                subscriptionId,
            });
        });

        it('should handle unsubscribe errors gracefully', () => {
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = {
                unsubscribe: jest.fn(() => {
                    throw new Error('Unsubscribe failed');
                }),
            };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            // First create a subscription
            const subscriptionId = transport.subscribe(mockRequest, mockCallback);

            // Then unsubscribe (should handle error gracefully)
            expect(() => transport.unsubscribe(subscriptionId)).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('[Transport] Error during unsubscribe', expect.any(Object));
        });
    });

    describe('unsubscribeAll', () => {
        it('should unsubscribe from all active subscriptions', () => {
            const mockCallback = jest.fn();
            const mockSubscriber1 = { unsubscribe: jest.fn() };
            const mockSubscriber2 = { unsubscribe: jest.fn() };

            mockWS.subscribeTicksHistory.mockReturnValueOnce(mockSubscriber1).mockReturnValueOnce(mockSubscriber2);

            // Create multiple subscriptions
            const sub1 = transport.subscribe({ ticks_history: 'EURUSD', subscribe: 1 }, mockCallback);
            const sub2 = transport.subscribe({ ticks_history: 'GBPUSD', subscribe: 1 }, mockCallback);

            // Unsubscribe from all
            transport.unsubscribeAll();

            expect(mockSubscriber1.unsubscribe).toHaveBeenCalled();
            expect(mockSubscriber2.unsubscribe).toHaveBeenCalled();
        });

        it('should unsubscribe from specific message type only', () => {
            const mockCallback = jest.fn();
            const mockSubscriber1 = { unsubscribe: jest.fn() };
            const mockSubscriber2 = { unsubscribe: jest.fn() };

            mockWS.subscribeTicksHistory.mockReturnValueOnce(mockSubscriber1).mockReturnValueOnce(mockSubscriber2);

            // Create subscriptions with different message types
            const sub1 = transport.subscribe({ ticks_history: 'EURUSD', subscribe: 1 }, mockCallback);
            const sub2 = transport.subscribe({ proposal: 1, amount: 10 }, mockCallback);

            // Unsubscribe from ticks_history only
            transport.unsubscribeAll('ticks_history');

            expect(mockSubscriber1.unsubscribe).toHaveBeenCalled();
            // Second subscription should not be unsubscribed as it's not ticks_history
        });

        it('should handle errors during bulk unsubscribe', () => {
            const mockCallback = jest.fn();
            const mockSubscriber = {
                unsubscribe: jest.fn(() => {
                    throw new Error('Bulk unsubscribe failed');
                }),
            };

            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            // Create a subscription
            transport.subscribe({ ticks_history: 'EURUSD', subscribe: 1 }, mockCallback);

            // Unsubscribe all (should handle error gracefully and not throw)
            expect(() => transport.unsubscribeAll()).not.toThrow();
        });
    });

    describe('debug logging', () => {
        it('should not log debug messages when debug is false', () => {
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
            const infoSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = { unsubscribe: jest.fn() };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            transport.subscribe(mockRequest, mockCallback);

            // When debug is false, info logs should NOT happen, and debug logs should not happen
            expect(infoSpy).not.toHaveBeenCalled(); // Info logs only happen when debug=true
            expect(debugSpy).not.toHaveBeenCalled(); // Debug logs should not happen when debug=false
            debugSpy.mockRestore();
            infoSpy.mockRestore();
        });

        it('should log debug messages when debug is true', () => {
            const debugTransport = createTransport({ debug: true });
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = { unsubscribe: jest.fn() };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            const subscriptionId = debugTransport.subscribe(mockRequest, mockCallback);
            debugTransport.unsubscribe(subscriptionId);

            // Debug logs should be called when debug is enabled
            expect(debugSpy).toHaveBeenCalled();
            debugSpy.mockRestore();
        });
    });

    describe('subscription manager integration', () => {
        it('should track subscription count correctly', () => {
            const mockCallback = jest.fn();
            const mockSubscriber1 = { unsubscribe: jest.fn() };
            const mockSubscriber2 = { unsubscribe: jest.fn() };

            mockWS.subscribeTicksHistory.mockReturnValueOnce(mockSubscriber1).mockReturnValueOnce(mockSubscriber2);

            // Create multiple subscriptions
            const sub1 = transport.subscribe({ ticks_history: 'EURUSD', subscribe: 1 }, mockCallback);
            const sub2 = transport.subscribe({ ticks_history: 'GBPUSD', subscribe: 1 }, mockCallback);

            // Unsubscribe one
            transport.unsubscribe(sub1);

            // Unsubscribe all remaining
            transport.unsubscribeAll();

            // Should handle all operations without errors
            expect(mockSubscriber1.unsubscribe).toHaveBeenCalledTimes(1); // Called once during individual unsubscribe
            expect(mockSubscriber2.unsubscribe).toHaveBeenCalledTimes(1); // Called once during unsubscribeAll
        });

        it('should handle subscription with callback wrapper', () => {
            const mockCallback = jest.fn();
            const mockRequest = {
                ticks_history: 'EURUSD',
                subscribe: 1,
                end: 'latest',
                count: 1000,
            };

            const mockSubscriber = { unsubscribe: jest.fn() };
            mockWS.subscribeTicksHistory.mockReturnValue(mockSubscriber);

            transport.subscribe(mockRequest, mockCallback);

            // Get the wrapped callback and test it
            const wrappedCallback = mockWS.subscribeTicksHistory.mock.calls[0][1];
            const testResponse = { tick: { symbol: 'EURUSD', quote: 1.1234 } };

            wrappedCallback(testResponse);

            expect(mockCallback).toHaveBeenCalledWith(testResponse);
        });
    });
});
