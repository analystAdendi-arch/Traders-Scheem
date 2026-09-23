import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { useApiBase } from '@/hooks/useApiBase';
import useLiveTicks from '@/hooks/useLiveTicks';
import { isDemoAccount } from '@/utils/account-helpers';
import { formatQuote, getScannableSymbols, riseFallSplit, TAnalysisSymbol } from '@/utils/analysis';

import { TAutoContract, useAutoTrader } from './use-auto-trader';
import './auto-trader.scss';

const WINDOW_TICKS = 1000;
const CHIP_COUNT = 10;
const MORE_CHIP_COUNT = 30;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const PIN_KEY = 'auto-trader-pins';

type TTone = 'green' | 'red' | 'blue' | 'orange' | 'slate' | 'grey';
type TChip = { label: string; tone: TTone };
type TCmp = 'gte' | 'lte';

const compare = (value: number, cmp: TCmp, threshold: number) =>
    cmp === 'gte' ? value >= threshold : value <= threshold;

const pct = (count: number, total: number) => (total > 0 ? (count / total) * 100 : 0);

/** "3x Over" style run length of the newest outcome. */
const runBadge = (chips: TChip[]): string | null => {
    if (!chips.length) return null;
    const last = chips[chips.length - 1];
    let count = 0;
    for (let i = chips.length - 1; i >= 0 && chips[i].label === last.label; i--) count += 1;
    return `${count}x ${last.label}`;
};

/* ------------------------------------------------------------- building blocks */

type TShared = {
    symbols: TAnalysisSymbol[];
    currency: string;
    can_trade: boolean;
    account_label: string;
    pinned: boolean;
    onTogglePin: () => void;
};

const useCardMarket = (symbols: TAnalysisSymbol[]) => {
    const [symbol, setSymbol] = useState<string | null>(null);
    useEffect(() => {
        if (symbol || !symbols.length) return;
        setSymbol((symbols.find(s => s.symbol === 'R_100') ?? symbols[0]).symbol);
    }, [symbol, symbols]);
    const live = useLiveTicks(symbol, WINDOW_TICKS);
    return { symbol, setSymbol, live };
};

const Icon = ({ kind }: { kind: 'evenodd' | 'overunder' | 'risefall' | 'matchdiff' }) => {
    if (kind === 'evenodd') {
        return (
            <svg width='40' height='22' viewBox='0 0 40 22' aria-hidden='true'>
                <rect x='1' y='1' width='8' height='8' rx='1.5' fill='#f87171' />
                <rect x='11' y='1' width='8' height='8' rx='1.5' fill='#94a3b8' />
                <rect x='1' y='11' width='8' height='8' rx='1.5' fill='#94a3b8' />
                <rect x='11' y='11' width='8' height='8' rx='1.5' fill='#f87171' />
                <path d='M30 3 38 19H22z' fill='#f87171' opacity='0.85' />
            </svg>
        );
    }
    if (kind === 'overunder') {
        return (
            <svg width='44' height='22' viewBox='0 0 44 22' aria-hidden='true'>
                <path d='M2 18 16 4m0 0H9m7 0v7' stroke='#ef4444' strokeWidth='2.4' fill='none' strokeLinecap='round' />
                <path d='M2 21h16' stroke='#94a3b8' strokeWidth='2' />
                <path d='M26 4l14 14m0 0h-7m7 0v-7' stroke='#ef4444' strokeWidth='2.4' fill='none' strokeLinecap='round' />
                <path d='M26 1h16' stroke='#94a3b8' strokeWidth='2' />
            </svg>
        );
    }
    if (kind === 'risefall') {
        return (
            <svg width='44' height='22' viewBox='0 0 44 22' aria-hidden='true'>
                <path d='M3 19 17 5m0 0h-8m8 0v8' stroke='#ef4444' strokeWidth='2.4' fill='none' strokeLinecap='round' />
                <path d='M27 3l14 14m0 0h-8m8 0v-8' stroke='#ef4444' strokeWidth='2.4' fill='none' strokeLinecap='round' />
            </svg>
        );
    }
    return (
        <svg width='44' height='22' viewBox='0 0 44 22' aria-hidden='true'>
            <g stroke='#ef4444' strokeWidth='2.2' strokeLinecap='round'>
                <path d='M10 2v6M10 14v6M2 11h6M12 11h6M4 5l4 4M12 13l4 4M16 5l-4 4M8 13l-4 4' />
                <path d='M32 2v6M32 14v6M24 11h6M34 11h6M26 5l4 4M34 13l4 4M38 5l-4 4M30 13l-4 4' />
            </g>
        </svg>
    );
};

