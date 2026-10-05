/**
 * Live tick chart in the style of Deriv Trader: a shaded area (or plain line) of the
 * latest ticks, the price grid on the right, times along the bottom, a black price
 * tag on the current spot and room ahead of the last tick.
 *
 * Tools down the left, as on Deriv Trader: chart type, drawing (tap the chart to
 * place horizontal price lines), indicators (a 10-tick moving average) and download
 * (saves the chart as a PNG). Zoom sits along the bottom.
 */
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

export type TTick = { epoch: number; quote: number };
export type TChartLine = { value: number; label: string; tone: 'barrier' | 'entry-up' | 'entry-down' };

type TProps = {
    ticks: TTick[];
    decimals: number;
    lines?: TChartLine[];
    /** File name for the PNG download, without extension. */
    title?: string;
};

const ZOOMS = [20, 40, 60, 100, 160, 250];
const AXIS_W = 68;
const AXIS_H = 26;
const RIGHT_ROOM = 0.18; // share of the plot kept free ahead of the last tick
const SMA_PERIOD = 10;

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

/** Render the chart's SVG to a PNG and hand it to the browser as a download. */
const downloadSvg = (svg: SVGSVGElement, name: string) => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const { width, height } = svg.getBoundingClientRect();
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // Inline the computed styles the stylesheet would otherwise supply.
    const source = svg.querySelectorAll('*');
    clone.querySelectorAll('*').forEach((node, i) => {
        const computed = getComputedStyle(source[i] as Element);
        (node as SVGElement).setAttribute(
            'style',
            ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-weight', 'font-family']
                .map(p => `${p}:${computed.getPropertyValue(p)}`)
                .join(';')
        );
    });
    const data = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.fillStyle = getComputedStyle(svg).getPropertyValue('--mt-card').trim() || '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const link = document.createElement('a');
        link.download = `${name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`;
};

