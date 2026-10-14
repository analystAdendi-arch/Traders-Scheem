import React from 'react';
import { Text } from '@deriv/components';
import { routes } from '@deriv/shared';
import { BinaryLink } from '../../Routes';

const EndpointNote = () => {
    const server_url = localStorage.getItem('config.server_url');
    return server_url ? (
        <Text size='xs'>
            The server{' '}
            <Text color='link' size='xs'>
                <BinaryLink to={routes.endpoint}>endpoint</BinaryLink>{' '}
            </Text>
            is: {server_url}
        </Text>
    ) : null;
};

export { EndpointNote };
