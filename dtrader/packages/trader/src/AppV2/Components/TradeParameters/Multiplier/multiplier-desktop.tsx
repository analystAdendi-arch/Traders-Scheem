import { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { Localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

import { SelectionListPopover, TradeParameterPopover } from '../Shared';
import { TTradeParametersProps } from '../trade-parameters';

import '../Shared/selection-list-popover.scss';

const MultiplierDesktop = observer(({ is_minimized }: TTradeParametersProps) => {
    const { multiplier, multiplier_range_list, is_market_closed, onChange } = useTraderStore();

    const multiplier_options = useMemo(
        () =>
            multiplier_range_list.map(mult => {
                const mult_text = mult.text;
                const mult_value = Number(mult_text.slice(1));
                return {
                    value: mult_value,
                    label: mult_text,
                };
            }),
        [multiplier_range_list]
    );

    const handleMultiplierSelect = useCallback(
        (selected_multiplier: number) => {
            onChange({ target: { name: 'multiplier', value: selected_multiplier } });
        },
        [onChange]
    );

    return (
        <TradeParameterPopover
            popoverWidth={154}
            label={<Localize i18n_default_text='Multiplier' key={`multiplier${is_minimized ? '-minimized' : ''}`} />}
            value={`x${multiplier}`}
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='selection-list-popover'
            description={
                <Localize i18n_default_text='Multipliers amplify your potential profit if the market moves in your favour, with losses limited to your initial capital.' />
            }
        >
            <SelectionListPopover
                options={multiplier_options}
                selectedValue={multiplier}
                onSelect={handleMultiplierSelect}
                className='selection-list-popover'
            />
        </TradeParameterPopover>
    );
});

export default MultiplierDesktop;
// [/AI]
