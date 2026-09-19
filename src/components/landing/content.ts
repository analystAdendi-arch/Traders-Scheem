/**
 * Front-page copy and links. Edit here - the components only render it.
 */

/** Deriv sign-up through the TradersEdge affiliate link (commission tracking). */
export const AFFILIATE_SIGNUP_URL =
    process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ||
    'https://partner-tracking.deriv.com/click?a=54565&o=1&c=3&link_id=1';

/**
 * Master partner (client referral) link. Leave empty until you have it - the
 * "Refer a trader" button stays disabled and shows "Coming soon" meanwhile.
 */
export const MASTER_PARTNER_URL = '';

export const TELEGRAM_URL = 'https://t.me/TradersEdgecom';

export const HEADLINES = [
    {
        title: 'Welcome to TradersEdge',
        text: 'Your all-in-one workspace for automated trading, smart bots and live market insights.',
    },
    {
        title: 'Trade with better tools',
        text: 'Live digit analysis, a market scanner and an auto trader - all on real Deriv data.',
    },
    {
        title: 'Simplify your market analysis',
        text: 'See digit frequencies, streaks and win rates at a glance instead of guessing.',
    },
    {
        title: 'Get access to free bots',
        text: 'Load ready-made strategies into the bot builder and start in seconds - no coding.',
    },
    {
        title: 'Trade smarter, not harder',
        text: 'Automate repetitive strategies and stay focused on your plan, not the screen.',
    },
    {
        title: 'Built for every kind of trader',
        text: 'From manual trades to full automation, TradersEdge adapts to the way you work.',
    },
];

export type TReview = {
    /** Real customer name (with their permission). */
    name: string;
    role: string;
    quote: string;
    /** 1-5 */
    rating: number;
};

/**
 * Real customer reviews only - add them here once genuine users send feedback
 * and agree to be quoted. While this list is empty, the carousel shows the
 * platform highlights below instead, so no invented testimonials are published.
 */
export const REVIEWS: TReview[] = [];

export type THighlight = {
    badge: string;
    title: string;
    subtitle: string;
    text: string;
    tone: 'teal' | 'violet' | 'sky' | 'emerald';
};

export const HIGHLIGHTS: THighlight[] = [
    {
        badge: 'AT',
        title: 'Auto Trader',
        subtitle: 'Rule-based automation',
        text: 'Set a condition like "last 5 digits even" or "Over % above 60" and let it place and track trades for you.',
        tone: 'teal',
    },
    {
        badge: 'SC',
        title: 'Signal Scanner',
        subtitle: 'Live market analysis',
        text: 'Analyse any market for Even/Odd, Over/Under, Matches/Differs or Rise/Fall and see the real win rates.',
        tone: 'violet',
    },
    {
        badge: 'AI',
        title: 'AI Entry Scanner',
        subtitle: 'Best-market search',
        text: 'Scans every open market and contract type, ranks them by measured edge and loads the best into a bot.',
        tone: 'sky',
    },
    {
        badge: 'CT',
        title: 'Copy Trading',
        subtitle: 'Demo to Real and clients',
        text: 'Mirror your Demo trades to your Real account, or copy your trades to clients through Deriv Bulk Purchase.',
        tone: 'emerald',
    },
    {
        badge: 'FB',
        title: 'Free Bots',
        subtitle: 'Ready-made strategies',
        text: 'Browse a library of free bots, filter by trade type and load any of them into the bot builder.',
        tone: 'violet',
    },
    {
        badge: 'AN',
        title: 'Analysis Tool',
        subtitle: 'Digit circles & streaks',
        text: 'Track digit frequency, current streaks and tick history for any market in real time.',
        tone: 'teal',
    },
];

export const FEATURES = [
    {
        icon: 'bot',
        title: 'Smart Trading Bots',
        subtitle: 'Automate your plan',
        text: 'Build bots visually, load free strategies or let the Auto Trader follow your rules. No coding required.',
        tone: 'sky',
    },
    {
        icon: 'chart',
        title: 'Real-Time Market Analysis',
        subtitle: 'Data-driven decisions',
        text: 'Live Deriv ticks, digit statistics, charts and a scanner that measures real win rates across markets.',
        tone: 'emerald',
    },
    {
        icon: 'users',
        title: 'Copy Trading',
        subtitle: 'Mirror trades automatically',
        text: 'Copy your Demo trades to your Real account, or share your trades with clients using Deriv Bulk Purchase.',
        tone: 'violet',
    },
    {
        icon: 'shield',
        title: 'Risk Management Tools',
        subtitle: 'Protect your capital',
        text: 'Stake, martingale, stop-loss and take-profit settings, plus a free Deriv demo account to practise on.',
        tone: 'sky',
    },
] as const;

export const WHY_CHOOSE = [
    'Official Deriv login - we never see your password',
    'Free Deriv demo account with virtual funds for risk-free testing',
    'Live market data straight from the Deriv API',
    'Free bots, signal scanner and analysis tools in one place',
    'Synthetic markets you can trade 24/7',
    'Direct support on Telegram',
];
