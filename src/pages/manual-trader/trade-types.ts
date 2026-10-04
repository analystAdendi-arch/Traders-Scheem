/**
 * The trade types offered by Deriv Trader, with the exact contract codes and
 * parameters the Options API expects (checked against contracts_for / proposal on
 * api.derivws.com/trading/v1/options). Note the API takes `underlying_symbol`, not
 * `symbol`, and that Higher/Lower are their own contract types here.
 */

export type TDurationUnit = 't' | 's' | 'm' | 'h' | 'd';

export type TSide = {
    key: string;
    label: string;
    contract_type: string;
    /** Up sides buy in green, down sides in red, as on Deriv Trader. */
    tone: 'up' | 'down';
};

export type TTradeTypeId =
    | 'rise_fall'
    | 'touch'
    | 'higher_lower'
    | 'accumulators'
    | 'multipliers'
    | 'turbos'
    | 'vanillas'
    | 'matches_differs'
    | 'over_under'
    | 'even_odd';

export type TTradeType = {
    id: TTradeTypeId;
    label: string;
    group: 'main' | 'growth' | 'digits';
    hot?: boolean;
    sides: TSide[];
    /** Duration units the type accepts; empty for contracts that run until closed. */
    units: TDurationUnit[];
    default_duration: [number, TDurationUnit];
    uses_barrier?: boolean;
    uses_digit?: boolean;
    uses_allow_equals?: boolean;
    uses_growth_rate?: boolean;
    uses_multiplier?: boolean;
    uses_payout_per_point?: boolean;
    uses_strike?: boolean;
    uses_take_profit?: boolean;
    uses_stop_loss?: boolean;
    shows_digit_stats?: boolean;
    how: string[];
};

