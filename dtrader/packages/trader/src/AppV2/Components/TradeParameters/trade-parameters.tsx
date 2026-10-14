import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { isTradeParamVisible } from 'AppV2/Utils/layout-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import AccumulatorsInformation from './AccumulatorsInformation';
import AllowEquals from './AllowEquals';
import Barrier from './Barrier';
import BarrierInfo from './BarrierInfo';
import Duration from './Duration';
import GrowthRate from './GrowthRate';
import LastDigitPrediction from './LastDigitPrediction';
import Multiplier from './Multiplier';
import MultipliersDealCancellationInfo from './MultipliersDealCancellationInfo';
import MultipliersExpirationInfo from './MultipliersExpirationInfo';
import MultipliersInformation from './MultipliersInformation';
import PayoutInfo from './PayoutInfo';
import PayoutPerPoint from './PayoutPerPoint';
import PayoutPerPointInfo from './PayoutPerPointInfo';
import RiskManagement from './RiskManagement';
import Stake from './Stake';
import Strike from './Strike';
import TakeProfit from './TakeProfit';
import TradeTypeTabs from './TradeTypeTabs';

export type TTradeParametersProps = { is_minimized?: boolean };

const TradeParameters = observer(({ is_minimized }: TTradeParametersProps) => {
    const { contract_type, has_cancellation, symbol } = useTraderStore();
    const isVisible = (component_key: string) =>
        isTradeParamVisible({ component_key, contract_type, has_cancellation, symbol });

    const scroll_container_ref = React.useRef<HTMLDivElement>(null);

    // Reset scroll position when contract type changes with smooth animation
    React.useEffect(() => {
        if (is_minimized && scroll_container_ref.current) {
            scroll_container_ref.current.scrollTo({
                left: 0,
                behavior: 'smooth',
            });
        }
    }, [contract_type, is_minimized]);

    return (
        <div
            className={clsx(
                'trade-params__options-wrapper',
                is_minimized && 'trade-params__options-wrapper--minimized'
            )}
        >
            <div
                ref={scroll_container_ref}
                className={clsx(
                    'trade-params__options-wrapper',
                    is_minimized && 'trade-params__options-wrapper--horizontal'
                )}
            >
                {isVisible('trade_type_tabs') && <TradeTypeTabs is_minimized={is_minimized} />}
                {isVisible('last_digit') && <LastDigitPrediction is_minimized={is_minimized} />}
                {isVisible('duration') && <Duration is_minimized={is_minimized} />}
                {isVisible('strike') && <Strike is_minimized={is_minimized} />}
                {isVisible('barrier') && <Barrier is_minimized={is_minimized} />}
                {isVisible('growth_rate') && <GrowthRate is_minimized={is_minimized} />}
                {isVisible('multiplier') && <Multiplier is_minimized={is_minimized} />}
                {isVisible('stake') && <Stake is_minimized={is_minimized} />}
                {isVisible('payout_per_point') && <PayoutPerPoint is_minimized={is_minimized} />}
                {isVisible('take_profit') && <TakeProfit is_minimized={is_minimized} />}
                {isVisible('risk_management') && <RiskManagement is_minimized={is_minimized} />}
            </div>
            {isVisible('accu_info_display') && <AccumulatorsInformation />}
            {isVisible('barrier_info') && <BarrierInfo />}
            {isVisible('payout') && <PayoutInfo />}
            {isVisible('payout_per_point_info') && <PayoutPerPointInfo />}
            {isVisible('expiration') && <MultipliersExpirationInfo />}
            {isVisible('mult_info_display') && <MultipliersDealCancellationInfo />}
            {isVisible('multipliers_info') && <MultipliersInformation />}
            {isVisible('allow_equals') && <AllowEquals />}
        </div>
    );
});

export default TradeParameters;
