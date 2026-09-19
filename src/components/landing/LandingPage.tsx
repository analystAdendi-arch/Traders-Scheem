import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import { generateOAuthURL } from '@/components/shared';
import { TAB_IDS } from '@/constants/bot-contents';
import { getFreeBots } from '@/pages/free-bots/free-bot-list';
import { getAppName } from '@/utils/branding';

import {
    AFFILIATE_SIGNUP_URL,
    FEATURES,
    HEADLINES,
    HIGHLIGHTS,
    MASTER_PARTNER_URL,
    REVIEWS,
    TELEGRAM_URL,
    type THighlight,
    WHY_CHOOSE,
} from './content';
import { subscribePublicFeed, TFeedState, TICKER_SYMBOLS } from './public-feed';
import './landing-page.scss';

const ROTATE_MS = 5000;
/** Served from public/ (not bundled). */
const BG_IMAGE = '/landing-bg-source.webp';
const CARD_TONES: THighlight['tone'][] = ['teal', 'violet', 'sky', 'emerald', 'sky', 'violet'];

type TCard = {
    badge: string;
    title: string;
    subtitle: string;
    text: string;
    tone: THighlight['tone'];
    rating: number;
};

/** Live Deriv prices scrolling right-to-left under the header. */
const TopTicker = ({ feed }: { feed: TFeedState }) => {
    const items = TICKER_SYMBOLS.filter(({ symbol }) => feed.quotes[symbol]);
    if (!items.length) return <div className='te-landing__ticker te-landing__ticker--empty' />;
    const row = items.map(({ symbol, label }) => {
        const q = feed.quotes[symbol];
        const up = q.quote >= q.prev;
        return (
            <span key={symbol} className='te-landing__ticker-item'>
                <span className='te-landing__ticker-label'>{label}</span>
                <span className={`te-landing__ticker-price te-landing__ticker-price--${up ? 'up' : 'down'}`}>
                    {q.quote.toFixed(q.decimals)}
                </span>
                <span className={`te-landing__ticker-arrow te-landing__ticker-arrow--${up ? 'up' : 'down'}`}>
                    {up ? '▲' : '▼'}
                </span>
            </span>
        );
    });
    return (
        <div className='te-landing__ticker' aria-label='Live Deriv prices'>
            <div className='te-landing__ticker-track'>
                {row}
                {row}
            </div>
        </div>
    );
};

const splitName = (name: string): [string, string] => {
    for (let i = name.length - 1; i > 0; i--) if (/[A-Z]/.test(name[i])) return [name.slice(0, i), name.slice(i)];
    return [name, ''];
};

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

/* ------------------------------------------------------------------ icons */

const Icon = ({ name }: { name: string }) => {
    const common = {
        width: 28,
        height: 28,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    };
    switch (name) {
        case 'bot':
            return (
                <svg {...common}>
                    <rect x='4' y='8' width='16' height='12' rx='3' />
                    <path d='M12 8V4.5M9 13h.01M15 13h.01M9.5 17h5' />
                </svg>
            );
        case 'chart':
            return (
                <svg {...common}>
                    <path d='M6 20V10M12 20V4M18 20v-7' />
                </svg>
            );
        case 'users':
            return (
                <svg {...common}>
                    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                    <circle cx='9' cy='7' r='4' />
                    <path d='M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
                </svg>
            );
        default:
            return (
                <svg {...common}>
                    <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
                    <path d='m9 12 2 2 4-4' />
                </svg>
            );
    }
};

const Wordmark = () => {
    const [first, second] = splitName(getAppName());
    return (
        <span className='te-landing__wordmark'>
            <span className='te-landing__wordmark-a'>{first}</span>
            <span className='te-landing__wordmark-b'>{second}</span>
        </span>
    );
};

/* ------------------------------------------------------------------ page */

