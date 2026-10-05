/**
 * The Deriv Trader trade panel: side toggle, last-digit prediction with live
 * statistics, duration, barrier / growth rate / multiplier / payout per point /
 * strike as the trade type needs, stake, take profit and stop loss, Allow equals,
 * and the Buy button with the live payout. Open positions sit underneath.
 */
import { useEffect, useRef, useState } from 'react';

import { offerRow, TOffer } from './market-data';
import { digitAllowed, TDurationUnit, TForm, TSide, TTradeType, UNIT_LABELS } from './trade-types';

export type TProposal = {
    id?: string;
    ask_price?: number;
    payout?: number;
    longcode?: string;
    details?: Record<string, any>;
    limit_order?: Record<string, any>;
    commission?: number;
    payout_per_point?: string;
    error?: string;
    loading?: boolean;
};

export type TPosition = {
    contract_id: number;
    contract_type: string;
    label: string;
    tone: 'up' | 'down';
    symbol: string;
    symbol_name: string;
    entry_spot?: number;
    buy_price: number;
    profit: number;
    status: 'open' | 'won' | 'lost' | 'sold';
    can_sell: boolean;
    selling?: boolean;
    longcode?: string;
};

type TProps = {
    type: TTradeType;
    side: TSide;
    form: TForm;
    setForm: (patch: Partial<TForm>) => void;
    offer: TOffer | null;
    proposal: TProposal;
    currency: string;
    digit_stats: number[];
    last_digit: number | null;
    can_trade: boolean;
    trade_hint: string;
    buying: boolean;
    onBuy: () => void;
    positions: TPosition[];
    onSell: (contract_id: number) => void;
    onHowTo: () => void;
    now: number;
};

const money = (value: number | undefined, currency: string) =>
    value === undefined || Number.isNaN(Number(value)) ? '—' : `${Number(value).toFixed(2)} ${currency}`;

const pad2 = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "5 ticks", "1 minute". */
const durationText = (n: number, unit: TDurationUnit) => `${n} ${UNIT_LABELS[unit][n === 1 ? 0 : 1]}`;

/** Tick-duration range from contracts_for, e.g. "1t" .. "10t" -> [1, 10]. */
const tickRange = (offer: TOffer | null, contract_type: string): [number, number] | null => {
    const row = offerRow(offer, contract_type, 't');
    if (!row || !String(row.min_contract_duration).endsWith('t')) return null;
    return [parseInt(row.min_contract_duration, 10), parseInt(row.max_contract_duration, 10)];
};

const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button
        type='button'
        role='switch'
        aria-checked={on}
        aria-label={label}
        className={`mt-switch ${on ? 'is-on' : ''}`}
        onClick={() => onChange(!on)}
    >
        <span />
    </button>
);

