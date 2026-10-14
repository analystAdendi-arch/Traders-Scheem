import React from 'react';

import {
    getContractTypePosition,
    getSupportedContracts,
    TRADE_TYPES,
    unsupported_contract_types_list,
} from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import { getAvailableContractTypes, getCategoriesSortedByKey } from 'AppV2/Utils/trading-contract-type-helpers';
import { useTraderStore } from 'Stores/useTraderStores';

import { getTradeTypeTabsList } from './trade-params-utils';

type TContractType = {
    text?: string;
    value: string;
};

type TCategories = {
    id: string;
    title: string;
    icon?: React.ReactNode;
};

export type TAvailableContract = {
    tradeType: string;
    id: string;
    for: string[];
    is_popular?: boolean;
    show_fire_icon?: boolean;
    category: 'growth_based' | 'directional' | 'digit_based';
    tooltip?: React.ReactNode;
};

const getSortedIndex = (type: string) =>
    getContractTypePosition(type as keyof ReturnType<typeof getSupportedContracts>) === 'bottom' ? 1 : 0;

export const CONTRACT_LIST = {
    ACCUMULATORS: 'Accumulators',
    VANILLAS: 'Vanillas',
    TURBOS: 'Turbos',
    MULTIPLIERS: 'Multipliers',
    RISE_FALL: 'Rise/Fall',
    HIGHER_LOWER: 'Higher/Lower',
    TOUCH_NO_TOUCH: 'Touch/No Touch',
    MATCHES_DIFFERS: 'Matches/Differs',
    EVEN_ODD: 'Even/Odd',
    OVER_UNDER: 'Over/Under',
};

export const AVAILABLE_CONTRACTS: TAvailableContract[] = [
    // Directional
    {
        tradeType: 'Rise/Fall',
        id: CONTRACT_LIST.RISE_FALL,
        for: [TRADE_TYPES.RISE_FALL, TRADE_TYPES.RISE_FALL_EQUAL],
        is_popular: true,
        show_fire_icon: true,
        category: 'directional',
        tooltip: <Localize i18n_default_text='Earn when exit price is higher or lower than entry price.' />,
    },
    // Growth Based
    {
        tradeType: 'Accumulators',
        id: CONTRACT_LIST.ACCUMULATORS,
        for: [TRADE_TYPES.ACCUMULATOR],
        is_popular: true,
        show_fire_icon: true,
        category: 'growth_based',
        tooltip: <Localize i18n_default_text='Grow your stake exponentially while price stays in range.' />,
    },
    // Growth Based
    {
        tradeType: 'Multipliers',
        id: CONTRACT_LIST.MULTIPLIERS,
        for: [TRADE_TYPES.MULTIPLIER],
        is_popular: true,
        category: 'growth_based',
        tooltip: <Localize i18n_default_text='Leveraged trading with risk controls.' />,
    },
    {
        tradeType: 'Turbos',
        id: CONTRACT_LIST.TURBOS,
        for: [TRADE_TYPES.TURBOS.LONG, TRADE_TYPES.TURBOS.SHORT],
        category: 'growth_based',
        tooltip: <Localize i18n_default_text='Directional trade with barrier knockout.' />,
    },
    {
        tradeType: 'Vanillas',
        id: CONTRACT_LIST.VANILLAS,
        for: [TRADE_TYPES.VANILLA.CALL, TRADE_TYPES.VANILLA.PUT],
        category: 'growth_based',
        tooltip: <Localize i18n_default_text='Earn if price ends above or below strike price.' />,
    },
    // Directional
    {
        tradeType: 'Higher/Lower',
        id: CONTRACT_LIST.HIGHER_LOWER,
        for: [TRADE_TYPES.HIGH_LOW],
        category: 'directional',
        tooltip: <Localize i18n_default_text='Earn when exit price is above or below barrier.' />,
    },
    {
        tradeType: 'Touch/No Touch',
        id: CONTRACT_LIST.TOUCH_NO_TOUCH,
        for: [TRADE_TYPES.TOUCH],
        category: 'directional',
        tooltip: <Localize i18n_default_text='Earn if price touches or avoids your barrier before expiry.' />,
    },
    // Digit Based
    {
        tradeType: 'Matches/Differs',
        id: CONTRACT_LIST.MATCHES_DIFFERS,
        for: [TRADE_TYPES.MATCH_DIFF],
        is_popular: true,
        category: 'digit_based',
        tooltip: <Localize i18n_default_text='Earn when final digit matches or differs.' />,
    },
    {
        tradeType: 'Over/Under',
        id: CONTRACT_LIST.OVER_UNDER,
        for: [TRADE_TYPES.OVER_UNDER],
        is_popular: true,
        category: 'digit_based',
        tooltip: <Localize i18n_default_text='Earn when final digit is over or under your number.' />,
    },
    {
        tradeType: 'Even/Odd',
        id: CONTRACT_LIST.EVEN_ODD,
        for: [TRADE_TYPES.EVEN_ODD],
        category: 'digit_based',
        tooltip: <Localize i18n_default_text='Earn when final digit is even or odd.' />,
    },
];

/**
 * Gets the priority order for a trade type value based on AVAILABLE_CONTRACTS array order.
 * Lower numbers = higher priority (appear first).
 * @param value - The trade type value to look up
 * @returns The priority index, or 999 if not found (will appear last)
 */
