import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { Money, Skeleton } from '@deriv/components';
import { CONTRACT_TYPES } from '@deriv/shared';
import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

const MultipliersDealCancellationInfo = observer(() => {
    const { currency, is_market_closed, proposal_info } = useTraderStore();

    const up_deal_cancellation_fee = proposal_info?.[CONTRACT_TYPES.MULTIPLIER.UP]?.cancellation?.ask_price;
    const down_deal_cancellation_fee = proposal_info?.[CONTRACT_TYPES.MULTIPLIER.DOWN]?.cancellation?.ask_price;

    // Use UP fee, fallback to DOWN if UP is not available
    const deal_cancellation_fee = up_deal_cancellation_fee ?? down_deal_cancellation_fee;

    const has_error =
        proposal_info?.[CONTRACT_TYPES.MULTIPLIER.UP]?.has_error ||
        proposal_info?.[CONTRACT_TYPES.MULTIPLIER.DOWN]?.has_error;

    if (has_error) return null;

    return (
        <div className='multipliers-info__container multipliers-info__container--stacked'>
            <div className='multipliers-info__row'>
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Localize i18n_default_text='DC fee' />
                </Text>
                {deal_cancellation_fee ? (
                    <Text size='sm' as='div' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        <Money amount={deal_cancellation_fee} show_currency currency={currency} />
                    </Text>
                ) : (
                    <Skeleton width={65} height={18} />
                )}
            </div>
        </div>
    );
});

export default MultipliersDealCancellationInfo;
