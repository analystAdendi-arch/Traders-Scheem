import React from 'react';
import classNames from 'classnames';

import { Button, Text } from '@deriv/components';
import { StandaloneMoonRegularIcon, StandaloneSunBrightRegularIcon } from '@deriv/quill-icons';
import { observer, useStore } from '@deriv/stores';
import { localize } from '@deriv-com/translations';

const ThemeSelector = observer(() => {
    const { ui } = useStore();
    const { is_dark_mode_on, setDarkMode } = ui;

    const handleThemeChange = (isDark: boolean) => {
        setDarkMode(isDark);
    };

    return (
        <div className='flyout-selector'>
            <Button
                className={classNames('flyout-selector__option', {
                    'flyout-selector__option--active': !is_dark_mode_on,
                })}
                onClick={() => handleThemeChange(false)}
            >
                <StandaloneSunBrightRegularIcon iconSize='sm' fill='var(--color-text-primary)' />
                <Text>{localize('Light')}</Text>
            </Button>
            <Button
                className={classNames('flyout-selector__option', {
                    'flyout-selector__option--active': is_dark_mode_on,
                })}
                onClick={() => handleThemeChange(true)}
            >
                <StandaloneMoonRegularIcon iconSize='sm' fill='var(--color-text-primary)' />
                <Text>{localize('Dark')}</Text>
            </Button>
        </div>
    );
});

export default ThemeSelector;
