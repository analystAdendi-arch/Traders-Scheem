import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import PropTypes from 'prop-types';

import { APIProvider, useMobileBridge } from '@deriv/api';
import { Loading } from '@deriv/components';
import { initFormErrorMessages, setUrlLanguage, setWebsocket } from '@deriv/shared';
import { StoreProvider } from '@deriv/stores';
import { BreakpointProvider } from '@deriv-com/quill-ui';
import { getInitialLanguage, initializeI18n, TranslationProvider } from '@deriv-com/translations';

import { clearTokens, exchangeCodeForToken } from 'Services/oauth';
import WS from 'Services/ws-methods';

import { FORM_ERROR_MESSAGES } from '../Constants/form-error-messages';

import AppContent from './AppContent';

import 'Sass/app.scss';

const App = ({ root_store }) => {
    const i18nInstance = initializeI18n({
        cdnUrl: process.env.TRANSLATIONS_CDN_URL || '',
    });
    const l = window.location;
    const base = l.pathname.split('/')[1];
    // Branch previews (/br_*) and the VolaTrades embed (/dtrader) live under a prefix.
    const has_base = /^\/(br_[^/]*|dtrader)(\/|$)/.test(l.pathname);
    const { preferred_language } = root_store.client;
    const { is_dark_mode_on } = root_store.ui;
    const is_dark_mode = is_dark_mode_on || JSON.parse(localStorage.getItem('ui_store'))?.is_dark_mode_on;
    const language = preferred_language ?? getInitialLanguage();
    const { isBridgeAvailable, sendBridgeEvent } = useMobileBridge();

    // Handle OAuth2 callback — the auth server redirects back to / with ?code=...&state=...
    // No separate /callback route needed; we handle it inline here on every mount.
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        const cleanURL = () => {
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            window.history.replaceState({}, '', url.toString());
        };

        if (!code) return; // Normal load — not an OAuth callback

        // Validate CSRF token
        const stored_csrf = sessionStorage.getItem('oauth_csrf_token');
        if (!state || state !== stored_csrf) {
            // eslint-disable-next-line no-console
            console.error('[OAuth] CSRF token mismatch — aborting token exchange');
            clearTokens();
            cleanURL();
            return;
        }

        sessionStorage.removeItem('oauth_csrf_token');

        exchangeCodeForToken(code)
            .then(() => {
                // Token is now in sessionStorage. Reload to /  so initStore
                // picks it up on fresh boot — avoids the race where onClientInit
                // already ran before the token exchange completed.
                window.location.replace('/');
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.error('[OAuth] Token exchange failed:', err);
                cleanURL();
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Send trading:ready event to ensure smooth loader transition
    React.useEffect(() => {
        if (isBridgeAvailable) {
            sendBridgeEvent('trading:ready');
        }
    }, [isBridgeAvailable, sendBridgeEvent]);

    React.useEffect(() => {
        sessionStorage.removeItem('redirect_url');
        const loadSmartchartsStyles = () => {
            import('@deriv-com/smartcharts-champion/dist/smartcharts.css');
        };

        // Check for theme query parameter and set theme accordingly
        const urlParams = new URLSearchParams(window.location.search);
        const themeParam = urlParams.get('theme');
        if (themeParam === 'dark') {
            root_store.ui.setDarkMode(true);
        } else if (themeParam === 'light') {
            root_store.ui.setDarkMode(false);
        }

        // TODO: [translation-to-shared]: add translation implemnentation in shared
        setUrlLanguage(language);
        initFormErrorMessages(FORM_ERROR_MESSAGES);
        root_store.common.setPlatform();
        loadSmartchartsStyles();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const platform_passthrough = {
        root_store,
        WS,
        i18nInstance,
        language,
    };

    setWebsocket(WS);

    React.useEffect(() => {
        const html = document?.querySelector('html');

        if (!html) return;
        if (is_dark_mode) {
            html.classList?.remove('light');
            html.classList?.add('dark');
        } else {
            html.classList?.remove('dark');
            html.classList?.add('light');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Router basename={has_base ? `/${base}` : null}>
            <StoreProvider store={root_store}>
                <BreakpointProvider>
                    <APIProvider>
                        <TranslationProvider defaultLang={language} i18nInstance={i18nInstance}>
                            {/* This is required as translation provider uses suspense to reload language */}
                            <React.Suspense fallback={<Loading />}>
                                <AppContent passthrough={platform_passthrough} />
                            </React.Suspense>
                        </TranslationProvider>
                    </APIProvider>
                </BreakpointProvider>
            </StoreProvider>
        </Router>
    );
};

App.propTypes = {
    root_store: PropTypes.object,
};

export default App;