const getTradeTypePriority = (value: string): number => {
    const index = AVAILABLE_CONTRACTS.findIndex(contract => contract.for.includes(value));
    return index === -1 ? 999 : index;
};

/**
 * Groups trade types by their category
 * @param contracts - Array of available contracts to group
 * @returns Object with categories as keys and arrays of contracts as values
 */
export const groupTradeTypesByCategory = (contracts: TAvailableContract[]) => {
    return contracts.reduce(
        (acc, contract) => {
            const category = contract.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(contract);
            return acc;
        },
        {} as Record<string, TAvailableContract[]>
    );
};

/**
 * Returns the localized label for a trade type category
 * @param category - Category key ('growth_based', 'directional', or 'digit_based')
 * @returns JSX element with localized label or null if category is unknown
 */
export const getCategoryLabel = (category: string): React.ReactNode => {
    switch (category) {
        case 'growth_based':
            return <Localize i18n_default_text='Growth based' />;
        case 'directional':
            return <Localize i18n_default_text='Directional' />;
        case 'digit_based':
            return <Localize i18n_default_text='Digit based' />;
        default:
            return null;
    }
};

/**
 * Returns the available contracts list, filtered by native app allowed trade types if provided.
 * @param nativeAppAllowedTradeTypes - Optional array of allowed trade type names from remote config
 * @returns Filtered array of available contracts
 */
export const getAvailableContracts = (nativeAppAllowedTradeTypes?: string[]) => {
    if (!nativeAppAllowedTradeTypes) return AVAILABLE_CONTRACTS;
    return AVAILABLE_CONTRACTS.filter(contract => nativeAppAllowedTradeTypes.includes(contract.id));
};

export const getTradeTypesList = (
    contract_types_list: ReturnType<typeof useTraderStore>['contract_types_list'],
    nativeAppAllowedTradeTypes?: string[]
) => {
    const available_trade_types = getAvailableContractTypes(
        contract_types_list as unknown as Parameters<typeof getAvailableContractTypes>[0],
        unsupported_contract_types_list
    );

    let filtered_types = Object.values(getCategoriesSortedByKey(available_trade_types))
        .map(({ contract_types }) =>
            contract_types[0].value.startsWith('vanilla')
                ? contract_types.map(type => ({ ...type, text: 'Vanillas' }))
                : contract_types
        )
        .flat()
        .filter(
            ({ value }) =>
                ![TRADE_TYPES.VANILLA.PUT, TRADE_TYPES.TURBOS.SHORT, TRADE_TYPES.RISE_FALL_EQUAL].includes(value)
        );

    // Filter for native mobile app - only show allowed trade types from remote config
    if (nativeAppAllowedTradeTypes) {
        filtered_types = filtered_types.filter(({ text }) => text && nativeAppAllowedTradeTypes.includes(text));
    }

    // Sort by manual order defined in AVAILABLE_CONTRACTS
    return filtered_types.sort((a, b) => getTradeTypePriority(a.value) - getTradeTypePriority(b.value));
};

/* Gets the array of sorted contract types that are used to display purchased buttons and other info based on a selected trade type tab if applicable. */
export const getDisplayedContractTypes = (
    trade_types: ReturnType<typeof useTraderStore>['trade_types'],
    contract_type: string,
    trade_type_tab: string
) => {
    const trade_type_tabs = getTradeTypeTabsList(contract_type);
    const available_types = Object.keys(trade_types);

    // If there are no trade type tabs, return all available types
    if (!trade_type_tabs.length) {
        return available_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
    }

    // If trade_types is empty but we have tabs, use contract_type directly
    // This ensures immediate rendering with the correct button type
    if (available_types.length === 0 && trade_type_tabs.length > 0) {
        // Return only the current contract_type, not all tab types
        return [contract_type];
    }

    // If trade_type_tab is set, filter by it
    if (trade_type_tab) {
        const filtered_types = available_types.filter(type => type === trade_type_tab);
        // If filtering results in empty array but we have a valid trade_type_tab, return it
        if (filtered_types.length === 0 && trade_type_tabs.some(tab => tab.contract_type === trade_type_tab)) {
            return [trade_type_tab];
        }
        return filtered_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
    }

    // If trade_type_tab is not set but there are tabs, return all available types
    // This ensures buttons are displayed even when trade_type_tab hasn't been initialized yet
    return available_types.sort((a, b) => getSortedIndex(a) - getSortedIndex(b));
};

export const sortCategoriesInTradeTypeOrder = (trade_types: TContractType[], categories: TCategories[]) => {
    return categories
        .filter(category => trade_types.some(type => type.value === category.id))
        .sort((a, b) => getTradeTypePriority(a.id) - getTradeTypePriority(b.id));
};

/**
 * Checks if two contract types belong to the same trade type category.
 * For example, vanillalongcall and vanillalongput belong to the same "Vanillas" category,
 * turboslong and turbosshort belong to the same "Turbos" category.
 *
 * @param contract_type_1 - First contract type to compare
 * @param contract_type_2 - Second contract type to compare
 * @returns true if both contract types belong to the same category, false otherwise
 */
export const isSameTradeTypeCategory = (contract_type_1: string, contract_type_2: string): boolean => {
    // Find the category that contains the first contract type
    const category = AVAILABLE_CONTRACTS.find(contract => contract.for.includes(contract_type_1));

    // Check if the second contract type is also in the same category
    return category ? category.for.includes(contract_type_2) : contract_type_1 === contract_type_2;
};
