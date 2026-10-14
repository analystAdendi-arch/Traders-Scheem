import React from 'react';
import { Step } from 'react-joyride';

import { Localize } from '@deriv-com/translations';

const RETURNING_DESKTOP_STEPS: Step[] = [
    {
        content: <Localize i18n_default_text='Now on the left for quicker access to your tools.' />,
        offset: 4,
        spotlightPadding: 4,
        target: '[data-testid="dt_sidebar"]',
        title: <Localize i18n_default_text='Navigation update (1/4)' />,
        placement: 'right' as Step['placement'],
    },
    {
        content: (
            <Localize i18n_default_text='You can see all trade types from the grid icon, or drag left and right to explore.' />
        ),
        offset: 0,
        spotlightPadding: 4,
        target: '.trade-types-selector__button',
        title: <Localize i18n_default_text='Explore trade types (2/4)' />,
        placement: 'bottom-start' as Step['placement'],
        disableScrollParentFix: true,
    },
    {
        content: <Localize i18n_default_text='All trade settings are now in one place.' />,
        offset: 4,
        spotlightPadding: 0,
        target: '.trade-params__options-wrapper',
        title: <Localize i18n_default_text='Set up your trade (3/4)' />,
        placement: 'left' as Step['placement'],
        disableScrollParentFix: true,
        floaterProps: {
            disableFlip: true,
        },
    },
    {
        content: (
            <Localize i18n_default_text="We've combined trade actions into one button for a simpler experience." />
        ),
        offset: 4,
        spotlightPadding: 4,
        target: '.purchase-button__wrapper',
        title: <Localize i18n_default_text='Open your trade (4/4)' />,
        placement: 'left' as Step['placement'],
        disableScrollParentFix: true,
        floaterProps: {
            disableFlip: true,
        },
    },
];

export default RETURNING_DESKTOP_STEPS;
