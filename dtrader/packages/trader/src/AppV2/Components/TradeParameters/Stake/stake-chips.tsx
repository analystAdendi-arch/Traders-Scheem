import React from 'react';
import clsx from 'clsx';

import { getCurrencyDisplayCode } from '@deriv/shared';

import { getStakePresets } from 'AppV2/Config/trade-parameter-presets';
import { mapContractTypeToStakePresetKey } from 'AppV2/Utils/trade-params-preset-utils';

type TStakeChipsProps = {
    currency: string;
    onChipSelect: (amount: number) => void;
    selected_amount?: number;
    contract_type: string;
};

const StakeChips = ({ currency, onChipSelect, selected_amount, contract_type }: TStakeChipsProps) => {
    // Map contract_type to the preset key and get the appropriate stake presets
    const presetKey = mapContractTypeToStakePresetKey(contract_type);
    const chipValues = presetKey ? getStakePresets(presetKey) : undefined;

    // Fallback to a default set if no presets found (backward compatibility)
    const defaultChipValues = [1, 5, 10, 20, 50, 100];
    const values = chipValues || defaultChipValues;

    return (
        <div className='stake-chips'>
            <div className='stake-chips__grid'>
                {values.map(value => (
                    <button
                        key={value}
                        type='button'
                        className={clsx('stake-chips__chip', {
                            'stake-chips__chip--selected': value === selected_amount,
                        })}
                        onClick={() => onChipSelect(value)}
                        aria-label={`Set stake to ${value} ${getCurrencyDisplayCode(currency)}`}
                    >
                        {value} {getCurrencyDisplayCode(currency)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StakeChips;
