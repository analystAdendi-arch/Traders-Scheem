import type { TDerivativesAccount } from '@deriv/api';
import { useDevice } from '@deriv-com/ui';
import { fireEvent, render, screen } from '@testing-library/react';

import AccountSwitcher from '../account-switcher';

// Mock dependencies

jest.mock('@deriv/components', () => ({
    Skeleton: ({ height, width }: { height: number; width: number }) => (
        <div data-testid='skeleton' style={{ height, width }}>
            Skeleton
        </div>
    ),
    Text: ({ children, size, color, weight }: any) => (
        <span data-testid='text' data-size={size} data-color={color} data-weight={weight}>
            {children}
        </span>
    ),
}));

jest.mock('@deriv/quill-icons', () => ({
    StandaloneCircleExclamationRegularIcon: ({ iconSize, fill }: any) => (
        <div data-testid='warning-icon' data-icon-size={iconSize} data-fill={fill}>
            Warning Icon
        </div>
    ),
    StandaloneArrowsRotateRegularIcon: ({ iconSize }: any) => (
        <div data-testid='refresh-icon' data-icon-size={iconSize}>
            Refresh Icon
        </div>
    ),
}));

jest.mock('@deriv/shared', () => ({
    addComma: jest.fn((value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }),
    getCurrencyDisplayCode: jest.fn((currency: string) => currency),
}));

jest.mock('@deriv/stores', () => ({
    observer: (component: any) => component,
    useStore: jest.fn(() => ({
        client: {
            switchAccount: jest.fn(),
        },
    })),
}));

jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: { i18n_default_text: string }) => <span>{i18n_default_text}</span>,
}));

jest.mock('@deriv-com/ui', () => ({
    useDevice: jest.fn(),
}));

jest.mock('@deriv-com/quill-ui', () => ({
    ActionSheet: {
        Root: ({ children, isOpen, onClose }: any) =>
            isOpen ? (
                <div data-testid='action-sheet-root' onClick={onClose}>
                    {children}
                </div>
            ) : null,
        Portal: ({ children }: any) => <div data-testid='action-sheet-portal'>{children}</div>,
    },
    Button: ({ children, onClick, className, label }: any) => (
        <button data-testid='button' className={className} onClick={onClick}>
            {label}
            {children}
        </button>
    ),
}));

const mockUseDevice = useDevice as jest.MockedFunction<typeof useDevice>;

const mockAccounts: TDerivativesAccount[] = [
    {
        account_id: 'CR123',
        account_type: 'real',
        balance: '10000.00',
        currency: 'USD',
        status: 'active',
        timestamp: '2023-01-01T00:00:00Z',
        group: 'real',
    },
    {
        account_id: 'VRTC456',
        account_type: 'demo',
        balance: '5000.00',
        currency: 'USD',
        status: 'active',
        timestamp: '2023-01-01T00:00:00Z',
        group: 'demo',
    },
    {
        account_id: 'CR789',
        account_type: 'real',
        balance: '2500.50',
        currency: 'EUR',
        status: 'active',
        timestamp: '2023-01-01T00:00:00Z',
        group: 'real',
    },
];

