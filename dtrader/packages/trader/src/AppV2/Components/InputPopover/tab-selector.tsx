import React from 'react';

import { SegmentedControlSingleChoice } from '@deriv-com/quill-ui';

import { KeyboardIcon, LightningIcon } from './icons';

type TTabSelectorProps = {
    activeTab: 'chips' | 'input';
    onTabChange: (tab: 'chips' | 'input') => void;
};

export const TabSelector: React.FC<TTabSelectorProps> = ({ activeTab, onTabChange }) => {
    const tab_options = [
        { label: <LightningIcon />, value: 'chips' },
        { label: <KeyboardIcon />, value: 'input' },
    ];

    const handleTabChange = (index: number) => {
        onTabChange(index === 0 ? 'chips' : 'input');
    };

    return (
        <SegmentedControlSingleChoice
            hasContainerWidth
            onChange={handleTabChange}
            options={tab_options}
            selectedItemIndex={activeTab === 'chips' ? 0 : 1}
            size='sm'
        />
    );
};
