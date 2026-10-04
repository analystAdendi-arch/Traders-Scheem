/**
 * Manual Trader.
 *
 * A trade panel inside the site, on the Deriv API - the shape the bossiousfx
 * project uses for its Smart Trader (MIT, deriv.com): pick a volatility index
 * and a digit trade type, watch the last digits stream in, and buy. No frame
 * and no redirect, so the session is ours and the account is the one this site
 * is signed in as.
 *
 * Three faults in that original are not carried over:
 *  - its "Trade once" button started the same endless loop as auto trading, so
 *    it could never buy a single contract;
 *  - the loop bought again 500ms later whether or not the contract had settled;
 *  - it raised the stake with setStake() and then read the previous value from
 *    the render closure, so a martingale step never reached the buy.
 * Here one purchase is one purchase, auto trading waits for each contract to
 * close, and the stake is read from a ref.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import { contract_stages } from '@/constants/contract-stage';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import SceneFx from '@/components/scene-fx/SceneFx';
import './manual-trader.scss';

type TSymbol = { symbol: string; display_name: string };

const TRADE_TYPES = [
    { value: 'DIGITOVER', label: localize('Digits Over') },
    { value: 'DIGITUNDER', label: localize('Digits Under') },
    { value: 'DIGITEVEN', label: localize('Even') },
    { value: 'DIGITODD', label: localize('Odd') },
    { value: 'DIGITMATCH', label: localize('Matches') },
    { value: 'DIGITDIFF', label: localize('Differs') },
];

const NEEDS_BARRIER = ['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF'];

const clampDigit = (value: number) => Math.max(0, Math.min(9, Math.trunc(Number(value) || 0)));

const ManualTrader = observer(() => {
    const store = useStore();
    const { run_panel, transactions, client } = store;

    const tick_sub_id = useRef<string | null>(null);
    const tick_listener = useRef<((evt: MessageEvent) => void) | null>(null);
    const stop_requested = useRef(false);
    const is_mounted = useRef(true);
    // Read at purchase time rather than through a render closure.
    const stake_ref = useRef(0.5);
    const after_loss = useRef(false);

    const [symbols, setSymbols] = useState<TSymbol[]>([]);
    const [symbol, setSymbol] = useState('');
    const [trade_type, setTradeType] = useState('DIGITOVER');
    const [ticks, setTicks] = useState(1);
    const [stake, setStake] = useState(0.5);
    const [prediction, setPrediction] = useState(5);
    const [prediction_after_loss, setPredictionAfterLoss] = useState(5);
    const [martingale, setMartingale] = useState(1);

    const [digits, setDigits] = useState<number[]>([]);
    const [last_digit, setLastDigit] = useState<number | null>(null);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);

    const [is_running, setIsRunning] = useState(false);
    const [is_buying, setIsBuying] = useState(false);
    const [status, setStatus] = useState('');
    const [is_error, setIsError] = useState(false);

    useEffect(() => {
        stake_ref.current = stake;
    }, [stake]);

    const currency = client?.currency || 'USD';

    const say = useCallback((message: string, error = false) => {
        if (!is_mounted.current) return;
        setStatus(message);
        setIsError(error);
    }, []);

    /** Our own socket, already authorised for the signed-in account. */
    const send = useCallback(async (request: Record<string, unknown>) => {
        if (!api_base?.api) throw new Error(localize('Not connected to Deriv yet. Please try again.'));
        const response: any = await api_base.api.send(request);
        if (response?.error) throw new Error(response.error.message || response.error.code);
        return response;
    }, []);

    const stopTicks = useCallback(() => {
        try {
            if (tick_sub_id.current) {
                api_base?.api?.forget?.({ forget: tick_sub_id.current });
                tick_sub_id.current = null;
            }
            if (tick_listener.current) {
                api_base?.api?.connection?.removeEventListener('message', tick_listener.current);
                tick_listener.current = null;
            }
        } catch {
            /* the stream closes with the socket anyway */
        }
    }, []);

    const startTicks = useCallback(
        async (next_symbol: string) => {
            stopTicks();
            setDigits([]);
            setLastDigit(null);
            if (!next_symbol) return;

            try {
                const response = await send({ ticks: next_symbol, subscribe: 1 });
                if (response?.subscription?.id) tick_sub_id.current = response.subscription.id;

                const onMessage = (evt: MessageEvent) => {
                    try {
                        const data = JSON.parse(evt.data as string);
                        if (data?.msg_type !== 'tick' || data?.tick?.symbol !== next_symbol) return;
                        const digit = Number(String(data.tick.quote).slice(-1));
                        setLastDigit(digit);
                        setDigits(prev => [...prev.slice(-9), digit]);
                    } catch {
                        /* a frame we do not care about */
                    }
                };
                tick_listener.current = onMessage;
                api_base?.api?.connection?.addEventListener('message', onMessage);
            } catch (error) {
                say(error instanceof Error ? error.message : localize('Could not follow that market'), true);
            }
        },
        [say, send, stopTicks]
    );

    // Load the volatility indices once, and follow the first one.
    useEffect(() => {
        is_mounted.current = true;

        (async () => {
            try {
                const { active_symbols } = await send({ active_symbols: 'brief' });
                const synthetic = (active_symbols || [])
                    .filter((s: any) => /synthetic/i.test(s.market) || /^(R_|1HZ)/.test(s.symbol))
                    .map((s: any) => ({ symbol: s.symbol, display_name: s.display_name }));

                if (!is_mounted.current) return;
                setSymbols(synthetic);

                const first = synthetic[0]?.symbol;
                if (first) {
                    setSymbol(first);
                    startTicks(first);
                }
            } catch (error) {
                say(error instanceof Error ? error.message : localize('Could not load markets'), true);
            }
        })();

        return () => {
            is_mounted.current = false;
            stop_requested.current = true;
            stopTicks();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Which digits would win right now, for the colour hints under the form. */
    const hintFor = (digit: number) => {
        const active_prediction = after_loss.current ? prediction_after_loss : prediction;
        if (trade_type === 'DIGITEVEN') return digit % 2 === 0 ? 'is-green' : 'is-red';
        if (trade_type === 'DIGITODD') return digit % 2 !== 0 ? 'is-green' : 'is-red';
        if (trade_type === 'DIGITMATCH') return digit === active_prediction ? 'is-green' : 'is-red';
        if (trade_type === 'DIGITDIFF') return digit !== active_prediction ? 'is-green' : 'is-red';
        if (trade_type === 'DIGITOVER') {
            if (digit > active_prediction) return 'is-green';
            return digit < active_prediction ? 'is-red' : 'is-neutral';
        }
        if (trade_type === 'DIGITUNDER') {
            if (digit < active_prediction) return 'is-green';
            return digit > active_prediction ? 'is-red' : 'is-neutral';
        }
        return '';
    };

    /** Buy one contract and resolve once it has settled, with its profit. */
    const buyAndFollow = useCallback(
        async (amount: number): Promise<number> => {
            const active_prediction = after_loss.current ? prediction_after_loss : prediction;
            const parameters: Record<string, unknown> = {
                amount,
                basis: 'stake',
                contract_type: trade_type,
                currency,
                duration: Math.max(1, Math.trunc(ticks)),
                duration_unit: 't',
                symbol,
            };
            if (NEEDS_BARRIER.includes(trade_type)) {
                parameters.barrier = String(
                    clampDigit(trade_type === 'DIGITMATCH' || trade_type === 'DIGITDIFF' ? prediction : active_prediction)
                );
            }

            const { buy } = await send({ buy: 1, price: amount, parameters });
            const contract_id = Number(buy?.contract_id);
            if (!contract_id) throw new Error(localize('The purchase did not return a contract'));

            say(`${localize('Bought')} ${buy?.longcode || trade_type}`);
            run_panel.setHasOpenContract(true);
            run_panel.setContractStage(contract_stages.PURCHASE_SENT);

            // Show the row straight away, then follow the contract to settlement.
            transactions.onBotContractEvent({
                contract_id,
                transaction_ids: { buy: buy?.transaction_id },
                buy_price: buy?.buy_price,
                currency,
                contract_type: trade_type,
                underlying: symbol,
                display_name: symbols.find(s => s.symbol === symbol)?.display_name || symbol,
                date_start: Math.floor(Date.now() / 1000),
                status: 'open',
            } as never);

            return await new Promise<number>((resolve, reject) => {
                let sub_id: string | null = null;
                let settled = false;

                const finish = (profit: number) => {
                    if (settled) return;
                    settled = true;
                    try {
                        if (sub_id) api_base?.api?.forget?.({ forget: sub_id });
                        api_base?.api?.connection?.removeEventListener('message', onMessage);
                    } catch {
                        /* nothing to clean up */
                    }
                    run_panel.setHasOpenContract(false);
                    run_panel.setContractStage(contract_stages.CONTRACT_CLOSED);
                    resolve(profit);
                };

                const onMessage = (evt: MessageEvent) => {
                    try {
                        const data = JSON.parse(evt.data as string);
                        if (data?.msg_type !== 'proposal_open_contract') return;
                        const contract = data.proposal_open_contract;
                        if (Number(contract?.contract_id) !== contract_id) return;

                        if (!sub_id && data?.subscription?.id) sub_id = data.subscription.id;
                        transactions.onBotContractEvent(contract);

                        if (contract?.is_sold || contract?.status === 'sold') finish(Number(contract?.profit || 0));
                    } catch {
                        /* a frame we do not care about */
                    }
                };

                api_base?.api?.connection?.addEventListener('message', onMessage);

                send({ proposal_open_contract: 1, contract_id, subscribe: 1 })
                    .then(response => {
                        if (response?.subscription?.id) sub_id = response.subscription.id;
                        const contract = response?.proposal_open_contract;
                        if (contract) {
                            transactions.onBotContractEvent(contract);
                            if (contract.is_sold || contract.status === 'sold') {
                                finish(Number(contract.profit || 0));
                            }
                        }
                    })
                    .catch(error => {
                        if (settled) return;
                        settled = true;
                        try {
                            api_base?.api?.connection?.removeEventListener('message', onMessage);
                        } catch {
                            /* nothing to clean up */
                        }
                        reject(error);
                    });
            });
        },
        [currency, prediction, prediction_after_loss, run_panel, say, send, symbol, symbols, ticks, trade_type, transactions]
    );

    /** Record an outcome: streaks, and the stake for a martingale step. */
    const applyOutcome = useCallback(
        (profit: number, base_stake: number, step: number) => {
            if (profit > 0) {
                after_loss.current = false;
                setWins(w => w + 1);
                setLosses(0);
                stake_ref.current = base_stake;
                setStake(base_stake);
                return 0;
            }
            after_loss.current = true;
            setLosses(l => l + 1);
            setWins(0);
            const next_step = Math.min(step + 1, 50);
            const next_stake = Number((base_stake * Math.pow(martingale, next_step)).toFixed(2));
            stake_ref.current = next_stake;
            setStake(next_stake);
            return next_step;
        },
        [martingale]
    );

    const openRunPanel = useCallback(() => {
        run_panel.toggleDrawer(true);
        run_panel.setActiveTabIndex(1);
        run_panel.run_id = `manual-${Date.now()}`;
        run_panel.setIsRunning(true);
        run_panel.setContractStage(contract_stages.STARTING);
    }, [run_panel]);

    const closeRunPanel = useCallback(() => {
        run_panel.setIsRunning(false);
        run_panel.setHasOpenContract(false);
        run_panel.setContractStage(contract_stages.NOT_RUNNING);
    }, [run_panel]);

    /** One contract, start to settlement. */
    const tradeOnce = useCallback(async () => {
        if (is_buying || is_running || !symbol) return;
        setIsBuying(true);
        openRunPanel();
        try {
            await buyAndFollow(Number(stake_ref.current));
        } catch (error) {
            say(error instanceof Error ? error.message : localize('The trade failed'), true);
        } finally {
            closeRunPanel();
            if (is_mounted.current) setIsBuying(false);
        }
    }, [buyAndFollow, closeRunPanel, is_buying, is_running, openRunPanel, say, symbol]);

    /** Keep trading, one contract at a time, until stopped. */
    const startAuto = useCallback(async () => {
        if (is_buying || is_running || !symbol) return;
        stop_requested.current = false;
        setIsRunning(true);
        openRunPanel();

        const base_stake = Number(stake_ref.current);
        let step = 0;

        try {
            while (!stop_requested.current && is_mounted.current) {
                const profit = await buyAndFollow(Number(stake_ref.current));
                step = applyOutcome(profit, base_stake, step);
            }
        } catch (error) {
            say(error instanceof Error ? error.message : localize('Auto trading stopped'), true);
        } finally {
            closeRunPanel();
            if (is_mounted.current) setIsRunning(false);
        }
    }, [applyOutcome, buyAndFollow, closeRunPanel, is_buying, is_running, openRunPanel, say, symbol]);

    const stopAuto = useCallback(() => {
        stop_requested.current = true;
        say(localize('Stopping after this contract…'));
    }, [say]);

    const shows_match_prediction = trade_type === 'DIGITMATCH' || trade_type === 'DIGITDIFF';
    const shows_over_under = trade_type === 'DIGITOVER' || trade_type === 'DIGITUNDER';
    const busy = is_buying || is_running;

    const total_profit = useMemo(() => Number(store?.summary_card?.profit || 0), [store?.summary_card?.profit]);

    return (
        <div className='manual-trader'>
            <SceneFx />
            <div className='manual-trader__container'>
                <div className='manual-trader__topbar'>
                    <div className='manual-trader__title'>{localize('Manual Trader')}</div>
                    <div className='manual-trader__balance'>
                        {Number(client?.balance || 0).toFixed(2)} {currency}
                    </div>
                </div>

                <div className='manual-trader__card'>
                    <div className='manual-trader__row manual-trader__row--two'>
                        <div className='manual-trader__field'>
                            <label htmlFor='mt-symbol'>{localize('Market')}</label>
                            <select
                                id='mt-symbol'
                                value={symbol}
                                onChange={event => {
                                    setSymbol(event.target.value);
                                    startTicks(event.target.value);
                                }}
                                disabled={busy}
                            >
                                {symbols.map(item => (
                                    <option key={item.symbol} value={item.symbol}>
                                        {item.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='manual-trader__field'>
                            <label htmlFor='mt-trade-type'>{localize('Trade type')}</label>
                            <select
                                id='mt-trade-type'
                                value={trade_type}
                                onChange={event => setTradeType(event.target.value)}
                                disabled={busy}
                            >
                                {TRADE_TYPES.map(item => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='manual-trader__row manual-trader__row--compact'>
                        <div className='manual-trader__field'>
                            <label htmlFor='mt-ticks'>{localize('Ticks')}</label>
                            <input
                                id='mt-ticks'
                                type='number'
                                min={1}
                                max={10}
                                value={ticks}
                                onChange={event => setTicks(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
                                disabled={busy}
                            />
                        </div>

                        <div className='manual-trader__field'>
                            <label htmlFor='mt-stake'>{localize('Stake')}</label>
                            <input
                                id='mt-stake'
                                type='number'
                                step='0.01'
                                min={0.35}
                                value={stake}
                                onChange={event => setStake(Math.max(0.35, Number(event.target.value) || 0.35))}
                                disabled={busy}
                            />
                        </div>

                        {shows_match_prediction && (
                            <div className='manual-trader__field'>
                                <label htmlFor='mt-prediction'>{localize('Prediction digit')}</label>
                                <input
                                    id='mt-prediction'
                                    type='number'
                                    min={0}
                                    max={9}
                                    value={prediction}
                                    onChange={event => setPrediction(clampDigit(Number(event.target.value)))}
                                    disabled={busy}
                                />
                            </div>
                        )}

                        {shows_over_under && (
                            <>
                                <div className='manual-trader__field'>
                                    <label htmlFor='mt-prediction'>{localize('Prediction')}</label>
                                    <input
                                        id='mt-prediction'
                                        type='number'
                                        min={0}
                                        max={9}
                                        value={prediction}
                                        onChange={event => setPrediction(clampDigit(Number(event.target.value)))}
                                        disabled={busy}
                                    />
                                </div>
                                <div className='manual-trader__field'>
                                    <label htmlFor='mt-prediction-after-loss'>{localize('Prediction after a loss')}</label>
                                    <input
                                        id='mt-prediction-after-loss'
                                        type='number'
                                        min={0}
                                        max={9}
                                        value={prediction_after_loss}
                                        onChange={event => setPredictionAfterLoss(clampDigit(Number(event.target.value)))}
                                        disabled={busy}
                                    />
                                </div>
                            </>
                        )}

                        <div className='manual-trader__field'>
                            <label htmlFor='mt-martingale'>{localize('Martingale (auto)')}</label>
                            <input
                                id='mt-martingale'
                                type='number'
                                min={1}
                                step='0.1'
                                value={martingale}
                                onChange={event => setMartingale(Math.max(1, Number(event.target.value) || 1))}
                                disabled={busy}
                            />
                        </div>
                    </div>

                    <div className='manual-trader__digits'>
                        {digits.length === 0 && <div className='manual-trader__digits-empty'>{localize('Waiting for ticks…')}</div>}
                        {digits.map((digit, index) => (
                            <div
                                key={`${index}-${digit}`}
                                className={`manual-trader__digit ${digit === last_digit && index === digits.length - 1 ? 'is-current' : ''} ${hintFor(digit)}`}
                            >
                                {digit}
                            </div>
                        ))}
                    </div>

                    <div className='manual-trader__footer-bar'>
                        <span className='manual-trader__footer-item'>
                            {localize('Total profit/loss')}: {total_profit.toFixed(2)} {currency}
                        </span>
                        <span className='manual-trader__footer-item'>
                            {localize('Last digit')}: {last_digit ?? '-'}
                        </span>
                        <span className='manual-trader__footer-item'>
                            {localize('Wins')}: {wins} · {localize('Losses')}: {losses}
                        </span>
                    </div>

                    <div className='manual-trader__cta'>
                        <button
                            type='button'
                            className='manual-trader__cta-once'
                            onClick={tradeOnce}
                            disabled={busy || !symbol}
                        >
                            {is_buying ? localize('Buying…') : localize('Trade once')}
                        </button>

                        {is_running ? (
                            <button type='button' className='manual-trader__cta-stop' onClick={stopAuto}>
                                {localize('Stop')}
                            </button>
                        ) : (
                            <button
                                type='button'
                                className='manual-trader__cta-auto'
                                onClick={startAuto}
                                disabled={busy || !symbol}
                            >
                                {localize('Start auto trading')}
                            </button>
                        )}
                    </div>

                    {status && (
                        <div className='manual-trader__status'>
                            <Text size='xs' color={is_error ? 'loss-danger' : 'prominent'}>
                                {status}
                            </Text>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ManualTrader;
