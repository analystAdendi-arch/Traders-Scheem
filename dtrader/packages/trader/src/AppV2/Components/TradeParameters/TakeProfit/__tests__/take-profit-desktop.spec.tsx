import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import TakeProfitDesktop from '../take-profit-desktop';

jest.mock('AppV2/Hooks/useTradeError', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        is_error_matching_field: false,
    })),
}));

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

describe('TakeProfitDesktop', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    currency: 'USD',
                    has_open_accu_contract: false,
                    has_take_profit: true,
                    is_market_closed: false,
                    take_profit: '100',
                    onChange: jest.fn(),
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
                    validation_errors: {},
                },
            },
        });
    });

    const MockedTakeProfitDesktop = ({ store = default_mock_store }: { store?: ReturnType<typeof mockStore> }) => (
        <TraderProviders store={store}>
            <ModulesProvider store={store}>
                <TakeProfitDesktop is_minimized={false} />
            </ModulesProvider>
        </TraderProviders>
    );

    it('renders with Take profit label and value', () => {
        render(<MockedTakeProfitDesktop />);

        expect(screen.getByText('Take profit')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('100 USD');
    });

    it('displays dash when take_profit is not set', () => {
        default_mock_store.modules.trade.has_take_profit = false;
        default_mock_store.modules.trade.take_profit = '';
        render(<MockedTakeProfitDesktop />);

        expect(screen.getByRole('textbox')).toHaveValue('-');
    });

    it('opens popover when clicked', async () => {
        render(<MockedTakeProfitDesktop />);

        await userEvent.click(screen.getByText('Take profit'));

        expect(screen.getByLabelText('Amount (USD)')).toBeInTheDocument();
    });

    it('disables input when has_open_accu_contract is true', () => {
        default_mock_store.modules.trade.has_open_accu_contract = true;
        render(<MockedTakeProfitDesktop />);

        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables input when market is closed', () => {
        default_mock_store.modules.trade.is_market_closed = true;
        render(<MockedTakeProfitDesktop />);

        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('renders correctly when minimized', () => {
        render(
            <TraderProviders store={default_mock_store}>
                <ModulesProvider store={default_mock_store}>
                    <TakeProfitDesktop is_minimized={true} />
                </ModulesProvider>
            </TraderProviders>
        );

        const textField = screen.getByRole('textbox');
        expect(textField).toBeInTheDocument();
        expect(textField).toHaveValue('100 USD');
    });

    it('displays currency code correctly', () => {
        default_mock_store.modules.trade.currency = 'EUR';
        render(<MockedTakeProfitDesktop />);

        expect(screen.getByRole('textbox')).toHaveValue('100 EUR');
    });

    it('closes popover when Save is clicked', async () => {
        render(<MockedTakeProfitDesktop />);

        await userEvent.click(screen.getByText('Take profit'));
        expect(screen.getByLabelText('Amount (USD)')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Save'));

        expect(default_mock_store.modules.trade.onChangeMultiple).toHaveBeenCalled();
    });
});
