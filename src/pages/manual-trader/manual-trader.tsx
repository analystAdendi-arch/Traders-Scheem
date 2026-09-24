/**
 * Manual Trader: our own trading screen on the Deriv Options API, which is how
 * Deriv tells partners to do it - their DTrader page is not embedded.
 *
 * Layout follows their suggested order: chart and symbol list in the middle
 * (the same SmartChart the Charts tab uses, so the market selector and the
 * price come from one place), open positions on the left, and the contract,
 * amount, duration and buy controls on the right.
 */
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { useStore } from '@/hooks/useStore';
import Chart from '@/pages/chart';
import { FAMILIES, TSide, TTradeFamily, useManualTrader } from './use-manual-trader';
import './manual-trader.scss';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/* ------------------------------------------------------------------ pieces */

const Stepper = ({
    value,
    onChange,
    step,
    min,
    max,
    decimals = 2,
    suffix,
}: {
    value: number;
    onChange: (next: number) => void;
    step: number;
    min: number;
    max: number;
    decimals?: number;
    suffix?: string;
}) => (
    <div className='mt-stepper'>
        <button
            type='button'
            className='mt-stepper__btn'
            aria-label={localize('Decrease')}
            onClick={() => onChange(Math.max(min, Number((value - step).toFixed(decimals))))}
        >
            −
        </button>
        <span className='mt-stepper__value'>
            <input
                className='mt-stepper__input'
                type='number'
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
            {suffix && <span className='mt-stepper__suffix'>{suffix}</span>}
        </span>
        <button
            type='button'
            className='mt-stepper__btn'
            aria-label={localize('Increase')}
            onClick={() => onChange(Math.min(max, Number((value + step).toFixed(decimals))))}
        >
            +
        </button>
    </div>
);

/* -------------------------------------------------------------------- page */

