import { getPropertyValue, getSocketURL, isEmbedded, mapErrorMessage } from '@deriv/shared';
import { localize } from '@deriv-com/translations';

import { clearTokens, redirectToOAuthLogin } from './oauth';
import WS from './ws-methods';

import ServerTime from '_common/base/server_time';
import BinarySocket from '_common/base/socket_base';

let client_store, common_store;

// TODO: update commented statements to the corresponding functions from app
const BinarySocketGeneral = (() => {
    // Removed session management variables - not needed for trading app

    let responseTimeoutErrorTimer = null;

    const onDisconnect = () => {
        clearTimeout(responseTimeoutErrorTimer);
        common_store.setIsSocketOpened(false);
    };

    const onConnectionError = () => {
        // [VolaTrades] Embedded, the selected account is VolaTrades' setting.
        if (!isEmbedded()) localStorage.removeItem('active_loginid');

        common_store.setError(true, {
            message: localize('Connection failed. Please refresh this page to continue.'),
        });
    };

    const onOpen = is_ready => {
        responseTimeoutErrorTimer = setTimeout(() => {
            const expectedResponseTypes = WS?.get?.()?.expect_response_types || {};
            const pendingResponseTypes = Object.keys(expectedResponseTypes).filter(
                key => expectedResponseTypes[key].state === 'pending'
            );

            const error = new Error('deriv-api: no message received after 30s');
            error.userId = client_store?.loginid;

            // eslint-disable-next-line no-console
            console.error(error.message, { websocketUrl: getSocketURL(), pendingResponseTypes });
        }, 30000);

        if (is_ready) {
            ServerTime.init(() => common_store.setServerTime(ServerTime.get()));
            common_store.setIsSocketOpened(true);
        }
    };

    const onMessage = response => {
        clearTimeout(responseTimeoutErrorTimer);
        handleError(response);

        switch (response.msg_type) {
            case 'balance':
                if (response.balance && response.balance.loginid) {
                    if (!client_store.is_authorize) {
                        // First balance after (re)connect — use it as auth confirmation
                        authorizeAccount(response);
                    } else {
                        // Subsequent balance updates — just update the balance
                        ResponseHandlers.balanceActiveAccount(response);
                    }
                }
                break;
            // no default
        }
    };

    const setBalanceActiveAccount = obj_balance => {
        client_store.setBalanceActiveAccount(obj_balance);
    };

    const handleError = response => {
        const msg_type = response.msg_type;
        const error_code = getPropertyValue(response, ['error', 'code']);
        switch (error_code) {
            case 'WrongResponse':
                if (msg_type === 'balance') {
                    WS.forgetAll('balance').then(subscribeBalance);
                }
                break;
            case 'RateLimit':
                common_store.setError(true, {
                    message: localize('You have reached the rate limit of requests per second. Please try later.'),
                });
                break;
            case 'InvalidAppID':
                common_store.setError(true, { message: mapErrorMessage(response.error) });
                break;
            case 'DisabledClient':
                common_store.setError(true, { message: mapErrorMessage(response.error) });
                break;
            case 'AuthorizationRequired': {
                if (msg_type === 'buy') {
                    return;
                }
                client_store.logout();
                break;
            }
            case 'InvalidToken': {
                // Do NOT reload — that causes an infinite loop when the token is gone.
                // Instead clear tokens and redirect to a fresh OAuth login.
                clearTokens();
                redirectToOAuthLogin();
                break;
            }
            default:
                break;
        }
    };

    const init = store => {
        client_store = store.client;
        common_store = store.common;

        return {
            onDisconnect,
            onOpen,
            onMessage,
            onConnectionError,
        };
    };

    const subscribeBalance = () => {
        WS.subscribeBalance(ResponseHandlers.balanceActiveAccount);
    };

    const authorizeAccount = response => {
        // Balance response now contains authorization data
        // Transform if needed to match authorize format
        let authorize_data = response;

        // If response is balance format, transform to authorize format
        if (response.balance && !response.authorize) {
            // The v4 balance response only contains financial fields.
            // Fall back to active_loginid as user_id so active_user_id is never empty.
            const fallback_user_id =
                response.balance.user_id ||
                sessionStorage.getItem('active_loginid') ||
                localStorage.getItem('active_loginid') ||
                '';
            authorize_data = {
                authorize: {
                    loginid: response.balance.loginid,
                    balance: response.balance.balance,
                    currency: response.balance.currency,
                    email: response.balance.email || '',
                    landing_company_name: response.balance.landing_company_name || '',
                    country: response.balance.country || '',
                    user_id: fallback_user_id,
                    preferred_language: response.balance.preferred_language || '',
                },
            };
        }

        client_store.responseAuthorize(authorize_data);
        client_store.setIsAuthorize(true); // Set BEFORE anything that depends on it
        BinarySocket.sendBuffered(); // Now buffered calls see is_authorize = true
    };

    return {
        init,
        setBalanceActiveAccount,
        authorizeAccount,
    };
})();

export default BinarySocketGeneral;

const ResponseHandlers = (() => {
    const balanceActiveAccount = response => {
        if (!response.error) {
            const balance = response.balance?.balance || response.balance;
            if (balance !== undefined && balance !== null && balance !== '') {
                BinarySocketGeneral.setBalanceActiveAccount({
                    balance,
                    loginid: client_store?.loginid,
                });
            }
        }
    };

    return {
        balanceActiveAccount,
    };
})();
