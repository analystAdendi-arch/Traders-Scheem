/**
 * Strategy universe + evaluation.
 *
 * The universe is *generated* from the contract types Deriv reports for a
 * symbol (`contracts_for`), not written down in advance, and every score is
 * measured on real Deriv ticks. A strategy's rating is the 95% confidence
 * lower bound of its edge over the contract's fair probability, so a lucky
 * 8-tick run can never outrank a persistent bias measured over hundreds.
 *
 * Every contract modelled here settles on the very next tick (1-tick
 * duration), which is exactly how the scanners load it into the bot, so the
 * measured win rate and the traded win rate describe the same thing.
 */
import { clamp, proportionZScore, round, wilsonLowerBound } from './digits';

export type TStrategyFamily = 'overunder' | 'matchesdiffers' | 'evenodd' | 'callput';

export type TContractType =
    | 'DIGITOVER'
    | 'DIGITUNDER'
    | 'DIGITMATCH'
    | 'DIGITDIFF'
    | 'DIGITEVEN'
    | 'DIGITODD'
    | 'CALL'
    | 'PUT';

export type TResolveContext = {
    digits: number[];
    quotes: number[];
};

export type TStrategyDefinition = {
    id: string;
    family: TStrategyFamily;
    contract_type: TContractType;
    /** Quick-strategy trade type this maps onto in the bot builder. */
    trade_type: string;
    label: string;
    short_label: string;
    /** Digit barrier / prediction; null for even-odd and rise-fall. */
    barrier: number | null;
    /** Fair win probability on uniform random digits (0-1). */
    baseline: number;
    /** Does this contract win on tick `i`? `null` when tick `i` cannot resolve it. */
    resolve: (ctx: TResolveContext, i: number) => boolean | null;
};

const digitAt = (ctx: TResolveContext, i: number): number | null => {
    const d = ctx.digits[i];
    return Number.isFinite(d) ? d : null;
};

const overUnderBarriers = (contract_type: 'DIGITOVER' | 'DIGITUNDER'): number[] =>
    // Deriv pays nothing on a tie, so Over 9 and Under 0 can never win.
    contract_type === 'DIGITOVER' ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9];

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const buildOverUnder = (contract_type: 'DIGITOVER' | 'DIGITUNDER'): TStrategyDefinition[] =>
    overUnderBarriers(contract_type).map(barrier => {
        const is_over = contract_type === 'DIGITOVER';
        const winning_digits = is_over ? 9 - barrier : barrier;
        return {
            id: `${contract_type}_${barrier}`,
            family: 'overunder' as const,
            contract_type,
            trade_type: 'overunder',
            label: `${is_over ? 'Over' : 'Under'} ${barrier}`,
            short_label: `${is_over ? 'O' : 'U'}${barrier}`,
            barrier,
            baseline: winning_digits / 10,
            resolve: (ctx, i) => {
                const d = digitAt(ctx, i);
                if (d === null) return null;
                return is_over ? d > barrier : d < barrier;
            },
        };
    });

const buildMatchDiffer = (contract_type: 'DIGITMATCH' | 'DIGITDIFF'): TStrategyDefinition[] =>
    DIGITS.map(barrier => {
        const is_match = contract_type === 'DIGITMATCH';
        return {
            id: `${contract_type}_${barrier}`,
            family: 'matchesdiffers' as const,
            contract_type,
            trade_type: 'matchesdiffers',
            label: `${is_match ? 'Matches' : 'Differs'} ${barrier}`,
            short_label: `${is_match ? 'M' : 'D'}${barrier}`,
            barrier,
            baseline: is_match ? 0.1 : 0.9,
            resolve: (ctx, i) => {
                const d = digitAt(ctx, i);
                if (d === null) return null;
                return is_match ? d === barrier : d !== barrier;
            },
        };
    });

