import { useCallback, useEffect, useRef, useState } from 'react';

import { api_base } from '@/external/bot-skeleton';

export type TAutoContract = {
    contract_type: 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF' | 'CALL' | 'PUT';
    /** Digit barrier for over/under/match/differ. */
    barrier?: number;
};

export type TAutoSettings = {
    symbol: string | null;
    /** Contract duration in ticks. */
    ticks: number;
    stake: number;
    martingale: number;
    currency: string;
};

export type TAutoStats = {
    trades: number;
    wins: number;
    losses: number;
    profit: number;
    next_stake: number;
};

const MIN_STAKE = 0.35;
const REQUEST_TIMEOUT_MS = 15000;
const CONTRACT_TIMEOUT_MS = 120000;

const EMPTY_STATS = (stake: number): TAutoStats => ({ trades: 0, wins: 0, losses: 0, profit: 0, next_stake: stake });

type TApi = {
    connection?: { readyState?: number };
    send: (request: unknown) => Promise<any>;
    forget: (id: string) => Promise<any>;
    onMessage: () => { subscribe: (cb: (value: any) => void) => { unsubscribe: () => void } };
};

const getApi = (): TApi | null => (api_base as unknown as { api: TApi | null }).api ?? null;

const send = async (request: Record<string, unknown>) => {
    const api = getApi();
    if (!api || api.connection?.readyState !== 1) throw new Error('Not connected to Deriv.');
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Deriv did not respond in time.')), REQUEST_TIMEOUT_MS)
    );
    let response: any;
    try {
        response = await Promise.race([api.send(request), timeout]);
    } catch (error: any) {
        response = error?.error ? error : { error: { message: error?.message } };
    }
    if (response?.error) throw new Error(response.error.message ?? 'Deriv rejected the request.');
    return response;
};

/** Resolves with the contract's final profit once Deriv marks it sold. */
const waitForSettlement = (contract_id: number): Promise<number> =>
    new Promise((resolve, reject) => {
        const api = getApi();
        if (!api) {
            reject(new Error('Not connected to Deriv.'));
            return;
        }
        let subscription_id: string | null = null;
        let settled = false;

        const finish = (profit: number | null, error?: Error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            message_sub.unsubscribe();
            if (subscription_id) api.forget(subscription_id).catch(() => undefined);
            if (error) reject(error);
            else resolve(profit ?? 0);
        };

        const handle = (poc: any) => {
            if (!poc || Number(poc.contract_id) !== contract_id) return;
            if (poc.is_sold) finish(Number(poc.profit ?? 0));
        };

        const timer = setTimeout(() => finish(null, new Error('Contract did not settle in time.')), CONTRACT_TIMEOUT_MS);

        const message_sub = api.onMessage().subscribe(({ data }: any) => {
            if (data?.msg_type !== 'proposal_open_contract') return;
            if (data.subscription?.id) subscription_id = data.subscription.id;
            handle(data.proposal_open_contract);
        });

        send({ proposal_open_contract: 1, contract_id, subscribe: 1 })
            .then(response => {
                if (response?.subscription?.id) subscription_id = response.subscription.id;
                handle(response?.proposal_open_contract);
            })
            .catch(error => finish(null, error));
    });

/**
 * One auto-trading loop for one card: when `shouldTrade` returns a contract on
 * a fresh tick, it buys it, waits for settlement, then applies martingale.
 * Only one contract is ever open per card.
 */
export const useAutoTrader = (settings: TAutoSettings) => {
    const [is_running, setIsRunning] = useState(false);
    const [is_busy, setIsBusy] = useState(false);
    const [status, setStatus] = useState<string>('Waiting...');
    const [stats, setStats] = useState<TAutoStats>(EMPTY_STATS(settings.stake));

    const running_ref = useRef(false);
    const busy_ref = useRef(false);
    const stake_ref = useRef(settings.stake);
    const settings_ref = useRef(settings);
    settings_ref.current = settings;

    useEffect(() => {
        if (!running_ref.current) {
            stake_ref.current = settings.stake;
            setStats(prev => ({ ...prev, next_stake: settings.stake }));
        }
    }, [settings.stake]);

    const start = useCallback(() => {
        const { stake, symbol } = settings_ref.current;
        if (!symbol) {
            setStatus('Select a market first.');
            return;
        }
        if (!(stake >= MIN_STAKE)) {
            setStatus(`Stake must be at least ${MIN_STAKE}.`);
            return;
        }
        stake_ref.current = stake;
        setStats(EMPTY_STATS(stake));
        running_ref.current = true;
        setIsRunning(true);
        setStatus('Running - waiting for the condition...');
    }, []);

    const stop = useCallback(() => {
        running_ref.current = false;
        setIsRunning(false);
        setStatus(busy_ref.current ? 'Stopping after the open contract settles...' : 'Stopped.');
    }, []);

    useEffect(
        () => () => {
            running_ref.current = false;
        },
        []
    );

    /** Call on every new tick with the contract to buy, or null to wait. */
    const onTick = useCallback(async (contract: TAutoContract | null) => {
        if (!running_ref.current || busy_ref.current || !contract) return;
        const { symbol, ticks, martingale, currency } = settings_ref.current;
        if (!symbol) return;

        busy_ref.current = true;
        setIsBusy(true);
        const amount = Math.max(MIN_STAKE, Number(stake_ref.current.toFixed(2)));

        try {
            setStatus(`Buying ${contract.contract_type} at ${amount.toFixed(2)} ${currency}...`);
            const proposal = await send({
                proposal: 1,
                amount,
                basis: 'stake',
                contract_type: contract.contract_type,
                currency,
                duration: Math.max(1, Math.trunc(ticks)),
                duration_unit: 't',
                // Options API field name (legacy `symbol` was renamed).
                underlying_symbol: symbol,
                ...(contract.barrier !== undefined ? { barrier: String(contract.barrier) } : {}),
            });
            const proposal_id = proposal?.proposal?.id;
            if (!proposal_id) throw new Error('Deriv returned no price for this contract.');

            const bought = await send({ buy: proposal_id, price: Number(proposal.proposal.ask_price ?? amount) });
            const contract_id = Number(bought?.buy?.contract_id);
            if (!contract_id) throw new Error('Purchase was not confirmed.');

            setStatus('Contract open - waiting for the result...');
            const profit = await waitForSettlement(contract_id);
            const won = profit > 0;

            stake_ref.current = won ? settings_ref.current.stake : amount * Math.max(1, martingale);
            setStats(prev => ({
                trades: prev.trades + 1,
                wins: prev.wins + (won ? 1 : 0),
                losses: prev.losses + (won ? 0 : 1),
                profit: Number((prev.profit + profit).toFixed(2)),
                next_stake: Number(stake_ref.current.toFixed(2)),
            }));
            setStatus(
                `${won ? 'Won' : 'Lost'} ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} ${currency}${
                    running_ref.current ? ' - waiting for the next signal...' : ''
                }`
            );
        } catch (error) {
            running_ref.current = false;
            setIsRunning(false);
            setStatus(`Stopped: ${error instanceof Error ? error.message : 'trade failed.'}`);
        } finally {
            busy_ref.current = false;
            setIsBusy(false);
            if (!running_ref.current) setStatus(prev => (prev.startsWith('Stopped') ? prev : 'Stopped.'));
        }
    }, []);

    return { is_running, is_busy, status, stats, start, stop, onTick };
};
