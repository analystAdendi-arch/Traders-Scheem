import { useEffect, useMemo, useRef } from 'react';
import './trading-view.scss';

const TradingView = () => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const src = useMemo(() => 'https://charts.deriv.com', []);

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
        <div className='trading-view-container w-full h-full flex-1 flex flex-col min-h-0'>
            <div className='trading-view flex-1 w-full h-full min-h-0 flex flex-col'>
                <iframe
                    ref={iframeRef}
                    title='DERIV Trading View'
                    className='trading-view__iframe h-full w-full min-h-0 border-0 bg-white'
                    src={src}
                    allow='clipboard-read; clipboard-write; fullscreen; web-share'
                    loading='lazy'
                />
            </div>
        </div>
    );
};

export default TradingView;
