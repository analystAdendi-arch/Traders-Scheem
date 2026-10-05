import { useCallback, useEffect, useState } from 'react';

import { generateOAuthURL } from '@/components/shared';
import { TAB_IDS } from '@/constants/bot-contents';
import { FinBadge, FinIcon, TFinIconName, TFinTone } from '@/components/fin-ui/FinIcon';
import WhatsAppIcon from '@/components/shared_ui/whatsapp-icon/WhatsAppIcon';
import { getFreeBots } from '@/pages/free-bots/free-bot-list';
import TradingBackdrop from '@/components/trading-backdrop/TradingBackdrop';
import { getAppName, LOGO_CANDIDATES } from '@/utils/branding';

import {
    AFFILIATE_SIGNUP_URL,
    FEATURES,
    FAQ,
    HEADLINES,
    HIGHLIGHTS,
    HOW_IT_WORKS,
    MASTER_PARTNER_URL,
    REVIEWS,
    WHATSAPP_NUMBER,
    WHATSAPP_URL,
    type THighlight,
    WHY_CHOOSE,
} from './content';
import { subscribePublicFeed, TFeedState, TICKER_SYMBOLS } from './public-feed';
import { BrandName, OrbitEmblem } from './SplashScreen';
import './landing-page.scss';

const ROTATE_MS = 5000;
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

// "Traders Scheem" -> ["Traders ", "Scheem"]: split at the first inner capital.
const splitName = (name: string): [string, string] => {
    for (let i = 1; i < name.length; i++) if (/[A-Z]/.test(name[i])) return [name.slice(0, i), name.slice(i)];
    return [name, ''];
};

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

/* ------------------------------------------------------------------ icons */

/** Icon for each highlight card, by its badge code. */
const HIGHLIGHT_ICONS: Record<string, TFinIconName> = {
    AT: 'bolt',
    SC: 'radar',
    AI: 'trend',
    CT: 'copy',
    FB: 'bot',
    AN: 'candles',
};

const TONE_OF: Record<string, TFinTone> = { teal: 'sky', violet: 'purple', sky: 'sky', emerald: 'gold' };

/** The logo emblem (when the file is there) beside the two-tone name. */
const Wordmark = () => {
    const [logo_failed, setLogoFailed] = useState(false);
    const name = getAppName();
    const [first, second] = splitName(name);

    return (
        <span className='te-landing__brand'>
            {!logo_failed && (
                <img
                    className='te-landing__logo'
                    src={LOGO_CANDIDATES[0]}
                    alt=''
                    onError={() => setLogoFailed(true)}
                />
            )}
            <span className='te-landing__wordmark' aria-label={name}>
                <span className='te-landing__wordmark-a'>{first}</span>
                <span className='te-landing__wordmark-b'>{second}</span>
            </span>
        </span>
    );
};