const CardShell = ({
    accent,
    icon,
    title,
    shared,
    market,
    children,
}: {
    accent: 'green' | 'blue' | 'purple' | 'orange';
    icon: ReactNode;
    title: string;
    shared: TShared;
    market: ReturnType<typeof useCardMarket>;
    children: ReactNode;
}) => {
    const { symbol, setSymbol, live } = market;
    return (
        <section className={`auto-card auto-card--${accent}`}>
            <header className='auto-card__head'>
                <span className='auto-card__icon'>{icon}</span>
                <h3 className='auto-card__title'>{title}</h3>
                <button
                    type='button'
                    className={`auto-card__pin${shared.pinned ? ' auto-card__pin--on' : ''}`}
                    onClick={shared.onTogglePin}
                    aria-pressed={shared.pinned}
                    title={shared.pinned ? localize('Unpin') : localize('Pin to top')}
                >
                    📌
                </button>
            </header>
            <div className='auto-card__market'>
                <select
                    className='auto-card__select'
                    value={symbol ?? ''}
                    onChange={event => setSymbol(event.target.value)}
                    disabled={!shared.symbols.length}
                >
                    {!shared.symbols.length && <option value=''>{localize('Loading markets...')}</option>}
                    {shared.symbols.map(item => (
                        <option key={item.symbol} value={item.symbol}>
                            {item.display_name}
                        </option>
                    ))}
                </select>
                <span className='auto-card__price'>
                    {live.last_quote === null ? '--' : formatQuote(live.last_quote, live.decimals)}
                </span>
            </div>
            {children}
        </section>
    );
};

const ChipRow = ({ chips, show_more, onToggle }: { chips: TChip[]; show_more: boolean; onToggle: () => void }) => {
    const visible = chips.slice(-(show_more ? MORE_CHIP_COUNT : CHIP_COUNT));
    const badge = runBadge(chips);
    return (
        <>
            <div className='auto-card__chips'>
                {visible.map((chip, index) => (
                    <span key={`${index}-${chip.label}`} className={`auto-card__chip auto-card__chip--${chip.tone}`}>
                        {chip.label.charAt(0)}
                    </span>
                ))}
            </div>
            <div className='auto-card__chip-meta'>
                <span className='auto-card__badge'>{badge ?? localize('No data')}</span>
                <button type='button' className='auto-card__more' onClick={onToggle}>
                    {show_more ? localize('Show less') : localize('Show more')}
                </button>
            </div>
        </>
    );
};

const DigitPicker = ({ value, onChange }: { value: number; onChange: (digit: number) => void }) => (
    <div className='auto-card__digits'>
        {DIGITS.map(digit => (
            <button
                key={digit}
                type='button'
                className={`auto-card__digit${digit === value ? ' auto-card__digit--active' : ''}`}
                onClick={() => onChange(digit)}
                aria-pressed={digit === value}
            >
                {digit}
            </button>
        ))}
    </div>
);

const SplitBar = ({
    left,
    right,
    left_label,
    right_label,
    left_tone,
    right_tone,
}: {
    left: number;
    right: number;
    left_label: string;
    right_label: string;
    left_tone: TTone;
    right_tone: TTone;
}) => (
    <div className='auto-card__bar'>
        <span className={`auto-card__bar-part auto-card__bar-part--${left_tone}`} style={{ width: `${left}%` }}>
            {left_label}: {left.toFixed(2)}%
        </span>
        <span className='auto-card__bar-gap' style={{ width: `${Math.max(0, 100 - left - right)}%` }} />
        <span className={`auto-card__bar-part auto-card__bar-part--${right_tone}`} style={{ width: `${right}%` }}>
            {right_label}: {right.toFixed(2)}%
        </span>
    </div>
);

const Field = ({ label, children }: { label?: string; children: ReactNode }) => (
    <label className='auto-card__field'>
        {label && <span className='auto-card__field-label'>{label}</span>}
        {children}
    </label>
);

