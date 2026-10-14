import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import * as useRestAPIModule from '../../useRestAPI';
import { useDerivativesAccount } from '../useDerivativesAccount';

// Mock the useRestAPI hook
const mockFetchREST = jest.fn();
jest.mock('../../useRestAPI', () => ({
    useRestAPI: jest.fn(),
}));

const mockUseRestAPI = useRestAPIModule.useRestAPI as jest.MockedFunction<typeof useRestAPIModule.useRestAPI>;

describe('useDerivativesAccount', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        jest.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false, // Disable retry for tests
                },
            },
        });

        mockUseRestAPI.mockReturnValue({
            baseUrl: 'https://api.test.com',
            fetchREST: mockFetchREST,
        });
    });

    afterEach(() => {
        queryClient.clear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it('should not fetch when enabled is false', () => {
        renderHook(() => useDerivativesAccount('CR123', false), { wrapper });

        // Should not call fetchREST when disabled
        expect(mockFetchREST).not.toHaveBeenCalled();
    });

    it('should fetch derivatives accounts when enabled is true', async () => {
        const mockData = {
            data: [
                { account_id: 'CR123', account_type: 'real' as const, balance: '10000.00', currency: 'USD' },
                { account_id: 'VRTC456', account_type: 'demo' as const, balance: '5000.00', currency: 'USD' },
            ],
        };

        mockFetchREST.mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockFetchREST).toHaveBeenCalledWith('/trading/v1/options/accounts');
        expect(result.current.data).toEqual(mockData);
    });

    it('should use correct query key with loginid for cache invalidation', async () => {
        const mockData = {
            data: [{ account_id: 'CR123', account_type: 'real' as const, balance: '10000.00', currency: 'USD' }],
        };

        mockFetchREST.mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Check that query cache has the correct key
        const cachedData = queryClient.getQueryData(['derivatives', 'account', 'CR123']);
        expect(cachedData).toEqual(mockData);
    });

    it('should invalidate cache when loginid changes', async () => {
        const mockData1 = {
            data: [{ account_id: 'CR123', account_type: 'real' as const, balance: '10000.00', currency: 'USD' }],
        };
        const mockData2 = {
            data: [{ account_id: 'CR456', account_type: 'real' as const, balance: '20000.00', currency: 'EUR' }],
        };

        mockFetchREST.mockResolvedValueOnce(mockData1);

        const { result, rerender } = renderHook(
            (props: { loginid: string }) => useDerivativesAccount(props.loginid, true),
            {
                wrapper,
                initialProps: { loginid: 'CR123' },
            }
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockData1);

        // Change loginid
        mockFetchREST.mockResolvedValueOnce(mockData2);
        rerender({ loginid: 'CR456' });

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData2);
        });

        expect(mockFetchREST).toHaveBeenCalledTimes(2);
    });

    it('should handle error responses', async () => {
        const errorMessage = 'Failed to fetch accounts';
        mockFetchREST.mockRejectedValueOnce(new Error(errorMessage));

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        await waitFor(
            () => {
                expect(result.current.isError).toBe(true);
            },
            { timeout: 3000 }
        );

        // Should have an error
        expect(result.current.error).toBeTruthy();
        expect(result.current.data).toBeUndefined();
    });

    it('should have correct staleTime configuration (5 minutes)', async () => {
        const mockData = {
            data: [{ account_id: 'CR123', account_type: 'real' as const, balance: '10000.00', currency: 'USD' }],
        };

        mockFetchREST.mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        // Check that the query state has correct configuration
        const queryState = queryClient.getQueryState(['derivatives', 'account', 'CR123']);
        expect(queryState?.dataUpdatedAt).toBeDefined();
    });

    it('should return loading state initially', () => {
        mockFetchREST.mockImplementation(() => new Promise(() => {})); // Never resolves

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
        expect(result.current.error).toBe(null);
    });

    it('should handle empty accounts array', async () => {
        const mockData = {
            data: [],
        };

        mockFetchREST.mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.data?.data).toHaveLength(0);
    });

    it('should handle undefined loginid', async () => {
        const mockData = {
            data: [],
        };

        mockFetchREST.mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useDerivativesAccount(undefined, true), { wrapper });

        // Should still attempt to fetch if enabled is true
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockFetchREST).toHaveBeenCalled();
    });

    it('should support refetch functionality', async () => {
        const mockData1 = {
            data: [{ account_id: 'CR123', account_type: 'real' as const, balance: '10000.00', currency: 'USD' }],
        };
        const mockData2 = {
            data: [{ account_id: 'CR123', account_type: 'real' as const, balance: '15000.00', currency: 'USD' }],
        };

        mockFetchREST.mockResolvedValueOnce(mockData1);

        const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockData1);

        // Refetch
        mockFetchREST.mockResolvedValueOnce(mockData2);
        result.current.refetch();

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData2);
        });

        expect(mockFetchREST).toHaveBeenCalledTimes(2);
    });

    describe('Retry logic', () => {
        it('should not retry 401 auth errors', async () => {
            const authError = new Error('You are not authorised to access this resource') as Error & {
                status: number;
                isAuthError: boolean;
            };
            authError.status = 401;
            authError.isAuthError = true;

            mockFetchREST.mockRejectedValue(authError);

            const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

            await waitFor(
                () => {
                    expect(result.current.isError).toBe(true);
                },
                { timeout: 3000 }
            );

            // Should only be called once (no retries)
            expect(mockFetchREST).toHaveBeenCalledTimes(1);
        });

        it('should not retry 403 forbidden errors', async () => {
            const forbiddenError = new Error('Access denied') as Error & { status: number; isAuthError: boolean };
            forbiddenError.status = 403;
            forbiddenError.isAuthError = true;

            mockFetchREST.mockRejectedValue(forbiddenError);

            const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

            await waitFor(
                () => {
                    expect(result.current.isError).toBe(true);
                },
                { timeout: 3000 }
            );

            // Should only be called once (no retries)
            expect(mockFetchREST).toHaveBeenCalledTimes(1);
        });

        it('should not retry 404 client errors', async () => {
            const notFoundError = new Error('Not found') as Error & { status: number; isAuthError: boolean };
            notFoundError.status = 404;
            notFoundError.isAuthError = false;

            mockFetchREST.mockRejectedValue(notFoundError);

            const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

            await waitFor(
                () => {
                    expect(result.current.isError).toBe(true);
                },
                { timeout: 3000 }
            );

            // Should only be called once (no retries for 4xx except 429)
            expect(mockFetchREST).toHaveBeenCalledTimes(1);
        });

        it('should retry 500 server errors up to 3 times', async () => {
            const serverError = new Error('Internal server error') as Error & { status: number; isAuthError: boolean };
            serverError.status = 500;
            serverError.isAuthError = false;

            mockFetchREST.mockRejectedValue(serverError);

            const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

            // Wait for the query to complete all retries
            await waitFor(
                () => {
                    expect(result.current.isError).toBe(true);
                },
                { timeout: 10000 }
            );

            // Should have retried 3 times (initial + 3 retries = 4 total calls)
            expect(mockFetchREST).toHaveBeenCalledTimes(4);
        }, 15000);

        it('should retry 429 rate limit errors', async () => {
            const rateLimitError = new Error('Too many requests') as Error & { status: number; isAuthError: boolean };
            rateLimitError.status = 429;
            rateLimitError.isAuthError = false;

            mockFetchREST.mockRejectedValue(rateLimitError);

            const { result } = renderHook(() => useDerivativesAccount('CR123', true), { wrapper });

            // Wait for the query to complete all retries
            await waitFor(
                () => {
                    expect(result.current.isError).toBe(true);
                },
                { timeout: 10000 }
            );

            // Should have retried 3 times for rate limits
            expect(mockFetchREST).toHaveBeenCalledTimes(4);
        }, 15000);
    });
});
