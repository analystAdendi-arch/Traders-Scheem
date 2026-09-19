import { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { useApiBase } from '@/hooks/useApiBase';
import useLiveTicks from '@/hooks/useLiveTicks';
import {
    buildStrategyUniverse,
    evaluateStrategy,
    formatQuote,
    getContractTypes,
    getScannableSymbols,
    TAnalysisSymbol,
    TStrategyEvaluation,
    TStrategyFamily,
} from '@/utils/analysis';

import './scanner.scss';

const ANALYSIS_TICKS = 1000;
const MIN_TICKS_TO_ANALYSE = 100;
const LOG_LIMIT = 600;
const HISTORY_SEED = 150;
const LINE_DELAY_MS = 450;

const STRATEGIES: { value: TStrategyFamily; label: string }[] = [
    { value: 'matchesdiffers', label: localize('Matches & Differs') },
    { value: 'evenodd', label: localize('Even & Odd') },
    { value: 'overunder', label: localize('Over & Under') },
    { value: 'callput', label: localize('Rise & Fall') },
];

const SIDE_LABEL: Record<string, string> = {
    DIGITMATCH: 'MATCH',
    DIGITDIFF: 'DIFFERS',
    DIGITEVEN: 'EVEN',
    DIGITODD: 'ODD',
    DIGITOVER: 'OVER',
    DIGITUNDER: 'UNDER',
    CALL: 'RISE',
    PUT: 'FALL',
};

type TLogLevel = 'INFO' | 'OK' | 'DATA' | 'HISTORY' | 'TICK' | 'ANALYSIS' | 'WARNING' | 'ERROR';
type TLogEntry = { id: number; level: TLogLevel; text: string };

type TLineTone = 'title' | 'plain' | 'success' | 'warn' | 'error';
type TDashboardLine = { id: number; text: string; tone: TLineTone };
type TDashboard = { open: boolean; title: string; lines: TDashboardLine[]; is_running: boolean };

const CLOSED_DASHBOARD: TDashboard = { open: false, title: '', lines: [], is_running: false };

const SOUND_KEY = 'scanner-sound-on';
const SCRAMBLE_MS = 1800;
const SCRAMBLE_FRAME_MS = 70;
const SCRAMBLE_LINES = 16;
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const scrambleLines = () =>
    Array.from({ length: SCRAMBLE_LINES }, () =>
        Array.from({ length: 30 }, () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]).join('')
    );

/**
 * "Ti-ti-ti" scanning beeps via Web Audio: three short high blips, repeated
 * until stopped. Started from the Analyse click, so browsers allow the audio.
 */
const createScanBeeper = () => {
    let ctx: AudioContext | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const blip = (at: number) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2400, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.05, at + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.05);
    };

    const burst = () => {
        if (!ctx) return;
        const now = ctx.currentTime;
        blip(now);
        blip(now + 0.075);
        blip(now + 0.15);
    };

    return {
        start() {
            try {
                const AudioCtor =
                    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!AudioCtor) return;
                ctx = ctx ?? new AudioCtor();
                void ctx.resume();
                if (timer) clearInterval(timer);
                burst();
                timer = setInterval(burst, 480);
            } catch {
                /* audio unavailable: scan silently */
            }
        },
        stop() {
            if (timer) clearInterval(timer);
            timer = null;
        },
        dispose() {
            this.stop();
            void ctx?.close().catch(() => undefined);
            ctx = null;
        },
    };
};

/** Best evaluation per contract side (MATCH vs DIFFERS, OVER vs UNDER, ...), in universe order. */
const bestPerSide = (evaluations: TStrategyEvaluation[]): TStrategyEvaluation[] => {
    const by_side = new Map<string, TStrategyEvaluation>();
    evaluations.forEach(evaluation => {
        const key = evaluation.definition.contract_type;
        const current = by_side.get(key);
        if (!current || evaluation.score > current.score) by_side.set(key, evaluation);
    });
    return Array.from(by_side.values());
};

const describeSide = (evaluation: TStrategyEvaluation) => {
    const side = SIDE_LABEL[evaluation.definition.contract_type] ?? evaluation.definition.label;
    const accuracy = `${evaluation.win_rate.toFixed(2)}% accuracy`;
    return evaluation.definition.barrier === null
        ? `${side} (${accuracy})`
        : `${side} with ${evaluation.definition.barrier} (${accuracy})`;
};

