import { useEffect, useRef, useState } from 'react';

import { getAppName } from '@/utils/branding';

import { subscribePublicFeed, TFeedState, TICKER_SYMBOLS } from './public-feed';
import './splash-screen.scss';

const MIN_MS = 2600;
const MAX_MS = 8000;

const STEPS = ['Connecting to Deriv markets...', 'Loading live market data...', 'Preparing your workspace...'];

const splitName = (name: string): [string, string] => {
    for (let i = name.length - 1; i > 0; i--) if (/[A-Z]/.test(name[i])) return [name.slice(0, i), name.slice(i)];
    return [name, ''];
};

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

    const [first, second] = splitName(getAppName());
    const status = hold && ready ? 'Signing you in securely...' : STEPS[step];

    return (
        <div className='te-splash' role='status' aria-live='polite'>
            <div className='te-splash__bg' aria-hidden='true' />
            <div className='te-splash__card'>
                <h1 className='te-splash__logo'>
                    <span className='te-splash__logo-a'>{first.toUpperCase()}</span>
                    <span className='te-splash__logo-b'>{second.toUpperCase()}</span>
                </h1>
                <div className='te-splash__hub'>
                    <span>TRADING HUB</span>
                    <span className='te-splash__live'>
                        <i /> LIVE
                    </span>
                </div>

                <div className='te-splash__divider' />

                <h2 className='te-splash__welcome'>Welcome to {getAppName()}</h2>
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
                    {[
                        ['📊', 'Advanced Charts'],
                        ['🤖', 'Trading Bots'],
                        ['🔁', 'Copy Trading'],
                    ].map(([icon, label]) => (
                        <div key={label} className='te-splash__feature'>
                            <span className='te-splash__feature-icon'>{icon}</span>
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
