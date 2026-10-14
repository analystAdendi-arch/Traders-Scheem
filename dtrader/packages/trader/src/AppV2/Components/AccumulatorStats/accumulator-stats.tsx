import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { LabelPairedChevronUpSmBoldIcon, LabelPairedXmarkMdRegularIcon } from '@deriv/quill-icons';
import { observer } from '@deriv/stores';
import { ActionSheet, Heading, Modal, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import { UNIFIED_MODE_VIDEO_ID } from 'AppV2/Utils/video-config';
import { useTraderStore } from 'Stores/useTraderStores';

import StreamIframe from '../StreamIframe';

import AccumulatorStatsDescription from './accumulator-stats-description';
import AccumulatorStatsModal from './accumulator-stats-modal';
import StatsRow from './accumulator-stats-row';

// Move components outside observer to prevent unnecessary re-renders
const DesktopExpandedView = React.memo(
    ({ ticks_history }: { ticks_history: number[] }) => {
        if (ticks_history.length === 0) return null;

        // Create rows with 10 values each for expanded view
        const expandedRows: number[][] = [];
        const row_size = 10;
        for (let i = 0; i < ticks_history.length; i += row_size) {
            expandedRows.push(ticks_history.slice(i, i + row_size));
        }

        return (
            <div className='accumulators-stats-v2__expanded'>
                {expandedRows.map((row: number[], index: number) => (
                    <div key={index} className='accumulators-stats-v2__expanded__row'>
                        {row.map((value: number, innerIndex: number) => (
                            <div key={`${index}-${innerIndex}`} className='accumulators-stats-v2__expanded__stat'>
                                <Text size='sm'>{value}</Text>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison: only re-render if ticks_history array changed
        if (prevProps.ticks_history.length !== nextProps.ticks_history.length) return false;
        return prevProps.ticks_history.every((val, index) => val === nextProps.ticks_history[index]);
    }
);
DesktopExpandedView.displayName = 'DesktopExpandedView';

const DesktopStatsModal = React.memo(({ is_open, onClose }: { is_open: boolean; onClose: () => void }) => (
    <Modal
        isOpened={is_open}
        showHandleBar={false}
        showSecondaryButton={false}
        showCrossIcon={false}
        isMobile={false}
        primaryButtonLabel={<Localize i18n_default_text='Got it' />}
        primaryButtonCallback={onClose}
        toggleModal={onClose}
        className='accumulator-stats-desktop-modal'
    >
        <div className='accumulator-stats-desktop-modal__header'>
            <Heading.H4>
                <Localize i18n_default_text='Stats' />
            </Heading.H4>
            <button className='accumulator-stats-desktop-modal__close' onClick={onClose} aria-label='Close'>
                <LabelPairedXmarkMdRegularIcon />
            </button>
        </div>
        <div className='accumulator-stats-desktop-modal__content'>
            <div className='accumulator-stats-desktop-modal__video'>
                <StreamIframe src={UNIFIED_MODE_VIDEO_ID.accumulator_stats} title='accumulator_stats' />
            </div>
            <Text className='accumulator-stats-desktop-modal__description'>
                <Localize i18n_default_text='Stats show the history of consecutive tick counts, i.e. the number of ticks the price remained within range continuously.' />
            </Text>
        </div>
    </Modal>
));
DesktopStatsModal.displayName = 'DesktopStatsModal';

const AccumulatorStats = observer(() => {
    const { ticks_history_stats = {} } = useTraderStore();
    const { isDesktop } = useDevice();
    const [is_open, setIsOpen] = useState(false);
    const [is_open_description, setIsOpenDescription] = useState(false);
    const [is_expanded_desktop, setIsExpandedDesktop] = useState(false);
    const [is_modal_open, setIsModalOpen] = useState(false);
    const [animation_class, setAnimationClass] = useState('');
    const last_value_ref = useRef<number | null>(null);
    const [is_moving_transaction, setIsMovingTransition] = useState(false);

    const ticks_history = useMemo(() => {
        return ticks_history_stats?.ticks_stayed_in ?? [];
    }, [ticks_history_stats]);

    const rows: number[][] = useMemo(() => {
        const row_size = 5;
        return ticks_history.reduce<number[][]>((acc, _el, index) => {
            if (index % row_size === 0) {
                acc.push(ticks_history.slice(index, index + row_size));
            }
            return acc;
        }, []);
    }, [ticks_history]);

    const onActionSheetClose = useCallback(() => {
        setIsOpen(false);
        setIsOpenDescription(false);
    }, []);

    const onModalClose = useCallback(() => setIsModalOpen(false), []);

    useEffect(() => {
        let success_timeout: ReturnType<typeof setTimeout> | undefined,
            error_timeout: ReturnType<typeof setTimeout> | undefined,
            transition_timeout: ReturnType<typeof setTimeout> | undefined;

        if (rows[0] && rows[0].length > 0) {
            setAnimationClass('');

            const is_same_value = last_value_ref.current === rows[0][1];

            is_same_value
                ? (error_timeout = setTimeout(() => setAnimationClass('animate-error'), 0))
                : (success_timeout = setTimeout(() => setAnimationClass('animate-success'), 0));

            setIsMovingTransition(is_same_value);
            if (is_same_value) {
                transition_timeout = setTimeout(() => setIsMovingTransition(false), 600);
            }

            last_value_ref.current = rows[0][0];
        }

        return () => {
            clearTimeout(success_timeout);
            clearTimeout(error_timeout);
            clearTimeout(transition_timeout);
        };
    }, [ticks_history]);

    if (rows.length === 0) {
        return null;
    }
    return (
        <React.Fragment>
            <div
                className={`accumulators-stats-v2${isDesktop && is_expanded_desktop ? ' accumulators-stats-v2--is-expanded' : ''}`}
            >
                <div className='accumulators-stats-v2__container'>
                    <button
                        className='accumulators-stats-v2__container__heading'
                        onClick={() => (isDesktop ? setIsModalOpen(true) : setIsOpenDescription(true))}
                    >
                        <Text size='sm'>
                            <Localize i18n_default_text='Stats' />
                        </Text>
                    </button>
                    {/* Show "History of tick counts" when expanded on desktop, otherwise show stats row */}
                    {isDesktop && is_expanded_desktop ? (
                        <div className='accumulators-stats-v2__container__expanded-header'>
                            <Text size='sm' bold>
                                <Localize i18n_default_text='History of tick counts' />
                            </Text>
                        </div>
                    ) : (
                        <>
                            <div className='accumulators-stats-v2__container__divider' />
                            <div className='accumulators-stats-v2__container__stats'>
                                <StatsRow
                                    rows={[...rows[0], ...(rows[1] || [])]}
                                    animation_class={animation_class}
                                    is_moving_transaction={is_moving_transaction}
                                    className='accumulators-stats-v2__container__stats'
                                />
                            </div>
                        </>
                    )}
                    <button
                        className={clsx('accumulators-stats-v2__container__expand', {
                            'accumulators-stats-v2__container__expand--rotated': isDesktop && is_expanded_desktop,
                        })}
                        onClick={() => (isDesktop ? setIsExpandedDesktop(!is_expanded_desktop) : setIsOpen(true))}
                    >
                        <LabelPairedChevronUpSmBoldIcon
                            data-testid='expand-stats-icon'
                            fill='var(--semantic-color-monochrome-textIcon-normal-high)'
                        />
                    </button>
                </div>

                {/* Desktop expanded view */}
                {isDesktop && is_expanded_desktop && <DesktopExpandedView ticks_history={ticks_history} />}
            </div>

            {/* Desktop Modal */}
            {isDesktop && is_modal_open && <DesktopStatsModal is_open={is_modal_open} onClose={onModalClose} />}

            {/* Mobile ActionSheet - unchanged */}
            {!isDesktop && (
                <ActionSheet.Root
                    isOpen={is_open || is_open_description}
                    onClose={onActionSheetClose}
                    position='left'
                    className='accumulator-stats-sheet-wrapper'
                    expandable={false}
                >
                    {is_open && (
                        <AccumulatorStatsModal
                            rows={rows}
                            is_moving_transaction={is_moving_transaction}
                            animation_class={animation_class}
                        />
                    )}
                    {is_open_description && <AccumulatorStatsDescription onActionSheetClose={onActionSheetClose} />}
                </ActionSheet.Root>
            )}
        </React.Fragment>
    );
});

export default AccumulatorStats;
