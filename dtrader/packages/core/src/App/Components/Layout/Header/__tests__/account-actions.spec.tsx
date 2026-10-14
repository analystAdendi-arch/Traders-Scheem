import React from 'react';

import { mockStore, StoreProvider } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccountActions } from '../account-actions';

// Mock dependencies
jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getBrandUrl: jest.fn(() => 'https://deriv.com'),
    getSignupUrl: jest.fn(() => ''),
}));

const mockUseDerivativesAccount = jest.fn(() => ({
    data: {
        data: [
            { account_id: 'CR123', account_type: 'real', balance: '10000.00', currency: 'USD' },
            { account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' },
        ],
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
}));

// Mock useMobileBridge hook
const mockSendBridgeEvent = jest.fn(async (_event, fallback) => {
    // Execute fallback to simulate browser behavior
    if (fallback) await fallback();
    return true;
});

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useDerivativesAccount: () => mockUseDerivativesAccount(),
    useMobileBridge: () => ({
        sendBridgeEvent: mockSendBridgeEvent,
        isBridgeAvailable: false,
    }),
}));

jest.mock('@deriv-com/ui', () => ({
    useDevice: jest.fn(() => ({ isDesktop: true, isMobile: false })),
}));

jest.mock('../login-button', () => ({
    LoginButton: () => <div data-testid='dt_login_button'>Login Button</div>,
}));

// Mock the dynamic import of AccountInfo
jest.mock('App/Components/Layout/Header/account-info', () => ({
    __esModule: true,
    default: () => <div data-testid='dt_account_info'>Account Info</div>,
}));

