import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { mockStore, StoreProvider } from '@deriv/stores';
import { fireEvent, render, screen } from '@testing-library/react';

import Sidebar from '../sidebar';

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    useWS: () => ({
        send: jest.fn(),
    }),
    getHomeUrl: jest.fn(() => 'https://home.deriv.com/dashboard'),
    getHelpCentreUrl: jest.fn(() => 'https://trade.deriv.com/help-centre'),
    isFeatureEnabled: jest.fn(() => true),
}));

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: jest.fn(() => ({
        sendBridgeEvent: jest.fn((_event, dataOrFallback, callback) => {
            // Handle overloaded signature - detect if second param is function or data
            const actualFallback = typeof dataOrFallback === 'function' ? dataOrFallback : callback;
            return actualFallback && actualFallback();
        }),
    })),
}));

jest.mock('@deriv-com/translations', () => ({
    localize: (key: string) => key,
    Localize: jest.fn(({ i18n_default_text }) => <>{i18n_default_text}</>),
    useTranslations: jest.fn(() => ({
        currentLang: 'EN',
        switchLanguage: jest.fn(),
    })),
}));

jest.mock('@deriv/quill-icons', () => ({
    ...jest.requireActual('@deriv/quill-icons'),
    LabelPairedLifeRingSmRegularIcon: () => 'LabelPairedLifeRingSmRegularIcon',
    LegacyHomeNewIcon: () => 'LegacyHomeNewIcon',
    LegacyMinimize2pxIcon: () => 'LegacyMinimize2pxIcon',
    StandaloneCircleUserRegularIcon: () => 'StandaloneCircleUserRegularIcon',
    StandaloneCircleUserFillIcon: () => 'StandaloneCircleUserFillIcon',
    StandaloneClockThreeRegularIcon: () => 'StandaloneClockThreeRegularIcon',
    StandaloneClockThreeFillIcon: () => 'StandaloneClockThreeFillIcon',
    StandaloneFileRegularIcon: () => 'StandaloneFileRegularIcon',
    StandaloneGlobeRegularIcon: () => 'StandaloneGlobeRegularIcon',
    StandaloneGlobeFillIcon: () => 'StandaloneGlobeFillIcon',
    StandaloneMoonRegularIcon: () => 'StandaloneMoonRegularIcon',
    StandaloneSunBrightRegularIcon: () => 'StandaloneSunBrightRegularIcon',
}));

jest.mock('../language-selector', () => jest.fn(() => <div>LanguageSelector</div>));
jest.mock('../account-selector', () => jest.fn(() => <div>AccountSelector</div>));
jest.mock('../PositionsDrawer', () => ({
    PositionsDrawerContent: jest.fn(() => <div>PositionsDrawerContent</div>),
    PositionsDrawerFooter: jest.fn(() => <div>PositionsDrawerFooter</div>),
}));

