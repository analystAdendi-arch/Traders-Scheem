import { mockStore, StoreProvider } from '@deriv/stores';
import { fireEvent, render, screen } from '@testing-library/react';

import AccountSelector from '../account-selector';

jest.mock('@deriv-com/translations', () => ({
    localize: (key: string) => key,
}));

// Mock useMobileBridge hook
const mockSendBridgeEvent = jest.fn(async (_event, dataOrFallback, fallback) => {
    // Handle overloaded signature - detect if second param is function or data
    const actualFallback = typeof dataOrFallback === 'function' ? dataOrFallback : fallback;
    // Execute fallback to simulate browser behavior
    if (actualFallback) await actualFallback();
    return true;
});

let mockIsBridgeAvailable = false;

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: () => ({
        sendBridgeEvent: mockSendBridgeEvent,
        get isBridgeAvailable() {
            return mockIsBridgeAvailable;
        },
    }),
}));

describe('AccountSelector', () => {
    const defaultStoreConfig = {
        client: {
            logout: jest.fn(),
            is_logged_in: true,
        },
        ui: {
            closeSidebarFlyout: jest.fn(),
        },
    };

    const renderComponent = (storeConfig = defaultStoreConfig) => {
        const store = mockStore(storeConfig);
        return render(
            <StoreProvider store={store}>
                <AccountSelector />
            </StoreProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendBridgeEvent.mockClear();
        mockIsBridgeAvailable = false;
    });

    it('should render Log out button when user is logged in', () => {
        renderComponent();
        expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('should render "Back to app" button when bridge is available', () => {
        mockIsBridgeAvailable = true;

        renderComponent();
        expect(screen.getByText('Back to app')).toBeInTheDocument();
        expect(screen.queryByText('Log out')).not.toBeInTheDocument();
    });

    it('should not render Log out button when user is not logged in', () => {
        const loggedOutStore = {
            ...defaultStoreConfig,
            client: {
                ...defaultStoreConfig.client,
                is_logged_in: false,
            },
        };
        renderComponent(loggedOutStore);
        expect(screen.queryByText('Log out')).not.toBeInTheDocument();
    });

    it('should call logout and close flyout when Log out button is clicked', () => {
        const store = mockStore(defaultStoreConfig);
        render(
            <StoreProvider store={store}>
                <AccountSelector />
            </StoreProvider>
        );

        const logoutButton = screen.getByText('Log out');
        fireEvent.click(logoutButton);

        expect(store.client.logout).toHaveBeenCalled();
        expect(store.ui.closeSidebarFlyout).toHaveBeenCalled();
    });
});
