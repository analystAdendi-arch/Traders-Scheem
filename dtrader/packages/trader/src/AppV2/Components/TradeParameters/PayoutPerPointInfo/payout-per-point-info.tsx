import React from 'react';
import clsx from 'clsx';

import { Skeleton, TooltipPortal } from '@deriv/components';
import { clickAndKeyEventHandler } from '@deriv/shared';
import { observer } from '@deriv/stores';
import { ActionSheet, Heading, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import { useTraderStore } from 'Stores/useTraderStores';

const PayoutPerPointInfo = observer(() => {
    const { contract_type, currency, is_market_closed, proposal_info } = useTraderStore();
    const { isDesktop } = useDevice();
    const [is_open, setIsOpen] = React.useState(false);

    const contract_key = contract_type.toUpperCase();
    const { value: payout_per_point } = proposal_info[contract_key]?.obj_contract_basis || {};
    const has_error = proposal_info[contract_key]?.has_error;

    if (has_error) return null;

    const tooltipMessage = (
        <Localize i18n_default_text="The money you earn or lose for every one-point change in an asset's price." />
    );

    const openDescription = (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
        if (is_market_closed) return;
        if (isDesktop) return;
        clickAndKeyEventHandler(() => setIsOpen(true), e);
    };

    const closeDescription = () => setIsOpen(false);

    return (
        <React.Fragment>
            <div className='payout-per-point-info__container'>
                {isDesktop ? (
                    <TooltipPortal message={tooltipMessage} position='left'>
                        <Text
                            size='sm'
                            className={clsx(
                                'payout-per-point-info__label',
                                is_market_closed && 'trade-params__text--disabled'
                            )}
                        >
                            <Localize i18n_default_text='Payout per point' />
                        </Text>
                    </TooltipPortal>
                ) : (
                    <Text
                        size='sm'
                        className={clsx(
                            'payout-per-point-info__label',
                            is_market_closed && 'trade-params__text--disabled'
                        )}
                        onClick={openDescription}
                        onKeyDown={openDescription}
                    >
                        <Localize i18n_default_text='Payout per point' />
                    </Text>
                )}
                {payout_per_point ? (
                    <Text size='sm' className={clsx(is_market_closed && 'trade-params__text--disabled')}>
                        {payout_per_point} {currency}
                    </Text>
                ) : (
                    <Skeleton width={100} height={14} />
                )}
            </div>
            {!isDesktop && (
                <ActionSheet.Root isOpen={is_open} onClose={closeDescription} position='left' expandable={false}>
                    <ActionSheet.Portal shouldCloseOnDrag>
                        <ActionSheet.Content className='payout-per-point-info__definition__wrapper'>
                            <Heading.H4 className='payout-per-point-info__definition__title'>
                                <Localize i18n_default_text='Payout per point' />
                            </Heading.H4>
                            <Text as='div'>
                                <Localize i18n_default_text="The money you earn or lose for every one-point change in an asset's price." />
                            </Text>
                        </ActionSheet.Content>
                        <ActionSheet.Footer
                            alignment='vertical'
                            primaryAction={{
                                content: <Localize i18n_default_text='Got it' />,
                                onAction: closeDescription,
                            }}
                            className='payout-per-point-info__button'
                        />
                    </ActionSheet.Portal>
                </ActionSheet.Root>
            )}
        </React.Fragment>
    );
});

export default PayoutPerPointInfo;
