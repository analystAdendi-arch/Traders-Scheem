import { useEffect, useRef, useState } from 'react';

import { FinBadge } from '@/components/fin-ui/FinIcon';
import TradingBackdrop from '@/components/trading-backdrop/TradingBackdrop';
import { getAppName, LOGO_CANDIDATES } from '@/utils/branding';

import { subscribePublicFeed, TFeedState, TICKER_SYMBOLS } from './public-feed';
import './splash-screen.scss';

const MIN_MS = 2600;
const MAX_MS = 8000;

const STEPS = ['Connecting to Deriv markets...', 'Streaming live prices...', 'Preparing your trading desk...'];

// "Traders Scheem" -> ["Traders", "Scheem"]: split at the first inner capital.
const splitName = (name: string): [string, string] => {
    for (let i = 1; i < name.length; i++) {
        if (/[A-Z]/.test(name[i])) return [name.slice(0, i).trim(), name.slice(i)];
    }
    return [name, ''];
};

const FEATURES = [
    { icon: 'candles', label: 'Market Analytics', tone: 'sky' },
    { icon: 'bot', label: 'Automated Execution', tone: 'purple' },
    { icon: 'copy', label: 'Copy Trading', tone: 'gold' },
] as const;

const STEPS_DONE = ['Market data', 'Pricing engine', 'Your desk'];

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
            <div className='te-splash__card fin-frame'>
                <OrbitEmblem />

                <h1 className='te-splash__title'>
                    <BrandName />
                </h1>
                <div className='te-splash__hub'>
                    <span>TRADING TERMINAL</span>
                    <span className='te-splash__live'>
                        <i /> LIVE
                    </span>
                </div>

                <p className='te-splash__sub'>Data-driven tools for disciplined capital.</p>

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

                <ul className='te-splash__checks' aria-label='Start-up checks'>
                    {STEPS_DONE.map((label, i) => (
                        <li key={label} className={step > i || progress >= 100 ? 'is-done' : ''}>
                            <i aria-hidden='true' />
                            {label}
                        </li>
                    ))}
                </ul>

                <div className='te-splash__features'>
                    {FEATURES.map(({ icon, label, tone }) => (
                        <div key={label} className={`te-splash__feature te-splash__feature--${tone}`}>
                            <FinBadge name={icon} tone={tone} />
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                <p className='te-splash__tagline'>Live Deriv pricing · Secure Deriv login · Synthetic markets 24/7</p>
            </div>

            <Ticker feed={feed} />
        </div>
    );
};

export default SplashScreen;
