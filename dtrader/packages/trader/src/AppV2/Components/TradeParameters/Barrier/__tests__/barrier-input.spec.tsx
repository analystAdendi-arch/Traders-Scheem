import { mockStore } from '@deriv/stores';
import { TCoreStores } from '@deriv/stores/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import BarrierInput from '../barrier-input';

describe('BarrierInput', () => {
    const onChange = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Reset the default trade store
        default_trade_store.modules.trade.barrier_1 = '+10';
        default_trade_store.modules.trade.validation_errors.barrier_1 = [];
    });

    const default_trade_store = {
        modules: {
            trade: {
                barrier_1: '+10',
                onChange,
                validation_errors: { barrier_1: [] },
                duration: 10,
                proposal_info: { CALL: { id: '123', message: 'test_message', has_error: true, spot: 12345 } },
                symbol: '1HZ100V', // Synthetic symbol to show barrier chips
                tick_data: { quote: 1234.56 },
                active_symbols: [
                    {
                        underlying_symbol: '1HZ100V',
                        display_name: 'Volatility 100 (1s) Index',
                        market: 'synthetic_index',
                        underlying_symbol_type: 'synthetic_index',
                        exchange_is_open: 1,
                    },
                    {
                        underlying_symbol: 'EURUSD',
                        display_name: 'EUR/USD',
                        market: 'forex',
                        underlying_symbol_type: 'forex',
                        exchange_is_open: 1,
                    },
                ],
            },
        },
    };

    const mockBarrierInput = (mocked_store: TCoreStores) => {
        render(
            <TraderProviders store={mocked_store}>
                <ModulesProvider store={mocked_store}>
                    <BarrierInput isDays={false} onClose={onClose} />
                </ModulesProvider>
            </TraderProviders>
        );
    };

    it('renders BarrierInput component correctly', () => {
        mockBarrierInput(mockStore(default_trade_store));
        expect(screen.getByText('Above spot')).toBeInTheDocument();
        expect(screen.getByText('Below spot')).toBeInTheDocument();
        expect(screen.getByText('Fixed barrier')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Distance to spot')).toBeInTheDocument();
        expect(screen.getByText('Current spot')).toBeInTheDocument();
    });

    it('closes ActionSheet on pressing Save button', async () => {
        mockBarrierInput(mockStore(default_trade_store));
        await userEvent.click(screen.getByRole('textbox'));
        await userEvent.click(screen.getByText(/Save/));
        await waitFor(() => {
            expect(onClose).toBeCalledWith(true);
        });
    });

    it('initializes with correct tab based on barrier_1 value', () => {
        mockBarrierInput(mockStore(default_trade_store));
        // Should select "Above spot" tab for "+10" barrier
        expect(screen.getAllByRole('button')[0]).toHaveAttribute('data-state', 'selected');
    });

    it('handles chip selection correctly', async () => {
        mockBarrierInput(mockStore(default_trade_store));
        const aboveSpotChip = screen.getByText('Above spot');
        const belowSpotChip = screen.getByText('Below spot');
        const fixedPriceChip = screen.getByText('Fixed barrier');

        // onChange should not be called during chip selection
        await userEvent.click(belowSpotChip);
        expect(onChange).not.toHaveBeenCalled();

        await userEvent.click(fixedPriceChip);
        expect(onChange).not.toHaveBeenCalled();

        await userEvent.click(aboveSpotChip);
        expect(onChange).not.toHaveBeenCalled();

        // onChange should only be called when Save is clicked
        await userEvent.click(screen.getByText(/Save/));
        expect(onChange).toHaveBeenCalledWith({ target: { name: 'barrier_1', value: '+10' } });
    });

    it('handles input change correctly', async () => {
        mockBarrierInput(mockStore(default_trade_store));
        const input = screen.getByPlaceholderText('Distance to spot');

        // onChange should not be called during input change
        fireEvent.change(input, { target: { value: '20' } });
        expect(onChange).not.toHaveBeenCalled();

        const belowSpotChip = screen.getByText('Below spot');
        await userEvent.click(belowSpotChip);
        fireEvent.change(input, { target: { value: '15' } });
        expect(onChange).not.toHaveBeenCalled();

        // onChange should only be called when Save is clicked
        await userEvent.click(screen.getByText(/Save/));
        expect(onChange).toHaveBeenCalledWith({ target: { name: 'barrier_1', value: '-15' } });
    });

    it('sets initial barrier value and option correctly for a positive barrier', () => {
        mockBarrierInput(mockStore(default_trade_store));
        expect(screen.getAllByRole('button')[0]).toHaveAttribute('data-state', 'selected');
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('sets initial barrier value and option correctly for a negative barrier', () => {
        default_trade_store.modules.trade.barrier_1 = '-10';
        mockBarrierInput(mockStore(default_trade_store));
        expect(screen.getAllByRole('button')[1]).toHaveAttribute('data-state', 'selected');
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('sets initial barrier value and option correctly for a fixed price barrier', () => {
        default_trade_store.modules.trade.barrier_1 = '30';
        mockBarrierInput(mockStore(default_trade_store));
        expect(screen.getAllByRole('button')[2]).toHaveAttribute('data-state', 'selected');
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    it('shows error when a validation error comes', async () => {
        default_trade_store.modules.trade.validation_errors.barrier_1 = ['Something went wrong'] as never;
        mockBarrierInput(mockStore(default_trade_store));

        // Clear the input to trigger validation error
        const input = screen.getByPlaceholderText('Distance to spot');
        await userEvent.clear(input);

        // Wait for debounced validation to trigger
        await waitFor(() => {
            expect(screen.getByText('Barrier is a required field.')).toBeInTheDocument();
        });
    });

    it('shows error when a validation error comes for fixed price as well', async () => {
        default_trade_store.modules.trade.validation_errors.barrier_1 = ['Something went wrong'] as never;
        default_trade_store.modules.trade.barrier_1 = '10';
        mockBarrierInput(mockStore(default_trade_store));

        // Clear the input to trigger validation error
        const input = screen.getByPlaceholderText('Price');
        await userEvent.clear(input);

        // Wait for debounced validation to trigger
        await waitFor(() => {
            expect(screen.getByText('Barrier is a required field.')).toBeInTheDocument();
        });
    });

    it('handles chip selection correctly for Above spot when initial barrier is negative', async () => {
        default_trade_store.modules.trade.barrier_1 = '-10';
        mockBarrierInput(mockStore(default_trade_store));

        const aboveSpotChip = screen.getByText('Above spot');
        await userEvent.click(aboveSpotChip);

        // onChange should not be called during chip selection
        expect(onChange).not.toHaveBeenCalled();

        // onChange should only be called when Save is clicked
        await userEvent.click(screen.getByText(/Save/));
        expect(onChange).toHaveBeenCalledWith({ target: { name: 'barrier_1', value: '+10' } });
    });

    it('handles chip selection correctly for Below spot when initial barrier is positive', async () => {
        default_trade_store.modules.trade.barrier_1 = '+0.6';
        mockBarrierInput(mockStore(default_trade_store));

        const belowSpotChip = screen.getByText('Below spot');
        await userEvent.click(belowSpotChip);

        // onChange should not be called during chip selection
        expect(onChange).not.toHaveBeenCalled();

        // onChange should only be called when Save is clicked
        await userEvent.click(screen.getByText(/Save/));
        expect(onChange).toHaveBeenCalledWith({ target: { name: 'barrier_1', value: '-0.6' } });
    });

    it('handles chip selection correctly for Fixed barrier', async () => {
        default_trade_store.modules.trade.barrier_1 = '+0.6';
        mockBarrierInput(mockStore(default_trade_store));

        const fixedPriceChip = screen.getByText('Fixed barrier');
        await userEvent.click(fixedPriceChip);

        // onChange should not be called during chip selection
        expect(onChange).not.toHaveBeenCalled();

        // onChange should only be called when Save is clicked
        await userEvent.click(screen.getByText(/Save/));
        expect(onChange).toHaveBeenCalledWith({ target: { name: 'barrier_1', value: '0.6' } });
    });

    it('handles chip selection correctly for Above spot when initial barrier is fixed price', async () => {
        default_trade_store.modules.trade.barrier_1 = '0.6';
        mockBarrierInput(mockStore(default_trade_store));

        const aboveSpotChip = screen.getByText('Above spot');
        await userEvent.click(aboveSpotChip);

        // onChange should not be called during chip selection
        expect(onChange).not.toHaveBeenCalled();

        // onChange should only be called when Save is clicked
        await userEvent.click(screen.getByText(/Save/));
        expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'barrier_1', value: '+0.6' } });
    });

    it('does not show chips for forex symbols (absolute barrier support)', () => {
        default_trade_store.modules.trade.symbol = 'EURUSD';
        default_trade_store.modules.trade.barrier_1 = '1.0000'; // Set a valid forex barrier
        mockBarrierInput(mockStore(default_trade_store));

        // Chips should not be visible for forex symbols
        expect(screen.queryByText('Above spot')).not.toBeInTheDocument();
        expect(screen.queryByText('Below spot')).not.toBeInTheDocument();
        expect(screen.queryByText('Fixed barrier')).not.toBeInTheDocument();

        // Should show price input directly
        expect(screen.getByPlaceholderText('Price')).toBeInTheDocument();
    });

    it('shows current spot price', () => {
        mockBarrierInput(mockStore(default_trade_store));
        expect(screen.getByText('1234.56')).toBeInTheDocument();
    });

    // Tests for new API validation features
    describe('API Validation Features', () => {
        it('renders correctly when is_open prop is passed', () => {
            mockBarrierInput(mockStore(default_trade_store));
            // Component should render without errors
            expect(screen.getByText('Current spot')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Distance to spot')).toBeInTheDocument();
        });

        it('disables Save button when there is a client-side validation error', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Enter invalid value (zero)
            await userEvent.clear(input);
            await userEvent.type(input, '0');

            // Wait for debounced validation
            await waitFor(() => {
                expect(screen.getByText('Barrier cannot be zero.')).toBeInTheDocument();
            });

            // Save button should be disabled
            const saveButton = screen.getByRole('button', { name: /Save/i });
            expect(saveButton).toBeDisabled();
        });

        it('shows validation error for incomplete decimal values', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Enter incomplete decimal
            await userEvent.clear(input);
            await userEvent.type(input, '1.');

            // Wait for debounced validation
            await screen.findByText('Please enter a complete number.');
        });

        it('shows validation error for invalid number', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Enter invalid characters (should be filtered by regex, but test validation)
            await userEvent.clear(input);

            // Wait for debounced validation
            await waitFor(() => {
                expect(screen.getByText('Barrier is a required field.')).toBeInTheDocument();
            });
        });

        it('does not call onChange during typing, only on Save', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Type a new value
            await userEvent.clear(input);
            await userEvent.type(input, '25');

            // onChange should NOT be called during typing
            expect(onChange).not.toHaveBeenCalled();

            // Click Save
            await userEvent.click(screen.getByText(/Save/));

            // onChange should be called only once on Save
            await waitFor(() => {
                expect(onChange).toHaveBeenCalledTimes(1);
                expect(onChange).toHaveBeenCalledWith({ target: { name: 'barrier_1', value: '+25' } });
            });
        });

        it('updates proposalRequestValues without updating store', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Type a new value
            await userEvent.clear(input);
            await userEvent.type(input, '15');

            // Wait for debounce
            await waitFor(
                () => {
                    // onChange should NOT be called (store not updated)
                    expect(onChange).not.toHaveBeenCalled();
                },
                { timeout: 500 }
            );

            // Value should be in local state but not in store
            expect(input).toHaveValue('15');
        });

        it('validates zero values correctly', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Enter zero
            await userEvent.clear(input);
            await userEvent.type(input, '0');

            // Wait for debounced validation
            await waitFor(() => {
                expect(screen.getByText('Barrier cannot be zero.')).toBeInTheDocument();
            });

            // Save button should be disabled
            const saveButton = screen.getByRole('button', { name: /Save/i });
            expect(saveButton).toBeDisabled();
        });

        it('does not call onChange during input changes', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Type a new value
            await userEvent.clear(input);
            await userEvent.type(input, '15');

            // onChange should NOT be called during typing
            expect(onChange).not.toHaveBeenCalled();

            // Value should be updated in local state
            expect(input).toHaveValue('15');
        });

        it('renders correctly with different barrier values', () => {
            // Test with negative barrier
            default_trade_store.modules.trade.barrier_1 = '-5';
            mockBarrierInput(mockStore(default_trade_store));

            // Component should render without errors
            expect(screen.getByText('Current spot')).toBeInTheDocument();
            const input = screen.getByPlaceholderText('Distance to spot');
            expect(input).toHaveValue('5');
        });

        it('validates input changes with debounce', async () => {
            mockBarrierInput(mockStore(default_trade_store));
            const input = screen.getByPlaceholderText('Distance to spot');

            // Type a valid value
            await userEvent.clear(input);
            await userEvent.type(input, '25');

            // Wait for debounced validation
            await waitFor(
                () => {
                    expect(input).toHaveValue('25');
                },
                { timeout: 500 }
            );

            // onChange should NOT be called (only on Save)
            expect(onChange).not.toHaveBeenCalled();

            // Save button should be enabled for valid input
            const saveButton = screen.getByRole('button', { name: /Save/i });
            expect(saveButton).toBeEnabled();
        });
    });
});