describe('AccountActions component', () => {
    const default_mock_store = {
        client: {
            currency: 'USD',
            is_logged_in: true,
            is_virtual: false,
            logout: jest.fn(),
        },
        common: {
            current_language: 'en',
        },
        ui: {
            is_switching_account: false,
            setIsSwitchingAccount: jest.fn(),
        },
    };

    const renderWithStore = (store_override = {}) => {
        const merged_store = { ...default_mock_store, ...store_override };
        // Ensure ui mock has required methods
        const store_with_ui = {
            ...merged_store,
            ui: {
                ...merged_store.ui,
                is_switching_account: false,
                setIsSwitchingAccount: jest.fn(),
            },
        };
        const mock_store_instance = mockStore(store_with_ui);
        return render(
            <StoreProvider store={mock_store_instance}>
                <AccountActions />
            </StoreProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendBridgeEvent.mockClear();
        // Reset to default mock with both account types
        mockUseDerivativesAccount.mockReturnValue({
            data: {
                data: [
                    { account_id: 'CR123', account_type: 'real', balance: '10000.00', currency: 'USD' },
                    { account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' },
                ],
            },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
        });
    });

    it('should render AccountInfo when logged in', async () => {
        renderWithStore();

        // Wait for lazy component to load
        await screen.findByTestId('dt_account_info');
        expect(screen.getByTestId('dt_account_info')).toBeInTheDocument();
    });

    it('should render deposit button when logged in (non-virtual)', async () => {
        renderWithStore();

        await screen.findByTestId('dt_account_info');
        const deposit_button = screen.getByRole('button', { name: /deposit/i });
        expect(deposit_button).toBeInTheDocument();
    });

    it('should render deposit button when logged in with both account types (virtual)', async () => {
        renderWithStore({
            client: {
                ...default_mock_store.client,
                is_virtual: true,
            },
        });

        await screen.findByTestId('dt_account_info');
        const deposit_button = screen.getByRole('button', { name: /deposit/i });
        expect(deposit_button).toBeInTheDocument();
    });

    it('should render "Try real" button for demo-only accounts', async () => {
        // Mock useDerivativesAccount to return only demo accounts
        mockUseDerivativesAccount.mockReturnValue({
            data: {
                data: [{ account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' }],
            },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
        });

        renderWithStore({
            client: {
                ...default_mock_store.client,
                is_virtual: true,
            },
        });

        await screen.findByTestId('dt_account_info');
        const try_real_button = screen.getByRole('button', { name: /try real/i });
        expect(try_real_button).toBeInTheDocument();
    });

    it('should render login button when not logged in', () => {
        renderWithStore({
            client: {
                ...default_mock_store.client,
                is_logged_in: false,
            },
        });

        expect(screen.getByTestId('dt_login_button')).toBeInTheDocument();
    });

    it('should not render account info when not logged in', () => {
        renderWithStore({
            client: {
                ...default_mock_store.client,
                is_logged_in: false,
            },
        });

        expect(screen.queryByTestId('dt_account_info')).not.toBeInTheDocument();
    });

    it('should handle deposit button click for real accounts', async () => {
        // Mock window.location.href
        delete (window as any).location;
        (window as any).location = { href: '' };

        renderWithStore();

        await screen.findByTestId('dt_account_info');
        const deposit_button = screen.getByRole('button', { name: /deposit/i });
        await userEvent.click(deposit_button);

        expect(window.location.href).toContain('deriv.com/transfer');
        expect(window.location.href).toContain('curr=USD');
    });

    it('should handle "Try real" button click for demo-only accounts and open modal', async () => {
        // Mock useDerivativesAccount to return only demo accounts
        mockUseDerivativesAccount.mockReturnValue({
            data: {
                data: [{ account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' }],
            },
            isLoading: false,
            error: null,
            refetch: jest.fn(),
        });

        const toggleTryRealModal = jest.fn();

        renderWithStore({
            client: {
                ...default_mock_store.client,
                is_virtual: true,
            },
            ui: {
                toggleTryRealModal,
            },
        });

        await screen.findByTestId('dt_account_info');
        const try_real_button = screen.getByRole('button', { name: /try real/i });
        await userEvent.click(try_real_button);

        expect(toggleTryRealModal).toHaveBeenCalledWith(true);
    });

    describe('Bridge events', () => {
        it('should call sendBridgeEvent with trading:transfer event when deposit button is clicked', async () => {
            renderWithStore();

            await screen.findByTestId('dt_account_info');
            const deposit_button = screen.getByRole('button', { name: /deposit/i });
            await userEvent.click(deposit_button);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:transfer', expect.any(Function));
        });

        it('should execute fallback (redirect) when bridge is not available', async () => {
            // Mock window.location.href
            delete (window as any).location;
            (window as any).location = { href: '' };

            renderWithStore();

            await screen.findByTestId('dt_account_info');
            const deposit_button = screen.getByRole('button', { name: /deposit/i });
            await userEvent.click(deposit_button);

            // Since mockSendBridgeEvent executes the fallback, window.location should be set
            expect(window.location.href).toContain('deriv.com/transfer');
            expect(window.location.href).toContain('curr=USD');
        });

        it('should not call sendBridgeEvent for Try real button (should open modal instead)', async () => {
            // Mock useDerivativesAccount to return only demo accounts
            mockUseDerivativesAccount.mockReturnValue({
                data: {
                    data: [{ account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' }],
                },
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            });

            const toggleTryRealModal = jest.fn();

            renderWithStore({
                client: {
                    ...default_mock_store.client,
                    is_virtual: true,
                },
                ui: {
                    toggleTryRealModal,
                },
            });

            await screen.findByTestId('dt_account_info');
            const try_real_button = screen.getByRole('button', { name: /try real/i });
            await userEvent.click(try_real_button);

            // Should open modal, not send bridge event
            expect(toggleTryRealModal).toHaveBeenCalledWith(true);
            expect(mockSendBridgeEvent).not.toHaveBeenCalled();
        });
    });

    describe('Account switching loading state', () => {
        it('should show skeleton loaders when isLoading is true', () => {
            mockUseDerivativesAccount.mockReturnValue({
                data: { data: [] },
                isLoading: true,
                error: null,
                refetch: jest.fn(),
            });

            renderWithStore();

            const skeletons = screen.getAllByTestId('dt_skeleton');
            expect(skeletons).toHaveLength(2);
        });

        it('should reset loading state when query completes', async () => {
            let currentIsLoading = true;
            const mockRefetch = jest.fn();

            mockUseDerivativesAccount.mockImplementation(() => ({
                data: {
                    data: currentIsLoading
                        ? []
                        : [
                              { account_id: 'CR123', account_type: 'real', balance: '10000.00', currency: 'USD' },
                              { account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' },
                          ],
                },
                isLoading: currentIsLoading,
                error: null,
                refetch: mockRefetch,
            }));

            const { rerender } = renderWithStore();

            expect(screen.getAllByTestId('dt_skeleton')).toHaveLength(2);

            currentIsLoading = false;
            mockUseDerivativesAccount.mockReturnValue({
                data: {
                    data: [
                        { account_id: 'CR123', account_type: 'real', balance: '10000.00', currency: 'USD' },
                        { account_id: 'VRTC456', account_type: 'demo', balance: '5000.00', currency: 'USD' },
                    ],
                },
                isLoading: false,
                error: null,
                refetch: mockRefetch,
            });

            rerender(
                <StoreProvider store={mockStore(default_mock_store)}>
                    <AccountActions />
                </StoreProvider>
            );

            await screen.findByTestId('dt_account_info');
            expect(screen.queryByTestId('dt_skeleton')).not.toBeInTheDocument();
        });

        it('should render skeleton loaders with correct inline styles', () => {
            mockUseDerivativesAccount.mockReturnValue({
                data: { data: [] },
                isLoading: true,
                error: null,
                refetch: jest.fn(),
            });

            renderWithStore();

            const skeletons = screen.getAllByTestId('dt_skeleton');
            expect(skeletons[0]).toHaveStyle({ width: '120px', height: '32px' });
            expect(skeletons[1]).toHaveStyle({ width: '80px', height: '32px' });
        });
    });
});
