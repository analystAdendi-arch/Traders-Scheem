import React from 'react';

import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';

import TraderProviders from '../../../../trader-providers';
import ReplayChart from '../replay-chart';

jest.mock('Modules/SmartChart', () => ({
    SmartChart: () => <div data-testid='dt_mock_chart'>Mocked Chart</div>,
}));

jest.mock('Modules/SmartChart/Components/Markers/marker', () => ({
    __esModule: true,
    default: () => <div>Mocked Marker</div>,
}));

jest.mock('Modules/SmartChart/Components/Markers/reset-contract-chart-elements', () => ({
    __esModule: true,
    default: () => <div>Mocked Reset Elements</div>,
}));

jest.mock('Modules/SmartChart/Hooks/useSmartChartsAdapter', () => ({
    useSmartChartsAdapter: () => ({
        chartData: {
            activeSymbols: [],
            tradingTimes: {},
        },
        isLoading: false,
        error: null,
        getQuotes: jest.fn(),
        subscribeQuotes: jest.fn(),
        unsubscribeQuotes: jest.fn(),
        retryFetchChartData: jest.fn(),
        shouldUseCandlesOverride: false,
    }),
}));

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(() => ({ isMobile: false, isDesktop: true, isTablet: false })),
}));

describe('<ReplayChart>', () => {
    const props = {
        is_dark_theme_prop: true,
        is_accumulator_contract: true,
        is_reset_contract: false,
    };

    const store = mockStore({
        contract_replay: {
            contract_store: {
                contract_config: {
                    end_epoch: 1234567890,
                    chart_type: 'line',
                    start_epoch: 1234567880,
                    granularity: 60,
                },
                is_digit_contract: false,
                barriers_array: [],
                getContractsArray: () => [],
                markers_array: [],
                contract_info: {
                    underlying_symbol: 'R_50',
                    audit_details: { all_ticks: [] },
                    barrier_count: 1,
                    contract_id: 12345,
                    contract_type: 'CALL',
                },
            },
            chart_state: 'READY',
            chartStateChange: jest.fn(),
            margin: 0,
        },
        common: {
            app_routing_history: [],
            current_language: 'en',
            is_socket_opened: true,
        },
        ui: {
            is_chart_layout_default: true,
            is_chart_countdown_visible: true,
            is_dark_mode_on: false,
        },
    });

    it('renders SmartChart component with correct props', () => {
        render(
            <TraderProviders store={store}>
                <ReplayChart {...props} />
            </TraderProviders>
        );

        const mockChartElement = screen.getByTestId('dt_mock_chart');
        expect(mockChartElement).toBeInTheDocument();
        expect(screen.getByText('Mocked Chart')).toBeInTheDocument();
    });
});
