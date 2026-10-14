import React from 'react';

import { renderHook } from '@testing-library/react-hooks';

import { APIContext } from '../APIProvider';
import { useRestAPI } from '../useRestAPI';

jest.mock('@deriv/shared', () => ({
    getAppId: jest.fn(() => '16929'),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useRestAPI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sessionStorage.clear();
    });

    const mockContextValue = {
        restAPIConfig: {
            baseUrl: 'https://api.test.com',
        },
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <APIContext.Provider value={mockContextValue as any}>{children}</APIContext.Provider>
    );

    it('should throw error when used outside APIProvider', () => {
        const { result } = renderHook(() => useRestAPI());

        expect(result.error).toEqual(Error('useRestAPI must be used within APIProvider'));
    });

    it('should return baseUrl from context', () => {
        const { result } = renderHook(() => useRestAPI(), { wrapper });

        expect(result.current.baseUrl).toBeDefined();
        expect(typeof result.current.baseUrl).toBe('string');
    });

    it('should return fetchREST function', () => {
        const { result } = renderHook(() => useRestAPI(), { wrapper });

        expect(result.current.fetchREST).toBeDefined();
        expect(typeof result.current.fetchREST).toBe('function');
    });

    describe('fetchREST', () => {
        it('should make GET request to correct URL', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-endpoint'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('should include Authorization header when token is present', async () => {
            sessionStorage.setItem(
                'auth_info',
                JSON.stringify({ access_token: 'test-token', expires_at: Date.now() + 60000 })
            );

            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

            const { result } = renderHook(() => useRestAPI(), { wrapper });
            await result.current.fetchREST('/test-endpoint');

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).toMatchObject({
                Authorization: 'Bearer test-token',
                'Deriv-App-ID': '16929',
            });
        });

        it('should not include Authorization header when no token', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

            const { result } = renderHook(() => useRestAPI(), { wrapper });
            await result.current.fetchREST('/test-endpoint');

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).not.toHaveProperty('Authorization');
        });

        it('should not set Content-Type header for GET requests', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint');

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).not.toHaveProperty('Content-Type');
        });

        it('should set Content-Type header for POST requests', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint', { method: 'POST' });

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).toHaveProperty('Content-Type', 'application/json');
        });

        it('should set Content-Type header for PUT requests', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint', { method: 'PUT' });

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).toHaveProperty('Content-Type', 'application/json');
        });

        it('should set Content-Type header for PATCH requests', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint', { method: 'PATCH' });

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).toHaveProperty('Content-Type', 'application/json');
        });

        it('should merge custom headers with default headers', async () => {
            const mockData = { data: 'test' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint', {
                method: 'POST',
                headers: {
                    'X-Custom-Header': 'custom-value',
                },
            });

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.headers).toMatchObject({
                'Content-Type': 'application/json',
                'X-Custom-Header': 'custom-value',
            });
        });

        it('should throw error when response is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => null,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await expect(result.current.fetchREST('/test-endpoint')).rejects.toThrow('REST API Error: 404 Not Found');
        });

        it('should throw error for 500 server error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => null,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await expect(result.current.fetchREST('/test-endpoint')).rejects.toThrow(
                'REST API Error: 500 Internal Server Error'
            );
        });

        it('should parse error body and use API error message', async () => {
            const errorBody = {
                errors: [
                    {
                        status: 401,
                        code: 'Unauthorized',
                        message: 'You are not authorised to access this resource',
                    },
                ],
                meta: {
                    endpoint: '/v1/options/account',
                    method: 'GET',
                    timing: 0,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => errorBody,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            try {
                await result.current.fetchREST('/test-endpoint');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toBe('You are not authorised to access this resource');
                expect(error.status).toBe(401);
                expect(error.statusText).toBe('Unauthorized');
                expect(error.code).toBe('Unauthorized');
                expect(error.isAuthError).toBe(true);
                expect(error.body).toEqual(errorBody);
            }
        });

        it('should mark 401 errors as auth errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({ errors: [{ status: 401, code: 'Unauthorized', message: 'Auth failed' }] }),
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            try {
                await result.current.fetchREST('/test-endpoint');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.isAuthError).toBe(true);
                expect(error.status).toBe(401);
            }
        });

        it('should mark 403 errors as auth errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: async () => ({ errors: [{ status: 403, code: 'Forbidden', message: 'Access denied' }] }),
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            try {
                await result.current.fetchREST('/test-endpoint');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.isAuthError).toBe(true);
                expect(error.status).toBe(403);
            }
        });

        it('should not mark non-auth errors as auth errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({ errors: [{ status: 500, code: 'ServerError', message: 'Server error' }] }),
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            try {
                await result.current.fetchREST('/test-endpoint');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.isAuthError).toBe(false);
                expect(error.status).toBe(500);
            }
        });

        it('should handle non-JSON error responses gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 502,
                statusText: 'Bad Gateway',
                json: async () => {
                    throw new Error('Not JSON');
                },
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            try {
                await result.current.fetchREST('/test-endpoint');
                fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toBe('REST API Error: 502 Bad Gateway');
                expect(error.status).toBe(502);
                expect(error.body).toBeNull();
            }
        });

        it('should return parsed JSON response', async () => {
            const mockData = { data: 'test', id: 123 };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            const response = await result.current.fetchREST('/test-endpoint');

            expect(response).toEqual(mockData);
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await expect(result.current.fetchREST('/test-endpoint')).rejects.toThrow('Network error');
        });

        it('should handle DELETE requests without Content-Type', async () => {
            const mockData = { success: true };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockData,
            });

            const { result } = renderHook(() => useRestAPI(), { wrapper });

            await result.current.fetchREST('/test-endpoint', { method: 'DELETE' });

            const fetchCall = mockFetch.mock.calls[0][1];
            expect(fetchCall.method).toBe('DELETE');
            expect(fetchCall.headers).not.toHaveProperty('Content-Type');
        });
    });
});
