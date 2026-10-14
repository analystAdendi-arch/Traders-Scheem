import { mockStore } from '@deriv/stores';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useProposal } from 'AppV2/Hooks/useProposal';
import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import BarrierContentDesktop from '../barrier-content-desktop';

jest.mock('@deriv/api-v2', () => ({
    useDebounce: jest.fn((value: unknown) => value),
}));

jest.mock('AppV2/Hooks/useProposal', () => ({
    useProposal: jest.fn(() => ({
        data: { proposal: {} },
        error: null,
        isFetching: false,
    })),
}));

jest.mock('AppV2/Utils/trade-types-utils', () => ({
    getDisplayedContractTypes: jest.fn(() => ['CALL']),
}));

describe('BarrierContentDesktop', () => {
    let default_mock_store: ReturnType<typeof mockStore>;
    const mockOnClose = jest.fn();

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    barrier_1: '+0.5',
                    tick_data: {
                        quote: 1234.56,
                        pip_size: 2,
                    },
                    onChange: jest.fn(),
                    contract_type: 'CALL',
                    trade_type_tab: '',
                    trade_types: { CALL: 'Higher' },
                },
            },
        });
        jest.clearAllMocks();
        (useProposal as jest.Mock).mockReturnValue({
            data: { proposal: {} },
            error: null,
            isFetching: false,
        });
    });

    const MockedBarrierContentDesktop = ({
        store = default_mock_store,
        barrierType = 'above_spot',
    }: {
        store?: ReturnType<typeof mockStore>;
        barrierType?: string;
    }) => (
        <TraderProviders store={store}>
            <ModulesProvider store={store}>
                <BarrierContentDesktop barrierType={barrierType} onClose={mockOnClose} />
            </ModulesProvider>
        </TraderProviders>
    );

    it('renders current spot value', () => {
        render(<MockedBarrierContentDesktop />);

        expect(screen.getByText('Current spot')).toBeInTheDocument();
        expect(screen.getByText('1234.56')).toBeInTheDocument();
    });

    it('renders with above_spot barrier type', () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        expect(screen.getByText('+')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Distance to spot')).toBeInTheDocument();
    });

    it('renders with below_spot barrier type', () => {
        default_mock_store.modules.trade.barrier_1 = '-0.5';
        render(<MockedBarrierContentDesktop barrierType='below_spot' />);

        expect(screen.getByText('-')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Distance to spot')).toBeInTheDocument();
    });

    it('renders with fixed_barrier type', () => {
        default_mock_store.modules.trade.barrier_1 = '1234.00';
        render(<MockedBarrierContentDesktop barrierType='fixed_barrier' />);

        const input = screen.getByPlaceholderText('1234.56');
        expect(input).toBeInTheDocument();
    });

    it('initializes input value correctly for above_spot', () => {
        default_mock_store.modules.trade.barrier_1 = '+0.5';
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        expect(input).toHaveValue('0.5');
    });

    it('initializes input value correctly for below_spot', () => {
        default_mock_store.modules.trade.barrier_1 = '-0.5';
        render(<MockedBarrierContentDesktop barrierType='below_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        expect(input).toHaveValue('0.5');
    });

    it('initializes input value correctly for fixed_barrier', () => {
        default_mock_store.modules.trade.barrier_1 = '1234.00';
        render(<MockedBarrierContentDesktop barrierType='fixed_barrier' />);

        const input = screen.getByPlaceholderText('1234.56');
        expect(input).toHaveValue('1234.00');
    });

    it('updates input value when user types', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);
        await userEvent.type(input, '1.5');

        expect(input).toHaveValue('1.5');
    });

    it('calls onChange with correct value when Save is clicked for above_spot', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);
        await userEvent.type(input, '1.5');

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChange).toHaveBeenCalledWith({
            target: { name: 'barrier_1', value: '+1.5' },
        });
    });

    it('calls onChange with correct value when Save is clicked for below_spot', async () => {
        render(<MockedBarrierContentDesktop barrierType='below_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);
        await userEvent.type(input, '1.5');

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChange).toHaveBeenCalledWith({
            target: { name: 'barrier_1', value: '-1.5' },
        });
    });

    it('calls onChange with correct value when Save is clicked for fixed_barrier', async () => {
        default_mock_store.modules.trade.barrier_1 = '1234.00';
        render(<MockedBarrierContentDesktop barrierType='fixed_barrier' />);

        const input = screen.getByPlaceholderText('1234.56');
        await userEvent.clear(input);
        await userEvent.type(input, '1235.00');

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChange).toHaveBeenCalledWith({
            target: { name: 'barrier_1', value: '1235.00' },
        });
    });

    it('calls onClose when Save is clicked with valid value', async () => {
        render(<MockedBarrierContentDesktop />);

        await userEvent.click(screen.getByText('Save'));

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('displays 0.0000 when quote is null', () => {
        default_mock_store.modules.trade.tick_data = { quote: null, pip_size: 2 };
        render(<MockedBarrierContentDesktop />);

        expect(screen.getByText('0.0000')).toBeInTheDocument();
    });

    it('displays 0.0000 when quote is undefined', () => {
        default_mock_store.modules.trade.tick_data = { quote: undefined, pip_size: 2 };
        render(<MockedBarrierContentDesktop />);

        expect(screen.getByText('0.0000')).toBeInTheDocument();
    });

    it('handles zero quote value correctly', () => {
        default_mock_store.modules.trade.tick_data = { quote: 0, pip_size: 2 };
        render(<MockedBarrierContentDesktop />);

        expect(screen.getByText('0')).toBeInTheDocument();
    });

    // Validation tests
    it('shows required field error when input is cleared', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);

        await waitFor(() => {
            expect(screen.getByText('Barrier is a required field.')).toBeInTheDocument();
        });
    });

    it('shows error for zero value', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);
        await userEvent.type(input, '0');

        await waitFor(() => {
            expect(screen.getByText('Barrier cannot be zero.')).toBeInTheDocument();
        });
    });

    it('shows error for incomplete decimal', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);
        await userEvent.type(input, '1.');

        await waitFor(() => {
            expect(screen.getByText('Please enter a complete number.')).toBeInTheDocument();
        });
    });

    it('disables Save button when validation error exists', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
        });
    });

    it('does not call onChange when Save is clicked with validation error', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);
        await userEvent.type(input, '0');

        await waitFor(() => {
            expect(screen.getByText('Barrier cannot be zero.')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChange).not.toHaveBeenCalled();
    });

    it('does not call onClose when Save is clicked with validation error', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);

        await waitFor(() => {
            expect(screen.getByText('Barrier is a required field.')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByText('Save'));

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('shows API error when proposal returns barrier error', async () => {
        (useProposal as jest.Mock).mockReturnValue({
            data: null,
            error: {
                message: 'Barrier is not valid',
                details: { field: 'barrier' },
            },
            isFetching: false,
        });

        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        await waitFor(() => {
            expect(screen.getByText('Barrier is not valid')).toBeInTheDocument();
        });
    });

    it('disables Save button when proposal is loading', () => {
        (useProposal as jest.Mock).mockReturnValue({
            data: null,
            error: null,
            isFetching: true,
        });

        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('clears validation error when valid value is entered after error', async () => {
        render(<MockedBarrierContentDesktop barrierType='above_spot' />);

        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);

        await waitFor(() => {
            expect(screen.getByText('Barrier is a required field.')).toBeInTheDocument();
        });

        await userEvent.type(input, '1.5');

        await waitFor(() => {
            expect(screen.queryByText('Barrier is a required field.')).not.toBeInTheDocument();
        });
    });
});
