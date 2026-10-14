/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import { keepNavigationInside } from '@deriv/shared';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from 'App/app.jsx';
import initStore from 'App/initStore';
import AppNotificationMessages from './App/Containers/app-notification-messages.jsx';

// [VolaTrades] Inside VolaTrades, no link or window may lead to another site.
keepNavigationInside();

// [VolaTrades] No service worker in this build. It cached DTrader's code
// "cache first", and trader.js keeps the same name between deploys, so an
// installed worker kept serving an old trader - and it also controls the
// Manual Trader frame. Remove any worker an earlier visit installed.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
            registrations
                .filter(registration => registration.scope.includes('/dtrader/'))
                .forEach(registration => registration.unregister());
        })
        .catch(() => {
            /* nothing to clean up */
        });
}

const initApp = async () => {
    // For simplified authentication, we don't need to pass accounts to initStore
    // The authentication will be handled by temp-auth.js and client-store.js
    // initStore is now async to perform whoami check before WebSocket connection
    const root_store = await initStore(AppNotificationMessages);

    const wrapper = document.getElementById('derivatives_trader');
    if (wrapper) {
        const root = createRoot(wrapper);
        root.render(<App root_store={root_store} />);
    }
};

initApp();
