import { localize } from '@deriv-com/translations';

import { isAccumulatorContract, isMultiplierContract, isTurbosContract, isVanillaContract } from './contract';

/**
 * Returns the localized tooltip message for the entry spot based on contract type.
 * This function provides a centralized logic for determining which tooltip message
 * should be displayed for the entry spot in contract details.
 *
 * @param contract_type - The type of contract (e.g., 'CALL', 'PUT', 'HIGHER', 'LOWER')
 * @returns The localized tooltip message string or undefined if no tooltip should be shown
 */
export const getEntrySpotTooltipMessage = (contract_type: string | undefined): string | undefined => {
    if (!contract_type) return undefined;

    const isVanillaOrTurbo = isVanillaContract(contract_type) || isTurbosContract(contract_type);
    if (isVanillaOrTurbo) {
        return localize(
            'The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.'
        );
    }

    const isFirstTickType =
        isAccumulatorContract(contract_type) ||
        isMultiplierContract(contract_type) ||
        ['CALL', 'PUT', 'CALLE', 'PUTE', 'MULTUP', 'MULTDOWN', 'HIGHER', 'LOWER', 'ONETOUCH', 'NOTOUCH'].includes(
            contract_type
        );

    if (isFirstTickType) {
        return localize('The first tick after the start time.');
    }

    return undefined;
};
