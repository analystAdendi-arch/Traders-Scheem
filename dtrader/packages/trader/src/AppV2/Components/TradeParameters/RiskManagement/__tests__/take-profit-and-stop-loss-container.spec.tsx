import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import the hook mock to manipulate it in tests
import useIsVirtualKeyboardOpen from 'AppV2/Hooks/useIsVirtualKeyboardOpen';
import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import TakeProfitAndStopLossContainer from '../take-profit-and-stop-loss-container';

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    WS: {
        forget: jest.fn(),
        send: jest.fn(),
        authorized: {
            send: jest.fn(),
        },
    },
}));

jest.mock('AppV2/Hooks/useProposal', () => ({
    useProposal: jest.fn(() => ({
        data: {
            proposal: {},
        },
        error: null,
        isFetching: false,
    })),
}));

jest.mock('AppV2/Hooks/useIsVirtualKeyboardOpen', () => ({
    __esModule: true,
    default: jest.fn(() => ({ is_key_board_visible: false })),
}));

describe('TakeProfitAndStopLossContainer', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    currency: 'USD',
                    validation_params: {
                        TURBOSLONG: { take_profit: { min: '0.1', max: '100' }, stop_loss: { min: '0.1', max: '10' } },
                    },
                    validation_errors: {},
                    contract_type: 'turboslong',
                    trade_types: { TURBOSLONG: 'Turbos Long' },
                    trade_type_tab: 'TURBOSLONG',
                },
            },
        });
        Element.prototype.scrollIntoView = jest.fn();
    });

    afterEach(() => jest.clearAllMocks());

    const mockTakeProfitAndStopLossContainer = () =>
        render(
            <TraderProviders store={default_mock_store}>
                <ModulesProvider store={default_mock_store}>
                    <TakeProfitAndStopLossContainer closeActionSheet={jest.fn()} />
                </ModulesProvider>
            </TraderProviders>
        );

    it('should render both inputs for TP&SL', async () => {
        mockTakeProfitAndStopLossContainer();

        await userEvent.click(screen.getByText('Save'));
        expect(screen.getByText('Take profit')).toBeInTheDocument();
        expect(screen.getByText('Stop loss')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should call onChangeMultiple if user clicked on Save button', async () => {
        mockTakeProfitAndStopLossContainer();

        expect(default_mock_store.modules.trade.onChangeMultiple).not.toBeCalled();
        await userEvent.click(screen.getByText('Save'));
        expect(default_mock_store.modules.trade.onChangeMultiple).toBeCalled();
    });

    it('should render correctly when keyboard is visible', () => {
        (useIsVirtualKeyboardOpen as jest.Mock).mockReturnValue({ is_key_board_visible: true });

        mockTakeProfitAndStopLossContainer();

        expect(screen.getByText('Take profit')).toBeInTheDocument();
        expect(screen.getByText('Stop loss')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render correctly when keyboard is hidden', () => {
        (useIsVirtualKeyboardOpen as jest.Mock).mockReturnValue({ is_key_board_visible: false });

        mockTakeProfitAndStopLossContainer();

        expect(screen.getByText('Take profit')).toBeInTheDocument();
        expect(screen.getByText('Stop loss')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});
