import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { LegacyHandleLessIcon } from '@deriv/quill-icons';

import PurchaseButton from 'AppV2/Components/PurchaseButton';
import { isSameTradeTypeCategory } from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import TradeParameters from './trade-parameters';

type TTradeParametersContainer = {
    is_market_closed?: boolean;
};

const SWIPE_THRESHOLD_PX = 50; // Minimum distance (px) to recognize as swipe vs tap

const TradeParametersContainer = ({ is_market_closed }: TTradeParametersContainer) => {
    const { contract_type } = useTraderStore();
    const [is_sheet_expanded, setIsSheetExpanded] = React.useState(false);
    const handle_touch_start_y = React.useRef<number>(0);
    const prev_contract_type_ref = React.useRef(contract_type);
    const is_swipe_ref = React.useRef(false);

    const toggleSheet = React.useCallback(() => {
        setIsSheetExpanded(prev => !prev);
    }, []);

    const handleSwipe = React.useCallback((direction: 'up' | 'down') => {
        if (direction === 'up') setIsSheetExpanded(true);
        else setIsSheetExpanded(false);
    }, []);

    const handlePurchaseSuccess = React.useCallback(() => {
        setIsSheetExpanded(false);
    }, []);

    // Collapse the sheet when switching to a different trade type category
    React.useEffect(() => {
        const prev_contract_type = prev_contract_type_ref.current;
        const is_same_category = isSameTradeTypeCategory(prev_contract_type, contract_type);

        if (!is_same_category) {
            setIsSheetExpanded(false);
        }

        prev_contract_type_ref.current = contract_type;
    }, [contract_type]);

    return (
        <div
            className={clsx('trade-params__container', {
                'trade-params__container--expanded': is_sheet_expanded,
                'trade-params__container--collapsed': !is_sheet_expanded,
            })}
            data-testid='trade-params-container'
            onTouchStart={e => {
                handle_touch_start_y.current = e.touches[0].clientY;
                is_swipe_ref.current = false;
            }}
            onTouchEnd={e => {
                const touchEndY = e.changedTouches[0].clientY;
                const deltaY = handle_touch_start_y.current - touchEndY;

                // Only handle swipe gestures (> threshold) in touch events
                if (Math.abs(deltaY) > SWIPE_THRESHOLD_PX) {
                    is_swipe_ref.current = true;
                    e.preventDefault();
                    handleSwipe(deltaY > 0 ? 'up' : 'down');
                }
            }}
        >
            <div
                className='trade-params__container-handle'
                onClick={e => {
                    // Only handle taps in onClick (not swipes)
                    if (!is_swipe_ref.current) {
                        e.preventDefault();
                        toggleSheet();
                    }
                }}
                data-testid='trade-params-handle'
            >
                <div className='trade-params__container-handle-bar'>
                    <LegacyHandleLessIcon fill='var(--component-textIcon-normal-disabled)' iconSize='md' />
                </div>
            </div>
            <div className='trade-params__container-content'>
                <section
                    className={clsx('', {
                        'trade-params--minimized': !is_sheet_expanded,
                        'trade-params': is_sheet_expanded,
                    })}
                >
                    <TradeParameters is_minimized={!is_sheet_expanded} />
                    {!is_market_closed && <PurchaseButton onPurchaseSuccess={handlePurchaseSuccess} />}
                </section>
            </div>
        </div>
    );
};

export default observer(TradeParametersContainer);
