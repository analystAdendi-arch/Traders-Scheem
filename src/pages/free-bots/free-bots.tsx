import React from 'react';
import { observer } from 'mobx-react-lite';
import { botNotification } from '@/components/bot-notification/bot-notification';
import { getUrlBase } from '@/components/shared';
import TradingBackdrop from '@/components/trading-backdrop/TradingBackdrop';
import { DBOT_TABS } from '@/constants/bot-contents';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import {
    getCategoryLabel,
    getFreeBots,
    getTradeTypeLabel,
    type TCategoryChoice,
    type TFreeBot,
    type TTradeType,
    TRADE_TYPE_ICONS,
} from './free-bot-list';
import './free-bots.scss';

type TFilter = 'all' | TTradeType;

const CATEGORIES: TCategoryChoice[] = ['all', 'automated', 'normal'];

const CATEGORY_ICONS: Record<TCategoryChoice, string> = {
    all: '🗂️',
    automated: '⚡',
    normal: '🤖',
};

const FreeBots = observer(() => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;
    const [loading_bot_id, setLoadingBotId] = React.useState<string | null>(null);
    const [filter, setFilter] = React.useState<TFilter>('all');
    const [category, setCategory] = React.useState<TCategoryChoice>('all');
    const is_mounted = React.useRef(true);

    React.useEffect(() => {
        is_mounted.current = true;
        return () => {
            is_mounted.current = false;
        };
    }, []);

    const handleLoad = React.useCallback(
        async (bot: TFreeBot) => {
            const workspace = window.Blockly?.derivWorkspace;

            if (!workspace) {
                botNotification(localize('Bot Builder is still loading. Please try again in a moment.'));
                return;
            }

            setLoadingBotId(bot.id);

            try {
                const response = await fetch(getUrlBase(`/bots/${bot.file}`));

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${bot.file}: ${response.status}`);
                }

                const block_string = await response.text();

                // load() reports its own failures (malformed XML, unsupported blocks)
                // through a bot notification, so only the fetch is handled here.
                await load({
                    block_string,
                    file_name: bot.title,
                    // Stable id so re-loading a free bot reuses its recent-strategy
                    // entry instead of adding a duplicate.
                    strategy_id: bot.id,
                    workspace,
                    from: save_types.UNSAVED,
                    drop_event: {},
                    showIncompatibleStrategyDialog: false,
                });

                setActiveTab(DBOT_TABS.BOT_BUILDER);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                botNotification(localize('Could not load {{bot_name}}. Please try again.', { bot_name: bot.title }));
            } finally {
                if (is_mounted.current) setLoadingBotId(null);
            }
        },
        [setActiveTab]
    );

    const all_bots = getFreeBots();
    // Category first, so the trade-type filters below only ever offer types that
    // exist in the chosen category - no filter that leads to an empty grid.
    const bots = category === 'all' ? all_bots : all_bots.filter(bot => bot.category === category);
    const types = Array.from(new Set(bots.map(bot => bot.trade_type)));
    const visible = filter === 'all' ? bots : bots.filter(bot => bot.trade_type === filter);

    return (
        <div className='free-bots' data-testid='dt_free_bots'>
            <TradingBackdrop />

            <div className='free-bots__inner'>
                <div className='free-bots__header'>
                    <h2 className='free-bots__title'>{localize('Free Bots')}</h2>
                    <p className='free-bots__subtitle'>
                        {localize('Load a ready-made strategy into Bot Builder and start trading in seconds.')}
                    </p>
                </div>

                <div className='free-bots__categories' role='tablist' aria-label={localize('Bot category')}>
                    {CATEGORIES.map(value => (
                        <button
                            key={value}
                            type='button'
                            role='tab'
                            aria-selected={category === value}
                            className={`free-bots__category${category === value ? ' free-bots__category--active' : ''}`}
                            onClick={() => {
                                setCategory(value);
                                // The previous trade type may not exist in this
                                // category, which would show an empty grid.
                                setFilter('all');
                            }}
                        >
                            <span aria-hidden='true'>{CATEGORY_ICONS[value]}</span>
                            {getCategoryLabel(value)}
                            <span className='free-bots__category-count'>
                                {value === 'all'
                                    ? all_bots.length
                                    : all_bots.filter(bot => bot.category === value).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className='free-bots__filters' role='tablist'>
                    {(['all', ...types] as TFilter[]).map(type => (
                        <button
                            key={type}
                            type='button'
                            role='tab'
                            aria-selected={filter === type}
                            className={`free-bots__filter${filter === type ? ' free-bots__filter--active' : ''}`}
                            onClick={() => setFilter(type)}
                        >
                            {type === 'all' ? localize('All bots') : getTradeTypeLabel(type)}
                            <span className='free-bots__filter-count'>
                                {type === 'all' ? bots.length : bots.filter(bot => bot.trade_type === type).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className='free-bots__grid'>
                    {visible.map(bot => {
                        const Icon = TRADE_TYPE_ICONS[bot.trade_type];
                        const is_loading = loading_bot_id === bot.id;

                        return (
                            <article key={bot.id} className={`free-bots__card free-bots__card--${bot.trade_type}`}>
                                <div className='free-bots__card-top'>
                                    <span className='free-bots__card-icon'>
                                        <Icon />
                                    </span>
                                    <h3 className='free-bots__card-title'>{bot.title}</h3>
                                    <span className='free-bots__badge'>{getTradeTypeLabel(bot.trade_type)}</span>
                                    {bot.category === 'automated' && (
                                        <span className='free-bots__badge free-bots__badge--auto'>
                                            {localize('AUTO')}
                                        </span>
                                    )}
                                </div>
                                <p className='free-bots__card-desc'>{bot.description}</p>
                                <span className='free-bots__card-market'>📈 {bot.market}</span>
                                <button
                                    type='button'
                                    className='free-bots__card-cta'
                                    disabled={loading_bot_id !== null}
                                    onClick={() => handleLoad(bot)}
                                >
                                    <span aria-hidden='true'>⚡</span>
                                    {is_loading ? localize('Loading…') : localize('Load Bot')}
                                </button>
                            </article>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default FreeBots;
