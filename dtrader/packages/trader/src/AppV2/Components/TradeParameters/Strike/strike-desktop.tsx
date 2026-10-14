import { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { Localize } from '@deriv-com/translations';

import { SelectionListPopover, TradeParameterPopover } from 'AppV2/Components/TradeParameters/Shared';
import { useTraderStore } from 'Stores/useTraderStores';

import { TTradeParametersProps } from '../trade-parameters';

import '../Shared/selection-list-popover.scss';

const StrikeDesktop = observer(({ is_minimized }: TTradeParametersProps) => {
    const { barrier_1, barrier_choices, is_market_closed, onChange } = useTraderStore();

    const strike_options = useMemo(
        () => barrier_choices.map(strike => ({ value: strike, label: strike })),
        [barrier_choices]
    );

    const handleStrikeSelect = useCallback(
        (value: string) => {
            onChange({ target: { name: 'barrier_1', value } });
        },
        [onChange]
    );

    return (
        <TradeParameterPopover
            popoverWidth={154}
            label={<Localize i18n_default_text='Strike price' key={`strike${is_minimized ? '-minimized' : ''}`} />}
            value={barrier_1}
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='selection-list-popover'
            description={
                <Localize i18n_default_text='The strike price is the price at which the contract is settled at expiry.' />
            }
        >
            <SelectionListPopover
                options={strike_options}
                selectedValue={barrier_1}
                onSelect={handleStrikeSelect}
                className='selection-list-popover'
            />
        </TradeParameterPopover>
    );
});

export default StrikeDesktop;
// [/AI]
