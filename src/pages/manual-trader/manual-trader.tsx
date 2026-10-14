/**
 * Manual Trader: Deriv's DTrader, run inside Traders Scheem.
 *
 * DTrader is a complete app of its own (see /dtrader in this repo). The build
 * puts it at /dtrader/ on this same origin, and this tab shows it in a frame.
 * Same origin matters: the frame reads the session Traders Scheem keeps in
 * localStorage, so the user is already signed in there, on the account picked
 * in the header.
 *
 * Traders Scheem stays the owner of that session. DTrader never logs in, renews a
 * token, switches account or logs out by itself - it posts a message here and
 * this page does it the way the rest of the site does:
 *
 *   session-expired  renew the token if needed and reload the frame; only a
 *                    session that is really gone ends in Traders Scheem' own
 *                    logout, never in an outside login page
 *   refresh-token    renew the token, then answer so the frame can retry
 *   switch-account   select that account, as the header's switcher does
 *   logout           log out, as the header's button does
 *
 * When the selected account changes (here or in the header), the frame sees
 * the change to localStorage and reloads itself onto the new account.
 *
 * The frame is sandboxed without top-navigation or pop-ups, so nothing inside
 * DTrader can take the page away from Traders Scheem or open another site; the
 * trader also hides its own navigation (home, help, account, deposit).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { getAuthInfo } from '@/external/deriv-core';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import { ensureFreshAccessToken } from './session';
import { localize } from '@deriv-com/translations';
import './manual-trader.scss';

/** Tag on every message the embedded DTrader sends. Must match dtrader's embed.ts. */
const EMBED_SOURCE = 'volatrades-dtrader';
/** Where the build serves DTrader. Must match the base in scripts/build-dtrader.js. */
const DTRADER_URL = '/dtrader/';
/** How long to wait for DTrader to load before offering a retry. */
const LOAD_TIMEOUT_MS = 45000;
/** The trader never gets shorter than this; below it the page scrolls instead. */
const MIN_FIT_HEIGHT = 420;
/** Below this width Traders Scheem and the trader use their phone layouts. */
const SMALL_SCREEN_WIDTH = 768;
/** What Traders Scheem floats over the bottom of the screen, by layout. */
const DESKTOP_OVERLAYS = ['.app-footer'];
const SMALL_SCREEN_OVERLAYS = ['.app-footer', '.risk-disclaimer', '.ai-scanner-button__wrapper'];
/** Space kept between the trader and those floating buttons. */
const OVERLAY_GAP = 4;
/** At most one automatic reload in this window, so a failing session cannot loop. */
const RELOAD_COOLDOWN_MS = 60000;
/**
 * What the frame may do. No allow-top-navigation and no allow-popups: nothing
 * inside DTrader can navigate the Traders Scheem page or open another site.
 * allow-same-origin keeps the shared login (localStorage).
 */
const FRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-modals allow-downloads';

/** True while Traders Scheem holds an access token that has not run out. */
const hasLiveSession = () => {
    const auth = getAuthInfo();
    return !!auth?.access_token;
};

type TEmbedMessage = {
    source: typeof EMBED_SOURCE;
    type: 'session-expired' | 'refresh-token' | 'switch-account' | 'logout';
    id?: string;
    loginid?: string;
};

const isEmbedMessage = (data: unknown): data is TEmbedMessage =>
    !!data && typeof data === 'object' && (data as { source?: unknown }).source === EMBED_SOURCE;

