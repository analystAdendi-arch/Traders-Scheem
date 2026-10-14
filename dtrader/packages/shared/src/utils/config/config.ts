/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged packages/shared/src/utils/config.js
 *
 */

import { getWebSocketURL } from '../brand';

/**
 * Gets account_type with priority: URL parameter > localStorage > default 'public'
 * @returns 'real', 'demo', or 'public'
 */
export const getAccountType = (): 'real' | 'demo' | 'public' => {
    const search = window.location.search;
    const search_params = new URLSearchParams(search);
    const accountTypeFromUrl = search_params.get('account_type');

    // First priority: URL parameter
    if (accountTypeFromUrl === 'real' || accountTypeFromUrl === 'demo') {
        window.localStorage.setItem('account_type', accountTypeFromUrl);

        // Remove account_type from URL after processing
        const url = new URL(window.location.href);
        if (url.searchParams.has('account_type')) {
            url.searchParams.delete('account_type');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }

        return accountTypeFromUrl;
    }

    // Second priority: localStorage
    const storedAccountType = window.localStorage.getItem('account_type');
    if (storedAccountType === 'real' || storedAccountType === 'demo') {
        return storedAccountType;
    }

    // Default to public when no account_type parameter or invalid value
    return 'public';
};

/**
 * Gets account_id with priority: URL parameter > localStorage > null
 * @returns account_id string or null
 */
export const getAccountId = (): string | null => {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const accountIdFromUrl = urlParams.get('account_id');

    if (accountIdFromUrl) {
        localStorage.setItem('account_id', accountIdFromUrl);
        // Remove from URL after storing
        const url = new URL(window.location.href);
        url.searchParams.delete('account_id');
        window.history.replaceState({}, document.title, url.pathname + url.search);
        return accountIdFromUrl;
    }

    // 2. Check localStorage
    return localStorage.getItem('account_id');
};

/**
 * Clears account_id from localStorage
 */
export const clearAccountId = (): void => {
    localStorage.removeItem('account_id');
};

/**
 * Gets the complete WebSocket URL with proper endpoint and query params
 * @returns Complete WebSocket URL
 */
export const getCompleteWebSocketURL = (): string => {
    const server = getSocketURL();
    const account_id = getAccountId();
    const account_type = getAccountType();

    // Only connect to demo/real if BOTH account_type and account_id are present
    // Otherwise, connect to public endpoint
    const shouldUseAuthenticatedEndpoint = account_id && (account_type === 'real' || account_type === 'demo');

    let url = `wss://${server}/${shouldUseAuthenticatedEndpoint ? account_type : 'public'}`;

    // Add account_id query param for authenticated endpoints (real/demo)
    if (shouldUseAuthenticatedEndpoint) {
        url += `?account_id=${account_id}`;
    }

    return url;
};

export const getSocketURL = () => {
    const local_storage_server_url = window.localStorage.getItem('config.server_url');
    if (local_storage_server_url) {
        // Validate it's a reasonable hostname (not a full URL, no protocol)
        if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(local_storage_server_url)) {
            return local_storage_server_url;
        }
        // Clear invalid value
        window.localStorage.removeItem('config.server_url');
    }

    // Get WebSocket server URL from brand config based on environment
    const server_url = getWebSocketURL();

    return server_url;
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};
