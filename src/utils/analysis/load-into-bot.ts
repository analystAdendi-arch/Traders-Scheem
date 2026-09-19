/**
 * Hand a scanned strategy over to the bot builder.
 *
 * The quick-strategy form is the app's own entry point into Blockly, so the
 * scanners drive it rather than generating XML themselves. The contract type
 * is passed in the `type` field because `quick_strategy.onSubmit` maps that
 * field onto the strategy's `purchase` block.
 */
import { DBOT_TABS } from '@/constants/bot-contents';

import { TStrategyDefinition } from './strategies';

export type TBotParams = {
    stake: number;
    /** Martingale multiplier. */
    martingale: number;
    /** Consecutive wins to stop after (0 = no limit). */
    wins: number;
    /** Stop loss in account currency (0 = none). */
    stopLoss: number;
    useMartingale: boolean;
};

export type TLoadMeta = {
    display_name: string;
    strategy_label: string;
    /** 0-100 */
    confident_win_rate: number;
    /** percentage points */
    edge: number;
    ticks_analysed: number;
    trigger_digit: number | null;
};

const QS_FIELDS_KEY = 'qs-fields';
const AI_SCANNER_META_KEY = '__analysisScannerMeta';

/**
 * Quick-strategy form payload for a scanned strategy.
 *
 * Duration is fixed at one tick because that is the horizon every scanner
 * statistic is measured over - the contract resolves on the next tick.
 */
export const buildQuickStrategyFormData = (
    symbol: string,
    definition: TStrategyDefinition,
    params: TBotParams,
    action: 'RUN' | 'LOAD' = 'RUN'
): Record<string, any> => {
    const has_prediction = definition.barrier !== null;
    const stop_loss = Number(params.stopLoss) > 0 ? String(params.stopLoss) : '0';

    return {
        symbol,
        tradetype: definition.trade_type,
        // `onSubmit` reads this as the contract to purchase.
        type: definition.contract_type,
        durationtype: 't',
        duration: 1,
        action,
        stake: String(params.stake),
        unit: String(params.martingale),
        size: String(params.martingale),
        growth_rate: '0.01',
        last_digit_prediction: has_prediction ? String(definition.barrier) : '1',
        boolean_martingale: !!params.useMartingale,
        boolean_max_stake: Number(params.stopLoss) > 0,
        max_stake: stop_loss,
        boolean_tick_count: Number(params.wins) > 0,
        tick_count: String(Math.max(0, Math.trunc(params.wins))),
        take_profit: '0',
        profit: '0',
        loss: stop_loss,
        boolean_profit: false,
        boolean_loss: Number(params.stopLoss) > 0,
        boolean_stop_loss: Number(params.stopLoss) > 0,
    };
};

export type TStoreLike = {
    dashboard?: { setBotBuilderSymbol?: (symbol: string) => void; setActiveTab?: (tab: number) => void };
    quick_strategy?: {
        setValue: (name: string, value: any) => void;
        setSelectedStrategy: (strategy: string) => void;
        setFormVisibility: (open: boolean) => void;
        onSubmit: (data: Record<string, any>) => Promise<void> | void;
    };
};

const persistFormData = (form_data: Record<string, any>, meta: TLoadMeta) => {
    try {
        const existing = JSON.parse(localStorage.getItem(QS_FIELDS_KEY) ?? '{}');
        localStorage.setItem(
            QS_FIELDS_KEY,
            JSON.stringify({ ...existing, ...form_data, [AI_SCANNER_META_KEY]: meta })
        );
    } catch {
        /* private mode / quota: the in-memory form values still apply */
    }
};

/**
 * Load a scanned strategy into the bot builder, optionally starting it.
 *
 * `run` is only ever true from an explicit user action (the parameters dialog),
 * never as a side effect of scanning.
 */
export const loadStrategyIntoBot = async (
    store: TStoreLike,
    input: {
        symbol: string;
        definition: TStrategyDefinition;
        params: TBotParams;
        meta: TLoadMeta;
        run: boolean;
    }
): Promise<void> => {
    const { quick_strategy, dashboard } = store;
    if (!quick_strategy || !dashboard) throw new Error('Bot builder is not ready yet.');

    const form_data = buildQuickStrategyFormData(
        input.symbol,
        input.definition,
        input.params,
        input.run ? 'RUN' : 'LOAD'
    );

    Object.entries(form_data).forEach(([key, value]) => quick_strategy.setValue(key, value));
    persistFormData(form_data, input.meta);

    dashboard.setBotBuilderSymbol?.(input.symbol);
    dashboard.setActiveTab?.(DBOT_TABS.BOT_BUILDER);

    // No Quick Strategy form in between: the parameters were already collected,
    // so the strategy is submitted directly (and started when action is RUN).
    quick_strategy.setSelectedStrategy(input.params.useMartingale ? 'MARTINGALE' : 'D_ALEMBERT');

    // Let the bot-builder workspace mount before the strategy XML is loaded.
    await new Promise<void>(resolve => setTimeout(resolve, 250));
    await quick_strategy.onSubmit(form_data);
};
