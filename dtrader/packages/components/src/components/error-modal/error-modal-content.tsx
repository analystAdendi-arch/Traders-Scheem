import React from 'react';

import { Localize } from '@deriv-com/translations';

import Button from '../button';
import Text from '../text';

import TriangleWarningIcon from './triangle-warning-icon';

type TErrorModalContent = {
    error_message?: string;
};

const ErrorModalContent = ({ error_message }: TErrorModalContent) => {
    return (
        <div className='error-modal'>
            <TriangleWarningIcon height={120} width={120} />
            <Text className='error-modal__content' as='p' size='xs' line_height='xxl' align='center'>
                {error_message}
            </Text>
            <Button onClick={() => location.reload()} has_effect primary large>
                <Localize i18n_default_text='Refresh' />
            </Button>
        </div>
    );
};

export default ErrorModalContent;
