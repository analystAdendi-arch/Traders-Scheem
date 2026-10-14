/**
 * Keeps the Traders Scheem login usable for the embedded trader.
 *
 * The trader reads the session Traders Scheem stores in localStorage
 * (`auth_info`, `expires_at` in seconds) and asks this page to renew it when
 * Deriv stops accepting the access token. Renewal goes through deriv-core's
 * refreshAccessToken, which stores the new token (and ends the session if
 * Deriv refuses the refresh token).
 */
import { refreshAccessToken } from '@/external/deriv-core';

/** Renew a little before expiry rather than on it. */
const RENEW_WINDOW_MS = 60 * 1000;

type TStoredAuth = { access_token?: string; refresh_token?: string; expires_at?: number | null };

/** The stored session even when its access token has run out (getAuthInfo hides those). */
const readStoredAuth = (): TStoredAuth | null => {
    try {
        const raw = localStorage.getItem('auth_info');
        return raw ? (JSON.parse(raw) as TStoredAuth) : null;
    } catch {
        return null;
    }
};

const needsRenewal = (auth: TStoredAuth) =>
    !!auth.expires_at && Date.now() > auth.expires_at * 1000 - RENEW_WINDOW_MS;

let in_flight: Promise<boolean> | null = null;

/** Resolves true when there is a usable session afterwards. */
export const ensureFreshAccessToken = async (): Promise<boolean> => {
    const auth = readStoredAuth();
    if (!auth?.access_token) return false;
    if (!needsRenewal(auth)) return true;
    if (!auth.refresh_token) return false;
    if (in_flight) return in_flight;

    in_flight = (async () => {
        try {
            await refreshAccessToken(auth.refresh_token as string, process.env.NEXT_PUBLIC_DERIV_APP_ID || '');
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Could not renew the Deriv session:', error);
            return !!readStoredAuth()?.access_token;
        } finally {
            in_flight = null;
        }
    })();
    return in_flight;
};
