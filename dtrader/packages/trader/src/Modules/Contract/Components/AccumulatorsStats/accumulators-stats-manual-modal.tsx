import React from 'react';

import { Modal, Text } from '@deriv/components';
import { LegacyInfo1pxIcon } from '@deriv/quill-icons';
import { isMobile } from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import StreamIframe from 'AppV2/Components/StreamIframe';
import { getAccumulatorManualVideoId } from 'AppV2/Utils/video-config';

import 'Sass/app/modules/contract/accumulators-stats.scss';

type TAccumulatorsStatsManualModal = {
    icon_classname: string;
    is_dark_theme?: boolean;
    is_manual_open: boolean;
    title: string;
    toggleManual: () => void;
};

const AccumulatorsStatsManualModal = ({
    icon_classname,
    is_dark_theme,
    is_manual_open,
    title,
    toggleManual,
}: TAccumulatorsStatsManualModal) => {
    const is_mobile = isMobile();
    const video_id = getAccumulatorManualVideoId(is_mobile ? 'mobile' : 'desktop', is_dark_theme);

    return (
        <React.Fragment>
            <LegacyInfo1pxIcon
                onClick={toggleManual}
                iconSize='xs'
                fill='var(--color-text-primary)'
                className={icon_classname}
                data-testid='dt_ic_info_icon'
            />
            <Modal
                is_open={is_manual_open && !!video_id}
                should_header_stick_body={false}
                title={title}
                toggleModal={toggleManual}
                width={is_mobile ? '328px' : '596px'}
                className='accumulators-stats-manual-modal'
            >
                <Modal.Body className='accumulators-stats-modal-body'>
                    <div className='accumulators-stats-modal-body__video'>
                        <StreamIframe
                            src={video_id}
                            title='accumulator_manual'
                            autoplay
                            loop
                            muted
                            data-testid='dt_accumulators_stats_manual_video'
                        />
                    </div>
                    <Text
                        as='p'
                        size={is_mobile ? 'xs' : 's'}
                        color='primary'
                        className='accumulators-stats-modal-body__text'
                    >
                        <Localize i18n_default_text='Stats show the history of consecutive tick counts, i.e. the number of ticks the price remained within range continuously.' />
                    </Text>
                </Modal.Body>
            </Modal>
        </React.Fragment>
    );
};

export { AccumulatorsStatsManualModal };
