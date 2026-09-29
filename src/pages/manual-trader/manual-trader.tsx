/**
 * Manual Trader.
 *
 * Frames a hosted build of Deriv's trader, the same way the bossiousfx project
 * does (MIT, deriv.com): a plain iframe, no sandbox, pointed at
 * deriv-dtrader.vercel.app/dtrader with the market and chart set by query
 * string.
 *
 * Its session belongs to that origin, so a trader signs in once inside the
 * frame. No token is put in this URL - it would be handed to whoever serves
 * that origin, and kept in their logs. app_id is ours, so the trades placed in
 * there are made through our application.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { useStore } from '@/hooks/useStore';
import './manual-trader.scss';

const DTRADER_URL = 'https://deriv-dtrader.vercel.app/dtrader';

const ManualTrader = observer(() => {
    const { chart_store, ui } = useStore();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [frame_loaded, setFrameLoaded] = useState(false);

    const symbol = chart_store?.symbol || '1HZ100V';
    const theme = ui?.is_dark_mode_on ? 'dark' : 'light';

    const src = useMemo(() => {
        const params = new URLSearchParams({
            chart_type: 'area',
            interval: '1t',
            symbol,
            trade_type: 'over_under',
            lang: (localStorage.getItem('i18n_language') || 'EN').toUpperCase(),
            theme,
        });

        const app_id = process.env.NEXT_PUBLIC_DERIV_APP_ID;
        if (app_id) params.set('app_id', app_id);

        return `${DTRADER_URL}?${params.toString()}`;
    }, [symbol, theme]);

    // A new src means a new frame: show the spinner again until it paints.
    useEffect(() => {
        setFrameLoaded(false);
    }, [src]);

    useEffect(() => {
        return () => {
            try {
                // Stop the framed platform on the way out rather than leaving it
                // holding a socket open behind the tab.
                iframeRef.current?.setAttribute('src', 'about:blank');
            } catch {
                /* ignore */
            }
        };
    }, []);

    return (
        <div className='manual-trader-container'>
            <div className='manual-trader'>
                <iframe
                    key={src}
                    ref={iframeRef}
                    title='VolaTrades Trader'
                    className='manual-trader__iframe'
                    src={src}
                    allow='clipboard-read; clipboard-write; fullscreen; web-share'
                    allowFullScreen
                    onLoad={() => setFrameLoaded(true)}
                />

                {/* Our own spinner covers the gap before the platform paints. */}
                {!frame_loaded && (
                    <div className='manual-trader__loading' role='status' aria-live='polite'>
                        <span className='manual-trader__spinner' aria-hidden='true' />
                        <span className='manual-trader__loading-text'>{localize('Loading trader…')}</span>
                    </div>
                )}
            </div>
        </div>
    );
});

export default ManualTrader;
