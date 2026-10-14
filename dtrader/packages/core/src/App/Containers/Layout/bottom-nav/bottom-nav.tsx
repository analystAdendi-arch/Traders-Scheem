import React from 'react';
import { matchPath, useHistory, useLocation } from 'react-router';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useMobileBridge } from '@deriv/api';
import {
    StandaloneBarsRegularIcon,
    StandaloneChartAreaFillIcon,
    StandaloneChartAreaRegularIcon,
    StandaloneClockThreeFillIcon,
    StandaloneClockThreeRegularIcon,
    StandaloneHouseBlankFillIcon,
    StandaloneHouseBlankRegularIcon,
} from '@deriv/quill-icons';
import { getBrandUrl, isEmbedded, routes, openExternalUrl } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Badge, Navigation } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

type BottomNavProps = {
    className?: string;
};

const BottomNav = observer(({ className }: BottomNavProps) => {
    const history = useHistory();
    const location = useLocation();
    const { client, portfolio, common } = useStore();
    const { active_positions_count } = portfolio;
    const { currency, is_logged_in } = client;
    const { current_language } = common;
    const { sendBridgeEvent } = useMobileBridge();

    const all_items = React.useMemo(
        () => [
            {
                icon: <StandaloneHouseBlankRegularIcon iconSize='sm' fill='var(--color-text-primary)' />,
                activeIcon: <StandaloneHouseBlankFillIcon iconSize='sm' />,
                label: <Localize i18n_default_text='Home' />,
                path: null,
                action: 'home' as const,
            },
            {
                icon: <StandaloneChartAreaRegularIcon iconSize='sm' fill='var(--color-text-primary)' />,
                activeIcon: <StandaloneChartAreaFillIcon iconSize='sm' />,
                label: <Localize i18n_default_text='Trade' />,
                path: routes.index,
            },
            ...(is_logged_in
                ? [
                      {
                          icon:
                              active_positions_count > 0 ? (
                                  <Badge
                                      variant='notification'
                                      position='top-right'
                                      label={active_positions_count.toString()}
                                      color='danger'
                                      size='sm'
                                      contentSize='sm'
                                      className='bottom-nav-item__position-badge'
                                  >
                                      <StandaloneClockThreeRegularIcon iconSize='sm' fill='var(--color-text-primary)' />
                                  </Badge>
                              ) : (
                                  <StandaloneClockThreeRegularIcon iconSize='sm' fill='var(--color-text-primary)' />
                              ),
                          activeIcon:
                              active_positions_count > 0 ? (
                                  <Badge
                                      variant='notification'
                                      position='top-right'
                                      label={active_positions_count.toString()}
                                      color='danger'
                                      size='sm'
                                      contentSize='sm'
                                      className='bottom-nav-item__position-badge'
                                  >
                                      <StandaloneClockThreeFillIcon iconSize='sm' fill='var(--color-text-primary)' />
                                  </Badge>
                              ) : (
                                  <StandaloneClockThreeFillIcon iconSize='sm' />
                              ),
                          label: (
                              <React.Fragment>
                                  <span className='user-guide__anchor' />
                                  <Localize i18n_default_text='Positions' />
                              </React.Fragment>
                          ),
                          path: routes.trader_positions,
                      },
                  ]
                : []),
            {
                icon: <StandaloneBarsRegularIcon iconSize='sm' fill='var(--color-text-primary)' />,
                activeIcon: <StandaloneBarsRegularIcon iconSize='sm' />,
                label: <Localize i18n_default_text='Menu' />,
                path: routes.menu,
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [active_positions_count, is_logged_in]
    );

    // [VolaTrades] Inside the Manual Trader tab: Trade and Positions only.
    // Home and Menu led to Deriv's hub, settings and reports - away from the
    // trading VolaTrades embeds this for.
    const bottomNavItems = React.useMemo(
        () => (isEmbedded() ? all_items.filter(item => item.path === routes.index || item.path === routes.trader_positions) : all_items),
        [all_items]
    );

    const selectedIndex = React.useMemo(() => {
        if (
            location.pathname === routes.positions ||
            location.pathname === routes.profit ||
            location.pathname === routes.statement
        ) {
            return -1; // No icon highlighted for report sub-routes
        }
        if (matchPath(location.pathname, { path: routes.contract, exact: true })) {
            return -1; // No icon highlighted for contract details page
        }
        const idx = bottomNavItems.findIndex(item => item.path === location.pathname);
        if (idx > -1) return idx;
        return Math.max(0, bottomNavItems.findIndex(item => item.path === routes.index)); // Default to Trade
    }, [bottomNavItems, location.pathname]);

    const handleSelect = (index: number) => {
        const item = bottomNavItems[index];

        if (item.action === 'home') {
            sendBridgeEvent('trading:home', () => {
                const brandUrl = getBrandUrl();
                const lang_param = current_language ? `&lang=${encodeURIComponent(current_language)}` : '';
                const curr = encodeURIComponent(currency || '');
                openExternalUrl(`${brandUrl}/home?source=options&acc=options&curr=${curr}${lang_param}`);
            });
            return;
        }

        if (item.path) {
            history.push(item.path);
        }
    };

    return (
        <Navigation.Bottom
            className={classNames('bottom-nav-container', className)}
            onChange={(_, index) => handleSelect(index)}
        >
            {bottomNavItems.map((item, index) => (
                <Navigation.BottomAction
                    key={index}
                    index={index}
                    activeIcon={<></>}
                    icon={index === selectedIndex ? item.activeIcon : item.icon}
                    label={item.label}
                    selected={index === selectedIndex}
                    showLabel
                    className={classNames(
                        'bottom-nav-item',
                        index === selectedIndex && 'bottom-nav-item--active',
                        item.path === routes.trader_positions && 'bottom-nav-item--positions'
                    )}
                />
            ))}
        </Navigation.Bottom>
    );
});

export default BottomNav;
