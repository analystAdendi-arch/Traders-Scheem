import React from 'react';
import { useLocation, withRouter } from 'react-router';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { ThemedScrollbars } from '@deriv/components';
import { redirectToLogin } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

import CookieBanner from '../../Components/Elements/CookieBanner/cookie-banner.jsx';

const AppContents = observer(({ children }) => {
    const [show_cookie_banner, setShowCookieBanner] = React.useState(false);
    const { client, common, ui } = useStore();
    const { isDesktop, isMobile } = useDevice();
    const location = useLocation();
    const has_access_denied_error = location.search.includes('access_denied');

    const { is_logged_in, is_logging_in, should_redirect_user_to_login, setShouldRedirectToLogin } = client;
    const {
        is_app_disabled,
        active_sidebar_flyout,
        is_route_modal_on,
        notifyAppInstall,
        setAppContentsScrollRef,
        is_dark_mode_on: is_dark_mode,
    } = ui;

    const scroll_ref = React.useRef(null);
    const child_ref = React.useRef(null);

    React.useEffect(() => {
        const run = async () => {
            if (should_redirect_user_to_login && client.is_client_store_initialized) {
                const hasAccountId = !!localStorage.getItem('account_id');

                if (hasAccountId) {
                    setShouldRedirectToLogin(false);
                } else {
                    setShouldRedirectToLogin(false);
                    await redirectToLogin(common.current_language);
                }
            }
        };
        run();
    }, [should_redirect_user_to_login, is_logged_in, setShouldRedirectToLogin, client.is_client_store_initialized]);

    React.useEffect(() => {
        if (scroll_ref.current) setAppContentsScrollRef(scroll_ref);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        if (!is_logged_in && !is_logging_in) {
            setShowCookieBanner(false);
        }
    }, [is_logged_in, is_logging_in]);

    React.useEffect(() => {
        if (child_ref.current) {
            child_ref.current.scrollTop = 0;
        }
    }, [location?.pathname]);

    React.useEffect(() => {
        const handleInstallPrompt = e => {
            e.preventDefault();
            notifyAppInstall(e);
        };
        window.addEventListener('beforeinstallprompt', handleInstallPrompt);

        return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    }, [notifyAppInstall]);

    const onAccept = () => {
        setShowCookieBanner(false);
    };

    const onDecline = () => {
        setShowCookieBanner(false);
    };

    return (
        <div
            id='app_contents'
            className={classNames('app-contents', {
                'app-contents--show-positions-drawer': active_sidebar_flyout,
                'app-contents--is-disabled': is_app_disabled,
                'app-contents--is-mobile': isMobile,
                'app-contents--is-route-modal': is_route_modal_on,
                'app-contents--is-hidden': has_access_denied_error,
                'app-contents--is-dtrader-v2': isMobile,
            })}
            ref={scroll_ref}
        >
            {isMobile && children}
            {!isMobile && (
                /* Calculate height of user screen and offset height of header and footer */
                <ThemedScrollbars height={isDesktop ? '100vh' : undefined} has_horizontal refSetter={child_ref}>
                    {children}
                </ThemedScrollbars>
            )}
            {show_cookie_banner && (
                <CookieBanner
                    onAccept={onAccept}
                    onDecline={onDecline}
                    is_open={show_cookie_banner}
                    is_dark_mode={is_dark_mode}
                />
            )}
        </div>
    );
});

AppContents.propTypes = {
    children: PropTypes.any,
};

export default withRouter(AppContents);
