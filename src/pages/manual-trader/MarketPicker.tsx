/**
 * The Deriv Trader picker: trade types down the left, markets on the right with a
 * search box, market chips, a five-minute sparkline and change for each market,
 * and favourite stars. Markets that do not offer the chosen trade type are dimmed.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { loadOffer, loadSpark, readFavourites, TSpark, writeFavourites } from './market-data';
import {
    GROUP_LABELS,
    MARKET_CHIPS,
    marketBadge,
    SUBMARKET_LABELS,
    TMarket,
    TRADE_TYPES,
    TTradeType,
    TTradeTypeId,
} from './trade-types';

type TProps = {
    markets: TMarket[];
    trade_type: TTradeTypeId;
    symbol: string;
    /** `done` is true when a market was clicked, so the picker should close. */
    onPick: (trade_type: TTradeTypeId, symbol: string, done: boolean) => void;
    onClose: () => void;
};

export const MarketIcon = ({ market }: { market: TMarket }) => {
    const badge = marketBadge(market);
    return (
        <span className={`mt-icon mt-icon--${market.market}`} aria-hidden='true'>
            <span className='mt-icon__main'>{badge.main}</span>
            {badge.sub && <span className='mt-icon__sub'>{badge.sub}</span>}
            <svg className='mt-icon__candles' width='22' height='14' viewBox='0 0 22 14'>
                <rect x='1' y='6' width='4' height='6' rx='1' />
                <rect x='9' y='3' width='4' height='8' rx='1' />
                <rect x='17' y='1' width='4' height='9' rx='1' />
            </svg>
        </span>
    );
};

const Sparkline = ({ data }: { data?: TSpark }) => {
    if (!data || data.prices.length < 2) return <span className='mt-picker__spark mt-picker__spark--empty' />;
    const { prices } = data;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    const points = prices.map((p, i) => `${((i / (prices.length - 1)) * 100).toFixed(1)},${(28 - ((p - min) / span) * 26).toFixed(1)}`);
    const tone = data.change >= 0 ? 'up' : 'down';
    return (
        <svg className={`mt-picker__spark mt-picker__spark--${tone}`} viewBox='0 0 100 30' preserveAspectRatio='none'>
            <polygon points={`0,30 ${points.join(' ')} 100,30`} />
            <polyline points={points.join(' ')} />
        </svg>
    );
};