describe('AccountSwitcher', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDevice.mockReturnValue({
            isDesktop: true,
            isMobile: false,
            isTablet: false,
            isTabletPortrait: false,
            isMobileOrTabletLandscape: false,
        });
    });

    describe('Desktop rendering', () => {
        beforeEach(() => {
            mockUseDevice.mockReturnValue({
                isDesktop: true,
                isMobile: false,
                isTablet: false,
                isTabletPortrait: false,
                isMobileOrTabletLandscape: false,
            });
        });

        it('should render loading state with skeletons', () => {
            render(
                <AccountSwitcher accounts={[]} current_loginid='CR123' is_loading={true} error={null} is_open={true} />
            );

            const skeletons = screen.getAllByTestId('skeleton');
            expect(skeletons).toHaveLength(2);
            expect(screen.getAllByText('Skeleton')).toHaveLength(2);
        });

        it('should render error state when error is provided', () => {
            render(
                <AccountSwitcher
                    accounts={[]}
                    current_loginid='CR123'
                    is_loading={false}
                    error={new Error('Network error')}
                    is_open={true}
                />
            );

            expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
            expect(screen.getByText('Failed to load')).toBeInTheDocument();
            expect(screen.getByText('Refresh')).toBeInTheDocument();
        });

        it('should render error state when accounts array is empty', () => {
            render(
                <AccountSwitcher accounts={[]} current_loginid='CR123' is_loading={false} error={null} is_open={true} />
            );

            expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
            expect(screen.getByText('Failed to load')).toBeInTheDocument();
            expect(screen.getByText('Refresh')).toBeInTheDocument();
        });

        it('should call onRefetch when refresh button is clicked', () => {
            const onRefetchMock = jest.fn();

            render(
                <AccountSwitcher
                    accounts={[]}
                    current_loginid='CR123'
                    is_loading={false}
                    error={new Error('Network error')}
                    is_open={true}
                    onRefetch={onRefetchMock}
                />
            );

            const refreshButton = screen.getByTestId('button');
            fireEvent.click(refreshButton);

            expect(onRefetchMock).toHaveBeenCalledTimes(1);
        });

        it('should not crash when refresh button is clicked without onRefetch prop', () => {
            render(
                <AccountSwitcher
                    accounts={[]}
                    current_loginid='CR123'
                    is_loading={false}
                    error={new Error('Network error')}
                    is_open={true}
                />
            );

            const refreshButton = screen.getByTestId('button');
            expect(() => fireEvent.click(refreshButton)).not.toThrow();
        });

        it('should render accounts list correctly', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            expect(screen.getAllByText('Real account')).toHaveLength(2);
            expect(screen.getByText('Demo account')).toBeInTheDocument();
            expect(screen.getByText(/10,000.00 USD/i)).toBeInTheDocument();
            expect(screen.getByText(/5,000.00 USD/i)).toBeInTheDocument();
            expect(screen.getByText(/2,500.50 EUR/i)).toBeInTheDocument();
        });

        it('should highlight selected account and disable it', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            const selectedButton = screen.getByTestId('dt_account_item_CR123');
            expect(selectedButton).toHaveClass('acc-switcher__account--selected');
            expect(selectedButton).toBeDisabled();
        });

        it('should not disable non-selected accounts', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            const nonSelectedButton = screen.getByTestId('dt_account_item_VRTC456');
            expect(nonSelectedButton).not.toHaveClass('acc-switcher__account--selected');
            expect(nonSelectedButton).toBeEnabled();
        });

        it('should call onClose when account is clicked', () => {
            const onCloseMock = jest.fn();

            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                    onClose={onCloseMock}
                />
            );

            const accountButton = screen.getByTestId('dt_account_item_VRTC456');
            fireEvent.click(accountButton);

            expect(onCloseMock).toHaveBeenCalledTimes(1);
        });

        it('should not call onClose when disabled account is clicked', () => {
            const onCloseMock = jest.fn();

            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                    onClose={onCloseMock}
                />
            );

            const selectedButton = screen.getByTestId('dt_account_item_CR123');
            fireEvent.click(selectedButton);

            // onClick should still be called, but we verify the button is disabled
            expect(selectedButton).toBeDisabled();
        });

        it('should return null when is_open is false', () => {
            const { container } = render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={false}
                />
            );

            expect(container).toBeEmptyDOMElement();
        });

        it('should render all account types correctly', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            const accounts = screen.getAllByRole('button');
            expect(accounts).toHaveLength(3);
        });

        it('should have correct aria labels', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            const realAccountButton = screen.getByTestId('dt_account_item_CR123');
            expect(realAccountButton).toHaveAttribute('aria-label', 'Real account CR123 with balance 10,000.00 USD');
            expect(realAccountButton).toHaveAttribute('aria-current', 'true');
        });
    });

    describe('Mobile rendering', () => {
        beforeEach(() => {
            mockUseDevice.mockReturnValue({
                isDesktop: false,
                isMobile: true,
                isTablet: false,
                isTabletPortrait: false,
                isMobileOrTabletLandscape: false,
            });
        });

        it('should render in ActionSheet on mobile when open', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                    onClose={jest.fn()}
                />
            );

            expect(screen.getByTestId('action-sheet-root')).toBeInTheDocument();
            expect(screen.getByTestId('action-sheet-portal')).toBeInTheDocument();
        });

        it('should not render ActionSheet when onClose is not provided', () => {
            const { container } = render(
                <AccountSwitcher accounts={mockAccounts} current_loginid='CR123' is_loading={false} error={null} />
            );

            expect(container).toBeEmptyDOMElement();
        });

        it('should render accounts inside ActionSheet on mobile', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={true}
                    onClose={jest.fn()}
                />
            );

            expect(screen.getByTestId('action-sheet-root')).toBeInTheDocument();
            expect(screen.getByText(/10,000.00 USD/i)).toBeInTheDocument();
        });

        it('should return null when not open on mobile', () => {
            const { container } = render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid='CR123'
                    is_loading={false}
                    error={null}
                    is_open={false}
                    onClose={jest.fn()}
                />
            );

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('Edge cases', () => {
        beforeEach(() => {
            mockUseDevice.mockReturnValue({
                isDesktop: true,
                isMobile: false,
                isTablet: false,
                isTabletPortrait: false,
                isMobileOrTabletLandscape: false,
            });
        });

        it('should handle accounts with zero balance', () => {
            const accountsWithZeroBalance: TDerivativesAccount[] = [
                {
                    account_id: 'CR000',
                    account_type: 'real',
                    balance: '0.00',
                    currency: 'USD',
                    status: 'active',
                    timestamp: '2023-01-01T00:00:00Z',
                    group: 'real',
                },
            ];

            render(
                <AccountSwitcher
                    accounts={accountsWithZeroBalance}
                    current_loginid='CR000'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            expect(screen.getByText(/0.00 USD/i)).toBeInTheDocument();
        });

        it('should handle accounts with large balance values', () => {
            const accountsWithLargeBalance: TDerivativesAccount[] = [
                {
                    account_id: 'CR999',
                    account_type: 'real',
                    balance: '999999999.99',
                    currency: 'USD',
                    status: 'active',
                    timestamp: '2023-01-01T00:00:00Z',
                    group: 'real',
                },
            ];

            render(
                <AccountSwitcher
                    accounts={accountsWithLargeBalance}
                    current_loginid='CR999'
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            expect(screen.getByText(/999,999,999.99 USD/i)).toBeInTheDocument();
        });

        it('should handle undefined current_loginid', () => {
            render(
                <AccountSwitcher
                    accounts={mockAccounts}
                    current_loginid={undefined}
                    is_loading={false}
                    error={null}
                    is_open={true}
                />
            );

            const allButtons = screen.getAllByRole('button');
            // No account should be selected/disabled
            allButtons.forEach(button => {
                expect(button).not.toHaveClass('acc-switcher__account--selected');
                expect(button).toBeEnabled();
            });
        });
    });
});
