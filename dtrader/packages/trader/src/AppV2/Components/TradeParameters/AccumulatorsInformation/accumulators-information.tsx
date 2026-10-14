import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { Money, Skeleton } from '@deriv/components';
import { CONTRACT_TYPES } from '@deriv/shared';
import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

const AccumulatorsInformation = observer(() => {
    const { currency, is_market_closed, maximum_payout, maximum_ticks, proposal_info, tick_size_barrier_percentage } =
        useTraderStore();
    const has_error = proposal_info[CONTRACT_TYPES.ACCUMULATOR]?.has_error;

    if (has_error) return null;

    const barrier_value = tick_size_barrier_percentage ? `± ${tick_size_barrier_percentage}` : null;
    const duration_value = maximum_ticks ? `${maximum_ticks} ticks` : null;

    return (
        <div className='accumulators-info__wrapper'>
            {/* Max. payout - Always visible */}
            <div className='accumulators-info__row'>
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Localize i18n_default_text='Max. payout' />
                </Text>
                {maximum_payout ? (
                    <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        <Money amount={maximum_payout} show_currency currency={currency} />
                    </Text>
                ) : (
                    <Skeleton width={100} height={14} />
                )}
            </div>

            {/* Barrier - Hidden in collapsed mode on mobile */}
            <div className='accumulators-info__row accumulators-info__row--collapsible'>
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Localize i18n_default_text='Barrier' />
                </Text>
                {barrier_value ? (
                    <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        {barrier_value}
                    </Text>
                ) : (
                    <Skeleton width={100} height={14} />
                )}
            </div>

            {/* Max. duration - Hidden in collapsed mode on mobile */}
            <div className='accumulators-info__row accumulators-info__row--collapsible'>
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Localize i18n_default_text='Max. duration' />
                </Text>
                {duration_value ? (
                    <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        {duration_value}
                    </Text>
                ) : (
                    <Skeleton width={100} height={14} />
                )}
            </div>
        </div>
    );
});

export default AccumulatorsInformation;
