/**
 * Front-page copy and links. Edit here - the components only render it.
 * Keep claims factual: no invented numbers, no promise of profit.
 */
import { getAppName } from '@/utils/branding';

const APP = getAppName();

/** Deriv sign-up through the affiliate link (commission tracking). */
export const AFFILIATE_SIGNUP_URL =
    process.env.NEXT_PUBLIC_DERIV_REFERRAL_LINK ||
    'https://t.deriv.link?t=63PLZ8T6L73Q';

/** Master partner (client referral) link - the "Refer a trader" button. */
export const MASTER_PARTNER_URL = 'https://t.deriv.link?t=CL5VDD7SGG27';

export { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/constants/contact';

export const HEADLINES = [
    {
        title: `Welcome to ${APP}`,
        text: 'A professional trading desk on your Deriv account: live market data, automated execution and risk controls in one terminal.',
    },
    {
        title: 'Trade on evidence, not instinct',
        text: 'Digit distributions, live streaks and measured hit rates, calculated tick by tick from real Deriv price feeds.',
    },
    {
        title: 'Allocate where the edge is',
        text: 'The scanner ranks every open market and contract type by measurable signal, then routes the strongest setup to a bot.',
    },
    {
        title: 'Execution that keeps to your plan',
        text: 'Set the stake, contract and risk limits once. Automated execution follows the rules without hesitation or second guessing.',
    },
    {
        title: 'Test your strategy before your capital',
        text: 'Every tool runs on a free Deriv demo account with virtual funds, so a strategy can be proven before real money is committed.',
    },
    {
        title: 'One terminal, one data source',
        text: 'Scanner, digit analytics, charts, automation and copy trading share the same live feed, so every decision reads the same numbers.',
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
        subtitle: 'Rule-based execution',
        text: 'Define the entry condition - five even digits in a row, Over above 60% - and positions are opened and tracked for you.',
        tone: 'teal',
    },
    {
        badge: 'SC',
        title: 'Signal Scanner',
        subtitle: 'Market intelligence',
        text: 'Analyses a market for Even/Odd, Over/Under, Matches/Differs or Rise/Fall and reports the measured outcome, not a forecast.',
        tone: 'violet',
    },
    {
        badge: 'AI',
        title: 'AI Entry Scanner',
        subtitle: 'Opportunity ranking',
        text: 'Sweeps every open market, ranks each one by the edge it can measure, and passes the leader to the bot builder.',
        tone: 'sky',
    },
    {
        badge: 'CT',
        title: 'Copy Trading',
        subtitle: 'Portfolio mirroring',
        text: 'Mirror demo positions onto your real account, or replicate one trade across client accounts in a single request.',
        tone: 'emerald',
    },
    {
        badge: 'FB',
        title: 'Free Bots',
        subtitle: 'Strategy library',
        text: 'A library of ready strategies, filtered by contract type, that open in the editor so the rules can be tuned to your risk.',
        tone: 'violet',
    },
    {
        badge: 'AN',
        title: 'Analysis Tool',
        subtitle: 'Live digit analytics',
        text: 'Track each digit\'s share of the market live, with the current run, tick history and Over/Under split as prices move.',
        tone: 'teal',
    },
];

export const FEATURES = [
    {
        icon: 'bot',
        title: 'Automated execution',
        subtitle: 'Your strategy, on repeat',
        text: 'Build with blocks, load a free bot or give the Auto Trader a rule. Systematic trading with no programming required.',
        tone: 'sky',
    },
    {
        icon: 'candles',
        title: 'Transparent analytics',
        subtitle: 'Measured, not guessed',
        text: 'Every percentage is calculated from live Deriv ticks over a sample size you choose, so the method is always visible.',
        tone: 'gold',
    },
    {
        icon: 'copy',
        title: 'Copy trading built in',
        subtitle: 'One position, many accounts',
        text: 'Practise on demo while your real account follows, or allocate a single trade across client accounts at once.',
        tone: 'purple',
    },
    {
        icon: 'shield',
        title: 'Risk management first',
        subtitle: 'Limits before exposure',
        text: 'Stake size, martingale step, stop loss and take profit are part of every run, so drawdown always has a floor.',
        tone: 'red',
    },
] as const;

export const WHY_CHOOSE = [
    'Secure sign-in through Deriv itself - your password never touches our servers',
    'Free Deriv demo account, so every strategy can be stress-tested with virtual funds',
    'Prices, digits and settlements come directly from the Deriv API, in real time',
    'Analytics, scanning, a strategy library and automation in a single terminal',
    'Synthetic indices that trade around the clock, including weekends',
    'Direct support from a real person on WhatsApp whenever you need it',
];

export type TStep = { badge: string; title: string; text: string };

/** Three-step onboarding shown under the features panel. */
export const HOW_IT_WORKS: TStep[] = [
    {
        badge: '1',
        title: 'Connect your Deriv account',
        text: `Sign in through the official Deriv login. ${APP} receives a secure session, never your password.`,
    },
    {
        badge: '2',
        title: 'Analyse, then select a strategy',
        text: 'Read the digit analytics or run the scanner, then load a free bot or set an Auto Trader rule that fits the data.',
    },
    {
        badge: '3',
        title: 'Validate on demo, then deploy',
        text: 'Prove the strategy on your demo account first. When the results hold, switch to real and set your risk limits.',
    },
];

export type TFaq = { q: string; a: string };

export const FAQ: TFaq[] = [
    {
        q: `Do I need a Deriv account to use ${APP}?`,
        a: 'Yes. The tools read live prices and place trades on your own Deriv account, so you sign in with Deriv. Opening an account is free, and the demo account comes funded with virtual money.',
    },
    {
        q: 'Is my Deriv password safe?',
        a: 'You enter it on Deriv\'s own login page, never here. Deriv issues a session for your account only, and you can revoke it at any time from your Deriv settings.',
    },
    {
        q: 'Can I test strategies without risking capital?',
        a: 'Yes. Switch the account selector to Demo and the scanner, analytics, bots and Auto Trader all run on virtual funds.',
    },
    {
        q: 'Do I need programming experience?',
        a: 'No. Free bots load in one click, the Auto Trader accepts plain conditions, and the bot builder works by connecting blocks.',
    },
    {
        q: 'Which markets can I trade?',
        a: 'Every market your Deriv account offers, including synthetic indices that trade 24/7. The market list comes straight from Deriv, so it is always current.',
    },
    {
        q: 'Will a bot guarantee returns?',
        a: 'No tool can guarantee returns, and nothing here claims to. Automation removes manual clicking and hesitation; the market risk remains yours, which is why limits and demo testing matter.',
    },
];
