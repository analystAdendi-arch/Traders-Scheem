/**
 * Manual Trader: Deriv Trader, inside the site.
 *
 * Deriv's own trader (dtrader.deriv.com) cannot live here: it refuses to be framed,
 * keeps its session on its own origin, and trades under Deriv's app id. So the same
 * screen is built here on the site's socket instead, laid out as Deriv Trader is -
 * the left navigation, market tabs with the trade type and market picker, the live
 * tick chart with its tools, the trade panel with live prices, the right-hand rail
 * and a positions drawer - and every quote and purchase goes through this site's
 * OAuth app id and the account the site is signed in as. Only Deposit opens Deriv's
 * cashier, in a new tab, since funds can only be added there.
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { generateOAuthURL, standalone_routes } from '@/components/shared';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import { getAppName, LOGO_CANDIDATES } from '@/utils/branding';

import { apiVersion, isReady, send, subscribe } from './deriv-stream';
import { loadMarkets, loadOffer, offerRow, TOffer } from './market-data';
import MarketPicker, { MarketIcon } from './MarketPicker';
import TickChart, { TChartLine, TTick } from './TickChart';
import {
    buildParameters,
    DEFAULT_FORM,
    getTradeType,
    lastDigit,
    TForm,
    TMarket,
    TTradeTypeId,
} from './trade-types';
import TradePanel, { money, PositionsList, TPosition, TProposal } from './TradePanel';

import './manual-trader.scss';

type TTab = { id: string; symbol: string; trade_type: TTradeTypeId };

const TABS_KEY = 'ts-trader-tabs';
const MAX_TABS = 5;
const HISTORY = 1000;
const FIRST_TAB: TTab = { id: 'tab-1', symbol: '1HZ100V', trade_type: 'rise_fall' };

const readTabs = (): { tabs: TTab[]; active: string } => {
    try {
        const saved = JSON.parse(localStorage.getItem(TABS_KEY) || 'null');
        if (saved?.tabs?.length) return saved;
    } catch {
        /* fall through to the default tab */
    }
    return { tabs: [FIRST_TAB], active: FIRST_TAB.id };
};

const RETRY_CODES = ['InvalidContractProposal', 'PriceMoved'];

/** One item in the left navigation: icon over label, with an optional count. */
const SideItem = ({
    label,
    onClick,
    active = false,
    badge,
    children,
}: {
    label: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
    children: ReactNode;
}) => (
    <button type='button' className={`mt-side__item ${active ? 'is-active' : ''}`} onClick={onClick}>
        <span className='mt-side__icon'>
            {children}
            {badge ? <span className='mt-side__badge'>{badge}</span> : null}
        </span>
        <span className='mt-side__label'>{label}</span>
    </button>
);

