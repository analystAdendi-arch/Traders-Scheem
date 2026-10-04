import React, { useEffect, useState } from 'react';

export type TScannerParams = {
    stake: number;
    martingale: number;
    wins: number;
    stopLoss: number;
    useMartingale: boolean;
};

type TProps = {
    isOpen: boolean;
    onClose: () => void;
    onRun: (params: TScannerParams) => void;
};

const DEFAULT_PARAMS: TScannerParams = {
    stake: 0.5,
    martingale: 2,
    wins: 5,
    stopLoss: 50,
    useMartingale: true,
};

const clampNumber = (value: string, min: number, max: number, fallback: number): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
};

const ScannerParametersModal: React.FC<TProps> = ({ isOpen, onClose, onRun }) => {
    const [stakeStr, setStakeStr] = useState<string>(String(DEFAULT_PARAMS.stake));
    const [martingaleStr, setMartingaleStr] = useState(String(DEFAULT_PARAMS.martingale));
    const [winsStr, setWinsStr] = useState(String(DEFAULT_PARAMS.wins));
    const [stopLossStr, setStopLossStr] = useState(String(DEFAULT_PARAMS.stopLoss));
    const [useMartingale, setUseMartingale] = useState<boolean>(DEFAULT_PARAMS.useMartingale);

    useEffect(() => {
        if (!isOpen) return;
        try {
            const saved = JSON.parse(localStorage.getItem('ai-scanner-params') ?? 'null');
            if (saved && typeof saved === 'object') {
                setStakeStr(String(saved.stake ?? DEFAULT_PARAMS.stake));
                setMartingaleStr(String(saved.martingale ?? DEFAULT_PARAMS.martingale));
                setWinsStr(String(saved.wins ?? DEFAULT_PARAMS.wins));
                setStopLossStr(String(saved.stopLoss ?? DEFAULT_PARAMS.stopLoss));
                setUseMartingale(saved.useMartingale ?? DEFAULT_PARAMS.useMartingale);
            }
        } catch (_) {}
    }, [isOpen]);

    const finalizeAll = () => {
        const params: TScannerParams = {
            stake: clampNumber(stakeStr, 0.01, 100000, DEFAULT_PARAMS.stake),
            martingale: clampNumber(martingaleStr, 1, 10, DEFAULT_PARAMS.martingale),
            wins: clampNumber(winsStr, 1, 1000, DEFAULT_PARAMS.wins),
            stopLoss: clampNumber(stopLossStr, 0, 1000000, DEFAULT_PARAMS.stopLoss),
            useMartingale: !!useMartingale,
        };
        setStakeStr(String(params.stake));
        setMartingaleStr(String(params.martingale));
        setWinsStr(String(params.wins));
        setStopLossStr(String(params.stopLoss));
        return params;
    };

    const handleCancel = () => {
        onClose();
    };

    const handleRun = () => {
        const params = finalizeAll();
        try {
            localStorage.setItem('ai-scanner-params', JSON.stringify(params));
        } catch (_) {}
        onRun(params);
    };

    if (!isOpen) return null;

    return (
        <div
            className='scanner-params__overlay'
            onClick={handleCancel}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(2px)',
                zIndex: 100020,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.6rem',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                role='dialog'
                aria-modal='true'
                style={{
                    width: '100%',
                    maxWidth: 520,
                    background: '#ffffff',
                    borderRadius: '1.6rem',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.32)',
                    overflow: 'hidden',
                    animation: 'ai-es-pop 0.22s ease-out',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.8rem 2.2rem',
                        borderBottom: '1px solid #e2e8f0',
                        background: '#f8fafc',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '2.1rem',
                            fontWeight: 800,
                            color: '#0f172a',
                        }}
                    >
                        Scanner Parameters
                    </h2>
                </div>

                <div style={{ padding: '2.2rem' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1.6rem',
                            marginBottom: '1.4rem',
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: '#334155',
                                    letterSpacing: '0.03em',
                                    marginBottom: '0.8rem',
                                }}
                            >
                                STAKE
                            </label>
                            <input
                                type='number'
                                step='0.01'
                                min='0.01'
                                value={stakeStr}
                                onChange={e => setStakeStr(e.target.value)}
                                onBlur={finalizeAll}
                                style={{
                                    width: '100%',
                                    padding: '1.4rem 1.6rem',
                                    borderRadius: '1rem',
                                    border: '1px solid #e0f2fe',
                                    background: '#f0f9ff',
                                    fontSize: '1.6rem',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: '#334155',
                                    letterSpacing: '0.03em',
                                    marginBottom: '0.8rem',
                                }}
                            >
                                MARTINGALE
                            </label>
                            <input
                                type='number'
                                step='1'
                                min='1'
                                value={martingaleStr}
                                onChange={e => setMartingaleStr(e.target.value)}
                                onBlur={finalizeAll}
                                style={{
                                    width: '100%',
                                    padding: '1.4rem 1.6rem',
                                    borderRadius: '1rem',
                                    border: '1px solid #e0f2fe',
                                    background: '#f0f9ff',
                                    fontSize: '1.6rem',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: '#334155',
                                    letterSpacing: '0.03em',
                                    marginBottom: '0.8rem',
                                }}
                            >
                                NUMBER OF WINS
                            </label>
                            <input
                                type='number'
                                step='1'
                                min='1'
                                value={winsStr}
                                onChange={e => setWinsStr(e.target.value)}
                                onBlur={finalizeAll}
                                style={{
                                    width: '100%',
                                    padding: '1.4rem 1.6rem',
                                    borderRadius: '1rem',
                                    border: '1px solid #e0f2fe',
                                    background: '#f0f9ff',
                                    fontSize: '1.6rem',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: '#334155',
                                    letterSpacing: '0.03em',
                                    marginBottom: '0.8rem',
                                }}
                            >
                                STOP LOSS
                            </label>
                            <input
                                type='number'
                                step='0.1'
                                min='0'
                                value={stopLossStr}
                                onChange={e => setStopLossStr(e.target.value)}
                                onBlur={finalizeAll}
                                style={{
                                    width: '100%',
                                    padding: '1.4rem 1.6rem',
                                    borderRadius: '1rem',
                                    border: '1px solid #e0f2fe',
                                    background: '#f0f9ff',
                                    fontSize: '1.6rem',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <div
                        onClick={() => setUseMartingale(v => !v)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.4rem 1.8rem',
                            borderRadius: '1rem',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                    >
                        <span
                            style={{
                                fontSize: '1.6rem',
                                fontWeight: 700,
                                color: '#0f172a',
                            }}
                        >
                            Use Martingale
                        </span>
                        <div
                            style={{
                                width: 58,
                                height: 32,
                                borderRadius: 999,
                                background: useMartingale
                                    ? 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)'
                                    : '#cbd5e1',
                                position: 'relative',
                                transition: 'background 0.15s ease',
                                boxShadow: useMartingale
                                    ? '0 6px 14px rgba(2, 132, 199, 0.3)'
                                    : 'none',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 3,
                                    left: useMartingale ? 29 : 3,
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    background: '#ffffff',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
                                    transition: 'left 0.18s ease',
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1.2rem',
                        padding: '1.6rem 2.2rem 2.2rem',
                        borderTop: '1px solid #e2e8f0',
                        background: '#ffffff',
                    }}
                >
                    <button
                        type='button'
                        onClick={handleCancel}
                        style={{
                            padding: '1.3rem 2.2rem',
                            borderRadius: '1.1rem',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleRun}
                        style={{
                            padding: '1.3rem 2.2rem',
                            borderRadius: '1.1rem',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 18px rgba(2, 132, 199, 0.3)',
                            transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(2, 132, 199, 0.38)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 18px rgba(2, 132, 199, 0.3)';
                        }}
                    >
                        Load and Run
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScannerParametersModal;
