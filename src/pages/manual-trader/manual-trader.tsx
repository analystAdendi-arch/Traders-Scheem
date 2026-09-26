/**
 * Manual Trader.
 *
 * Deriv's hosted DTrader cannot be embedded - it either navigates our tab away
 * or refuses to render - and Deriv's API team confirms partners do not place
 * that page inside their site. What partner sites do instead is frame a
 * standalone build of Deriv's open-source trader and hand it its starting
 * state in the URL. Reading one of those builds shows the contract:
 *
 *   acct1 / id / cur1       -> which account to come up on
 *   app_id, lang, theme, symbol, chart_type, interval, api_version
 *                           -> initial platform state
 *
 * NEXT_PUBLIC_DTRADER_URL chooses which build to frame: a full URL for a hosted
 * one, or a path such as /trader for our own same-origin build. No access token
 * goes in this URL - a token in a query string is handed to whoever serves the
 * frame and kept in their logs. A same-origin build needs none, because it
 * shares our storage; a hosted one authorises through its own Deriv login.
 *
 * Until NEXT_PUBLIC_DTRADER_URL is set the tab falls back to the trade panel we
 * built on the Options API, so manual trading works either way.
 */
import { useEffect, useMemo, useState } from 'react';
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
    return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
};

const ManualTrader = observer(() => {
    const { chart_store, ui, client } = useStore();
    const [frame_loaded, setFrameLoaded] = useState(false);

    const loginid = client?.loginid ?? '';
    const currency = client?.currency ?? '';
    const account_type = client?.is_virtual ? 'demo' : 'real';
    const symbol = chart_store?.symbol ?? '';
    const theme = ui?.is_dark_mode_on ? 'dark' : 'light';

    // Rebuilt whenever the active account changes, so switching between demo and
    // real - or between real accounts - reloads the frame on the new account
    // rather than leaving it on the previous one.
    const src = useMemo(() => {
        if (!DTRADER_URL) return '';

        // Platform state, so the frame opens on the market chosen here rather
        // than on its own defaults, in our theme and language.
        const params = new URLSearchParams({
            api_version: 'v2',
            chart_type: 'area',
            interval: '1t',
            lang: (localStorage.getItem('i18n_language') || 'EN').toUpperCase(),
            theme,
        });
        if (symbol) params.set('symbol', symbol);

        const app_id = process.env.NEXT_PUBLIC_DERIV_APP_ID;
        if (app_id) params.set('app_id', app_id);

        // Which account to come up on. Identifiers only, no secret material.
        if (loginid) {
            params.set('acct1', loginid);
            params.set('id', loginid);
            params.set('accountType', account_type);
            params.set('account_type', account_type);
        }
        if (currency) {
            params.set('cur1', currency);
            params.set('currency', currency);
        }

        // Who is framing it.
        params.set('embedBase', window.location.origin);

        return `${traderEndpoint(DTRADER_URL)}?${params.toString()}`;
    }, [loginid, currency, account_type, symbol, theme]);

    // A same-origin build reads the session straight out of localStorage, so
    // mirror ours into the key names it expects before the frame navigates -
    // that is what spares the user a second login. Done during render rather
    // than in an effect because the frame starts loading as soon as it commits.
    if (src.startsWith(`${window.location.origin}/`) && loginid) {
        syncTraderSession(loginid);
    }

    // A new account means a new frame: show the spinner again until it paints.
    useEffect(() => {
        setFrameLoaded(false);
    }, [src]);

    if (!src) return <NativeTrader />;

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
