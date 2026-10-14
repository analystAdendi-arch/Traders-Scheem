import { useMemo } from 'react';

import TooltipPortal from '@deriv/components/src/components/tooltip-portal/tooltip-portal';
import { Text } from '@deriv-com/quill-ui';

import {
    getCategoryLabel,
    groupTradeTypesByCategory,
    isSameTradeTypeCategory,
    TAvailableContract,
} from '../../Utils/trade-types-utils';
import FireIcon from '../FireIcon';

type TTradeTypesSelectorContentProps = {
    available_contracts: TAvailableContract[];
    selected_trade_type: string;
    active_tab: 'all' | 'most_traded';
    onTradeTypeSelect: (type: string) => void;
};

/**
 * TradeTypesSelectorContent Component
 *
 * Pure presentational component that receives all data via props.
 * Does NOT need MobX observer() wrapper because it doesn't access MobX stores directly.
 *
 * Data Flow: MobX Store → TradeTypes (observer) → TradeTypesSelector → TradeTypesSelectorContent (props)
 */
const TradeTypesSelectorContent = ({
    available_contracts,
    selected_trade_type,
    active_tab,
    onTradeTypeSelect,
}: TTradeTypesSelectorContentProps) => {
    const filtered_contracts = useMemo(
        () =>
            active_tab === 'most_traded'
                ? available_contracts.filter(contract => contract.is_popular)
                : available_contracts,
        [active_tab, available_contracts]
    );

    const grouped_contracts = useMemo(() => groupTradeTypesByCategory(filtered_contracts), [filtered_contracts]);

    const category_order = ['growth_based', 'directional', 'digit_based'];

    return (
        <div className='trade-types-selector__content'>
            {category_order.map(category => {
                const contracts = grouped_contracts[category];
                if (!contracts || contracts.length === 0) return null;

                return (
                    <div key={category} className='trade-types-selector__category'>
                        <Text size='sm' className='trade-types-selector__category-label'>
                            {getCategoryLabel(category)}
                        </Text>
                        <div className='trade-types-selector__items'>
                            {contracts.map(contract => {
                                const is_selected = contract.for.some(type =>
                                    isSameTradeTypeCategory(type, selected_trade_type)
                                );
                                const button = (
                                    <button
                                        key={contract.id}
                                        className={`trade-types-selector__item ${is_selected ? 'trade-types-selector__item--selected' : ''}`}
                                        onClick={() => onTradeTypeSelect(contract.for[0])}
                                        aria-label={`Select ${contract.tradeType} trade type${is_selected ? ', currently selected' : ''}`}
                                        aria-pressed={is_selected}
                                    >
                                        <Text size='md'>
                                            {contract.tradeType}
                                            {contract.show_fire_icon && <FireIcon />}
                                        </Text>
                                    </button>
                                );

                                return contract.tooltip ? (
                                    <TooltipPortal
                                        key={contract.id}
                                        message={contract.tooltip}
                                        position='right'
                                        className='trade-types-selector__tooltip'
                                    >
                                        {button}
                                    </TooltipPortal>
                                ) : (
                                    button
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TradeTypesSelectorContent;