const ManualTrader = observer(() => {
    const store = useStore();
    const { client, run_panel } = store ?? {};
    const handleLogout = useLogout();

    const frame_ref = useRef<HTMLIFrameElement>(null);
    const container_ref = useRef<HTMLDivElement>(null);
    const [fit_height, setFitHeight] = useState<number | null>(null);

    // Fit the trader into the space Traders Scheem leaves free: from the top of
    // this tab down to whatever Traders Scheem floats over the bottom of the
    // screen - the footer on desktop; the Risk Disclaimer and AI buttons on a
    // phone. Anything taller would have its bottom (the chart's time axis, or
    // the phone layout's Buy buttons and Trade/Positions bar) hidden.
    useLayoutEffect(() => {
        const fit = () => {
            const container = container_ref.current;
            if (!container) return;
            const viewport_height = window.visualViewport?.height ?? window.innerHeight;
            const is_small_screen = window.innerWidth < SMALL_SCREEN_WIDTH;
            // Position in the page, so scrolling does not change the result.
            const top = container.getBoundingClientRect().top + window.scrollY;

            const overlay_selectors = is_small_screen ? SMALL_SCREEN_OVERLAYS : DESKTOP_OVERLAYS;
            let bottom_reserve = 0;
            overlay_selectors.forEach(selector => {
                const element = document.querySelector(selector) as HTMLElement | null;
                if (!element || getComputedStyle(element).display === 'none') return;
                const rect = element.getBoundingClientRect();
                if (!rect.height || rect.top < viewport_height / 2) return; // only bars at the bottom
                bottom_reserve = Math.max(bottom_reserve, viewport_height - rect.top + OVERLAY_GAP);
            });

            const available = Math.floor(viewport_height - top - bottom_reserve);
            // A short screen (a phone on its side) keeps a usable size; the page scrolls.
            setFitHeight(Math.max(available, MIN_FIT_HEIGHT));
        };
        fit();
        window.addEventListener('resize', fit);
        window.visualViewport?.addEventListener('resize', fit);
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
        observer?.observe(document.body);
        return () => {
            window.removeEventListener('resize', fit);
            window.visualViewport?.removeEventListener('resize', fit);
            observer?.disconnect();
        };
    }, []);
    const [frame_key, setFrameKey] = useState(0);
    const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
    const last_auto_reload = useRef(0);

    const reloadFrame = useCallback(() => {
        setStatus('loading');
        setFrameKey(key => key + 1);
    }, []);

    /** Reload the frame on a fresh session - once per cooldown, never in a loop. */
    const autoReloadFrame = useCallback(() => {
        const now = Date.now();
        if (now - last_auto_reload.current < RELOAD_COOLDOWN_MS) return;
        last_auto_reload.current = now;
        reloadFrame();
    }, [reloadFrame]);

    const replyToFrame = useCallback((payload: Record<string, unknown>) => {
        frame_ref.current?.contentWindow?.postMessage(
            { source: EMBED_SOURCE, ...payload },
            window.location.origin
        );
    }, []);

    useEffect(() => {
        const onMessage = async (event: MessageEvent) => {
            // Only the frame this page made, on this origin.
            if (event.origin !== window.location.origin) return;
            if (!frame_ref.current || event.source !== frame_ref.current.contentWindow) return;
            if (!isEmbedMessage(event.data)) return;

            const message = event.data;
            switch (message.type) {
                case 'refresh-token': {
                    await ensureFreshAccessToken().catch(() => false);
                    replyToFrame({ type: 'refresh-token-result', id: message.id });
                    break;
                }
                case 'session-expired': {
                    // The user is signed in to Traders Scheem: renew if needed and
                    // give the trader the session again. Signing in happens on
                    // Traders Scheem itself; the trader never sends anyone to an
                    // outside login page.
                    await ensureFreshAccessToken().catch(() => false);
                    if (hasLiveSession()) autoReloadFrame();
                    else handleLogout(); // the session is truly gone: Traders Scheem' own logout
                    break;
                }
                case 'switch-account': {
                    const loginid = message.loginid;
                    // The header refuses to switch while a bot is running; so do we.
                    const is_bot_running = run_panel?.is_running || api_base.is_running;
                    if (!loginid || is_bot_running) {
                        reloadFrame(); // put the frame back on the account still selected
                        break;
                    }
                    if (localStorage.getItem('active_loginid') === loginid) break;
                    localStorage.setItem('active_loginid', loginid);
                    client?.checkAndRegenerateWebSocket();
                    // The frame reloads itself on the storage change.
                    break;
                }
                case 'logout': {
                    handleLogout();
                    break;
                }
                default:
                    break;
            }
        };

        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [client, run_panel, handleLogout, reloadFrame, replyToFrame, autoReloadFrame]);

    // A frame that never finishes loading gets a retry button instead of a
    // blank tab forever.
    useEffect(() => {
        if (status !== 'loading') return undefined;
        const timer = window.setTimeout(() => setStatus('failed'), LOAD_TIMEOUT_MS);
        return () => window.clearTimeout(timer);
    }, [status, frame_key]);

    const onFrameLoad = useCallback(() => {
        // In development without a DTrader build, the dev server answers
        // /dtrader/ with Traders Scheem' own page. Catch that rather than show the
        // site inside itself.
        try {
            const doc = frame_ref.current?.contentDocument;
            if (doc && !doc.getElementById('derivatives_trader')) {
                setStatus('failed');
                return;
            }
        } catch {
            /* not readable: leave it to show what it has */
        }
        setStatus('ready');
    }, []);

    return (
        <div
            ref={container_ref}
            className={`manual-trader${fit_height ? ' manual-trader--fitted' : ''}`}
            style={fit_height ? { height: fit_height } : undefined}
        >
            {status === 'loading' && (
                <div className='manual-trader__overlay' role='status'>
                    <span className='manual-trader__spinner' aria-hidden='true' />
                    <span>{localize('Loading trader...')}</span>
                </div>
            )}
            {status === 'failed' && (
                <div className='manual-trader__overlay' role='alert'>
                    <p>{localize('The trader could not be loaded.')}</p>
                    <button type='button' className='manual-trader__retry' onClick={reloadFrame}>
                        {localize('Try again')}
                    </button>
                </div>
            )}
            <iframe
                key={frame_key}
                ref={frame_ref}
                className='manual-trader__frame'
                src={DTRADER_URL}
                title={localize('Manual Trader')}
                onLoad={onFrameLoad}
                sandbox={FRAME_SANDBOX}
                allow='clipboard-write; fullscreen'
            />
        </div>
    );
});

export default ManualTrader;
