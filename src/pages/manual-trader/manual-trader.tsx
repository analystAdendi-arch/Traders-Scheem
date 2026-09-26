/**
 * Manual Trader.
 *
 * Deriv's hosted DTrader cannot be embedded - it either navigates our tab away
 * or refuses to render - and Deriv's API team confirms partners do not place
 * that page inside their site. What partner sites do instead is frame a
 * standalone build of Deriv's open-source trader and hand it its starting
 * state in the URL. Reading one of those builds shows the contract:
 *
 *   acct1 / cur1            -> which account to come up on
 *   app_id, lang, theme, symbol, chart_type, interval, api_version
 *                           -> initial platform state
 *
 * Ours is served from /trader on our own domain (public/trader, our branded
 * white-label build), so the frame is first-party: it shares our origin and
 * therefore our session storage, and it cannot steer the page. That is also why
 * no access token goes in this URL - a token in a query string would be handed
 * to whoever serves the frame and kept in their logs, which is only safe to
 * avoid entirely.
 *
 * Until NEXT_PUBLIC_DTRADER_URL is set the tab falls back to the trade panel we
 * built on the Options API, so manual trading works either way.
 */
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { useStore } from '@/hooks/useStore';
import NativeTrader from './native-trader';
import { syncTraderSession } from './trader-session';
import './manual-trader.scss';

const DTRADER_URL = process.env.NEXT_PUBLIC_DTRADER_URL || '';

/**
 * Resolve the configured build to an absolute URL. A path such as "/trader" is
 * our own same-origin build; a full URL is honoured as given. The trade screen
 * of a bare origin lives at /dtrader.
 */
const traderEndpoint = (raw: string) => {
    const url = new URL(raw, window.location.origin);
    if (url.pathname === '/') url.pathname = '/dtrader';
    return `${url.origin}${url.pathname.replace(/\/$/, '')}/`;
};

const ManualTrader = observer(() => {
    const { chart_store, ui, client } = useStore();
    const [frame_loaded, setFrameLoaded] = useState(false);

    if (!DTRADER_URL) return <NativeTrader />;

    // Platform state, so the frame opens on the market chosen here rather than
    // on its own defaults, and matches the theme and language of the site.
    const params = new URLSearchParams({
        api_version: 'v2',
        chart_type: 'area',
        interval: '1t',
        lang: (localStorage.getItem('i18n_language') || 'EN').toUpperCase(),
        theme: ui?.is_dark_mode_on ? 'dark' : 'light',
    });
    if (chart_store?.symbol) params.set('symbol', chart_store.symbol);

    const app_id = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (app_id) params.set('app_id', app_id);

    // Which account to come up on. No secret material - the frame is on our
    // origin, so it reads the session itself.
    if (client?.loginid) {
        params.set('acct1', client.loginid);
        params.set('account_type', client.is_virtual ? 'demo' : 'real');
    }
    if (client?.currency) params.set('cur1', client.currency);

    const endpoint = traderEndpoint(DTRADER_URL);

    // Same-origin builds read our session straight out of localStorage, so mirror
    // it into the key names they expect before the frame navigates - that is what
    // spares the user a second login. Done here rather than in an effect because
    // the frame starts loading as soon as it is committed.
    if (endpoint.startsWith(`${window.location.origin}/`) && client?.loginid) {
        syncTraderSession(client.loginid);
    }

    const src = `${endpoint}?${params.toString()}`;

    return (
        <div className='manual-trader-frame'>
            <iframe
                key={src}
                title='VolaTrades Trader'
                className='manual-trader-frame__iframe'
                src={src}
                allow='clipboard-read; clipboard-write; fullscreen; web-share'
                onLoad={() => setFrameLoaded(true)}
            />
            {/* Our own spinner covers the gap before the platform paints. */}
            {!frame_loaded && (
                <div className='manual-trader-frame__loading' role='status' aria-live='polite'>
                    <span className='manual-trader-frame__spinner' aria-hidden='true' />
                    <span className='manual-trader-frame__loading-text'>{localize('Loading trader…')}</span>
                </div>
            )}
        </div>
    );
});

export default ManualTrader;
