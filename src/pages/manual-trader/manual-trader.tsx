import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import useLiveTicks from '@/hooks/useLiveTicks';
import { formatQuote } from '@/utils/analysis';
import { FAMILIES, TTradeFamily, useManualTrader } from './use-manual-trader';
import './manual-trader.scss';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const CHART_TICKS = 120;
const HISTORY_DIGITS = 12;

/* ------------------------------------------------------------------- pieces */

/** Recent ticks as a filled line, drawn from the live quotes. */
const Sparkline = ({ quotes }: { quotes: number[] }) => {
    const path = useMemo(() => {
        if (quotes.length < 2) return null;
        const min = Math.min(...quotes);
        const max = Math.max(...quotes);
        const span = max - min || 1;
        const step = 100 / (quotes.length - 1);
        const points = quotes.map((quote, index) => {
            const x = index * step;
            const y = 100 - ((quote - min) / span) * 100;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        });
        return { line: `M${points.join(' L')}`, area: `M0,100 L${points.join(' L')} L100,100 Z` };
    }, [quotes]);

    if (!path) return <div className='mt-chart__empty'>{localize('Waiting for ticks…')}</div>;

    return (
        <svg className='mt-chart__svg' viewBox='0 0 100 100' preserveAspectRatio='none' aria-hidden='true'>
            <defs>
                <linearGradient id='mt-fill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='rgba(20, 184, 166, 0.35)' />
                    <stop offset='100%' stopColor='rgba(20, 184, 166, 0)' />
                </linearGradient>
            </defs>
            <path d={path.area} fill='url(#mt-fill)' />
            <path d={path.line} fill='none' stroke='#14b8a6' strokeWidth='0.8' vectorEffect='non-scaling-stroke' />
        </svg>
    );
};

