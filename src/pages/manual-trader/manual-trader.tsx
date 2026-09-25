/**
 * Manual Trader.
 *
 * Deriv's hosted DTrader cannot be embedded - it either navigates our tab away
 * or refuses to render - and Deriv's own API team confirms partners do not
 * place that page inside their site. What partner sites actually do (checked
 * on a live one) is embed *their own build* of Deriv's open-source DTrader,
 * driven by URL parameters:
 *
 *   https://their-build.example/dtrader?symbol=1HZ100V&trade_type=accumulator
 *     &chart_type=area&interval=1t&theme=light&lang=EN&app_id=...
 *
 * Ours lives at NEXT_PUBLIC_DTRADER_URL (see dtrader-volatrades/, the branded
 * white-label build). A build on our own subdomain is first-party, so it
 * renders and cannot steer the page.
 *
 * Until that URL is set, the tab falls back to the trade panel we built on the
 * Options API, so manual trading works either way.
 */
import { observer } from 'mobx-react-lite';

import { useStore } from '@/hooks/useStore';
import NativeTrader from './native-trader';
import './manual-trader.scss';

const DTRADER_URL = process.env.NEXT_PUBLIC_DTRADER_URL || '';

const ManualTrader = observer(() => {
    const { chart_store, ui, client } = useStore();

    if (!DTRADER_URL) return <NativeTrader />;

    // Same parameter set the platform reads, so the frame opens on the market
    // and trade type chosen here rather than its own defaults.
    const params = new URLSearchParams({
        chart_type: 'area',
        interval: '1t',
        lang: 'EN',
        theme: ui?.is_dark_mode_on ? 'dark' : 'light',
    });
    if (chart_store?.symbol) params.set('symbol', chart_store.symbol);
    if (process.env.NEXT_PUBLIC_DERIV_APP_ID) params.set('app_id', process.env.NEXT_PUBLIC_DERIV_APP_ID);
    // Account hints only - the embedded build authorises with its own Deriv
    // login, so no token travels in the URL.
    if (client?.loginid) params.set('acct1', client.loginid);
    if (client?.currency) params.set('cur1', client.currency);

    const src = `${DTRADER_URL.replace(/\/$/, '')}/?${params.toString()}`;

    return (
        <div className='manual-trader-frame'>
            <iframe
                key={src}
                title='VolaTrades Trader'
                className='manual-trader-frame__iframe'
                src={src}
                allow='clipboard-read; clipboard-write; fullscreen; web-share'
            />
        </div>
    );
});

export default ManualTrader;
