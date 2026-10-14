import React from 'react';
import classNames from 'classnames';

import { Popover } from '@deriv/components';
import { LegacyFullscreen1pxIcon, LegacyRestore1pxIcon } from '@deriv/quill-icons';
import { useTranslations } from '@deriv-com/translations';

const fullscreen_map = {
    event: ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'],
    element: ['fullscreenElement', 'webkitFullscreenElement', 'mozFullScreenElement', 'msFullscreenElement'],
    fnc_enter: ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen'],
    fnc_exit: ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen'],
};

type TToggleFullScreenProps = {
    showPopover?: boolean;
};

const ToggleFullScreen: React.FC<TToggleFullScreenProps> = ({ showPopover }) => {
    const { localize } = useTranslations();
    const [is_full_screen, setIsFullScreen] = React.useState(false);

    const onFullScreen = React.useCallback(() => {
        setIsFullScreen(fullscreen_map.element.some(el => document[el as keyof Document]));
    }, []);

    React.useEffect(() => {
        onFullScreen();

        fullscreen_map.event.forEach(event => {
            document.addEventListener(event, onFullScreen, false);
        });
        return () => {
            fullscreen_map.event.forEach(event => {
                document.removeEventListener(event, onFullScreen, false);
            });
        };
    }, [onFullScreen]);

    const toggleFullScreen = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation();

        const to_exit = is_full_screen;
        const el = to_exit ? document : document.documentElement;
        const fncToCall = fullscreen_map[to_exit ? 'fnc_exit' : 'fnc_enter'].find(fnc => el[fnc as keyof typeof el]);

        if (fncToCall) {
            (el[fncToCall as keyof typeof el] as () => void)();
        } else {
            setIsFullScreen(false);
        }
    };

    const full_screen_icon_class = classNames('trade-params-footer__fullscreen', {
        'trade-params-footer__fullscreen--active': is_full_screen,
    });

    const fullScreenIcon = is_full_screen ? (
        <LegacyRestore1pxIcon className='trade-params-footer__icon' iconSize='xs' fill='var(--color-text-primary)' />
    ) : (
        <LegacyFullscreen1pxIcon
            data-testid='dt_icon'
            className='trade-params-footer__icon'
            iconSize='xs'
            fill='var(--color-text-primary)'
        />
    );

    return (
        <a
            data-testid='dt_fullscreen_toggle'
            className={full_screen_icon_class}
            onClick={toggleFullScreen}
            id='dt_fullscreen_toggle'
        >
            {showPopover ? (
                <Popover
                    alignment='top'
                    message={is_full_screen ? localize('Exit') : localize('Full screen')}
                    zIndex='9999'
                >
                    {fullScreenIcon}
                </Popover>
            ) : (
                fullScreenIcon
            )}
        </a>
    );
};

export default ToggleFullScreen;
