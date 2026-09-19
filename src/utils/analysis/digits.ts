/**
 * Digit + tick statistics primitives.
 *
 * Everything here is pure: it takes quotes that came from the Deriv
 * `ticks_history` / `ticks` streams and turns them into the numbers the
 * Analysis Tool, the Scanner and the AI Scanner all read from. No sample
 * data, no randomness, no fixed answers.
 */

/** Deriv reports `pip_size` as a decimal-place count, `pip` as a step (0.001). */
export const pipToDecimals = (pip_or_size?: number | string | null): number | null => {
    const raw = Number(pip_or_size);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    // Already a decimal-place count (2, 3, 4...).
    if (Number.isInteger(raw) && raw >= 1 && raw <= 10) return raw;
    // A step such as 0.001 -> 3 decimals.
    const decimals = Math.round(-Math.log10(raw));
    return decimals >= 0 && decimals <= 10 ? decimals : null;
};

export const formatQuote = (quote: number | string, decimals: number): string => {
    const q = Number(quote);
    const dp = Number.isFinite(decimals) && decimals >= 0 ? Math.trunc(decimals) : 0;
    if (!Number.isFinite(q)) return (0).toFixed(dp);
    return q.toFixed(dp);
};

/** Last digit of a quote, read off the pip-size-formatted price like Deriv does. */
export const lastDigitOf = (quote: number | string, decimals: number): number => {
    const formatted = formatQuote(quote, decimals);
    const digit = parseInt(formatted.slice(-1), 10);
    return Number.isFinite(digit) ? digit : 0;
};

export const quotesToDigits = (quotes: (number | string)[], decimals: number): number[] =>
    quotes.map(q => lastDigitOf(q, decimals));

export type TDigitStat = {
    digit: number;
    count: number;
    /** 0-100 */
    percentage: number;
};

export const digitStats = (digits: number[]): TDigitStat[] => {
    const counts = new Array<number>(10).fill(0);
    digits.forEach(d => {
        const safe = Math.max(0, Math.min(9, Math.trunc(d)));
        counts[safe] += 1;
    });
    const total = digits.length;
    return counts.map((count, digit) => ({
        digit,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
    }));
};

/** Digits ordered by how often they appeared, hottest first. */
export const rankDigits = (digits: number[]): TDigitStat[] =>
    [...digitStats(digits)].sort((a, b) => b.count - a.count || a.digit - b.digit);

export type TSplit = {
    /** 0-100 */
    first: number;
    /** 0-100 */
    second: number;
    first_count: number;
    second_count: number;
    total: number;
};

const splitBy = (digits: number[], predicate: (d: number) => boolean): TSplit => {
    let first_count = 0;
    digits.forEach(d => {
        if (predicate(d)) first_count += 1;
    });
    const total = digits.length;
    const second_count = total - first_count;
    return {
        first: total > 0 ? (first_count / total) * 100 : 0,
        second: total > 0 ? (second_count / total) * 100 : 0,
        first_count,
        second_count,
        total,
    };
};

/** OVER / UNDER around a barrier: over = d > barrier, under = d < barrier (ties are neither). */
export const overUnderSplit = (digits: number[], barrier: number): TSplit => {
    let over = 0;
    let under = 0;
    digits.forEach(d => {
        if (d > barrier) over += 1;
        else if (d < barrier) under += 1;
    });
    const total = digits.length;
    return {
        first: total > 0 ? (over / total) * 100 : 0,
        second: total > 0 ? (under / total) * 100 : 0,
        first_count: over,
        second_count: under,
        total,
    };
};

export const matchDifferSplit = (digits: number[], target: number): TSplit =>
    splitBy(digits, d => d === target);

export const evenOddSplit = (digits: number[]): TSplit => splitBy(digits, d => d % 2 === 0);

/** RISE / FALL measured on the quotes themselves; flat ticks count for neither. */
export const riseFallSplit = (quotes: number[]): TSplit => {
    let rises = 0;
    let falls = 0;
    let compared = 0;
    for (let i = 1; i < quotes.length; i++) {
        const prev = Number(quotes[i - 1]);
        const curr = Number(quotes[i]);
        if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;
        compared += 1;
        if (curr > prev) rises += 1;
        else if (curr < prev) falls += 1;
    }
    return {
        first: compared > 0 ? (rises / compared) * 100 : 0,
        second: compared > 0 ? (falls / compared) * 100 : 0,
        first_count: rises,
        second_count: falls,
        total: compared,
    };
};

/** Length of the run of consecutive ticks at the end that satisfy `predicate`. */
export const trailingStreak = <T>(series: T[], predicate: (value: T) => boolean): number => {
    let streak = 0;
    for (let i = series.length - 1; i >= 0; i--) {
        if (!predicate(series[i])) break;
        streak += 1;
    }
    return streak;
};

/**
 * Wilson score lower bound for a binomial proportion.
 *
 * This is what keeps the scanners honest: 3 wins out of 3 ticks scores far
 * below 300 wins out of 400, so a tiny sample can never win a ranking. It
 * replaces the old hand-tuned "quality" fudge factors.
 */
export const wilsonLowerBound = (wins: number, trials: number, z = 1.96): number => {
    if (!Number.isFinite(trials) || trials <= 0) return 0;
    const p = Math.max(0, Math.min(1, wins / trials));
    const z2 = z * z;
    const denominator = 1 + z2 / trials;
    const centre = p + z2 / (2 * trials);
    const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
    return Math.max(0, (centre - margin) / denominator);
};

/** Two-sided binomial z-score of an observed proportion against `expected`. */
export const proportionZScore = (wins: number, trials: number, expected: number): number => {
    if (trials <= 0 || expected <= 0 || expected >= 1) return 0;
    const se = Math.sqrt((expected * (1 - expected)) / trials);
    if (se === 0) return 0;
    return (wins / trials - expected) / se;
};

export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

export const round = (value: number, dp = 2): number => {
    const factor = 10 ** dp;
    return Math.round(value * factor) / factor;
};
