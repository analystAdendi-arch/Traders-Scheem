import React from 'react';
import clsx from 'clsx';

import { LabelPairedKeyboardCaptionBoldIcon } from '@deriv/quill-icons';

type TStakeModalTabsProps = {
    activeTab: 'chips' | 'input';
    onTabChange: (tab: 'chips' | 'input') => void;
};

const LightningIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M9 2L3 9H8L7 14L13 7H8L9 2Z'
            fill='currentColor'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

const StakeModalTabs = ({ activeTab, onTabChange }: TStakeModalTabsProps) => {
    return (
        <div className='stake-modal-tabs' role='tablist'>
            <button
                role='tab'
                aria-selected={activeTab === 'chips'}
                aria-label='Quick amount selection'
                className={clsx('stake-modal-tabs__tab', activeTab === 'chips' && 'stake-modal-tabs__tab--active')}
                onClick={() => onTabChange('chips')}
                type='button'
            >
                <LightningIcon />
            </button>
            <button
                role='tab'
                aria-selected={activeTab === 'input'}
                aria-label='Manual amount input'
                className={clsx('stake-modal-tabs__tab', activeTab === 'input' && 'stake-modal-tabs__tab--active')}
                onClick={() => onTabChange('input')}
                type='button'
            >
                <LabelPairedKeyboardCaptionBoldIcon />
            </button>
        </div>
    );
};

export default StakeModalTabs;
