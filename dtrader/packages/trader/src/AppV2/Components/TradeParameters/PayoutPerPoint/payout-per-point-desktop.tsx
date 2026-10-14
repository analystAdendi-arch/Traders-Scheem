import { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { getCurrencyDisplayCode } from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

import { SelectionListPopover, TradeParameterPopover } from '../Shared';
import { TTradeParametersProps } from '../trade-parameters';

import '../Shared/selection-list-popover.scss';

const PayoutPerPointDesktop = observer(({ is_minimized }: TTradeParametersProps) => {
    const { currency, is_market_closed, payout_choices, payout_per_point, setPayoutPerPoint } = useTraderStore();

    const currency_display_code = getCurrencyDisplayCode(currency);
    const payout_per_point_list = useMemo(
        () =>
            [...payout_choices]
                .sort((a, b) => Number(a) - Number(b))
                .map((payout: string) => ({
                    value: payout,
                    label: `${payout} ${currency_display_code}`,
                })),
        [payout_choices, currency_display_code]
    );

    const handlePayoutSelect = useCallback(
        (payout: string) => {
            setPayoutPerPoint(payout);
        },
        [setPayoutPerPoint]
    );

    return (
        <TradeParameterPopover
            popoverWidth={154}
            label={
                <Localize
                    i18n_default_text='Payout per point'
                    key={`payout-per-point${is_minimized ? '-minimized' : ''}`}
                />
            }
            value={`${payout_per_point} ${currency_display_code}`}
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='selection-list-popover'
            description={
                <Localize i18n_default_text='The amount you choose to receive at expiry for every point of change between the final price and the barrier.' />
            }
        >
            <SelectionListPopover
                options={payout_per_point_list}
                selectedValue={payout_per_point}
                onSelect={handlePayoutSelect}
                className='selection-list-popover'
            />
        </TradeParameterPopover>
    );
});

export default PayoutPerPointDesktop;
