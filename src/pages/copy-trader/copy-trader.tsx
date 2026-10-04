import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { useStore } from '@/hooks/useStore';
import { isDemoAccount } from '@/utils/account-helpers';
import CopyTraderStore, { maskToken } from '@/stores/copy-trader-store';
import type { TClientTokenState, TCopyTraderError } from '@/stores/copy-trader-store';

import SceneFx from '@/components/scene-fx/SceneFx';
import './copy-trader.scss';

/* ------------------------------------------------------------------ icons */

const Svg = ({ size = 14, children, fill = 'none' }: { size?: number; children: React.ReactNode; fill?: string }) => (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill={fill}
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
    >
        {children}
    </svg>
);

const PlayIcon = () => (
    <Svg>
        <polygon points='6 4 20 12 6 20 6 4' fill='currentColor' stroke='none' />
    </Svg>
);
const StopIcon = () => (
    <Svg>
        <rect x='6' y='6' width='12' height='12' rx='2' fill='currentColor' stroke='none' />
    </Svg>
);
const SyncIcon = ({ spinning }: { spinning?: boolean }) => (
    <span className={spinning ? 'copy-trader__spin' : ''}>
        <Svg>
            <path d='M21 12a9 9 0 1 1-3.1-6.8' />
            <path d='M21 3v6h-6' />
        </Svg>
    </span>
);
const YoutubeIcon = () => (
    <Svg size={12}>
        <path d='M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z' />
        <polygon points='9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02' fill='currentColor' stroke='none' />
    </Svg>
);
const EnvelopeIcon = () => (
    <Svg size={16}>
        <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
        <polyline points='22,6 12,13 2,6' />
    </Svg>
);
const UsersIcon = ({ size = 16 }: { size?: number }) => (
    <Svg size={size}>
        <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
        <circle cx='9' cy='7' r='4' />
        <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
        <path d='M16 3.13a4 4 0 0 1 0 7.75' />
    </Svg>
);
const CopyIcon = ({ size = 16 }: { size?: number }) => (
    <Svg size={size}>
        <rect x='9' y='9' width='11' height='11' rx='2' />
        <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
    </Svg>
);
const CheckIcon = ({ size = 16 }: { size?: number }) => (
    <Svg size={size}>
        <polyline points='20 6 9 17 4 12' />
    </Svg>
);
const PlusIcon = () => (
    <Svg size={12}>
        <line x1='12' y1='5' x2='12' y2='19' />
        <line x1='5' y1='12' x2='19' y2='12' />
    </Svg>
);
const TrashIcon = () => (
    <Svg size={12}>
        <polyline points='3 6 5 6 21 6' />
        <path d='M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6' />
    </Svg>
);
const CloseIcon = () => (
    <Svg size={14}>
        <line x1='18' y1='6' x2='6' y2='18' />
        <line x1='6' y1='6' x2='18' y2='18' />
    </Svg>
);

/* ------------------------------------------------------------ small parts */

const STATUS_LABEL: Record<TClientTokenState['status'], string> = {
    checking: 'Checking',
    ready: 'Ready',
    active: 'Active',
    error: 'Error',
};

const StatusChip = ({ status }: { status: TClientTokenState['status'] }) => (
    <span className={`copy-trader__client-chip copy-trader__client-chip--${status === 'ready' ? 'idle' : status === 'checking' ? 'starting' : status}`}>
        <span className='copy-trader__client-dot' />
        {STATUS_LABEL[status]}
    </span>
);

const ErrorToast = ({ error, onDismiss }: { error: TCopyTraderError; onDismiss: () => void }) => (
    <div className='copy-trader__toast' role='alert'>
        <div className='copy-trader__toast-body'>
            <div className='copy-trader__toast-title'>{error.code ? `${error.code} — ` : ''}Error</div>
            <div className='copy-trader__toast-message'>{error.message}</div>
        </div>
        <button type='button' className='copy-trader__toast-close' aria-label='Dismiss' onClick={onDismiss}>
            ×
        </button>
    </div>
);

const TUTORIAL_VIDEO_ID = 'glDgvwoSKM4';

const YoutubeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);
    if (!isOpen) return null;
    return (
        <div className='copy-trader__modal-overlay' role='dialog' aria-modal='true' onMouseDown={onClose}>
            <div className='copy-trader__modal-wrap' onMouseDown={e => e.stopPropagation()}>
                <div className='copy-trader__modal'>
                    <div className='copy-trader__modal-header'>
                        <div className='copy-trader__modal-title-row'>
                            <YoutubeIcon />
                            <span className='copy-trader__modal-title'>{localize('How to get a Deriv API token')}</span>
                        </div>
                        <button type='button' className='copy-trader__modal-close' onClick={onClose} aria-label='Close'>
                            <CloseIcon />
                        </button>
                    </div>
                    <div className='copy-trader__modal-body'>
                        <div className='copy-trader__video-wrap'>
                            <iframe
                                className='copy-trader__video-frame'
                                src={`https://www.youtube.com/embed/${TUTORIAL_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                                title='Deriv API token tutorial'
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ page */

const CopyTrader = observer(() => {
    const store = useStore();
    const copyTrader = (store as unknown as { copy_trader?: CopyTraderStore })?.copy_trader;
    const client = store?.client;

    const [inputToken, setInputToken] = useState('');
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState<number[]>([]);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    /** Which token was just copied, so the button can confirm it briefly. */
    const [copied, setCopied] = useState<string | null>(null);
    const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const copy_timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (copy_timer.current) clearTimeout(copy_timer.current);
    }, []);

    /** Clipboard API needs a secure context; fall back to a hidden textarea. */
    const copyText = React.useCallback(async (text: string, key: string) => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const area = document.createElement('textarea');
                area.value = text;
                area.setAttribute('readonly', '');
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                document.body.removeChild(area);
            }
            setCopied(key);
            if (copy_timer.current) clearTimeout(copy_timer.current);
            copy_timer.current = setTimeout(() => setCopied(null), 1600);
        } catch {
            setInlineError(localize('Could not copy to the clipboard.'));
        }
    }, []);

    useEffect(() => () => timers.current.forEach(t => clearTimeout(t)), []);

    const errors = (copyTrader?.errors ?? []).filter(e => !dismissed.includes(e.timestamp));
    const activeError = errors[0];

    useEffect(() => {
        if (!activeError || timers.current.has(activeError.timestamp)) return;
        timers.current.set(
            activeError.timestamp,
            setTimeout(() => setDismissed(prev => [...prev, activeError.timestamp]), 7000)
        );
    }, [activeError]);

    if (!copyTrader) return null;

    const loginid = client?.loginid ?? '';
    const currency = client?.currency ?? 'USD';
    const balance = Number(client?.balance ?? 0);
    const on_demo = isDemoAccount(loginid);
    const clients = copyTrader.clientTokens;
    const activeCount = copyTrader.activeClientCount;

    const handleAdd = () => {
        const result = copyTrader.addClientToken(inputToken);
        if (result.ok) {
            setInputToken('');
            setInlineError(null);
        } else {
            setInlineError(result.message ?? localize('Could not add token.'));
        }
    };

    const handleToggleCopy = () => {
        setInlineError(null);
        if (copyTrader.isCopying) void copyTrader.stopAllCopying();
        else void copyTrader.startAllCopying();
    };

    const handleDemoToReal = () => {
        if (copyTrader.isDemoToRealRunning) copyTrader.stopDemoToReal();
        else void copyTrader.startDemoToReal();
    };

    return (
        <div className='copy-trader'>
            <SceneFx />
            {activeError && (
                <div className='copy-trader__toast-wrap'>
                    <ErrorToast error={activeError} onDismiss={() => setDismissed(prev => [...prev, activeError.timestamp])} />
                </div>
            )}

            <div className='copy-trader__shell'>
                {/* account + demo-to-real */}
                <section className='copy-trader__panel copy-trader__panel--account-bar'>
                    <div className='copy-trader__account-bar'>
                        <div className='copy-trader__account-badge'>
                            <EnvelopeIcon />
                            <span className='copy-trader__account-id'>{loginid || localize('Not logged in')}</span>
                            <span className='copy-trader__account-balance'>
                                {balance.toFixed(2)} {currency}
                            </span>
                        </div>
                        <div className='copy-trader__account-actions'>
                            <button type='button' className='copy-trader__btn copy-trader__btn--ghost' onClick={() => setTutorialOpen(true)}>
                                <YoutubeIcon />
                                <span>{localize('Tutorial')}</span>
                            </button>
                            <button
                                type='button'
                                className={`copy-trader__btn ${
                                    copyTrader.isDemoToRealRunning ? 'copy-trader__btn--danger' : 'copy-trader__btn--primary-green'
                                }`}
                                onClick={handleDemoToReal}
                                disabled={copyTrader.isDemoToRealStarting || !loginid}
                            >
                                {copyTrader.isDemoToRealRunning ? <StopIcon /> : <PlayIcon />}
                                <span>
                                    {copyTrader.isDemoToRealStarting
                                        ? localize('Connecting…')
                                        : copyTrader.isDemoToRealRunning
                                          ? localize('Stop Demo to Real Copytrading')
                                          : localize('Start Demo to Real Copytrading')}
                                </span>
                            </button>
                        </div>
                    </div>
                    {(copyTrader.demoToRealStatus || (loginid && !on_demo)) && (
                        <p className='copy-trader__d2r-status'>
                            {copyTrader.demoToRealStatus ||
                                localize('Demo to Real copies trades from your Demo account - switch to Demo in the header to use it.')}
                        </p>
                    )}
                </section>

                <div className='copy-trader__section-header'>
                    <div className='copy-trader__section-line' />
                    <div className='copy-trader__section-title'>{localize('CLIENT COPY TRADING')}</div>
                    <div className='copy-trader__section-line' />
                </div>

                {/* start / stop + stake */}
                <section className='copy-trader__panel copy-trader__panel--start-row'>
                    <div className='copy-trader__start-row'>
                        <button
                            type='button'
                            className={`copy-trader__cta ${copyTrader.isCopying ? 'copy-trader__cta--stop' : 'copy-trader__cta--start'}`}
                            onClick={handleToggleCopy}
                        >
                            {copyTrader.isCopying ? <StopIcon /> : <PlayIcon />}
                            <span>{copyTrader.isCopying ? localize('Stop Copy Trading') : localize('Start Copy Trading')}</span>
                        </button>

                        <div className='copy-trader__stake'>
                            <span>{localize('Copy stake')}</span>
                            <select
                                value={copyTrader.stakeMode}
                                onChange={e => copyTrader.setStakeMode(e.target.value as 'same' | 'fixed')}
                            >
                                <option value='same'>{localize('Same as my trade')}</option>
                                <option value='fixed'>{localize('Fixed amount')}</option>
                            </select>
                            {copyTrader.stakeMode === 'fixed' && (
                                <input
                                    type='number'
                                    min={0.35}
                                    step={0.1}
                                    value={copyTrader.fixedStake}
                                    onChange={e => copyTrader.setFixedStake(Number(e.target.value))}
                                />
                            )}
                        </div>

                        <div className='copy-trader__active-count'>
                            <UsersIcon />
                            <span>
                                {activeCount} {localize('clients active')}
                            </span>
                        </div>
                    </div>
                </section>

                {/* add client */}
                <section className='copy-trader__panel copy-trader__panel--input-row'>
                    <div className={`copy-trader__input-group ${inlineError ? 'copy-trader__input-group--error' : ''}`}>
                        <input
                            type='text'
                            className='copy-trader__input-group-field'
                            autoComplete='off'
                            spellCheck={false}
                            placeholder={localize("Enter client's Personal Access Token (trade scope)...")}
                            value={inputToken}
                            onChange={e => {
                                setInputToken(e.target.value);
                                setInlineError(null);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAdd();
                                }
                            }}
                        />
                        <div className='copy-trader__input-group-actions'>
                            <button
                                type='button'
                                className='copy-trader__btn copy-trader__btn--add'
                                disabled={!inputToken.trim()}
                                onClick={handleAdd}
                            >
                                <PlusIcon />
                                <span>{localize('Add')}</span>
                            </button>
                            <button
                                type='button'
                                className='copy-trader__btn copy-trader__btn--ghost-bordered'
                                title={localize('Re-check every client token')}
                                onClick={() => void copyTrader.syncClientStates()}
                                disabled={copyTrader.isSyncing || !clients.length}
                            >
                                <SyncIcon spinning={copyTrader.isSyncing} />
                                <span>{localize('Sync')}</span>
                            </button>
                            <button
                                type='button'
                                className='copy-trader__btn copy-trader__btn--ghost-bordered'
                                onClick={() => setTutorialOpen(true)}
                            >
                                <YoutubeIcon />
                                <span>{localize('Guide')}</span>
                            </button>
                        </div>
                    </div>
                    {inlineError && (
                        <div className='copy-trader__inline-error' role='alert'>
                            {inlineError}
                        </div>
                    )}
                    <p className='copy-trader__hint'>
                        {localize(
                            'Each client creates a Personal Access Token with the Trade scope in their own Deriv account and shares it with you. Copies are placed through Deriv Bulk Purchase each time you open a trade.'
                        )}
                    </p>
                </section>

                {/* clients */}
                <div className='copy-trader__clients-header'>
                    <button
                        type='button'
                        className='copy-trader__copy-all'
                        title={localize('Copy every client token')}
                        aria-label={localize('Copy every client token')}
                        disabled={!clients.length}
                        onClick={() => void copyText(clients.map(c => c.token).join('\n'), 'all')}
                    >
                        {copied === 'all' ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <h2 className='copy-trader__clients-title'>
                        {localize('Clients')} <span className='copy-trader__clients-count'>{clients.length}</span>
                    </h2>
                    {copied === 'all' && <span className='copy-trader__copied-note'>{localize('Copied')}</span>}
                    {clients.length > 0 && (
                        <button type='button' className='copy-trader__clients-clear' onClick={() => copyTrader.clearClientTokens()}>
                            {localize('Clear all')}
                        </button>
                    )}
                </div>

                <section className='copy-trader__panel copy-trader__panel--clients'>
                    {clients.length === 0 ? (
                        <div className='copy-trader__empty'>
                            <div className='copy-trader__empty-icon' aria-hidden>
                                <UsersIcon size={40} />
                            </div>
                            <div className='copy-trader__empty-title'>
                                {localize('No clients added yet. Enter a token above to get started.')}
                            </div>
                        </div>
                    ) : (
                        <ul className='copy-trader__clients-list'>
                            {clients.map(c => (
                                <li
                                    key={c.token}
                                    className={`copy-trader__client-row ${c.status === 'error' ? 'copy-trader__client-row--error' : ''}`}
                                >
                                    <div className='copy-trader__client-main'>
                                        <div className='copy-trader__client-token-row'>
                                            <code className='copy-trader__client-token'>{maskToken(c.token)}</code>
                                            <button
                                                type='button'
                                                className='copy-trader__token-copy'
                                                title={localize('Copy this token')}
                                                aria-label={localize('Copy this token')}
                                                onClick={() => void copyText(c.token, c.token)}
                                            >
                                                {copied === c.token ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                                                <span>
                                                    {copied === c.token ? localize('Copied') : localize('Copy')}
                                                </span>
                                            </button>
                                        </div>
                                        {c.accounts.length > 0 && (
                                            <select
                                                className='copy-trader__client-account'
                                                value={c.account_id ?? ''}
                                                disabled={c.status === 'active'}
                                                onChange={e => copyTrader.setClientAccount(c.token, e.target.value)}
                                            >
                                                {c.accounts.map(a => (
                                                    <option key={a.account_id} value={a.account_id}>
                                                        {a.account_type === 'demo' ? 'Demo' : 'Real'} · {a.account_id} ·{' '}
                                                        {a.balance} {a.currency}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {c.errorMessage && <div className='copy-trader__client-err'>{c.errorMessage}</div>}
                                    </div>
                                    <div className='copy-trader__client-actions'>
                                        <StatusChip status={c.status} />
                                        <button
                                            type='button'
                                            className='copy-trader__client-remove'
                                            aria-label={localize('Remove client')}
                                            onClick={() => copyTrader.removeClientToken(c.token)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* activity */}
                <div className='copy-trader__clients-header'>
                    <h2 className='copy-trader__clients-title'>{localize('Copy activity')}</h2>
                    {copyTrader.logs.length > 0 && (
                        <button type='button' className='copy-trader__clients-clear' onClick={() => copyTrader.clearLogs()}>
                            {localize('Clear')}
                        </button>
                    )}
                </div>
                <section className='copy-trader__panel copy-trader__panel--log'>
                    {copyTrader.logs.length === 0 ? (
                        <div className='copy-trader__log-empty'>
                            {localize('Copied trades will appear here as soon as you open a trade.')}
                        </div>
                    ) : (
                        <ul className='copy-trader__log'>
                            {copyTrader.logs.map(entry => (
                                <li key={entry.id} className={`copy-trader__log-row copy-trader__log-row--${entry.result}`}>
                                    <span className='copy-trader__log-time'>{new Date(entry.time).toLocaleTimeString()}</span>
                                    <span className='copy-trader__log-target'>
                                        {entry.target === 'real' ? localize('Real') : localize('Clients')}
                                    </span>
                                    <span className='copy-trader__log-contract'>{entry.contract}</span>
                                    <span className='copy-trader__log-detail'>
                                        {entry.stake > 0 && `${entry.stake.toFixed(2)} ${entry.currency} · `}
                                        {entry.detail}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <YoutubeModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
        </div>
    );
});

export default CopyTrader;
