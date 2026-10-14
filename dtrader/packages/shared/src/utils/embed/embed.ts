/**
 * Embedded mode: this trader running inside VolaTrades' "Manual Trader" tab.
 *
 * VolaTrades serves this build at /dtrader/ on its own origin and shows it in
 * an iframe. In that mode VolaTrades owns the login session - it signs the
 * user in, renews the access token, switches accounts and logs out - and this
 * app only reads that session and asks VolaTrades to act on it. Two apps each
 * renewing the same refresh token, or one of them clearing storage the other
 * relies on, would log the user out of both.
 *
 * Messages go to the parent window only, on the same origin, tagged with
 * EMBED_SOURCE so the host can tell them apart from anything else.
 */

export const EMBED_SOURCE = 'volatrades-dtrader';
export const EMBED_BASE = 'dtrader';

/** The session VolaTrades keeps, in localStorage. `expires_at` is in seconds. */
const HOST_AUTH_KEY = 'auth_info';

export type THostAuth = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number | null;
};

let embedded_cache: boolean | null = null;

export const isEmbedded = (): boolean => {
    if (embedded_cache !== null) return embedded_cache;
    if (typeof window === 'undefined') return false;
    try {
        // Same origin only: a frame on someone else's site is not our host.
        embedded_cache = window.self !== window.top && window.parent.location.origin === window.location.origin;
    } catch {
        embedded_cache = false;
    }
    return embedded_cache;
};

export const postToHost = (type: string, payload: Record<string, unknown> = {}): void => {
    if (!isEmbedded()) return;
    window.parent.postMessage({ source: EMBED_SOURCE, type, ...payload }, window.location.origin);
};

export const readHostAuth = (): THostAuth | null => {
    try {
        const raw = window.localStorage.getItem(HOST_AUTH_KEY);
        return raw ? (JSON.parse(raw) as THostAuth) : null;
    } catch {
        return null;
    }
};

/** The host's access token, or null when there is none or it has run out. */
export const getHostAccessToken = (): string | null => {
    const auth = readHostAuth();
    if (!auth?.access_token) return null;
    if (auth.expires_at && Date.now() >= auth.expires_at * 1000) return null;
    return auth.access_token;
};

/** The account VolaTrades has selected. */
export const getHostLoginid = (): string | null => {
    try {
        const value = window.localStorage.getItem('active_loginid');
        return value && value !== 'null' ? value : null;
    } catch {
        return null;
    }
};

let refresh_seq = 0;

/**
 * Ask VolaTrades to renew the session and wait for its answer. Resolves with
 * the access token to use afterwards (null when the session is gone).
 */
export const requestHostTokenRefresh = (timeout_ms = 15000): Promise<string | null> => {
    if (!isEmbedded()) return Promise.resolve(null);
    refresh_seq += 1;
    const id = `r${Date.now()}-${refresh_seq}`;

    return new Promise(resolve => {
        let timer = 0;
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data;
            if (data?.source === EMBED_SOURCE && data.type === 'refresh-token-result' && data.id === id) finish();
        };
        const finish = () => {
            window.removeEventListener('message', onMessage);
            window.clearTimeout(timer);
            resolve(getHostAccessToken());
        };
        timer = window.setTimeout(finish, timeout_ms);
        window.addEventListener('message', onMessage);
        postToHost('refresh-token', { id });
    });
};

/** The session is missing or no longer accepted: let VolaTrades sort it out. */
export const requestHostLogin = (): void => postToHost('session-expired');

export const requestHostLogout = (): void => postToHost('logout');

export const requestHostAccountSwitch = (loginid: string): void => postToHost('switch-account', { loginid });

/**
 * Leave for another site (deposit, account hub, onboarding). Embedded, the
 * user stays inside VolaTrades: nothing is opened.
 */
export const openExternalUrl = (url: string): void => {
    if (!url) return;
    if (isEmbedded()) return;
    window.location.href = url;
};

/**
 * Embedded, keep every click inside VolaTrades: links to other sites and new
 * windows do nothing. (VolaTrades' frame sandbox blocks pop-ups and top-level
 * navigation as well; this also stops a link replacing the trader in its
 * own frame.) Call once at start-up.
 */
export const keepNavigationInside = (): void => {
    if (!isEmbedded()) return;

    // Blend into VolaTrades' page: no page-level scrollbar of its own
    // (scrolling still works where content is taller), no outer margin. Its own page styles
    // are scoped to this class, so standalone /dtrader/ is unchanged.
    document.documentElement.classList.add('vt-embedded');
    const style = document.createElement('style');
    style.textContent = [
        'html.vt-embedded, html.vt-embedded body { margin: 0; scrollbar-width: none; -ms-overflow-style: none; }',
        'html.vt-embedded::-webkit-scrollbar, html.vt-embedded body::-webkit-scrollbar { width: 0; height: 0; }',
    ].join('\n');
    document.head.appendChild(style);

    window.open = () => null;

    document.addEventListener(
        'click',
        event => {
            const target = event.target as Element | null;
            const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;
            let leaves = anchor.target === '_blank' || anchor.target === '_top' || anchor.target === '_parent';
            try {
                leaves = leaves || new URL(anchor.href, window.location.href).origin !== window.location.origin;
            } catch {
                leaves = true;
            }
            if (leaves) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        true
    );
};
