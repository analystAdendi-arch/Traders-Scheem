import React from 'react';

import { Stream, StreamPlayerApi } from '@cloudflare/stream-react';
import { LabelPairedPlayMdFillIcon } from '@deriv/quill-icons';
import { CaptionText } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

type TVideoPreview = {
    contract_type: string;
    toggleVideoPlayer?: () => void;
    video_src: string;
};

const VideoPreview = ({ contract_type, toggleVideoPlayer, video_src }: TVideoPreview) => {
    const [is_playing, setIsPlaying] = React.useState(false);
    const { isDesktop } = useDevice();
    const streamRef = React.useRef<StreamPlayerApi>();

    const handlePlayClick = () => {
        if (isDesktop) {
            // Desktop: play inline
            setIsPlaying(true);
            streamRef.current?.play();
        } else if (toggleVideoPlayer) {
            // Mobile: open fullscreen modal
            toggleVideoPlayer();
        }
    };

    const show_preview = !isDesktop || !is_playing;

    return (
        <div className='guide-video__wrapper'>
            <div
                className={show_preview ? 'guide-video__preview' : 'guide-video__player'}
                data-testid={show_preview ? 'dt_video_preview' : 'dt_video_player'}
                {...(show_preview && { onClick: handlePlayClick, onKeyDown: handlePlayClick })}
            >
                <Stream
                    className='guide-video'
                    letterboxColor='transparent'
                    muted
                    preload='auto'
                    responsive={false}
                    src={video_src}
                    width={isDesktop ? '448px' : '112px'}
                    height={isDesktop ? '252px' : '73px'}
                    controls={isDesktop && is_playing}
                    streamRef={streamRef}
                />
                {show_preview && (
                    <div className='guide-video__preview__icon__wrapper'>
                        <LabelPairedPlayMdFillIcon className='guide-video__preview__icon' />
                    </div>
                )}
            </div>
            {!isDesktop && (
                <div className='guide-video__description'>
                    <CaptionText bold>
                        <Localize i18n_default_text='How to trade {{contract_type}}?' values={{ contract_type }} />
                    </CaptionText>
                    <CaptionText>
                        <Localize i18n_default_text='Watch this video to learn about this trade type.' />
                    </CaptionText>
                </div>
            )}
        </div>
    );
};

export default VideoPreview;
