import React from 'react';
import { useLocation } from 'react-router-dom';

import { isDisabledLandscapeBlockerRoute, isMobileOs, isTabletOs, routes } from '@deriv/shared';
import { observer } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import LandscapeBlockerSvg from 'Assets/SvgComponents/settings/landscape-blocker.svg';

import './landscape-blocker.scss';

const LandscapeBlocker = observer(() => {
    const { localize } = useTranslations();
    const { isMobile } = useDevice();
    const location = useLocation();
    const pathname = location?.pathname;
    const is_hidden_landscape_blocker = isDisabledLandscapeBlockerRoute(pathname);
    const should_show_dtrader_tablet_view = pathname === routes.index && isTabletOs;
    const show_blocker_on_mobile_landscape_view =
        !isMobile &&
        isMobileOs() &&
        (pathname.startsWith(routes.index) || pathname.startsWith(routes.reports) || pathname.startsWith('/contract'));

    if (!show_blocker_on_mobile_landscape_view && (is_hidden_landscape_blocker || should_show_dtrader_tablet_view))
        return null;

    return (
        <div id='landscape_blocker' className='landscape-blocker'>
            <div className='landscape-blocker__icon'>
                <LandscapeBlockerSvg />
            </div>
            <div className='landscape-blocker__message--landscape'>
                {localize('Please rotate your device to portrait view.')}
            </div>
            <div className='landscape-blocker__message--portrait'>
                {localize('Please rotate your device to portrait view.')}
            </div>
        </div>
    );
});

export default LandscapeBlocker;
