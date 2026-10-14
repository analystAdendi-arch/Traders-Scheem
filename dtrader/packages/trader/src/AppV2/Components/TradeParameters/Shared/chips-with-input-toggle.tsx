import React from 'react';

import { ValueChips } from 'AppV2/Components/InputPopover';

interface ChipsWithInputToggleProps {
    activeTab: 'chips' | 'input';
    chipValues: number[];
    selectedValue?: number;
    onSelect: (value: number) => void;
    formatValue?: (value: number) => string;
    inputComponent: React.ReactNode;
    className?: string;
}

const ChipsWithInputToggle = ({
    activeTab,
    chipValues,
    selectedValue,
    onSelect,
    formatValue,
    inputComponent,
    className,
}: ChipsWithInputToggleProps) => {
    return activeTab === 'chips' ? (
        <ValueChips
            values={chipValues}
            selectedValue={selectedValue}
            onSelect={onSelect}
            formatValue={formatValue}
            className={className}
        />
    ) : (
        <>{inputComponent}</>
    );
};

export default ChipsWithInputToggle;
