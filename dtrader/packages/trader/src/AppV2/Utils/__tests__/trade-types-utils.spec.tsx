import React from 'react';

import { render } from '@testing-library/react';

import { TRADE_TYPES } from '@deriv/shared';

import {
    AVAILABLE_CONTRACTS,
    getCategoryLabel,
    getAvailableContracts,
    groupTradeTypesByCategory,
    isSameTradeTypeCategory,
    sortCategoriesInTradeTypeOrder,
} from '../trade-types-utils';

describe('trade-types-utils', () => {
    describe('groupTradeTypesByCategory', () => {
        it('should group contracts by category correctly', () => {
            const grouped = groupTradeTypesByCategory(AVAILABLE_CONTRACTS);

            expect(grouped).toHaveProperty('growth_based');
            expect(grouped).toHaveProperty('directional');
            expect(grouped).toHaveProperty('digit_based');

            // Growth based should contain Accumulators, Multipliers, Turbos, Vanillas
            expect(grouped.growth_based).toHaveLength(4);
            expect(grouped.growth_based.map(c => c.tradeType)).toContain('Accumulators');
            expect(grouped.growth_based.map(c => c.tradeType)).toContain('Multipliers');
            expect(grouped.growth_based.map(c => c.tradeType)).toContain('Turbos');
            expect(grouped.growth_based.map(c => c.tradeType)).toContain('Vanillas');

            // Directional should contain 3 contracts
            expect(grouped.directional).toHaveLength(3);
            expect(grouped.directional.map(c => c.tradeType)).toContain('Rise/Fall');
            expect(grouped.directional.map(c => c.tradeType)).toContain('Higher/Lower');
            expect(grouped.directional.map(c => c.tradeType)).toContain('Touch/No Touch');

            // Digit based should contain 3 contracts
            expect(grouped.digit_based).toHaveLength(3);
            expect(grouped.digit_based.map(c => c.tradeType)).toContain('Matches/Differs');
            expect(grouped.digit_based.map(c => c.tradeType)).toContain('Over/Under');
            expect(grouped.digit_based.map(c => c.tradeType)).toContain('Even/Odd');
        });

        it('should handle empty contracts array', () => {
            const grouped = groupTradeTypesByCategory([]);

            expect(grouped).toEqual({});
        });

        it('should maintain contract order within categories', () => {
            const grouped = groupTradeTypesByCategory(AVAILABLE_CONTRACTS);

            // Verify order matches AVAILABLE_CONTRACTS order
            const directionalTypes = grouped.directional.map(c => c.tradeType);
            expect(directionalTypes[0]).toBe('Rise/Fall');
            expect(directionalTypes[1]).toBe('Higher/Lower');
            expect(directionalTypes[2]).toBe('Touch/No Touch');

            const growthTypes = grouped.growth_based.map(c => c.tradeType);
            expect(growthTypes[0]).toBe('Accumulators');
            expect(growthTypes[1]).toBe('Multipliers');
            expect(growthTypes[2]).toBe('Turbos');
            expect(growthTypes[3]).toBe('Vanillas');
        });

        it('should group single contract correctly', () => {
            const singleContract = [AVAILABLE_CONTRACTS[0]];
            const grouped = groupTradeTypesByCategory(singleContract);

            expect(Object.keys(grouped)).toHaveLength(1);
            expect(grouped.directional).toHaveLength(1);
            expect(grouped.directional[0].tradeType).toBe('Rise/Fall');
        });
    });

    describe('isSameTradeTypeCategory', () => {
        it('should return true for vanillalongcall and vanillalongput', () => {
            const result = isSameTradeTypeCategory(TRADE_TYPES.VANILLA.CALL, TRADE_TYPES.VANILLA.PUT);
            expect(result).toBe(true);
        });

        it('should return true for turboslong and turbosshort', () => {
            const result = isSameTradeTypeCategory(TRADE_TYPES.TURBOS.LONG, TRADE_TYPES.TURBOS.SHORT);
            expect(result).toBe(true);
        });

        it('should return true for rise_fall and rise_fall_equal', () => {
            const result = isSameTradeTypeCategory(TRADE_TYPES.RISE_FALL, TRADE_TYPES.RISE_FALL_EQUAL);
            expect(result).toBe(true);
        });

        it('should return false for different categories', () => {
            const result = isSameTradeTypeCategory(TRADE_TYPES.ACCUMULATOR, TRADE_TYPES.MULTIPLIER);
            expect(result).toBe(false);
        });

        it('should return true when both types are identical', () => {
            const result = isSameTradeTypeCategory(TRADE_TYPES.ACCUMULATOR, TRADE_TYPES.ACCUMULATOR);
            expect(result).toBe(true);
        });

        it('should return false when first contract type is not found in AVAILABLE_CONTRACTS', () => {
            const result = isSameTradeTypeCategory('unknown_type', TRADE_TYPES.ACCUMULATOR);
            expect(result).toBe(false);
        });

        it('should return true for matching unknown types', () => {
            const result = isSameTradeTypeCategory('unknown_type', 'unknown_type');
            expect(result).toBe(true);
        });

        it('should handle case sensitivity', () => {
            // Trade types are case-insensitive (accumulator lowercase matches)
            const result = isSameTradeTypeCategory(TRADE_TYPES.ACCUMULATOR.toLowerCase(), TRADE_TYPES.ACCUMULATOR);
            // Should return true because TRADE_TYPES.ACCUMULATOR is already lowercase
            expect(result).toBe(true);
        });
    });

    describe('getCategoryLabel', () => {
        it('should return "Growth based" for growth_based', () => {
            const { container } = render(<>{getCategoryLabel('growth_based')}</>);
            expect(container).toHaveTextContent('Growth based');
        });

        it('should return "Directional" for directional', () => {
            const { container } = render(<>{getCategoryLabel('directional')}</>);
            expect(container).toHaveTextContent('Directional');
        });

        it('should return "Digit based" for digit_based', () => {
            const { container } = render(<>{getCategoryLabel('digit_based')}</>);
            expect(container).toHaveTextContent('Digit based');
        });

        it('should return null for unknown category', () => {
            const result = getCategoryLabel('unknown_category');
            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = getCategoryLabel('');
            expect(result).toBeNull();
        });

        it('should return React element with Localize component', () => {
            const result = getCategoryLabel('growth_based');
            expect(React.isValidElement(result)).toBe(true);
        });
    });

    describe('getAvailableContracts', () => {
        it('should return all contracts when no filter is provided', () => {
            const contracts = getAvailableContracts();
            expect(contracts).toEqual(AVAILABLE_CONTRACTS);
            expect(contracts).toHaveLength(10);
        });

        it('should return all contracts when undefined is passed', () => {
            const contracts = getAvailableContracts(undefined);
            expect(contracts).toEqual(AVAILABLE_CONTRACTS);
        });

        it('should filter by native app allowed trade types', () => {
            const allowedTypes = ['Accumulators', 'Multipliers', 'Rise/Fall'];
            const contracts = getAvailableContracts(allowedTypes);

            expect(contracts).toHaveLength(3);
            expect(contracts.map(c => c.id)).toEqual(['Rise/Fall', 'Accumulators', 'Multipliers']);
        });

        it('should return empty array when no contracts match filter', () => {
            const allowedTypes = ['NonExistent'];
            const contracts = getAvailableContracts(allowedTypes);

            expect(contracts).toEqual([]);
        });

        it('should handle empty filter array', () => {
            const contracts = getAvailableContracts([]);
            expect(contracts).toEqual([]);
        });

        it('should filter case-sensitively', () => {
            const allowedTypes = ['accumulators']; // lowercase
            const contracts = getAvailableContracts(allowedTypes);

            // Should not match 'Accumulators' (uppercase A)
            expect(contracts).toEqual([]);
        });

        it('should maintain original order when filtering', () => {
            const allowedTypes = ['Multipliers', 'Accumulators', 'Turbos']; // Different order
            const contracts = getAvailableContracts(allowedTypes);

            // Should maintain AVAILABLE_CONTRACTS order, not allowedTypes order
            expect(contracts.map(c => c.id)).toEqual(['Accumulators', 'Multipliers', 'Turbos']);
        });
    });

    describe('sortCategoriesInTradeTypeOrder', () => {
        const mockTradeTypes = [
            { value: TRADE_TYPES.ACCUMULATOR, text: 'Accumulators' },
            { value: TRADE_TYPES.MULTIPLIER, text: 'Multipliers' },
            { value: TRADE_TYPES.RISE_FALL, text: 'Rise/Fall' },
            { value: TRADE_TYPES.TURBOS.LONG, text: 'Turbos' },
        ];

        const mockCategories = [
            { id: TRADE_TYPES.TURBOS.LONG, title: 'Turbos' },
            { id: TRADE_TYPES.ACCUMULATOR, title: 'Accumulators' },
            { id: TRADE_TYPES.MULTIPLIER, title: 'Multipliers' },
            { id: TRADE_TYPES.RISE_FALL, title: 'Rise/Fall' },
        ];

        it('should sort categories based on AVAILABLE_CONTRACTS order', () => {
            const sorted = sortCategoriesInTradeTypeOrder(mockTradeTypes, mockCategories);

            // Expected order based on AVAILABLE_CONTRACTS:
            // 1. Rise/Fall (index 0)
            // 2. Accumulators (index 1)
            // 3. Multipliers (index 2)
            // 4. Turbos (index 3)
            expect(sorted.map(c => c.title)).toEqual(['Rise/Fall', 'Accumulators', 'Multipliers', 'Turbos']);
        });

        it('should filter out categories not in trade_types', () => {
            const limitedTradeTypes = [
                { value: TRADE_TYPES.ACCUMULATOR, text: 'Accumulators' },
                { value: TRADE_TYPES.MULTIPLIER, text: 'Multipliers' },
            ];

            const sorted = sortCategoriesInTradeTypeOrder(limitedTradeTypes, mockCategories);

            expect(sorted).toHaveLength(2);
            expect(sorted.map(c => c.title)).toEqual(['Accumulators', 'Multipliers']);
        });

        it('should handle empty trade_types array', () => {
            const sorted = sortCategoriesInTradeTypeOrder([], mockCategories);
            expect(sorted).toEqual([]);
        });

        it('should handle empty categories array', () => {
            const sorted = sortCategoriesInTradeTypeOrder(mockTradeTypes, []);
            expect(sorted).toEqual([]);
        });

        it('should handle categories with no matching trade types', () => {
            const unmatchedCategories = [
                { id: 'unknown1', title: 'Unknown 1' },
                { id: 'unknown2', title: 'Unknown 2' },
            ];

            const sorted = sortCategoriesInTradeTypeOrder(mockTradeTypes, unmatchedCategories);
            expect(sorted).toEqual([]);
        });

        it('should maintain stable sort for categories not in AVAILABLE_CONTRACTS', () => {
            const categoriesWithUnknown = [...mockCategories, { id: 'unknown', title: 'Unknown' }];

            const tradeTypesWithUnknown = [...mockTradeTypes, { value: 'unknown', text: 'Unknown' }];

            const sorted = sortCategoriesInTradeTypeOrder(tradeTypesWithUnknown, categoriesWithUnknown);

            // Unknown should appear last (priority 999)
            expect(sorted[sorted.length - 1].title).toBe('Unknown');
        });

        it('should handle duplicate category IDs', () => {
            const duplicateCategories = [
                { id: TRADE_TYPES.ACCUMULATOR, title: 'Accumulators 1' },
                { id: TRADE_TYPES.ACCUMULATOR, title: 'Accumulators 2' },
                { id: TRADE_TYPES.MULTIPLIER, title: 'Multipliers' },
            ];

            const sorted = sortCategoriesInTradeTypeOrder(mockTradeTypes, duplicateCategories);

            // Both duplicates should be included and sorted
            expect(sorted).toHaveLength(3);
            expect(sorted[0].title).toBe('Accumulators 1');
            expect(sorted[1].title).toBe('Accumulators 2');
        });
    });
});
