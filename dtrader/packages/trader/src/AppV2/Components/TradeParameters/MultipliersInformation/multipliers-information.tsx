import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { Money, Skeleton } from '@deriv/components';
import { CONTRACT_TYPES } from '@deriv/shared';
import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

import './multipliers-information.scss';

const MultipliersInformation = observer(() => {
    const { currency, is_market_closed, proposal_info } = useTraderStore();

    const up_commission = proposal_info?.[CONTRACT_TYPES.MULTIPLIER.UP]?.commission;
    const down_commission = proposal_info?.[CONTRACT_TYPES.MULTIPLIER.DOWN]?.commission;
    const up_stop_out = proposal_info?.[CONTRACT_TYPES.MULTIPLIER.UP]?.limit_order?.stop_out?.order_amount;
    const down_stop_out = proposal_info?.[CONTRACT_TYPES.MULTIPLIER.DOWN]?.limit_order?.stop_out?.order_amount;

    // Use UP values, fallback to DOWN if UP is not available
    const commission = up_commission ?? down_commission;
    const stop_out = up_stop_out ?? down_stop_out;

    const has_error =
        proposal_info?.[CONTRACT_TYPES.MULTIPLIER.UP]?.has_error ||
        proposal_info?.[CONTRACT_TYPES.MULTIPLIER.DOWN]?.has_error;

    if (has_error) return null;

    return (
        <div className='multipliers-information__container'>
            {/* Stop out - Always visible */}
            <div className='multipliers-information__row'>
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Localize i18n_default_text='Stop out' />
                </Text>
                {stop_out !== undefined && stop_out !== null ? (
                    <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        <Money amount={Math.abs(stop_out)} show_currency currency={currency} />
                    </Text>
                ) : (
                    <Skeleton width={100} height={14} />
                )}
            </div>

            {/* Commission - Hidden in collapsed mode on mobile */}
            <div className='multipliers-information__row multipliers-information__row--collapsible'>
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Localize i18n_default_text='Commission' />
                </Text>
                {commission !== undefined && commission !== null ? (
                    <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        <Money amount={commission} show_currency currency={currency} />
                    </Text>
                ) : (
                    <Skeleton width={100} height={14} />
                )}
            </div>
        </div>
    );
});

export default MultipliersInformation;