const buildEvenOdd = (contract_type: 'DIGITEVEN' | 'DIGITODD'): TStrategyDefinition[] => {
    const is_even = contract_type === 'DIGITEVEN';
    return [
        {
            id: contract_type,
            family: 'evenodd',
            contract_type,
            trade_type: 'evenodd',
            label: is_even ? 'Even' : 'Odd',
            short_label: is_even ? 'EVEN' : 'ODD',
            barrier: null,
            baseline: 0.5,
            resolve: (ctx, i) => {
                const d = digitAt(ctx, i);
                if (d === null) return null;
                return is_even ? d % 2 === 0 : d % 2 === 1;
            },
        },
    ];
};

const buildRiseFall = (contract_type: 'CALL' | 'PUT'): TStrategyDefinition[] => {
    const is_rise = contract_type === 'CALL';
    return [
        {
            id: contract_type,
            family: 'callput',
            contract_type,
            trade_type: 'callput',
            label: is_rise ? 'Rise' : 'Fall',
            short_label: is_rise ? 'RISE' : 'FALL',
            barrier: null,
            baseline: 0.5,
            resolve: (ctx, i) => {
                if (i < 1) return null;
                const prev = ctx.quotes[i - 1];
                const curr = ctx.quotes[i];
                if (!Number.isFinite(prev) || !Number.isFinite(curr)) return null;
                if (curr === prev) return null; // a flat tick resolves neither way
                return is_rise ? curr > prev : curr < prev;
            },
        },
    ];
};

const BUILDERS: Record<TContractType, () => TStrategyDefinition[]> = {
    DIGITOVER: () => buildOverUnder('DIGITOVER'),
    DIGITUNDER: () => buildOverUnder('DIGITUNDER'),
    DIGITMATCH: () => buildMatchDiffer('DIGITMATCH'),
    DIGITDIFF: () => buildMatchDiffer('DIGITDIFF'),
    DIGITEVEN: () => buildEvenOdd('DIGITEVEN'),
    DIGITODD: () => buildEvenOdd('DIGITODD'),
    CALL: () => buildRiseFall('CALL'),
    PUT: () => buildRiseFall('PUT'),
};

export const SUPPORTED_CONTRACT_TYPES = Object.keys(BUILDERS) as TContractType[];

/**
 * Generate every strategy playable on a symbol.
 *
 * `available` is the set Deriv returned from `contracts_for`; pass `null` only
 * when that call is unavailable, which falls back to the full universe.
 */
export const buildStrategyUniverse = (available: Set<string> | null): TStrategyDefinition[] => {
    const types = SUPPORTED_CONTRACT_TYPES.filter(type => !available || available.has(type));
    return types.flatMap(type => BUILDERS[type]());
};

/* ------------------------------------------------------------- evaluation */

export type TTrigger = {
    /** Enter when the previous tick's last digit equals this. */
    previous_digit: number;
    trials: number;
    wins: number;
    /** 0-100 */
    win_rate: number;
    /** 0-100, 95% confidence lower bound */
    confident_win_rate: number;
    /** percentage points above fair value, at 95% confidence */
    edge: number;
};

export type TStrategyEvaluation = {
    definition: TStrategyDefinition;
    trials: number;
    wins: number;
    /** 0-100 */
    win_rate: number;
    /** 0-100 */
    baseline: number;
    /** 0-100, 95% confidence lower bound of the win rate */
    confident_win_rate: number;
    /** win_rate - baseline, percentage points */
    raw_edge: number;
    /** confident_win_rate - baseline, percentage points. Negative means no edge. */
    edge: number;
    /** 0-100: statistical confidence the bias is real, not noise. */
    confidence: number;
    /** Edge measured on the most recent slice only, percentage points. */
    recent_edge: number;
    /** 0-1: how much of the overall edge the recent slice still shows. */
    persistence: number;
    /** Ranking value: edge, damped when the recent slice disagrees. */
    score: number;
    /** Best data-derived entry condition, when one beats the unconditional edge. */
    trigger: TTrigger | null;
    /** Consecutive wins (positive) or losses (negative) at the end of the window. */
    trailing_streak: number;
};

export type TEvaluateOptions = {
    /** Ticks in the trailing slice used for the persistence check. */
    recent_window?: number;
    /** Minimum resolved ticks before a conditional trigger is trusted. */
    min_trigger_trials?: number;
};