const Scanner = observer(() => {
    const { connectionStatus } = useApiBase();

    const [symbols, setSymbols] = useState<TAnalysisSymbol[]>([]);
    const [symbol, setSymbol] = useState<string | null>(null);
    const [family, setFamily] = useState<TStrategyFamily>('matchesdiffers');
    const [log, setLog] = useState<TLogEntry[]>([]);
    const [dashboard, setDashboard] = useState<TDashboard>(CLOSED_DASHBOARD);
    const [scramble, setScramble] = useState<string[] | null>(null);
    const [sound_on, setSoundOn] = useState<boolean>(() => {
        try {
            return localStorage.getItem(SOUND_KEY) !== '0';
        } catch {
            return true;
        }
    });
    const beeper_ref = useRef<ReturnType<typeof createScanBeeper> | null>(null);
    const sound_on_ref = useRef(sound_on);
    sound_on_ref.current = sound_on;

    const live = useLiveTicks(symbol, ANALYSIS_TICKS);

    const live_ref = useRef(live);
    live_ref.current = live;
    const id_ref = useRef(0);
    const run_id_ref = useRef(0);
    const mounted_ref = useRef(true);
    const seeded_symbol_ref = useRef<string | null>(null);

    const active_symbol = symbols.find(item => item.symbol === symbol) ?? null;
    const strategy_label = STRATEGIES.find(item => item.value === family)?.label ?? '';

    const appendLog = useCallback((entries: { level: TLogLevel; text: string }[]) => {
        if (!entries.length) return;
        setLog(prev => {
            const next = entries.map(entry => ({ ...entry, id: ++id_ref.current }));
            return [...next.reverse(), ...prev].slice(0, LOG_LIMIT);
        });
    }, []);

    useEffect(() => {
        mounted_ref.current = true;
        beeper_ref.current = createScanBeeper();
        return () => {
            mounted_ref.current = false;
            run_id_ref.current += 1;
            beeper_ref.current?.dispose();
            beeper_ref.current = null;
        };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SOUND_KEY, sound_on ? '1' : '0');
        } catch {
            /* nothing to do */
        }
        if (!sound_on) beeper_ref.current?.stop();
    }, [sound_on]);

    /* markets Deriv offers digit contracts on */
    useEffect(() => {
        let cancelled = false;
        appendLog([{ level: 'INFO', text: 'Loading markets from Deriv...' }]);
        getScannableSymbols()
            .then(list => {
                if (cancelled) return;
                setSymbols(list);
                setSymbol(current => current ?? (list.find(item => item.symbol === 'R_100') ?? list[0])?.symbol ?? null);
                appendLog([{ level: 'OK', text: `${list.length} markets available` }]);
            })
            .catch(error => {
                if (cancelled) return;
                appendLog([{ level: 'ERROR', text: error instanceof Error ? error.message : 'Could not load markets' }]);
            });
        return () => {
            cancelled = true;
        };
    }, [appendLog]);

    useEffect(() => {
        if (connectionStatus) appendLog([{ level: 'INFO', text: `Deriv connection ${String(connectionStatus)}` }]);
    }, [appendLog, connectionStatus]);

    useEffect(() => {
        if (active_symbol) {
            appendLog([{ level: 'INFO', text: `Subscribing to ${active_symbol.display_name}...` }]);
        }
    }, [active_symbol, appendLog]);

    /* seed the feed with the history window once it arrives */
    useEffect(() => {
        if (!symbol || live.is_loading || !live.quotes.length || seeded_symbol_ref.current === symbol) return;
        seeded_symbol_ref.current = symbol;
        const start = Math.max(0, live.quotes.length - HISTORY_SEED);
        const history = live.quotes.slice(start).map((quote, index) => ({
            level: 'HISTORY' as const,
            text: `${symbol} ${formatQuote(quote, live.decimals)} digit ${live.digits[start + index]}`,
        }));
        appendLog([{ level: 'DATA', text: `${live.quotes.length} ticks received for ${symbol}` }, ...history]);
    }, [appendLog, live.decimals, live.digits, live.is_loading, live.quotes, symbol]);

    /* one line per live tick */
    useEffect(() => {
        if (!live.is_streaming || live.last_quote === null || !symbol) return;
        appendLog([
            {
                level: 'TICK',
                text: `${symbol} ${formatQuote(live.last_quote, live.decimals)} digit ${live.last_digit}`,
            },
        ]);
        // updated_at changes exactly once per tick
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live.updated_at]);

    useEffect(() => {
        if (live.error) appendLog([{ level: 'ERROR', text: live.error }]);
    }, [appendLog, live.error]);

    const stopScanEffects = useCallback(() => {
        beeper_ref.current?.stop();
        setScramble(null);
    }, []);

    const closeDashboard = useCallback(() => {
        run_id_ref.current += 1;
        stopScanEffects();
        setDashboard(CLOSED_DASHBOARD);
    }, [stopScanEffects]);

    const runAnalysis = useCallback(
        async () => {
            if (!symbol) return;
            const run_id = ++run_id_ref.current;
            const alive = () => mounted_ref.current && run_id_ref.current === run_id;
            let line_id = 0;
            const push = (text: string, tone: TLineTone = 'plain') =>
                setDashboard(prev => ({ ...prev, lines: [...prev.lines, { id: ++line_id, text, tone }] }));

            setDashboard({
                open: true,
                title: `Analysis Dashboard - ${strategy_label} on ${symbol}`,
                lines: [],
                is_running: true,
            });
            setScramble(null);
            if (sound_on_ref.current) beeper_ref.current?.start();
            appendLog([{ level: 'ANALYSIS', text: `${strategy_label} on ${symbol} started` }]);

            // Stage 1 - every line reports a real step.
            push(`Analysing ${strategy_label} on ${symbol}...`);
            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            push('Retrieving market data...');

            const { digits, quotes } = live_ref.current;
            let available: Set<string> | null = null;
            try {
                available = await getContractTypes(symbol);
            } catch {
                available = null;
            }
            if (!alive()) return;

            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            push(`Data stream detected: ${digits.length} ticks from Deriv...`);

            const definitions = buildStrategyUniverse(available).filter(item => item.family === family);
            if (!definitions.length) {
                stopScanEffects();
                push(`Error: ${strategy_label} is not offered on ${symbol}.`, 'error');
                setDashboard(prev => ({ ...prev, is_running: false }));
                return;
            }

            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            push(`Evaluating ${definitions.length} contract setups...`);

            const evaluations = definitions.map(definition => evaluateStrategy({ digits, quotes }, definition));
            const sides = bestPerSide(evaluations);
            const best = evaluations.reduce((a, b) => (b.score > a.score ? b : a));

            // Stage 2 - the scrambled "decoding" burst.
            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            const scramble_until = Date.now() + SCRAMBLE_MS;
            while (Date.now() < scramble_until) {
                if (!alive()) return;
                setScramble(scrambleLines());
                await sleep(SCRAMBLE_FRAME_MS);
            }
            if (!alive()) return;
            setScramble(null);

            // Stage 3 - results on a clean screen.
            setDashboard(prev => ({ ...prev, lines: [] }));
            beeper_ref.current?.stop();
            push('Analysis Complete!');

            for (const side of sides) {
                await sleep(LINE_DELAY_MS);
                if (!alive()) return;
                push(describeSide(side));
            }

            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            const edge = best.edge > 0 ? `+${best.edge}` : `${best.edge}`;
            push(
                `Best signal: ${SIDE_LABEL[best.definition.contract_type] ?? best.definition.label}${
                    best.definition.barrier === null ? '' : ` ${best.definition.barrier}`
                } - ${best.win_rate.toFixed(2)}% over ${best.trials} ticks`,
                'success'
            );

            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            push(`Edge vs fair value: ${edge} pts (fair ${best.baseline}%, confidence ${best.confidence}%)`,
                best.edge > 0 ? 'success' : 'warn');

            if (best.trigger) {
                await sleep(LINE_DELAY_MS);
                if (!alive()) return;
                push(
                    `Entry: after digit ${best.trigger.previous_digit} - ${best.trigger.win_rate}% of ${best.trigger.trials} ticks`
                );
            }

            if (best.edge <= 0) {
                await sleep(LINE_DELAY_MS);
                if (!alive()) return;
                push('No strategy here beat its fair value on this data.', 'warn');
            }

            await sleep(LINE_DELAY_MS);
            if (!alive()) return;
            push('Data transmission complete...', 'success');
            setDashboard(prev => ({ ...prev, is_running: false }));
            appendLog([
                {
                    level: 'ANALYSIS',
                    text: `${symbol} best ${best.definition.label} ${best.win_rate}% (fair ${best.baseline}%)`,
                },
            ]);
        },
        [appendLog, family, stopScanEffects, strategy_label, symbol]
    );

    const quote_text = live.last_quote === null ? '' : formatQuote(live.last_quote, live.decimals);
    const can_analyse = !!symbol && !live.is_loading && live.digits.length >= MIN_TICKS_TO_ANALYSE;
    const status_line = log[0] ? `[${log[0].level}] ${log[0].text}...` : 'Waiting for Deriv...';

    return (
        <div className='signal-scanner'>
            <div className='signal-scanner__matrix' aria-hidden='true'>
                {/* Two copies scroll upward in a loop; faster while a scan runs. */}
                <div
                    className={`signal-scanner__matrix-track${
                        dashboard.is_running ? ' signal-scanner__matrix-track--fast' : ''
                    }`}
                >
                    {[0, 1].map(copy => (
                        <div key={copy} className='signal-scanner__matrix-block'>
                            {log.map(entry => (
                                <span
                                    key={entry.id}
                                    className={`signal-scanner__log signal-scanner__log--${entry.level.toLowerCase()}`}
                                >
                                    [{entry.level}] {entry.text}...{' '}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className='signal-scanner__stage'>
                <section className='signal-scanner__panel'>
                    <h2 className='signal-scanner__title'>{localize('Signal Analyzer')}</h2>

                    <div className='signal-scanner__selects'>
                        <label className='signal-scanner__field'>
                            <span>{localize('Select Strategy')}</span>
                            <select
                                value={family}
                                onChange={event => setFamily(event.target.value as TStrategyFamily)}
                                disabled={dashboard.is_running}
                            >
                                {STRATEGIES.map(item => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className='signal-scanner__field'>
                            <span>{localize('Select Market')}</span>
                            <select
                                value={symbol ?? ''}
                                onChange={event => setSymbol(event.target.value)}
                                disabled={dashboard.is_running || !symbols.length}
                            >
                                {!symbols.length && <option value=''>{localize('Loading markets...')}</option>}
                                {symbols.map(item => (
                                    <option key={item.symbol} value={item.symbol}>
                                        {item.display_name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className='signal-scanner__tick'>
                        {quote_text ? (
                            <>
                                {localize('Latest Tick:')} {quote_text.slice(0, -1)}
                                <span className='signal-scanner__tick-digit'>{quote_text.slice(-1)}</span>
                            </>
                        ) : live.error ? (
                            <span className='signal-scanner__tick-error'>{live.error}</span>
                        ) : (
                            localize('Connecting to Deriv...')
                        )}
                    </div>

                    <button
                        type='button'
                        className='signal-scanner__analyse'
                        onClick={() => runAnalysis()}
                        disabled={!can_analyse || dashboard.is_running}
                    >
                        {localize('Analyse')}
                    </button>

                    <button
                        type='button'
                        className='signal-scanner__sound'
                        onClick={() => setSoundOn(on => !on)}
                        aria-pressed={sound_on}
                        title={sound_on ? localize('Mute scan sound') : localize('Turn scan sound on')}
                    >
                        {sound_on ? '🔊' : '🔇'} {sound_on ? localize('Sound on') : localize('Sound off')}
                    </button>
                </section>
            </div>

            {dashboard.open && (
                <div className='signal-scanner__overlay'>
                    <div className='signal-scanner__dashboard' role='dialog' aria-modal='true'>
                        <div className='signal-scanner__dashboard-head'>
                            <span className='signal-scanner__dots' aria-hidden='true'>
                                <i />
                                <i />
                                <i />
                            </span>
                            <button
                                type='button'
                                className='signal-scanner__close'
                                onClick={closeDashboard}
                                aria-label={dashboard.is_running ? localize('Cancel') : localize('Close')}
                            >
                                X
                            </button>
                        </div>
                        <p className='signal-scanner__line signal-scanner__line--title signal-scanner__dash-title'>
                            {dashboard.title}
                        </p>
                        <div className='signal-scanner__lines'>
                            {scramble
                                ? scramble.map((row, index) => (
                                      <p key={index} className='signal-scanner__line signal-scanner__line--scramble'>
                                          {row}
                                      </p>
                                  ))
                                : dashboard.lines.map(line => (
                                      <p
                                          key={line.id}
                                          className={`signal-scanner__line signal-scanner__line--${line.tone}`}
                                      >
                                          {line.text}
                                      </p>
                                  ))}
                        </div>
                        {!dashboard.is_running && <div className='signal-scanner__status'>{status_line}</div>}
                    </div>
                </div>
            )}
        </div>
    );
});

export default Scanner;
