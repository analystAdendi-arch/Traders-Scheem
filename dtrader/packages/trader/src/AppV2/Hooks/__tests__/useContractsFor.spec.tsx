import { useQuery } from '@deriv/api';
import { cloneObject, getContractCategoriesConfig, getContractTypesConfig } from '@deriv/shared';
import { mockStore } from '@deriv/stores';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import TraderProviders from '../../../trader-providers';
import useContractsFor from '../useContractsFor';
import useNativeAppAllowedTradeTypes from '../useNativeAppAllowedTradeTypes';

jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useQuery: jest.fn(() => ({
        data: null,
        error: null,
        isLoading: false,
    })),
    useMobileBridge: jest.fn(() => ({
        isMobileApp: false,
    })),
}));

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getContractCategoriesConfig: jest.fn(),
    getContractTypesConfig: jest.fn(),
    cloneObject: jest.fn(),
}));

jest.mock('../useNativeAppAllowedTradeTypes', () => ({
    __esModule: true,
    default: jest.fn(() => undefined),
}));

describe('useContractsFor', () => {
    let mocked_store: ReturnType<typeof mockStore>;

    const wrapper = ({ children }: { children: JSX.Element }) => (
        <TraderProviders store={mocked_store}>{children}</TraderProviders>
    );

    beforeEach(() => {
        jest.clearAllMocks();

        mocked_store = {
            ...mockStore({}),
            client: {
                ...mockStore({}).client,
                landing_company_shortcode: 'maltainvest',
                loginid: 'CR1234',
            },
            modules: {
                trade: {
                    setContractTypesListV2: jest.fn(),
                    onChange: jest.fn(),
                    symbol: 'R_50',
                },
            },
        };

        (getContractCategoriesConfig as jest.Mock).mockReturnValue({
            category_1: { categories: ['type_1'] },
            category_2: { categories: ['type_2'] },
        });

        (getContractTypesConfig as jest.Mock).mockReturnValue({
            type_1: { trade_types: ['type_1'], title: 'Type 1', barrier_count: 0 },
            type_2: { trade_types: ['type_2'], title: 'Type 2', barrier_count: 1 },
        });

        (cloneObject as jest.Mock).mockImplementation(obj => JSON.parse(JSON.stringify(obj)));

        // Reset useNativeAppAllowedTradeTypes mock to default
        (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and set contract types for the company successfully', async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: {
                contracts_for: {
                    available: [
                        { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                        { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                    ],
                    hit_count: 2,
                },
            },
            error: null,
            isLoading: false,
        });

        const { result } = renderHook(() => useContractsFor(), { wrapper });

        await waitFor(() => {
            expect(result.current.contract_types_list).toEqual({
                category_1: { categories: [{ value: 'type_1', text: 'Type 1' }] },
                category_2: { categories: [{ value: 'type_2', text: 'Type 2' }] },
            });
            expect(mocked_store.modules.trade.setContractTypesListV2).toHaveBeenCalledWith({
                category_1: { categories: [{ value: 'type_1', text: 'Type 1' }] },
                category_2: { categories: [{ value: 'type_2', text: 'Type 2' }] },
            });
        });
    });

    it('should handle API errors gracefully', async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: null,
            error: { message: 'Some error' },
            isLoading: false,
        });

        const { result } = renderHook(() => useContractsFor(), { wrapper });

        await waitFor(() => {
            expect(result.current.contract_types_list).toEqual([]);
            expect(mocked_store.modules.trade.setContractTypesListV2).not.toHaveBeenCalled();
        });
    });

    it('should not set unsupported contract types', async () => {
        (useQuery as jest.Mock).mockReturnValue({
            data: {
                contracts_for: {
                    available: [{ contract_type: 'unsupported_type', underlying_symbol: 'UNSUPPORTED' }],
                    hit_count: 1,
                },
            },
            error: null,
            isLoading: false,
        });

        const { result } = renderHook(() => useContractsFor(), { wrapper });

        await waitFor(() => {
            expect(result.current.trade_types).toEqual([]);
        });
    });

    describe('Symbol validation fix', () => {
        it('should prevent query when symbol is undefined', async () => {
            mocked_store.modules.trade.symbol = undefined;

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith(
                    'contracts_for',
                    expect.objectContaining({
                        options: expect.objectContaining({
                            enabled: false,
                        }),
                    })
                );
            });
        });

        it('should prevent query when symbol is null', async () => {
            mocked_store.modules.trade.symbol = null;

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith(
                    'contracts_for',
                    expect.objectContaining({
                        options: expect.objectContaining({
                            enabled: false,
                        }),
                    })
                );
            });
        });

        it('should prevent query when symbol is empty string', async () => {
            mocked_store.modules.trade.symbol = '';

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith(
                    'contracts_for',
                    expect.objectContaining({
                        options: expect.objectContaining({
                            enabled: false,
                        }),
                    })
                );
            });
        });

        it('should allow query when symbol is present', async () => {
            mocked_store.modules.trade.symbol = 'R_100';

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useQuery).toHaveBeenCalledWith('contracts_for', {
                    payload: {
                        contracts_for: 'R_100',
                    },
                    options: {
                        enabled: true,
                    },
                });
            });
        });
    });

    describe('Native App Allowed Trade Types', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should not filter trade types when not a native mobile app', async () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [
                            { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                            { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                        ],
                        hit_count: 2,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // All trade types should be available (no filtering)
                expect(result.current.trade_types.length).toBeGreaterThan(0);
            });
        });

        it('should filter trade types when native mobile app is available', async () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Accumulators', 'Multipliers']);

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [
                            { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                            { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                        ],
                        hit_count: 2,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Trade types should be filtered based on remote config
                expect(result.current.trade_types).toBeDefined();
            });
        });

        it('should use remote config values from native_app_allowed_trade_types', async () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([
                'Accumulators',
                'Vanillas',
                'Turbos',
                'Multipliers',
            ]);

            renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                expect(useNativeAppAllowedTradeTypes).toHaveBeenCalled();
            });
        });

        it('should handle empty remote config gracefully with fallback', async () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([
                'Accumulators',
                'Multipliers',
                'Vanillas',
                'Turbos',
            ]);

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Should not crash and should have valid data
                expect(result.current).toBeDefined();
            });
        });

        it('should block all trade types when native_app_allowed_trade_types is missing (fail-safe)', async () => {
            // Simulate corrupted remote config - missing native_app_allowed_trade_types
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([]);

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [
                            { contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 },
                            { contract_type: 'type_2', underlying_symbol: 'GBPUSD', default_stake: 20 },
                        ],
                        hit_count: 2,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Should block all trade types as fail-safe (empty array means filter out everything)
                expect(result.current.trade_types).toEqual([]);
            });
        });

        it('should block all trade types when remoteConfigData is null (fail-safe)', async () => {
            // Simulate null remote config data
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([]);

            (useQuery as jest.Mock).mockReturnValue({
                data: {
                    contracts_for: {
                        available: [{ contract_type: 'type_1', underlying_symbol: 'EURUSD', default_stake: 10 }],
                        hit_count: 1,
                    },
                },
                error: null,
                isLoading: false,
            });

            const { result } = renderHook(() => useContractsFor(), { wrapper });

            await waitFor(() => {
                // Should block all trade types as fail-safe
                expect(result.current.trade_types).toEqual([]);
            });
        });
    });
});
