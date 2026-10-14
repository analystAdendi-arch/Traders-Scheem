import React from 'react';
import { CSSTransition } from 'react-transition-group';

import { DataList, Money, PositionsDrawerCard, Text } from '@deriv/components';
import { getEndTime, useNewRowTransition } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useTraderStore } from '@deriv/trader/src/Stores';
import { Localize, localize } from '@deriv-com/translations';

import EmptyPortfolioMessage from './empty-portfolio-message';

type TUiStore = Pick<
    ReturnType<typeof useStore>['ui'],
    | 'addToast'
    | 'current_focus'
    | 'is_mobile'
    | 'is_switching_account'
    | 'removeToast'
    | 'setCurrentFocus'
    | 'should_show_cancellation_warning'
    | 'toggleCancellationWarning'
>;
type TPortfolioStore = Pick<
    ReturnType<typeof useStore>['portfolio'],
    'onHoverPosition' | 'onClickCancel' | 'onClickSell'
>;
type TPositionDrawerCardItem = TPortfolioStore &
    TUiStore & {
        currency: ReturnType<typeof useStore>['client']['currency'];
        getContractById: ReturnType<typeof useStore>['contract_trade']['getContractById'];
        is_new_row?: boolean;
        measure?: () => void;
        onClickRemove: ReturnType<typeof useStore>['portfolio']['removePositionById'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        row?: TPortfolioPosition | { [key: string]: any };
        server_time: ReturnType<typeof useStore>['common']['server_time'];
        symbol: ReturnType<typeof useTraderStore>['symbol'];
    };
type TPortfolioPosition = ReturnType<typeof useStore>['portfolio']['active_positions'][0];

const PositionsDrawerCardItem = ({
    row: portfolio_position,
    measure,
    onHoverPosition,
    symbol,
    is_new_row,
    onClickRemove,
    ...props
}: TPositionDrawerCardItem) => {
    const { in_prop } = useNewRowTransition(is_new_row ?? false);
    const onClickRemoveRef = React.useRef(onClickRemove);
    const nodeRef = React.useRef(null);

    React.useEffect(() => {
        onClickRemoveRef.current = onClickRemove;
    }, [onClickRemove]);

    React.useEffect(() => {
        if (measure) {
            setTimeout(() => {
                measure();
            }, 0);
        }
    }, [portfolio_position?.contract_info.is_sold, measure, portfolio_position?.id]);

    React.useEffect(() => {
        // Trigger measure when contract enters (entry_spot becomes available)
        // This ensures the grid recalculates height when footer appears
        if (portfolio_position?.contract_info?.entry_spot && measure) {
            measure();
        }
    }, [portfolio_position?.contract_info?.entry_spot, measure]);

    React.useEffect(() => {
        // Only remove positions that have actually ended (sold/expired)
        // Use getEndTime to properly determine if a contract has ended
        const contract_info = portfolio_position?.contract_info;
        const has_ended = contract_info && !!getEndTime(contract_info);

        if (has_ended) {
            const timeout = setTimeout(() => {
                onClickRemoveRef.current(portfolio_position.id);
            }, 8000);

            return () => clearTimeout(timeout);
        }
    }, [portfolio_position?.contract_info, portfolio_position?.id]);

    return (
        <CSSTransition
            in={in_prop}
            timeout={150}
            classNames={{
                appear: 'dc-contract-card__wrapper--enter',
                enter: 'dc-contract-card__wrapper--enter',
                enterDone: 'dc-contract-card__wrapper--enter-done',
                exit: 'dc-contract-card__wrapper--exit',
            }}
            onEntered={measure}
            unmountOnExit
            nodeRef={nodeRef}
        >
            <div ref={nodeRef} className='dc-contract-card__wrapper'>
                <PositionsDrawerCard
                    {...portfolio_position}
                    {...props}
                    onMouseEnter={() => {
                        onHoverPosition(true, portfolio_position as TPortfolioPosition, symbol);
                    }}
                    onMouseLeave={() => {
                        onHoverPosition(false, portfolio_position as TPortfolioPosition, symbol);
                    }}
                    onFooterEntered={measure}
                    should_show_transition={is_new_row}
                    onClickRemove={onClickRemove}
                />
            </div>
        </CSSTransition>
    );
};

/**
 * PositionsDrawerContent - Content component for positions to be used inside Flyout
 * This component renders the body and footer of the positions drawer
 */
export const PositionsDrawerContent = observer(({ ...props }) => {
    const { symbol, contract_type: trade_contract_type } = useTraderStore();
    const { client, common, contract_trade, portfolio, ui } = useStore();
    const { currency } = client;
    const { server_time } = common;
    const { getContractById } = contract_trade;
    const {
        all_positions,
        error,
        onHoverPosition,
        onClickCancel,
        onClickSell,
        removePositionById: onClickRemove,
    } = portfolio;
    const {
        is_mobile,
        is_switching_account,
        addToast,
        current_focus,
        removeToast,
        setCurrentFocus,
        should_show_cancellation_warning,
        toggleCancellationWarning,
    } = ui;
    const list_ref = React.useRef<HTMLDivElement>(null);
    const scrollbar_ref = React.useRef<HTMLElement>(null);
    // Watch for actual translation changes to trigger DataList remount
    // This ensures heights are recalculated only after translations have loaded
    const translated_stake_label = localize('Stake:');

    // Memoize keyMapper to prevent unnecessary DataList recalculations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyMapper = React.useCallback((row: any) => row.id, []);

    // Removed onMount() call - now handled at sidebar level to ensure subscription is always active

    React.useEffect(() => {
        list_ref?.current?.scrollTo({ top: 0 });
        if (scrollbar_ref.current) scrollbar_ref.current.scrollTop = 0;
    }, [symbol, trade_contract_type]);

    const body_content = (
        // Force DataList to remount when translations actually change
        // Using translated text as key ensures remount happens after translations load
        <DataList
            key={translated_stake_label}
            data_source={all_positions}
            rowRenderer={args => (
                <PositionsDrawerCardItem
                    onHoverPosition={onHoverPosition}
                    symbol={symbol}
                    currency={currency}
                    addToast={addToast}
                    onClickCancel={onClickCancel}
                    onClickSell={onClickSell}
                    onClickRemove={onClickRemove}
                    server_time={server_time}
                    getContractById={getContractById}
                    is_mobile={is_mobile}
                    is_switching_account={is_switching_account}
                    current_focus={current_focus}
                    removeToast={removeToast}
                    setCurrentFocus={setCurrentFocus}
                    should_show_cancellation_warning={should_show_cancellation_warning}
                    toggleCancellationWarning={toggleCancellationWarning}
                    {...args}
                    {...props}
                />
            )}
            keyMapper={keyMapper}
            row_gap={8}
        />
    );

    return all_positions.length === 0 || error || is_switching_account ? (
        <EmptyPortfolioMessage error={error} />
    ) : (
        body_content
    );
});

/**
 * PositionsDrawerFooter - Footer component showing positions summary
 */
export const PositionsDrawerFooter = observer(() => {
    const { client, portfolio, ui } = useStore();
    const { currency } = client;
    const { all_positions } = portfolio;
    const { is_switching_account } = ui;

    const getTotalProfit = (active_positions: TPortfolioPosition[]) => {
        return active_positions.reduce((total: number, position: TPortfolioPosition) => {
            const profitValue = Number(position.profit_loss) || 0;
            return total + profitValue;
        }, 0);
    };

    if (all_positions.length === 0 || is_switching_account) return null;

    return (
        <div className='positions-drawer-footer--summary'>
            <Text size='xxs' color='less-prominent' className='positions-drawer-footer--count'>
                {all_positions.length}{' '}
                {`${all_positions.length > 1 ? localize('open positions') : localize('open position')}`}
            </Text>
            <div className='positions-drawer-footer--total'>
                <Text size='xs' weight='bold'>
                    <Localize i18n_default_text='Total P/L:' />
                </Text>
                <Text size='xs' weight='bold' color={getTotalProfit(all_positions) > 0 ? 'success' : 'danger'}>
                    <React.Fragment>
                        <Money amount={getTotalProfit(all_positions)} currency={currency} has_sign /> {currency}
                    </React.Fragment>
                </Text>
            </div>
        </div>
    );
});

export default PositionsDrawerContent;