const TradePanel = (props: TProps) => {
    const { type, side, form, setForm, offer, proposal, currency, digit_stats, last_digit, now } = props;
    const [editing_duration, setEditingDuration] = useState(false);
    const duration_box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editing_duration) return undefined;
        const onDown = (event: MouseEvent) => {
            if (duration_box.current && !duration_box.current.contains(event.target as Node)) setEditingDuration(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [editing_duration]);

    const ticks = form.duration_unit === 't' ? tickRange(offer, side.contract_type) : null;

    const max_stat = digit_stats.length ? Math.max(...digit_stats) : 0;
    const min_stat = digit_stats.length ? Math.min(...digit_stats) : 0;

    // Rows for the duration family in use: strikes and payout choices differ between them.
    const row_for = (contract_type: string) => offerRow(offer, contract_type, form.duration_unit);
    const growth_rates: number[] = row_for('ACCU')?.growth_rate_range ?? [0.01, 0.02, 0.03, 0.04, 0.05];
    const multipliers: number[] = row_for(side.contract_type)?.multiplier_range ?? [];
    const payout_choices: number[] = row_for(side.contract_type)?.payout_choices ?? [];
    const strike_choices: string[] = row_for(side.contract_type)?.barrier_choices ?? [];

    const clock = new Date(now);
    const date_text = `${pad2(clock.getUTCDate())} ${MONTHS[clock.getUTCMonth()]} ${clock.getUTCFullYear()}`;
    const time_text = `${pad2(clock.getUTCHours())}:${pad2(clock.getUTCMinutes())}:${pad2(clock.getUTCSeconds())} GMT`;

    /* ---------------------------------------------------------- buy caption */
    let caption = '';
    if (proposal.loading) caption = 'Getting price…';
    else if (proposal.error) caption = '';
    else if (type.id === 'accumulators') {
        caption = `Max. payout ${money(proposal.details?.maximum_payout, currency)}`;
    } else if (type.id === 'multipliers') {
        const stop_out = proposal.limit_order?.stop_out?.order_amount;
        caption = stop_out !== undefined ? `Stop out ${money(Math.abs(stop_out), currency)}` : '';
    } else if (type.id === 'turbos' || type.id === 'vanillas') {
        caption = proposal.payout_per_point ? `Payout per point ${proposal.payout_per_point}` : '';
    } else if (proposal.payout !== undefined) {
        caption = `Payout ${money(proposal.payout, currency)}`;
    }

    const open_positions = props.positions.filter(p => p.status === 'open');
    const closed_positions = props.positions.filter(p => p.status !== 'open').slice(0, 6);

    return (
        <aside className='mt-panel'>
            <div className='mt-panel__scroll'>
                <button type='button' className='mt-panel__how' onClick={props.onHowTo}>
                    How to trade {type.label}?
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <path d='m9 6 6 6-6 6' />
                    </svg>
                </button>

                {type.sides.length > 1 && (
                    <div className='mt-panel__sides' role='tablist'>
                        {type.sides.map(s => (
                            <button
                                key={s.key}
                                type='button'
                                role='tab'
                                aria-selected={s.key === side.key}
                                className={`mt-panel__side mt-panel__side--${s.tone} ${s.key === side.key ? 'is-active' : ''}`}
                                onClick={() => setForm({ side: s.key })}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                {type.shows_digit_stats && (
                    <div className='mt-field mt-field--digits'>
                        <span className='mt-field__label'>
                            {type.uses_digit ? 'Last digit prediction' : 'Last digit statistics'}
                        </span>
                        <div className='mt-digits'>
                            {Array.from({ length: 10 }, (_, digit) => {
                                const allowed = type.uses_digit && digitAllowed(side.contract_type, digit);
                                const pct = digit_stats[digit];
                                const tone =
                                    pct === undefined ? '' : pct === max_stat ? 'is-high' : pct === min_stat ? 'is-low' : '';
                                return (
                                    <div key={digit} className='mt-digits__cell'>
                                        <button
                                            type='button'
                                            className={`mt-digits__digit ${type.uses_digit && form.digit === digit ? 'is-selected' : ''} ${
                                                last_digit === digit ? 'is-live' : ''
                                            }`}
                                            disabled={!allowed}
                                            onClick={() => allowed && setForm({ digit })}
                                            aria-pressed={type.uses_digit && form.digit === digit}
                                        >
                                            {digit}
                                        </button>
                                        <span className={`mt-digits__pct ${tone}`}>
                                            {pct === undefined ? '—' : `${pct.toFixed(1).replace(/\.0$/, '')}%`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {type.units.length > 0 && (
                    <div className='mt-field mt-field--button' ref={duration_box}>
                        <button type='button' className='mt-field__open' onClick={() => setEditingDuration(v => !v)}>
                            <span className='mt-field__label'>Duration</span>
                            <span className='mt-field__value'>{durationText(form.duration, form.duration_unit)}</span>
                        </button>
                        {editing_duration && (
                            <div className='mt-duration'>
                                {type.units.length > 1 && (
                                    <div className='mt-duration__units'>
                                        {type.units.map(unit => (
                                            <button
                                                key={unit}
                                                type='button'
                                                className={unit === form.duration_unit ? 'is-active' : ''}
                                                onClick={() =>
                                                    setForm({
                                                        duration_unit: unit,
                                                        duration: unit === 't' ? 5 : unit === 's' ? 15 : 1,
                                                    })
                                                }
                                            >
                                                {UNIT_LABELS[unit][1]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {form.duration_unit === 't' && ticks ? (
                                    <div className='mt-duration__ticks'>
                                        {Array.from({ length: ticks[1] - ticks[0] + 1 }, (_, i) => ticks[0] + i).map(n => (
                                            <button
                                                key={n}
                                                type='button'
                                                className={n === form.duration ? 'is-active' : ''}
                                                onClick={() => {
                                                    setForm({ duration: n });
                                                    setEditingDuration(false);
                                                }}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type='number'
                                        min={1}
                                        value={form.duration}
                                        onChange={event => setForm({ duration: Math.max(1, Math.trunc(Number(event.target.value) || 1)) })}
                                        aria-label={`Duration in ${UNIT_LABELS[form.duration_unit][1]}`}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {type.uses_barrier && (
                    <label className='mt-field'>
                        <span className='mt-field__label'>Barrier</span>
                        <input
                            className='mt-field__input'
                            value={form.barrier}
                            onChange={event => setForm({ barrier: event.target.value })}
                            placeholder='+0.38'
                        />
                    </label>
                )}

                {type.uses_two_barriers && (
                    <div className='mt-field-pair'>
                        <label className='mt-field'>
                            <span className='mt-field__label'>High barrier</span>
                            <input
                                className='mt-field__input'
                                value={form.barrier_high}
                                onChange={event => setForm({ barrier_high: event.target.value })}
                                placeholder='+1.84'
                            />
                        </label>
                        <label className='mt-field'>
                            <span className='mt-field__label'>Low barrier</span>
                            <input
                                className='mt-field__input'
                                value={form.barrier_low}
                                onChange={event => setForm({ barrier_low: event.target.value })}
                                placeholder='-1.84'
                            />
                        </label>
                    </div>
                )}

                {type.uses_selected_tick && (
                    <div className='mt-field'>
                        <span className='mt-field__label'>Tick prediction</span>
                        <div className='mt-chips mt-chips--ticks'>
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    type='button'
                                    className={n === form.selected_tick ? 'is-active' : ''}
                                    onClick={() => setForm({ selected_tick: n })}
                                    aria-label={`Tick ${n}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {type.uses_growth_rate && (
                    <div className='mt-field'>
                        <span className='mt-field__label'>Growth rate</span>
                        <div className='mt-chips'>
                            {growth_rates.map(rate => (
                                <button
                                    key={rate}
                                    type='button'
                                    className={rate === form.growth_rate ? 'is-active' : ''}
                                    onClick={() => setForm({ growth_rate: rate })}
                                >
                                    {Math.round(rate * 100)}%
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {type.uses_multiplier && multipliers.length > 0 && (
                    <div className='mt-field'>
                        <span className='mt-field__label'>Multiplier</span>
                        <div className='mt-chips'>
                            {multipliers.map(value => (
                                <button
                                    key={value}
                                    type='button'
                                    className={value === form.multiplier ? 'is-active' : ''}
                                    onClick={() => setForm({ multiplier: value })}
                                >
                                    x{value}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {type.uses_payout_per_point && payout_choices.length > 0 && (
                    <div className='mt-field'>
                        <span className='mt-field__label'>Payout per point</span>
                        <div className='mt-chips'>
                            {payout_choices.map(value => (
                                <button
                                    key={value}
                                    type='button'
                                    className={value === form.payout_per_point ? 'is-active' : ''}
                                    onClick={() => setForm({ payout_per_point: value })}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {type.uses_strike && strike_choices.length > 0 && (
                    <div className='mt-field'>
                        <span className='mt-field__label'>Strike price</span>
                        <div className='mt-chips'>
                            {strike_choices.map(value => (
                                <button
                                    key={value}
                                    type='button'
                                    className={value === form.strike ? 'is-active' : ''}
                                    onClick={() => setForm({ strike: value })}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className='mt-field'>
                    <span className='mt-field__label'>Stake</span>
                    <div className='mt-stake'>
                        <button
                            type='button'
                            aria-label='Decrease stake'
                            onClick={() => setForm({ stake: Math.max(0.35, Number((form.stake - 1).toFixed(2))) })}
                        >
                            −
                        </button>
                        <input
                            type='number'
                            step='0.01'
                            min={0.35}
                            value={form.stake}
                            onChange={event => setForm({ stake: Number(event.target.value) || 0 })}
                            aria-label={`Stake in ${currency}`}
                        />
                        <span className='mt-stake__currency'>{currency}</span>
                        <button
                            type='button'
                            aria-label='Increase stake'
                            onClick={() => setForm({ stake: Number((form.stake + 1).toFixed(2)) })}
                        >
                            +
                        </button>
                    </div>
                </div>

                {type.uses_take_profit && (
                    <div className='mt-field mt-field--row'>
                        <span className='mt-field__label'>Take profit</span>
                        <input
                            className='mt-field__input mt-field__input--small'
                            type='number'
                            min={0}
                            placeholder='Off'
                            value={form.take_profit}
                            onChange={event => setForm({ take_profit: event.target.value })}
                            aria-label='Take profit amount'
                        />
                    </div>
                )}

                {type.uses_stop_loss && (
                    <div className='mt-field mt-field--row'>
                        <span className='mt-field__label'>Stop loss</span>
                        <input
                            className='mt-field__input mt-field__input--small'
                            type='number'
                            min={0}
                            placeholder='Off'
                            value={form.stop_loss}
                            onChange={event => setForm({ stop_loss: event.target.value })}
                            aria-label='Stop loss amount'
                        />
                    </div>
                )}

                {type.uses_allow_equals && (
                    <div className='mt-equals'>
                        <span title='Also win when the exit spot equals the entry spot'>Allow equals</span>
                        <Toggle on={form.allow_equals} onChange={v => setForm({ allow_equals: v })} label='Allow equals' />
                    </div>
                )}

                <button
                    type='button'
                    className={`mt-buy mt-buy--${side.tone}`}
                    onClick={props.onBuy}
                    disabled={props.buying || !props.can_trade || Boolean(proposal.error) || proposal.loading}
                >
                    <span className='mt-buy__label'>
                        {props.buying ? 'Buying…' : type.sides.length > 1 ? `Buy ${side.label}` : 'Buy'}
                    </span>
                    {caption && <span className='mt-buy__caption'>{caption}</span>}
                </button>
                {proposal.error && <p className='mt-panel__error'>{proposal.error}</p>}
                {!proposal.error && props.trade_hint && <p className='mt-panel__hint'>{props.trade_hint}</p>}

                {(open_positions.length > 0 || closed_positions.length > 0) && (
                    <div className='mt-positions'>
                        <div className='mt-positions__head'>
                            Positions <span>{open_positions.length} open</span>
                        </div>
                        {[...open_positions, ...closed_positions].map(position => (
                            <div key={position.contract_id} className={`mt-position mt-position--${position.status}`}>
                                <div className='mt-position__top'>
                                    <span className={`mt-position__type mt-position__type--${position.tone}`}>{position.label}</span>
                                    <span className='mt-position__market'>{position.symbol_name}</span>
                                </div>
                                <div className='mt-position__bottom'>
                                    <span>Stake {money(position.buy_price, currency)}</span>
                                    <span className={position.profit >= 0 ? 'is-up' : 'is-down'}>
                                        {position.profit >= 0 ? '+' : ''}
                                        {money(position.profit, currency)}
                                    </span>
                                    {position.status === 'open' && position.can_sell ? (
                                        <button
                                            type='button'
                                            className='mt-position__close'
                                            disabled={position.selling}
                                            onClick={() => props.onSell(position.contract_id)}
                                        >
                                            {position.selling ? 'Closing…' : 'Close'}
                                        </button>
                                    ) : (
                                        <span className={`mt-position__status mt-position__status--${position.status}`}>
                                            {position.status === 'open' ? 'Running' : position.status === 'won' ? 'Won' : position.status === 'lost' ? 'Lost' : 'Closed'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <footer className='mt-panel__clock'>
                <span>
                    <i className='mt-panel__clock-dot' /> {date_text}
                </span>
                <span>{time_text}</span>
            </footer>
        </aside>
    );
};

export default TradePanel;
