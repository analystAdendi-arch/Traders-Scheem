import { useEffect, useMemo, useRef } from 'react';
import './manual-trader.scss';

const ManualTrader = () => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    // app.deriv.com now 301-redirects to the deriv.com marketing site; DTrader lives here.
    const src = useMemo(() => 'https://dtrader.deriv.com', []);

    useEffect(() => {
        return () => {
            try {
                if (iframeRef.current) {
                    iframeRef.current.setAttribute('src', 'about:blank');
                }
            } catch {
                /* ignore */
            }
        };
    }, []);

    return (
        <div className='manual-trader-container w-full h-full flex-1 flex flex-col min-h-0'>
            <div className='manual-trader flex-1 w-full h-full min-h-0 flex flex-col'>
                <iframe
                    ref={iframeRef}
                    title='DERIV Manual Trader'
                    className='manual-trader__iframe h-full w-full min-h-0 border-0 bg-white'
                    src={src}
                    allow='clipboard-read; clipboard-write; fullscreen; web-share'
                    loading='lazy'
                />
            </div>
        </div>
    );
};

export default ManualTrader;
