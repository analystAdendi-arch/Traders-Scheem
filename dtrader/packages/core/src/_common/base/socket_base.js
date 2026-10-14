const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');
const { getAccountType, cloneObject, State, getApiV4BaseUrl } = require('@deriv/shared');
const SocketCache = require('./socket_cache');
const APIMiddleware = require('./api_middleware');

/*
 * An abstraction layer over native javascript WebSocket,
 * which provides additional functionality like
 * reopen the closed connection and process the buffered requests
 */
const BinarySocketBase = (() => {
    let deriv_api, binary_socket, client_store;

    let config = {};
    let is_disconnect_called = false;
    let is_connected_before = false;
    let is_switching_socket = false;
    let reconnect_handlers = []; // Array to store multiple reconnection handlers
    let reconnect_attempt_count = 0; // Track number of reconnect attempts

    // v4: WS URL is set by client-store after fetching an OTP from the REST API.
    // null means unauthenticated — fall back to public endpoint built from brand.config.json.
    // Evaluated lazily (not at module load time) so window.location is available.
    const getPublicWSUrl = () => {
        const base = getApiV4BaseUrl(); // e.g. "https://api.derivws.com"
        return `${base.replace(/^https?:\/\//, 'wss://')}/trading/v1/options/ws/public`;
    };
    let configured_ws_url = null;

    const setWSUrl = url => {
        configured_ws_url = url;
        // Switching to an authenticated URL — treat the next onOpen as an initial connection
        // so setIsAuthorize(false) is called correctly regardless of prior public socket state.
        if (url) is_connected_before = false;
    };

    const getWSUrl = () => configured_ws_url;

    const availability = {
        is_up: true,
        is_updating: false,
        is_down: false,
    };

    const getSocketUrl = (is_mock_server = false) => {
        if (is_mock_server) {
            return 'ws://127.0.0.1:42069';
        }
        return configured_ws_url ?? getPublicWSUrl();
    };

    const isReady = () => hasReadyState(1);

    const isClose = () => !binary_socket || hasReadyState(2, 3);

    const blockRequest = value => deriv_api?.blockRequest(value);

    const close = () => {
        if (binary_socket) binary_socket.close();
    };

    const closeAndOpenNewConnection = () => {
        if (binary_socket) {
            close();
            is_switching_socket = true;
        }
        openNewConnection();
    };

    const handleAccountTypeChange = new_account_type => {
        const current_account_type = getAccountType();

        if (current_account_type !== new_account_type) {
            localStorage.setItem('account_type', new_account_type);
            closeAndOpenNewConnection();
        }
    };

    const hasReadyState = (...states) => binary_socket && states.some(s => binary_socket.readyState === s);

    const init = ({ options, client }) => {
        if (typeof options === 'object' && config !== options) {
            config = options;
        }
        client_store = client;
    };

    const getMockServerConfig = () => {
        const mock_server_config = localStorage.getItem('mock_server_data');
        return mock_server_config
            ? JSON.parse(mock_server_config)
            : {
                  session_id: '',
                  is_mockserver_enabled: false,
              };
    };

    const openNewConnection = () => {
        const mock_server_config = getMockServerConfig();
        const session_id = mock_server_config?.session_id || '';

        if (!is_switching_socket) config.wsEvent('init');

        if (isClose()) {
            is_disconnect_called = false;
            binary_socket = new WebSocket(getSocketUrl(session_id));

            // Add error event listener for connection failures
            binary_socket.addEventListener('error', error_event => {
                // eslint-disable-next-line no-console
                console.error('WebSocket error:', error_event);

                // Increment reconnect attempt counter
                reconnect_attempt_count++;

                // Throw error after 3 reconnect attempts
                if (reconnect_attempt_count >= 3 && typeof config.onConnectionError === 'function') {
                    config.onConnectionError(error_event);
                    reconnect_attempt_count = 0; // Reset counter after throwing error
                }
            });

            deriv_api = new DerivAPIBasic({
                connection: binary_socket,
                storage: SocketCache,
                middleware: new APIMiddleware(config),
            });
        }

        deriv_api.onOpen().subscribe(() => {
            config.wsEvent('open');

            // Reset reconnect attempt counter on successful connection
            reconnect_attempt_count = 0;

            // v4: auth is embedded in the OTP WS URL — no separate authorize message.
            // Balance subscription serves as auth confirmation (handled in socket-general.js).
            const is_authenticated = configured_ws_url && configured_ws_url !== getPublicWSUrl();

            if (is_authenticated) {
                // Only reset authorization state on initial connection, not on reconnection
                // On reconnection, user is still logged in and is_authorize should remain true
                // This allows stores' reaction() to work correctly on reconnection
                if (client_store && !is_connected_before) {
                    client_store.setIsAuthorize(false);
                }

                // Subscribe to balance immediately - this also confirms authorization
                subscribeBalance();

                // Call all reconnection handlers on reconnection (same timing as old system)
                // Subscriptions will be queued by deriv-api until authorization completes
                if (is_connected_before && reconnect_handlers.length > 0) {
                    reconnect_handlers.forEach(handler => {
                        if (typeof handler === 'function') {
                            handler();
                        }
                    });
                }
            }

            if (typeof config.onOpen === 'function') {
                config.onOpen(isReady());
            }

            if (!is_connected_before) {
                is_connected_before = true;
            }
        });

        deriv_api.onMessage().subscribe(({ data: response }) => {
            const msg_type = response.msg_type;
            State.set(['response', msg_type], cloneObject(response));

            config.wsEvent('message');

            if (typeof config.onMessage === 'function') {
                config.onMessage(response);
            }
        });

        deriv_api.onClose().subscribe(() => {
            if (!is_switching_socket) {
                config.wsEvent('close');
            } else {
                is_switching_socket = false;
            }

            if (typeof config.onDisconnect === 'function' && !is_disconnect_called) {
                config.onDisconnect();
                is_disconnect_called = true;
            }
        });
    };

    const isSiteUp = status => /^up$/i.test(status);

    const isSiteUpdating = status => /^updating$/i.test(status);

    const isSiteDown = status => /^down$/i.test(status);

    // if status is up or updating, consider site available
    // if status is down, consider site unavailable
    const setAvailability = status => {
        availability.is_up = isSiteUp(status);
        availability.is_updating = isSiteUpdating(status);
        availability.is_down = isSiteDown(status);
    };

    const excludeAuthorize = type => !(type === 'authorize' && !client_store.is_logged_in);

    const wait = (...responses) => deriv_api?.expectResponse(...responses.filter(excludeAuthorize));

    const subscribe = (request, cb) => deriv_api.subscribe(request).subscribe(cb, cb); // Delegate error handling to the callback

    const subscribeBalance = cb => subscribe({ balance: 1 }, cb);

    const subscribeProposal = (req, cb) => subscribe({ proposal: 1, ...req }, cb);

    const subscribeProposalOpenContract = (contract_id = null, cb) =>
        subscribe({ proposal_open_contract: 1, ...(contract_id && { contract_id }) }, cb);

    const subscribeTicks = (symbol, cb) => subscribe({ ticks: symbol }, cb);

    const subscribeTicksHistory = (request_object, cb) => subscribe(request_object, cb);

    const subscribeTransaction = cb => subscribe({ transaction: 1 }, cb);

    const getTicksHistory = request_object => deriv_api.send(request_object);

    const buyAndSubscribe = request => {
        return new Promise(resolve => {
            let called = false;
            const subscriber = subscribe(request, response => {
                if (!called) {
                    called = true;
                    subscriber.unsubscribe();
                    resolve(response);
                }
            });
        });
    };

    const buy = ({ proposal_id, price }) => deriv_api.send({ buy: proposal_id, price });

    const sell = (contract_id, bid_price) => deriv_api.send({ sell: contract_id, price: bid_price });

    // Cashier functionality has been removed

    const newAccountVirtual = (verification_code, client_password, residence, device_data) =>
        deriv_api.send({
            new_account_virtual: 1,
            verification_code,
            client_password,
            residence,
            ...device_data,
        });

    const setAccountCurrency = (currency, passthrough) =>
        deriv_api.send({
            set_account_currency: currency,
            ...(passthrough && { passthrough }),
        });

    const newAccountReal = values =>
        deriv_api.send({
            new_account_real: 1,
            ...values,
        });

    const newAccountRealMaltaInvest = values => deriv_api.send({ new_account_maltainvest: 1, ...values });

    const mt5NewAccount = values =>
        deriv_api.send({
            mt5_new_account: 1,
            ...values,
        });

    const getFinancialAssessment = () =>
        deriv_api.send({
            get_financial_assessment: 1,
        });

    const setFinancialAndTradingAssessment = payload => deriv_api.send({ set_financial_assessment: 1, ...payload });

    const profitTable = (limit, offset, date_boundaries) =>
        deriv_api.send({ profit_table: 1, description: 1, limit, offset, ...date_boundaries });

    const statement = (limit, offset, other_properties) =>
        deriv_api.send({ statement: 1, description: 1, limit, offset, ...other_properties });

    const tradingPlatformPasswordChange = payload =>
        deriv_api.send({
            trading_platform_password_change: 1,
            ...payload,
        });

    const tradingPlatformInvestorPasswordChange = payload =>
        deriv_api.send({
            trading_platform_investor_password_change: 1,
            ...payload,
        });

    const tradingPlatformInvestorPasswordReset = payload =>
        deriv_api.send({
            trading_platform_investor_password_reset: 1,
            ...payload,
        });

    const tradingPlatformPasswordReset = payload =>
        deriv_api.send({
            trading_platform_password_reset: 1,
            ...payload,
        });

    const tradingPlatformAvailableAccounts = platform =>
        deriv_api.send({
            trading_platform_available_accounts: 1,
            platform,
        });

    const paymentAgentList = (country, currency) =>
        deriv_api.send({ paymentagent_list: country, ...(currency && { currency }) });

    const allPaymentAgentList = country => deriv_api.send({ paymentagent_list: country });

    const paymentAgentDetails = (passthrough, req_id) =>
        deriv_api.send({ paymentagent_details: 1, passthrough, req_id });

    const paymentAgentWithdraw = ({ amount, currency, dry_run = 0, loginid, verification_code }) =>
        deriv_api.send({
            amount,
            currency,
            dry_run,
            paymentagent_loginid: loginid,
            paymentagent_withdraw: 1,
            verification_code,
        });

    // Crypto withdraw functionality has been removed

    const cryptoConfig = () =>
        deriv_api.send({
            crypto_config: 1,
        });

    const paymentAgentTransfer = ({ amount, currency, description, transfer_to, dry_run = 0 }) =>
        deriv_api.send({
            amount,
            currency,
            description,
            transfer_to,
            paymentagent_transfer: 1,
            dry_run,
        });

    const activeSymbols = (mode = 'brief') => deriv_api.activeSymbols(mode);

    const transferBetweenAccounts = (account_from, account_to, currency, amount) =>
        deriv_api.send({
            transfer_between_accounts: 1,
            accounts: 'all',
            ...(account_from && {
                account_from,
                account_to,
                currency,
                amount,
            }),
        });

    const forgetStream = id => deriv_api.forget(id);

    const contractUpdate = (contract_id, limit_order) =>
        deriv_api.send({
            contract_update: 1,
            contract_id,
            limit_order,
        });

    const contractUpdateHistory = contract_id =>
        deriv_api.send({
            contract_update_history: 1,
            contract_id,
        });

    const cancelContract = contract_id => deriv_api.send({ cancel: contract_id });

    const fetchLoginHistory = limit =>
        deriv_api.send({
            login_history: 1,
            limit,
        });

    // P2P functionality has been removed
    const accountStatistics = () => deriv_api.send({ account_statistics: 1 });

    const tradingServers = platform => deriv_api.send({ platform, trading_servers: 1 });

    const tradingPlatformNewAccount = values =>
        deriv_api.send({
            trading_platform_new_account: 1,
            ...values,
        });

    const triggerMt5DryRun = ({ email }) =>
        deriv_api.send({
            account_type: 'financial',
            dry_run: 1,
            email,
            leverage: 100,
            mainPassword: 'Test1234',
            mt5_account_type: 'financial_stp',
            mt5_new_account: 1,
            name: 'test real labuan financial stp',
        });

    const getPhoneSettings = () => deriv_api.send({ phone_settings: 1 });

    const getServiceToken = (platform, server) => {
        const temp_service = platform;

        return deriv_api.send({
            service_token: 1,
            service: temp_service,
            server,
        });
    };

    const changeEmail = api_request => deriv_api.send(api_request);

    return {
        init,
        openNewConnection,
        forgetStream,
        wait,
        availability,
        hasReadyState,
        isSiteDown,
        isSiteUpdating,
        clear: () => {
            // do nothing.
        },
        sendBuffered: () => {
            // do nothing.
        },
        getSocket: () => binary_socket,
        get: () => deriv_api,
        getAvailability: () => availability,
        setOnDisconnect: onDisconnect => {
            config.onDisconnect = onDisconnect;
        },
        setOnReconnect: onReconnect => {
            // Add handler to array if it's not already there
            if (typeof onReconnect === 'function' && !reconnect_handlers.includes(onReconnect)) {
                reconnect_handlers.push(onReconnect);
            }
        },
        removeOnReconnect: onReconnect => {
            // If a specific handler is provided, remove only that one
            if (typeof onReconnect === 'function') {
                const index = reconnect_handlers.indexOf(onReconnect);
                if (index > -1) {
                    reconnect_handlers.splice(index, 1);
                }
            } else {
                // If no handler provided, clear all handlers (backward compatibility)
                reconnect_handlers = [];
            }
        },
        removeOnDisconnect: () => {
            delete config.onDisconnect;
        },
        cache: delegateToObject({}, () => deriv_api.cache),
        storage: delegateToObject({}, () => deriv_api.storage),
        blockRequest,
        buy,
        buyAndSubscribe,
        sell,
        cancelContract,
        close,
        cryptoConfig,
        contractUpdate,
        contractUpdateHistory,
        getFinancialAssessment,
        setFinancialAndTradingAssessment,
        mt5NewAccount,
        newAccountVirtual,
        newAccountReal,
        newAccountRealMaltaInvest,
        getPhoneSettings,
        profitTable,
        statement,
        getTicksHistory,
        tradingPlatformPasswordChange,
        tradingPlatformPasswordReset,
        tradingPlatformAvailableAccounts,
        tradingPlatformInvestorPasswordChange,
        tradingPlatformInvestorPasswordReset,
        activeSymbols,
        paymentAgentList,
        allPaymentAgentList,
        paymentAgentDetails,
        paymentAgentWithdraw,
        paymentAgentTransfer,
        setAccountCurrency,
        setAvailability,
        subscribeBalance,
        subscribeProposal,
        subscribeProposalOpenContract,
        subscribeTicks,
        subscribeTicksHistory,
        subscribeTransaction,
        transferBetweenAccounts,
        fetchLoginHistory,
        closeAndOpenNewConnection,
        handleAccountTypeChange,
        accountStatistics,
        tradingServers,
        tradingPlatformNewAccount,
        triggerMt5DryRun,
        getServiceToken,
        changeEmail,
        setWSUrl,
        getWSUrl,
        getPublicWSUrl,
    };
})();

