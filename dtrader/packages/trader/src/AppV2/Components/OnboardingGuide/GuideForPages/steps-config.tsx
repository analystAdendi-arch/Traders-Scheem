import React from 'react';
import { Step } from 'react-joyride';

import { Localize } from '@deriv-com/translations';

const STEPS = [
    {
        content: <Localize i18n_default_text='Scroll left or right to explore trade types.' />,
        offset: 0,
        spotlightPadding: 4,
        target: '.trade__trade-types',
        title: <Localize i18n_default_text='Explore trade types (1/5)' />,
    },
    {
        content: <Localize i18n_default_text='View available markets here.' />,
        offset: 4,
        placement: 'bottom-start' as Step['placement'],
        spotlightPadding: 8,
        target: '.market-selector__container',
        title: <Localize i18n_default_text='Choose a market (2/5)' />,
    },
    {
        content: <Localize i18n_default_text='Track market trends with our interactive charts.' />,
        spotlightPadding: 8,
        offset: 4,
        target: '.trade__chart-tooltip',
        title: <Localize i18n_default_text='Analyse with charts (3/5)' />,
        placement: 'bottom' as Step['placement'],
    },
    {
        content: <Localize i18n_default_text='Scroll or swipe to adjust parameters, then place your trade.' />,
        offset: -4,
        spotlightPadding: 0,
        target: '.trade-params__container',
        title: <Localize i18n_default_text='Open your trade (4/5)' />,
    },
    {
        content: <Localize i18n_default_text='View your positions here.' />,
        offset: -4,
        target: '.user-guide__anchor',
        title: <Localize i18n_default_text='Check your positions (5/5)' />,
    },
];

export default STEPS;