const TickChart = ({ ticks, decimals, lines = [], title = 'chart' }: TProps) => {
    const box = useRef<HTMLDivElement>(null);
    const svg_ref = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState({ w: 800, h: 420 });
    const [zoom_index, setZoomIndex] = useState(2);
    const [mode, setMode] = useState<'area' | 'line'>('area');
    const [drawing, setDrawing] = useState(false);
    const [drawn, setDrawn] = useState<number[]>([]);
    const [show_sma, setShowSma] = useState(false);

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

    // Moving average over the whole history, so the line is defined from the first tick in view.
    const sma = useMemo(() => {
        if (!show_sma) return [];
        const all = ticks.slice(-(ZOOMS[zoom_index] + SMA_PERIOD));
        const out: (number | null)[] = [];
        let sum = 0;
        all.forEach((t, i) => {
            sum += t.quote;
            if (i >= SMA_PERIOD) sum -= all[i - SMA_PERIOD].quote;
            out.push(i >= SMA_PERIOD - 1 ? sum / SMA_PERIOD : null);
        });
        return out.slice(-view.length);
    }, [show_sma, ticks, zoom_index, view.length]);

    const plot_w = Math.max(10, size.w - AXIS_W);
    const plot_h = Math.max(10, size.h - AXIS_H);

    const geometry = useMemo(() => {
        if (view.length < 2) return null;
        const values = [...view.map(t => t.quote), ...lines.map(l => l.value), ...drawn];
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
        const valueAt = (py: number) => min + ((plot_h - py) / plot_h) * (max - min);

        const path = view.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(t.quote).toFixed(1)}`).join(' ');
        const last = view[view.length - 1];

        const step = niceStep(max - min, Math.max(3, Math.floor(plot_h / 80)));
        const grid: number[] = [];
        for (let v = Math.ceil(min / step) * step; v <= max; v += step) grid.push(v);

        // Time labels roughly every 110px, none too close to the left edge to fit.
        const every = Math.max(1, Math.round((view.length - 1) / Math.max(1, usable / 110)));
        const times = view.map((t, i) => ({ i, t })).filter(({ i }) => i % every === 0 && x(i) > 30);

        return { x, y, valueAt, path, last, grid, times, last_x: x(view.length - 1), last_y: y(last.quote) };
    }, [view, lines, drawn, decimals, plot_w, plot_h]);

    const sma_path = useMemo(() => {
        if (!geometry || !sma.length) return '';
        let started = false;
        return sma
            .map((v, i) => {
                if (v === null) return '';
                const cmd = started ? 'L' : 'M';
                started = true;
                return `${cmd}${geometry.x(i).toFixed(1)} ${geometry.y(v).toFixed(1)}`;
            })
            .join(' ');
    }, [geometry, sma]);

    const onChartClick = (event: MouseEvent<SVGSVGElement>) => {
        if (!drawing || !geometry || !svg_ref.current) return;
        const rect = svg_ref.current.getBoundingClientRect();
        const py = event.clientY - rect.top;
        if (py < 0 || py > plot_h) return;
        setDrawn(prev => [...prev.slice(-7), geometry.valueAt(py)]);
    };

    return (
        <div className={`tick-chart ${drawing ? 'is-drawing' : ''}`}>
            <div className='tick-chart__canvas' ref={box}>
                {!geometry ? (
                    <div className='tick-chart__empty'>
                        <span className='tick-chart__spinner' />
                        Loading chart…
                    </div>
                ) : (
                    <svg
                        ref={svg_ref}
                        width={size.w}
                        height={size.h}
                        role='img'
                        aria-label='Live price chart'
                        onClick={onChartClick}
                    >
                        <defs>
                            <linearGradient id='tick-chart-fill' x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0' className='tick-chart__fill-top' />
                                <stop offset='1' className='tick-chart__fill-bottom' />
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
                                <line className='tick-chart__grid' x1={geometry.x(i)} x2={geometry.x(i)} y1='0' y2={plot_h} />
                                <text className='tick-chart__axis' x={geometry.x(i)} y={plot_h + 18} textAnchor='middle'>
                                    {clock(t.epoch)}
                                </text>
                            </g>
                        ))}

                        {mode === 'area' && (
                            <path d={`${geometry.path} L${geometry.last_x} ${plot_h} L0 ${plot_h} Z`} fill='url(#tick-chart-fill)' />
                        )}
                        <path className='tick-chart__line' d={geometry.path} />

                        {sma_path && <path className='tick-chart__sma' d={sma_path} />}

                        {/* drawn price lines */}
                        {drawn.map((v, i) => (
                            <g key={`d${i}-${v}`} className='tick-chart__drawn'>
                                <line x1='0' x2={plot_w} y1={geometry.y(v)} y2={geometry.y(v)} />
                                <text x={plot_w - 6} y={geometry.y(v) - 5} textAnchor='end'>
                                    {v.toFixed(decimals)}
                                </text>
                            </g>
                        ))}

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
                        <line className='tick-chart__spot-line' x1={geometry.last_x} x2={plot_w} y1={geometry.last_y} y2={geometry.last_y} />
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
                    className='tick-chart__tool'
                    onClick={() => setMode(mode === 'area' ? 'line' : 'area')}
                    title={mode === 'area' ? 'Chart type: area (switch to line)' : 'Chart type: line (switch to area)'}
                    aria-label='Chart type'
                >
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                        <path d='M3 20h18M4 16l5-6 4 4 7-8' />
                        {mode === 'area' && <path d='M4 16l5-6 4 4 7-8v12H4z' fill='currentColor' fillOpacity='0.18' stroke='none' />}
                    </svg>
                    <span className='tick-chart__tool-badge'>1t</span>
                </button>
                <button
                    type='button'
                    className={`tick-chart__tool ${drawing ? 'is-active' : ''}`}
                    onClick={() => setDrawing(d => !d)}
                    title={drawing ? 'Drawing: tap the chart to add a price line' : 'Drawing tools'}
                    aria-label='Drawing tools'
                    aria-pressed={drawing}
                >
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                        <path d='m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1zM14.5 6.5l3 3' />
                    </svg>
                </button>
                <button
                    type='button'
                    className={`tick-chart__tool ${show_sma ? 'is-active' : ''}`}
                    onClick={() => setShowSma(v => !v)}
                    title={show_sma ? `Hide moving average (${SMA_PERIOD})` : `Indicators: moving average (${SMA_PERIOD})`}
                    aria-label='Indicators'
                    aria-pressed={show_sma}
                >
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                        <circle cx='12' cy='7' r='3' />
                        <path d='M5 20c.8-3.5 3.6-6 7-6s6.2 2.5 7 6M3 13l4-3 3 2' />
                    </svg>
                </button>
                <button
                    type='button'
                    className='tick-chart__tool'
                    onClick={() => svg_ref.current && downloadSvg(svg_ref.current, title)}
                    title='Download chart (PNG)'
                    aria-label='Download chart'
                >
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                        <path d='M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14' />
                    </svg>
                </button>
            </div>

            {drawing && (
                <div className='tick-chart__hint'>
                    Tap the chart to add a price line
                    {drawn.length > 0 && (
                        <button type='button' onClick={() => setDrawn([])}>
                            Clear {drawn.length}
                        </button>
                    )}
                </div>
            )}

            <div className='tick-chart__zoom'>
                <button type='button' onClick={() => setZoomIndex(i => Math.min(ZOOMS.length - 1, i + 1))} aria-label='Zoom out' title='Zoom out'>
                    −
                </button>
                <button type='button' onClick={() => setZoomIndex(2)} aria-label='Reset zoom' title='Reset zoom'>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <circle cx='12' cy='12' r='7' />
                        <circle cx='12' cy='12' r='2' fill='currentColor' />
                        <path d='M12 2v3M12 19v3M2 12h3M19 12h3' />
                    </svg>
                </button>
                <button type='button' onClick={() => setZoomIndex(i => Math.max(0, i - 1))} aria-label='Zoom in' title='Zoom in'>
                    +
                </button>
            </div>
        </div>
    );
};

export default TickChart;
