import { localize } from '@deriv-com/translations';
import { AccumulatorIcon, EvenOddIcon, MatchesDiffersIcon, OverUnderIcon, RiseFallIcon } from './bot-icons';

export type TTradeType = 'accumulator' | 'callput' | 'evenodd' | 'matchesdiffers' | 'overunder';

/**
 * How much a strategy does on its own.
 *
 * `automated` strategies manage their own stake and recovery and are meant to
 * be started and left alone; `normal` ones expect the trader to set a
 * prediction, entry point or stake ladder first. Both load into Bot Builder the
 * same way - the split is what the trader is signing up for.
 */
export type TBotCategory = 'automated' | 'normal';

export type TFreeBot = {
    /** Stable key, also used as the strategy id when the bot is loaded. */
    id: string;
    /** File name under `public/bots/`. */
    file: string;
    /** Bot name as published â€” a proper noun, so it is not translated. */
    title: string;
    description: string;
    /** Display name of the symbol the strategy ships with. */
    market: string;
    trade_type: TTradeType;
    category: TBotCategory;
};

/** The category pills: every bot, or one of the two categories. */
export type TCategoryChoice = 'all' | TBotCategory;

export const getCategoryLabel = (category: TCategoryChoice): string => {
    if (category === 'all') return localize('All bots');
    return category === 'automated' ? localize('Automated') : localize('Normal');
};

export const TRADE_TYPE_ICONS = {
    accumulator: AccumulatorIcon,
    callput: RiseFallIcon,
    evenodd: EvenOddIcon,
    matchesdiffers: MatchesDiffersIcon,
    overunder: OverUnderIcon,
} as const;

export const getTradeTypeLabel = (trade_type: TTradeType): string => {
    switch (trade_type) {
        case 'accumulator':
            return localize('Accumulators');
        case 'callput':
            return localize('Rise/Fall');
        case 'evenodd':
            return localize('Even/Odd');
        case 'matchesdiffers':
            return localize('Matches/Differs');
        case 'overunder':
            return localize('Over/Under');
        default:
            return trade_type;
    }
};

/**
 * The strategies shipped in `public/bots/`. Each XML is fetched on demand and
 * handed to the bot-skeleton `load()` pipeline, so none of it is bundled.
 *
 * Called during render rather than evaluated at module scope so the copy
 * follows the active language.
 */
export const getFreeBots = (): TFreeBot[] => [
    {
        id: 'expert-speed-bot',
        file: 'expert-speed-bot.xml',
        title: 'Expert Speed Bot',
        description: localize('Fast Rise/Fall entries driven by short-term momentum shifts.'),
        market: localize('Volatility 100 (1s) Index'),
        trade_type: 'callput',
        category: 'automated',
    },
    {
        id: 'candle-mine',
        file: 'candle-mine.xml',
        title: 'Candle Mine',
        description: localize('Reads completed candles before committing to an Even/Odd entry.'),
        market: localize('Volatility 100 Index'),
        trade_type: 'evenodd',
        category: 'normal',
    },
    {
        id: 'accumulators-pro-bot',
        file: 'accumulators-pro-bot.xml',
        title: 'Accumulators Pro Bot',
        description: localize('Compounds a growing payout and exits before the barrier breaks.'),
        market: localize('Volatility 10 (1s) Index'),
        trade_type: 'accumulator',
        category: 'automated',
    },
    {
        id: 'ai-with-entry-point',
        file: 'ai-with-entry-point.xml',
        title: 'AI with Entry Point',
        description: localize('Waits for a configurable entry point before opening Over/Under trades.'),
        market: localize('Volatility 10 (1s) Index'),
        trade_type: 'overunder',
        category: 'normal',
    },
    {
        id: 'alex-speed-bot-expro2',
        file: 'alex-speed-bot-expro2.xml',
        title: 'AlexSpeedBot EXPRO2',
        description: localize('High-frequency Digit Under strategy with staged stake recovery.'),
        market: localize('Volatility 50 (1s) Index'),
        trade_type: 'overunder',
        category: 'automated',
    },
    {
        id: 'alpha-ai-two-predictions',
        file: 'alpha-ai-two-predictions.xml',
        title: 'Alpha AI Two Predictions',
        description: localize('Runs two digit predictions in parallel and trades the stronger one.'),
        market: localize('Volatility 100 (1s) Index'),
        trade_type: 'overunder',
        category: 'automated',
    },
    {
        id: 'auto-c4-volt-ai-premium',
        file: 'auto-c4-volt-ai-premium.xml',
        title: 'Auto C4 Volt AI Premium',
        description: localize('Premium Over/Under robot with automatic stake and recovery handling.'),
        market: localize('Volatility 10 (1s) Index'),
        trade_type: 'overunder',
        category: 'automated',
    },
    {
        id: 'binary-flipper-ai-robot-plus',
        file: 'binary-flipper-ai-robot-plus.xml',
        title: 'Binary Flipper AI Robot Plus',
        description: localize('Flips between Over and Under as the digit distribution moves.'),
        market: localize('Volatility 10 (1s) Index'),
        trade_type: 'overunder',
        category: 'automated',
    },
    {
        id: 'binarytool-differ-v2',
        file: 'binarytool-differ-v2.xml',
        title: 'BinaryTool Differ V2',
        description: localize('Digit Differs strategy built around a rolling prediction variable.'),
        market: localize('Volatility 100 Index'),
        trade_type: 'matchesdiffers',
        category: 'normal',
    },
    {
        id: 'binarytool-even-odd-ai-bot',
        file: 'binarytool-even-odd-ai-bot.xml',
        title: 'BinaryTool Even/Odd AI Bot',
        description: localize('Tracks parity streaks and trades the side that is due.'),
        market: localize('Volatility 100 Index'),
        trade_type: 'evenodd',
        category: 'normal',
    },
    {
        id: 'binarytool-even-odd-thunder-ai-pro',
        file: 'binarytool-even-odd-thunder-ai-pro.xml',
        title: 'BinaryTool Even/Odd Thunder AI Pro',
        description: localize('Aggressive Even/Odd variant with a wider recovery ladder.'),
        market: localize('Volatility 100 Index'),
        trade_type: 'evenodd',
        category: 'automated',
    },
    {
        id: 'binarytool-wizard-ai-bot',
        file: 'binarytool-wizard-ai-bot.xml',
        title: 'BinaryTool Wizard AI Bot',
        description: localize('Combines digit analysis with staged money management.'),
        market: localize('Volatility 100 Index'),
        trade_type: 'overunder',
        category: 'automated',
    },
];