export const TRADE_TYPES: TTradeType[] = [
    {
        id: 'rise_fall',
        label: 'Rise/Fall',
        group: 'main',
        hot: true,
        sides: [
            { key: 'rise', label: 'Rise', contract_type: 'CALL', tone: 'up' },
            { key: 'fall', label: 'Fall', contract_type: 'PUT', tone: 'down' },
        ],
        units: ['t', 's', 'm', 'h', 'd'],
        default_duration: [5, 't'],
        uses_allow_equals: true,
        how: [
            'Rise: you win the payout if the exit spot is strictly higher than the entry spot.',
            'Fall: you win the payout if the exit spot is strictly lower than the entry spot.',
            'Turn on "Allow equals" to also win when the exit spot equals the entry spot.',
        ],
    },
    {
        id: 'touch',
        label: 'Touch/No Touch',
        group: 'main',
        sides: [
            { key: 'touch', label: 'Touch', contract_type: 'ONETOUCH', tone: 'up' },
            { key: 'no_touch', label: 'No Touch', contract_type: 'NOTOUCH', tone: 'down' },
        ],
        units: ['t', 'm', 'h', 'd'],
        default_duration: [5, 't'],
        uses_barrier: true,
        how: [
            'Touch: you win the payout if the market touches the barrier at any time during the contract.',
            'No Touch: you win the payout if the market never touches the barrier during the contract.',
            'Set the barrier as an offset from the entry spot, for example +0.38 or -0.38.',
        ],
    },
    {
        id: 'higher_lower',
        label: 'Higher/Lower',
        group: 'main',
        sides: [
            { key: 'higher', label: 'Higher', contract_type: 'HIGHER', tone: 'up' },
            { key: 'lower', label: 'Lower', contract_type: 'LOWER', tone: 'down' },
        ],
        units: ['t', 's', 'm', 'h', 'd'],
        default_duration: [5, 't'],
        uses_barrier: true,
        how: [
            'Higher: you win the payout if the exit spot is strictly higher than the barrier.',
            'Lower: you win the payout if the exit spot is strictly lower than the barrier.',
            'Set the barrier as an offset from the entry spot, for example +0.38 or -0.38.',
        ],
    },
    {
        id: 'accumulators',
        label: 'Accumulators',
        group: 'growth',
        hot: true,
        sides: [{ key: 'buy', label: 'Buy', contract_type: 'ACCU', tone: 'up' }],
        units: [],
        default_duration: [0, 't'],
        uses_growth_rate: true,
        uses_take_profit: true,
        how: [
            'Your stake grows by the growth rate on every tick the price stays inside the barrier range.',
            'If the price leaves the range, the contract closes and you lose your stake.',
            'Close the contract at any time to collect what it is worth, or set a take profit.',
        ],
    },
    {
        id: 'multipliers',
        label: 'Multipliers',
        group: 'growth',
        sides: [
            { key: 'up', label: 'Up', contract_type: 'MULTUP', tone: 'up' },
            { key: 'down', label: 'Down', contract_type: 'MULTDOWN', tone: 'down' },
        ],
        units: [],
        default_duration: [0, 't'],
        uses_multiplier: true,
        uses_take_profit: true,
        uses_stop_loss: true,
        how: [
            'Up: profit grows by the market rise times the multiplier. Down: by the market fall times the multiplier.',
            'Your loss can never exceed your stake: the contract stops out before that.',
            'Close at any time, or set a take profit and stop loss.',
        ],
    },
    {
        id: 'turbos',
        label: 'Turbos',
        group: 'growth',
        sides: [
            { key: 'up', label: 'Up', contract_type: 'TURBOSLONG', tone: 'up' },
            { key: 'down', label: 'Down', contract_type: 'TURBOSSHORT', tone: 'down' },
        ],
        units: ['t', 's', 'm', 'h', 'd'],
        default_duration: [5, 't'],
        uses_payout_per_point: true,
        how: [
            'Up: you earn the payout per point for every point the exit spot ends above the barrier.',
            'Down: you earn the payout per point for every point the exit spot ends below the barrier.',
            'If the market touches the barrier before expiry, the contract ends and the stake is lost.',
        ],
    },
    {
        id: 'vanillas',
        label: 'Vanillas',
        group: 'growth',
        sides: [
            { key: 'call', label: 'Call', contract_type: 'VANILLALONGCALL', tone: 'up' },
            { key: 'put', label: 'Put', contract_type: 'VANILLALONGPUT', tone: 'down' },
        ],
        units: ['m', 'h', 'd'],
        default_duration: [5, 'm'],
        uses_strike: true,
        how: [
            'Call: you receive a payout at expiry if the final price is above the strike price.',
            'Put: you receive a payout at expiry if the final price is below the strike price.',
            'The payout is the distance from the strike times the payout per point.',
        ],
    },
    {
        id: 'matches_differs',
        label: 'Matches/Differs',
        group: 'digits',
        sides: [
            { key: 'matches', label: 'Matches', contract_type: 'DIGITMATCH', tone: 'up' },
            { key: 'differs', label: 'Differs', contract_type: 'DIGITDIFF', tone: 'down' },
        ],
        units: ['t'],
        default_duration: [2, 't'],
        uses_digit: true,
        shows_digit_stats: true,
        how: [
            'Matches: you win if the last digit of the last tick equals your prediction.',
            'Differs: you win if the last digit of the last tick is not your prediction.',
        ],
    },
    {
        id: 'over_under',
        label: 'Over/Under',
        group: 'digits',
        sides: [
            { key: 'over', label: 'Over', contract_type: 'DIGITOVER', tone: 'up' },
            { key: 'under', label: 'Under', contract_type: 'DIGITUNDER', tone: 'down' },
        ],
        units: ['t'],
        default_duration: [2, 't'],
        uses_digit: true,
        shows_digit_stats: true,
        how: [
            'Over: you win if the last digit of the last tick is greater than your prediction.',
            'Under: you win if the last digit of the last tick is less than your prediction.',
        ],
    },
    {
        id: 'even_odd',
        label: 'Even/Odd',
        group: 'digits',
        sides: [
            { key: 'even', label: 'Even', contract_type: 'DIGITEVEN', tone: 'up' },
            { key: 'odd', label: 'Odd', contract_type: 'DIGITODD', tone: 'down' },
        ],
        units: ['t'],
        default_duration: [2, 't'],
        shows_digit_stats: true,
        how: [
            'Even: you win if the last digit of the last tick is an even number (0, 2, 4, 6 or 8).',
            'Odd: you win if the last digit of the last tick is an odd number (1, 3, 5, 7 or 9).',
        ],
    },
];

export const GROUP_LABELS: Record<TTradeType['group'], string> = {
    main: '',
    growth: 'Growth based',
    digits: 'Digit based',
};

export const getTradeType = (id: string) => TRADE_TYPES.find(t => t.id === id) ?? TRADE_TYPES[0];

export const UNIT_LABELS: Record<TDurationUnit, [string, string]> = {
    t: ['tick', 'ticks'],
    s: ['second', 'seconds'],
    m: ['minute', 'minutes'],
    h: ['hour', 'hours'],
    d: ['day', 'days'],
};

/** Allowed digits for the prediction grid. */
export const digitAllowed = (contract_type: string, digit: number) => {
    if (contract_type === 'DIGITOVER') return digit <= 8;
    if (contract_type === 'DIGITUNDER') return digit >= 1;
    return true;
};

export type TForm = {
    side: string;
    stake: number;
    duration: number;
    duration_unit: TDurationUnit;
    allow_equals: boolean;
    barrier: string;
    digit: number;
    growth_rate: number;
    multiplier: number;
    payout_per_point: number;
    strike: string;
    take_profit: string;
    stop_loss: string;
};

export const DEFAULT_FORM: TForm = {
    side: '',
    // Deriv's default_stake from contracts_for, and what Deriv Trader shows.
    stake: 2,
    duration: 5,
    duration_unit: 't',
    allow_equals: false,
    barrier: '+0.38',
    digit: 5,
    growth_rate: 0.03,
    multiplier: 100,
    payout_per_point: 0.3,
    strike: '+0.00',
    take_profit: '',
    stop_loss: '',
};

