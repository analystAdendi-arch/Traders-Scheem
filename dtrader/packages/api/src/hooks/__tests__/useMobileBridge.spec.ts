import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMobileBridge } from '../useMobileBridge';

// Mock console.error and console.warn to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

interface TestResult {
    sendBridgeEvent?: (
        event:
            | 'trading:config'
            | 'trading:ready'
            | 'trading:back'
            | 'trading:home'
            | 'trading:transfer'
            | 'trading:account_creation',
        data?: TradingConfigData,
        fallback?: () => void | Promise<void>
    ) => Promise<boolean>;
    isBridgeAvailable?: boolean;
    sendResult?: boolean;
    fallbackCalled?: number;
}

// Test component to test the hook
const TestComponent = ({ onResult }: { onResult: (result: TestResult) => void }) => {
    const hookResult = useMobileBridge();

    React.useEffect(() => {
        onResult(hookResult);
    }, [hookResult, onResult]);

    return React.createElement(
        'div',
        null,
        React.createElement(
            'button',
            {
                'data-testid': 'test-bridge-available',
                onClick: () => onResult({ isBridgeAvailable: hookResult.isBridgeAvailable }),
            },
            'Test Bridge Available'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-back',
                onClick: async () => {
                    const result = await hookResult.sendBridgeEvent('trading:back');
                    onResult({ sendResult: result });
                },
            },
            'Test Send Back'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-home',
                onClick: async () => {
                    const result = await hookResult.sendBridgeEvent('trading:home');
                    onResult({ sendResult: result });
                },
            },
            'Test Send Home'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-ready',
                onClick: async () => {
                    const result = await hookResult.sendBridgeEvent('trading:ready');
                    onResult({ sendResult: result });
                },
            },
            'Test Send Ready'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-with-fallback',
                onClick: async () => {
                    const mockFallback = jest.fn();
                    const result = await hookResult.sendBridgeEvent('trading:back', mockFallback);
                    onResult({ sendResult: result, fallbackCalled: mockFallback.mock.calls.length });
                },
            },
            'Test Send With Fallback'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-transfer',
                onClick: async () => {
                    const result = await hookResult.sendBridgeEvent('trading:transfer');
                    onResult({ sendResult: result });
                },
            },
            'Test Send Transfer'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-account-creation',
                onClick: async () => {
                    const result = await hookResult.sendBridgeEvent('trading:account_creation');
                    onResult({ sendResult: result });
                },
            },
            'Test Send Account Creation'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-transfer-with-fallback',
                onClick: async () => {
                    const mockFallback = jest.fn();
                    const result = await hookResult.sendBridgeEvent('trading:transfer', mockFallback);
                    onResult({ sendResult: result, fallbackCalled: mockFallback.mock.calls.length });
                },
            },
            'Test Send Transfer With Fallback'
        ),
        React.createElement(
            'button',
            {
                'data-testid': 'test-send-config-with-data',
                onClick: async () => {
                    const result = await hookResult.sendBridgeEvent('trading:config', {
                        lang: 'EN',
                        theme: 'dark',
                    });
                    onResult({ sendResult: result });
                },
            },
            'Test Send Config With Data'
        )
    );
};

