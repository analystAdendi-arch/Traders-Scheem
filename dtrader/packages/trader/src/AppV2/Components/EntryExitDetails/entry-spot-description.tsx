import React from 'react';

import { ActionSheet, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { getEntrySpotTooltipText } from '_common/utils/contract-entry-spot-helper';

type TEntrySpotDescriptionProps = {
    onActionSheetClose: () => void;
    contract_type?: string;
};

const EntrySpotDescription = ({ onActionSheetClose, contract_type }: TEntrySpotDescriptionProps) => {
    const tooltipText = getEntrySpotTooltipText(contract_type);

    return (
        <ActionSheet.Portal showHandlebar shouldCloseOnDrag>
            <div className='entry-spot-description'>
                <div className='entry-spot-description__content'>
                    <div>
                        <Text
                            as='p'
                            size='xl'
                            bold
                            color='quill-typography__color--prominent'
                            className='entry-spot-description__content__title'
                        >
                            <Localize i18n_default_text='Entry spot' />
                        </Text>
                    </div>
                    <div className='entry-spot-description__content__description'>
                        <Text>
                            <Localize i18n_default_text={tooltipText} />
                        </Text>
                    </div>
                </div>
            </div>
            <ActionSheet.Footer
                alignment='vertical'
                primaryAction={{
                    content: <Localize i18n_default_text='Got it' />,
                    onAction: onActionSheetClose,
                }}
            />
        </ActionSheet.Portal>
    );
};

export default EntrySpotDescription;
