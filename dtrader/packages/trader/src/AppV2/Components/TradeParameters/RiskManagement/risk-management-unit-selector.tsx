import React, { useMemo } from 'react';

import type { VerticalTabItem } from '../../InputPopover/vertical-tab-selector';
import VerticalTabSelector from '../../InputPopover/vertical-tab-selector';

type TRiskManagementUnitSelectorProps = {
    selectedUnit: string;
    onSelectUnit: (unit: string) => void;
    shouldShowDealCancellation?: boolean;
};

const RiskManagementUnitSelector: React.FC<TRiskManagementUnitSelectorProps> = ({
    selectedUnit,
    onSelectUnit,
    shouldShowDealCancellation = false,
}) => {
    const RISK_MANAGEMENT_UNITS: VerticalTabItem[] = useMemo(
        () => [
            { value: 'tp_sl', label: 'TP & SL' },
            { value: 'dc', label: 'DC' },
        ],
        []
    );

    const units = shouldShowDealCancellation
        ? RISK_MANAGEMENT_UNITS
        : RISK_MANAGEMENT_UNITS.filter(u => u.value === 'tp_sl');

    return <VerticalTabSelector items={units} selectedValue={selectedUnit} onSelect={onSelectUnit} />;
};

export default RiskManagementUnitSelector;
