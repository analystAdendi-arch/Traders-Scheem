import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import useLiveTicks from '@/hooks/useLiveTicks';
import {
    digitStats,
    evenOddSplit,
    formatQuote,
    getAnalysisSymbols,
    matchDifferSplit,
    overUnderSplit,
    riseFallSplit,
    TAnalysisSymbol,
} from '@/utils/analysis';

import './analysis-tool.scss';

const DEFAULT_TICKS = 1000;
const MIN_TICKS = 100;
const MAX_TICKS = 5000;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SEQUENCE_LENGTH = 10;
const DETAIL_SEQUENCE_LENGTH = 30;
const STORAGE_KEY = 'analysis-tool-prefs';

const percent = (value: number, total: number): string => (total > 0 ? `${value.toFixed(1)}%` : '--');

/* ------------------------------------------------------------- primitives */

type TTone = 'over' | 'under' | 'match' | 'differ' | 'even' | 'odd' | 'rise' | 'fall' | 'flat';

type TOutcome = { label: string; tone: TTone };

/** Trailing run of identical outcomes, e.g. `2x Under`. */
const trailingBadge = (outcomes: TOutcome[], labels: Partial<Record<TTone, string>>): string | null => {
    if (!outcomes.length) return null;
    const last = outcomes[outcomes.length - 1];
    if (last.tone === 'flat') return null;
    let count = 0;
    for (let i = outcomes.length - 1; i >= 0; i--) {
        if (outcomes[i].tone !== last.tone) break;
        count += 1;
    }
    const label = labels[last.tone];
    return label ? `${count}x ${label}` : null;
};

const Meter = ({ label, value, total, tone }: { label: string; value: number; total: number; tone: TTone }) => (
    <div className='analysis-tool__meter'>
        <span className={`analysis-tool__meter-label analysis-tool__meter-label--${tone}`}>{label}</span>
        <div className='analysis-tool__meter-track'>
            <div
                className={`analysis-tool__meter-fill analysis-tool__meter-fill--${tone}`}
                style={{ width: total > 0 ? `${Math.max(0, Math.min(100, value))}%` : '0%' }}
            />
        </div>
        <span className={`analysis-tool__meter-value analysis-tool__meter-value--${tone}`}>
            {percent(value, total)}
        </span>
    </div>
);

const DigitChips = ({
    selected,
    onSelect,
    tone,
}: {
    selected: number;
    onSelect: (digit: number) => void;
    tone: 'over' | 'match';
}) => (
    <div className='analysis-tool__chips'>
        {DIGITS.map(digit => (
            <button
                key={digit}
                type='button'
                className={`analysis-tool__chip${
                    digit === selected ? ` analysis-tool__chip--active analysis-tool__chip--${tone}` : ''
                }`}
                onClick={() => onSelect(digit)}
                aria-pressed={digit === selected}
            >
                {digit}
            </button>
        ))}
    </div>
);

const HISTORY_ROWS = 25;

