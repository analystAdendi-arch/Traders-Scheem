import { TRADE_TYPES } from '@deriv/shared';
import { renderHook } from '@testing-library/react-hooks';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import useAvailableContracts from '../useAvailableContracts';
import useNativeAppAllowedTradeTypes from '../useNativeAppAllowedTradeTypes';

jest.mock('../useNativeAppAllowedTradeTypes', () => ({
    __esModule: true,
    default: jest.fn(() => undefined),
}));

describe('useAvailableContracts', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset to default mock
        (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Web App (No Filtering)', () => {
        it('should return all available contracts when not on native mobile app', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(10);
            expect(result.current).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id: CONTRACT_LIST.ACCUMULATORS }),
                    expect.objectContaining({ id: CONTRACT_LIST.VANILLAS }),
                    expect.objectContaining({ id: CONTRACT_LIST.TURBOS }),
                    expect.objectContaining({ id: CONTRACT_LIST.MULTIPLIERS }),
                    expect.objectContaining({ id: CONTRACT_LIST.RISE_FALL }),
                    expect.objectContaining({ id: CONTRACT_LIST.HIGHER_LOWER }),
                    expect.objectContaining({ id: CONTRACT_LIST.TOUCH_NO_TOUCH }),
                    expect.objectContaining({ id: CONTRACT_LIST.MATCHES_DIFFERS }),
                    expect.objectContaining({ id: CONTRACT_LIST.EVEN_ODD }),
                    expect.objectContaining({ id: CONTRACT_LIST.OVER_UNDER }),
                ])
            );
        });

        it('should return contracts with correct structure', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);

            const { result } = renderHook(() => useAvailableContracts());

            const firstContract = result.current[0];
            expect(firstContract).toHaveProperty('tradeType');
            expect(firstContract).toHaveProperty('id');
            expect(firstContract).toHaveProperty('for');
            expect(Array.isArray(firstContract.for)).toBe(true);
        });

        it('should include correct trade type values in "for" array', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);

            const { result } = renderHook(() => useAvailableContracts());

            const accumulatorContract = result.current.find(c => c.id === CONTRACT_LIST.ACCUMULATORS);
            expect(accumulatorContract?.for).toEqual([TRADE_TYPES.ACCUMULATOR]);

            const vanillasContract = result.current.find(c => c.id === CONTRACT_LIST.VANILLAS);
            expect(vanillasContract?.for).toEqual([TRADE_TYPES.VANILLA.CALL, TRADE_TYPES.VANILLA.PUT]);

            const riseFallContract = result.current.find(c => c.id === CONTRACT_LIST.RISE_FALL);
            expect(riseFallContract?.for).toEqual([TRADE_TYPES.RISE_FALL, TRADE_TYPES.RISE_FALL_EQUAL]);
        });
    });

    describe('Native Mobile App (With Filtering)', () => {
        it('should filter contracts when native app allows only specific trade types', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Accumulators', 'Multipliers']);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(2);
            expect(result.current).toEqual([
                expect.objectContaining({ id: CONTRACT_LIST.ACCUMULATORS }),
                expect.objectContaining({ id: CONTRACT_LIST.MULTIPLIERS }),
            ]);
        });

        it('should return all contracts when native app allows all trade types', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([
                'Accumulators',
                'Vanillas',
                'Turbos',
                'Multipliers',
                'Rise/Fall',
                'Higher/Lower',
                'Touch/No Touch',
                'Matches/Differs',
                'Even/Odd',
                'Over/Under',
            ]);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(10);
        });

        it('should return empty array when native app allows no trade types (fail-safe)', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([]);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toEqual([]);
        });

        it('should filter correctly with single allowed trade type', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Vanillas']);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(1);
            expect(result.current[0].id).toBe(CONTRACT_LIST.VANILLAS);
        });

        it('should filter correctly with multiple allowed trade types', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([
                'Accumulators',
                'Vanillas',
                'Turbos',
                'Multipliers',
            ]);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(4);
            expect(result.current.map(c => c.id)).toEqual([
                CONTRACT_LIST.ACCUMULATORS,
                CONTRACT_LIST.MULTIPLIERS,
                CONTRACT_LIST.TURBOS,
                CONTRACT_LIST.VANILLAS,
            ]);
        });

        it('should maintain original order after filtering', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Multipliers', 'Accumulators', 'Vanillas']);

            const { result } = renderHook(() => useAvailableContracts());

            // Should maintain order from AVAILABLE_CONTRACTS, not from allowed types
            expect(result.current[0].id).toBe(CONTRACT_LIST.ACCUMULATORS);
            expect(result.current[1].id).toBe(CONTRACT_LIST.MULTIPLIERS);
            expect(result.current[2].id).toBe(CONTRACT_LIST.VANILLAS);
        });

        it('should ignore non-existent trade types in allowed list', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue([
                'Accumulators',
                'NonExistentType',
                'Multipliers',
            ]);

            const { result } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(2);
            expect(result.current.map(c => c.id)).toEqual([CONTRACT_LIST.ACCUMULATORS, CONTRACT_LIST.MULTIPLIERS]);
        });
    });

    describe('Memoization', () => {
        it('should memoize result when dependencies do not change', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Accumulators', 'Multipliers']);

            const { result, rerender } = renderHook(() => useAvailableContracts());

            const firstResult = result.current;
            rerender();
            const secondResult = result.current;

            // Should return the same reference if dependencies haven't changed
            expect(firstResult).toBe(secondResult);
        });

        it('should recompute when nativeAppAllowedTradeTypes changes', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Accumulators']);

            const { result, rerender } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(1);

            // Update mock to return different allowed types
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Multipliers']);

            rerender();

            expect(result.current).toHaveLength(1);
            expect(result.current[0].id).toBe(CONTRACT_LIST.MULTIPLIERS);
        });

        it('should recompute when switching between web and mobile', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);

            const { result, rerender } = renderHook(() => useAvailableContracts());

            expect(result.current).toHaveLength(10);

            // Switch to mobile with filtering
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Accumulators', 'Multipliers']);

            rerender();

            expect(result.current).toHaveLength(2);
        });
    });

    describe('Integration with useNativeAppAllowedTradeTypes', () => {
        it('should call useNativeAppAllowedTradeTypes hook', () => {
            renderHook(() => useAvailableContracts());

            expect(useNativeAppAllowedTradeTypes).toHaveBeenCalled();
        });

        it('should pass undefined from useNativeAppAllowedTradeTypes to getAvailableContracts', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(undefined);

            const { result } = renderHook(() => useAvailableContracts());

            // When undefined, should return all contracts
            expect(result.current).toHaveLength(10);
        });

        it('should pass array from useNativeAppAllowedTradeTypes to getAvailableContracts', () => {
            (useNativeAppAllowedTradeTypes as jest.Mock).mockReturnValue(['Accumulators', 'Vanillas']);

            const { result } = renderHook(() => useAvailableContracts());

            // When array provided, should filter
            expect(result.current).toHaveLength(2);
        });
    });
});