const DEFAULT_RECENT_WINDOW = 120;
const DEFAULT_MIN_TRIGGER_TRIALS = 25;

/** Abramowitz-Stegun normal CDF, good to ~7 decimals. */
const normalCdf = (z: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const poly =
        t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const density = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    const upper_tail = density * poly;
    return z >= 0 ? 1 - upper_tail : upper_tail;
};

export const evaluateStrategy = (
    ctx: TResolveContext,
    definition: TStrategyDefinition,
    options: TEvaluateOptions = {}
): TStrategyEvaluation => {
    const recent_window = options.recent_window ?? DEFAULT_RECENT_WINDOW;
    const min_trigger_trials = options.min_trigger_trials ?? DEFAULT_MIN_TRIGGER_TRIALS;
    const baseline = definition.baseline;
    const length = Math.min(ctx.digits.length, ctx.quotes.length || ctx.digits.length);

    let trials = 0;
    let wins = 0;
    let recent_trials = 0;
    let recent_wins = 0;
    let trailing_streak = 0;

    const conditional_trials = new Array<number>(10).fill(0);
    const conditional_wins = new Array<number>(10).fill(0);
    const recent_from = Math.max(0, length - recent_window);
    const outcomes: boolean[] = [];

    for (let i = 0; i < length; i++) {
        const outcome = definition.resolve(ctx, i);
        if (outcome === null) continue;

        trials += 1;
        if (outcome) wins += 1;
        outcomes.push(outcome);

        if (i >= recent_from) {
            recent_trials += 1;
            if (outcome) recent_wins += 1;
        }

        // Condition on the state a trader can actually see before buying:
        // the last digit of the previous tick.
        const previous_digit = i >= 1 ? ctx.digits[i - 1] : null;
        if (previous_digit !== null && previous_digit >= 0 && previous_digit <= 9) {
            conditional_trials[previous_digit] += 1;
            if (outcome) conditional_wins[previous_digit] += 1;
        }
    }

    if (outcomes.length) {
        const last_outcome = outcomes[outcomes.length - 1];
        for (let i = outcomes.length - 1; i >= 0; i--) {
            if (outcomes[i] !== last_outcome) break;
            trailing_streak += 1;
        }
        if (!last_outcome) trailing_streak = -trailing_streak;
    }

    const win_rate = trials > 0 ? wins / trials : 0;
    const confident = trials > 0 ? wilsonLowerBound(wins, trials) : 0;
    const edge = (confident - baseline) * 100;
    const raw_edge = (win_rate - baseline) * 100;
    const recent_rate = recent_trials > 0 ? recent_wins / recent_trials : 0;
    const recent_edge = recent_trials > 0 ? (recent_rate - baseline) * 100 : 0;
    const z = proportionZScore(wins, trials, baseline);
    const confidence = trials > 0 ? clamp(normalCdf(z) * 100, 0, 100) : 0;

    const persistence = raw_edge > 0 ? clamp(recent_edge / raw_edge, 0, 1) : 0;
    const score = edge > 0 ? edge * (0.55 + 0.45 * persistence) : edge;

    let trigger: TTrigger | null = null;
    for (let d = 0; d < 10; d++) {
        const t = conditional_trials[d];
        if (t < min_trigger_trials) continue;
        const w = conditional_wins[d];
        const conditional_confident = wilsonLowerBound(w, t);
        const conditional_edge = (conditional_confident - baseline) * 100;
        if (conditional_edge <= edge) continue;
        if (trigger && conditional_edge <= trigger.edge) continue;
        trigger = {
            previous_digit: d,
            trials: t,
            wins: w,
            win_rate: round((w / t) * 100),
            confident_win_rate: round(conditional_confident * 100),
            edge: round(conditional_edge),
        };
    }

    return {
        definition,
        trials,
        wins,
        win_rate: round(win_rate * 100),
        baseline: round(baseline * 100),
        confident_win_rate: round(confident * 100),
        raw_edge: round(raw_edge),
        edge: round(edge),
        confidence: round(confidence, 1),
        recent_edge: round(recent_edge),
        persistence: round(persistence, 3),
        score: round(score),
        trigger,
        trailing_streak,
    };
};