const Stepper = ({
    value,
    onChange,
    step,
    min,
    max,
    decimals = 2,
}: {
    value: number;
    onChange: (next: number) => void;
    step: number;
    min: number;
    max: number;
    decimals?: number;
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

/* --------------------------------------------------------------------- page */

const ManualTrader = observer(() => {
    const trader = useManualTrader();
    const [positions_open, setPositionsOpen] = useState(true);
    const live = useLiveTicks(trader.symbol, CHART_TICKS);

    const price = live.last_quote === null ? '--' : formatQuote(live.last_quote, live.decimals);
    const change = useMemo(() => {
        if (live.quotes.length < 2) return null;
        const first = live.quotes[0];
        const last = live.quotes[live.quotes.length - 1];
        if (!first) return null;
        return { absolute: last - first, percent: ((last - first) / first) * 100 };
    }, [live.quotes]);

    const open_positions = trader.positions.filter(position => !position.is_sold);
    const closed_positions = trader.positions.filter(position => position.is_sold);
    const recent_digits = live.digits.slice(-HISTORY_DIGITS);

    const renderBuy = (side: 'left' | 'right') => {
        const choice = side === 'left' ? trader.meta.left : trader.meta.right;
        const quote = trader.quotes[side];
        const busy = trader.busy_side === side;
        return (
            <button
                type='button'
                className={`mt-buy mt-buy--${side}`}
                disabled={busy || !!trader.busy_side || !trader.symbol}
                onClick={() => void trader.buy(side)}
            >
                <span className='mt-buy__label'>
                    {choice.label}
                    {trader.meta.needs_barrier ? ` ${trader.barrier}` : ''}
                </span>
                <span className='mt-buy__payout'>
                    {busy
                        ? localize('Buying…')
                        : quote
                          ? `${localize('Payout')} ${quote.payout.toFixed(2)} ${trader.currency}`
                          : trader.is_pricing
                            ? localize('Pricing…')
                            : localize('No price')}
                </span>
            </button>
        );
    };

    return (
        <div className='manual-trader'>
            {trader.error && <div className='manual-trader__error'>{trader.error}</div>}
            {!trader.is_logged_in && (
                <div className='manual-trader__notice'>
                    {localize('Log in with your Deriv account to trade. Prices below are live either way.')}
                </div>
            )}

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
                            {open_positions.length === 0 ? (
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
                                        <path d='M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7' stroke='currentColor' strokeWidth='1.6' />
                                    </svg>
                                    <p>{localize('You have no open positions.')}</p>
                                </div>
                            ) : (
                                <ul className='mt-positions'>
                                    {open_positions.map(position => (
                                        <li key={position.contract_id} className='mt-position'>
                                            <span className='mt-position__label'>{position.label}</span>
                                            <span className='mt-position__stake'>
                                                {position.stake.toFixed(2)} {position.currency}
                                            </span>
                                            <span
                                                className={`mt-position__profit mt-position__profit--${
                                                    position.profit >= 0 ? 'up' : 'down'
                                                }`}
                                            >
                                                {position.profit >= 0 ? '+' : ''}
                                                {position.profit.toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {closed_positions.length > 0 && (
                                <>
                                    <div className='mt-panel__subhead'>
                                        <span>{localize('Closed')}</span>
                                        <button type='button' className='mt-panel__clear' onClick={trader.clearClosed}>
                                            {localize('Clear')}
                                        </button>
                                    </div>
                                    <ul className='mt-positions'>
                                        {closed_positions.map(position => (
                                            <li key={position.contract_id} className='mt-position'>
                                                <span className='mt-position__label'>{position.label}</span>
                                                <span className='mt-position__stake'>
                                                    {position.stake.toFixed(2)} {position.currency}
                                                </span>
                                                <span
                                                    className={`mt-position__profit mt-position__profit--${
                                                        position.profit >= 0 ? 'up' : 'down'
                                                    }`}
                                                >
                                                    {position.profit >= 0 ? '+' : ''}
                                                    {position.profit.toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* chart */}
                <section className='mt-chart'>
                    <div className='mt-chart__head'>
                        <select
                            className='mt-chart__market'
                            value={trader.symbol ?? ''}
                            onChange={event => trader.setSymbol(event.target.value)}
                        >
                            {!trader.symbols.length && <option value=''>{localize('Loading markets…')}</option>}
                            {trader.symbols.map(item => (
                                <option key={item.symbol} value={item.symbol}>
                                    {item.display_name}
                                </option>
                            ))}
                        </select>
                        <div className='mt-chart__price'>
                            <span className={`mt-chart__quote mt-chart__quote--${live.last_direction ?? 'flat'}`}>
                                {price}
                            </span>
                            {change && (
                                <span
                                    className={`mt-chart__change mt-chart__change--${
                                        change.absolute >= 0 ? 'up' : 'down'
                                    }`}
                                >
                                    {change.absolute >= 0 ? '+' : ''}
                                    {change.absolute.toFixed(live.decimals)} ({change.percent.toFixed(2)}%)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className='mt-chart__plot'>
                        <Sparkline quotes={live.quotes} />
                    </div>

                    <div className='mt-chart__stats'>
                        <span className='mt-chart__stats-label'>{localize('Last digits')}</span>
                        <div className='mt-chart__digits'>
                            {recent_digits.map((digit, index) => (
                                <span
                                    key={`${index}-${digit}`}
                                    className={`mt-digit${
                                        index === recent_digits.length - 1 ? ' mt-digit--latest' : ''
                                    }`}
                                >
                                    {digit}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* trade panel */}
                <section className='mt-panel mt-panel--trade'>
                    <div className='mt-panel__body'>
                        <label className='mt-field'>
                            <span className='mt-field__label'>{localize('Trade type')}</span>
                            <select
                                className='mt-field__control'
                                value={trader.family}
                                onChange={event => trader.setFamily(event.target.value as TTradeFamily)}
                            >
                                {(Object.keys(FAMILIES) as TTradeFamily[]).map(key => (
                                    <option key={key} value={key}>
                                        {FAMILIES[key].label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {trader.meta.needs_barrier && (
                            <div className='mt-field'>
                                <span className='mt-field__label'>{localize('Digit')}</span>
                                <div className='mt-digits-picker'>
                                    {DIGITS.map(digit => (
                                        <button
                                            key={digit}
                                            type='button'
                                            className={`mt-digit-btn${
                                                digit === trader.barrier ? ' mt-digit-btn--active' : ''
                                            }`}
                                            onClick={() => trader.setBarrier(digit)}
                                            aria-pressed={digit === trader.barrier}
                                        >
                                            {digit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='mt-field'>
                            <span className='mt-field__label'>{localize('Ticks')}</span>
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
                                step={0.5}
                                min={trader.min_stake}
                                max={5000}
                            />
                        </div>

                        <div className='mt-summary'>
                            <div className='mt-summary__row'>
                                <span>{localize('Payout')}</span>
                                <strong>
                                    {trader.quotes.left
                                        ? `${trader.quotes.left.payout.toFixed(2)} ${trader.currency}`
                                        : '--'}
                                </strong>
                            </div>
                            <div className='mt-summary__row'>
                                <span>{localize('Cost')}</span>
                                <strong>
                                    {trader.quotes.left
                                        ? `${trader.quotes.left.ask_price.toFixed(2)} ${trader.currency}`
                                        : '--'}
                                </strong>
                            </div>
                        </div>

                        <div className='mt-buys'>
                            {renderBuy('left')}
                            {renderBuy('right')}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
});

export default ManualTrader;
