import React from 'react';

import { useStore } from '@deriv/stores';
import { Skeleton } from '@deriv-com/quill-ui';

import StreamIframe from 'AppV2/Components/StreamIframe';
import { ASPECT_RATIO } from 'AppV2/Utils/layout-utils';
import { getOnboardingVideoId } from 'AppV2/Utils/video-config';

type TOnboardingVideoProps = {
    type: 'trade_page' | 'positions_page' | 'trade_page_dark' | 'positions_page_dark';
};

const OnboardingVideo = ({ type }: TOnboardingVideoProps) => {
    const { ui } = useStore();
    const { is_dark_mode_on } = ui;

    // Extract page type and determine theme from type prop
    const page_type = type.replace('_dark', '') as 'trade_page' | 'positions_page';
    const is_dark = type.includes('_dark') || is_dark_mode_on;

    const video_id = getOnboardingVideoId(page_type, is_dark);

    return (
        <StreamIframe
            src={video_id}
            title={`onboarding_${page_type}`}
            autoplay
            loop
            muted
            data-testid='dt_onboarding_guide_video'
        />
    );
};

export default OnboardingVideo;
