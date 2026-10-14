// [AI]
import React from 'react';

import { TActiveSymbolsResponse } from '@deriv/api';
import {
    LegacyAccumulatorIcon,
    LegacyTradeTypeAllIcon,
    LegacyTradeTypeMultipliersIcon,
    LegacyTradeTypeOptionsIcon,
    LegacyTurboIcon,
} from '@deriv/quill-icons';
import { unsupported_contract_types_list } from '@deriv/shared';

import { TContractCategory, TContractType, TList } from 'AppV2/Types/contract-type';

type ActiveSymbols = NonNullable<TActiveSymbolsResponse['active_symbols']>;

type TContractTypesList = {
    [key: string]: {
        name: string;
        categories: DeepRequired<TContractType[]>;
    };
};

type TItem = {
    value: string;
};

export const isMajorPairsSymbol = (checked_symbol: string, active_symbols: ActiveSymbols) =>
    active_symbols.some(
        ({ submarket, underlying_symbol }) =>
            /major_pairs/i.test(submarket || '') && checked_symbol === underlying_symbol
    );

export const ordered_trade_categories = [
    'Accumulators',
    'Vanillas',
    'Turbos',
    'Multipliers',
    'Ups & Downs',
    'Touch & No Touch',
    'Digits',
];

export const getContractTypeCategoryIcons = () => ({
    All: <LegacyTradeTypeAllIcon />,
    Accumulators: <LegacyAccumulatorIcon />,
    Options: <LegacyTradeTypeOptionsIcon />,
    Multipliers: <LegacyTradeTypeMultipliersIcon />,
    Turbos: <LegacyTurboIcon />,
});

/**
 * Returns a list of contracts in the following format:
 * {
 *      label: '', // contract category label
 *      contract_types: [], // list of contract types
 *      icon: '', // contract categoty icon
 * }
 * @param {object} contract_types_list  - list of all contracts
 * @param {array}  unsupported_list - list of unsupported contract types
 * @param {array}  nativeAppAllowedTradeTypes - optional list of allowed trade types for native mobile app
 */

export const getAvailableContractTypes = (
    contract_types_list: TContractTypesList,
    unsupported_list: typeof unsupported_contract_types_list,
    nativeAppAllowedTradeTypes?: string[]
) => {
    const filtered_contract_types = Object.keys(contract_types_list)
        .map(key => {
            const contract_types = contract_types_list[key].categories;
            const contract_name = contract_types_list[key].name;
            const available_contract_types = contract_types.filter(type =>
                type.value &&
                // TODO: remove this check once all contract types are supported
                !unsupported_list.includes(type.value as (typeof unsupported_contract_types_list)[number])
                    ? type
                    : undefined
            );

            if (available_contract_types.length) {
                return {
                    key,
                    label: contract_name,
                    contract_types: available_contract_types,
                    component: null,
                };
            }
            return undefined;
        })
        .filter(Boolean) as {
        key: string;
        label: string;
        contract_types: TContractType[];
        icon: React.ReactElement;
        component: JSX.Element | null;
    }[];

    if (nativeAppAllowedTradeTypes) {
        return filtered_contract_types.filter(category => nativeAppAllowedTradeTypes.includes(category.label));
    }

    return filtered_contract_types;
};

export const findContractCategory = (list: Partial<TList[]>, item: TItem) =>
    list?.find(list_item => list_item?.contract_types?.some(i => i.value.includes(item.value))) ||
    ({} as TContractCategory);

export const getContractCategoryKey = (list: TList[], item: TItem) => findContractCategory(list, item)?.key;

export const getContractTypes = (list: TList[], item: TItem) => findContractCategory(list, item)?.contract_types;

export const getCategoriesSortedByKey = (list: TContractCategory[] = []) =>
    [...list].sort((a, b) => ordered_trade_categories.indexOf(a.key) - ordered_trade_categories.indexOf(b.key));
// [/AI]
