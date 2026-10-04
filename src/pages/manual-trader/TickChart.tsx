/**
 * Live tick chart in the style of Deriv Trader: a shaded area (or plain line) of the
 * latest ticks, the price grid on the right, times along the bottom, a black price
 * tag on the current spot and room ahead of the last tick. Zoom changes how many
 * ticks are in view; dashed lines mark barriers and open contracts' entry spots.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

export type TTick = { epoch: number; quote: number };
export type TChartLine = { value: number; label: string; tone: 'barrier' | 'entry-up' | 'entry-down' };

type TProps = {
    ticks: TTick[];
    decimals: number;
    lines?: TChartLine[];
};

const ZOOMS = [20, 40, 60, 100, 160, 250];
const AXIS_W = 68;
const AXIS_H = 26;
const RIGHT_ROOM = 0.18; // share of the plot kept free ahead of the last tick

const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (epoch: number) => {
    const d = new Date(epoch * 1000);
    return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
};

/** A "nice" grid step for a price range, so labels land on round numbers. */
const niceStep = (range: number, target: number) => {
    const raw = range / Math.max(1, target);
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / power;
    const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return nice * power;
};

const TickChart = ({ ticks, decimals, lines = [] }: TProps) => {
    const box = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 800, h: 420 });
    const [zoom_index, setZoomIndex] = useState(2);
    const [mode, setMode] = useState<'area' | 'line'>('area');

    useEffect(() => {
        const node = box.current;
        if (!node) return undefined;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width && height) setSize({ w: width, h: height });
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const view = useMemo(() => ticks.slice(-ZOOMS[zoom_index]), [ticks, zoom_index]);

    const plot_w = Math.max(10, size.w - AXIS_W);
    const plot_h = Math.max(10, size.h - AXIS_H);

    const geometry = useMemo(() => {
        if (view.length < 2) return null;
        const values = [...view.map(t => t.quote), ...lines.map(l => l.value)];
        let min = Math.min(...values);
        let max = Math.max(...values);
        if (max === min) {
            max += Math.pow(10, -decimals) * 5;
            min -= Math.pow(10, -decimals) * 5;
        }
        const margin = (max - min) * 0.12;
        min -= margin;
        max += margin;

        const usable = plot_w * (1 - RIGHT_ROOM);
        const x = (i: number) => (i / (view.length - 1)) * usable;
        const y = (v: number) => plot_h - ((v - min) / (max - min)) * plot_h;

        const path = view.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(t.quote).toFixed(1)}`).join(' ');
        const last = view[view.length - 1];

        const step = niceStep(max - min, Math.max(3, Math.floor(plot_h / 80)));
        const grid: number[] = [];
        for (let v = Math.ceil(min / step) * step; v <= max; v += step) grid.push(v);

        // Time labels roughly every 110px.
        const every = Math.max(1, Math.round((view.length - 1) / Math.max(1, usable / 110)));
        // Skip any label too close to the left edge to fit.
        const times = view.map((t, i) => ({ i, t })).filter(({ i }) => i % every === 0 && x(i) > 30);

        return { x, y, path, last, grid, times, last_x: x(view.length - 1), last_y: y(last.quote) };
    }, [view, lines, decimals, plot_w, plot_h]);

    return (
        <div className='tick-chart'>
            <div className='tick-chart__canvas' ref={box}>
                {!geometry ? (
                    <div className='tick-chart__empty'>
                        <span className='tick-chart__spinner' />
                        Loading chart…
                    </div>
                ) : (
                    <svg width={size.w} height={size.h} role='img' aria-label='Live price chart'>
                        <defs>
                            <linearGradient id='tick-chart-fill' x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0' stopColor='#0f172a' stopOpacity='0.14' />
                                <stop offset='1' stopColor='#0f172a' stopOpacity='0' />
                            </linearGradient>
                        </defs>

                        {/* price grid */}
                        {geometry.grid.map(v => (
                            <g key={`g${v}`}>
                                <line className='tick-chart__grid' x1='0' x2={plot_w} y1={geometry.y(v)} y2={geometry.y(v)} />
                                <text className='tick-chart__axis' x={plot_w + 8} y={geometry.y(v) + 4}>
                                    {v.toFixed(decimals)}
                                </text>
                            </g>
                        ))}

                        {/* time grid */}
                        {geometry.times.map(({ i, t }) => (
                            <g key={`t${t.epoch}`}>
                                <line
                                    className='tick-chart__grid'
                                    x1={geometry.x(i)}
                                    x2={geometry.x(i)}
                                    y1='0'
                                    y2={plot_h}
                                />
                                <text
                                    className='tick-chart__axis'
                                    x={geometry.x(i)}
                                    y={plot_h + 18}
                                    textAnchor='middle'
                                >
                                    {clock(t.epoch)}
                                </text>
                            </g>
                        ))}

                        {mode === 'area' && (
                            <path
                                d={`${geometry.path} L${geometry.last_x} ${plot_h} L0 ${plot_h} Z`}
                                fill='url(#tick-chart-fill)'
                            />
                        )}
                        <path className='tick-chart__line' d={geometry.path} />

                        {/* barriers and entry spots */}
                        {lines.map(line => (
                            <g key={`${line.tone}-${line.label}-${line.value}`} className={`tick-chart__mark tick-chart__mark--${line.tone}`}>
                                <line x1='0' x2={plot_w} y1={geometry.y(line.value)} y2={geometry.y(line.value)} />
                                <text x='8' y={geometry.y(line.value) - 6}>
                                    {line.label} {line.value.toFixed(decimals)}
                                </text>
                            </g>
                        ))}

                        {/* current spot */}
                        <line
                            className='tick-chart__spot-line'
                            x1={geometry.last_x}
                            x2={plot_w}
                            y1={geometry.last_y}
                            y2={geometry.last_y}
                        />
                        <circle className='tick-chart__pulse' cx={geometry.last_x} cy={geometry.last_y} r='9' />
                        <circle className='tick-chart__dot' cx={geometry.last_x} cy={geometry.last_y} r='4' />
                        <g transform={`translate(${plot_w} ${geometry.last_y - 12})`}>
                            <rect className='tick-chart__tag' width={AXIS_W - 4} height='24' rx='4' />
                            <text className='tick-chart__tag-text' x={(AXIS_W - 4) / 2} y='16' textAnchor='middle'>
                                {geometry.last.quote.toFixed(decimals)}
                            </text>
                        </g>
                    </svg>
                )}
            </div>

            <div className='tick-chart__tools'>
                <button
                    type='button'
                    className={`tick-chart__tool ${mode === 'area' ? 'is-active' : ''}`}
                    onClick={() => setMode(mode === 'area' ? 'line' : 'area')}
                    title={mode === 'area' ? 'Switch to line chart' : 'Switch to area chart'}
                    aria-label='Chart type'
                >
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                        <path d='M3 20h18M4 16l5-6 4 4 7-8' />
                        {mode === 'area' && <path d='M4 16l5-6 4 4 7-8v12H4z' fill='currentColor' fillOpacity='0.18' stroke='none' />}
                    </svg>
                    <span className='tick-chart__tool-badge'>1t</span>
                </button>
            </div>

            <div className='tick-chart__zoom'>
                <button
                    type='button'
                    onClick={() => setZoomIndex(i => Math.min(ZOOMS.length - 1, i + 1))}
                    aria-label='Zoom out'
                    title='Zoom out'
                >
                    −
                </button>
                <button type='button' onClick={() => setZoomIndex(2)} aria-label='Reset zoom' title='Reset zoom'>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <circle cx='12' cy='12' r='7' />
                        <circle cx='12' cy='12' r='2' fill='currentColor' />
                        <path d='M12 2v3M12 19v3M2 12h3M19 12h3' />
                    </svg>
                </button>
                <button
                    type='button'
                    onClick={() => setZoomIndex(i => Math.max(0, i - 1))}
                    aria-label='Zoom in'
                    title='Zoom in'
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default TickChart;
