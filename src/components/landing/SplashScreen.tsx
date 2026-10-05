import { useEffect, useRef, useState } from 'react';

import TradingBackdrop from '@/components/trading-backdrop/TradingBackdrop';
import { getAppName, LOGO_CANDIDATES } from '@/utils/branding';

import { subscribePublicFeed, TFeedState, TICKER_SYMBOLS } from './public-feed';
import './splash-screen.scss';

const MIN_MS = 2600;
const MAX_MS = 8000;

const STEPS = ['Connecting to Deriv markets...', 'Loading live market data...', 'Preparing your workspace...'];

// "Traders Scheem" -> ["Traders", "Scheem"]: split at the first inner capital.
const splitName = (name: string): [string, string] => {
    for (let i = 1; i < name.length; i++) {
        if (/[A-Z]/.test(name[i])) return [name.slice(0, i).trim(), name.slice(i)];
    }
    return [name, ''];
};

/** Line icons for the feature row, stroked in brand colours from the stylesheet. */
const FeatureIcon = ({ name }: { name: 'chart' | 'bot' | 'copy' }) => {
    const common = {
        width: 26,
        height: 26,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    };
    if (name === 'chart') {
        return (
            <svg {...common}>
                <path d='M3 20h18M6 16l4-5 3 3 5-7' />
                <path d='M15 7h3v3' />
            </svg>
        );
    }
    if (name === 'bot') {
        return (
            <svg {...common}>
                <rect x='4' y='8' width='16' height='12' rx='3' />
                <path d='M12 8V4.5M9 13h.01M15 13h.01M9.5 17h5' />
            </svg>
        );
    }
    return (
        <svg {...common}>
            <rect x='8' y='8' width='12' height='12' rx='2' />
            <path d='M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2' />
        </svg>
    );
};

const FEATURES = [
    { icon: 'chart', label: 'Advanced Charts', tone: 'sky' },
    { icon: 'bot', label: 'Trading Bots', tone: 'purple' },
    { icon: 'copy', label: 'Copy Trading', tone: 'gold' },
] as const;

export const Ticker = ({ feed }: { feed: TFeedState }) => {
    const items = TICKER_SYMBOLS.filter(({ symbol }) => feed.quotes[symbol]);
    if (!items.length) return null;
    const row = items.map(({ symbol, label }) => {
        const q = feed.quotes[symbol];
        const change = q.first ? ((q.quote - q.first) / q.first) * 100 : 0;
        return (
            <span key={symbol} className='te-ticker__item'>
                <span className='te-ticker__label'>{label}</span>
                <span className='te-ticker__price'>{q.quote.toFixed(q.decimals)}</span>
                <span className={`te-ticker__change te-ticker__change--${change >= 0 ? 'up' : 'down'}`}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(3)}%
                </span>
            </span>
        );
    });
    return (
        <div className='te-ticker' aria-label='Live Deriv prices'>
            <div className='te-ticker__track'>
                {row}
                {row}
            </div>
        </div>
    );
};

/** The logo emblem inside two counter-rotating orbits; initials if the file is missing. */
export const OrbitEmblem = ({ size = 'lg' }: { size?: 'lg' | 'md' }) => {
    const [logo_failed, setLogoFailed] = useState(false);
    const [first, second] = splitName(getAppName());
    return (
        <div className={`te-orbit te-orbit--${size}`} aria-hidden='true'>
            <span className='te-orbit__ring te-orbit__ring--outer'>
                <i />
            </span>
            <span className='te-orbit__ring te-orbit__ring--inner'>
                <i />
            </span>
            <span className='te-orbit__core'>
                {logo_failed ? (
                    <span className='te-orbit__initials'>
                        {first.charAt(0)}
                        {second.charAt(0)}
                    </span>
                ) : (
                    <img src={LOGO_CANDIDATES[0]} alt='' onError={() => setLogoFailed(true)} />
                )}
            </span>
        </div>
    );
};

/** "Traders Scheem" as a two-tone gradient title. */
export const BrandName = ({ className = '' }: { className?: string }) => {
    const [first, second] = splitName(getAppName());
    return (
        <span className={`te-brand-name ${className}`} aria-label={getAppName()}>
            <span className='te-brand-name__a'>{first}</span>
            {second && <span className='te-brand-name__b'>{second}</span>}
        </span>
    );
};

/**
 * Boot splash. Progress follows real milestones (public Deriv socket open,
 * market list received) with a short minimum so it never flashes.
 * `hold` keeps it up, e.g. while an OAuth login is completing.
 */
const SplashScreen = ({ onDone, hold = false }: { onDone: () => void; hold?: boolean }) => {
    const [feed, setFeed] = useState<TFeedState>({ connected: false, markets: null, quotes: {} });
    const [elapsed, setElapsed] = useState(0);
    const [progress, setProgress] = useState(0);
    const started = useRef(Date.now());
    const finished = useRef(false);

    useEffect(() => subscribePublicFeed(setFeed), []);

    useEffect(() => {
        const timer = setInterval(() => setElapsed(Date.now() - started.current), 80);
        return () => clearInterval(timer);
    }, []);

    const step = !feed.connected ? 0 : feed.markets === null ? 1 : 2;
    const ready = (step === 2 && elapsed >= MIN_MS) || elapsed >= MAX_MS;
    const target = ready && !hold ? 100 : [30, 65, 90][step] * Math.min(1, elapsed / 1200 + 0.3);

    useEffect(() => {
        setProgress(prev => (target > prev ? Math.min(target, prev + Math.max(1, (target - prev) * 0.18)) : prev));
    }, [elapsed, target]);

    useEffect(() => {
        if (progress >= 100 && !finished.current) {
            finished.current = true;
            const timer = setTimeout(onDone, 350);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [progress, onDone]);

    const status = hold && ready ? 'Signing you in securely...' : STEPS[step];

    return (
        <div className='te-splash' role='status' aria-live='polite'>
            <TradingBackdrop />
            <div className='te-splash__card'>
                <OrbitEmblem />

                <h1 className='te-splash__title'>
                    <BrandName />
                </h1>
                <div className='te-splash__hub'>
                    <span>AI TRADING HUB</span>
                    <span className='te-splash__live'>
                        <i /> LIVE
                    </span>
                </div>

                <p className='te-splash__sub'>Empowering your trading journey.</p>

                <div className='te-splash__progress'>
                    <div className='te-splash__bar'>
                        <div className='te-splash__fill' style={{ width: `${progress}%` }} />
                    </div>
                    <span className='te-splash__pct'>{Math.round(progress)}%</span>
                </div>

                <div className='te-splash__status'>
                    <span className='te-splash__spinner' aria-hidden='true' />
                    {status}
                </div>

                <div className='te-splash__dots' aria-hidden='true'>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <i key={i} className={i === Math.min(5, Math.floor(progress / 17)) ? 'active' : ''} />
                    ))}
                </div>

                <div className='te-splash__features'>
                    {FEATURES.map(({ icon, label, tone }) => (
                        <div key={label} className={`te-splash__feature te-splash__feature--${tone}`}>
                            <span className='te-splash__feature-icon'>
                                <FeatureIcon name={icon} />
                            </span>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                <p className='te-splash__tagline'>Preparing a seamless trading experience for you</p>
            </div>

            <Ticker feed={feed} />
        </div>
    );
};

export default SplashScreen;
