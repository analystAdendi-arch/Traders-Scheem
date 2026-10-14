import React from 'react';

import { isTabletOs } from '@deriv/shared';
import { useDevice } from '@deriv-com/ui';

type TUseTabletLandscapeParams = {
    is_chart_loading?: boolean;
    should_show_active_symbols_loading?: boolean;
};

const useTabletLandscape = ({
    is_chart_loading = false,
    should_show_active_symbols_loading = false,
}: TUseTabletLandscapeParams = {}) => {
    const { isTabletPortrait } = useDevice();
    const [should_show_portrait_loader, setShouldShowPortraitLoader] = React.useState(false);
    const rotate_timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const portrait_loader_timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        const html = document.documentElement;
        if (isTabletPortrait && isTabletOs) {
            setShouldShowPortraitLoader(true);
            if (!is_chart_loading && !should_show_active_symbols_loading) {
                rotate_timeout.current = setTimeout(() => {
                    html.classList.add('tablet-landscape');
                    portrait_loader_timeout.current = setTimeout(() => {
                        setShouldShowPortraitLoader(false);
                    }, 600);
                }, 500);
            }
        }

        return () => {
            html.classList.remove('tablet-landscape');
            if (rotate_timeout.current) {
                clearTimeout(rotate_timeout.current);
            }
            if (portrait_loader_timeout.current) {
                clearTimeout(portrait_loader_timeout.current);
            }
        };
    }, [isTabletPortrait, is_chart_loading, should_show_active_symbols_loading]);

    return { should_show_portrait_loader };
};

export default useTabletLandscape;
