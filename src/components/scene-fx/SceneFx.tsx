import type { CSSProperties } from 'react';

import './scene-fx.scss';

/*
 * Animated "financial sky" laid behind a page's content: twinkling four-point stars,
 * candlesticks that rise and fade, drifting currency symbols and a gold price line
 * that keeps drawing itself with a glowing tick riding along it.
 *
 * All positions are fixed numbers (no Math.random) so the scene is identical on every
 * render. The parent page needs `position: relative; isolation: isolate` (set in
 * scene-fx.scss for the pages that use it) so this layer sits above the page's
 * background but below its content.
 */

type TVariant = 'light' | 'dark';

const TONES = ['gold', 'sky', 'purple', 'gold', 'white', 'sky', 'purple', 'red'] as const;

// [left %, top %, size rem, delay s]
const SPARKS: [number, number, number, number][] = [
    [6, 12, 1.6, 0], [14, 34, 0.9, 1.2], [22, 8, 1.2, 2.4], [31, 22, 0.8, 0.6], [38, 46, 1.4, 3.1],
    [46, 14, 1.0, 1.8], [53, 30, 0.7, 2.9], [61, 9, 1.5, 0.3], [68, 38, 0.9, 2.2], [75, 18, 1.2, 1.1],
    [83, 6, 0.8, 3.4], [90, 28, 1.6, 0.9], [96, 48, 0.9, 2.6], [4, 58, 1.1, 1.5], [12, 74, 0.8, 3.0],
    [27, 64, 1.3, 0.4], [42, 82, 0.9, 2.0], [57, 60, 1.1, 1.3], [66, 76, 0.7, 2.7], [79, 62, 1.4, 0.7],
    [88, 80, 0.9, 1.9], [94, 68, 1.2, 3.3], [19, 90, 1.0, 2.1], [49, 52, 0.8, 0.2], [72, 92, 1.0, 1.6],
    [34, 4, 0.9, 2.8], [58, 88, 1.3, 0.8], [86, 44, 0.8, 2.3],
];

// [left %, top %, delay s] - tiny pin-prick stars
const DUST: [number, number, number][] = Array.from({ length: 36 }, (_, i) => [
    (i * 37 + 11) % 100,
    (i * 53 + 7) % 100,
    (i % 7) * 0.5,
]);

// [left %, body height rem, duration s, delay s, up?]
const CANDLES: [number, number, number, number, boolean][] = [
    [8, 4.2, 22, 0, true], [19, 2.6, 26, 6, false], [33, 5.0, 24, 12, true], [47, 3.2, 28, 3, true],
    [62, 2.2, 23, 9, false], [74, 4.6, 27, 15, true], [86, 3.4, 25, 5, true], [95, 2.8, 29, 18, false],
];

const GLYPHS: [string, number, number, number][] = [
    ['$', 12, 30, 0], ['€', 28, 34, 8], ['₿', 44, 38, 16], ['£', 59, 32, 4],
    ['¥', 71, 36, 12], ['%', 83, 30, 20], ['↗', 92, 40, 2],
];

// A price path that climbs overall, drawn across the lower part of the screen.
const PRICE_PATH =
    'M0 210 L60 196 L110 204 L170 170 L220 182 L280 150 L330 160 L390 120 L440 136 L500 104 ' +
    'L560 112 L610 80 L660 94 L720 62 L770 70 L830 40 L880 52 L940 24 L1000 30';

const SceneFx = ({ variant = 'light' }: { variant?: TVariant }) => (
    <div className={`scene-fx scene-fx--${variant}`} aria-hidden='true'>
        {DUST.map(([x, y, delay], i) => (
            <i
                key={`d${i}`}
                className='scene-fx__dust'
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` } as CSSProperties}
            />
        ))}

        {SPARKS.map(([x, y, size, delay], i) => (
            <i
                key={`s${i}`}
                className={`scene-fx__spark scene-fx__spark--${TONES[i % TONES.length]}`}
                style={
                    {
                        left: `${x}%`,
                        top: `${y}%`,
                        '--size': `${size}rem`,
                        animationDelay: `${delay}s`,
                    } as CSSProperties
                }
            />
        ))}

        {CANDLES.map(([x, h, dur, delay, up], i) => (
            <span
                key={`c${i}`}
                className={`scene-fx__candle scene-fx__candle--${up ? 'up' : 'down'}`}
                style={
                    {
                        left: `${x}%`,
                        '--h': `${h}rem`,
                        animationDuration: `${dur}s`,
                        animationDelay: `-${delay}s`,
                    } as CSSProperties
                }
            />
        ))}

        {GLYPHS.map(([glyph, x, dur, delay]) => (
            <span
                key={glyph}
                className='scene-fx__glyph'
                style={{ left: `${x}%`, animationDuration: `${dur}s`, animationDelay: `-${delay}s` } as CSSProperties}
            >
                {glyph}
            </span>
        ))}

        <svg className='scene-fx__chart' viewBox='0 0 1000 240' preserveAspectRatio='none'>
            <defs>
                <linearGradient id={`fx-line-${variant}`} x1='0' x2='1'>
                    <stop offset='0' stopColor='#38bdf8' stopOpacity='0' />
                    <stop offset='0.35' stopColor='#38bdf8' />
                    <stop offset='0.7' stopColor='#7c3aed' />
                    <stop offset='1' stopColor='#f0c040' />
                </linearGradient>
                <linearGradient id={`fx-area-${variant}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0' stopColor='#7c3aed' stopOpacity='0.16' />
                    <stop offset='1' stopColor='#7c3aed' stopOpacity='0' />
                </linearGradient>
            </defs>
            <path className='scene-fx__area' d={`${PRICE_PATH} L1000 240 L0 240 Z`} fill={`url(#fx-area-${variant})`} />
            <path
                className='scene-fx__line'
                d={PRICE_PATH}
                fill='none'
                stroke={`url(#fx-line-${variant})`}
                strokeWidth='2.5'
                vectorEffect='non-scaling-stroke'
                pathLength={1}
            />
            <circle r='5' className='scene-fx__tick'>
                <animateMotion dur='12s' repeatCount='indefinite' path={PRICE_PATH} />
            </circle>
        </svg>
    </div>
);

export default SceneFx;
