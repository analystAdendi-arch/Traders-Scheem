import React, { useMemo } from 'react';

import { localize } from '@deriv-com/translations';

import type { VerticalTabItem } from '../../InputPopover/vertical-tab-selector';
import VerticalTabSelector from '../../InputPopover/vertical-tab-selector';

interface DurationUnitSelectorProps {
    selectedUnit: string;
    onSelectUnit: (unit: string) => void;
    availableUnits?: string[];
    className?: string;
}

const DurationUnitSelector: React.FC<DurationUnitSelectorProps> = ({
    selectedUnit,
    onSelectUnit,
    availableUnits,
    className,
}) => {
    const ALL_DURATION_UNITS: VerticalTabItem[] = useMemo(
        () => [
            { value: 't', label: localize('Ticks') },
            { value: 's', label: localize('Seconds') },
            { value: 'm', label: localize('Minutes') },
            { value: 'h', label: localize('Hours') },
            { value: 'end_time', label: localize('End time') },
        ],
        []
    );

    const DURATION_UNITS = useMemo(() => {
        if (!availableUnits || availableUnits.length === 0) {
            return ALL_DURATION_UNITS;
        }
        return ALL_DURATION_UNITS.filter(unit => availableUnits.includes(unit.value));
    }, [availableUnits, ALL_DURATION_UNITS]);

    return (
        <VerticalTabSelector
            items={DURATION_UNITS}
            selectedValue={selectedUnit}
            onSelect={onSelectUnit}
            className={className}
        />
    );
};

export default DurationUnitSelector;
