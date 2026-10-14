import clsx from 'clsx';

import { Money, Skeleton } from '@deriv/components';
import { observer } from '@deriv/stores';
import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { getProposalInfoKey } from 'AppV2/Utils/trade-params-utils';
import { useTraderStore } from 'Stores/useTraderStores';

const PayoutInfo = observer(() => {
    const { currency, is_market_closed, proposal_info, trade_type_tab, contract_type } = useTraderStore();
    const proposal_key = getProposalInfoKey(proposal_info, trade_type_tab, contract_type);
    const { value: payout } = proposal_info[proposal_key]?.obj_contract_basis || {};
    const has_error = proposal_info[proposal_key]?.has_error;

    return (
        <div className='payout-info__container'>
            <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                <Localize i18n_default_text='Payout' />
            </Text>
            {payout ? (
                <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                    <Money amount={payout} show_currency currency={currency} />
                </Text>
            ) : has_error ? (
                <Text size='sm'>- {currency}</Text>
            ) : (
                <Skeleton width={60} height={14} />
            )}
        </div>
    );
});

export default PayoutInfo;
