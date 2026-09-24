import { useEffect, useRef, useState } from 'react';
import './manual-trader.scss';

/**
 * Deriv's Derivatives Trader, embedded in the tab.
 *
 * app.deriv.com serves Deriv's marketing page rather than a platform, so the
 * platform URL is used directly. The sandbox is what keeps it here: without
 * allow-top-navigation the platform cannot redirect our tab to itself, which
 * is exactly what it does otherwise. allow-same-origin is required or it has
 * no storage of its own and will not boot.
 */
const DTRADER_URL = 'https://dtrader.deriv.com/';
const SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-storage-access-by-user-activation';

const ManualTrader = () => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Close the platform's connection when leaving the tab.
    useEffect(
        () => () => {
            try {
                iframeRef.current?.setAttribute('src', 'about:blank');
            } catch {
                /* ignore */
            }
        },
        []
    );

    return (
        <div className='manual-trader-container'>
            <div className='manual-trader'>
                <iframe
                    ref={iframeRef}
                    title='Deriv Derivatives Trader'
                    className='manual-trader__iframe'
                    src={DTRADER_URL}
                    allow='clipboard-read; clipboard-write; fullscreen; web-share'
                    sandbox={SANDBOX}
                    onLoad={() => setLoaded(true)}
                />
                {!loaded && (
                    <div className='manual-trader__loading' role='status' aria-live='polite'>
                        <span className='manual-trader__spinner' aria-hidden='true' />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualTrader;
