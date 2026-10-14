import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { useMobileBridge } from '@deriv/api';
import { Button, Flyout, Text } from '@deriv/components';
import {
    LabelPairedLifeRingSmRegularIcon,
    LegacyHomeNewIcon,
    StandaloneCircleUserFillIcon,
    StandaloneCircleUserRegularIcon,
    StandaloneClockThreeFillIcon,
    StandaloneClockThreeRegularIcon,
    StandaloneFileRegularIcon,
    StandaloneGlobeFillIcon,
    StandaloneGlobeRegularIcon,
    StandaloneMoonRegularIcon,
    StandaloneSunBrightRegularIcon,
} from '@deriv/quill-icons';
// [AI]
import {
    getBrandLogo,
    getBrandLogoDark,
    getBrandName,
    getHomeUrl,
    getHelpCentreUrl,
    isFeatureEnabled,
    isEmbedded,
    routes,
    openExternalUrl,
} from '@deriv/shared';
// [/AI]
import { observer, useStore } from '@deriv/stores';
import { Localize, localize, useTranslations } from '@deriv-com/translations';

import { PositionsDrawerContent, PositionsDrawerFooter } from './PositionsDrawer';

import AccountSelector from './account-selector';
import LanguageSelector from './language-selector';

type TSidebarItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
    badge?: number;
    dataTestId?: string;
};

