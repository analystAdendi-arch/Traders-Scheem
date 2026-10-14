import React from 'react';
import clsx from 'clsx';

import { Localize } from '@deriv-com/translations';

export interface VerticalTabItem {
    value: string;
    label: string;
}

interface VerticalTabSelectorProps {
    items: VerticalTabItem[];
    selectedValue: string;
    onSelect: (value: string) => void;
    className?: string;
}

const VerticalTabSelector: React.FC<VerticalTabSelectorProps> = ({ items, selectedValue, onSelect, className }) => {
    const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
        let nextIndex = currentIndex;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                break;
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                event.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                nextIndex = items.length - 1;
                break;
            default:
                return;
        }

        onSelect(items[nextIndex].value);
    };

    return (
        <div className={clsx('vertical-tab-selector', className)} role='tablist' aria-orientation='vertical'>
            {items.map((item, index) => (
                <button
                    key={item.value}
                    className={clsx('vertical-tab-selector__item', {
                        'vertical-tab-selector__item--selected': selectedValue === item.value,
                    })}
                    onClick={() => onSelect(item.value)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    type='button'
                    role='tab'
                    aria-selected={selectedValue === item.value}
                    tabIndex={selectedValue === item.value ? 0 : -1}
                >
                    <Localize i18n_default_text={item.label} />
                </button>
            ))}
        </div>
    );
};

export default VerticalTabSelector;
