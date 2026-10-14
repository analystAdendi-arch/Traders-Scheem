import React from 'react';
import moment from 'moment';

import {
    hasContractEntered,
    isAccumulatorContract,
    isMultiplierContract,
    isOpen,
    isValidToCancel,
    isValidToSell,
    useWS,
    WS,
} from '@deriv/shared';
import { mockStore } from '@deriv/stores';
import { render, screen, waitFor } from '@testing-library/react';

import useContractDetails from 'AppV2/Hooks/useContractDetails';
import useOrderDetails from 'AppV2/Hooks/useOrderDetails';
import { getContractDetailsConfig } from 'AppV2/Utils/contract-details-config';

import TraderProviders from '../../../../trader-providers';
import ContractDetails from '../contract-details';

jest.mock('AppV2/Hooks/useContractDetails', () => jest.fn());
jest.mock('AppV2/Hooks/useOrderDetails', () => jest.fn());

jest.mock('AppV2/Components/ContractCard', () => {
    const ContractCard = () => <div data-testid='contract-card'>ContractCard</div>;
    ContractCard.displayName = 'ContractCard';
    return { ContractCard };
});

jest.mock('AppV2/Components/DealCancellation/deal-cancellation.tsx', () => {
    const DealCancellation = () => <div data-testid='deal-cancellation'>Deal Cancellation</div>;
    DealCancellation.displayName = 'DealCancellation';
    return DealCancellation;
});
jest.mock('AppV2/Components/RiskManagementItem/risk-management-item.tsx', () => {
    const RiskManagementItem = () => <div data-testid='risk-management-item'>Risk Management Item</div>;
    RiskManagementItem.displayName = 'RiskManagementItem';
    return RiskManagementItem;
});
jest.mock('AppV2/Components/TakeProfit/take-profit.tsx', () => {
    const TakeProfit = () => <div data-testid='take-profit'>Take Profit</div>;
    TakeProfit.displayName = 'TakeProfit';
    return TakeProfit;
});
jest.mock('AppV2/Components/StopLoss/stop-loss.tsx', () => {
    const StopLoss = () => <div data-testid='stop-loss'>Stop Loss</div>;
    StopLoss.displayName = 'StopLoss';
    return StopLoss;
});

jest.mock('AppV2/Components/ContractDetailsFooter/contract-details-footer.tsx', () => {
    const ContractDetailsFooter = () => (
        <div data-testid='ContractDetailsFooter'>Contract Details Footer Placeholder</div>
    );
    ContractDetailsFooter.displayName = 'ContractDetailsFooter';
    return ContractDetailsFooter;
});

jest.mock('AppV2/Components/EntryExitDetails', () => {
    const EntryExitDetails = () => <div>Entry Exit Details Placeholder</div>;
    EntryExitDetails.displayName = 'EntryExitDetails';
    return EntryExitDetails;
});

jest.mock('AppV2/Components/PayoutInfo', () => {
    const PayoutInfo = () => <div>Payout Info Placeholder</div>;
    PayoutInfo.displayName = 'PayoutInfo';
    return PayoutInfo;
});

jest.mock('AppV2/Components/TakeProfitHistory', () => {
    const TakeProfitHistory = () => <div data-testid='TakeProfitHistory'>Take Profit History Placeholder</div>;
    TakeProfitHistory.displayName = 'TakeProfitHistory';
    return TakeProfitHistory;
});

jest.mock('AppV2/Components/OrderDetails', () => {
    const OrderDetails = () => <div data-testid='TakeProfitHistory'>Order Details Placeholder</div>;
    OrderDetails.displayName = 'OrderDetails';
    return OrderDetails;
});

jest.mock('AppV2/Containers/Chart/contract-details-chart.tsx', () => {
    const ContractDetailsChart = () => <div>Chart Placeholder</div>;
    ContractDetailsChart.displayName = 'ContractDetailsChart';
    return ContractDetailsChart;
});

jest.mock('AppV2/Components/ContractDetailsHeader/contract-details-header.tsx', () => {
    const ContractDetailsHeader = () => <div>Contract Details Header Placeholder</div>;
    ContractDetailsHeader.displayName = 'ContractDetailsHeader';
    return ContractDetailsHeader;
});

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    isValidToSell: jest.fn(),
    isMultiplierContract: jest.fn(),
    isValidToCancel: jest.fn(),
    isOpen: jest.fn(),
    useWS: jest.fn(),
    hasContractEntered: jest.fn(),
    isForwardStarting: jest.fn(),
    isAccumulatorContract: jest.fn(),
    WS: {
        contractUpdateHistory: jest.fn(() => Promise.resolve({ contract_update_history: [] })),
    },
}));
jest.mock('AppV2/Utils/contract-details-config', () => ({ getContractDetailsConfig: jest.fn() }));

