import React from 'react';
import clsx from 'clsx';

import { Money } from '@deriv/components';
import { getLocalizedBasis } from '@deriv/shared';
import { CaptionText } from '@deriv-com/quill-ui';
import { useTranslations } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

type TPurchaseButtonContent = {
    has_no_button_content?: boolean;
    info: ReturnType<typeof useTraderStore>['proposal_info'][0] | Record<string, never>;
    is_reverse?: boolean;
} & Pick<
    ReturnType<typeof useTraderStore>,
    'currency' | 'has_cancellation' | 'has_open_accu_contract' | 'is_multiplier' | 'is_vanilla' | 'is_turbos'
>;

const PurchaseButtonContent = ({
    currency,
    has_cancellation,
    has_open_accu_contract,
    has_no_button_content,
    info,
    is_multiplier,
    is_turbos,
    is_vanilla,
    is_reverse,
}: TPurchaseButtonContent) => {
    const { localize } = useTranslations();
    const { payout } = getLocalizedBasis();

    if (has_no_button_content || (is_multiplier && !has_cancellation)) return null;

    const getAmount = () => {
        const { stake, obj_contract_basis } = info;
        if (is_multiplier) {
            // For multipliers, the stake value from proposal_info already includes all fees
            // (base stake + commission + DC fee if applicable)
            // So we just return the stake value directly
            const total_cost = typeof stake === 'string' ? parseFloat(stake) || 0 : stake || 0;
            return total_cost;
        }
        return obj_contract_basis?.value;
    };

    const getTextBasis = () => {
        if (is_multiplier) {
            return has_cancellation ? localize('Total cost') : undefined;
        }
        return payout;
    };

    const text_basis = getTextBasis();
    const amount = getAmount();
    const is_content_empty = !text_basis || !amount;

    return (
        <CaptionText
            size='sm'
            className={clsx(
                'purchase-button__information__wrapper',
                is_reverse && 'purchase-button__information__wrapper--reverse',
                is_content_empty && 'purchase-button__information__wrapper--disabled-placeholder'
            )}
            data-testid='dt_purchase_button_wrapper'
        >
            {!is_content_empty && (
                <React.Fragment>
                    <CaptionText
                        as='span'
                        size='sm'
                        className={clsx(!has_open_accu_contract && 'purchase-button__information__item')}
                        color='quill-typography__color--prominent'
                    >
                        {text_basis}
                    </CaptionText>
                    <CaptionText
                        as='span'
                        size='sm'
                        className={clsx(!has_open_accu_contract && 'purchase-button__information__item')}
                        color='quill-typography__color--prominent'
                    >
                        <Money
                            amount={amount}
                            currency={currency}
                            should_format={!is_turbos && !is_vanilla}
                            show_currency
                        />
                    </CaptionText>
                </React.Fragment>
            )}
        </CaptionText>
    );
};

export default PurchaseButtonContent;
