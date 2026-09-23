import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api_base } from '@/external/bot-skeleton';
import { getAnalysisSymbols, TAnalysisSymbol } from '@/utils/analysis';

/* --------------------------------------------------------------------- types */

export type TTradeFamily = 'rise_fall' | 'even_odd' | 'over_under' | 'matches_differs';

export type TSide = 'left' | 'right';

export type TContractType = 'CALL' | 'PUT' | 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';

export type TPosition = {
    contract_id: number;
    label: string;
    contract_type: TContractType;
    stake: number;
    payout: number;
    profit: number;
    currency: string;
    is_sold: boolean;
    bought_at: number;
    subscription_id?: string;
};

export type TQuote = { ask_price: number; payout: number } | null;

type TFamilyMeta = {
    label: string;
    left: { label: string; type: TContractType };
    right: { label: string; type: TContractType };
    /** Digit barrier applies to this family. */
    needs_barrier: boolean;
    /** Duration is fixed to one tick. */
    tick_only: boolean;
};

export const FAMILIES: Record<TTradeFamily, TFamilyMeta> = {
    rise_fall: {
        label: 'Rise/Fall',
        left: { label: 'Rise', type: 'CALL' },
        right: { label: 'Fall', type: 'PUT' },
        needs_barrier: false,
        tick_only: false,
    },
    even_odd: {
        label: 'Even/Odd',
        left: { label: 'Even', type: 'DIGITEVEN' },
        right: { label: 'Odd', type: 'DIGITODD' },
        needs_barrier: false,
        tick_only: true,
    },
    over_under: {
        label: 'Over/Under',
        left: { label: 'Over', type: 'DIGITOVER' },
        right: { label: 'Under', type: 'DIGITUNDER' },
        needs_barrier: true,
        tick_only: true,
    },
    matches_differs: {
        label: 'Matches/Differs',
        left: { label: 'Matches', type: 'DIGITMATCH' },
        right: { label: 'Differs', type: 'DIGITDIFF' },
        needs_barrier: true,
        tick_only: true,
    },
};

const STORAGE_KEY = 'manual-trader-prefs';
const MIN_STAKE = 0.35;

/* ----------------------------------------------------------------- api calls */

const send = async (request: Record<string, unknown>, timeout_ms = 12000) => {
    if (!api_base.api) throw new Error('Not connected to Deriv');
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Deriv did not answer in time')), timeout_ms));
    return (await Promise.race([(api_base.api as any).send(request), timeout])) as any;
};

/* ---------------------------------------------------------------------- hook */

