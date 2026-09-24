/**
 * Manual trading against the Deriv Options API, in the order Deriv's own
 * guidance sets out: symbol list, then public prices, then account and trading.
 *
 * - Market list and contract availability: `active_symbols`, `contracts_for`
 * - Streaming prices: `proposal` with `subscribe: 1`
 * - Trading: `buy`, `sell`
 * - Account: `balance`, `portfolio`, `proposal_open_contract`
 *
 * Field names follow the Options API schema (e.g. `underlying_symbol`, not
 * `symbol`), and every request goes through the app's authenticated socket, so
 * the tab shares the session the rest of the site already holds.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api_base } from '@/external/bot-skeleton';

/* -------------------------------------------------------------------- types */

export type TTradeFamily = 'rise_fall' | 'higher_lower' | 'even_odd' | 'over_under' | 'matches_differs';

export type TSide = 'left' | 'right';

export type TContractType =
    | 'CALL'
    | 'PUT'
    | 'DIGITEVEN'
    | 'DIGITODD'
    | 'DIGITOVER'
    | 'DIGITUNDER'
    | 'DIGITMATCH'
    | 'DIGITDIFF';

export type TPriceQuote = {
    id: string | null;
    ask_price: number;
    payout: number;
    spot: number | null;
    /** Deriv's own description of the contract, straight from the proposal. */
    longcode: string;
};

export type TPosition = {
    contract_id: number;
    longcode: string;
    contract_type: string;
    buy_price: number;
    payout: number;
    profit: number;
    /** Present once Deriv reports the contract can be sold back. */
    sell_price: number | null;
    is_sold: boolean;
    is_valid_to_sell: boolean;
    currency: string;
    entry_spot: number | null;
    current_spot: number | null;
};

type TFamilyMeta = {
    label: string;
    left: { label: string; type: TContractType };
    right: { label: string; type: TContractType };
    /** A digit barrier (0-9) applies. */
    needs_digit: boolean;
    /** Duration is always a single tick. */
    tick_only: boolean;
};

export const FAMILIES: Record<TTradeFamily, TFamilyMeta> = {
    rise_fall: {
        label: 'Rise/Fall',
        left: { label: 'Rise', type: 'CALL' },
        right: { label: 'Fall', type: 'PUT' },
        needs_digit: false,
        tick_only: false,
    },
    higher_lower: {
        label: 'Higher/Lower',
        left: { label: 'Higher', type: 'CALL' },
        right: { label: 'Lower', type: 'PUT' },
        needs_digit: false,
        tick_only: false,
    },
    even_odd: {
        label: 'Even/Odd',
        left: { label: 'Even', type: 'DIGITEVEN' },
        right: { label: 'Odd', type: 'DIGITODD' },
        needs_digit: false,
        tick_only: true,
    },
    over_under: {
        label: 'Over/Under',
        left: { label: 'Over', type: 'DIGITOVER' },
        right: { label: 'Under', type: 'DIGITUNDER' },
        needs_digit: true,
        tick_only: true,
    },
    matches_differs: {
        label: 'Matches/Differs',
        left: { label: 'Matches', type: 'DIGITMATCH' },
        right: { label: 'Differs', type: 'DIGITDIFF' },
        needs_digit: true,
        tick_only: true,
    },
};

const STORAGE_KEY = 'manual-trader-v2';
const MIN_STAKE = 0.35;
const MAX_STAKE = 50000;

/* ---------------------------------------------------------------- api calls */

const send = async (request: Record<string, unknown>, timeout_ms = 12000) => {
    if (!api_base.api) throw new Error('Not connected to Deriv');
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Deriv did not answer in time')), timeout_ms)
    );
    return (await Promise.race([(api_base.api as any).send(request), timeout])) as any;
};

const forget = (id?: string | null) => {
    if (id && api_base.api) {
        try {
            (api_base.api as any).forget(id);
        } catch {
            /* the stream is already gone */
        }
    }
};

/* --------------------------------------------------------------------- hook */