function delegateToObject(base_obj, extending_obj_getter) {
    return new Proxy(base_obj, {
        get(target, field) {
            if (target[field]) return target[field];

            const extending_obj =
                typeof extending_obj_getter === 'function' ? extending_obj_getter() : extending_obj_getter;

            if (!extending_obj) return undefined;

            const value = extending_obj[field];
            if (value) {
                if (typeof value === 'function') {
                    return value.bind(extending_obj);
                }
                return value;
            }

            return undefined;
        },
    });
}

const proxied_socket_base = delegateToObject(BinarySocketBase, () => BinarySocketBase.get());

const proxyForAuthorize = obj =>
    new Proxy(obj, {
        get(target, field) {
            if (target[field] && typeof target[field] !== 'function') {
                return proxyForAuthorize(target[field]);
            }
            return (...args) => {
                // Wait for balance response instead of authorize (balance serves as auth confirmation).
                // In v4 the OTP URL embeds auth — balance confirms the session is live.
                // Access configured_ws_url via the IIFE-exposed getter rather than direct closure reference.
                const current_ws_url = BinarySocketBase.getWSUrl?.();
                if (current_ws_url && current_ws_url !== BinarySocketBase.getPublicWSUrl?.()) {
                    return BinarySocketBase?.wait('balance')?.then(() => target[field](...args));
                }
                // Not authenticated — execute without waiting
                return target[field](...args);
            };
        },
    });

BinarySocketBase.authorized = proxyForAuthorize(proxied_socket_base);

module.exports = proxied_socket_base;