export const useManualTrader = () => {
    const [symbols, setSymbols] = useState<TAnalysisSymbol[]>([]);
    const [symbol, setSymbol] = useState<string | null>(null);
    const [family, setFamily] = useState<TTradeFamily>('rise_fall');
    const [duration, setDuration] = useState(1);
    const [stake, setStake] = useState(1);
    const [barrier, setBarrier] = useState(5);
    const [quotes, setQuotes] = useState<{ left: TQuote; right: TQuote }>({ left: null, right: null });
    const [is_pricing, setPricing] = useState(false);
    const [busy_side, setBusySide] = useState<TSide | null>(null);
    const [positions, setPositions] = useState<TPosition[]>([]);
    const [error, setError] = useState<string | null>(null);
    const subscriptions = useRef<Map<number, string>>(new Map());
    const mounted = useRef(true);

    const meta = FAMILIES[family];
    const currency = (api_base.account_info as any)?.currency || 'USD';
    const is_logged_in = Boolean((api_base.account_info as any)?.loginid);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    /* preferences */
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
            if (!saved || typeof saved !== 'object') return;
            if (typeof saved.symbol === 'string') setSymbol(saved.symbol);
            if (saved.family in FAMILIES) setFamily(saved.family);
            if (Number.isFinite(saved.stake)) setStake(Math.max(MIN_STAKE, saved.stake));
            if (Number.isFinite(saved.duration)) setDuration(Math.min(10, Math.max(1, saved.duration)));
            if (Number.isFinite(saved.barrier)) setBarrier(Math.min(9, Math.max(0, saved.barrier)));
        } catch {
            /* no stored preferences */
        }
    }, []);

    useEffect(() => {
        if (!symbol) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ symbol, family, stake, duration, barrier }));
        } catch {
            /* nothing to do */
        }
    }, [symbol, family, stake, duration, barrier]);

    /* markets from Deriv */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await getAnalysisSymbols();
                if (cancelled) return;
                const open = list.filter(item => item.is_open);
                const usable = open.length ? open : list;
                setSymbols(usable);
                setSymbol(current => {
                    if (current && usable.some(item => item.symbol === current)) return current;
                    const synthetic = usable.find(item => /volatilit/i.test(item.display_name));
                    return (synthetic ?? usable[0])?.symbol ?? null;
                });
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load markets from Deriv.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const active_symbol = useMemo(() => symbols.find(item => item.symbol === symbol) ?? null, [symbols, symbol]);
    const effective_duration = meta.tick_only ? 1 : duration;

    const buildProposal = useCallback(
        (contract_type: TContractType) => ({
            proposal: 1,
            amount: Number(stake.toFixed(2)),
            basis: 'stake',
            contract_type,
            currency,
            duration: effective_duration,
            duration_unit: 't',
            // The Options API renamed proposal `symbol` -> `underlying_symbol`.
            underlying_symbol: symbol,
            ...(meta.needs_barrier ? { barrier: String(barrier) } : {}),
        }),
        [stake, currency, effective_duration, symbol, meta.needs_barrier, barrier]
    );

    /** Price both sides so the payout shows before anything is bought. */
    useEffect(() => {
        if (!symbol || !api_base.api) return;
        let cancelled = false;
        setPricing(true);

        (async () => {
            try {
                const [left, right] = await Promise.all([
                    send(buildProposal(meta.left.type)),
                    send(buildProposal(meta.right.type)),
                ]);
                if (cancelled || !mounted.current) return;

                const read = (response: any): TQuote =>
                    response?.error || !response?.proposal
                        ? null
                        : {
                              ask_price: Number(response.proposal.ask_price),
                              payout: Number(response.proposal.payout),
                          };

                setQuotes({ left: read(left), right: read(right) });
                const message = left?.error?.message || right?.error?.message || null;
                setError(message);
            } catch (e) {
                if (!cancelled && mounted.current) {
                    setQuotes({ left: null, right: null });
                    setError(e instanceof Error ? e.message : 'Could not price this contract.');
                }
            } finally {
                if (!cancelled && mounted.current) setPricing(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [symbol, family, stake, effective_duration, barrier, buildProposal, meta.left.type, meta.right.type]);

    /* live updates for open contracts */
    useEffect(() => {
        if (!api_base.api) return undefined;
        const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
            if (!data || data.error || data.msg_type !== 'proposal_open_contract') return;
            const contract = data.proposal_open_contract;
            if (!contract?.contract_id) return;
            if (data.subscription?.id) subscriptions.current.set(Number(contract.contract_id), data.subscription.id);

            setPositions(prev =>
                prev.map(position =>
                    position.contract_id === Number(contract.contract_id)
                        ? {
                              ...position,
                              profit: Number(contract.profit ?? position.profit),
                              payout: Number(contract.payout ?? position.payout),
                              is_sold: Boolean(contract.is_sold),
                          }
                        : position
                )
            );

            if (contract.is_sold) {
                const id = subscriptions.current.get(Number(contract.contract_id));
                if (id) {
                    (api_base.api as any)?.forget(id);
                    subscriptions.current.delete(Number(contract.contract_id));
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const buy = useCallback(
        async (side: TSide) => {
            if (!symbol || busy_side) return;
            if (!is_logged_in) {
                setError('Log in with your Deriv account to place a trade.');
                return;
            }

            const choice = side === 'left' ? meta.left : meta.right;
            setBusySide(side);
            setError(null);

            try {
                const proposal = await send(buildProposal(choice.type));
                if (proposal?.error) throw new Error(proposal.error.message);
                const proposal_id = proposal?.proposal?.id;
                if (!proposal_id) throw new Error('Deriv did not return a price for this contract.');

                const bought = await send({
                    buy: proposal_id,
                    // ask_price can arrive as a string on the Options API.
                    price: Number(proposal.proposal.ask_price ?? stake),
                });
                if (bought?.error) throw new Error(bought.error.message);

                const contract_id = Number(bought?.buy?.contract_id);
                if (!contract_id) throw new Error('Deriv did not return a contract id.');

                setPositions(prev => [
                    {
                        contract_id,
                        label: `${choice.label}${meta.needs_barrier ? ` ${barrier}` : ''}`,
                        contract_type: choice.type,
                        stake: Number(bought.buy.buy_price ?? stake),
                        payout: Number(bought.buy.payout ?? 0),
                        profit: 0,
                        currency,
                        is_sold: false,
                        bought_at: Date.now(),
                    },
                    ...prev,
                ]);

                await send({ proposal_open_contract: 1, contract_id, subscribe: 1 });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'The trade could not be placed.');
            } finally {
                if (mounted.current) setBusySide(null);
            }
        },
        [symbol, busy_side, is_logged_in, meta, buildProposal, stake, barrier, currency]
    );

    const clearClosed = useCallback(() => setPositions(prev => prev.filter(position => !position.is_sold)), []);

    return {
        symbols,
        symbol,
        setSymbol,
        active_symbol,
        family,
        setFamily,
        meta,
        duration,
        setDuration,
        stake,
        setStake,
        barrier,
        setBarrier,
        quotes,
        is_pricing,
        busy_side,
        buy,
        positions,
        clearClosed,
        error,
        currency,
        is_logged_in,
        min_stake: MIN_STAKE,
    };
};

export default useManualTrader;
