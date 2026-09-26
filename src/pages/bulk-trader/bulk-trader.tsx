import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api_base, MessageTypes } from '@/external/bot-skeleton';
import { LabelPairedChevronDownLgRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { localize } from '@deriv-com/translations';
import { useStore } from '@/hooks/useStore';
import { useTickData, type TPercentPair } from '@/hooks/useTickData';
import './bulk-trader.scss';
type TTradeType = 'even_odd' | 'over_under' | 'matches_differs';

type TDigitContractType = 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';

const MAX_TICKS = 5000;

const clampTicks = (value: number) => Math.min(Math.max(value, 1), MAX_TICKS);
const clampDigit = (value: number) => Math.min(Math.max(value, 0), 9);

const BulkTrader = () => {
    // Same stores the bot writes to, so the run panel's Transactions and
    // Journal tabs show these trades too.
    const { transactions, journal } = useStore() ?? {};
    const {
        availableSymbols,
        selectedSymbol,
        setSelectedSymbol,
        ticksBuffer,
        latestTick,
        lastHitNumber,
        circleData,
        computeEvenOdd,
        computeOverUnder,
        computeMatchDiffer,
        isLoadingTicks,
        connectionError,
    } = useTickData();

    const [ticksCount, setTicksCount] = useState<number>(1000);
    const [tradeType, setTradeType] = useState<TTradeType>('even_odd');
    const [prediction, setPrediction] = useState<number>(4);
    const [stake, setStake] = useState<number>(0.5);
    const [numTrades, setNumTrades] = useState<number>(1);
    const [isTrading, setIsTrading] = useState(false);
    const [arrowLeft, setArrowLeft] = useState<string>('50%');
    // Shown only while trading or after a failed trade; idle shows nothing.
    const [statusText, setStatusText] = useState<string | null>(null);
    const [statusIsError, setStatusIsError] = useState(false);

    const circlesContainerRef = useRef<HTMLDivElement>(null);
    const indicatorTrackRef = useRef<HTMLDivElement>(null);
    const selectedSymbolRef = useRef<string>(selectedSymbol);
    const predictionRef = useRef<number>(prediction);
    const isMountedRef = useRef(true);
    const abortTradingRef = useRef(false);

    useEffect(() => {
        selectedSymbolRef.current = selectedSymbol;
    }, [selectedSymbol]);

    useEffect(() => {
        predictionRef.current = prediction;
    }, [prediction]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortTradingRef.current = true;
        };
    }, []);

    const apiSend = useCallback(async (request: Record<string, unknown>, timeoutMs = 10000) => {
        if (!api_base.api) throw new Error('API not connected');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs));
        const response = await Promise.race([(api_base.api as any).send(request), timeout]);
        return response as any;
    }, []);

    const showPrediction = tradeType === 'over_under' || tradeType === 'matches_differs';

    const tradeConfig = useMemo(() => {
        if (tradeType === 'over_under') {
            // Over is the left, green side and Under the right, red one - the
            // same way round as Even/Odd above it, and as every other platform.
            return {
                leftLabel: localize('Over'),
                rightLabel: localize('Under'),
                leftContractType: 'DIGITOVER' as const,
                rightContractType: 'DIGITUNDER' as const,
                requiresPrediction: true,
            };
        }
        if (tradeType === 'matches_differs') {
            return {
                leftLabel: localize('Match'),
                rightLabel: localize('Differs'),
                leftContractType: 'DIGITMATCH' as const,
                rightContractType: 'DIGITDIFF' as const,
                requiresPrediction: true,
            };
        }
        return {
            leftLabel: localize('Even'),
            rightLabel: localize('Odd'),
            leftContractType: 'DIGITEVEN' as const,
            rightContractType: 'DIGITODD' as const,
            requiresPrediction: false,
        };
    }, [tradeType]);

    const leftRight = useMemo(() => {
        const predictionDigit = clampDigit(prediction);
        if (tradeType === 'over_under') {
            if (ticksBuffer.length === 0) return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: 50.0, right: 50.0 };
            // computeOverUnder returns { a: over, b: under }, and Over is the left side.
            const pair: TPercentPair = computeOverUnder(predictionDigit);
            return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: pair.a, right: pair.b };
        }

        if (tradeType === 'matches_differs') {
            if (ticksBuffer.length === 0) return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: 50.0, right: 50.0 };
            const pair: TPercentPair = computeMatchDiffer(predictionDigit);
            return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: pair.a, right: pair.b };
        }

        if (ticksBuffer.length === 0) return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: 50.0, right: 50.0 };
        const pair: TPercentPair = computeEvenOdd();
        return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: pair.a, right: pair.b };
    }, [computeEvenOdd, computeMatchDiffer, computeOverUnder, prediction, ticksBuffer.length, tradeConfig.leftLabel, tradeConfig.rightLabel, tradeType]);

    const tradeHistory = useMemo(() => {
        const history: { label: string; isLeft: boolean }[] = [];
        const from = Math.max(0, ticksBuffer.length - 8);
        const predictionDigit = clampDigit(prediction);
        for (let i = from; i < ticksBuffer.length; i++) {
            const tick = ticksBuffer[i];
            if (tradeType === 'over_under') {
                // Over is the left side, so a digit above the prediction is the
                // one that gets the left colour.
                const is_over = tick.digit > predictionDigit;
                history.push({ label: is_over ? 'O' : 'U', isLeft: is_over });
            } else if (tradeType === 'matches_differs') {
                history.push({ label: tick.digit === predictionDigit ? 'M' : 'D', isLeft: tick.digit === predictionDigit });
            } else {
                history.push({ label: tick.digit % 2 === 0 ? 'E' : 'O', isLeft: tick.digit % 2 === 0 });
            }
        }
        return history;
    }, [prediction, ticksBuffer, tradeType]);

    const updateArrowPosition = useCallback(() => {
        if (lastHitNumber === null) return;
        const circlesEl = circlesContainerRef.current;
        const trackEl = indicatorTrackRef.current;
        if (!circlesEl || !trackEl) return;

        const circleElement = circlesEl.children[lastHitNumber] as HTMLElement | undefined;
        if (!circleElement) return;

        const circleRect = circleElement.getBoundingClientRect();
        const trackRect = trackEl.getBoundingClientRect();
        const left = circleRect.left + circleRect.width / 2 - trackRect.left;
        if (!Number.isFinite(left)) return;
        setArrowLeft(`${left}px`);
    }, [lastHitNumber]);

    useEffect(() => {
        updateArrowPosition();
    }, [ticksBuffer, updateArrowPosition]);

    useEffect(() => {
        const handleResize = () => updateArrowPosition();
        window.addEventListener('resize', handleResize);
        requestAnimationFrame(updateArrowPosition);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateArrowPosition]);

    /**
     * Every contract we bought here, so the shared message stream can be
     * filtered down to ours and fed to the run panel.
     */
    const ourContracts = useRef<Set<number>>(new Set());

    // Contract updates -> the bot's Transactions tab, settlements -> Journal.
    useEffect(() => {
        if (!api_base.api) return undefined;
        const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
            if (!data || data.error || data.msg_type !== 'proposal_open_contract') return;
            const contract = data.proposal_open_contract;
            const id = Number(contract?.contract_id);
            if (!id || !ourContracts.current.has(id)) return;

            transactions?.onBotContractEvent(contract);

            if (contract.is_sold) {
                const profit = Number(contract.profit ?? 0);
                journal?.pushMessage(
                    `${profit >= 0 ? localize('Won') : localize('Lost')} ${profit.toFixed(2)} ${
                        contract.currency ?? ''
                    } on ${contract.display_name ?? contract.underlying_symbol ?? ''} ${
                        contract.contract_type ?? ''
                    }`,
                    profit >= 0 ? MessageTypes.SUCCESS : MessageTypes.ERROR,
                    'journal__text'
                );
                ourContracts.current.delete(id);
                if (data.subscription?.id) (api_base.api as any)?.forget(data.subscription.id);
            }
        });
        return () => subscription.unsubscribe();
    }, [transactions, journal]);

    /**
     * Ask for one price. `passthrough` differs per trade so a run of identical
     * requests cannot be answered with one shared proposal id - a proposal can
     * only be bought once, so that would place a single contract instead of the
     * number asked for.
     */
    const requestProposal = useCallback(
        async (contract_type: TDigitContractType, currency: string, amount: number, trade_index: number) => {
            const needs_barrier = ['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF'].includes(contract_type);

            const proposal = await apiSend(
                {
                    proposal: 1,
                    amount,
                    basis: 'stake',
                    contract_type,
                    currency,
                    duration: 1,
                    duration_unit: 't',
                    // Options API renamed proposal `symbol` -> `underlying_symbol`.
                    underlying_symbol: selectedSymbolRef.current,
                    ...(needs_barrier ? { barrier: String(clampDigit(predictionRef.current)) } : {}),
                    passthrough: { trade: trade_index },
                },
                12000
            );
            if (proposal?.error) throw new Error(proposal.error.message || 'Proposal error');

            const id = proposal?.proposal?.id;
            if (!id) throw new Error('Missing proposal id');

            // ask_price may arrive as a string on the Options API.
            return { id: String(id), price: Number(proposal.proposal.ask_price ?? amount) };
        },
        [apiSend]
    );

    /** Buy one priced proposal and follow the contract it opens. */
    const buyProposal = useCallback(
        async (proposal: { id: string; price: number }, contract_type: TDigitContractType, currency: string) => {
            const bought = await apiSend({ buy: proposal.id, price: proposal.price }, 12000);
            if (bought?.error) throw new Error(bought.error.message || 'Buy error');

            const contract_id = Number(bought?.buy?.contract_id);
            if (!contract_id) throw new Error('Missing contract id');

            ourContracts.current.add(contract_id);
            journal?.pushMessage(
                `${localize('Bought')} ${contract_type} ${localize('for')} ${Number(
                    bought.buy.buy_price ?? proposal.price
                ).toFixed(2)} ${currency}`,
                MessageTypes.NOTIFY,
                'journal__text'
            );

            // Follow it so profit and settlement reach the run panel.
            void apiSend({ proposal_open_contract: 1, contract_id, subscribe: 1 }, 12000).catch(() => {
                /* the contract still settles; only live updates are missed */
            });

            return contract_id;
        },
        [apiSend, journal]
    );

    const executeBulkTrade = useCallback(
        async (contract_type: TDigitContractType) => {
            if (isTrading) return;
            if (!api_base.api) return;

            abortTradingRef.current = false;
            setIsTrading(true);
            setStatusIsError(false);

            const currency = (api_base.account_info as any)?.currency || 'USD';
            const trades = Math.min(Math.max(numTrades, 1), 100);
            const amount = Number(stake);

            setStatusText(
                trades > 1
                    ? localize('Placing {{count}} trades…', { count: trades })
                    : localize('Placing trade…')
            );

            // Two phases, so the buys all leave together. Pricing every trade
            // first and buying afterwards is what makes this a bulk purchase:
            // one proposal per trade in parallel, then every buy dispatched in
            // the same breath. Buying inside each proposal's own turn would
            // stagger the purchases by however long each price took to arrive.
            const priced = await Promise.allSettled(
                Array.from({ length: trades }, (_, index) =>
                    requestProposal(contract_type, currency, amount, index + 1)
                )
            );

            if (!isMountedRef.current) return;

            // A proposal id buys one contract, so a repeated id has to be dropped
            // rather than bought twice.
            const seen_ids = new Set<string>();
            const buyable = priced
                .filter(
                    (result): result is PromiseFulfilledResult<{ id: string; price: number }> =>
                        result.status === 'fulfilled'
                )
                .map(result => result.value)
                .filter(proposal => !seen_ids.has(proposal.id) && seen_ids.add(proposal.id));

            const bought = await Promise.allSettled(
                buyable.map(proposal => buyProposal(proposal, contract_type, currency))
            );

            if (!isMountedRef.current) return;

            const results = [...priced.filter(result => result.status === 'rejected'), ...bought];
            const placed = bought.filter(result => result.status === 'fulfilled').length;
            const failed = trades - placed;
            const first_error = results.find(
                (result): result is PromiseRejectedResult => result.status === 'rejected'
            );
            const reason = first_error?.reason instanceof Error ? first_error.reason.message : '';

            if (placed > 0) {
                journal?.pushMessage(
                    localize('{{placed}} of {{total}} trades placed', { placed, total: trades }),
                    failed ? MessageTypes.ERROR : MessageTypes.SUCCESS,
                    'journal__text'
                );
            }

            setStatusIsError(placed === 0);
            setStatusText(
                placed === 0
                    ? `${localize('Trade failed')}${reason ? `: ${reason}` : ''}`
                    : failed > 0
                      ? localize('{{placed}} placed, {{failed}} failed{{reason}}', {
                            placed,
                            failed,
                            reason: reason ? `: ${reason}` : '',
                        })
                      : null
            );
            setIsTrading(false);
        },
        [isTrading, numTrades, stake, requestProposal, buyProposal, journal]
    );

    return (
        <div className='bulk-trader'>
            <div className='bulk-trader__card'>
                <div className='bulk-trader__top-row'>
                <div className='bulk-trader__field bulk-trader__field--market'>
                    <label className='bulk-trader__label'>{localize('MARKET')}</label>
                    <div className='bulk-trader__select-wrapper'>
                        <select
                            className='bulk-trader__select bulk-trader__select--market'
                            value={selectedSymbol}
                            onChange={e => setSelectedSymbol(e.target.value)}
                        >
                            {availableSymbols.map(s => (
                                <option key={s.symbol} value={s.symbol}>
                                    {s.display_name}
                                </option>
                            ))}
                        </select>
                        <LabelPairedChevronDownLgRegularIcon
                            className='bulk-trader__select-v'
                            height='10px'
                            width='10px'
                            fill='var(--bulk-muted)'
                        />
                    </div>
                </div>
                <div className='bulk-trader__field bulk-trader__field--trade-type'>
                    <label className='bulk-trader__label'>{localize('TRADE TYPE')}</label>
                    <div className='bulk-trader__select-wrapper'>
                        <select
                            className='bulk-trader__select bulk-trader__select--trade-type'
                            value={tradeType}
                            onChange={e => setTradeType(e.target.value as TTradeType)}
                        >
                            <option value='even_odd'>{localize('Even/Odd')}</option>
                            <option value='over_under'>{localize('Over/Under')}</option>
                            <option value='matches_differs'>{localize('Matches/Differs')}</option>
                        </select>
                        <LabelPairedChevronDownLgRegularIcon
                            className='bulk-trader__select-v'
                            height='10px'
                            width='10px'
                            fill='var(--bulk-muted)'
                        />
                    </div>
                </div>
            </div>

            <div className={`bulk-trader__params-row ${showPrediction ? 'bulk-trader__params-row--split' : ''}`}>
                <div className='bulk-trader__field'>
                    <label className='bulk-trader__label'>{localize('NUMBER OF TICKS')}</label>
                    <input
                        className='bulk-trader__params-input bulk-trader__params-input--ticks'
                        type='number'
                        value={ticksCount}
                        onChange={e => setTicksCount(clampTicks(parseInt(e.target.value || '0', 10) || 1))}
                    />
                </div>
                {showPrediction && (
                    <div className='bulk-trader__field'>
                        <label className='bulk-trader__label'>{localize('PREDICTION')}</label>
                        <input
                            className='bulk-trader__params-input bulk-trader__params-input--prediction'
                            type='number'
                            min='0'
                            max='9'
                            value={prediction}
                            onChange={e => setPrediction(clampDigit(parseInt(e.target.value || '0', 10) || 0))}
                        />
                    </div>
                )}
            </div>

            <div className='bulk-trader__current-tick'>
                <div className='bulk-trader__current-tick-label'>{localize('CURRENT TICK')}</div>
                <div className={`bulk-trader__current-tick-price ${connectionError ? 'bulk-trader__current-tick-price--error' : ''}`}>
                    {connectionError
                        ? connectionError
                        : isLoadingTicks && ticksBuffer.length === 0
                          ? localize('Loading...')
                          : latestTick
                            ? latestTick.quoteStr
                            : localize('Updating...')}
                </div>
            </div>

            <div className='bulk-trader__circles-panel'>
                <div className='bulk-trader__circles' ref={circlesContainerRef}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => {
                        const data = circleData.find(c => c.digit === digit);
                        const percentage = data?.percentage ?? 0;
                        const colorClass = data?.color || 'white';
                        const isHit = lastHitNumber === digit;
                        return (
                            <div
                                key={digit}
                                className={`bulk-trader__circle ${colorClass} ${
                                    isHit ? 'bulk-trader__circle--hit' : ''
                                }`}
                                style={
                                    {
                                        ['--progress' as any]: `${percentage.toFixed(1)}%`,
                                    } as React.CSSProperties
                                }
                            >
                                <div className='bulk-trader__circle-digit'>{digit}</div>
                                <div className='bulk-trader__circle-percent'>{percentage.toFixed(2)}%</div>
                            </div>
                        );
                    })}
                </div>
                <div className='bulk-trader__indicator-track' ref={indicatorTrackRef}>
                    <div className='bulk-trader__indicator' style={{ left: arrowLeft, transform: 'translateX(-50%)' }} />
                </div>
            </div>

            <div className='bulk-trader__history-container'>
                <div className='bulk-trader__history'>
                    {tradeHistory.map((item, index) => (
                        <div
                            key={`${item.label}-${index}`}
                            className={`bulk-trader__history-item ${item.isLeft ? 'bulk-trader__history-green' : 'bulk-trader__history-red'}`}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className='bulk-trader__inputs-row'>
                <div className='bulk-trader__input-field'>
                    <label className='bulk-trader__input-label'>{localize('TICKS')}</label>
                    <input type='text' className='bulk-trader__input' value='1' readOnly />
                </div>
                <div className='bulk-trader__input-field'>
                    <label className='bulk-trader__input-label'>{localize('STAKE')}</label>
                    <input
                        type='number'
                        className='bulk-trader__input'
                        value={stake}
                        onChange={e => setStake(parseFloat(e.target.value) || 0)}
                    />
                </div>
                <div className='bulk-trader__input-field'>
                    <label className='bulk-trader__input-label'>{localize('NO OF TRADES')}</label>
                    <input
                        type='number'
                        className='bulk-trader__input'
                        min='1'
                        value={numTrades}
                        onChange={e => {
                            const value = parseInt(e.target.value, 10);
                            setNumTrades(Number.isFinite(value) && value > 0 ? value : 1);
                        }}
                    />
                </div>
            </div>

            <div className='bulk-trader__buttons-row'>
                <button
                    className='bulk-trader__button bulk-trader__button-left'
                    onClick={() => executeBulkTrade(tradeConfig.leftContractType as TDigitContractType)}
                    disabled={isTrading}
                    type='button'
                >
                    <div className='bulk-trader__button-label'>{leftRight.leftLabel}</div>
                    <div className='bulk-trader__button-percent'>{leftRight.left.toFixed(1)}%</div>
                </button>
                <button
                    className='bulk-trader__button bulk-trader__button-right'
                    onClick={() => executeBulkTrade(tradeConfig.rightContractType as TDigitContractType)}
                    disabled={isTrading}
                    type='button'
                >
                    <div className='bulk-trader__button-label'>{leftRight.rightLabel}</div>
                    <div className='bulk-trader__button-percent'>{leftRight.right.toFixed(1)}%</div>
                </button>
            </div>

            {statusText && (
                <p
                    className={`bulk-trader__status-message${
                        statusIsError ? ' bulk-trader__status-message--error' : ''
                    }`}
                >
                    {statusText}
                </p>
            )}
            </div>
        </div>
    );
};

export default BulkTrader;
