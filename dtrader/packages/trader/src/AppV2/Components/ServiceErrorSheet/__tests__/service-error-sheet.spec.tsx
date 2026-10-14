import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import * as fileUtils from '@deriv/shared';
import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TraderProviders from '../../../../trader-providers';
import ServiceErrorSheet from '../service-error-sheet';

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
        push: jest.fn(),
    }),
}));
jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    redirectToLogin: jest.fn(),
    redirectToSignUp: jest.fn(),
    getBrandUrl: jest.fn(() => 'https://home.deriv.com/dashboard'),
}));

// Mock useMobileBridge hook
const mockSendBridgeEvent = jest.fn(async (_event, dataOrFallback, fallback) => {
    // Handle overloaded signature - detect if second param is function or data
    const actualFallback = typeof dataOrFallback === 'function' ? dataOrFallback : fallback;
    // Execute fallback to simulate browser behavior
    if (actualFallback) await actualFallback();
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

describe('ServiceErrorSheet', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    const history = createMemoryHistory();
    beforeEach(() => {
        jest.clearAllMocks();
        mockSendBridgeEvent.mockClear();
        default_mock_store = mockStore({
            client: { is_logged_in: true, is_virtual: false, currency: 'USD' },
            common: {
                services_error: {
                    code: 'InsufficientBalance',
                    message: 'Your account balance (0.00 USD) is insufficient to buy this contract (10.00 USD).',
                    type: 'buy',
                },
                resetServicesError: jest.fn(),
            },
        });
        // Reset window.location.href before each test
        window.location.href = '';
    });

    const mockTrade = () => {
        return (
            <Router history={history}>
                <TraderProviders store={default_mock_store}>
                    <ServiceErrorSheet />
                </TraderProviders>
            </Router>
        );
    };

    it('renders the modal with appropriate message and action for InsufficientBalance error', async () => {
        render(mockTrade());

        expect(screen.getByText('Insufficient balance')).toBeInTheDocument();

        await userEvent.click(screen.getByText(/deposit now/i));
        expect(default_mock_store.common.resetServicesError).toBeCalled();
    });

    it('renders the Action Sheet with appropriate message and actions for AuthorizationRequired error', async () => {
        const spyRedirectToLogin = jest.spyOn(fileUtils, 'redirectToLogin');
        default_mock_store.common.services_error.code = 'AuthorizationRequired';
        render(mockTrade());

        expect(screen.getByText('Start trading with us')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Create free account'));
        expect(default_mock_store.common.resetServicesError).toBeCalled();

        await userEvent.click(screen.getByText('Login'));
        expect(spyRedirectToLogin).toBeCalled();
    });

    it('does not render the Action Sheet if there is no services_error', () => {
        default_mock_store.common.services_error = {};
        const { container } = render(mockTrade());

        expect(container).toBeEmptyDOMElement();
    });

    it('should redirect to brand deposit page when "Deposit now" is clicked for real accounts', async () => {
        render(mockTrade());

        expect(screen.getByText('Insufficient balance')).toBeInTheDocument();

        const depositButton = screen.getByText(/Deposit now/i);
        await userEvent.click(depositButton);

        expect(fileUtils.getBrandUrl).toHaveBeenCalled();
        expect(window.location.href).toBe(
            'https://home.deriv.com/dashboard/transfer?from=dtrader&source=options&acc=options&curr=USD&lang=EN'
        );
        expect(default_mock_store.common.resetServicesError).toHaveBeenCalled();
    });

    it('should show "OK" button for virtual accounts instead of "Deposit now"', async () => {
        default_mock_store.client.is_virtual = true;
        render(mockTrade());

        expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
        expect(screen.queryByText(/Deposit now/i)).not.toBeInTheDocument();

        const okButton = screen.getByText(/ok/i);
        expect(okButton).toBeInTheDocument();

        await userEvent.click(okButton);
        expect(default_mock_store.common.resetServicesError).toHaveBeenCalled();
    });

    describe('Bridge events', () => {
        it('should call sendBridgeEvent with trading:transfer when "Deposit now" is clicked', async () => {
            render(mockTrade());

            const depositButton = screen.getByText(/Deposit now/i);
            await userEvent.click(depositButton);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:transfer', expect.any(Function));
        });

        it('should not call sendBridgeEvent when "OK" button is clicked for virtual accounts', async () => {
            default_mock_store.client.is_virtual = true;
            render(mockTrade());

            const okButton = screen.getByText(/ok/i);
            await userEvent.click(okButton);

            expect(mockSendBridgeEvent).not.toHaveBeenCalled();
        });

        it('should execute fallback (redirect) when bridge is not available', async () => {
            window.location.href = '';
            render(mockTrade());

            const depositButton = screen.getByText(/Deposit now/i);
            await userEvent.click(depositButton);

            // Since mockSendBridgeEvent executes the fallback, window.location should be set
            expect(window.location.href).toContain('home.deriv.com/dashboard/transfer');
            expect(window.location.href).toContain('curr=USD');
        });
    });
});