describe('<Sidebar />', () => {
    const history = createMemoryHistory();
    const defaultStoreConfig = {
        ui: {
            is_dark_mode_on: false,
            active_sidebar_flyout: null,
            setSidebarFlyout: jest.fn(),
            closeSidebarFlyout: jest.fn(),
        },
        client: {
            is_logged_in: true,
        },
        portfolio: {
            active_positions_count: 0,
            onMount: jest.fn(),
            onUnmount: jest.fn(),
        },
        common: {
            current_language: 'en',
        },
    };
    const defaultStore = mockStore(defaultStoreConfig);

    const renderSidebar = (store = defaultStore, route = '/') => {
        history.push(route);
        return render(
            <Router history={history}>
                <StoreProvider store={store}>
                    <Sidebar />
                </StoreProvider>
            </Router>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    it('should render the sidebar with logo', () => {
        renderSidebar();
        expect(screen.getByTestId('dt_sidebar_brand_logo')).toBeInTheDocument();
    });

    it('should render Home button for all users', () => {
        renderSidebar();
        expect(screen.getByTestId('dt_sidebar_home')).toBeInTheDocument();
    });

    it('should render Home button even when user is not logged in', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            client: {
                is_logged_in: false,
            },
        });
        renderSidebar(store);
        expect(screen.getByTestId('dt_sidebar_home')).toBeInTheDocument();
    });

    it('should navigate to home when Home button is clicked', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            client: {
                ...defaultStoreConfig.client,
                currency: 'USD',
            },
        });
        renderSidebar(store);
        const homeButton = screen.getByTestId('dt_sidebar_home');
        fireEvent.click(homeButton);
        expect(window.location.href).toBe('https://home.deriv.com/dashboard');
        expect(store.ui.closeSidebarFlyout).toHaveBeenCalled();
    });

    it('should render navigation items when user is logged in', () => {
        renderSidebar();
        expect(screen.getByTestId('dt_sidebar_home')).toBeInTheDocument();
        expect(screen.getByTestId('dt_sidebar_positions')).toBeInTheDocument();
        expect(screen.getByTestId('dt_sidebar_reports')).toBeInTheDocument();
        expect(screen.getByTestId('dt_sidebar_help')).toBeInTheDocument();
    });

    it('should not render Positions and Reports when user is not logged in', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            client: {
                is_logged_in: false,
            },
        });
        renderSidebar(store);
        expect(screen.queryByTestId('dt_sidebar_positions')).not.toBeInTheDocument();
        expect(screen.queryByTestId('dt_sidebar_reports')).not.toBeInTheDocument();
    });

    it('should render Help button for all users', () => {
        renderSidebar();
        expect(screen.getByTestId('dt_sidebar_help')).toBeInTheDocument();
    });

    it('should render Help button even when user is not logged in', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            client: {
                is_logged_in: false,
            },
        });
        renderSidebar(store);
        expect(screen.getByTestId('dt_sidebar_help')).toBeInTheDocument();
    });

    it('should open help centre in new tab when Help button is clicked', () => {
        const mockWindowOpen = jest.fn();
        window.open = mockWindowOpen;

        const store = mockStore(defaultStoreConfig);
        renderSidebar(store);
        const helpButton = screen.getByTestId('dt_sidebar_help');
        fireEvent.click(helpButton);

        expect(mockWindowOpen).toHaveBeenCalledWith(
            'https://trade.deriv.com/help-centre',
            '_blank',
            'noopener,noreferrer'
        );
        expect(store.ui.closeSidebarFlyout).toHaveBeenCalled();
    });

    it('should render utility items (language, theme, and account) when logged in', () => {
        renderSidebar();
        expect(screen.getByTestId('dt_sidebar_language')).toBeInTheDocument();
        expect(screen.getByTestId('dt_sidebar_theme')).toBeInTheDocument();
        expect(screen.getByTestId('dt_sidebar_account')).toBeInTheDocument();
    });

    it('should not render Account button when user is not logged in', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            client: {
                is_logged_in: false,
            },
        });
        renderSidebar(store);
        expect(screen.getByTestId('dt_sidebar_language')).toBeInTheDocument();
        expect(screen.getByTestId('dt_sidebar_theme')).toBeInTheDocument();
        expect(screen.queryByTestId('dt_sidebar_account')).not.toBeInTheDocument();
    });

    it('should display badge count when there are active positions', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            portfolio: {
                active_positions_count: 5,
            },
        });
        renderSidebar(store);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not display badge when active positions count is 0', () => {
        renderSidebar();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should call setSidebarFlyout when positions button is clicked', () => {
        const store = mockStore(defaultStoreConfig);
        renderSidebar(store);
        const positionsButton = screen.getByTestId('dt_sidebar_positions');
        fireEvent.click(positionsButton);
        expect(store.ui.setSidebarFlyout).toHaveBeenCalledWith('positions');
    });

    it('should toggle positions flyout when clicking positions button twice', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'positions',
            },
        });
        renderSidebar(store);
        const positionsButton = screen.getByTestId('dt_sidebar_positions');
        fireEvent.click(positionsButton);
        expect(store.ui.setSidebarFlyout).toHaveBeenCalledWith(null);
    });

    it('should call setDarkMode when theme button is clicked', () => {
        const store = mockStore(defaultStoreConfig);
        renderSidebar(store);
        const themeButton = screen.getByTestId('dt_sidebar_theme');
        fireEvent.click(themeButton);
        expect(store.ui.setDarkMode).toHaveBeenCalledWith(true);
    });

    it('should toggle dark mode when clicking theme button twice', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                is_dark_mode_on: true,
                setDarkMode: jest.fn(),
            },
        });
        renderSidebar(store);
        const themeButton = screen.getByTestId('dt_sidebar_theme');
        fireEvent.click(themeButton);
        expect(store.ui.setDarkMode).toHaveBeenCalledWith(false);
    });

    it('should call setSidebarFlyout when language button is clicked', () => {
        const store = mockStore(defaultStoreConfig);
        renderSidebar(store);
        const languageButton = screen.getByTestId('dt_sidebar_language');
        fireEvent.click(languageButton);
        expect(store.ui.setSidebarFlyout).toHaveBeenCalledWith('language');
    });

    it('should toggle language flyout when clicking language button twice', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'language',
            },
        });
        renderSidebar(store);
        const languageButton = screen.getByTestId('dt_sidebar_language');
        fireEvent.click(languageButton);
        expect(store.ui.setSidebarFlyout).toHaveBeenCalledWith(null);
    });

    it('should render language selector in flyout when language is active', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'language',
            },
        });
        renderSidebar(store);
        expect(screen.getByText('LanguageSelector')).toBeInTheDocument();
    });

    it('should call setSidebarFlyout when account button is clicked', () => {
        const store = mockStore(defaultStoreConfig);
        renderSidebar(store);
        const accountButton = screen.getByTestId('dt_sidebar_account');
        fireEvent.click(accountButton);
        expect(store.ui.setSidebarFlyout).toHaveBeenCalledWith('account');
    });

    it('should toggle account flyout when clicking account button twice', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'account',
            },
        });
        renderSidebar(store);
        const accountButton = screen.getByTestId('dt_sidebar_account');
        fireEvent.click(accountButton);
        expect(store.ui.setSidebarFlyout).toHaveBeenCalledWith(null);
    });

    it('should render account selector in flyout when account is active', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'account',
            },
        });
        renderSidebar(store);
        expect(screen.getByText('AccountSelector')).toBeInTheDocument();
    });

    it('should mark account button as active when account flyout is open', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'account',
            },
        });
        renderSidebar(store);
        const accountButton = screen.getByTestId('dt_sidebar_account');
        expect(accountButton).toHaveClass('sidebar__item--active');
    });

    it('should render positions drawer in flyout when positions is active', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'positions',
            },
        });
        renderSidebar(store);
        expect(screen.getByText('PositionsDrawerContent')).toBeInTheDocument();
        expect(screen.getByText('PositionsDrawerFooter')).toBeInTheDocument();
    });

    it('should display sun icon when dark mode is off', () => {
        renderSidebar();
        expect(screen.getByText('StandaloneSunBrightRegularIcon')).toBeInTheDocument();
    });

    it('should display moon icon when dark mode is on', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                is_dark_mode_on: true,
            },
        });
        renderSidebar(store);
        expect(screen.getByText('StandaloneMoonRegularIcon')).toBeInTheDocument();
    });

    it('should mark positions button as active when positions flyout is open', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'positions',
            },
        });
        renderSidebar(store);
        const positionsButton = screen.getByTestId('dt_sidebar_positions');
        expect(positionsButton).toHaveClass('sidebar__item--active');
    });

    it('should mark reports button as active when on reports route', () => {
        renderSidebar(defaultStore, '/reports');
        const reportsButton = screen.getByTestId('dt_sidebar_reports');
        expect(reportsButton).toHaveClass('sidebar__item--active');
    });

    it('should hide sidebar when not on index route', () => {
        renderSidebar(defaultStore, '/contract/123');
        const sidebar = screen.getByTestId('dt_sidebar');
        expect(sidebar).toHaveClass('sidebar__hidden');
    });

    it('should show sidebar when on index route', () => {
        renderSidebar(defaultStore, '/');
        const sidebar = screen.getByTestId('dt_sidebar');
        expect(sidebar).not.toHaveClass('sidebar__hidden');
    });

    it('should call closeSidebarFlyout when flyout close button is clicked', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'theme',
            },
        });
        renderSidebar(store);
        const closeButton = screen.getByRole('button', { name: /close flyout/i });
        fireEvent.click(closeButton);
        expect(store.ui.closeSidebarFlyout).toHaveBeenCalled();
    });

    it('should render fill icon for positions when positions flyout is active', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'positions',
            },
        });
        renderSidebar(store);
        expect(screen.getByText('StandaloneClockThreeFillIcon')).toBeInTheDocument();
    });

    it('should render regular icon for positions when positions flyout is not active', () => {
        renderSidebar();
        expect(screen.getByText('StandaloneClockThreeRegularIcon')).toBeInTheDocument();
    });

    it('should render fill icon for language when language flyout is active', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'language',
            },
        });
        renderSidebar(store);
        expect(screen.getByText('StandaloneGlobeFillIcon')).toBeInTheDocument();
    });

    it('should render regular icon for language when language flyout is not active', () => {
        renderSidebar();
        expect(screen.getByText('StandaloneGlobeRegularIcon')).toBeInTheDocument();
    });

    it('should render fill icon for account when account flyout is active', () => {
        const store = mockStore({
            ...defaultStoreConfig,
            ui: {
                ...defaultStoreConfig.ui,
                active_sidebar_flyout: 'account',
            },
        });
        renderSidebar(store);
        expect(screen.getByText('StandaloneCircleUserFillIcon')).toBeInTheDocument();
    });

    it('should render regular icon for account when account flyout is not active', () => {
        renderSidebar();
        expect(screen.getByText('StandaloneCircleUserRegularIcon')).toBeInTheDocument();
    });
});
