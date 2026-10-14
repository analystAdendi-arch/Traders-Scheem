import React, { useMemo } from 'react';

import { localize } from '@deriv-com/translations';

import type { VerticalTabItem } from '../../InputPopover/vertical-tab-selector';
import VerticalTabSelector from '../../InputPopover/vertical-tab-selector';

interface BarrierTypeSelectorProps {
    selectedType: string;
    onSelectType: (type: string) => void;
    className?: string;
    showAllTypes?: boolean;
}

const BarrierTypeSelector: React.FC<BarrierTypeSelectorProps> = ({
    selectedType,
    onSelectType,
    className,
    showAllTypes = true,
}) => {
    const BARRIER_TYPES: VerticalTabItem[] = useMemo(
        () =>
            showAllTypes
                ? [
                      { value: 'above_spot', label: localize('Above spot') },
                      { value: 'below_spot', label: localize('Below spot') },
                      { value: 'fixed_barrier', label: localize('Fixed barrier') },
                  ]
                : [{ value: 'fixed_barrier', label: localize('Fixed barrier') }],
        [showAllTypes]
    );

    return (
        <VerticalTabSelector
            items={BARRIER_TYPES}
            selectedValue={selectedType}
            onSelect={onSelectType}
            className={className}
        />
    );
};

export default BarrierTypeSelector;