const ManualTrader = observer(() => {
    const { chart_store } = useStore();
    const symbol = chart_store?.symbol;
    const trader = useManualTrader(symbol);
    const [positions_open, setPositionsOpen] = useState(true);
    /** Which side the Buy button will take, as DTrader's Rise/Fall tabs do. */
    const [side, setSide] = useState<TSide>('left');
    const quote = trader.quotes[side];

    return (
        <div className='manual-trader'>
            {/* account strip, as DTrader shows top-right */}
            <div className='manual-trader__bar'>
                <span className='manual-trader__account'>
                    <span className='manual-trader__account-type'>
                        {trader.is_demo ? localize('Demo account') : localize('Real account')}
                    </span>
                    <span className='manual-trader__balance'>
                        {trader.balance
                            ? `${trader.balance.amount.toFixed(2)} ${trader.balance.currency}`
                            : localize('Balance unavailable')}
                    </span>
                </span>
                {trader.notice && (
                    <button type='button' className='manual-trader__notice' onClick={trader.dismissNotice}>
                        {trader.notice}
                    </button>
                )}
                {trader.error && <span className='manual-trader__error'>{trader.error}</span>}
                {!trader.is_logged_in && (
                    <span className='manual-trader__hint'>
                        {localize('Prices are live. Log in with Deriv to trade.')}
                    </span>
                )}
            </div>

            <div className='manual-trader__grid'>
                {/* open positions */}
                <section className='mt-panel mt-panel--positions'>
                    <header className='mt-panel__head'>
                        <h2 className='mt-panel__title'>{localize('Open positions')}</h2>
                        <button
                            type='button'
                            className='mt-panel__collapse'
                            aria-expanded={positions_open}
                            onClick={() => setPositionsOpen(open => !open)}
                        >
                            {positions_open ? '−' : '+'}
                        </button>
                    </header>

                    {positions_open && (
                        <div className='mt-panel__body'>
                            {trader.open_positions.length === 0 ? (
                                <div className='mt-empty'>
                                    <svg width='40' height='40' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                                        <rect
                                            x='2.5'
                                            y='7'
                                            width='19'
                                            height='13'
                                            rx='2'
                                            stroke='currentColor'
                                            strokeWidth='1.6'
                                        />
                                        <path
                                            d='M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7'
                                            stroke='currentColor'
                                            strokeWidth='1.6'
                                        />
                                    </svg>
                                    <p>{localize('You have no open positions.')}</p>
                                </div>
                            ) : (
                                <ul className='mt-positions'>
                                    {trader.open_positions.map(position => (
                                        <li key={position.contract_id} className='mt-position'>
                                            <span className='mt-position__type'>{position.contract_type}</span>
                                            <span
                                                className={`mt-position__profit mt-position__profit--${
                                                    position.profit >= 0 ? 'up' : 'down'
                                                }`}
                                            >
                                                {position.profit >= 0 ? '+' : ''}
                                                {position.profit.toFixed(2)}
                                            </span>
                                            <span className='mt-position__stake'>
                                                {localize('Stake')} {position.buy_price.toFixed(2)}
                                            </span>
                                            {position.is_valid_to_sell && (
                                                <button
                                                    type='button'
                                                    className='mt-position__sell'
                                                    disabled={trader.selling === position.contract_id}
                                                    onClick={() => void trader.sell(position.contract_id)}
                                                >
                                                    {trader.selling === position.contract_id
                                                        ? localize('Selling…')
                                                        : `${localize('Sell')} ${
                                                              position.sell_price?.toFixed(2) ?? ''
                                                          }`}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {trader.settled_positions.length > 0 && (
                                <>
                                    <div className='mt-panel__subhead'>
                                        <span>{localize('Settled')}</span>
                                        <button
                                            type='button'
                                            className='mt-panel__clear'
                                            onClick={trader.clearSettled}
                                        >
                                            {localize('Clear')}
                                        </button>
                                    </div>
                                    <ul className='mt-positions'>
                                        {trader.settled_positions.map(position => (
                                            <li key={position.contract_id} className='mt-position'>
                                                <span className='mt-position__type'>{position.contract_type}</span>
                                                <span
                                                    className={`mt-position__profit mt-position__profit--${
                                                        position.profit >= 0 ? 'up' : 'down'
                                                    }`}
                                                >
                                                    {position.profit >= 0 ? '+' : ''}
                                                    {position.profit.toFixed(2)}
                                                </span>
                                                <span className='mt-position__stake'>
                                                    {localize('Stake')} {position.buy_price.toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* the site's own chart carries the symbol list and live price */}
                <section className='mt-chart'>
                    <Chart show_digits_stats={trader.meta.needs_digit || trader.meta.tick_only} />
                </section>

                {/* contract, amount, duration, buy - laid out as DTrader does */}
                <section className='mt-panel mt-panel--trade'>
                    <div className='mt-panel__body'>
                        <p className='mt-howto'>
                            {localize('How to trade {{type}}?', { type: trader.meta.label })}
                        </p>

                        <label className='mt-field'>
                            <span className='mt-field__label'>{localize('Trade type')}</span>
                            <select
                                className='mt-field__control'
                                value={trader.family}
                                onChange={event => trader.setFamily(event.target.value as TTradeFamily)}
                            >
                                {trader.families.map(key => (
                                    <option key={key} value={key}>
                                        {FAMILIES[key].label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* the two sides as tabs, one of which is armed for Buy */}
                        <div className='mt-sides' role='tablist'>
                            {(['left', 'right'] as TSide[]).map(option => {
                                const choice = option === 'left' ? trader.meta.left : trader.meta.right;
                                return (
                                    <button
                                        key={option}
                                        type='button'
                                        role='tab'
                                        aria-selected={side === option}
                                        className={`mt-side mt-side--${option}${
                                            side === option ? ' mt-side--active' : ''
                                        }`}
                                        onClick={() => setSide(option)}
                                    >
                                        {choice.label}
                                    </button>
                                );
                            })}
                        </div>

                        {trader.meta.needs_digit && (
                            <div className='mt-field'>
                                <span className='mt-field__label'>{localize('Digit')}</span>
                                <div className='mt-digits'>
                                    {DIGITS.map(value => (
                                        <button
                                            key={value}
                                            type='button'
                                            className={`mt-digit${value === trader.digit ? ' mt-digit--active' : ''}`}
                                            aria-pressed={value === trader.digit}
                                            onClick={() => trader.setDigit(value)}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='mt-field'>
                            <span className='mt-field__label'>{localize('Duration')}</span>
                            {trader.meta.tick_only ? (
                                <p className='mt-field__fixed'>{localize('1 tick')}</p>
                            ) : (
                                <Stepper
                                    value={trader.duration}
                                    onChange={trader.setDuration}
                                    step={1}
                                    min={1}
                                    max={10}
                                    decimals={0}
                                    suffix={localize('ticks')}
                                />
                            )}
                        </div>

                        <div className='mt-field'>
                            <span className='mt-field__label'>
                                {localize('Stake')} ({trader.currency})
                            </span>
                            <Stepper
                                value={trader.stake}
                                onChange={trader.setStake}
                                step={1}
                                min={trader.min_stake}
                                max={trader.max_stake}
                            />
                        </div>

                        <div className='mt-summary'>
                            <div className='mt-summary__row'>
                                <span>{localize('Cost')}</span>
                                <strong>{quote ? `${quote.ask_price.toFixed(2)} ${trader.currency}` : '--'}</strong>
                            </div>
                            <div className='mt-summary__row'>
                                <span>{localize('Payout')}</span>
                                <strong>{quote ? `${quote.payout.toFixed(2)} ${trader.currency}` : '--'}</strong>
                            </div>
                        </div>

                        {/* One Buy for the armed side, payout underneath. */}
                        <button
                            type='button'
                            className={`mt-buy mt-buy--${side}`}
                            disabled={!!trader.busy_side || !symbol}
                            onClick={() => void trader.buy(side)}
                            title={quote?.longcode || undefined}
                        >
                            <span className='mt-buy__label'>
                                {trader.busy_side ? localize('Buying…') : localize('Buy')}
                            </span>
                            <span className='mt-buy__payout'>
                                {quote
                                    ? `${localize('Payout')} ${quote.payout.toFixed(2)} ${trader.currency}`
                                    : localize('Pricing…')}
                            </span>
                        </button>

                        {quote?.longcode && <p className='mt-longcode'>{quote.longcode}</p>}
                    </div>
                </section>
            </div>
        </div>
    );
});

export default ManualTrader;
