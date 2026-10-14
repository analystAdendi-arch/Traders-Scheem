import React from 'react';

import { useMobileBridge } from '@deriv/api';
import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getTradeTypesList, sortCategoriesInTradeTypeOrder } from 'AppV2/Utils/trade-types-utils';

import TraderProviders from '../../../../trader-providers';
import TradeTypes from '../trade-types';

jest.mock('AppV2/Utils/trade-types-utils');

jest.mock('AppV2/Components/Guide', () => jest.fn(() => <div>MockedGuide</div>));

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useMobileBridge: jest.fn(() => ({
        isBridgeAvailable: false,
    })),
}));

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(() => ({ isMobile: true })),
}));

const mockGetTradeTypesList = getTradeTypesList as jest.MockedFunction<typeof getTradeTypesList>;
const mockSortCategoriesInTradeTypeOrder = sortCategoriesInTradeTypeOrder as jest.Mock;

const contract_types_list = {
    rise_fall: {
        name: 'Rise/Fall',
        categories: [
            { text: 'Rise', value: 'rise' },
            { text: 'Fall', value: 'fall' },
        ],
    },
    vanilla: {
        name: 'Vanilla',
        categories: [
            { text: 'Vanilla Call', value: 'vanilla_call' },
            { text: 'Vanilla Put', value: 'vanilla_put' },
        ],
    },
};

const default_mock_store = {
    modules: {
        trade: {
            contract_type: 'rise_fall',
            contract_types_list,
        },
    },
};

const mockTradeTypes = (mocked_store = mockStore(default_mock_store)) => {
    return (
        <TraderProviders store={mocked_store}>
            <TradeTypes
                is_dark_mode_on={false}
                onTradeTypeSelect={jest.fn()}
                trade_types={mockGetTradeTypesList(default_mock_store.modules.trade.contract_types_list)}
                contract_type='rise_fall'
            />
        </TraderProviders>
    );
};