describe('useMobileBridge', () => {
    let testResult: TestResult = {};
    const onResult = jest.fn((result: TestResult) => {
        testResult = { ...testResult, ...result };
    });

    beforeEach(() => {
        jest.clearAllMocks();
        testResult = {};
        // Clear sessionStorage
        sessionStorage.clear();
        // Reset location to default (no query params)
        delete (window as any).location;
        (window as any).location = { search: '' };
        // Clear DerivAppChannel
        delete (window as any).DerivAppChannel;
        mockConsoleError.mockClear();
        mockConsoleWarn.mockClear();
    });

    afterAll(() => {
        mockConsoleError.mockRestore();
        mockConsoleWarn.mockRestore();
    });

    describe('isBridgeAvailable', () => {
        it('should return true when is_mobile_app query param is present and DerivAppChannel exists', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            // Mock DerivAppChannel
            const mockPostMessage = jest.fn();
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            // Wait for hook to detect bridge
            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );
        });

        it('should poll and set true when DerivAppChannel is injected after mount', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            render(React.createElement(TestComponent, { onResult }));

            // Initially false (no bridge yet)
            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(false);
                },
                { timeout: 200 }
            );

            // Inject bridge after delay (simulating native app delay)
            const mockPostMessage = jest.fn();
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            // Wait for hook to detect bridge (polling interval is 100ms)
            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 500 }
            );
        });

        it('should warn after 5 seconds if DerivAppChannel never appears', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            render(React.createElement(TestComponent, { onResult }));

            // Wait for warning after 5 seconds
            await waitFor(
                () => {
                    expect(mockConsoleWarn).toHaveBeenCalledWith(
                        '[useMobileBridge] DerivAppChannel not found after 5 seconds'
                    );
                },
                { timeout: 6000 }
            );

            const button = screen.getByTestId('test-bridge-available');
            await userEvent.click(button);
            expect(testResult.isBridgeAvailable).toBe(false);
        }, 7000); // Increase test timeout to 7 seconds

        it('should return false when query param is not present', async () => {
            // No query param
            delete (window as any).location;
            (window as any).location = { search: '' };

            render(React.createElement(TestComponent, { onResult }));

            const button = screen.getByTestId('test-bridge-available');
            await userEvent.click(button);

            expect(testResult.isBridgeAvailable).toBe(false);
        });

        it('should persist value in sessionStorage when query param is present', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            // Mock DerivAppChannel
            const mockPostMessage = jest.fn();
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            // Verify it was stored in sessionStorage
            expect(sessionStorage.getItem('is_mobile_app')).toBe('true');
        });

        it('should read from sessionStorage when query param is removed', async () => {
            // Pre-populate sessionStorage (simulating previous visit with query param)
            sessionStorage.setItem('is_mobile_app', 'true');

            // Mock URL without query parameter (simulating param removal)
            delete (window as any).location;
            (window as any).location = { search: '' };

            // Mock DerivAppChannel
            const mockPostMessage = jest.fn();
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );
        });
    });

    describe('sendBridgeEvent', () => {
        it('should send trading:back event when bridge is available', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            // Wait for bridge to be detected
            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-back');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'trading:back' }));
        });

        it('should send trading:home event when bridge is available', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-home');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'trading:home' }));
        });

        it('should send trading:ready event when bridge is available', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-ready');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'trading:ready' }));
        });

        it('should execute fallback when bridge is not available', async () => {
            // No DerivAppChannel
            render(React.createElement(TestComponent, { onResult }));

            const button = screen.getByTestId('test-send-with-fallback');
            await userEvent.click(button);

            await waitFor(() => {
                expect(testResult.sendResult).toBe(true);
                expect(testResult.fallbackCalled).toBe(1);
            });
        });

        it('should return false when no bridge and no fallback', async () => {
            // No DerivAppChannel
            render(React.createElement(TestComponent, { onResult }));

            const button = screen.getByTestId('test-send-back');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(false);
        });

        it('should handle bridge errors and execute fallback', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn(() => {
                throw new Error('Bridge error');
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-with-fallback');
            await userEvent.click(button);

            await waitFor(() => {
                expect(testResult.sendResult).toBe(true);
                expect(testResult.fallbackCalled).toBe(1);
            });

            expect(mockPostMessage).toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[useMobileBridge] Failed to send trading:back:',
                expect.any(Error)
            );
        });

        it('should handle bridge errors without fallback', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };
            const mockPostMessage = jest.fn(() => {
                throw new Error('Bridge error');
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-back');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(false);
            expect(mockPostMessage).toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[useMobileBridge] Failed to send trading:back:',
                expect.any(Error)
            );
        });

        it('should send trading:transfer event when bridge is available', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-transfer');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'trading:transfer' }));
        });

        it('should send trading:account_creation event when bridge is available', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-account-creation');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'trading:account_creation' }));
        });

        it('should execute fallback for trading:transfer when bridge is not available', async () => {
            // No DerivAppChannel
            render(React.createElement(TestComponent, { onResult }));

            const button = screen.getByTestId('test-send-transfer-with-fallback');
            await userEvent.click(button);

            await waitFor(() => {
                expect(testResult.sendResult).toBe(true);
                expect(testResult.fallbackCalled).toBe(1);
            });
        });

        it('should handle trading:transfer with fallback on bridge error', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn(() => {
                throw new Error('Bridge error');
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-transfer-with-fallback');
            await userEvent.click(button);

            await waitFor(() => {
                expect(testResult.sendResult).toBe(true);
                expect(testResult.fallbackCalled).toBe(1);
            });

            expect(mockPostMessage).toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[useMobileBridge] Failed to send trading:transfer:',
                expect.any(Error)
            );
        });

        it('should send trading:config event with data when bridge is available', async () => {
            // Mock query parameter
            delete (window as any).location;
            (window as any).location = { search: '?is_mobile_app=true' };

            const mockPostMessage = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).DerivAppChannel = {
                postMessage: mockPostMessage,
            };

            render(React.createElement(TestComponent, { onResult }));

            await waitFor(
                () => {
                    expect(testResult.isBridgeAvailable).toBe(true);
                },
                { timeout: 1000 }
            );

            const button = screen.getByTestId('test-send-config-with-data');
            await userEvent.click(button);

            expect(testResult.sendResult).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith(
                JSON.stringify({
                    event: 'trading:config',
                    data: { lang: 'EN', theme: 'dark' },
                })
            );
        });
    });
});
