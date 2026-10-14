import React, { useCallback, useState } from 'react';

import { TooltipPortal } from '@deriv/components';
import { ActionSheet, CaptionText, Text } from '@deriv-com/quill-ui';
import { useDevice } from '@deriv-com/ui';

type TEntryExitDetailRowProps = {
    label: React.ReactNode;
    value?: string;
    date?: string;
    time: string;
    tooltip_message?: React.ReactNode;
    onLabelClick?: () => void;
};

const EntryExitDetailRow = ({ label, value, date, time, tooltip_message, onLabelClick }: TEntryExitDetailRowProps) => {
    const { isDesktop } = useDevice();
    const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(false);
    const hasTooltip = !!tooltip_message;

    const handleLabelClick = useCallback(() => {
        if (!isDesktop && hasTooltip) {
            setIsActionSheetOpen(true);
        }
        onLabelClick?.();
    }, [isDesktop, hasTooltip, onLabelClick]);

    return (
        <>
            <div className='entry-exit-details__table-row'>
                <div className='entry-exit-details__table-cell'>
                    {hasTooltip && tooltip_message ? (
                        isDesktop ? (
                            <TooltipPortal message={tooltip_message} position='top'>
                                <Text
                                    size='sm'
                                    color='quill-typography__color--subtle'
                                    className='entry-exit-details__label--with-tooltip'
                                >
                                    {label}
                                </Text>
                            </TooltipPortal>
                        ) : (
                            <Text
                                size='sm'
                                color='quill-typography__color--subtle'
                                className='entry-exit-details__label--with-tooltip'
                                onClick={handleLabelClick}
                            >
                                {label}
                            </Text>
                        )
                    ) : (
                        <Text size='sm' color='quill-typography__color--subtle'>
                            {label}
                        </Text>
                    )}
                </div>
                <div className='entry-exit-details__table-cell'>
                    <Text size='sm'>{value}</Text>
                    <Text size='sm' color='quill-typography__color--subtle'>
                        {date}
                    </Text>
                    <CaptionText color='quill-typography__color--subtle'>{time}</CaptionText>
                </div>
            </div>
            {!isDesktop && hasTooltip && (
                <ActionSheet.Root
                    isOpen={isActionSheetOpen}
                    onClose={() => setIsActionSheetOpen(false)}
                    className='entry-exit-details__action-sheet'
                >
                    <ActionSheet.Portal shouldCloseOnDrag>
                        <ActionSheet.Header title={label} />
                        <ActionSheet.Content className='entry-exit-details__action-sheet-content'>
                            <Text size='sm'>{tooltip_message}</Text>
                        </ActionSheet.Content>
                        <ActionSheet.Footer
                            alignment='vertical'
                            primaryAction={{
                                content: 'Got it',
                                onAction: () => setIsActionSheetOpen(false),
                            }}
                            primaryButtonColor='coral'
                        />
                    </ActionSheet.Portal>
                </ActionSheet.Root>
            )}
        </>
    );
};

export default EntryExitDetailRow;
