import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import { LabelPairedChevronDownLgRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { localize } from '@deriv-com/translations';
import { useTickData, type TPercentPair } from '@/hooks/useTickData';
import './bulk-trader.scss';
type TTradeType = 'even_odd' | 'over_under' | 'matches_differs';

type TDigitContractType = 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITMATCH' | 'DIGITDIFF';

const MAX_TICKS = 5000;

const clampTicks = (value: number) => Math.min(Math.max(value, 1), MAX_TICKS);
const clampDigit = (value: number) => Math.min(Math.max(value, 0), 9);

const BulkTrader = () => {
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
    const [statusText, setStatusText] = useState<string>(localize('Bot is not running'));

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
            return {
                leftLabel: localize('Under'),
                rightLabel: localize('Over'),
                leftContractType: 'DIGITUNDER' as const,
                rightContractType: 'DIGITOVER' as const,
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
            const pair: TPercentPair = computeOverUnder(predictionDigit);
            return { leftLabel: tradeConfig.leftLabel, rightLabel: tradeConfig.rightLabel, left: pair.b, right: pair.a };
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
                history.push({ label: tick.digit < predictionDigit ? 'U' : 'O', isLeft: tick.digit < predictionDigit });
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

    const waitForContractToClose = useCallback(
        async (contract_id: number, timeoutMs = 60000) => {
            if (!api_base.api) throw new Error('API not connected');
            let subscriptionId: string | null = null;
            return await new Promise<void>((resolve, reject) => {
                const cleanup = () => {
                    if (subscriptionId && api_base.api) {
                        (api_base.api as any).forget(subscriptionId);
                        subscriptionId = null;
                    }
                    subscription.unsubscribe();
                };

                const timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error('Contract timeout'));
                }, timeoutMs);

                const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
                    if (!data || data?.error) return;
                    if (data.msg_type !== 'proposal_open_contract') return;
                    if (data.proposal_open_contract?.contract_id !== contract_id) return;

                    if (data.subscription?.id) subscriptionId = data.subscription.id;
                    if (data.proposal_open_contract?.is_sold) {
                        clearTimeout(timeout);
                        cleanup();
                        resolve();
                    }
                });

                apiSend({ proposal_open_contract: 1, contract_id, subscribe: 1 }, 12000)
                    .then((response: any) => {
                        if (response?.error) {
                            clearTimeout(timeout);
                            cleanup();
                            reject(new Error(response.error.message || 'proposal_open_contract error'));
                            return;
                        }
                        if (response?.subscription?.id) subscriptionId = response.subscription.id;
                        if (response?.proposal_open_contract?.is_sold) {
                            clearTimeout(timeout);
                            cleanup();
                            resolve();
                        }
                    })
                    .catch((e: any) => {
                        clearTimeout(timeout);
                        cleanup();
                        reject(e);
                    });
            });
        },
        [apiSend]
    );

    const executeBulkTrade = useCallback(
        async (contract_type: TDigitContractType) => {
            if (isTrading) return;
            if (!api_base.api) return;

            abortTradingRef.current = false;
            setIsTrading(true);
            setStatusText(localize('Bot is running'));

            try {
                const currency = (api_base.account_info as any)?.currency || 'USD';
                const trades = Math.min(Math.max(numTrades, 1), 999);
                const amount = Number(stake);

                for (let i = 0; i < trades; i++) {
                    if (abortTradingRef.current) throw new Error('Trading cancelled');

                    const shouldAddBarrier = ['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF'].includes(contract_type);
                    const proposalResponse = await apiSend(
                        ({
                            proposal: 1,
                            amount,
                            basis: 'stake',
                            contract_type,
                            currency,
                            duration: 1,
                            duration_unit: 't',
                            // Options API renamed proposal `symbol` -> `underlying_symbol`.
                            underlying_symbol: selectedSymbolRef.current,
                            ...(shouldAddBarrier ? { barrier: String(clampDigit(predictionRef.current)) } : {}),
                        } as Record<string, unknown>),
                        12000
                    );

                    if (proposalResponse?.error) {
                        throw new Error(proposalResponse.error.message || 'Proposal error');
                    }

                    const proposalId = proposalResponse?.proposal?.id;
                    const askPrice = proposalResponse?.proposal?.ask_price;
                    if (!proposalId) throw new Error('Missing proposal id');

                    const buyResponse = await apiSend(
                        {
                            buy: proposalId,
                            // ask_price may arrive as a string on the Options API.
                            price: Number(askPrice ?? amount),
                        },
                        12000
                    );

                    if (buyResponse?.error) {
                        throw new Error(buyResponse.error.message || 'Buy error');
                    }

                    const contractId = buyResponse?.buy?.contract_id;
                    if (!contractId) throw new Error('Missing contract id');

                    await waitForContractToClose(Number(contractId), 60000);
                    if (abortTradingRef.current) throw new Error('Trading cancelled');

                    await new Promise(resolve => setTimeout(resolve, 150));
                }

                if (isMountedRef.current) setStatusText(localize('Bot is not running'));
            } catch (e: any) {
                if (isMountedRef.current) {
                    // Surface Deriv's reason instead of silently resetting.
                    const reason = e?.message && e.message !== 'Trading cancelled' ? `: ${e.message}` : '';
                    setStatusText(`${localize('Bot is not running')}${reason}`);
                }
            } finally {
                if (isMountedRef.current) setIsTrading(false);
            }
        },
        [apiSend, isTrading, numTrades, stake, waitForContractToClose]
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

            <div className='bulk-trader__footer'>
                <div className='bulk-trader__status-wrapper' style={{ width: '100%', justifyContent: 'center' }}>
                    <div className='bulk-trader__status'>
                        <div className='bulk-trader__status-text'>{statusText}</div>
                        <div className='bulk-trader__status-timeline'>
                            <div className='bulk-trader__status-line' />
                            <div className='bulk-trader__status-dots'>
                                <span className='bulk-trader__status-dot' />
                                <span className='bulk-trader__status-dot' />
                                <span className='bulk-trader__status-dot' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default BulkTrader;