const MarketPicker = ({ markets, trade_type, symbol, onPick, onClose }: TProps) => {
    const [pending_type, setPendingType] = useState<TTradeTypeId>(trade_type);
    const [chip, setChip] = useState('synthetic_index');
    const [query, setQuery] = useState('');
    const [favourites, setFavourites] = useState<string[]>(readFavourites);
    const [sparks, setSparks] = useState<Record<string, TSpark>>({});
    const [supported, setSupported] = useState<Record<string, boolean>>({});
    const [info, setInfo] = useState<string | null>(null);
    const panel = useRef<HTMLDivElement>(null);

    const type: TTradeType = TRADE_TYPES.find(t => t.id === pending_type) ?? TRADE_TYPES[0];

    // Close on Escape or a click outside.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        const onDown = (event: MouseEvent) => {
            if (panel.current && !panel.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [onClose]);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return markets.filter(m => {
            if (q) return m.name.toLowerCase().includes(q) || m.symbol.toLowerCase().includes(q);
            if (chip === 'favourites') return favourites.includes(m.symbol);
            return m.market === chip;
        });
    }, [markets, chip, query, favourites]);

    // Sparklines and trade-type support for the markets on screen.
    useEffect(() => {
        let alive = true;
        shown.slice(0, 40).forEach(m => {
            loadSpark(m.symbol)
                .then(data => alive && setSparks(prev => ({ ...prev, [m.symbol]: data })))
                .catch(() => undefined);
        });
        return () => {
            alive = false;
        };
    }, [shown]);

    useEffect(() => {
        let alive = true;
        setSupported({});
        shown.forEach(m => {
            loadOffer(m.symbol)
                .then(offer => {
                    const ok = type.sides.every(s => offer.types.has(s.contract_type));
                    if (alive) setSupported(prev => ({ ...prev, [m.symbol]: ok }));
                })
                .catch(() => undefined);
        });
        return () => {
            alive = false;
        };
    }, [shown, type]);

    const groups = useMemo(() => {
        const by: Record<string, TMarket[]> = {};
        shown.forEach(m => {
            (by[m.submarket] = by[m.submarket] || []).push(m);
        });
        return Object.entries(by);
    }, [shown]);

    const toggleFavourite = (sym: string) => {
        const next = favourites.includes(sym) ? favourites.filter(f => f !== sym) : [...favourites, sym];
        setFavourites(next);
        writeFavourites(next);
    };

    const chooseType = (id: TTradeTypeId) => {
        setPendingType(id);
        if (!symbol) return; // a new tab: the market comes next
        // Keep the current market if it offers the new type; the panel checks again.
        loadOffer(symbol)
            .then(offer => {
                const t = TRADE_TYPES.find(x => x.id === id);
                if (t && t.sides.every(s => offer.types.has(s.contract_type))) onPick(id, symbol, false);
            })
            .catch(() => undefined);
    };

    let last_group = '';

    return (
        <div className='mt-picker' ref={panel} role='dialog' aria-label='Choose trade type and market'>
            <nav className='mt-picker__types'>
                {TRADE_TYPES.map(t => {
                    const starts_group = Boolean(last_group) && t.group !== last_group;
                    last_group = t.group;
                    return (
                        <div key={t.id}>
                            {starts_group && <div className='mt-picker__rule' />}
                            {starts_group && GROUP_LABELS[t.group] && (
                                <div className='mt-picker__group'>{GROUP_LABELS[t.group]}</div>
                            )}
                            <button
                                type='button'
                                className={`mt-picker__type ${t.id === pending_type ? 'is-active' : ''}`}
                                onClick={() => chooseType(t.id)}
                            >
                                {t.label}
                                {t.hot && (
                                    <span className='mt-picker__hot' aria-label='Popular'>
                                        🔥
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </nav>

            <section className='mt-picker__markets'>
                <label className='mt-picker__search'>
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        <circle cx='11' cy='11' r='7' />
                        <path d='m20 20-3.5-3.5' />
                    </svg>
                    <input
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder='Search by market name'
                        aria-label='Search by market name'
                    />
                </label>

                {!query && (
                    <div className='mt-picker__chips'>
                        {MARKET_CHIPS.map(c => (
                            <button
                                key={c.id}
                                type='button'
                                className={`mt-picker__chip ${chip === c.id ? 'is-active' : ''}`}
                                onClick={() => setChip(c.id)}
                            >
                                {c.id === 'favourites' ? '★ ' : ''}
                                {c.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className='mt-picker__list'>
                    {!shown.length && (
                        <div className='mt-picker__empty'>
                            {chip === 'favourites' && !query
                                ? 'No favourites yet. Tap the star next to a market to add it here.'
                                : 'No markets match that search.'}
                        </div>
                    )}
                    {groups.map(([submarket, rows]) => (
                        <div key={submarket} className='mt-picker__section'>
                            <div className='mt-picker__section-head'>
                                <span>{SUBMARKET_LABELS[submarket] || submarket.replace(/_/g, ' ')}</span>
                                <span className='mt-picker__section-note'>Price changes (5 minutes)</span>
                            </div>
                            {rows.map(m => {
                                const spark = sparks[m.symbol];
                                const ok = supported[m.symbol];
                                const disabled = ok === false;
                                return (
                                    <div
                                        key={m.symbol}
                                        className={`mt-picker__row ${m.symbol === symbol ? 'is-current' : ''} ${disabled ? 'is-disabled' : ''}`}
                                    >
                                        <button
                                            type='button'
                                            className='mt-picker__pick'
                                            disabled={disabled}
                                            title={disabled ? `${type.label} is not offered on ${m.name}` : m.name}
                                            onClick={() => onPick(pending_type, m.symbol, true)}
                                        >
                                            <MarketIcon market={m} />
                                            <span className='mt-picker__name'>
                                                {m.name}
                                                {!m.is_open && <em className='mt-picker__closed'>Closed</em>}
                                            </span>
                                            <Sparkline data={spark} />
                                            <span
                                                className={`mt-picker__change ${spark ? (spark.change >= 0 ? 'is-up' : 'is-down') : ''}`}
                                            >
                                                {spark ? `${spark.change >= 0 ? '+' : ''}${spark.change.toFixed(2)}%` : '—'}
                                            </span>
                                        </button>
                                        <button
                                            type='button'
                                            className='mt-picker__icon-btn'
                                            onClick={() => setInfo(info === m.symbol ? null : m.symbol)}
                                            aria-label={`About ${m.name}`}
                                        >
                                            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                                                <circle cx='12' cy='12' r='9' />
                                                <path d='M12 11v6M12 7.5v.5' />
                                            </svg>
                                        </button>
                                        <button
                                            type='button'
                                            className={`mt-picker__icon-btn mt-picker__star ${favourites.includes(m.symbol) ? 'is-on' : ''}`}
                                            onClick={() => toggleFavourite(m.symbol)}
                                            aria-label={favourites.includes(m.symbol) ? 'Remove from favourites' : 'Add to favourites'}
                                        >
                                            <svg width='18' height='18' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='1.8'>
                                                <path d='m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z' />
                                            </svg>
                                        </button>
                                        {info === m.symbol && (
                                            <div className='mt-picker__info'>
                                                <strong>{m.name}</strong> · {m.symbol} ·{' '}
                                                {SUBMARKET_LABELS[m.submarket] || m.submarket} · prices to {m.decimals} decimal
                                                {m.decimals === 1 ? '' : 's'} · {m.is_open ? 'open now' : 'closed now'}
                                                {ok === false && ` · ${type.label} not offered here`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default MarketPicker;