// Create stable mock objects to prevent infinite loops
// The key issue: limit_order and its nested objects must be stable references
const mockLimitOrder = {
    take_profit: { order_amount: 100 },
    stop_loss: { order_amount: 50 },
};

const mockContractInfo = {
    contract_id: 1,
    currency: 'USD',
    contract_type: 'multiplier',
    limit_order: mockLimitOrder,
    purchase_time: Date.now(),
    shortcode: 'mock_shortcode',
};

const mockContractUpdateHistory = {
    contract_update_history: [],
};

const mockContractDetailsConfig = {
    isTakeProfitVisible: true,
    isStopLossVisible: true,
    isDealCancellationVisible: true,
    isTpHistoryVisible: true,
};

const default_mock_store = {
    modules: {
        trade: {
            active_symbols: [{ symbol: 'R_10' }],
        },
    },
    ui: {
        addToast: jest.fn(),
        current_focus: '',
        is_mobile: true,
        removeToast: jest.fn(),
        setCurrentFocus: jest.fn(),
        should_show_cancellation_warning: false,
        toggleCancellationWarning: jest.fn(),
    },
    common: {
        server_time: moment('2023-11-21 10:59:59'),
    },
    contract_trade: {
        getContractById: jest.fn(),
    },
};

// Todo: Enable tests after fixing infinite loop issues
describe('ContractDetails', () => {
    beforeEach(() => {
        // Use stable mock references to prevent infinite loops
        (useContractDetails as jest.Mock).mockReturnValue({
            contract_info: mockContractInfo,
            is_loading: false,
        });
        (useOrderDetails as jest.Mock).mockReturnValue({
            details: {},
        });
        (isValidToSell as jest.Mock).mockReturnValue(true);
        (isMultiplierContract as jest.Mock).mockReturnValue(true);
        (isValidToCancel as jest.Mock).mockReturnValue(true);
        (isOpen as jest.Mock).mockReturnValue(true);
        (hasContractEntered as jest.Mock).mockReturnValue(true);
        (isAccumulatorContract as jest.Mock).mockReturnValue(false);
        (useWS as jest.Mock).mockReturnValue({
            send: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
        });
        // Use stable mock reference
        (WS.contractUpdateHistory as jest.Mock).mockResolvedValue(mockContractUpdateHistory);
        // Use stable mock reference
        (getContractDetailsConfig as jest.Mock).mockReturnValue(mockContractDetailsConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderContractDetails = () => {
        render(
            <TraderProviders store={mockStore(default_mock_store)}>
                <ContractDetails />
            </TraderProviders>
        );
    };

    it('should render the ContractCard component', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('ContractCard')).toBeInTheDocument();
        });
    });

    it('should render the Chart component', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('Chart Placeholder')).toBeInTheDocument();
        });
    });

    it('should render the DealCancellation component', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('Deal Cancellation')).toBeInTheDocument();
        });
    });

    it('should render the TakeProfit and StopLoss components if conditions are met', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByTestId('take-profit')).toBeInTheDocument();
            expect(screen.getByTestId('stop-loss')).toBeInTheDocument();
        });
    });

    it('should render the OrderDetails component', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('Order Details Placeholder')).toBeInTheDocument();
        });
    });

    // it('should render the PayoutInfo component', async () => {
    //     renderContractDetails();
    //     await waitFor(() => {
    //         expect(screen.getByText('Payout Info Placeholder')).toBeInTheDocument();
    //     });
    // });

    it('should render the EntryExitDetails component', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('Entry Exit Details Placeholder')).toBeInTheDocument();
        });
    });

    it('should render the TakeProfitHistory component if history is available', async () => {
        (WS.contractUpdateHistory as jest.Mock).mockResolvedValueOnce({
            contract_update_history: [
                {
                    order_date: '2021-01-01',
                },
            ],
        });
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('Take Profit History Placeholder')).toBeInTheDocument();
        });
    });

    it('should render the ContractDetailsFooter component if conditions are met', async () => {
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByText('Contract Details Footer Placeholder')).toBeInTheDocument();
        });
    });

    it('should not render the ContractDetailsFooter component if conditions are not met', async () => {
        (hasContractEntered as jest.Mock).mockReturnValue(false);
        renderContractDetails();
        await waitFor(() => {
            expect(screen.queryByText('Contract Details Footer Placeholder')).not.toBeInTheDocument();
        });
    });

    it('should render loader if is_loading === true', async () => {
        (useContractDetails as jest.Mock).mockReturnValue({
            contract_info: mockContractInfo,
            is_loading: true,
        });
        renderContractDetails();
        await waitFor(() => {
            expect(screen.getByTestId('dt_contract_details_loader')).toBeInTheDocument();
        });
    });
});