const ManualTrader = observer(() => {
    const { client, transactions, dashboard, run_panel } = useStore() as any;
    const logout = useLogout();
    const root = useRef<HTMLDivElement>(null);

    /* ------------------------------------------------------------ socket */
    // Bumps when the site's socket becomes ready or is replaced, so streams re-open.
    const [conn, setConn] = useState(0);
    useEffect(() => {
        let version = apiVersion();
        let ready = isReady();
        const timer = setInterval(() => {
            const next_version = apiVersion();
            const next_ready = isReady();
            if (next_version !== version || next_ready !== ready) {
                version = next_version;
                ready = next_ready;
                if (next_ready) setConn(c => c + 1);
            }
        }, 1500);
        return () => clearInterval(timer);
    }, []);

    /* ------------------------------------------------------------- state */
    const [markets, setMarkets] = useState<TMarket[]>([]);
    const [{ tabs, active }, setTabState] = useState(readTabs);
    const [picker, setPicker] = useState<null | 'edit' | 'new'>(null);
    const [ticks, setTicks] = useState<TTick[]>([]);
    const [decimals, setDecimals] = useState(2);
    const [chart_error, setChartError] = useState('');
    const [offer, setOffer] = useState<TOffer | null>(null);
    const [form, setFormState] = useState<TForm>({ ...DEFAULT_FORM });
    const [proposal, setProposal] = useState<TProposal>({ loading: true });
    const [positions, setPositions] = useState<TPosition[]>([]);
    const [buying, setBuying] = useState(false);
    const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
    const [how_to, setHowTo] = useState(false);
    const [drawer, setDrawer] = useState<null | 'positions'>(null);
    const [panel_open, setPanelOpen] = useState(true);
    const [dark, setDarkState] = useState(() => {
        try {
            return localStorage.getItem('ts-trader-theme') === 'dark';
        } catch {
            return false;
        }
    });
    const setDark = (next: boolean | ((d: boolean) => boolean)) =>
        setDarkState(prev => {
            const value = typeof next === 'function' ? next(prev) : next;
            try {
                localStorage.setItem('ts-trader-theme', value ? 'dark' : 'light');
            } catch {
                /* theme lasts for the visit only */
            }
            return value;
        });
    const [now, setNow] = useState(Date.now());

    const follow_stops = useRef(new Map<number, () => void>());
    const toast_timer = useRef<ReturnType<typeof setTimeout>>();

    const tab = tabs.find(t => t.id === active) ?? tabs[0];
    const type = getTradeType(tab.trade_type);
    const side = type.sides.find(s => s.key === form.side) ?? type.sides[0];
    const market = markets.find(m => m.symbol === tab.symbol);
    const currency = client?.is_logged_in && client?.currency ? client.currency : 'USD';

    const notify = useCallback((text: string, error = false) => {
        setToast({ text, error });
        if (toast_timer.current) clearTimeout(toast_timer.current);
        toast_timer.current = setTimeout(() => setToast(null), 6000);
    }, []);

    const setForm = useCallback((patch: Partial<TForm>) => setFormState(prev => ({ ...prev, ...patch })), []);

    useEffect(() => {
        try {
            localStorage.setItem(TABS_KEY, JSON.stringify({ tabs, active }));
        } catch {
            /* tabs last for the visit only */
        }
    }, [tabs, active]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close every contract stream when leaving the page.
    useEffect(
        () => () => {
            follow_stops.current.forEach(stop => stop());
            follow_stops.current.clear();
            if (toast_timer.current) clearTimeout(toast_timer.current);
        },
        []
    );

    /* ----------------------------------------------------------- markets */
    useEffect(() => {
        if (!isReady()) return;
        loadMarkets()
            .then(setMarkets)
            .catch(error => notify(error.message, true));
    }, [conn, notify]);

    /* ------------------------------------------------- ticks for the chart */
    useEffect(() => {
        if (!isReady()) return undefined;
        let alive = true;
        let stop: (() => void) | null = null;
        setTicks([]);
        setChartError('');

        (async () => {
            try {
                const history = await send({ ticks_history: tab.symbol, end: 'latest', count: HISTORY, style: 'ticks' });
                if (!alive) return;
                const prices: number[] = history?.history?.prices || [];
                const times: number[] = history?.history?.times || [];
                if (Number.isFinite(history?.pip_size)) setDecimals(Number(history.pip_size));
                setTicks(times.map((epoch, i) => ({ epoch, quote: Number(prices[i]) })));

                stop = await subscribe({ ticks: tab.symbol }, 'tick', data => {
                    const tick = data?.tick;
                    if (!alive || !tick || tick.symbol !== tab.symbol) return;
                    if (Number.isFinite(tick.pip_size)) setDecimals(Number(tick.pip_size));
                    setTicks(prev =>
                        prev.length && prev[prev.length - 1].epoch >= tick.epoch
                            ? prev
                            : [...prev.slice(-(HISTORY - 1)), { epoch: tick.epoch, quote: Number(tick.quote) }]
                    );
                });
                if (!alive) stop();
            } catch (error) {
                if (alive) setChartError(error instanceof Error ? error.message : 'Could not load this market');
            }
        })();

        return () => {
            alive = false;
            stop?.();
        };
    }, [tab.symbol, conn]);

    /* ------------------------------------------- what this market offers */
    useEffect(() => {
        if (!isReady()) return undefined;
        let alive = true;
        setOffer(null);
        loadOffer(tab.symbol)
            .then(next => alive && setOffer(next))
            .catch(error => alive && notify(error.message, true));
        return () => {
            alive = false;
        };
    }, [tab.symbol, conn, notify]);

    // New trade type: first side, its default duration.
    useEffect(() => {
        const [duration, duration_unit] = type.default_duration;
        setFormState(prev => ({ ...prev, side: type.sides[0].key, duration, duration_unit }));
    }, [type]);

    // Keep the choices valid for this market (Deriv's defaults where we have them).
    useEffect(() => {
        if (!offer) return;
        setFormState(prev => {
            const next = { ...prev };
            const row = offerRow(offer, side.contract_type);
            // The default barrier for the duration family in use (ticks, intraday or daily).
            const timed_row = offerRow(offer, side.contract_type, prev.duration_unit);
            if (type.uses_barrier && timed_row?.barrier) next.barrier = timed_row.barrier;
            if (type.uses_two_barriers && timed_row?.high_barrier) {
                next.barrier_high = timed_row.high_barrier;
                if (timed_row.low_barrier) next.barrier_low = timed_row.low_barrier;
            }
            if (type.uses_growth_rate) {
                const rates: number[] = offerRow(offer, 'ACCU')?.growth_rate_range ?? [];
                if (rates.length && !rates.includes(prev.growth_rate)) next.growth_rate = rates.includes(0.03) ? 0.03 : rates[0];
            }
            if (type.uses_multiplier) {
                const range: number[] = row?.multiplier_range ?? [];
                if (range.length && !range.includes(prev.multiplier)) next.multiplier = range.includes(100) ? 100 : range[0];
            }
            if (type.uses_payout_per_point) {
                const choices: number[] = timed_row?.payout_choices ?? [];
                if (choices.length && !choices.includes(prev.payout_per_point)) {
                    next.payout_per_point = choices[Math.floor(choices.length / 2)];
                }
            }
            if (type.uses_strike) {
                const choices: string[] = timed_row?.barrier_choices ?? [];
                if (choices.length && !choices.includes(prev.strike)) next.strike = timed_row?.barrier ?? choices[0];
            }
            if (type.uses_digit && !(side.contract_type === 'DIGITOVER' ? prev.digit <= 8 : side.contract_type === 'DIGITUNDER' ? prev.digit >= 1 : true)) {
                next.digit = 5;
            }
            return next;
        });
    }, [offer, type, side.contract_type, form.duration_unit]);

    const offered = !offer || type.sides.every(s => offer.types.has(s.contract_type));

    /* ------------------------------------------------------ live proposal */
    const params_key = JSON.stringify(buildParameters(type, side, form, tab.symbol, currency));

    useEffect(() => {
        if (!isReady() || !offer) return undefined;
        if (!offered) {
            setProposal({
                error: `${type.label} is not offered on ${market?.name ?? tab.symbol}. Choose another market or trade type.`,
            });
            return undefined;
        }
        let alive = true;
        let stop: (() => void) | null = null;
        setProposal(prev => ({ ...prev, loading: true, error: undefined }));

        const timer = setTimeout(async () => {
            try {
                stop = await subscribe({ proposal: 1, ...JSON.parse(params_key) }, 'proposal', data => {
                    if (!alive) return;
                    if (data?.error) {
                        setProposal({ error: data.error.message });
                        return;
                    }
                    const p = data?.proposal;
                    if (!p) return;
                    setProposal({
                        id: p.id,
                        ask_price: Number(p.ask_price),
                        payout: Number(p.payout),
                        longcode: p.longcode,
                        details: p.contract_details,
                        limit_order: p.limit_order,
                        commission: p.commission,
                        payout_per_point: p.display_number_of_contracts,
                    });
                });
                if (!alive) stop();
            } catch (error) {
                if (alive) setProposal({ error: error instanceof Error ? error.message : 'No price for this trade' });
            }
        }, 300);

        return () => {
            alive = false;
            clearTimeout(timer);
            stop?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params_key, offer, offered, conn]);

    /* ------------------------------------------------------- positions */
    const updatePosition = useCallback((contract_id: number, patch: Partial<TPosition>) => {
        setPositions(prev => prev.map(p => (p.contract_id === contract_id ? { ...p, ...patch } : p)));
    }, []);

    const follow = useCallback(
        async (contract_id: number) => {
            try {
                const stop = await subscribe({ proposal_open_contract: 1, contract_id }, 'proposal_open_contract', data => {
                    const c = data?.proposal_open_contract;
                    if (!c || Number(c.contract_id) !== contract_id) return;
                    transactions.onBotContractEvent(c);
                    const profit = Number(c.profit || 0);
                    const status: TPosition['status'] = !c.is_sold
                        ? 'open'
                        : c.status === 'won' || (c.status !== 'lost' && profit > 0)
                          ? 'won'
                          : c.status === 'lost' || profit < 0
                            ? 'lost'
                            : 'sold';
                    updatePosition(contract_id, {
                        profit,
                        status,
                        can_sell: Boolean(c.is_valid_to_sell),
                        entry_spot: c.entry_spot !== undefined ? Number(c.entry_spot) : undefined,
                    });
                    if (c.is_sold) {
                        follow_stops.current.get(contract_id)?.();
                        follow_stops.current.delete(contract_id);
                    }
                });
                follow_stops.current.set(contract_id, stop);
            } catch (error) {
                notify(error instanceof Error ? error.message : 'Lost track of a contract', true);
            }
        },
        [notify, transactions, updatePosition]
    );

    /* ------------------------------------------------------------- buying */
    const buy = useCallback(async () => {
        if (!client?.is_logged_in) {
            notify('Log in to your Deriv account to buy contracts.', true);
            return;
        }
        if (buying) return;
        setBuying(true);
        const parameters = JSON.parse(params_key);
        try {
            let response;
            try {
                response = proposal.id
                    ? await send({ buy: proposal.id, price: Number(proposal.ask_price ?? form.stake) })
                    : await send({ buy: '1', price: Number(form.stake), parameters });
            } catch (error: any) {
                // The quote can expire between ticks; buy on the parameters instead.
                if (!proposal.id || !RETRY_CODES.includes(error?.code)) throw error;
                response = await send({ buy: '1', price: Number(form.stake), parameters });
            }

            const bought = response?.buy;
            const contract_id = Number(bought?.contract_id);
            if (!contract_id) throw new Error('The purchase did not return a contract.');

            setPositions(prev => [
                {
                    contract_id,
                    contract_type: parameters.contract_type,
                    label: type.sides.length > 1 ? `${side.label} · ${type.label}` : type.label,
                    tone: side.tone,
                    symbol: tab.symbol,
                    symbol_name: market?.name ?? tab.symbol,
                    buy_price: Number(bought.buy_price),
                    profit: 0,
                    status: 'open',
                    can_sell: false,
                    longcode: bought.longcode,
                },
                ...prev,
            ]);

            transactions.onBotContractEvent({
                contract_id,
                transaction_ids: { buy: bought.transaction_id },
                buy_price: bought.buy_price,
                currency,
                contract_type: parameters.contract_type,
                underlying: tab.symbol,
                display_name: market?.name ?? tab.symbol,
                date_start: Math.floor(Date.now() / 1000),
                status: 'open',
            } as never);

            notify(`Contract bought: ${bought.longcode || type.label}`);
            follow(contract_id);
        } catch (error) {
            notify(error instanceof Error ? error.message : 'The purchase failed', true);
        } finally {
            setBuying(false);
        }
    }, [buying, client?.is_logged_in, currency, follow, form.stake, market?.name, notify, params_key, proposal, side, tab.symbol, transactions, type]);

    const sell = useCallback(
        async (contract_id: number) => {
            updatePosition(contract_id, { selling: true });
            try {
                const response = await send({ sell: contract_id, price: 0 });
                notify(`Contract closed for ${Number(response?.sell?.sold_for ?? 0).toFixed(2)} ${currency}`);
            } catch (error) {
                notify(error instanceof Error ? error.message : 'Could not close the contract', true);
            } finally {
                updatePosition(contract_id, { selling: false });
            }
        },
        [currency, notify, updatePosition]
    );

    /* -------------------------------------------------------------- tabs */
    const pick = useCallback(
        (trade_type: TTradeTypeId, symbol: string, done: boolean) => {
            setTabState(prev => {
                if (picker === 'new' && prev.tabs.length < MAX_TABS) {
                    const id = `tab-${Date.now()}`;
                    return { tabs: [...prev.tabs, { id, symbol, trade_type }], active: id };
                }
                return {
                    ...prev,
                    tabs: prev.tabs.map(t => (t.id === prev.active ? { ...t, symbol, trade_type } : t)),
                };
            });
            if (done) setPicker(null);
        },
        [picker]
    );

    const closeTab = (id: string) =>
        setTabState(prev => {
            if (prev.tabs.length < 2) return prev;
            const tabs_left = prev.tabs.filter(t => t.id !== id);
            return { tabs: tabs_left, active: prev.active === id ? tabs_left[tabs_left.length - 1].id : prev.active };
        });

    /* --------------------------------------------------------- derived */
    const digit_stats = useMemo(() => {
        if (!ticks.length) return [];
        const counts = new Array(10).fill(0);
        ticks.forEach(t => counts[lastDigit(t.quote, decimals)]++);
        return counts.map(c => (c / ticks.length) * 100);
    }, [ticks, decimals]);

    const last_quote = ticks.length ? ticks[ticks.length - 1].quote : null;
    const last_digit = last_quote === null ? null : lastDigit(last_quote, decimals);

    const chart_lines = useMemo(() => {
        const lines: TChartLine[] = [];
        // A barrier is either an offset from the spot (+0.38) or an absolute price.
        const addBarrier = (text: string, label: string) => {
            if (last_quote === null) return;
            const value = Number(text);
            if (/^[+-]/.test(text.trim()) && Number.isFinite(value)) {
                lines.push({ value: last_quote + value, label, tone: 'barrier' });
            } else if (Number.isFinite(value) && value > 0) {
                lines.push({ value, label, tone: 'barrier' });
            }
        };
        if (type.uses_barrier) addBarrier(form.barrier, 'Barrier');
        if (type.uses_two_barriers) {
            addBarrier(form.barrier_high, 'High barrier');
            addBarrier(form.barrier_low, 'Low barrier');
        }
        const details = proposal.details || {};
        if ((type.id === 'turbos' || type.id === 'vanillas') && Number(details.barrier)) {
            lines.push({ value: Number(details.barrier), label: type.id === 'turbos' ? 'Barrier' : 'Strike', tone: 'barrier' });
        }
        if (type.id === 'accumulators' && Number(details.high_barrier) && Number(details.low_barrier)) {
            lines.push({ value: Number(details.high_barrier), label: 'High barrier', tone: 'barrier' });
            lines.push({ value: Number(details.low_barrier), label: 'Low barrier', tone: 'barrier' });
        }
        positions
            .filter(p => p.status === 'open' && p.symbol === tab.symbol && p.entry_spot)
            .slice(0, 3)
            .forEach(p =>
                lines.push({
                    value: Number(p.entry_spot),
                    label: `Entry · ${p.label}`,
                    tone: p.tone === 'up' ? 'entry-up' : 'entry-down',
                })
            );
        return lines;
    }, [form.barrier, form.barrier_high, form.barrier_low, last_quote, positions, proposal.details, tab.symbol, type]);

    let trade_hint = '';
    if (!client?.is_logged_in) trade_hint = 'Prices are live. Log in to your Deriv account to buy contracts.';
    else if (market && !market.is_open) trade_hint = `${market.name} is closed right now.`;

    const account_label = client?.is_logged_in ? (client.is_virtual ? 'Demo account' : 'Real account') : '';
    const open_here = positions.filter(p => p.status === 'open' && p.symbol === tab.symbol).slice(0, 3);
    const open_count = positions.filter(p => p.status === 'open').length;

    /* -------------------------------------------------- sidebar actions */
    const goHome = () => dashboard?.setActiveTab?.(DBOT_TABS.DASHBOARD);
    const goBotBuilder = () => dashboard?.setActiveTab?.(DBOT_TABS.BOT_BUILDER);
    const openReports = () => {
        run_panel?.toggleDrawer?.(true);
        run_panel?.setActiveTabIndex?.(1);
    };
    const authRedirect = async (prompt?: string) => {
        try {
            const url = await generateOAuthURL(prompt);
            if (url) window.location.replace(url);
            else notify('Log in is not available yet. Please try again shortly.', true);
        } catch {
            notify('Could not open the Deriv login. Please try again.', true);
        }
    };
    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
        else root.current?.requestFullscreen?.().catch(() => undefined);
    };
    const deposit = () => window.open(standalone_routes.cashier_deposit, '_blank', 'noopener,noreferrer');

    /* ------------------------------------------------------------ render */
    return (
        <div className={`manual-trader ${dark ? 'mt-theme-dark' : ''}`} ref={root}>
            {/* Deriv Trader's left navigation */}
            <nav className='mt-side' aria-label='Trader navigation'>
                <span className='mt-side__logo' title={getAppName()}>
                    <img src={LOGO_CANDIDATES[0]} alt={getAppName()} />
                </span>
                <SideItem label='Home' onClick={goHome}>
                    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                        <path d='m3 11 9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5' />
                    </svg>
                </SideItem>
                <SideItem label='Positions' onClick={() => setDrawer(d => (d === 'positions' ? null : 'positions'))} active={drawer === 'positions'} badge={open_count}>
                    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                        <circle cx='12' cy='12' r='8.5' />
                        <path d='M12 7v5l3.5 2' />
                    </svg>
                </SideItem>
                <SideItem label='Reports' onClick={openReports}>
                    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                        <path d='M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6' />
                    </svg>
                </SideItem>
                <span className='mt-side__rule' />
                <SideItem label='Help' onClick={() => setHowTo(true)}>
                    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                        <circle cx='12' cy='12' r='8.5' />
                        <circle cx='12' cy='12' r='3.5' />
                        <path d='m6 6 3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5' />
                    </svg>
                </SideItem>
                <SideItem label='Theme' onClick={() => setDark(d => !d)} active={dark}>
                    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                        <path d='M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z' />
                    </svg>
                </SideItem>
                {client?.is_logged_in ? (
                    <SideItem label='Log out' onClick={() => logout()}>
                        <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                            <path d='M10 4H5v16h5M14 8l4 4-4 4M18 12H9' />
                        </svg>
                    </SideItem>
                ) : (
                    <SideItem label='Log in' onClick={() => authRedirect()}>
                        <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'>
                            <path d='M14 4h5v16h-5M10 8l4 4-4 4M14 12H4' />
                        </svg>
                    </SideItem>
                )}
            </nav>

            <div className='mt-main'>
                <header className='mt-top'>
                    <div className='mt-tabs'>
                        <button
                            type='button'
                            className='mt-tabs__add'
                            onClick={() => setPicker('new')}
                            disabled={tabs.length >= MAX_TABS}
                            aria-label='Open another market'
                            title={tabs.length >= MAX_TABS ? `Up to ${MAX_TABS} tabs` : 'Open another market'}
                        >
                            +
                        </button>
                        <div className='mt-tabs__list'>
                            {tabs.map(t => {
                                const m = markets.find(x => x.symbol === t.symbol);
                                const is_active = t.id === tab.id;
                                return (
                                    <div key={t.id} className={`mt-tab ${is_active ? 'is-active' : ''}`}>
                                        <button
                                            type='button'
                                            className='mt-tab__main'
                                            onClick={() => (is_active ? setPicker('edit') : setTabState(prev => ({ ...prev, active: t.id })))}
                                            title={is_active ? 'Change trade type or market' : undefined}
                                        >
                                            {m && <MarketIcon market={m} />}
                                            <span className='mt-tab__text'>
                                                <span className='mt-tab__name'>{m?.name ?? t.symbol}</span>
                                                <span className='mt-tab__type'>
                                                    {getTradeType(t.trade_type).label}
                                                    {is_active && (
                                                        <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4'>
                                                            <path d='m6 9 6 6 6-6' />
                                                        </svg>
                                                    )}
                                                </span>
                                            </span>
                                        </button>
                                        {tabs.length > 1 && (
                                            <button type='button' className='mt-tab__close' onClick={() => closeTab(t.id)} aria-label={`Close ${m?.name ?? t.symbol}`}>
                                                ×
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className='mt-account'>
                        {client?.is_logged_in ? (
                            <>
                                <span className='mt-account__info'>
                                    <span className={`mt-account__type ${client.is_virtual ? 'is-demo' : ''}`}>
                                        {account_label}
                                        <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4'>
                                            <path d='m6 9 6 6 6-6' />
                                        </svg>
                                    </span>
                                    <span className='mt-account__balance'>
                                        {Number(client.balance || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        {currency}
                                    </span>
                                </span>
                                <button type='button' className='mt-account__deposit' onClick={deposit}>
                                    Deposit
                                </button>
                            </>
                        ) : (
                            <>
                                <button type='button' className='mt-account__login' onClick={() => authRedirect()}>
                                    Log in
                                </button>
                                <button type='button' className='mt-account__deposit' onClick={() => authRedirect('registration')}>
                                    Sign up
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <div className='mt-body'>
                    <section className='mt-stage'>
                        {chart_error ? (
                            <div className='mt-stage__error'>{chart_error}</div>
                        ) : (
                            <TickChart ticks={ticks} decimals={decimals} lines={chart_lines} title={`${market?.name ?? tab.symbol}`} />
                        )}

                        {/* Open contracts on this market, as Deriv Trader shows them over the chart. */}
                        {open_here.length > 0 && (
                            <div className='mt-cards'>
                                {open_here.map(p => (
                                    <div key={p.contract_id} className={`mt-card mt-card--${p.tone}`}>
                                        <span className='mt-card__type'>{p.label}</span>
                                        <span className={`mt-card__pnl ${p.profit >= 0 ? 'is-up' : 'is-down'}`}>
                                            {p.profit >= 0 ? '+' : ''}
                                            {money(p.profit, currency)}
                                        </span>
                                        {p.can_sell && (
                                            <button type='button' className='mt-card__close' disabled={p.selling} onClick={() => sell(p.contract_id)}>
                                                {p.selling ? '…' : 'Close'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {picker && markets.length > 0 && (
                            <MarketPicker
                                markets={markets}
                                trade_type={tab.trade_type}
                                symbol={picker === 'new' ? '' : tab.symbol}
                                onPick={pick}
                                onClose={() => setPicker(null)}
                            />
                        )}

                        {toast && (
                            <div className={`mt-toast ${toast.error ? 'is-error' : ''}`} role='status'>
                                {toast.text}
                                <button type='button' onClick={() => setToast(null)} aria-label='Dismiss'>
                                    ×
                                </button>
                            </div>
                        )}
                    </section>

                    {panel_open && (
                        <TradePanel
                            type={type}
                            side={side}
                            form={form}
                            setForm={setForm}
                            offer={offer}
                            proposal={proposal}
                            currency={currency}
                            digit_stats={digit_stats}
                            last_digit={last_digit}
                            can_trade={offered && Boolean(market?.is_open ?? true)}
                            trade_hint={trade_hint}
                            buying={buying}
                            onBuy={buy}
                            onHowTo={() => setHowTo(true)}
                            onFullscreen={toggleFullscreen}
                            now={now}
                        />
                    )}

                    {/* Deriv Trader's right-hand rail: trade parameters and bots */}
                    <div className='mt-rail'>
                        <button
                            type='button'
                            className={`mt-rail__btn ${panel_open ? 'is-active' : ''}`}
                            onClick={() => setPanelOpen(o => !o)}
                            title={panel_open ? 'Hide trade parameters' : 'Show trade parameters'}
                            aria-label='Trade parameters'
                            aria-pressed={panel_open}
                        >
                            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                                <rect x='3.5' y='3.5' width='17' height='17' rx='3' />
                                <path d='M9 7.5v9M15 7.5v9M7 10h4M13 14h4' />
                            </svg>
                        </button>
                        <button type='button' className='mt-rail__btn' onClick={goBotBuilder} title='Open the bot builder' aria-label='Bots'>
                            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
                                <rect x='4.5' y='8' width='15' height='11' rx='3' />
                                <path d='M12 8V5M9.5 13v1M14.5 13v1M2.5 12.5v2M21.5 12.5v2' />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {drawer === 'positions' && (
                <div className='mt-drawer' role='dialog' aria-label='Positions'>
                    <div className='mt-drawer__head'>
                        <h3>Positions</h3>
                        <button type='button' onClick={() => setDrawer(null)} aria-label='Close positions'>
                            ×
                        </button>
                    </div>
                    <PositionsList positions={positions} currency={currency} onSell={sell} />
                </div>
            )}

            {how_to && (
                <div className='mt-modal' role='dialog' aria-modal='true' aria-label={`How to trade ${type.label}`}>
                    <button type='button' className='mt-modal__backdrop' aria-label='Close' onClick={() => setHowTo(false)} />
                    <div className='mt-modal__card'>
                        <div className='mt-modal__head'>
                            <h3>How to trade {type.label}</h3>
                            <button type='button' onClick={() => setHowTo(false)} aria-label='Close'>
                                ×
                            </button>
                        </div>
                        <ul>
                            {type.how.map(line => (
                                <li key={line}>{line}</li>
                            ))}
                        </ul>
                        {proposal.longcode && <p className='mt-modal__longcode'>{proposal.longcode}</p>}
                    </div>
                </div>
            )}
        </div>
    );
});

export default ManualTrader;