/** Newest-first tick history shown under "+ More": price, last digit and outcome. */
const TickHistory = ({
    quotes,
    digits,
    decimals,
    outcomes,
}: {
    quotes: number[];
    digits: number[];
    decimals: number;
    outcomes: TOutcome[];
}) => {
    const rows = [];
    const offset = quotes.length - outcomes.length; // rise/fall has one fewer outcome
    for (let i = quotes.length - 1; i >= 0 && rows.length < HISTORY_ROWS; i--) {
        const outcome = outcomes[i - offset];
        rows.push(
            <tr key={i}>
                <td>#{quotes.length - i}</td>
                <td>{formatQuote(quotes[i], decimals)}</td>
                <td>
                    <strong>{digits[i]}</strong>
                </td>
                <td>
                    {outcome ? (
                        <span className={`analysis-tool__seq analysis-tool__seq--${outcome.tone}`}>
                            {outcome.label}
                        </span>
                    ) : (
                        '--'
                    )}
                </td>
            </tr>
        );
    }
    return (
        <div className='analysis-tool__history'>
            <span className='analysis-tool__history-title'>{localize('Tick history (newest first)')}</span>
            <table className='analysis-tool__table'>
                <thead>
                    <tr>
                        <th>{localize('Tick')}</th>
                        <th>{localize('Price')}</th>
                        <th>{localize('Digit')}</th>
                        <th>{localize('Result')}</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
};

const Sequence = ({ outcomes }: { outcomes: TOutcome[] }) => (
    <div className='analysis-tool__sequence'>
        {outcomes.map((item, index) => (
            <span
                key={`${index}-${item.label}`}
                className={`analysis-tool__seq analysis-tool__seq--${item.tone}`}
            >
                {item.label}
            </span>
        ))}
    </div>
);

const Panel = ({
    title,
    badge,
    status,
    expanded,
    onToggle,
    children,
    sequence,
    details,
}: {
    title: string;
    badge: string | null;
    status: string;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
    sequence: TOutcome[];
    details: ReactNode;
}) => (
    <section className='analysis-tool__panel'>
        <header className='analysis-tool__panel-head'>
            <h3 className='analysis-tool__panel-title'>{title}</h3>
            {badge ? (
                <span className='analysis-tool__badge'>{badge}</span>
            ) : (
                <span className='analysis-tool__panel-status'>{status}</span>
            )}
        </header>
        <div className='analysis-tool__panel-body'>
            {children}
            <div className='analysis-tool__panel-footer'>
                <Sequence outcomes={sequence} />
                <button type='button' className='analysis-tool__more' onClick={onToggle} aria-expanded={expanded}>
                    {expanded ? localize('- Less') : localize('+ More')}
                </button>
            </div>
            {expanded && <div className='analysis-tool__details'>{details}</div>}
        </div>
    </section>
);

/* ------------------------------------------------------------------ page */

const AnalysisTool = observer(() => {
    const [symbols, setSymbols] = useState<TAnalysisSymbol[]>([]);
    const [symbol, setSymbol] = useState<string | null>(null);
    const [symbols_error, setSymbolsError] = useState<string | null>(null);
    const [market_open, setMarketOpen] = useState(false);
    const [ticks, setTicks] = useState(DEFAULT_TICKS);
    const [ticks_input, setTicksInput] = useState(String(DEFAULT_TICKS));
    const [over_under_barrier, setOverUnderBarrier] = useState(5);
    const [match_digit, setMatchDigit] = useState(5);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const market_menu_ref = useRef<HTMLDivElement>(null);

    const live = useLiveTicks(symbol, ticks);

    /* preferences */
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
            if (!saved || typeof saved !== 'object') return;
            if (typeof saved.symbol === 'string') setSymbol(saved.symbol);
            if (Number.isFinite(saved.ticks)) {
                const safe = Math.max(MIN_TICKS, Math.min(MAX_TICKS, Math.trunc(saved.ticks)));
                setTicks(safe);
                setTicksInput(String(safe));
            }
            if (Number.isFinite(saved.over_under_barrier)) setOverUnderBarrier(saved.over_under_barrier);
            if (Number.isFinite(saved.match_digit)) setMatchDigit(saved.match_digit);
        } catch {
            /* no stored preferences */
        }
    }, []);

    useEffect(() => {
        if (!symbol) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ symbol, ticks, over_under_barrier, match_digit }));
        } catch {
            /* nothing to do */
        }
    }, [symbol, ticks, over_under_barrier, match_digit]);

    /* markets from Deriv */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await getAnalysisSymbols();
                if (cancelled) return;
                const tradable = list.filter(s => s.is_open);
                const usable = tradable.length ? tradable : list;
                setSymbols(usable);
                setSymbolsError(null);
                setSymbol(current => {
                    if (current && usable.some(s => s.symbol === current)) return current;
                    const synthetic = usable.find(s => /volatilit/i.test(s.display_name));
                    return (synthetic ?? usable[0])?.symbol ?? null;
                });
            } catch (error) {
                if (cancelled) return;
                setSymbolsError(error instanceof Error ? error.message : 'Could not load Deriv markets.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!market_open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!market_menu_ref.current?.contains(event.target as Node)) setMarketOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [market_open]);

    const commitTicks = useCallback(() => {
        const parsed = Math.max(MIN_TICKS, Math.min(MAX_TICKS, parseInt(ticks_input, 10) || DEFAULT_TICKS));
        setTicks(parsed);
        setTicksInput(String(parsed));
    }, [ticks_input]);

    const active_symbol = useMemo(() => symbols.find(s => s.symbol === symbol) ?? null, [symbols, symbol]);

    const grouped_symbols = useMemo(() => {
        const groups = new Map<string, TAnalysisSymbol[]>();
        symbols.forEach(item => {
            const key = item.market_display_name || item.market || localize('Other');
            const list = groups.get(key) ?? [];
            list.push(item);
            groups.set(key, list);
        });
        return Array.from(groups.entries()).map(([market, list]) => ({
            market,
            list: [...list].sort((a, b) => a.display_name.localeCompare(b.display_name)),
        }));
    }, [symbols]);

    /* analysis, recomputed as ticks arrive */
    const { digits, quotes } = live;
    const total = digits.length;

    const digit_percentages = useMemo(() => digitStats(digits), [digits]);

    /**
     * digit -> colour tier by frequency. Ties share a tier, so when two digits
     * are both the most (or least) frequent, both are green (or red).
     */
    const digit_tiers = useMemo(() => {
        const map = new Map<number, 'hot' | 'second' | 'third' | 'cold'>();
        if (!total) return map;
        const distinct = Array.from(new Set(digit_percentages.map(s => s.count))).sort((a, b) => b - a);
        const [max, second, third] = distinct;
        const min = distinct[distinct.length - 1];
        digit_percentages.forEach(stat => {
            if (stat.count === max) map.set(stat.digit, 'hot');
            else if (stat.count === min) map.set(stat.digit, 'cold');
            else if (stat.count === second) map.set(stat.digit, 'second');
            else if (stat.count === third) map.set(stat.digit, 'third');
        });
        return map;
    }, [digit_percentages, total]);

    // Under includes the barrier digit itself, so Over + Under always adds to 100%.
    const over_under = useMemo(() => {
        const split = overUnderSplit(digits, over_under_barrier);
        return { ...split, second: split.total ? 100 - split.first : 0 };
    }, [digits, over_under_barrier]);
    const match_differ = useMemo(() => matchDifferSplit(digits, match_digit), [digits, match_digit]);
    const even_odd = useMemo(() => evenOddSplit(digits), [digits]);
    const rise_fall = useMemo(() => riseFallSplit(quotes), [quotes]);

    const all_barriers = useMemo(
        () => DIGITS.map(barrier => ({ barrier, split: overUnderSplit(digits, barrier) })),
        [digits]
    );
    const all_match = useMemo(() => DIGITS.map(digit => ({ digit, split: matchDifferSplit(digits, digit) })), [digits]);

    const directions = useMemo(() => {
        const out: ('up' | 'down' | 'flat')[] = [];
        for (let i = 1; i < quotes.length; i++) {
            out.push(quotes[i] > quotes[i - 1] ? 'up' : quotes[i] < quotes[i - 1] ? 'down' : 'flat');
        }
        return out;
    }, [quotes]);

    /* outcome streams feeding the badges and the chip rows */
    const over_under_outcomes = useMemo<TOutcome[]>(
        () =>
            digits.map<TOutcome>(d =>
                d > over_under_barrier ? { label: 'O', tone: 'over' } : { label: 'U', tone: 'under' }
            ),
        [digits, over_under_barrier]
    );
    const match_outcomes = useMemo<TOutcome[]>(
        () =>
            digits.map<TOutcome>(d =>
                d === match_digit ? { label: 'M', tone: 'match' } : { label: 'D', tone: 'differ' }
            ),
        [digits, match_digit]
    );
    const even_outcomes = useMemo<TOutcome[]>(
        () => digits.map<TOutcome>(d => (d % 2 === 0 ? { label: 'E', tone: 'even' } : { label: 'O', tone: 'odd' })),
        [digits]
    );
    const rise_outcomes = useMemo<TOutcome[]>(
        () =>
            directions.map<TOutcome>(direction =>
                direction === 'up'
                    ? { label: 'R', tone: 'rise' }
                    : direction === 'down'
                      ? { label: 'F', tone: 'fall' }
                      : { label: '·', tone: 'flat' }
            ),
        [directions]
    );

    const status_text = live.is_loading
        ? localize('Loading…')
        : live.error
          ? localize('No data')
          : total > 0
            ? localize('{{count}} ticks', { count: total })
            : localize('No data');

    const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    const price_text = live.last_quote === null ? '' : formatQuote(live.last_quote, live.decimals);

    return (
        <div className='analysis-tool'>
            <div className='analysis-tool__mode'>{localize('Circles')}</div>
            <div className='analysis-tool__toolbar'>
                <div className='analysis-tool__toolbar-left'>
                    <div className='analysis-tool__market' ref={market_menu_ref}>
                        <button
                            type='button'
                            className='analysis-tool__market-button'
                            onClick={() => setMarketOpen(open => !open)}
                            aria-expanded={market_open}
                        >
                            {active_symbol ? active_symbol.display_name : localize('Select market')}
                        </button>
                        {market_open && (
                            <div className='analysis-tool__market-menu'>
                                {grouped_symbols.length === 0 && (
                                    <div className='analysis-tool__market-empty'>
                                        {symbols_error ?? localize('Loading markets from Deriv…')}
                                    </div>
                                )}
                                {grouped_symbols.map(group => (
                                    <div key={group.market} className='analysis-tool__market-group'>
                                        <div className='analysis-tool__market-group-title'>{group.market}</div>
                                        {group.list.map(item => (
                                            <button
                                                key={item.symbol}
                                                type='button'
                                                className={`analysis-tool__market-option${
                                                    item.symbol === symbol
                                                        ? ' analysis-tool__market-option--active'
                                                        : ''
                                                }`}
                                                onClick={() => {
                                                    setSymbol(item.symbol);
                                                    setMarketOpen(false);
                                                }}
                                            >
                                                {item.display_name}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='analysis-tool__ticks'>
                        <span className='analysis-tool__ticks-label'>{localize('Ticks')}</span>
                        <input
                            className='analysis-tool__ticks-input'
                            type='number'
                            min={MIN_TICKS}
                            max={MAX_TICKS}
                            step={50}
                            value={ticks_input}
                            onChange={event => setTicksInput(event.target.value)}
                            onBlur={commitTicks}
                            onKeyDown={event => {
                                if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
                            }}
                            aria-label={localize('Number of ticks to analyse')}
                        />
                    </div>

                    <span className='analysis-tool__counted'>{status_text}</span>
                </div>

                <div className='analysis-tool__price'>
                    <span className='analysis-tool__price-label'>{localize('Live price')}</span>
                    <span
                        className={`analysis-tool__price-value analysis-tool__price-value--${
                            live.is_loading || !price_text ? 'pending' : live.last_direction ?? 'flat'
                        }`}
                    >
                        {price_text || (live.is_loading ? localize('Updating…') : localize('No data'))}
                    </span>
                </div>
            </div>

            {(live.error || symbols_error) && (
                <div className='analysis-tool__error'>{live.error ?? symbols_error}</div>
            )}

            <div className='analysis-tool__digits'>
                {digit_percentages.map(stat => {
                    const rank_tone = digit_tiers.get(stat.digit) ?? '';
                    const is_current = live.last_digit === stat.digit;
                    return (
                        <div
                            key={stat.digit}
                            className={[
                                'analysis-tool__digit',
                                rank_tone ? `analysis-tool__digit--${rank_tone}` : '',
                                is_current ? 'analysis-tool__digit--current' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            <span className='analysis-tool__digit-value'>{stat.digit}</span>
                            <span className='analysis-tool__digit-percent'>
                                {total > 0 ? `${stat.percentage.toFixed(1)}%` : '--'}
                            </span>
                            {is_current && <span className='analysis-tool__digit-marker' aria-hidden='true' />}
                        </div>
                    );
                })}
            </div>

            <div className='analysis-tool__grid'>
                <Panel
                    title={localize('Over / Under')}
                    badge={trailingBadge(over_under_outcomes, { over: localize('Over'), under: localize('Under') })}
                    status={status_text}
                    expanded={!!expanded.over_under}
                    onToggle={() => toggle('over_under')}
                    sequence={over_under_outcomes.slice(-SEQUENCE_LENGTH)}
                    details={
                        <>
                            <table className='analysis-tool__table'>
                                <thead>
                                    <tr>
                                        <th>{localize('Barrier')}</th>
                                        <th>{localize('Over')}</th>
                                        <th>{localize('Under (incl.)')}</th>
                                        <th>{localize('Equal')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {all_barriers.map(row => (
                                        <tr
                                            key={row.barrier}
                                            className={
                                                row.barrier === over_under_barrier
                                                    ? 'analysis-tool__table-row--active'
                                                    : ''
                                            }
                                        >
                                            <td>{row.barrier}</td>
                                            <td>{percent(row.split.first, row.split.total)}</td>
                                            <td>{percent(100 - row.split.first, row.split.total)}</td>
                                            <td>
                                                {percent(
                                                    100 - row.split.first - row.split.second,
                                                    row.split.total
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className='analysis-tool__note'>
                                {localize(
                                    'Under includes the barrier digit so Over + Under = 100%. A Deriv "Under" contract loses when the barrier digit itself prints - see the Equal column.'
                                )}
                            </p>
                            <TickHistory
                                quotes={quotes}
                                digits={digits}
                                decimals={live.decimals}
                                outcomes={over_under_outcomes}
                            />
                        </>
                    }
                >
                    <DigitChips selected={over_under_barrier} onSelect={setOverUnderBarrier} tone='over' />
                    <Meter label={localize('Over')} value={over_under.first} total={over_under.total} tone='over' />
                    <Meter
                        label={localize('Under')}
                        value={over_under.second}
                        total={over_under.total}
                        tone='under'
                    />
                </Panel>

                <Panel
                    title={localize('Match / Differ')}
                    badge={trailingBadge(match_outcomes, {
                        match: localize('Match'),
                        differ: localize('Differ'),
                    })}
                    status={status_text}
                    expanded={!!expanded.match_differ}
                    onToggle={() => toggle('match_differ')}
                    sequence={match_outcomes.slice(-SEQUENCE_LENGTH)}
                    details={
                        <>
                            <table className='analysis-tool__table'>
                            <thead>
                                <tr>
                                    <th>{localize('Digit')}</th>
                                    <th>{localize('Matches')}</th>
                                    <th>{localize('Differs')}</th>
                                    <th>{localize('Hits')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {all_match.map(row => (
                                    <tr
                                        key={row.digit}
                                        className={
                                            row.digit === match_digit ? 'analysis-tool__table-row--active' : ''
                                        }
                                    >
                                        <td>{row.digit}</td>
                                        <td>{percent(row.split.first, row.split.total)}</td>
                                        <td>{percent(row.split.second, row.split.total)}</td>
                                        <td>{row.split.first_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                            <TickHistory
                                quotes={quotes}
                                digits={digits}
                                decimals={live.decimals}
                                outcomes={match_outcomes}
                            />
                        </>
                    }
                >
                    <DigitChips selected={match_digit} onSelect={setMatchDigit} tone='match' />
                    <Meter
                        label={localize('Match')}
                        value={match_differ.first}
                        total={match_differ.total}
                        tone='match'
                    />
                    <Meter
                        label={localize('Differ')}
                        value={match_differ.second}
                        total={match_differ.total}
                        tone='differ'
                    />
                </Panel>

                <Panel
                    title={localize('Even / Odd')}
                    badge={trailingBadge(even_outcomes, { even: localize('Even'), odd: localize('Odd') })}
                    status={status_text}
                    expanded={!!expanded.even_odd}
                    onToggle={() => toggle('even_odd')}
                    sequence={even_outcomes.slice(-SEQUENCE_LENGTH)}
                    details={
                        <div className='analysis-tool__detail-block'>
                            <div className='analysis-tool__detail-row'>
                                <span>{localize('Even ticks')}</span>
                                <strong>{even_odd.first_count}</strong>
                            </div>
                            <div className='analysis-tool__detail-row'>
                                <span>{localize('Odd ticks')}</span>
                                <strong>{even_odd.second_count}</strong>
                            </div>
                            <Sequence outcomes={even_outcomes.slice(-DETAIL_SEQUENCE_LENGTH)} />
                            <TickHistory
                                quotes={quotes}
                                digits={digits}
                                decimals={live.decimals}
                                outcomes={even_outcomes}
                            />
                        </div>
                    }
                >
                    <Meter label={localize('Even')} value={even_odd.first} total={even_odd.total} tone='even' />
                    <Meter label={localize('Odd')} value={even_odd.second} total={even_odd.total} tone='odd' />
                </Panel>

                <Panel
                    title={localize('Rise / Fall')}
                    badge={trailingBadge(rise_outcomes, { rise: localize('Rise'), fall: localize('Fall') })}
                    status={status_text}
                    expanded={!!expanded.rise_fall}
                    onToggle={() => toggle('rise_fall')}
                    sequence={rise_outcomes.slice(-SEQUENCE_LENGTH)}
                    details={
                        <div className='analysis-tool__detail-block'>
                            <div className='analysis-tool__detail-row'>
                                <span>{localize('Rises')}</span>
                                <strong>{rise_fall.first_count}</strong>
                            </div>
                            <div className='analysis-tool__detail-row'>
                                <span>{localize('Falls')}</span>
                                <strong>{rise_fall.second_count}</strong>
                            </div>
                            <div className='analysis-tool__detail-row'>
                                <span>{localize('Flat ticks')}</span>
                                <strong>{Math.max(0, directions.length - rise_fall.total)}</strong>
                            </div>
                            <Sequence outcomes={rise_outcomes.slice(-DETAIL_SEQUENCE_LENGTH)} />
                            <TickHistory
                                quotes={quotes}
                                digits={digits}
                                decimals={live.decimals}
                                outcomes={rise_outcomes}
                            />
                        </div>
                    }
                >
                    <Meter label={localize('Rise')} value={rise_fall.first} total={rise_fall.total} tone='rise' />
                    <Meter label={localize('Fall')} value={rise_fall.second} total={rise_fall.total} tone='fall' />
                </Panel>
            </div>
        </div>
    );
});

export default AnalysisTool;
