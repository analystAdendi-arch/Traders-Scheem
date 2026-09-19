import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LegacyClose1pxIcon } from '@deriv/quill-icons/Legacy';
import { localize } from '@deriv-com/translations';

import { useStore } from '@/hooks/useStore';
import {
    loadStrategyIntoBot,
    pickBest,
    scanMarkets,
    TScanProgress,
    TScanResult,
    TScanRow,
    TStoreLike,
    TStrategyFamily,
} from '@/utils/analysis';

import ScannerParametersModal, { TScannerParams } from './ScannerParametersModal';
import './entry-scanner.scss';

const DEFAULT_TICKS = 500;
const MIN_TICKS = 100;
const MAX_TICKS = 5000;
const LEADERBOARD_SIZE = 5;
const PREFS_KEY = 'ai-scanner-prefs';

type TFamilyFilter = 'all' | TStrategyFamily;

const FAMILY_OPTIONS: { value: TFamilyFilter; label: string }[] = [
    { value: 'all', label: localize('Every contract Deriv offers') },
    { value: 'overunder', label: localize('Over / Under only') },
    { value: 'matchesdiffers', label: localize('Matches / Differs only') },
    { value: 'evenodd', label: localize('Even / Odd only') },
    { value: 'callput', label: localize('Rise / Fall only') },
];

type TProps = {
    isOpen: boolean;
    onClose: () => void;
};

/** Entry digit for a result: its data-derived trigger, else the latest digit. */
const entryDigitOf = (row: TScanRow): string => {
    const trigger = row.best?.trigger?.previous_digit;
    if (trigger !== undefined && trigger !== null) return String(trigger);
    return row.last_digit === null ? '--' : String(row.last_digit);
};

/**
 * AI Scanner.
 *
 * Nothing about the answer is written in advance: the market list comes from
 * `active_symbols`, the playable contracts from `contracts_for`, and the
 * ranking from measured win rates on real `ticks_history` data.
 */
