import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { getCurrencyDisplayCode } from '@deriv/shared';
import { Localize, localize } from '@deriv-com/translations';

import { addUnit } from 'AppV2/Utils/trade-params-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import TradeParameterPopover, { useTradeParameterPopover } from '../Shared/TradeParameterPopover';

import DealCancellationDesktop from './deal-cancellation-desktop';
import RiskManagementContent from './risk-management-content';
import RiskManagementUnitSelector from './risk-management-unit-selector';
import TakeProfitStopLossDesktop from './take-profit-stop-loss-desktop';

import './risk-management-desktop.scss';

interface RiskManagementDesktopProps {
    is_minimized?: boolean;
}

const RiskManagementPopoverContent: React.FC<{
    selectedUnit: string;
    shouldShowDealCancellation: boolean;
    onUnitSelect: (unit: string) => void;
    is_open: boolean;
}> = ({ selectedUnit, shouldShowDealCancellation, onUnitSelect, is_open }) => {
    const { closePopover } = useTradeParameterPopover();

    return (
        <div className='risk-management-popover__layout'>
            {shouldShowDealCancellation && (
                <div className='risk-management-popover__sidebar'>
                    <RiskManagementUnitSelector
                        selectedUnit={selectedUnit}
                        onSelectUnit={onUnitSelect}
                        shouldShowDealCancellation={shouldShowDealCancellation}
                    />
                </div>
            )}
            <div className='risk-management-popover__main'>
                {selectedUnit === 'tp_sl' ? (
                    <TakeProfitStopLossDesktop onClose={closePopover} is_open={is_open} />
                ) : (
                    <DealCancellationDesktop closePopover={closePopover} />
                )}
            </div>
        </div>
    );
};

const RiskManagementDesktop: React.FC<RiskManagementDesktopProps> = observer(({ is_minimized }) => {
    const {
        cancellation_range_list,
        cancellation_duration,
        currency,
        has_cancellation,
        has_take_profit,
        has_stop_loss,
        is_market_closed,
        take_profit,
        stop_loss,
    } = useTraderStore();

    const should_show_deal_cancellation = cancellation_range_list?.length > 0;
    const [selectedUnit, setSelectedUnit] = useState<string>(has_cancellation ? 'dc' : 'tp_sl');
    const [is_open, setIsOpen] = useState(false);

    const handleOpenPopover = useCallback(() => {
        // Set initial tab based on current state
        setSelectedUnit(has_cancellation ? 'dc' : 'tp_sl');
        setIsOpen(true);
    }, [has_cancellation]);

    const handleClosePopover = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleUnitSelect = useCallback((unit: string) => {
        setSelectedUnit(unit);
    }, []);

    const getRiskManagementText = useCallback(() => {
        if (has_cancellation) return `DC: ${addUnit({ value: cancellation_duration, unit: localize('minutes') })}`;
        if (has_take_profit && has_stop_loss)
            return `TP: ${take_profit} ${getCurrencyDisplayCode(currency)} / SL: ${stop_loss} ${getCurrencyDisplayCode(
                currency
            )}`;
        if (has_take_profit) return `TP: ${take_profit} ${getCurrencyDisplayCode(currency)}`;
        if (has_stop_loss) return `SL: ${stop_loss} ${getCurrencyDisplayCode(currency)}`;
        return '-';
    }, [has_cancellation, has_take_profit, has_stop_loss, take_profit, stop_loss, currency, cancellation_duration]);

    // Calculate popover width based on whether DC is available
    const popoverWidth = should_show_deal_cancellation ? 360 : 280;

    return (
        <TradeParameterPopover
            popoverWidth={popoverWidth}
            label={
                <Localize
                    i18n_default_text='Risk management'
                    key={`risk-management${is_minimized ? '-minimized' : ''}`}
                />
            }
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='risk-management-popover'
            value={getRiskManagementText()}
            onOpen={handleOpenPopover}
            onClose={handleClosePopover}
            description={<RiskManagementContent should_show_deal_cancellation={should_show_deal_cancellation} />}
        >
            <RiskManagementPopoverContent
                selectedUnit={selectedUnit}
                shouldShowDealCancellation={should_show_deal_cancellation}
                onUnitSelect={handleUnitSelect}
                is_open={is_open}
            />
        </TradeParameterPopover>
    );
});

export default RiskManagementDesktop;