export const useManualTrader = (symbol: string | undefined) => {
    const [family, setFamily] = useState<TTradeFamily>('rise_fall');
    const [duration, setDuration] = useState(5);
    const [stake, setStake] = useState(1);
    const [digit, setDigit] = useState(5);
    const [available, setAvailable] = useState<Set<string> | null>(null);
    const [quotes, setQuotes] = useState<{ left: TPriceQuote | null; right: TPriceQuote | null }>({
        left: null,
        right: null,
    });
    const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
    const [positions, setPositions] = useState<TPosition[]>([]);
    const [busy_side, setBusySide] = useState<TSide | null>(null);
    const [selling, setSelling] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const price_streams = useRef<{ left: string | null; right: string | null }>({ left: null, right: null });
    const contract_streams = useRef<Map<number, string>>(new Map());
    const mounted = useRef(true);

    const meta = FAMILIES[family];
    const currency = balance?.currency || (api_base.account_info as any)?.currency || 'USD';
    const loginid = String((api_base.account_info as any)?.loginid ?? '');
    const is_logged_in = Boolean(loginid);
    // Deriv's virtual logins start VRT / VRTC / DOT.
    const is_demo = /^(VRT|VRTC|DOT)/i.test(loginid);
    const effective_duration = meta.tick_only ? 1 : duration;

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    /* ---------------------------------------------------------- preferences */

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
            if (!saved || typeof saved !== 'object') return;
            if (saved.family in FAMILIES) setFamily(saved.family);
            if (Number.isFinite(saved.stake)) setStake(Math.min(MAX_STAKE, Math.max(MIN_STAKE, saved.stake)));
            if (Number.isFinite(saved.duration)) setDuration(Math.min(10, Math.max(1, saved.duration)));
            if (Number.isFinite(saved.digit)) setDigit(Math.min(9, Math.max(0, saved.digit)));
        } catch {
            /* no stored preferences */
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ family, stake, duration, digit }));
        } catch {
            /* nothing to do */
        }
    }, [family, stake, duration, digit]);

    /* ----------------------------------------- which contracts this market has */

    useEffect(() => {
        if (!symbol) return;
        let cancelled = false;
        (async () => {
            try {
                // The Options API takes the symbol alone here.
                const response = await send({ contracts_for: symbol });
                if (cancelled || !mounted.current) return;
                const list = response?.contracts_for?.available ?? [];
                const types = new Set<string>(list.map((item: any) => String(item.contract_type)));
                setAvailable(types.size ? types : null);
            } catch {
                // Not fatal: without the list every family stays selectable and
                // an unsupported one simply fails to price.
                if (!cancelled && mounted.current) setAvailable(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [symbol]);

    /* ------------------------------------------------------ account balance */

    useEffect(() => {
        if (!is_logged_in) return undefined;
        let subscription_id: string | null = null;

        (async () => {
            try {
                const response = await send({ balance: 1, subscribe: 1 });
                if (!mounted.current) return;
                if (response?.subscription?.id) subscription_id = response.subscription.id;
                if (response?.balance) {
                    setBalance({
                        amount: Number(response.balance.balance),
                        currency: String(response.balance.currency),
                    });
                }
            } catch {
                /* the header still shows the balance */
            }
        })();

        return () => forget(subscription_id);
    }, [is_logged_in]);

    /* ------------------------------------------------- open positions on load */

    useEffect(() => {
        if (!is_logged_in) return;
        (async () => {
            try {
                const response = await send({ portfolio: 1 });
                if (!mounted.current) return;
                const contracts = response?.portfolio?.contracts ?? [];
                contracts.forEach((contract: any) => void follow(Number(contract.contract_id)));
            } catch {
                /* nothing to restore */
            }
        })();
        // follow is stable for the life of the hook.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [is_logged_in]);

    /* ------------------------------------------------ streaming price quotes */

    const proposalRequest = useCallback(
        (contract_type: TContractType) => ({
            proposal: 1,
            subscribe: 1,
            amount: Number(stake.toFixed(2)),
            basis: 'stake',
            contract_type,
            currency,
            duration: effective_duration,
            duration_unit: 't',
            underlying_symbol: symbol,
            ...(meta.needs_digit ? { barrier: String(digit) } : {}),
        }),
        [stake, currency, effective_duration, symbol, meta.needs_digit, digit]
    );

    useEffect(() => {
        if (!symbol || !api_base.api) return undefined;

        let cancelled = false;
        const started: string[] = [];
        setQuotes({ left: null, right: null });

        const read = (proposal: any): TPriceQuote => ({
            id: proposal.id ?? null,
            ask_price: Number(proposal.ask_price),
            payout: Number(proposal.payout),
            spot: proposal.spot === undefined ? null : Number(proposal.spot),
            longcode: String(proposal.longcode ?? ''),
        });

        // Live prices arrive on the shared message stream; match them to the
        // side that asked by request id.
        const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
            if (cancelled || !data || data.msg_type !== 'proposal') return;
            const side: TSide | null =
                data.echo_req?.req_id === 91 ? 'left' : data.echo_req?.req_id === 92 ? 'right' : null;
            if (!side) return;

            if (data.error) {
                setQuotes(prev => ({ ...prev, [side]: null }));
                setError(data.error.message ?? 'This contract cannot be priced.');
                return;
            }
            if (!data.proposal) return;
            if (data.subscription?.id) {
                price_streams.current[side] = data.subscription.id;
                started.push(data.subscription.id);
            }
            setError(null);
            setQuotes(prev => ({ ...prev, [side]: read(data.proposal) }));
        });

        void send({ ...proposalRequest(meta.left.type), req_id: 91 }).catch(() => undefined);
        void send({ ...proposalRequest(meta.right.type), req_id: 92 }).catch(() => undefined);

        return () => {
            cancelled = true;
            subscription.unsubscribe();
            started.forEach(forget);
            forget(price_streams.current.left);
            forget(price_streams.current.right);
            price_streams.current = { left: null, right: null };
        };
    }, [symbol, family, stake, effective_duration, digit, proposalRequest, meta.left.type, meta.right.type]);

    /* --------------------------------------------------- contract lifecycle */

    const applyContract = useCallback((contract: any) => {
        const id = Number(contract.contract_id);
        if (!id) return;
        const next: TPosition = {
            contract_id: id,
            longcode: String(contract.longcode ?? contract.display_name ?? ''),
            contract_type: String(contract.contract_type ?? ''),
            buy_price: Number(contract.buy_price ?? 0),
            payout: Number(contract.payout ?? 0),
            profit: Number(contract.profit ?? 0),
            sell_price: contract.bid_price === undefined ? null : Number(contract.bid_price),
            is_sold: Boolean(contract.is_sold),
            is_valid_to_sell: Boolean(contract.is_valid_to_sell),
            currency: String(contract.currency ?? 'USD'),
            entry_spot: contract.entry_spot === undefined ? null : Number(contract.entry_spot),
            current_spot: contract.current_spot === undefined ? null : Number(contract.current_spot),
        };

        setPositions(prev => {
            const index = prev.findIndex(position => position.contract_id === id);
            if (index === -1) return [next, ...prev];
            const copy = [...prev];
            copy[index] = next;
            return copy;
        });
    }, []);

    useEffect(() => {
        if (!api_base.api) return undefined;
        const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
            if (!data || data.error || data.msg_type !== 'proposal_open_contract') return;
            const contract = data.proposal_open_contract;
            if (!contract?.contract_id) return;
            if (data.subscription?.id) contract_streams.current.set(Number(contract.contract_id), data.subscription.id);
            applyContract(contract);
            if (contract.is_sold) {
                const id = Number(contract.contract_id);
                forget(contract_streams.current.get(id));
                contract_streams.current.delete(id);
            }
        });
        return () => subscription.unsubscribe();
    }, [applyContract]);

    /** Watch one contract until it settles. */
    const follow = useCallback(async (contract_id: number) => {
        try {
            await send({ proposal_open_contract: 1, contract_id, subscribe: 1 });
        } catch {
            /* it still settles; only live updates are missed */
        }
    }, []);

    /* ------------------------------------------------------------ buy / sell */

    const buy = useCallback(
        async (side: TSide) => {
            if (busy_side) return;
            if (!is_logged_in) {
                setError('Log in with your Deriv account to place a trade.');
                return;
            }

            const quote = quotes[side];
            setBusySide(side);
            setError(null);
            setNotice(null);

            try {
                // A streamed proposal id is single-use; if it has gone stale,
                // ask for a fresh price and buy that instead.
                const choice = side === 'left' ? meta.left : meta.right;
                let proposal_id = quote?.id ?? null;
                let price = quote?.ask_price ?? stake;

                if (!proposal_id) {
                    const fresh = await send({ ...proposalRequest(choice.type), subscribe: undefined });
                    if (fresh?.error) throw new Error(fresh.error.message);
                    proposal_id = fresh?.proposal?.id ?? null;
                    price = Number(fresh?.proposal?.ask_price ?? stake);
                }
                if (!proposal_id) throw new Error('Deriv did not return a price for this contract.');

                const bought = await send({ buy: proposal_id, price: Number(price) });
                if (bought?.error) throw new Error(bought.error.message);

                const contract_id = Number(bought?.buy?.contract_id);
                if (!contract_id) throw new Error('Deriv did not return a contract id.');

                applyContract({
                    contract_id,
                    longcode: bought.buy.longcode,
                    contract_type: choice.type,
                    buy_price: bought.buy.buy_price,
                    payout: bought.buy.payout,
                    profit: 0,
                    currency,
                });
                setNotice(`${choice.label} bought for ${Number(bought.buy.buy_price).toFixed(2)} ${currency}`);
                void follow(contract_id);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'The trade could not be placed.');
            } finally {
                if (mounted.current) setBusySide(null);
            }
        },
        [busy_side, is_logged_in, quotes, meta, stake, proposalRequest, applyContract, currency, follow]
    );

    const sell = useCallback(
        async (contract_id: number) => {
            if (selling) return;
            setSelling(contract_id);
            setError(null);
            try {
                // price 0 means "sell at whatever Deriv currently bids".
                const sold = await send({ sell: contract_id, price: 0 });
                if (sold?.error) throw new Error(sold.error.message);
                setNotice(`Sold for ${Number(sold?.sell?.sold_for ?? 0).toFixed(2)} ${currency}`);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'The contract could not be sold.');
            } finally {
                if (mounted.current) setSelling(null);
            }
        },
        [selling, currency]
    );

    const clearSettled = useCallback(() => setPositions(prev => prev.filter(position => !position.is_sold)), []);

    const families = useMemo(() => {
        const keys = Object.keys(FAMILIES) as TTradeFamily[];
        if (!available) return keys;
        // Keep a family only when Deriv lists both of its contract types.
        const supported = keys.filter(
            key => available.has(FAMILIES[key].left.type) && available.has(FAMILIES[key].right.type)
        );
        return supported.length ? supported : keys;
    }, [available]);

    useEffect(() => {
        if (families.length && !families.includes(family)) setFamily(families[0]);
    }, [families, family]);

    return {
        family,
        setFamily,
        families,
        meta,
        duration,
        setDuration,
        stake,
        setStake,
        digit,
        setDigit,
        quotes,
        balance,
        positions,
        open_positions: positions.filter(position => !position.is_sold),
        settled_positions: positions.filter(position => position.is_sold),
        clearSettled,
        buy,
        sell,
        busy_side,
        selling,
        error,
        notice,
        dismissNotice: () => setNotice(null),
        currency,
        is_logged_in,
        is_demo,
        min_stake: MIN_STAKE,
        max_stake: MAX_STAKE,
    };
};

export default useManualTrader;
