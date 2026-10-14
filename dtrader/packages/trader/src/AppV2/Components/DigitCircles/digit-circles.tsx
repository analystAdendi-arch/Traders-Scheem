/**
 * [VolaTrades] Last-digit circles along the foot of the chart for the digit
 * trade types (Even/Odd, Matches/Differs, Over/Under): one ring per digit
 * with its share of the last 1000 ticks - the most frequent ringed green, the
 * least red - and an arrow that slides under the digit of the latest tick.
 *
 * Fed by the trader's own data: digit_stats (counts out of 1000, from the
 * chart) and tick_data (the latest tick).
 */
import React from 'react';
import { observer } from 'mobx-react-lite';

import { useTraderStore } from 'Stores/useTraderStores';

import './digit-circles.scss';

const DIGITS = [...Array(10).keys()];
const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** The lower part of the ring that carries the highlight. */
const ARC = CIRCUMFERENCE * 0.42;

const getLastDigit = (quote?: number | null, pip_size?: number | string | null): number | null => {
    if (quote === undefined || quote === null || isNaN(Number(quote))) return null;
    const decimals = Number(pip_size);
    const text = Number(quote).toFixed(Number.isFinite(decimals) && decimals >= 0 ? decimals : 2);
    const digit = Number(text.charAt(text.length - 1));
    return Number.isNaN(digit) ? null : digit;
};

const DigitCircles = observer(() => {
    const { digit_stats = [], tick_data } = useTraderStore();

    const last_digit = getLastDigit(tick_data?.quote, tick_data?.pip_size);
    const has_stats = digit_stats.length === 10 && digit_stats.some(count => count > 0);

    if (!has_stats) return null;

    const total = digit_stats.reduce((sum, count) => sum + count, 0) || 1;
    const max = Math.max(...digit_stats);
    const min = Math.min(...digit_stats);

    return (
        <div className='digit-circles' aria-label='Last digit statistics'>
            <div className='digit-circles__row'>
                {DIGITS.map(digit => {
                    const count = digit_stats[digit] ?? 0;
                    const tone = count === max ? 'up' : count === min ? 'down' : null;
                    const percentage = (count * 100) / total;

                    return (
                        <div
                            key={digit}
                            className={`digit-circles__item${digit === last_digit ? ' digit-circles__item--last' : ''}`}
                        >
                            <svg viewBox='0 0 44 44' className='digit-circles__ring' aria-hidden='true'>
                                <circle cx='22' cy='22' r={RADIUS} className='digit-circles__track' />
                                {tone && (
                                    <circle
                                        cx='22'
                                        cy='22'
                                        r={RADIUS}
                                        className={`digit-circles__arc digit-circles__arc--${tone}`}
                                        strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
                                        transform='rotate(30 22 22)'
                                    />
                                )}
                            </svg>
                            <span className='digit-circles__value'>
                                <b>{digit}</b>
                                <small>{percentage.toFixed(1)}%</small>
                            </span>
                        </div>
                    );
                })}
                {last_digit !== null && (
                    <span
                        className='digit-circles__pointer'
                        style={{ '--digit-index': last_digit } as React.CSSProperties}
                        aria-hidden='true'
                    />
                )}
            </div>
        </div>
    );
});

export default DigitCircles;