const NumberInput = ({
    value,
    onChange,
    min,
    max,
    step = 1,
    width,
}: {
    value: number;
    onChange: (next: number) => void;
    min: number;
    max: number;
    step?: number;
    width?: string;
}) => (
    <input
        type='number'
        className='auto-card__input'
        style={width ? { width } : undefined}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(next);
        }}
        onBlur={event => {
            const next = Number(event.target.value);
            onChange(Math.min(max, Math.max(min, Number.isFinite(next) ? next : min)));
        }}
    />
);

// NoInfer keeps the inline `options` arrays from widening T to `string`, which
// would stop a narrow setState (e.g. 'over' | 'under') from being accepted.
function Choice<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: { value: NoInfer<T>; label: string }[];
    onChange: (next: T) => void;
}) {
    return (
        <select className='auto-card__input auto-card__input--select' value={value} onChange={e => onChange(e.target.value as T)}>
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

const CMP_OPTIONS: { value: TCmp; label: string }[] = [
    { value: 'gte', label: '≥' },
    { value: 'lte', label: '≤' },
];

/** Ticks / stake / martingale + start-stop + live status: identical on every card. */
const TradeControls = ({
    shared,
    symbol,
    contract_valid,
    decide,
    tick_key,
    start_label,
}: {
    shared: TShared;
    symbol: string | null;
    contract_valid: string | null;
    decide: () => TAutoContract | null;
    tick_key: number | null;
    start_label: string;
}) => {
    const [ticks, setTicks] = useState(1);
    const [stake, setStake] = useState(0.5);
    const [martingale, setMartingale] = useState(1.2);
    const trader = useAutoTrader({ symbol, ticks, stake, martingale, currency: shared.currency });
    const decide_ref = useRef(decide);
    decide_ref.current = decide;

    // Evaluate the condition once per new Deriv tick.
    useEffect(() => {
        if (tick_key === null) return;
        void trader.onTick(decide_ref.current());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick_key]);

    const blocked = !shared.can_trade ? localize('Log in to trade.') : contract_valid;

    return (
        <>
            <div className='auto-card__inputs'>
                <Field label={localize('Ticks')}>
                    <NumberInput value={ticks} onChange={setTicks} min={1} max={10} />
                </Field>
                <Field label={localize('Stake')}>
                    <NumberInput value={stake} onChange={setStake} min={0.35} max={10000} step={0.1} />
                </Field>
                <Field label={localize('Martingale')}>
                    <NumberInput value={martingale} onChange={setMartingale} min={1} max={10} step={0.1} />
                </Field>
            </div>

            {trader.is_running ? (
                <button type='button' className='auto-card__start auto-card__start--stop' onClick={trader.stop}>
                    {localize('Stop Auto Trading')}
                </button>
            ) : (
                <button
                    type='button'
                    className='auto-card__start'
                    onClick={trader.start}
                    disabled={!!blocked || trader.is_busy}
                    title={blocked ?? undefined}
                >
                    {start_label}
                </button>
            )}

            <div className={`auto-card__status${trader.is_running ? ' auto-card__status--live' : ''}`}>
                <span>○ {blocked && !trader.is_running ? blocked : trader.status}</span>
                {trader.stats.trades > 0 && (
                    <span className='auto-card__stats'>
                        {trader.stats.trades} {localize('trades')} · {trader.stats.wins}W/{trader.stats.losses}L ·{' '}
                        <strong className={trader.stats.profit >= 0 ? 'auto-card__pos' : 'auto-card__neg'}>
                            {trader.stats.profit >= 0 ? '+' : ''}
                            {trader.stats.profit.toFixed(2)} {shared.currency}
                        </strong>
                    </span>
                )}
            </div>
            {shared.can_trade && <div className='auto-card__account'>{shared.account_label}</div>}
        </>
    );
};

/* ------------------------------------------------------------------ the six cards */

const EvenOddDigits = ({ shared }: { shared: TShared }) => {
    const market = useCardMarket(shared.symbols);
    const { digits, updated_at } = market.live;
    const [more, setMore] = useState(false);
    const [count, setCount] = useState(5);
    const [pattern, setPattern] = useState<'even' | 'odd'>('even');
    const [trade, setTrade] = useState<'even' | 'odd'>('even');

    const chips = useMemo<TChip[]>(
        () => digits.map(d => (d % 2 === 0 ? { label: 'Even', tone: 'green' } : { label: 'Odd', tone: 'red' })),
        [digits]
    );

    const decide = () => {
        const last = digits.slice(-count);
        if (last.length < count) return null;
        const hit = last.every(d => (pattern === 'even' ? d % 2 === 0 : d % 2 === 1));
        return hit ? { contract_type: trade === 'even' ? 'DIGITEVEN' : 'DIGITODD' } as TAutoContract : null;
    };

    return (
        <CardShell accent='green' icon={<Icon kind='evenodd' />} title={localize('Even/Odd (Digits)')} shared={shared} market={market}>
            <ChipRow chips={chips} show_more={more} onToggle={() => setMore(m => !m)} />
            <div className='auto-card__condition'>
                <span className='auto-card__condition-title'>{localize('Condition')}</span>
                <div className='auto-card__row'>
                    {localize('Check if the last')}
                    <NumberInput value={count} onChange={setCount} min={1} max={20} width='6.4rem' />
                    {localize('digits are')}
                    <Choice
                        value={pattern}
                        onChange={setPattern}
                        options={[
                            { value: 'even', label: localize('Even') },
                            { value: 'odd', label: localize('Odd') },
                        ]}
                    />
                </div>
                <div className='auto-card__row'>
                    {localize('Then trade')}
                    <Choice
                        value={trade}
                        onChange={setTrade}
                        options={[
                            { value: 'even', label: localize('Even') },
                            { value: 'odd', label: localize('Odd') },
                        ]}
                    />
                </div>
            </div>
            <TradeControls
                shared={shared}
                symbol={market.symbol}
                contract_valid={null}
                decide={decide}
                tick_key={updated_at}
                start_label={localize('Start Auto Trading')}
            />
        </CardShell>
    );
};

const EvenOddPercent = ({ shared }: { shared: TShared }) => {
    const market = useCardMarket(shared.symbols);
    const { digits, updated_at } = market.live;
    const [side, setSide] = useState<'even' | 'odd'>('even');
    const [cmp, setCmp] = useState<TCmp>('gte');
    const [threshold, setThreshold] = useState(60);
    const [trade, setTrade] = useState<'even' | 'odd'>('even');

    const even = useMemo(() => pct(digits.filter(d => d % 2 === 0).length, digits.length), [digits]);
    const odd = digits.length ? 100 - even : 0;

    const decide = () => {
        const value = side === 'even' ? even : odd;
        if (!digits.length || !compare(value, cmp, threshold)) return null;
        return { contract_type: trade === 'even' ? 'DIGITEVEN' : 'DIGITODD' } as TAutoContract;
    };

    return (
        <CardShell accent='green' icon={<Icon kind='evenodd' />} title={localize('Even/Odd (Percentages)')} shared={shared} market={market}>
            <SplitBar left={even} right={odd} left_label={localize('Even')} right_label={localize('Odd')} left_tone='green' right_tone='red' />
            <div className='auto-card__row'>
                {localize('If')}
                <Choice
                    value={side}
                    onChange={setSide}
                    options={[
                        { value: 'even', label: 'Even%' },
                        { value: 'odd', label: 'Odd%' },
                    ]}
                />
                <Choice value={cmp} onChange={setCmp} options={CMP_OPTIONS} />
                <NumberInput value={threshold} onChange={setThreshold} min={0} max={100} width='6.4rem' />%
            </div>
            <div className='auto-card__row'>
                {localize('Then trade')}
                <Choice
                    value={trade}
                    onChange={setTrade}
                    options={[
                        { value: 'even', label: localize('Even') },
                        { value: 'odd', label: localize('Odd') },
                    ]}
                />
            </div>
            <TradeControls
                shared={shared}
                symbol={market.symbol}
                contract_valid={null}
                decide={decide}
                tick_key={updated_at}
                start_label={localize('Start Auto Trade')}
            />
        </CardShell>
    );
};

const OverUnderDigits = ({ shared }: { shared: TShared }) => {
    const market = useCardMarket(shared.symbols);
    const { digits, updated_at } = market.live;
    const [more, setMore] = useState(false);
    const [digit, setDigit] = useState(5);
    const [count, setCount] = useState(3);
    const [relation, setRelation] = useState<'gt' | 'lt' | 'eq'>('gt');
    const [trade, setTrade] = useState<'over' | 'under'>('over');
    const [prediction, setPrediction] = useState(4);

    const chips = useMemo<TChip[]>(
        () =>
            digits.map(d =>
                d > digit
                    ? { label: 'Over', tone: 'blue' }
                    : d < digit
                      ? { label: 'Under', tone: 'orange' }
                      : { label: '=', tone: 'grey' }
            ),
        [digits, digit]
    );

    const invalid =
        trade === 'over' && prediction >= 9
            ? localize('Over 9 can never win - pick a lower prediction.')
            : trade === 'under' && prediction <= 0
              ? localize('Under 0 can never win - pick a higher prediction.')
              : null;

    const decide = () => {
        const last = digits.slice(-count);
        if (last.length < count) return null;
        const hit = last.every(d => (relation === 'gt' ? d > digit : relation === 'lt' ? d < digit : d === digit));
        return hit ? ({ contract_type: trade === 'over' ? 'DIGITOVER' : 'DIGITUNDER', barrier: prediction } as TAutoContract) : null;
    };

    return (
        <CardShell accent='blue' icon={<Icon kind='overunder' />} title={localize('Over/Under (Digits)')} shared={shared} market={market}>
            <ChipRow chips={chips} show_more={more} onToggle={() => setMore(m => !m)} />
            <DigitPicker value={digit} onChange={setDigit} />
            <div className='auto-card__condition'>
                <span className='auto-card__condition-title'>{localize('Condition')}</span>
                <div className='auto-card__row'>
                    {localize('Check if the last')}
                    <NumberInput value={count} onChange={setCount} min={1} max={20} width='6.4rem' />
                    {localize('digits are')}
                    <Choice
                        value={relation}
                        onChange={setRelation}
                        options={[
                            { value: 'gt', label: localize('Greater than') },
                            { value: 'lt', label: localize('Less than') },
                            { value: 'eq', label: localize('Equal to') },
                        ]}
                    />
                    <span className='auto-card__pill'>{digit}</span>
                </div>
                <div className='auto-card__row'>
                    {localize('Then trade')}
                    <Choice
                        value={trade}
                        onChange={setTrade}
                        options={[
                            { value: 'over', label: localize('Over') },
                            { value: 'under', label: localize('Under') },
                        ]}
                    />
                    {localize('prediction')}
                    <NumberInput value={prediction} onChange={setPrediction} min={0} max={9} width='6.4rem' />
                </div>
            </div>
            <TradeControls
                shared={shared}
                symbol={market.symbol}
                contract_valid={invalid}
                decide={decide}
                tick_key={updated_at}
                start_label={localize('Start Auto Trading')}
            />
        </CardShell>
    );
};

const OverUnderPercent = ({ shared }: { shared: TShared }) => {
    const market = useCardMarket(shared.symbols);
    const { digits, updated_at } = market.live;
    const [digit, setDigit] = useState(5);
    const [side, setSide] = useState<'over' | 'under'>('over');
    const [cmp, setCmp] = useState<TCmp>('gte');
    const [threshold, setThreshold] = useState(60);
    const [trade, setTrade] = useState<'over' | 'under'>('over');

    const over = useMemo(() => pct(digits.filter(d => d > digit).length, digits.length), [digits, digit]);
    const under = useMemo(() => pct(digits.filter(d => d < digit).length, digits.length), [digits, digit]);

    const invalid =
        trade === 'over' && digit >= 9
            ? localize('Over 9 can never win - pick a lower digit.')
            : trade === 'under' && digit <= 0
              ? localize('Under 0 can never win - pick a higher digit.')
              : null;

    const decide = () => {
        const value = side === 'over' ? over : under;
        if (!digits.length || !compare(value, cmp, threshold)) return null;
        return { contract_type: trade === 'over' ? 'DIGITOVER' : 'DIGITUNDER', barrier: digit } as TAutoContract;
    };

    return (
        <CardShell accent='blue' icon={<Icon kind='overunder' />} title={localize('Over/Under (Percentages)')} shared={shared} market={market}>
            <DigitPicker value={digit} onChange={setDigit} />
            <SplitBar
                left={over}
                right={under}
                left_label={`${localize('Over')} ${digit}`}
                right_label={`${localize('Under')} ${digit}`}
                left_tone='blue'
                right_tone='orange'
            />
            <div className='auto-card__row'>
                {localize('If Digit')} {digit}
                <Choice
                    value={side}
                    onChange={setSide}
                    options={[
                        { value: 'over', label: 'Over %' },
                        { value: 'under', label: 'Under %' },
                    ]}
                />
                {localize('is')}
                <Choice value={cmp} onChange={setCmp} options={CMP_OPTIONS} />
                {localize('than')}
                <NumberInput value={threshold} onChange={setThreshold} min={0} max={100} width='6.4rem' />%
            </div>
            <div className='auto-card__row'>
                {localize('Then trade')}
                <Choice
                    value={trade}
                    onChange={setTrade}
                    options={[
                        { value: 'over', label: `${localize('Over')} ${digit}` },
                        { value: 'under', label: `${localize('Under')} ${digit}` },
                    ]}
                />
            </div>
            <TradeControls
                shared={shared}
                symbol={market.symbol}
                contract_valid={invalid}
                decide={decide}
                tick_key={updated_at}
                start_label={localize('Start Auto Trade')}
            />
        </CardShell>
    );
};

const RiseFall = ({ shared }: { shared: TShared }) => {
    const market = useCardMarket(shared.symbols);
    const { quotes, updated_at } = market.live;
    const [more, setMore] = useState(false);
    const [side, setSide] = useState<'rise' | 'fall'>('rise');
    const [cmp, setCmp] = useState<TCmp>('gte');
    const [threshold, setThreshold] = useState(60);
    const [trade, setTrade] = useState<'rise' | 'fall'>('rise');

    const chips = useMemo<TChip[]>(() => {
        const out: TChip[] = [];
        for (let i = 1; i < quotes.length; i++) {
            if (quotes[i] > quotes[i - 1]) out.push({ label: 'Rise', tone: 'green' });
            else if (quotes[i] < quotes[i - 1]) out.push({ label: 'Fall', tone: 'red' });
        }
        return out;
    }, [quotes]);
    const split = useMemo(() => riseFallSplit(quotes), [quotes]);

    const decide = () => {
        const value = side === 'rise' ? split.first : split.second;
        if (!split.total || !compare(value, cmp, threshold)) return null;
        return { contract_type: trade === 'rise' ? 'CALL' : 'PUT' } as TAutoContract;
    };

    return (
        <CardShell accent='purple' icon={<Icon kind='risefall' />} title={localize('Rise/Fall')} shared={shared} market={market}>
            <ChipRow chips={chips} show_more={more} onToggle={() => setMore(m => !m)} />
            <SplitBar
                left={split.first}
                right={split.second}
                left_label={localize('Rise')}
                right_label={localize('Fall')}
                left_tone='green'
                right_tone='red'
            />
            <div className='auto-card__row'>
                {localize('If')}
                <Choice
                    value={side}
                    onChange={setSide}
                    options={[
                        { value: 'rise', label: 'Rise%' },
                        { value: 'fall', label: 'Fall%' },
                    ]}
                />
                <Choice value={cmp} onChange={setCmp} options={CMP_OPTIONS} />
                <NumberInput value={threshold} onChange={setThreshold} min={0} max={100} width='6.4rem' />%
            </div>
            <div className='auto-card__row'>
                {localize('Then trade')}
                <Choice
                    value={trade}
                    onChange={setTrade}
                    options={[
                        { value: 'rise', label: localize('Rise') },
                        { value: 'fall', label: localize('Fall') },
                    ]}
                />
            </div>
            <TradeControls
                shared={shared}
                symbol={market.symbol}
                contract_valid={null}
                decide={decide}
                tick_key={updated_at}
                start_label={localize('Start Auto Trade')}
            />
        </CardShell>
    );
};

const MatchesDiffers = ({ shared }: { shared: TShared }) => {
    const market = useCardMarket(shared.symbols);
    const { digits, updated_at } = market.live;
    const [more, setMore] = useState(false);
    const [digit, setDigit] = useState(5);
    const [side, setSide] = useState<'match' | 'differ'>('differ');
    const [cmp, setCmp] = useState<TCmp>('gte');
    const [threshold, setThreshold] = useState(90);
    const [trade, setTrade] = useState<'match' | 'differ'>('differ');

    const chips = useMemo<TChip[]>(
        () => digits.map(d => (d === digit ? { label: 'Match', tone: 'red' } : { label: 'Differ', tone: 'slate' })),
        [digits, digit]
    );
    const match = useMemo(() => pct(digits.filter(d => d === digit).length, digits.length), [digits, digit]);
    const differ = digits.length ? 100 - match : 0;

    const decide = () => {
        const value = side === 'match' ? match : differ;
        if (!digits.length || !compare(value, cmp, threshold)) return null;
        return { contract_type: trade === 'match' ? 'DIGITMATCH' : 'DIGITDIFF', barrier: digit } as TAutoContract;
    };

    return (
        <CardShell
            accent='orange'
            icon={<Icon kind='matchdiff' />}
            title={`${localize('Matches/Differs')} (${digit})`}
            shared={shared}
            market={market}
        >
            <DigitPicker value={digit} onChange={setDigit} />
            <ChipRow chips={chips} show_more={more} onToggle={() => setMore(m => !m)} />
            <SplitBar
                left={match}
                right={differ}
                left_label={localize('Match')}
                right_label={localize('Differ')}
                left_tone='green'
                right_tone='red'
            />
            <div className='auto-card__row'>
                {localize('If Digit')} {digit}
                <Choice
                    value={side}
                    onChange={setSide}
                    options={[
                        { value: 'match', label: 'Match %' },
                        { value: 'differ', label: 'Differ %' },
                    ]}
                />
                <Choice value={cmp} onChange={setCmp} options={CMP_OPTIONS} />
                <NumberInput value={threshold} onChange={setThreshold} min={0} max={100} width='6.4rem' />%
            </div>
            <div className='auto-card__row'>
                {localize('Then trade')}
                <Choice
                    value={trade}
                    onChange={setTrade}
                    options={[
                        { value: 'match', label: `${localize('Matches')} ${digit}` },
                        { value: 'differ', label: `${localize('Differs')} ${digit}` },
                    ]}
                />
            </div>
            <TradeControls
                shared={shared}
                symbol={market.symbol}
                contract_valid={null}
                decide={decide}
                tick_key={updated_at}
                start_label={localize('Start Auto Trade')}
            />
        </CardShell>
    );
};

/* ------------------------------------------------------------------------ page */

const CARDS = [
    { id: 'eo-digits', Component: EvenOddDigits },
    { id: 'eo-percent', Component: EvenOddPercent },
    { id: 'ou-digits', Component: OverUnderDigits },
    { id: 'ou-percent', Component: OverUnderPercent },
    { id: 'rise-fall', Component: RiseFall },
    { id: 'match-differ', Component: MatchesDiffers },
];

const AutoTrader = observer(() => {
    const { isAuthorized, activeLoginid, authData } = useApiBase();
    const [symbols, setSymbols] = useState<TAnalysisSymbol[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pins, setPins] = useState<string[]>(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(PIN_KEY) ?? '[]');
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        let cancelled = false;
        getScannableSymbols()
            .then(list => !cancelled && setSymbols(list))
            .catch(err => !cancelled && setError(err instanceof Error ? err.message : 'Could not load markets.'));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(PIN_KEY, JSON.stringify(pins));
        } catch {
            /* nothing to do */
        }
    }, [pins]);

    const can_trade = !!isAuthorized && !!activeLoginid;
    const is_demo = activeLoginid ? isDemoAccount(activeLoginid) : false;
    const currency = authData?.currency || 'USD';
    const account_label = is_demo
        ? localize('Trades go to your Demo account ({{id}})', { id: activeLoginid })
        : localize('Trades go to your REAL account ({{id}}) - real money', { id: activeLoginid });

    const ordered = [...CARDS].sort((a, b) => Number(pins.includes(b.id)) - Number(pins.includes(a.id)));

    return (
        <div className='auto-trader'>
            {!can_trade && (
                <div className='auto-trader__notice'>
                    {localize('Log in with your Deriv account to start auto trading. Market data is shown live either way.')}
                </div>
            )}
            {error && <div className='auto-trader__notice auto-trader__notice--error'>{error}</div>}
            <div className='auto-trader__grid'>
                {ordered.map(({ id, Component }) => (
                    <Component
                        key={id}
                        shared={{
                            symbols,
                            currency,
                            can_trade,
                            account_label,
                            pinned: pins.includes(id),
                            onTogglePin: () =>
                                setPins(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])),
                        }}
                    />
                ))}
            </div>
        </div>
    );
});

export default AutoTrader;
