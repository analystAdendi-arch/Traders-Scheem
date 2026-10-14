import React from 'react';
import clsx from 'clsx';

import { ValueChipsProps } from './types';

const ValueChips = ({ values, selectedValue, onSelect, formatValue, className, chipClassName }: ValueChipsProps) => {
    const defaultFormatter = (value: number) => value.toString();
    const formatter = formatValue || defaultFormatter;

    return (
        <div className={clsx('value-chips', className)}>
            <div className='value-chips__grid'>
                {values.map(value => (
                    <button
                        key={value}
                        type='button'
                        className={clsx('value-chips__chip', chipClassName, {
                            'value-chips__chip--selected': value === selectedValue,
                        })}
                        onClick={() => onSelect(value)}
                        aria-label={`Select value ${formatter(value)}`}
                    >
                        {formatter(value)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ValueChips;