describe('TradeTypes', () => {
    const scrollByMock = jest.fn();
    beforeEach(() => {
        mockGetTradeTypesList.mockReturnValue([
            { value: 'accumulator', text: 'Accumulator' },
            { value: 'multipler', text: 'Multiplier' },
            { value: 'rise', text: 'Rise' },
            { value: 'fall', text: 'Fall' },
            { value: 'vanilla_call', text: 'Vanilla Call' },
            { value: 'vanilla_put', text: 'Vanilla Put' },
        ]);

        // Reset useMobileBridge mock to default (bridge not available)
        (useMobileBridge as jest.Mock).mockReturnValue({
            isBridgeAvailable: false,
        });

        // Reset useDevice mock to default (mobile)
        const { useDevice } = jest.requireMock('@deriv-com/ui');
        (useDevice as jest.Mock).mockReturnValue({
            isMobile: true,
        });
    });
    beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
            value: scrollByMock,
        });
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should render the TradeTypes component with pinned and other trade types', () => {
        render(mockTradeTypes());

        expect(screen.getByText('View all')).toBeInTheDocument();
        expect(screen.getByText('Rise')).toBeInTheDocument();
    });

    it('should handle adding and removing pinned trade types', async () => {
        mockSortCategoriesInTradeTypeOrder.mockReturnValue([{ id: 'accumulator', title: 'Accumulator' }]);
        render(mockTradeTypes());

        await userEvent.click(screen.getByText('View all'));
        await userEvent.click(screen.getByText('Customise'));

        const removeButton = screen.getAllByTestId('dt_draggable_list_item_icon')[0];
        await userEvent.click(removeButton);

        const addButton = (await screen.findAllByTestId('dt_trade_type_list_item_right_icon'))[0];
        await userEvent.click(addButton);

        expect(screen.getByText('Trade types')).toBeInTheDocument();
    });

    it('should scroll to the selected trade type when tradeList is clicked', async () => {
        render(mockTradeTypes());
        Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
            value: scrollByMock,
        });
        await userEvent.click(screen.getByText('Rise'));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(scrollByMock).toHaveBeenCalled();
    });

    it('should show "View all" button when mobile bridge is not available (web app)', () => {
        (useMobileBridge as jest.Mock).mockReturnValue({
            isBridgeAvailable: false,
        });

        render(mockTradeTypes());

        expect(screen.getByText('View all')).toBeInTheDocument();
    });

    it('should hide "View all" button when mobile bridge is available (native mobile app)', () => {
        (useMobileBridge as jest.Mock).mockReturnValue({
            isBridgeAvailable: true,
        });

        render(mockTradeTypes());

        expect(screen.queryByText('View all')).not.toBeInTheDocument();
    });

    it('should only display trade types that are available in trade_types prop, filtering out unavailable types', () => {
        // Simulate localStorage having unavailable trade types saved
        const unavailableTradeTypes = [
            {
                id: 'pinned',
                title: 'Pinned',
                items: [
                    { id: 'accumulator', title: 'Accumulator' },
                    { id: 'vanilla_call', title: 'Vanilla Call' },
                    { id: 'high_low', title: 'Higher/Lower' }, // Not in current trade_types
                ],
            },
        ];
        localStorage.setItem('pinned_trade_types', JSON.stringify(unavailableTradeTypes));

        // Mock getTradeTypesList to return only limited available types (e.g., only Multiplier for Forex)
        mockGetTradeTypesList.mockReturnValue([
            { value: 'multiplier', text: 'Multiplier' },
            { value: 'accumulator', text: 'Accumulator' },
        ]);

        const limited_mock_store = {
            modules: {
                trade: {
                    contract_type: 'multiplier',
                    contract_types_list,
                },
            },
        };

        render(
            <TraderProviders store={mockStore(limited_mock_store)}>
                <TradeTypes
                    is_dark_mode_on={false}
                    onTradeTypeSelect={jest.fn()}
                    trade_types={[
                        { value: 'multiplier', text: 'Multiplier' },
                        { value: 'accumulator', text: 'Accumulator' },
                    ]}
                    contract_type='multiplier'
                />
            </TraderProviders>
        );

        // Should show available trade types
        expect(screen.getByText('Multiplier')).toBeInTheDocument();
        expect(screen.getByText('Accumulator')).toBeInTheDocument();

        // Should NOT show unavailable trade types even if they were in localStorage
        expect(screen.queryByText('Higher/Lower')).not.toBeInTheDocument();
        expect(screen.queryByText('Vanilla Call')).not.toBeInTheDocument();

        // Cleanup
        localStorage.removeItem('pinned_trade_types');
    });

    it('should automatically clean up localStorage to remove unavailable trade types', async () => {
        // Simulate localStorage having stale trade types from a previous symbol
        const staleTradeTypes = [
            {
                id: 'pinned',
                title: 'Pinned',
                items: [
                    { id: 'multiplier', title: 'Multiplier' },
                    { id: 'rise_fall', title: 'Rise/Fall' }, // Will be removed (not available)
                    { id: 'high_low', title: 'Higher/Lower' }, // Will be removed (not available)
                    { id: 'accumulator', title: 'Accumulator' },
                ],
            },
        ];
        localStorage.setItem('pinned_trade_types', JSON.stringify(staleTradeTypes));

        // Mock getTradeTypesList to return only Multiplier and Accumulator (e.g., Forex symbol)
        mockGetTradeTypesList.mockReturnValue([
            { value: 'multiplier', text: 'Multiplier' },
            { value: 'accumulator', text: 'Accumulator' },
        ]);

        const limited_mock_store = {
            modules: {
                trade: {
                    contract_type: 'multiplier',
                    contract_types_list,
                },
            },
        };

        const { rerender } = render(
            <TraderProviders store={mockStore(limited_mock_store)}>
                <TradeTypes
                    is_dark_mode_on={false}
                    onTradeTypeSelect={jest.fn()}
                    trade_types={[
                        { value: 'multiplier', text: 'Multiplier' },
                        { value: 'accumulator', text: 'Accumulator' },
                    ]}
                    contract_type='multiplier'
                />
            </TraderProviders>
        );

        // Wait for useEffect to run and clean up localStorage
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify only available trade types are displayed
        expect(screen.getByText('Multiplier')).toBeInTheDocument();
        expect(screen.getByText('Accumulator')).toBeInTheDocument();
        expect(screen.queryByText('Rise/Fall')).not.toBeInTheDocument();
        expect(screen.queryByText('Higher/Lower')).not.toBeInTheDocument();

        // Verify localStorage was automatically cleaned up
        const updatedLocalStorage = JSON.parse(localStorage.getItem('pinned_trade_types') || '[]');
        const pinnedItems = updatedLocalStorage.flatMap((category: { items: unknown[] }) => category.items);

        expect(pinnedItems).toHaveLength(2);
        expect(pinnedItems).toEqual([
            { id: 'multiplier', title: 'Multiplier' },
            { id: 'accumulator', title: 'Accumulator' },
        ]);

        // Verify Rise/Fall and Higher/Lower were removed from localStorage
        const itemIds = pinnedItems.map((item: { id: string }) => item.id);
        expect(itemIds).not.toContain('rise_fall');
        expect(itemIds).not.toContain('high_low');

        // Cleanup
        localStorage.removeItem('pinned_trade_types');
    });
});
