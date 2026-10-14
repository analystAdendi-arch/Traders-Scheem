import React from 'react';

import { getBrandHomeUrl, openExternalUrl } from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import Button from '../button';
import Div100vhContainer from '../div100vh-container';
import TriangleWarningIcon from '../error-modal/triangle-warning-icon';
import Text from '../text';

type TFullscreenError = {
    error_message?: string;
};

const FullscreenError = ({ error_message }: TFullscreenError) => {
    const handleButtonClick = () => {
        if (error_message) {
            window.location.reload();
        } else {
            openExternalUrl(getBrandHomeUrl());
        }
    };

    const buttonLabel = error_message ? (
        <Localize i18n_default_text='Refresh' />
    ) : (
        <Localize i18n_default_text='Back to Home' />
    );

    return (
        <Div100vhContainer className='fullscreen-error'>
            <div className='fullscreen-error__content'>
                <TriangleWarningIcon width={200} height={200} />
                <Text
                    id='fullscreen-error-title'
                    className='fullscreen-error__title'
                    as='h2'
                    line_height='s'
                    align='center'
                    weight='bold'
                    size='l'
                    color='white'
                >
                    <Localize i18n_default_text='An unexpected error occurred' />
                </Text>
                <Text
                    id='fullscreen-error-description'
                    className='fullscreen-error__description'
                    as='p'
                    size='s'
                    line_height='m'
                    align='center'
                    color='white'
                >
                    {error_message || (
                        <Localize i18n_default_text="We're sorry for the disruption. Refreshing the page may help." />
                    )}
                </Text>
            </div>
            <div className='fullscreen-error__button-container'>
                <Button onClick={handleButtonClick} has_effect primary large autoFocus>
                    {buttonLabel}
                </Button>
            </div>
        </Div100vhContainer>
    );
};

export default FullscreenError;
