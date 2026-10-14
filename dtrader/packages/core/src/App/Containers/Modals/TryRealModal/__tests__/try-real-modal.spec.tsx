import React from 'react';

import { mockStore, StoreProvider } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TryRealModal from '../try-real-modal';

// Mock getBrandUrl function
jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getBrandUrl: jest.fn(() => 'https://home.deriv.com/dashboard'),
}));

// Mock useMobileBridge hook
const mockSendBridgeEvent = jest.fn(async (_event, fallback) => {
    // Execute fallback to simulate browser behavior
    if (fallback) await fallback();
    return true;
});

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: () => ({
        sendBridgeEvent: mockSendBridgeEvent,
        isBridgeAvailable: false,
    }),
}));

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

// Mock Quill UI components
jest.mock('@deriv-com/quill-ui', () => ({
    ActionSheet: {
        Root: ({ children, isOpen }: any) => (isOpen ? <div data-testid='action-sheet'>{children}</div> : null),
        Portal: ({ children }: any) => <div data-testid='action-sheet-portal'>{children}</div>,
        Content: ({ children }: any) => <div data-testid='action-sheet-content'>{children}</div>,
        Footer: ({ primaryAction }: any) => (
            <div data-testid='action-sheet-footer'>
                <button onClick={primaryAction.onAction} data-testid='primary-action-button'>
                    {primaryAction.content}
                </button>
            </div>
        ),
    },
    Modal: ({ children, isOpened, primaryButtonCallback, primaryButtonLabel }: any) => {
        if (!isOpened) return null;
        return (
            <div data-testid='modal'>
                {children}
                <button onClick={primaryButtonCallback} data-testid='primary-button'>
                    {primaryButtonLabel}
                </button>
            </div>
        );
    },
    Text: ({ children }: any) => <span>{children}</span>,
}));

// Mock Modal subcomponents
const MockModalHeader = ({ title }: any) => <div data-testid='modal-header'>{title}</div>;
const MockModalBody = ({ children }: any) => <div data-testid='modal-body'>{children}</div>;

// Add subcomponents to Modal mock
const { Modal } = jest.requireMock('@deriv-com/quill-ui');
Modal.Header = MockModalHeader;
Modal.Body = MockModalBody;

jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: any) => <span>{i18n_default_text}</span>,
}));

describe('TryRealModal', () => {
    const default_mock_store = {
        ui: {
            is_try_real_modal_visible: true,
            toggleTryRealModal: jest.fn(),
            is_mobile: false,
        },
        common: {
            current_language: 'EN',
        },
    };

    const renderComponent = (store_override = {}) => {
        const mock_store_instance = mockStore({ ...default_mock_store, ...store_override });
        return render(
            <StoreProvider store={mock_store_instance}>
                <TryRealModal />
            </StoreProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendBridgeEvent.mockClear();
        window.location.href = '';
    });

    describe('Desktop Modal', () => {
        it('should render modal when visible', () => {
            renderComponent();

            expect(screen.getByTestId('modal')).toBeInTheDocument();
            expect(screen.getByText('Complete your profile setup')).toBeInTheDocument();
            expect(screen.getByText('Finish setting up your profile to continue.')).toBeInTheDocument();
        });

        it('should not render modal when not visible', () => {
            renderComponent({
                ui: {
                    ...default_mock_store.ui,
                    is_try_real_modal_visible: false,
                },
            });

            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });

        it('should redirect to onboarding page when "Complete setup" is clicked', async () => {
            renderComponent();

            const completeSetupButton = screen.getByTestId('primary-button');
            await userEvent.click(completeSetupButton);

            expect(window.location.href).toBe(
                'https://home.deriv.com/dashboard/onboarding/personal-details?source=options&lang=EN'
            );
        });

        it('should call sendBridgeEvent with trading:account_creation when "Complete setup" is clicked', async () => {
            renderComponent();

            const completeSetupButton = screen.getByTestId('primary-button');
            await userEvent.click(completeSetupButton);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:account_creation', expect.any(Function));
        });

        it('should execute fallback (redirect) when bridge is not available', async () => {
            window.location.href = '';
            renderComponent();

            const completeSetupButton = screen.getByTestId('primary-button');
            await userEvent.click(completeSetupButton);

            // Since mockSendBridgeEvent executes the fallback, window.location should be set
            expect(window.location.href).toContain('home.deriv.com/dashboard/onboarding/personal-details');
            expect(window.location.href).toContain('source=options');
            expect(window.location.href).toContain('lang=EN');
        });

        it('should include language parameter in URL when language is set', async () => {
            renderComponent({
                common: {
                    current_language: 'ES',
                },
            });

            const completeSetupButton = screen.getByTestId('primary-button');
            await userEvent.click(completeSetupButton);

            expect(window.location.href).toContain('lang=ES');
        });

        it('should not include language parameter when language is not set', async () => {
            renderComponent({
                common: {
                    current_language: '',
                },
            });

            const completeSetupButton = screen.getByTestId('primary-button');
            await userEvent.click(completeSetupButton);

            expect(window.location.href).not.toContain('lang=');
        });
    });

    describe('Mobile Action Sheet', () => {
        it('should render action sheet when mobile and visible', () => {
            renderComponent({
                ui: {
                    ...default_mock_store.ui,
                    is_mobile: true,
                },
            });

            expect(screen.getByTestId('action-sheet')).toBeInTheDocument();
            expect(screen.getByText('Complete your profile setup')).toBeInTheDocument();
            expect(screen.getByText('Finish setting up your profile to continue.')).toBeInTheDocument();
        });

        it('should not render action sheet when mobile but not visible', () => {
            renderComponent({
                ui: {
                    ...default_mock_store.ui,
                    is_mobile: true,
                    is_try_real_modal_visible: false,
                },
            });

            expect(screen.queryByTestId('action-sheet')).not.toBeInTheDocument();
        });

        it('should redirect to onboarding page when mobile button is clicked', async () => {
            renderComponent({
                ui: {
                    ...default_mock_store.ui,
                    is_mobile: true,
                },
            });

            const completeSetupButton = screen.getByTestId('primary-action-button');
            await userEvent.click(completeSetupButton);

            expect(window.location.href).toBe(
                'https://home.deriv.com/dashboard/onboarding/personal-details?source=options&lang=EN'
            );
        });

        it('should call sendBridgeEvent when mobile button is clicked', async () => {
            renderComponent({
                ui: {
                    ...default_mock_store.ui,
                    is_mobile: true,
                },
            });

            const completeSetupButton = screen.getByTestId('primary-action-button');
            await userEvent.click(completeSetupButton);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:account_creation', expect.any(Function));
        });
    });
});
