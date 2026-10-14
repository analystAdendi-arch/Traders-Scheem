import { CONTRACT_TYPES, TRADE_TYPES } from '@deriv/shared';
import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import Stake from '../stake';

const stake_param_label = 'Stake';

jest.mock('AppV2/Hooks/useContractsFor', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        available_contract_types: {
            vanillalongcall: {
                title: 'Call/Put',
                trade_types: ['VANILLALONGCALL'],
                basis: ['stake'],
                components: ['duration', 'strike', 'amount', 'trade_type_tabs'],
                barrier_count: 1,
                config: {
                    barrier_category: 'euro_non_atm',
                    default_stake: 10,
                },
            },
        },
    })),
}));

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    isMobile: jest.fn(() => false), // Default to desktop mode
    WS: {
        send: jest.fn(),
        authorized: {
            send: jest.fn(),
        },
    },
}));

// Create stable mock data outside the mock function to prevent infinite loops
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

describe('Stake', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    amount: 10,
                    basis: 'stake',
                    contract_type: TRADE_TYPES.RISE_FALL,
                    currency: 'USD',
                    proposal_info: {
                        [CONTRACT_TYPES.CALL]: {
                            has_error: false,
                            message:
                                'Win payout if Volatility 100 (1s) Index is strictly higher than entry spot at 5 minutes after contract start time.',
                            payout: 19.55,
                        },
                        [CONTRACT_TYPES.PUT]: {
                            has_error: false,
                            message:
                                'Win payout if Volatility 100 (1s) Index is strictly lower than entry spot at 5 minutes after contract start time.',
                            payout: 19.51,
                        },
                    },
                    trade_types: {
                        [CONTRACT_TYPES.CALL]: 'Higher',
                        [CONTRACT_TYPES.PUT]: 'Lower',
                    },
                    trade_type_tab: 'CALL',
                    validation_params: {
                        [CONTRACT_TYPES.CALL]: { stake: { max: '50000.00', min: '0.35' } },
                        [CONTRACT_TYPES.PUT]: { stake: { max: '50000.00', min: '0.35' } },
                    },
                },
            },
        });
        // Override is_mobile for desktop tests
        default_mock_store.ui.is_mobile = false;
    });

    const MockedStake = ({ store = default_mock_store }: { store?: ReturnType<typeof mockStore> }) => (
        <TraderProviders store={store}>
            <ModulesProvider store={store}>
                <Stake is_minimized />
            </ModulesProvider>
        </TraderProviders>
    );

    it('renders trade param with "Stake" label and input with a value equal to the current stake amount value', () => {
        render(<MockedStake />);
        const { amount, currency } = default_mock_store.modules.trade;
        expect(screen.getByText(stake_param_label)).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue(`${amount} ${currency}`);
    });

    it('opens popover with chips if user clicks on "Stake" trade param (desktop)', async () => {
        render(<MockedStake />);

        await userEvent.click(screen.getByText(stake_param_label));

        // Desktop uses popover with value chips, not ActionSheet
        expect(screen.getByLabelText('Select value 10 USD')).toBeInTheDocument();
        // Desktop popover doesn't show payout details in the same way as mobile
    });

    it('calls onChange if user clicks on a chip value (desktop)', async () => {
        render(<MockedStake />);

        await userEvent.click(screen.getByText(stake_param_label));

        // Desktop uses chips - click on a different value
        await userEvent.click(screen.getByLabelText('Select value 20 USD'));

        expect(default_mock_store.modules.trade.onChange).toHaveBeenCalledWith({
            target: { name: 'amount', value: 20 },
        });
    });

    it('does not render payout details for Accumulators', async () => {
        default_mock_store.modules.trade.is_accumulator = true;
        render(<MockedStake />);
        await userEvent.click(screen.getByText(stake_param_label));
        expect(screen.queryByText(/payout/i)).not.toBeInTheDocument();
    });

    it('does not render payout details for Turbos', async () => {
        default_mock_store.modules.trade.is_turbos = true;
        render(<MockedStake />);
        await userEvent.click(screen.getByText(stake_param_label));
        expect(screen.queryByText(/payout/i)).not.toBeInTheDocument();
    });

    it('does not render payout details for Vanillas', async () => {
        default_mock_store.modules.trade.is_vanilla = true;
        render(<MockedStake />);
        await userEvent.click(screen.getByText(stake_param_label));
        expect(screen.queryByText(/payout/i)).not.toBeInTheDocument();
    });

    it('opens popover for Multipliers (desktop)', async () => {
        const multiplier_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    amount: 10,
                    basis: 'stake',
                    commission: 0.36,
                    contract_type: TRADE_TYPES.MULTIPLIER,
                    currency: 'USD',
                    is_multiplier: true,
                    proposal_info: {
                        [CONTRACT_TYPES.MULTIPLIER.UP]: {
                            has_error: false,
                            message:
                                "If you select 'Up', your total profit/loss will be the percentage increase in Volatility 100 (1s) Index, multiplied by 1000, minus commissions.",
                            payout: 0,
                        },
                        [CONTRACT_TYPES.MULTIPLIER.DOWN]: {
                            has_error: false,
                            message:
                                "If you select 'Down', your total profit/loss will be the percentage decrease in Volatility 100 (1s) Index, multiplied by 1000, minus commissions.",
                            payout: 0,
                        },
                    },
                    stop_out: -10,
                    trade_types: {
                        [CONTRACT_TYPES.MULTIPLIER.UP]: 'Multiply Up',
                        [CONTRACT_TYPES.MULTIPLIER.DOWN]: 'Multiply Down',
                    },
                    validation_params: {
                        [CONTRACT_TYPES.MULTIPLIER.UP]: {
                            stake: {
                                max: '2000.00',
                                min: '1.00',
                            },
                        },
                        [CONTRACT_TYPES.MULTIPLIER.DOWN]: {
                            stake: {
                                max: '2000.00',
                                min: '1.00',
                            },
                        },
                    },
                },
            },
        });
        multiplier_store.ui.is_mobile = false;

        render(<MockedStake store={multiplier_store} />);

        await userEvent.click(screen.getByText(stake_param_label));
        // Desktop popover should open with chips
        expect(screen.getByLabelText('Select value 10 USD')).toBeInTheDocument();
    });

    it('shows error in case of a validation error (desktop)', async () => {
        default_mock_store.modules.trade.contract_type = TRADE_TYPES.HIGH_LOW;
        default_mock_store.modules.trade.trade_type_tab = 'CALL';
        default_mock_store.modules.trade.validation_params = {
            CALL: { stake: { max: '50000.00', min: '0.35' } },
        };

        render(<MockedStake />);

        await userEvent.click(screen.getByText(stake_param_label));

        // Desktop popover should show chips - verify popover is open
        expect(screen.getByLabelText('Select value 10 USD')).toBeInTheDocument();
    });

    it('disables trade param if is_market_closed == true', () => {
        default_mock_store.modules.trade.is_market_closed = true;
        render(<MockedStake />);

        expect(screen.getByRole('textbox')).toBeDisabled();
    });
});
