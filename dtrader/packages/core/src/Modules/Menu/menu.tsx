import React from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import classNames from 'classnames';

import { useMobileBridge } from '@deriv/api';
import { Text, ToggleSwitch } from '@deriv/components';
import {
    StandaloneChevronLeftRegularIcon,
    StandaloneChevronRightRegularIcon,
    StandaloneClockThreeRegularIcon,
    StandaloneFileChartColumnRegularIcon,
    StandaloneFileLinesRegularIcon,
    StandaloneGlobeRegularIcon,
    StandaloneLifeRingRegularIcon,
    StandaloneMoonRegularIcon,
    StandaloneRightFromBracketRegularIcon,
    StandaloneSunBrightRegularIcon,
    StandaloneUserPlusRegularIcon,
} from '@deriv/quill-icons';
import { getHelpCentreUrl, getSignupUrl, isFeatureEnabled, routes } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import { MobileLanguageMenu } from 'App/Components/Layout/Header/Components/ToggleMenu';
import MenuLink from 'App/Components/Layout/Header/menu-link';

const MenuPage = observer(() => {
    const history = useHistory();
    const { isMobile } = useDevice();
    const { sendBridgeEvent, isBridgeAvailable } = useMobileBridge();
    const { ui, client } = useStore();
    const { is_dark_mode_on: is_dark_mode, setDarkMode: toggleTheme } = ui;
    const { is_logged_in, logout: logoutClient } = client;
    const { localize } = useTranslations();

    const [show_language_selector, setShowLanguageSelector] = React.useState(false);

    const handleLogout = React.useCallback(async () => {
        try {
            await sendBridgeEvent('trading:back', async () => {
                await logoutClient();
            });
            history.push(routes.index);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Logout failed:', error);
        }
    }, [logoutClient, sendBridgeEvent, history]);

    const handleHelpCentreClick = React.useCallback(() => {
        window.open(getHelpCentreUrl(), '_blank', 'noopener,noreferrer');
    }, []);

    if (!isMobile) return <Redirect to={routes.index} />;

    return (
        <div className='menu-page'>
            {/* Main menu view */}
            <div
                className={classNames('menu-page__main', {
                    'menu-page__main--hidden': show_language_selector,
                })}
            >
                <div className='header__menu-mobile-body-wrapper'>
                    {/* [AI] Reports Section — only for logged-in users */}
                    {is_logged_in && (
                        <div className='header__menu-section'>
                            <div className='header__menu-section-header'>
                                <Text className='header__menu-section-title' size='xsm' weight='bold'>
                                    {localize('Reports')}
                                </Text>
                            </div>
                            <div className='menu-page__item' onClick={() => history.push(routes.positions)}>
                                <MenuLink
                                    icon={<StandaloneClockThreeRegularIcon iconSize='sm' />}
                                    text={localize('Open positions')}
                                    suffix_icon={<StandaloneChevronRightRegularIcon iconSize='sm' />}
                                />
                            </div>
                            <div className='menu-page__item' onClick={() => history.push(routes.profit)}>
                                <MenuLink
                                    icon={<StandaloneFileChartColumnRegularIcon iconSize='sm' />}
                                    text={localize('Trade table')}
                                    suffix_icon={<StandaloneChevronRightRegularIcon iconSize='sm' />}
                                />
                            </div>
                            <div className='menu-page__item' onClick={() => history.push(routes.statement)}>
                                <MenuLink
                                    icon={<StandaloneFileLinesRegularIcon iconSize='sm' />}
                                    text={localize('Statement')}
                                    suffix_icon={<StandaloneChevronRightRegularIcon iconSize='sm' />}
                                />
                            </div>
                        </div>
                    )}
                    {/* [/AI] */}

                    {/* Settings Section */}
                    {(isFeatureEnabled('language_switcher') || isFeatureEnabled('dark_mode')) && (
                        <div className='header__menu-section'>
                            <div className='header__menu-section-header'>
                                <Text className='header__menu-section-title' size='xsm' weight='bold'>
                                    {localize('Settings')}
                                </Text>
                            </div>
                            {isFeatureEnabled('language_switcher') && (
                                <div className='menu-page__item' onClick={() => setShowLanguageSelector(true)}>
                                    <MenuLink
                                        icon={<StandaloneGlobeRegularIcon iconSize='sm' />}
                                        text={localize('Language')}
                                        suffix_icon={<StandaloneChevronRightRegularIcon iconSize='sm' />}
                                    />
                                </div>
                            )}
                            {isFeatureEnabled('dark_mode') && (
                                <div className='menu-page__item' onClick={() => toggleTheme(!is_dark_mode)}>
                                    <div className={classNames('header__menu-mobile-link')}>
                                        {is_dark_mode ? (
                                            <StandaloneSunBrightRegularIcon
                                                className='header__menu-mobile-link-icon'
                                                iconSize='sm'
                                                fill='var(--color-text-primary)'
                                            />
                                        ) : (
                                            <StandaloneMoonRegularIcon
                                                className='header__menu-mobile-link-icon'
                                                iconSize='sm'
                                                fill='var(--color-text-primary)'
                                            />
                                        )}
                                        <div
                                            className='header__menu-mobile-link-text'
                                            onClick={e => e.preventDefault()}
                                        >
                                            <Text size='s'>
                                                {is_dark_mode ? localize('Light theme') : localize('Dark theme')}
                                            </Text>
                                            <div>
                                                <ToggleSwitch
                                                    id='dt_menu_page_theme_toggler'
                                                    handleToggle={() => toggleTheme(!is_dark_mode)}
                                                    is_enabled={is_dark_mode}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Support Section */}
                    <div className='header__menu-section'>
                        {!isBridgeAvailable && (
                            <>
                                <div className='header__menu-section-header'>
                                    <Text className='header__menu-section-title' size='xsm' weight='bold'>
                                        {localize('Support')}
                                    </Text>
                                </div>
                                <div className='menu-page__item' onClick={handleHelpCentreClick}>
                                    <MenuLink
                                        icon={<StandaloneLifeRingRegularIcon iconSize='sm' />}
                                        text={localize('Help centre')}
                                        suffix_icon={<StandaloneChevronRightRegularIcon iconSize='sm' />}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sign up — only shown to logged-out users when signup_url is configured */}
                    {!is_logged_in && !isBridgeAvailable && getSignupUrl() && (
                        <div
                            className='menu-page__item'
                            onClick={() => window.open(getSignupUrl(), '_blank', 'noopener,noreferrer')}
                        >
                            <MenuLink
                                icon={<StandaloneUserPlusRegularIcon iconSize='sm' />}
                                text={localize('Sign up')}
                                suffix_icon={<StandaloneChevronRightRegularIcon iconSize='sm' />}
                            />
                        </div>
                    )}

                    {/* Log out */}
                    {is_logged_in && !isBridgeAvailable && (
                        <div className='menu-page__item header__menu-logout' onClick={handleLogout}>
                            <MenuLink
                                icon={
                                    <StandaloneRightFromBracketRegularIcon
                                        iconSize='sm'
                                        fill='var(--color-text-danger)'
                                    />
                                }
                                text={localize('Log out')}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Language selector — slides in from the right as a full-screen drawer */}
            <div
                className={classNames('menu-page__language-drawer', {
                    'menu-page__language-drawer--open': show_language_selector,
                })}
                data-testid='dt_menu_language_drawer'
            >
                <div className='menu-page__header'>
                    <div
                        className='menu-page__header-close'
                        data-testid='dt_menu_language_close'
                        onClick={() => setShowLanguageSelector(false)}
                    >
                        <StandaloneChevronLeftRegularIcon iconSize='sm' fill='var(--color-text-primary)' />
                    </div>
                    <Text weight='bold' size='s'>
                        {localize('Language')}
                    </Text>
                </div>
                <MobileLanguageMenu toggleDrawer={() => setShowLanguageSelector(false)} />
            </div>
        </div>
    );
});

MenuPage.displayName = 'MenuPage';

export default MenuPage;