const EntryScannerModal: React.FC<TProps> = ({ isOpen, onClose }) => {
    const store = useStore();
    const [ticks_input, setTicksInput] = useState(String(DEFAULT_TICKS));
    const [family, setFamily] = useState<TFamilyFilter>('all');
    const [show_options, setShowOptions] = useState(false);
    const [is_scanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState<TScanProgress | null>(null);
    const [result, setResult] = useState<TScanResult | null>(null);
    const [selected_symbol, setSelectedSymbol] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [show_params, setShowParams] = useState(false);
    const [is_loading_bot, setIsLoadingBot] = useState(false);

    const cancellation_ref = useRef<{ cancelled: boolean }>({ cancelled: false });
    const is_mounted_ref = useRef(true);

    useEffect(() => {
        is_mounted_ref.current = true;
        return () => {
            is_mounted_ref.current = false;
            cancellation_ref.current.cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        try {
            const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null');
            if (saved?.ticks) setTicksInput(String(saved.ticks));
            if (saved?.family) setFamily(saved.family);
        } catch {
            /* no stored preferences */
        }
    }, [isOpen]);

    const best = useMemo(() => (result ? pickBest(result) : null), [result]);

    const selected: TScanRow | null = useMemo(() => {
        if (!result) return null;
        if (selected_symbol) return result.rows.find(row => row.symbol === selected_symbol) ?? best;
        return best;
    }, [result, selected_symbol, best]);

    const leaderboard = useMemo(
        () => (result?.rows ?? []).filter(row => row.best && row.best.edge > 0).slice(0, LEADERBOARD_SIZE),
        [result]
    );

    const runScan = useCallback(async () => {
        const ticks = Math.max(MIN_TICKS, Math.min(MAX_TICKS, parseInt(ticks_input, 10) || DEFAULT_TICKS));
        setTicksInput(String(ticks));
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify({ ticks, family }));
        } catch {
            /* nothing to do */
        }

        cancellation_ref.current.cancelled = true;
        const cancellation = { cancelled: false };
        cancellation_ref.current = cancellation;

        setShowOptions(false);
        setIsScanning(true);
        setError(null);
        setResult(null);
        setSelectedSymbol(null);
        setProgress(null);

        try {
            const scan = await scanMarkets({
                ticks,
                families: family === 'all' ? undefined : [family],
                cancellation,
                onProgress: next => {
                    if (!cancellation.cancelled && is_mounted_ref.current) setProgress(next);
                },
            });
            if (cancellation.cancelled || !is_mounted_ref.current) return;
            setResult(scan);
            if (!scan.rows.length) {
                setError(scan.failures[0]?.reason ?? localize('Deriv returned no analysable markets. Please try again.'));
            }
        } catch (err) {
            if (cancellation.cancelled || !is_mounted_ref.current) return;
            setError(err instanceof Error ? err.message : localize('Scan failed.'));
        } finally {
            if (is_mounted_ref.current && !cancellation.cancelled) setIsScanning(false);
        }
    }, [family, ticks_input]);

    const handleRun = useCallback(
        async (params: TScannerParams) => {
            if (!selected?.best) return;
            setShowParams(false);
            setIsLoadingBot(true);
            try {
                // Loads the strategy into Bot Builder and starts it straight away.
                await loadStrategyIntoBot(store as unknown as TStoreLike, {
                    symbol: selected.symbol,
                    definition: selected.best.definition,
                    params,
                    meta: {
                        display_name: selected.display_name,
                        strategy_label: selected.best.definition.label,
                        confident_win_rate: selected.best.confident_win_rate,
                        edge: selected.best.edge,
                        ticks_analysed: selected.ticks_analysed,
                        trigger_digit: selected.best.trigger?.previous_digit ?? null,
                    },
                    run: true,
                });
                onClose();
            } catch (err) {
                setError(err instanceof Error ? err.message : localize('Could not load the strategy.'));
            } finally {
                if (is_mounted_ref.current) setIsLoadingBot(false);
            }
        },
        [onClose, selected, store]
    );

    if (!isOpen || !store) return null;

    const has_result = !!selected?.best;
    const market_text = has_result ? `${selected?.display_name} (${selected?.symbol})` : '';
    const trade_text = has_result ? selected?.best?.definition.label ?? '' : '';
    const entry = selected ? entryDigitOf(selected) : '--';
    const path_text = has_result ? `${entry} -> ${trade_text}` : '';
    const quality = selected?.best?.confident_win_rate;

    const readonlyField = (value: string, placeholder: string) => (
        <div className={`ai-entry-scanner__input ai-entry-scanner__input--readonly${value ? ' ai-entry-scanner__input--filled' : ''}`}>
            {value || <span className='ai-entry-scanner__placeholder'>{placeholder}</span>}
        </div>
    );

    return (
        <div className='ai-entry-scanner__overlay' onClick={onClose}>
            <div className='ai-entry-scanner__modal' onClick={event => event.stopPropagation()} role='dialog' aria-modal='true'>
                <div className='ai-entry-scanner__header'>
                    <h2 className='ai-entry-scanner__title'>{localize('Entry Scanner')}</h2>
                    <button
                        type='button'
                        className='ai-entry-scanner__close'
                        onClick={onClose}
                        aria-label={localize('Close scanner')}
                    >
                        <LegacyClose1pxIcon width='22px' height='22px' />
                    </button>
                </div>

                <div className='ai-entry-scanner__body'>
                    <button
                        type='button'
                        className='ai-entry-scanner__options-link'
                        onClick={() => setShowOptions(open => !open)}
                        disabled={is_scanning}
                    >
                        {show_options ? localize('← Back to results') : localize('← Scanner options')}
                    </button>

                    {show_options ? (
                        <div className='ai-entry-scanner__form-card'>
                            <div className='ai-entry-scanner__field'>
                                <label className='ai-entry-scanner__label' htmlFor='ai-scanner-family'>
                                    {localize('Contracts to consider')}
                                </label>
                                <select
                                    id='ai-scanner-family'
                                    className='ai-entry-scanner__input'
                                    value={family}
                                    onChange={event => setFamily(event.target.value as TFamilyFilter)}
                                >
                                    {FAMILY_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className='ai-entry-scanner__caption'>
                                {localize(
                                    'Markets come from Deriv active_symbols, contracts from contracts_for, and ranking from measured win rates on live tick history.'
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className='ai-entry-scanner__form-card'>
                            <div className='ai-entry-scanner__field'>
                                <label className='ai-entry-scanner__label'>{localize('Selected market')}</label>
                                {readonlyField(market_text, localize('Scan for best market'))}
                            </div>

                            <div className='ai-entry-scanner__row'>
                                <div className='ai-entry-scanner__field'>
                                    <label className='ai-entry-scanner__label'>{localize('Trade type')}</label>
                                    {readonlyField(trade_text, localize('Waiting for scan'))}
                                </div>
                                <div className='ai-entry-scanner__field'>
                                    <label className='ai-entry-scanner__label'>{localize('Prediction path')}</label>
                                    {readonlyField(path_text, '--')}
                                </div>
                            </div>

                            <div className='ai-entry-scanner__field ai-entry-scanner__field--narrow'>
                                <label className='ai-entry-scanner__label' htmlFor='ai-scanner-ticks'>
                                    {localize('Ticks number ({{min}}-{{max}})', { min: MIN_TICKS, max: MAX_TICKS })}
                                </label>
                                <input
                                    id='ai-scanner-ticks'
                                    type='number'
                                    className='ai-entry-scanner__input'
                                    min={MIN_TICKS}
                                    max={MAX_TICKS}
                                    step={100}
                                    value={ticks_input}
                                    disabled={is_scanning}
                                    onChange={event => setTicksInput(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
                                    }}
                                />
                            </div>

                            {(is_scanning || progress) && (
                                <div className='ai-entry-scanner__progress-box'>
                                    <div className='ai-entry-scanner__progress-row'>
                                        <span className='ai-entry-scanner__progress-label'>
                                            {progress?.current_display_name ?? localize('Loading Deriv markets...')}
                                        </span>
                                        {progress && (
                                            <span className='ai-entry-scanner__progress-count'>
                                                {progress.completed}/{progress.total}
                                            </span>
                                        )}
                                    </div>
                                    <div className='ai-entry-scanner__progress-track'>
                                        <div
                                            className='ai-entry-scanner__progress-fill'
                                            style={{
                                                width: progress?.total
                                                    ? `${(progress.completed / progress.total) * 100}%`
                                                    : '6%',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && <div className='ai-entry-scanner__status ai-entry-scanner__status--error'>{error}</div>}

                            {result && !best && !error && (
                                <div className='ai-entry-scanner__status ai-entry-scanner__status--warn'>
                                    {localize('No market holds an edge over its fair value on this data. Try a larger tick window.')}
                                </div>
                            )}

                            {has_result && selected?.best && (
                                <div className='ai-entry-scanner__summary-box'>
                                    <div className='ai-entry-scanner__summary-text'>
                                        {localize('Best market')}: {selected.display_name} | {trade_text} | {localize('Entry')}{' '}
                                        {entry} | {localize('Quality')} {quality}%
                                    </div>
                                    <div className='ai-entry-scanner__summary-detail'>
                                        {localize(
                                            'Won {{rate}}% of {{trials}} ticks (fair value {{fair}}%) - quality is the 95% confidence floor of that win rate.',
                                            {
                                                rate: selected.best.win_rate,
                                                trials: selected.best.trials,
                                                fair: selected.best.baseline,
                                            }
                                        )}
                                    </div>
                                </div>
                            )}

                            {leaderboard.length > 1 && (
                                <div className='ai-entry-scanner__leaderboard'>
                                    <span className='ai-entry-scanner__label'>{localize('Other top markets')}</span>
                                    {leaderboard.map(row => (
                                        <button
                                            key={row.symbol}
                                            type='button'
                                            className={`ai-entry-scanner__rank${
                                                row.symbol === selected?.symbol ? ' ai-entry-scanner__rank--active' : ''
                                            }`}
                                            onClick={() => setSelectedSymbol(row.symbol)}
                                        >
                                            <span className='ai-entry-scanner__rank-market'>{row.display_name}</span>
                                            <span className='ai-entry-scanner__rank-strategy'>{row.best?.definition.label}</span>
                                            <span className='ai-entry-scanner__rank-edge'>{row.best?.confident_win_rate}%</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className='ai-entry-scanner__footer'>
                    <button
                        type='button'
                        className='ai-entry-scanner__btn ai-entry-scanner__btn--primary'
                        onClick={runScan}
                        disabled={is_scanning || is_loading_bot}
                    >
                        {is_scanning ? localize('Scanning...') : localize('Scan for Best Market')}
                    </button>
                    <button
                        type='button'
                        className='ai-entry-scanner__btn ai-entry-scanner__btn--secondary'
                        onClick={() => setShowParams(true)}
                        disabled={!has_result || is_scanning || is_loading_bot}
                    >
                        {is_loading_bot ? localize('Loading bot...') : localize('Load and Run Bot')}
                    </button>
                </div>
            </div>

            <ScannerParametersModal isOpen={show_params} onClose={() => setShowParams(false)} onRun={handleRun} />
        </div>
    );
};

export default EntryScannerModal;
