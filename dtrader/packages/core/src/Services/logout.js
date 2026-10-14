import { removeCookies } from '@deriv/shared';

import WS from './ws-methods';

import { clearTokens } from './oauth';
import SocketCache from '_common/base/socket_cache';

/**
 * Log out via WebSocket { logout: 1 } message (v4), then clear all local state.
 * The function name is kept as requestRestLogout for backward compatibility with
 * client-store.js which calls it directly.
 */
export const requestRestLogout = async () => {
    try {
        // v4: server invalidates the session on receiving { logout: 1 }
        await WS.logout();
    } catch (e) {
        // Continue cleanup even if the WS call fails (e.g. already disconnected)
    }

    // Clear OAuth tokens
    clearTokens();

    // Clear all other auth-related storage
    removeCookies('affiliate_token', 'affiliate_tracking', 'onfido_token', 'gclid', 'utm_data');
    localStorage.removeItem('closed_toast_notifications');
    localStorage.removeItem('config.account1');
    localStorage.removeItem('config.tokens');
    localStorage.removeItem('verification_code.system_email_change');
    localStorage.removeItem('verification_code.request_email');
    localStorage.removeItem('new_email.system_email_change');
    localStorage.removeItem('active_loginid');
    localStorage.removeItem('active_user_id');
    localStorage.removeItem('current_account');

    // Write cross-tab logout sentinel — initStore.js storage listener picks this up
    localStorage.setItem('logout_event', String(Date.now()));

    SocketCache.clear();
    Object.keys(sessionStorage)
        .filter(key => key !== 'trade_store')
        .forEach(key => sessionStorage.removeItem(key));

    return { logout: 1 };
};