/** The contract type actually traded for a side, with Allow equals applied. */
export const contractTypeFor = (type: TTradeType, side: TSide, form: TForm) => {
    if (type.uses_allow_equals && form.allow_equals) return `${side.contract_type}E`;
    return side.contract_type;
};

/** Proposal / buy parameters for one side of a trade, in the Options API's terms. */
export const buildParameters = (
    type: TTradeType,
    side: TSide,
    form: TForm,
    symbol: string,
    currency: string
): Record<string, unknown> => {
    const params: Record<string, unknown> = {
        amount: Number(form.stake),
        basis: 'stake',
        contract_type: contractTypeFor(type, side, form),
        currency,
        underlying_symbol: symbol,
    };

    if (type.units.length) {
        params.duration = Math.max(1, Math.trunc(Number(form.duration) || 1));
        params.duration_unit = form.duration_unit;
    }
    if (type.uses_barrier) params.barrier = form.barrier.trim();
    if (type.uses_digit) params.barrier = String(form.digit);
    if (type.uses_growth_rate) params.growth_rate = form.growth_rate;
    if (type.uses_multiplier) params.multiplier = form.multiplier;
    if (type.uses_payout_per_point) params.payout_per_point = form.payout_per_point;
    if (type.uses_strike) params.barrier = form.strike;

    const limit_order: Record<string, number> = {};
    const tp = Number(form.take_profit);
    const sl = Number(form.stop_loss);
    if (type.uses_take_profit && form.take_profit !== '' && tp > 0) limit_order.take_profit = tp;
    if (type.uses_stop_loss && form.stop_loss !== '' && sl > 0) limit_order.stop_loss = sl;
    if (Object.keys(limit_order).length) params.limit_order = limit_order;

    return params;
};

/* ------------------------------------------------------------------ markets */

export type TMarket = {
    symbol: string;
    name: string;
    market: string;
    submarket: string;
    decimals: number;
    is_open: boolean;
};

export const MARKET_CHIPS: { id: string; label: string }[] = [
    { id: 'favourites', label: 'Favourites' },
    { id: 'synthetic_index', label: 'Derived' },
    { id: 'forex', label: 'Forex' },
    { id: 'indices', label: 'Stocks & indices' },
    { id: 'commodities', label: 'Commodities' },
    { id: 'cryptocurrency', label: 'Cryptocurrencies' },
];

export const SUBMARKET_LABELS: Record<string, string> = {
    random_index: 'Volatility indices',
    crash_index: 'Crash/Boom indices',
    jump_index: 'Jump indices',
    step_index: 'Step indices',
    range_index: 'Range break indices',
    random_daily: 'Daily reset indices',
    forex_basket: 'Forex basket',
    commodity_basket: 'Commodities basket',
    major_pairs: 'Major pairs',
    minor_pairs: 'Minor pairs',
    metals: 'Metals',
    non_stable_coin: 'Cryptocurrencies',
    europe_OTC: 'European indices',
    asia_oceania_OTC: 'Asian indices',
    americas_OTC: 'American indices',
};

/** active_symbols row (Options API shape) -> our market record. */
export const toMarket = (row: any): TMarket => {
    const pip = Number(row.pip_size ?? row.pip ?? 0.01);
    // active_symbols gives the pip as 0.01; ticks give it as a count of decimals.
    const decimals = pip >= 1 ? Math.round(pip) : Math.max(0, Math.round(-Math.log10(pip)));
    return {
        symbol: row.underlying_symbol ?? row.symbol,
        name: row.underlying_symbol_name ?? row.display_name ?? row.underlying_symbol ?? row.symbol,
        market: row.market,
        submarket: row.submarket,
        decimals,
        is_open: Boolean(row.exchange_is_open) && !row.is_trading_suspended,
    };
};

/** Short badge text for a market icon: "100" + "1s" for Volatility 100 (1s). */
export const marketBadge = (market: TMarket): { main: string; sub?: string } => {
    const one_second = /\((\d+)s\)/.exec(market.name);
    const number = /(\d+)/.exec(market.name.replace(/\(\d+s\)/, ''));
    if (market.market === 'forex' || market.market === 'cryptocurrency') {
        const [a, b] = market.name.split('/');
        return { main: `${(a || '').trim().slice(0, 1)}${(b || '').trim().slice(0, 1)}` || market.name.slice(0, 2) };
    }
    if (number) return { main: number[1], sub: one_second ? `${one_second[1]}s` : undefined };
    return { main: market.name.replace(/[^A-Z]/g, '').slice(0, 2) || market.name.slice(0, 2).toUpperCase() };
};

/** Last digit of a quote, read with the market's decimals so trailing zeros count. */
export const lastDigit = (quote: number, decimals: number) => {
    const text = Number(quote).toFixed(decimals);
    return Number(text.charAt(text.length - 1));
};