const Sidebar = observer(() => {
    const { ui, client, portfolio } = useStore();
    const { currentLang } = useTranslations();
    const { is_dark_mode_on, active_sidebar_flyout, setSidebarFlyout, closeSidebarFlyout } = ui;
    const { is_logged_in } = client;
    const { active_positions_count, onMount, onUnmount } = portfolio;
    const location = useLocation();
    const history = useHistory();
    const sidebar_ref = React.useRef<HTMLElement>(null);
    const { sendBridgeEvent } = useMobileBridge();

    React.useEffect(() => {
        onMount();
        return () => onUnmount();
    }, [onMount, onUnmount]);

    const isActiveRoute = (path: string) => {
        if (path === routes.index) {
            return location.pathname === routes.index;
        }
        return location.pathname.startsWith(path);
    };

    const handleThemeToggle = () => {
        ui.setDarkMode(!is_dark_mode_on);
    };

    const handleLanguageToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'language' ? null : 'language');
    };

    const handleAccountToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'account' ? null : 'account');
    };

    const handlePositionsToggle = () => {
        setSidebarFlyout(active_sidebar_flyout === 'positions' ? null : 'positions');
    };

    const handleReportsClick = () => {
        setSidebarFlyout(null);
        history.push(routes.reports);
    };

    const handleHelpCentreClick = () => {
        closeSidebarFlyout();
        window.open(getHelpCentreUrl(), '_blank', 'noopener,noreferrer');
    };

    const handleHomeClick = () => {
        closeSidebarFlyout();
        sendBridgeEvent('trading:home', () => {
            openExternalUrl(getHomeUrl());
        });
    };

    const closeFlyout = () => {
        closeSidebarFlyout();
    };

    // Main navigation items
    const isPositionsActive = active_sidebar_flyout === 'positions';
    const isReportsActive = isActiveRoute(routes.reports);

    // [VolaTrades] Inside the Manual Trader tab the sidebar keeps only open
    // positions: VolaTrades' header already has the account, balance and
    // theme, and nothing here may lead away from VolaTrades.
    const is_embedded = isEmbedded();
    const all_navigation_items: TSidebarItem[] = [
        {
            id: 'home',
            icon: <LegacyHomeNewIcon iconSize='xs' fill='var(--color-text-primary)' />,
            label: localize('Home'),
            onClick: handleHomeClick,
            isActive: false,
            dataTestId: 'dt_sidebar_home',
        },
        {
            id: 'positions',
            icon: isPositionsActive ? (
                <StandaloneClockThreeFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneClockThreeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Positions'),
            onClick: handlePositionsToggle,
            isActive: isPositionsActive,
            badge: active_positions_count,
            dataTestId: 'dt_sidebar_positions',
        },
        {
            id: 'reports',
            icon: <StandaloneFileRegularIcon fill='var(--color-text-primary)' iconSize='sm' />,
            label: localize('Reports'),
            onClick: handleReportsClick,
            isActive: isReportsActive,
            dataTestId: 'dt_sidebar_reports',
        },
    ];

    const navigationItems = is_embedded
        ? all_navigation_items.filter(item => item.id === 'positions')
        : all_navigation_items;

    // Utility items (bottom section)
    const isLanguageActive = active_sidebar_flyout === 'language';
    const isAccountActive = active_sidebar_flyout === 'account';

    const all_utility_items = [
        {
            id: 'help',
            icon: <LabelPairedLifeRingSmRegularIcon fill='var(--color-text-primary)' />,
            label: localize('Help'),
            onClick: handleHelpCentreClick,
            isActive: false,
            dataTestId: 'dt_sidebar_help',
        },
        ...(isFeatureEnabled('language_switcher')
            ? [
                  {
                      id: 'language',
                      icon: isLanguageActive ? (
                          <StandaloneGlobeFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
                      ) : (
                          <StandaloneGlobeRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
                      ),
                      label: localize('Language'),
                      onClick: handleLanguageToggle,
                      isActive: isLanguageActive,
                      dataTestId: 'dt_sidebar_language',
                  },
              ]
            : []),
        ...(isFeatureEnabled('dark_mode')
            ? [
                  {
                      id: 'theme',
                      icon: is_dark_mode_on ? (
                          <StandaloneMoonRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
                      ) : (
                          <StandaloneSunBrightRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
                      ),
                      label: localize('Theme'),
                      onClick: handleThemeToggle,
                      isActive: false,
                      dataTestId: 'dt_sidebar_theme',
                  },
              ]
            : []),
        {
            id: 'account',
            icon: isAccountActive ? (
                <StandaloneCircleUserFillIcon fill='var(--color-nav-item-active)' iconSize='sm' />
            ) : (
                <StandaloneCircleUserRegularIcon fill='var(--color-text-primary)' iconSize='sm' />
            ),
            label: localize('Account'),
            onClick: handleAccountToggle,
            isActive: isAccountActive,
            dataTestId: 'dt_sidebar_account',
        },
    ];

    const utilityItems = is_embedded ? [] : all_utility_items;

    const getFlyoutContent = () => {
        switch (active_sidebar_flyout) {
            case 'language':
                return {
                    title: <Localize i18n_default_text='Language' />,
                    content: <LanguageSelector onLanguageChange={closeFlyout} />,
                    footer: null,
                };
            case 'account':
                return {
                    title: <Localize i18n_default_text='Account' />,
                    content: <AccountSelector />,
                    footer: null,
                };
            case 'positions':
                return {
                    title: <Localize i18n_default_text='Open positions' />,
                    content: <PositionsDrawerContent />,
                    footer: <PositionsDrawerFooter />,
                };
            default:
                return null;
        }
    };

    const flyoutContent = React.useMemo(() => getFlyoutContent(), [active_sidebar_flyout, currentLang]);

    return (
        <React.Fragment>
            <aside
                ref={sidebar_ref}
                className={classNames('sidebar', {
                    sidebar__hidden: !isActiveRoute(routes.index),
                })}
                data-testid='dt_sidebar'
            >
                {/* Logo Section */}
                {!is_embedded && (
                <div className='sidebar__header'>
                    {/* [AI] */}
                    <img
                        src={`/${is_dark_mode_on ? getBrandLogoDark() : getBrandLogo()}`}
                        alt={getBrandName()}
                        width={32}
                        height={32}
                        data-testid='dt_sidebar_brand_logo'
                    />
                    {/* [/AI] */}
                </div>
                )}
                {!is_embedded && <div className='sidebar__separator' />}
                {/* Main Navigation */}
                <nav className='sidebar__nav'>
                    <div className='sidebar__nav-main'>
                        {navigationItems.map(item => {
                            const shouldShow = item.id === 'home' || is_logged_in;

                            if (!shouldShow) return null;

                            return (
                                <Button
                                    key={item.id}
                                    className={classNames('sidebar__item', {
                                        'sidebar__item--active': item.isActive,
                                    })}
                                    onClick={item.onClick}
                                    data-testid={item.dataTestId}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <Text className='sidebar__item-icon'>{item.icon}</Text>
                                    <Text className='sidebar__item-label'>{item.label}</Text>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <Text className='sidebar__item-badge'>{item.badge}</Text>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                    {/* Utility Section */}
                    <div className='sidebar__nav-utility'>
                        {!is_embedded && <div className='sidebar__separator' />}
                        {utilityItems.map(item => {
                            const shouldShow = item.id === 'account' ? is_logged_in : true;

                            if (!shouldShow) return null;

                            return (
                                <Button
                                    key={item.id}
                                    className={classNames('sidebar__item', {
                                        'sidebar__item--active': item.isActive,
                                    })}
                                    onClick={item.onClick}
                                    data-testid={item.dataTestId}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <Text className='sidebar__item-icon'>{item.icon}</Text>
                                    <Text className='sidebar__item-label'>{item.label}</Text>
                                </Button>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Single Flyout with conditional content */}
            <Flyout
                is_open={active_sidebar_flyout !== null}
                onClose={closeFlyout}
                title={flyoutContent?.title}
                footer_content={flyoutContent?.footer}
            >
                {flyoutContent?.content}
            </Flyout>
        </React.Fragment>
    );
});

export default Sidebar;
