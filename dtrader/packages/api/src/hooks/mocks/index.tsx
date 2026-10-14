import React from 'react';
import APIProvider from '../../APIProvider';
import { StoreProvider } from '@deriv/stores';
import { TStores } from '@deriv/stores/types';

export const withMockAPIProvider = (mock?: TStores, has_p2p_settings?: boolean) => {
    if (mock) {
        if (has_p2p_settings) {
            const MockAPIProviderWithP2PSettings = ({ children }: { children: JSX.Element }) => (
                <APIProvider>
                    <StoreProvider store={mock}>{children}</StoreProvider>
                </APIProvider>
            );
            return MockAPIProviderWithP2PSettings;
        }
        const MockAPIProviderWithStore = ({ children }: { children: JSX.Element }) => (
            <APIProvider>
                <StoreProvider store={mock}>{children}</StoreProvider>
            </APIProvider>
        );
        return MockAPIProviderWithStore;
    }

    const MockAPIProvider = ({ children }: { children: JSX.Element }) => <APIProvider>{children}</APIProvider>;
    return MockAPIProvider;
};