/** Orbiting emblem over the app name, the first thing on the page. */
const HeroBrand = () => (
    <div className='te-landing__hero-brand'>
        <OrbitEmblem size='md' />
        <h1 className='te-landing__hero-name'>
            <BrandName />
        </h1>
        <span className='te-landing__hero-tag'>Professional trading terminal · Powered by Deriv</span>
    </div>
);

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
    const stats: { value: string; label: string; icon: TFinIconName; tone: TFinTone }[] = [
        { value: feed.markets === null ? '--' : `${feed.markets}`, label: 'Live markets', icon: 'globe', tone: 'sky' },
        { value: `${bots}+`, label: 'Strategy bots', icon: 'bot', tone: 'purple' },
        { value: `${TAB_IDS.length}`, label: 'Trading tools', icon: 'blocks', tone: 'gold' },
        { value: '24/7', label: 'Market access', icon: 'clock', tone: 'red' },
    ];

    return (
        <div className='te-landing'>
            <TradingBackdrop />

            <header className='te-landing__top'>
                <Wordmark />
                <div className='te-landing__top-actions'>
                    <button
                        type='button'
                        className='fin-btn fin-btn--glass te-landing__top-btn'
                        onClick={login}
                        disabled={!has_app_id || logging_in}
                    >
                        <FinIcon name='lock' size={16} />
                        <span>{logging_in ? 'Redirecting…' : 'Log in'}</span>
                    </button>
                    <button type='button' className='fin-btn fin-btn--gold te-landing__top-btn' onClick={signup}>
                        <span>Open account</span>
                        <span className='fin-btn__coin' aria-hidden='true'>
                            →
                        </span>
                    </button>
                </div>
            </header>
            <TopTicker feed={feed} />

            <main className='te-landing__main'>
                {/* hero */}
                <section className='te-landing__hero'>
                    <HeroBrand />
                    <p className='te-landing__greeting'>{greeting()}</p>
                    <h2 className='te-landing__headline'>
                        {typed.startsWith('Welcome to ') ? (
                            <>
                                Welcome to{' '}
                                <span className='te-landing__headline-brand'>{typed.slice('Welcome to '.length)}</span>
                            </>
                        ) : (
                            typed
                        )}
                        <span className='te-landing__caret' aria-hidden='true' />
                    </h2>
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
                                        {HIGHLIGHT_ICONS[card.badge] ? (
                                            <FinBadge
                                                name={HIGHLIGHT_ICONS[card.badge]}
                                                tone={TONE_OF[card.tone]}
                                                className='te-card__avatar te-card__avatar--icon'
                                            />
                                        ) : (
                                            <span className='te-card__avatar'>{card.badge}</span>
                                        )}
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
                            <div key={stat.label} className={`te-landing__stat te-landing__stat--${stat.tone}`}>
                                <FinBadge name={stat.icon} tone={stat.tone} size='sm' />
                                <span className='te-landing__stat-value'>{stat.value}</span>
                                <span className='te-landing__stat-label'>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* features */}
                <section className='te-landing__panel'>
                    <span className='te-landing__chip'>THE PLATFORM</span>
                    <h2 className='te-landing__h2'>Institutional-grade tools for every trader</h2>
                    <p className='te-landing__muted'>Live Deriv market data, with every calculation shown rather than hidden.</p>
                    <p className='te-landing__body'>
                        Trade manually, automate a strategy, or mirror one account onto another - {getAppName()} puts the
                        same live numbers in front of you every time, so each position can be justified before capital is
                        at risk.
                    </p>
                    <div className='te-landing__features'>
                        {FEATURES.map(feature => (
                            <article key={feature.title} className={`te-feature te-feature--${feature.tone}`}>
                                <FinBadge name={feature.icon} tone={feature.tone} size='lg' />
                                <h3>{feature.title}</h3>
                                <span className='te-feature__sub'>{feature.subtitle}</span>
                                <p>{feature.text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* how it works */}
                <section className='te-landing__panel'>
                    <span className='te-landing__chip'>GETTING STARTED</span>
                    <h2 className='te-landing__h2'>From sign-in to your first position in three steps</h2>
                    <p className='te-landing__muted'>No downloads, no licence keys, no set-up fees.</p>
                    <ol className='te-landing__steps'>
                        {HOW_IT_WORKS.map(step => (
                            <li key={step.title} className='te-step'>
                                <span className='te-step__badge' aria-hidden='true'>
                                    {step.badge}
                                </span>
                                <h3 className='te-step__title'>{step.title}</h3>
                                <p className='te-step__text'>{step.text}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* referral */}
                <section className='te-landing__referral'>
                    <FinBadge name='coins' tone='gold' size='lg' className='te-landing__referral-badge' />
                    <span className='te-landing__referral-kicker'>PARTNER PROGRAMME</span>
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
                    <button type='button' className='fin-btn fin-btn--glass fin-btn--block' onClick={() => setReferralOpen(o => !o)}>
                        <span>{referral_open ? 'Show less' : 'How the revenue share works'}</span>
                        <span aria-hidden='true'>{referral_open ? '↑' : '↓'}</span>
                    </button>
                    {MASTER_PARTNER_URL ? (
                        <a className='fin-btn fin-btn--aurora fin-btn--block' href={MASTER_PARTNER_URL} target='_blank' rel='noopener noreferrer'>
                            <FinIcon name='coins' size={18} />
                            <span>Become a partner</span>
                            <span className='fin-btn__coin' aria-hidden='true'>
                                →
                            </span>
                        </a>
                    ) : (
                        <button type='button' className='fin-btn fin-btn--aurora fin-btn--block' disabled>
                            <span>Referral link coming soon</span>
                        </button>
                    )}
                </section>

                {/* community */}
                <section className='te-landing__community'>
                    <span className='te-landing__chip'>COMMUNITY</span>
                    <h2 className='te-landing__h2'>Join the {getAppName()} trading community</h2>
                    <p className='te-landing__muted'>Market updates, new strategies and direct support from the team on WhatsApp.</p>
                    <div className='te-landing__pills'>
                        <a className='te-landing__pill te-landing__pill--whatsapp' href={WHATSAPP_URL} target='_blank' rel='noopener noreferrer'>
                            <WhatsAppIcon size={18} /> Chat on WhatsApp · {WHATSAPP_NUMBER}
                        </a>
                        <span className='te-landing__pill'>
                            <FinIcon name='lock' size={16} /> Secure Deriv login
                        </span>
                        <span className='te-landing__pill'>
                            <FinIcon name='bolt' size={16} /> Real-time Deriv data
                        </span>
                    </div>
                </section>

                {/* why */}
                <section className='te-landing__panel'>
                    <span className='te-landing__chip'>WHY {getAppName().toUpperCase()}</span>
                    <h2 className='te-landing__h2'>The advantages behind every trade</h2>
                    <p className='te-landing__muted'>Concrete benefits, not marketing claims.</p>
                    <ul className='te-landing__why'>
                        {WHY_CHOOSE.map(item => (
                            <li key={item}>
                                <span aria-hidden='true'>
                                    <FinIcon name='shield' size={18} />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* faq */}
                <section className='te-landing__panel'>
                    <span className='te-landing__chip'>QUESTIONS</span>
                    <h2 className='te-landing__h2'>Questions traders ask first</h2>
                    <p className='te-landing__muted'>Straight answers, including the one about returns.</p>
                    <div className='te-landing__faq'>
                        {FAQ.map(item => (
                            <details key={item.q} className='te-faq'>
                                <summary className='te-faq__q'>{item.q}</summary>
                                <p className='te-faq__a'>{item.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* cta */}
                <section className='te-landing__cta'>
                    <span className='te-landing__chip'>GET STARTED</span>
                    <h2 className='te-landing__h2'>Build your track record on demo</h2>
                    <p className='te-landing__muted'>
                        Opening a Deriv account is free. Prove your strategy with virtual funds for as long as you need,
                        and commit real capital only when your own results justify it.
                    </p>
                    <button type='button' className='fin-btn fin-btn--gold fin-btn--lg' onClick={signup}>
                        <span>Open a free demo account</span>
                        <span className='fin-btn__coin' aria-hidden='true'>
                            →
                        </span>
                    </button>
                    <div className='te-landing__checks'>
                        <span>
                            <FinIcon name='shield' size={16} /> Free to open
                        </span>
                        <span>
                            <FinIcon name='coins' size={16} /> Virtual funds from Deriv
                        </span>
                        <span>
                            <FinIcon name='blocks' size={16} /> Every tool included
                        </span>
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
                    <h2>
                        <FinBadge name='shield' tone='red' size='sm' /> Risk disclosure
                    </h2>
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
                <a className='te-landing__footer-wa' href={WHATSAPP_URL} target='_blank' rel='noopener noreferrer'>
                    <WhatsAppIcon size={16} /> {WHATSAPP_NUMBER}
                </a>
            </footer>
        </div>
    );
};

export default LandingPage;
