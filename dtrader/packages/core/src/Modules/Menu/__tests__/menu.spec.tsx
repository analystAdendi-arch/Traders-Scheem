import React, { act } from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { useMobileBridge } from '@deriv/api';
import { mockStore, StoreProvider } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MenuPage from '../menu';

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(() => ({ isMobile: true, isDesktop: false })),
}));

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: jest.fn(() => ({
        sendBridgeEvent: jest.fn((_event: string, callback: () => void) => callback && callback()),
        isBridgeAvailable: false,
    })),
}));

jest.mock('@deriv-com/translations', () => ({
    useTranslations: jest.fn(() => ({
        localize: (str: string) => str,
    })),
}));

jest.mock('App/Components/Layout/Header/Components/ToggleMenu', () => ({
    MobileLanguageMenu: jest.fn(() => <div data-testid='dt_mobile_language_menu' />),
}));

jest.mock('App/Components/Layout/Header/menu-link', () => jest.fn(({ text }: { text: string }) => <div>{text}</div>));

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getHelpCentreUrl: jest.fn(() => 'https://help.deriv.com'),
    getSignupUrl: jest.fn(() => ''),
    isFeatureEnabled: jest.fn(() => true),
}));

describe('MenuPage', () => {
    let history: ReturnType<typeof createMemoryHistory>, default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        history = createMemoryHistory();
        (useDevice as jest.Mock).mockReturnValue({ isMobile: true, isDesktop: false });
        (useMobileBridge as jest.Mock).mockReturnValue({
            sendBridgeEvent: jest.fn((_event: string, callback: () => void) => callback && callback()),
            isBridgeAvailable: false,
        });
        default_mock_store = mockStore({
            client: {
                is_logged_in: true,
                logout: jest.fn(),
            },
            ui: {
                is_dark_mode_on: false,
                setDarkMode: jest.fn(),
            },
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderMenuPage = (store = default_mock_store) =>
        render(
            <StoreProvider store={store}>
                <Router history={history}>
                    <MenuPage />
                </Router>
            </StoreProvider>
        );

    describe('Non-mobile redirect', () => {
        it('should not render menu content on desktop', () => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: false, isDesktop: true });
            renderMenuPage();

            expect(screen.queryByText('Reports')).not.toBeInTheDocument();
            expect(screen.queryByText('Settings')).not.toBeInTheDocument();
        });
    });

    describe('Rendering', () => {
        it('should render the Reports section with all items', () => {
            renderMenuPage();

            expect(screen.getByText('Reports')).toBeInTheDocument();
            expect(screen.getByText('Open positions')).toBeInTheDocument();
            expect(screen.getByText('Trade table')).toBeInTheDocument();
            expect(screen.getByText('Statement')).toBeInTheDocument();
        });

        it('should render the Settings section', () => {
            renderMenuPage();

            expect(screen.getByText('Settings')).toBeInTheDocument();
            // 'Language' appears in the Settings item and the drawer header
            expect(screen.getAllByText('Language').length).toBeGreaterThan(0);
        });

        it('should render the Support section when bridge is not available', () => {
            renderMenuPage();

            expect(screen.getByText('Support')).toBeInTheDocument();
            expect(screen.getByText('Help centre')).toBeInTheDocument();
        });

        it('should not render the Support section when bridge is available', () => {
            (useMobileBridge as jest.Mock).mockReturnValue({
                sendBridgeEvent: jest.fn(),
                isBridgeAvailable: true,
            });
            renderMenuPage();

            expect(screen.queryByText('Support')).not.toBeInTheDocument();
            expect(screen.queryByText('Help centre')).not.toBeInTheDocument();
        });

        it('should render Log out when user is logged in and bridge is not available', () => {
            renderMenuPage();

            expect(screen.getByText('Log out')).toBeInTheDocument();
        });

        it('should not render Log out when user is not logged in', () => {
            const store = mockStore({
                ...default_mock_store,
                client: { is_logged_in: false, logout: jest.fn() },
            });
            renderMenuPage(store);

            expect(screen.queryByText('Log out')).not.toBeInTheDocument();
        });

        it('should not render Log out when bridge is available', () => {
            (useMobileBridge as jest.Mock).mockReturnValue({
                sendBridgeEvent: jest.fn(),
                isBridgeAvailable: true,
            });
            renderMenuPage();

            expect(screen.queryByText('Log out')).not.toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate to open positions when clicked', async () => {
            const user = userEvent.setup();
            renderMenuPage();

            await act(async () => {
                await user.click(screen.getByText('Open positions'));
            });

            expect(history.location.pathname).toBe('/reports/positions');
        });

        it('should navigate to trade table when clicked', async () => {
            const user = userEvent.setup();
            renderMenuPage();

            await act(async () => {
                await user.click(screen.getByText('Trade table'));
            });

            expect(history.location.pathname).toBe('/reports/profit');
        });

        it('should navigate to statement when clicked', async () => {
            const user = userEvent.setup();
            renderMenuPage();

            await act(async () => {
                await user.click(screen.getByText('Statement'));
            });

            expect(history.location.pathname).toBe('/reports/statement');
        });
    });

    describe('Language selector', () => {
        it('should open language drawer when Language is clicked', async () => {
            const user = userEvent.setup();
            renderMenuPage();
            const drawer = screen.getByTestId('dt_menu_language_drawer');

            expect(drawer).not.toHaveClass('menu-page__language-drawer--open');

            // 'Language' appears in both the Settings item and the drawer header;
            // click the first occurrence (the Settings section item)
            await act(async () => {
                await user.click(screen.getAllByText('Language')[0]);
            });

            expect(drawer).toHaveClass('menu-page__language-drawer--open');
        });

        it('should close language drawer when back button is clicked', async () => {
            const user = userEvent.setup();
            renderMenuPage();

            await act(async () => {
                await user.click(screen.getAllByText('Language')[0]);
            });

            const drawer = screen.getByTestId('dt_menu_language_drawer');
            expect(drawer).toHaveClass('menu-page__language-drawer--open');

            await act(async () => {
                await user.click(screen.getByTestId('dt_menu_language_close'));
            });

            expect(drawer).not.toHaveClass('menu-page__language-drawer--open');
        });
    });

    describe('Theme toggle', () => {
        it('should show Dark theme label when light mode is active', () => {
            renderMenuPage();

            expect(screen.getByText('Dark theme')).toBeInTheDocument();
        });

        it('should show Light theme label when dark mode is active', () => {
            const store = mockStore({
                ...default_mock_store,
                ui: { is_dark_mode_on: true, setDarkMode: jest.fn() },
            });
            renderMenuPage(store);

            expect(screen.getByText('Light theme')).toBeInTheDocument();
        });

        it('should call setDarkMode when the theme row is clicked', async () => {
            const setDarkMode = jest.fn();
            const store = mockStore({
                ...default_mock_store,
                ui: { is_dark_mode_on: false, setDarkMode },
            });
            const user = userEvent.setup();
            renderMenuPage(store);

            await act(async () => {
                await user.click(screen.getByText('Dark theme'));
            });

            expect(setDarkMode).toHaveBeenCalledWith(true);
        });
    });

    describe('Help centre', () => {
        it('should open help centre URL in a new tab when clicked', async () => {
            const window_open = jest.spyOn(window, 'open').mockImplementation(() => null);
            const user = userEvent.setup();
            renderMenuPage();

            await act(async () => {
                await user.click(screen.getByText('Help centre'));
            });

            expect(window_open).toHaveBeenCalledWith('https://help.deriv.com', '_blank', 'noopener,noreferrer');
            window_open.mockRestore();
        });
    });

    describe('Logout', () => {
        it('should call sendBridgeEvent and navigate to / on logout', async () => {
            const sendBridgeEvent = jest.fn((_event: string, callback: () => void) => callback && callback());
            const logout = jest.fn();
            (useMobileBridge as jest.Mock).mockReturnValue({ sendBridgeEvent, isBridgeAvailable: false });
            const store = mockStore({
                client: { is_logged_in: true, logout },
                ui: { is_dark_mode_on: false, setDarkMode: jest.fn() },
            });
            const user = userEvent.setup();
            renderMenuPage(store);

            await act(async () => {
                await user.click(screen.getByText('Log out'));
            });

            expect(sendBridgeEvent).toHaveBeenCalledWith('trading:back', expect.any(Function));
            expect(logout).toHaveBeenCalled();
            expect(history.location.pathname).toBe('/');
        });
    });
});