export type TSymbolAnalysis = {
    symbol: string;
    display_name: string;
    decimals: number;
    ticks_analysed: number;
    last_quote: number | null;
    last_digit: number | null;
    evaluations: TStrategyEvaluation[];
    /** Highest scoring strategy with a positive edge, if any. */
    best: TStrategyEvaluation | null;
};

export const analyseSymbol = (
    input: {
        symbol: string;
        display_name: string;
        decimals: number;
        quotes: number[];
        digits: number[];
    },
    definitions: TStrategyDefinition[],
    options: TEvaluateOptions = {}
): TSymbolAnalysis => {
    const ctx: TResolveContext = { digits: input.digits, quotes: input.quotes };
    const evaluations = definitions
        .map(definition => evaluateStrategy(ctx, definition, options))
        .sort((a, b) => b.score - a.score || b.trials - a.trials);

    const best = evaluations.find(e => e.edge > 0) ?? null;

    return {
        symbol: input.symbol,
        display_name: input.display_name,
        decimals: input.decimals,
        ticks_analysed: input.digits.length,
        last_quote: input.quotes.length ? input.quotes[input.quotes.length - 1] : null,
        last_digit: input.digits.length ? input.digits[input.digits.length - 1] : null,
        evaluations,
        best,
    };
};

/* --------------------------------------------------------------- signals */

export type TSignalAction = 'trade' | 'watch' | 'avoid';

export type TSignal = {
    action: TSignalAction;
    /** 0-100 */
    strength: number;
    reason: string;
    /** True when the strategy's data-derived trigger matches the latest tick. */
    trigger_live: boolean;
};

const TRADE_EDGE_THRESHOLD = 2.5;
const WATCH_EDGE_THRESHOLD = 0.5;
const TRADE_CONFIDENCE_THRESHOLD = 97.5;

/**
 * Turn an evaluation into the signal the Scanner shows. A signal is only
 * `trade` when the edge survives the confidence bound, the recent slice still
 * shows it, and (if the strategy has a trigger) the market is in that state
 * right now.
 */
export const toSignal = (evaluation: TStrategyEvaluation | null, last_digit: number | null): TSignal => {
    if (!evaluation || evaluation.trials === 0) {
        return { action: 'avoid', strength: 0, reason: 'Not enough ticks analysed yet.', trigger_live: false };
    }

    const { edge, confidence, persistence, trigger, definition } = evaluation;
    const trigger_live = !!trigger && last_digit !== null && trigger.previous_digit === last_digit;

    if (edge <= 0) {
        return {
            action: 'avoid',
            strength: 0,
            reason: `No confident edge on ${definition.label} (fair value ${evaluation.baseline}%).`,
            trigger_live,
        };
    }

    const strength = clamp(
        (clamp(edge, 0, 15) / 15) * 60 + (confidence / 100) * 25 + persistence * 15,
        0,
        100
    );

    if (edge >= TRADE_EDGE_THRESHOLD && confidence >= TRADE_CONFIDENCE_THRESHOLD && (!trigger || trigger_live)) {
        return {
            action: 'trade',
            strength: round(strength),
            reason: trigger_live
                ? `${definition.label} pays ${trigger?.confident_win_rate}% after digit ${trigger?.previous_digit} (fair ${evaluation.baseline}%).`
                : `${definition.label} holding ${evaluation.confident_win_rate}% vs ${evaluation.baseline}% fair over ${evaluation.trials} ticks.`,
            trigger_live,
        };
    }

    if (edge >= WATCH_EDGE_THRESHOLD) {
        return {
            action: 'watch',
            strength: round(strength),
            reason: trigger
                ? `Edge present, waiting for digit ${trigger.previous_digit} to print.`
                : `Edge of ${edge} pts needs more confirmation (${evaluation.confidence}% confidence).`,
            trigger_live,
        };
    }

    return {
        action: 'avoid',
        strength: round(strength),
        reason: `Edge of ${edge} pts is inside the noise band.`,
        trigger_live,
    };
};