const LandingPage = () => {
    const [index, setIndex] = useState(0);
    const [typed, setTyped] = useState('');
    const [feed, setFeed] = useState<TFeedState>({ connected: false, markets: null, quotes: {} });
    const [referral_open, setReferralOpen] = useState(false);
    const [logging_in, setLoggingIn] = useState(false);

    const has_app_id = Boolean(process.env.NEXT_PUBLIC_DERIV_APP_ID);
    // Real customer reviews once added to REVIEWS; the feature highlights until then.
    const cards: TCard[] = REVIEWS.length
        ? REVIEWS.map((review, i) => ({
              badge: review.name
                  .split(' ')
                  .map(part => part.charAt(0))
                  .join('')
                  .slice(0, 2)
                  .toUpperCase(),
              title: review.name,
              subtitle: review.role,
              text: `“${review.quote}”`,
              tone: CARD_TONES[i % CARD_TONES.length],
              rating: review.rating,
          }))
        : HIGHLIGHTS.map(item => ({ ...item, rating: 0 }));

    useEffect(() => subscribePublicFeed(setFeed), []);

    // Rotate headline + highlighted card together.
    useEffect(() => {
        const timer = setInterval(() => setIndex(i => (i + 1) % HEADLINES.length), ROTATE_MS);
        return () => clearInterval(timer);
    }, []);

    // Typewriter effect for the current headline.
    useEffect(() => {
        const full = HEADLINES[index].title;
        let n = 0;
        setTyped('');
        const timer = setInterval(() => {
            n += 1;
            setTyped(full.slice(0, n));
            if (n >= full.length) clearInterval(timer);
        }, 45);
        return () => clearInterval(timer);
    }, [index]);

    const login = useCallback(async () => {
        setLoggingIn(true);
        try {
            const url = await generateOAuthURL();
            if (url) window.location.replace(url);
            else setLoggingIn(false);
        } catch {
            setLoggingIn(false);
        }
    }, []);

    const signup = () => window.open(AFFILIATE_SIGNUP_URL, '_blank', 'noopener,noreferrer');

    const bots = getFreeBots().length;
    const stats = [
        { value: feed.markets === null ? '--' : `${feed.markets}`, label: 'Live markets' },
        { value: `${bots}+`, label: 'Free bots' },
        { value: `${TAB_IDS.length}`, label: 'Trading tools' },
        { value: '24/7', label: 'Synthetic markets' },
    ];

    return (
        <div className='te-landing'>
            <div
                className='te-landing__bg'
                aria-hidden='true'
                style={{ '--te-bg-image': `url(${BG_IMAGE})` } as CSSProperties}
            />

            <header className='te-landing__top'>
                <Wordmark />
                <div className='te-landing__top-actions'>
                    <button
                        type='button'
                        className='te-landing__btn te-landing__btn--light'
                        onClick={login}
                        disabled={!has_app_id || logging_in}
                    >
                        {logging_in ? 'Redirecting…' : 'Login Now'} <span aria-hidden='true'>→</span>
                    </button>
                    <button type='button' className='te-landing__btn te-landing__btn--outline' onClick={signup}>
                        Sign Up
                    </button>
                </div>
            </header>
            <TopTicker feed={feed} />

            <main className='te-landing__main'>
                {/* hero */}
                <section className='te-landing__hero'>
                    <p className='te-landing__greeting'>{greeting()}</p>
                    <h1 className='te-landing__headline'>
                        {typed.startsWith('Welcome to ') ? (
                            <>
                                Welcome to{' '}
                                <span className='te-landing__headline-brand'>{typed.slice('Welcome to '.length)}</span>
                            </>
                        ) : (
                            typed
                        )}
                        <span className='te-landing__caret' aria-hidden='true' />
                    </h1>
                    <p className='te-landing__lead'>{HEADLINES[index].text}</p>

                    {/* Two copies scroll right-to-left in a seamless loop. */}
                    <div className='te-landing__carousel'>
                        <div className='te-landing__marquee'>
                            {[0, 1].map(copy =>
                                cards.map(card => (
                                    <article
                                        key={`${copy}-${card.title}`}
                                        className={`te-card te-card--${card.tone}`}
                                        aria-hidden={copy === 1 ? 'true' : undefined}
                                    >
                                        <span className='te-card__avatar'>{card.badge}</span>
                                        <span className='te-card__quote' aria-hidden='true'>
                                            ”
                                        </span>
                                        <p className='te-card__text'>{card.text}</p>
                                        <h3 className='te-card__name'>{card.title}</h3>
                                        <span className='te-card__role'>{card.subtitle}</span>
                                        {card.rating > 0 && (
                                            <span className='te-card__stars' aria-label={`${card.rating} out of 5`}>
                                                {'★'.repeat(card.rating)}
                                            </span>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </div>

                    <div className='te-landing__stats'>
                        {stats.map(stat => (
                            <div key={stat.label} className='te-landing__stat'>
                                <span className='te-landing__stat-circle'>{stat.value}</span>
                                <span className='te-landing__stat-label'>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* features */}
                <section className='te-landing__panel'>
                    <span className='te-landing__chip'>PLATFORM</span>
                    <h2 className='te-landing__h2'>Powerful Features for Modern Traders</h2>
                    <p className='te-landing__muted'>Everything you need in one workspace, powered by live Deriv data.</p>
                    <p className='te-landing__body'>
                        Whether you prefer manual decisions, automated bots or copy trading, {getAppName()} gives you
                        practical tools for finding setups, managing risk and keeping your workflow simple.
                    </p>
                    <div className='te-landing__features'>
                        {FEATURES.map(feature => (
                            <article key={feature.title} className={`te-feature te-feature--${feature.tone}`}>
                                <span className='te-feature__icon'>
                                    <Icon name={feature.icon} />
                                </span>
                                <h3>{feature.title}</h3>
                                <span className='te-feature__sub'>{feature.subtitle}</span>
                                <p>{feature.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* referral */}
                <section className='te-landing__referral'>
                    <span className='te-landing__referral-kicker'>CLIENT REFERRAL</span>
                    <h2>Revenue Share</h2>
                    <span className='te-landing__referral-pill'>Up to 45%</span>
                    <p>
                        Earn up to 45% of the monthly net revenue generated by the clients you refer to Deriv Options
                        trading, through the Deriv partner programme.
                    </p>
                    {referral_open && (
                        <p className='te-landing__referral-more'>
                            Share your referral link, and when the people you refer trade on Deriv you receive a monthly
                            revenue share paid by Deriv. Exact rates depend on Deriv&apos;s partner terms.
                        </p>
                    )}
                    <button type='button' className='te-landing__btn te-landing__btn--ghost' onClick={() => setReferralOpen(o => !o)}>
                        {referral_open ? 'Show less ↑' : 'Show more ↓'}
                    </button>
                    {MASTER_PARTNER_URL ? (
                        <a className='te-landing__btn te-landing__btn--pink' href={MASTER_PARTNER_URL} target='_blank' rel='noopener noreferrer'>
                            Refer a trader →
                        </a>
                    ) : (
                        <button type='button' className='te-landing__btn te-landing__btn--pink' disabled>
                            Referral link coming soon
                        </button>
                    )}
                </section>

                {/* community */}
                <section className='te-landing__community'>
                    <span className='te-landing__chip'>COMMUNITY</span>
                    <h2 className='te-landing__h2'>Join the {getAppName()} Community</h2>
                    <p className='te-landing__muted'>Get updates, new bots and help from the team on Telegram.</p>
                    <div className='te-landing__pills'>
                        <a className='te-landing__pill' href={TELEGRAM_URL} target='_blank' rel='noopener noreferrer'>
                            ✈ Join us on Telegram
                        </a>
                        <span className='te-landing__pill'>🔒 Official Deriv login</span>
                        <span className='te-landing__pill'>⚡ Live Deriv data</span>
                    </div>
                </section>

                {/* why */}
                <section className='te-landing__panel'>
                    <span className='te-landing__chip'>WHY {getAppName().toUpperCase()}</span>
                    <h2 className='te-landing__h2'>Why Choose {getAppName()}?</h2>
                    <p className='te-landing__muted'>Join the platform that makes automated trading simple</p>
                    <ul className='te-landing__why'>
                        {WHY_CHOOSE.map(item => (
                            <li key={item}>
                                <span aria-hidden='true'>✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* cta */}
                <section className='te-landing__cta'>
                    <span className='te-landing__chip'>GET STARTED</span>
                    <h2 className='te-landing__h2'>Ready to Transform Your Trading?</h2>
                    <p className='te-landing__muted'>
                        Open a free Deriv account and practise with virtual funds on the demo account before risking
                        real money.
                    </p>
                    <button type='button' className='te-landing__btn te-landing__btn--green' onClick={signup}>
                        Start Free Demo <span aria-hidden='true'>→</span>
                    </button>
                    <div className='te-landing__checks'>
                        <span>✓ Free to open</span>
                        <span>✓ Virtual funds from Deriv</span>
                        <span>✓ Full platform access</span>
                    </div>
                    <p className='te-landing__muted te-landing__small'>
                        Already have a Deriv account?{' '}
                        <button type='button' className='te-landing__link' onClick={login} disabled={!has_app_id}>
                            Log in
                        </button>
                    </p>
                </section>

                {/* risk */}
                <section className='te-landing__risk'>
                    <h2>⚠️ Risk Disclaimer</h2>
                    <p>
                        Deriv offers complex derivatives, such as options and contracts for difference. These products
                        may not be suitable for all clients, and trading them puts you at risk. Make sure you
                        understand the following risks before trading:
                    </p>
                    <ul>
                        <li>You may lose some or all of the money you invest in a trade.</li>
                        <li>If your trade involves currency conversion, exchange rates will affect your profit and loss.</li>
                        <li>Never trade with borrowed money or with money you cannot afford to lose.</li>
                        <li>Past results, scanner signals and bot performance do not guarantee future results.</li>
                    </ul>
                </section>
            </main>

            <footer className='te-landing__footer'>
                <Wordmark />
                <span>
                    © {new Date().getFullYear()} {getAppName()} · Built on the Deriv API
                </span>
                <a href={TELEGRAM_URL} target='_blank' rel='noopener noreferrer'>
                    Telegram
                </a>
            </footer>
        </div>
    );
};

export default LandingPage;
