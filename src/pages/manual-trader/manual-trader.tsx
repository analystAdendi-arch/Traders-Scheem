import { useEffect, useRef, useState } from 'react';
import './manual-trader.scss';

/**
 * Deriv's own trading platform, embedded in the tab - same approach as the
 * Trading View tab. app.deriv.com serves Deriv's marketing page rather than a
 * platform, so the trading URLs are used directly.
 */
const PLATFORMS = [
    { id: 'dtrader', label: 'Derivatives Trader', src: 'https://dtrader.deriv.com/' },
    { id: 'smarttrader', label: 'SmartTrader', src: 'https://smarttrader.deriv.com/' },
] as const;

type TPlatformId = (typeof PLATFORMS)[number]['id'];

const STORAGE_KEY = 'manual-trader-platform';

const ManualTrader = () => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [platform, setPlatform] = useState<TPlatformId>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return PLATFORMS.some(item => item.id === saved) ? (saved as TPlatformId) : 'dtrader';
        } catch {
            return 'dtrader';
        }
    });

    const active = PLATFORMS.find(item => item.id === platform) ?? PLATFORMS[0];

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, platform);
        } catch {
            /* keeps working for this session */
        }
    }, [platform]);

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
            <div className='manual-trader__switch' role='tablist'>
                {PLATFORMS.map(item => (
                    <button
                        key={item.id}
                        type='button'
                        role='tab'
                        aria-selected={item.id === platform}
                        className={`manual-trader__switch-btn${
                            item.id === platform ? ' manual-trader__switch-btn--active' : ''
                        }`}
                        onClick={() => setPlatform(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className='manual-trader'>
                <iframe
                    key={active.id}
                    ref={iframeRef}
                    title={`Deriv ${active.label}`}
                    className='manual-trader__iframe'
                    src={active.src}
                    allow='clipboard-read; clipboard-write; fullscreen; web-share'
                />
            </div>
        </div>
    );
};

export default ManualTrader;
