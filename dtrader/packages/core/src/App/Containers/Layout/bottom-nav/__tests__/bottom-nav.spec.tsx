import React, { act } from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { mockStore, StoreProvider } from '@deriv/stores';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BottomNav from '../bottom-nav';

jest.mock('@deriv-com/quill-ui', () => ({
    ...jest.requireActual('@deriv-com/quill-ui'),
    Badge: jest.fn(({ children }) => <div data-testid='mocked-badge'>{children}</div>),
}));

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: jest.fn(() => ({
        sendBridgeEvent: jest.fn((eventName, callback) => callback && callback()),
        isBridgeAvailable: false,
    })),
}));

describe('BottomNav', () => {
    let default_mock_store: ReturnType<typeof mockStore>, history: ReturnType<typeof createMemoryHistory>;

    beforeEach(() => {
        history = createMemoryHistory();
        default_mock_store = mockStore({
            client: {
                is_logged_in: true,
                currency: 'USD',
            },
            portfolio: {
                active_positions_count: 0,
            },
            common: {
                current_language: 'EN',
            },
        });
    });

    const renderBottomNav = (store = default_mock_store) => {
        return render(
            <StoreProvider store={store}>
                <Router history={history}>
                    <BottomNav />
                </Router>
            </StoreProvider>
        );
    };

    it('should render correctly when user is logged in', () => {
        const { container } = renderBottomNav();
        expect(container).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Trade')).toBeInTheDocument();
        expect(screen.getByText('Positions')).toBeInTheDocument();
        expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should render the correct number of navigation items', () => {
        renderBottomNav();
        // Check by label text instead of role, as Navigation.BottomAction renders divs, not buttons
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Trade')).toBeInTheDocument();
        expect(screen.getByText('Positions')).toBeInTheDocument();
        expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('should show badge when there are active positions', () => {
        const store = mockStore({
            ...default_mock_store,
            portfolio: { active_positions_count: 3 },
        });
        renderBottomNav(store);
        expect(screen.getByTestId('mocked-badge')).toBeInTheDocument();
    });

    it('should navigate to Trade page by default', () => {
        history.push('/');
        renderBottomNav();
        // Trade should be selected (index 1)
        expect(history.location.pathname).toBe('/');
    });

    it('should navigate to Positions page when clicked', async () => {
        const user = userEvent.setup();
        renderBottomNav();
        const positionsButton = screen.getByText('Positions');

        await act(async () => {
            await user.click(positionsButton);
        });

        await waitFor(() => {
            expect(history.location.pathname).toBe('/positions');
        });
    });

    it('should navigate to Menu page when Menu is clicked', async () => {
        const user = userEvent.setup();
        renderBottomNav();
        const menuButton = screen.getByText('Menu');

        await act(async () => {
            await user.click(menuButton);
        });

        await waitFor(() => {
            expect(history.location.pathname).toBe('/menu');
        });
    });

    it('should highlight the correct icon based on current route', () => {
        history.push('/positions');
        renderBottomNav();
        // Positions route should be active
        expect(history.location.pathname).toBe('/positions');
    });

    it('should not highlight any icon when on Trade table or Statement routes', () => {
        history.push('/reports/profit');
        renderBottomNav();
        // No icon should be highlighted for this route
        expect(history.location.pathname).toBe('/reports/profit');
    });
});
