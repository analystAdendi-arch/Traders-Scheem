import {
    isAccumulatorContract,
    isHigherLowerContract,
    isMultiplierContract,
    isRiseFallContract,
    isTouchContract,
    isTurbosContract,
    isVanillaContract,
} from '@deriv/shared';

/**
 * Returns the appropriate entry spot tooltip text based on the contract type
 * @param contract_type - The contract type to determine the tooltip text for
 * @returns The localized tooltip text explaining when the entry spot is determined
 */
export const getEntrySpotTooltipText = (contract_type?: string): string => {
    const contract_type_value = contract_type || '';

    // For Accumulator, Rise/Fall, Higher/Lower, Touch/NoTouch, Multiplier
    if (
        isAccumulatorContract(contract_type_value) ||
        isRiseFallContract(contract_type_value) ||
        isHigherLowerContract(contract_type_value) ||
        isTouchContract(contract_type_value) ||
        isMultiplierContract(contract_type_value)
    ) {
        return 'The first tick after the start time.';
    }

    // For Vanillas and Turbos
    if (isVanillaContract(contract_type_value) || isTurbosContract(contract_type_value)) {
        return 'The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.';
    }

    // Default case
    return 'The first tick after the start time.';
};
