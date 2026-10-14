import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import TakeProfitInputDesktop from '../take-profit-input-desktop';

jest.mock('AppV2/Hooks/useIsVirtualKeyboardOpen', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        is_key_board_visible: false,
    })),
}));

const mockProposalData = {
    proposal: {},
};

jest.mock('AppV2/Hooks/useProposal', () => ({
    useProposal: jest.fn(() => ({
        data: mockProposalData,
        error: null,
        isFetching: false,
    })),
}));

describe('TakeProfitInputDesktop', () => {
    let default_mock_store: ReturnType<typeof mockStore>;
    const mockOnClose = jest.fn();

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    currency: 'USD',
                    has_take_profit: true,
                    take_profit: '100',
                    onChangeMultiple: jest.fn(),
                    validation_params: {
                        CALL: {
                            take_profit: {
                                min: '0.01',
                                max: '5000.00',
                            },
                        },
                    },
                    trade_types: {
                        CALL: 'Higher',
                    },
                },
            },
        });
        jest.clearAllMocks();
    });

    const MockedTakeProfitInputDesktop = ({
        store = default_mock_store,
        is_open = true,
    }: {
        store?: ReturnType<typeof mockStore>;
        is_open?: boolean;
    }) => (
        <TraderProviders store={store}>
            <ModulesProvider store={store}>
                <TakeProfitInputDesktop onClose={mockOnClose} is_open={is_open} />
            </ModulesProvider>
        </TraderProviders>
    );

    it('renders with Take profit header and toggle switch', () => {
        render(<MockedTakeProfitInputDesktop />);

        expect(screen.getByText('Take profit')).toBeInTheDocument();
        expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
    });

    it('renders input field with correct label', () => {
        render(<MockedTakeProfitInputDesktop />);

        expect(screen.getByLabelText('Amount (USD)')).toBeInTheDocument();
    });

    it('initializes with take_profit value from store', () => {
        render(<MockedTakeProfitInputDesktop />);

        const input = screen.getByTestId('dt_take_profit_input');
        expect(input).toHaveValue('100');
    });

    it('toggle switch is checked when has_take_profit is true', () => {
        render(<MockedTakeProfitInputDesktop />);

        const toggle = screen.getByRole('button', { pressed: true });
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggle switch is unchecked when has_take_profit is false', () => {
        default_mock_store.modules.trade.has_take_profit = false;
        render(<MockedTakeProfitInputDesktop />);

        const toggle = screen.getByRole('button', { pressed: false });
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('disables input when toggle is off', () => {
        default_mock_store.modules.trade.has_take_profit = false;
        render(<MockedTakeProfitInputDesktop />);

        const input = screen.getByTestId('dt_take_profit_input');
        expect(input).toBeDisabled();
    });

    it('enables input when toggle is on', async () => {
        default_mock_store.modules.trade.has_take_profit = false;
        render(<MockedTakeProfitInputDesktop />);

        const toggle = screen.getByRole('button', { pressed: false });
        await userEvent.click(toggle);

        const input = screen.getByTestId('dt_take_profit_input');
        expect(input).toBeEnabled();
    });

    it('updates input value when user types', async () => {
        render(<MockedTakeProfitInputDesktop />);

        const input = screen.getByTestId('dt_take_profit_input');
        await userEvent.clear(input);
        await userEvent.type(input, '150');

        expect(input).toHaveValue('150');
    });

    it('displays range message when validation params are available', () => {
        render(<MockedTakeProfitInputDesktop />);

        expect(screen.getByText(/Range:/)).toBeInTheDocument();
        expect(screen.getByText(/0.01 to 5,000.00 USD/)).toBeInTheDocument();
    });

    it('calls onChangeMultiple and onClose when Save is clicked', async () => {
        render(<MockedTakeProfitInputDesktop />);

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChangeMultiple).toHaveBeenCalledWith({
            has_take_profit: true,
            take_profit: '100',
        });
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows overlay when toggle is off', () => {
        default_mock_store.modules.trade.has_take_profit = false;
        render(<MockedTakeProfitInputDesktop />);

        expect(screen.getByTestId('dt_take_profit_overlay')).toBeInTheDocument();
    });

    it('enables toggle when overlay is clicked', async () => {
        default_mock_store.modules.trade.has_take_profit = false;
        render(<MockedTakeProfitInputDesktop />);

        const overlay = screen.getByTestId('dt_take_profit_overlay');
        await userEvent.click(overlay);

        const toggle = screen.getByRole('button', { pressed: true });
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows error when input ends with decimal point', async () => {
        render(<MockedTakeProfitInputDesktop />);

        const input = screen.getByTestId('dt_take_profit_input');
        await userEvent.clear(input);
        await userEvent.type(input, '100.');

        expect(screen.getByText('Should be a valid number.')).toBeInTheDocument();
    });

    it('shows error when trying to save with empty input and toggle enabled', async () => {
        default_mock_store.modules.trade.take_profit = '';
        render(<MockedTakeProfitInputDesktop />);

        const input = screen.getByTestId('dt_take_profit_input');
        await userEvent.clear(input);

        await userEvent.click(screen.getByText('Save'));

        expect(screen.getByText('Please enter a take profit amount.')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('disables Save button when there is an error', async () => {
        render(<MockedTakeProfitInputDesktop />);

        const input = screen.getByTestId('dt_take_profit_input');
        await userEvent.clear(input);
        await userEvent.type(input, '100.');

        const saveButton = screen.getByText('Save');
        expect(saveButton).toBeDisabled();
    });

    it('saves with has_take_profit false and take_profit from store when toggle is off', async () => {
        default_mock_store.modules.trade.has_take_profit = false;
        default_mock_store.modules.trade.take_profit = '100';
        render(<MockedTakeProfitInputDesktop />);

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChangeMultiple).toHaveBeenCalledWith({
            has_take_profit: false,
            take_profit: '100',
        });
    });
});
