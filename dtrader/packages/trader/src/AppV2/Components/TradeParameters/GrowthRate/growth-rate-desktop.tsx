import React, { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { getGrowthRatePercentage } from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import { SelectionListPopover, TradeParameterPopover } from 'AppV2/Components/TradeParameters/Shared';
import { useTraderStore } from 'Stores/useTraderStores';

import { TTradeParametersProps } from '../trade-parameters';

import '../Shared/selection-list-popover.scss';

const GrowthRateDesktop = observer(({ is_minimized }: TTradeParametersProps) => {
    const { accumulator_range_list, growth_rate, has_open_accu_contract, is_market_closed, onChange } =
        useTraderStore();

    const growth_rate_options = useMemo(
        () =>
            accumulator_range_list.map(rate => ({
                value: rate,
                label: `${getGrowthRatePercentage(rate)}%`,
            })),
        [accumulator_range_list]
    );

    const handleRateSelect = useCallback(
        (rate: number) => {
            onChange({ target: { name: 'growth_rate', value: rate } });
        },
        [onChange]
    );

    return (
        <TradeParameterPopover
            popoverWidth={154}
            label={<Localize i18n_default_text='Growth rate' key={`growth-rate${is_minimized ? '-minimized' : ''}`} />}
            value={`${getGrowthRatePercentage(growth_rate)}%`}
            is_minimized={is_minimized}
            disabled={has_open_accu_contract || is_market_closed}
            popover_classname='selection-list-popover'
            description={
                <Localize i18n_default_text='The growth rate determines the rate at which your stake will grow with each successful tick.' />
            }
        >
            <SelectionListPopover
                options={growth_rate_options}
                selectedValue={growth_rate}
                onSelect={handleRateSelect}
                className='selection-list-popover'
            />
        </TradeParameterPopover>
    );
});

export default GrowthRateDesktop;
// [/AI]
