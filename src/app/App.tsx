import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { cleanupUrl, getAuthInfo, handleOAuthCallback } from '@/external/deriv-core';
import ChunkLoader from '@/components/loader/chunk-loader';
import {
    getOAuthRedirectUri,
    rememberLoginError,
    takeLoginError,
    takeReturnTab,
} from '@/components/shared/utils/config/config';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { useAccountSwitching } from '@/hooks/useAccountSwitching';
import { useLanguageFromURL } from '@/hooks/useLanguageFromURL';
import { StoreProvider } from '@/hooks/useStore';
import { TickDataProvider } from '@/hooks/useTickData';
import { isPreviewMode, PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import { localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import i18nInstance from './i18n';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

/**
 * Component wrapper to handle language URL parameter
 * Uses the useLanguageFromURL hook to process language switching
 */
const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    useLanguageFromURL();
    return <>{children}</>;
};

// The static preview build is served under /bot/preview (see rsbuild.config.ts
// assetPrefix), so React Router must resolve routes under that prefix. Standalone
// partner deploys are served at the root, so no basename there.
const routerBasename = isPreviewMode() ? PREVIEW_BASE_PATH : undefined;

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense
                    fallback={<ChunkLoader message={localize('Please wait while we connect to the server...')} />}
                >
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <LanguageHandler>
                            <StoreProvider>
                                <LocalStorageSyncWrapper>
                                    <RoutePromptDialog />
                                    <CoreStoreProvider>
                                        <TickDataProvider>
                                            <Layout />
                                        </TickDataProvider>
                                    </CoreStoreProvider>
                                </LocalStorageSyncWrapper>
                            </StoreProvider>
                        </LanguageHandler>
                    </TranslationProvider>
                </Suspense>
            }
        >
            {/* All child routes will be passed as children to Layout */}
            <Route index element={<AppRoot />} />
            {/* Deriv returns here after login; App swaps to / once the code is exchanged */}
            <Route path='callback' element={<ChunkLoader message={localize('Signing you in...')} />} />
            {/* App Builder embeds the template at /preview — render the same app shell */}
            <Route path='preview' element={<AppRoot />} />
        </Route>
    ),
    { basename: routerBasename }
);

/** Deriv's login code is single use, so it must never be exchanged twice (a remount, a double effect). */
let oauth_callback_started = false;

/** What the user is told when a login does not complete: plain words first, the technical reason after. */
const describeLoginFailure = (error: unknown): string => {
    const detail = (error instanceof Error ? error.message : String(error || '')).replace(/\s+/g, ' ').trim();
    let friendly = 'We could not finish signing you in. Please try again.';
    if (/csrf|state parameter|verifier/i.test(detail)) {
        friendly = 'Your login session expired before it could finish. Please try again.';
    } else if (/timed out|failed to fetch|networkerror|load failed/i.test(detail)) {
        friendly = 'We could not reach Deriv. Check your connection and try again.';
    } else if (/no trading accounts/i.test(detail)) {
        friendly = 'Your Deriv login worked, but no trading account was found on it.';
    }
    return detail ? `${friendly} (${detail.slice(0, 140)})` : friendly;
};

/**
 * Main App component
 *
 * Responsibilities:
 * 1. OAuth callback handling (via vendored deriv-core handleOAuthCallback)
 * 2. Account switching from URL (via useAccountSwitching hook)
 * 3. Router provider setup
 */
function App() {
    // Handle account switching via URL parameter
    useAccountSwitching();

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('code')) {
            // /callback without a code (Deriv returned an error, or the page was reloaded
            // after the code was used) has nothing to process and would sit on the
            // "Signing you in..." loader forever. Log why, then go home.
            if (window.location.pathname === '/callback') {
                const reason = urlParams.get('error_description') || urlParams.get('error') || '';
                console.error('OAuth callback had no code:', urlParams.get('error') || '(no error param)', reason);
                // A reload of /callback by someone who is already signed in is not a failure.
                if (!getAuthInfo()) {
                    rememberLoginError(
                        reason
                            ? `Deriv did not complete the login: ${reason}`
                            : 'The login link expired or was already used. Please log in again.'
                    );
                }
                window.location.replace(`${window.location.origin}/`);
            }
            return;
        }

        if (oauth_callback_started) return;
        oauth_callback_started = true;

        // Never let a slow or hung request after the token exchange keep the user on /callback.
        const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
            Promise.race([
                promise,
                new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
            ]);

        const handleCallback = async () => {
            try {
                const authInfo = await handleOAuthCallback(window.location.href, {
                    clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
                    // Same value the login URL sent, or Deriv rejects the exchange.
                    redirectUri: getOAuthRedirectUri(),
                    scopes: 'trade',
                });

                const { DerivWSAccountsService } = await import('@/services/derivws-accounts.service');
                const loadAccounts = () =>
                    withTimeout(
                        DerivWSAccountsService.fetchAccountsList(authInfo.access_token),
                        12000,
                        'Fetching accounts'
                    );

                // One retry: a single dropped request on a mobile connection should not cost the login.
                let accounts;
                try {
                    accounts = await loadAccounts();
                } catch (first_error) {
                    console.warn('Fetching accounts failed, retrying once:', first_error);
                    accounts = await loadAccounts();
                }

                if (!accounts || accounts.length === 0) {
                    throw new Error('No trading accounts were returned for this login');
                }

                DerivWSAccountsService.storeAccounts(accounts);
                const firstAccount = accounts[0];
                localStorage.setItem('active_loginid', firstAccount.account_id);
                const isDemo = firstAccount.account_id.startsWith('VRT') || firstAccount.account_id.startsWith('VRTC');
                localStorage.setItem('account_type', isDemo ? 'demo' : 'real');
                takeLoginError();
                // The Deriv connection itself is opened by the page we are about to load
                // (app-root), from the session stored above. Opening one here as well only
                // delayed the redirect - by up to 15 s on a slow connection - and was thrown
                // away by the reload.
            } catch (error) {
                console.error('OAuth callback error:', error);
                rememberLoginError(describeLoginFailure(error));
            } finally {
                cleanupUrl(window.location.origin);
                // Back to the tab the user logged in from (e.g. #manual_trader), else the
                // app root. cleanupUrl only rewrites the address, so a login that returned
                // to /callback would otherwise sit on a dead route.
                const return_tab = takeReturnTab();
                const target = `${window.location.origin}/${return_tab ? `#${return_tab}` : ''}`;
                if (window.location.pathname !== '/') {
                    window.location.replace(target);
                } else if (return_tab) {
                    // Already on '/': a hash-only change would not reload, so set it and reload.
                    window.history.replaceState(null, '', target);
                    window.location.reload();
                } else {
                    // Already on '/' with no tab to restore: reload so the app starts from the stored session.
                    window.location.reload();
                }
            }
        };

        handleCallback();
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
