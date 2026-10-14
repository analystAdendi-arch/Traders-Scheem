import React from 'react';

import { ReportsStoreProvider } from '@deriv/reports/src/Stores/useReportsStores';
import type { TCoreStores } from '@deriv/stores/types';
import { NotificationsProvider, SnackbarProvider } from '@deriv-com/quill-ui';

import initStore from 'Stores/init-store';
import ModulesProvider from 'Stores/Providers/modules-providers';
import type { TWebSocket } from 'Types';

import TraderProviders from '../trader-providers';

import ServicesErrorSnackbar from './Components/ServicesErrorSnackbar';
import Notifications from './Containers/Notifications';
import AppShell from './Containers/AppShell/app-shell';

import 'Sass/app.scss';

type Apptypes = {
    passthrough: {
        root_store: TCoreStores;
        WS: TWebSocket;
    };
};

const App = ({ passthrough }: Apptypes) => {
    const root_store = initStore(passthrough.root_store, passthrough.WS);
    const analyticsCalledRef = React.useRef(false);

    React.useEffect(() => {
        return () => root_store.ui.setPromptHandler(false);
    }, [root_store]);

    React.useEffect(() => {
        // Prevent duplicate analytics calls if component remounts
        if (analyticsCalledRef.current) {
            return;
        }

        analyticsCalledRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useLayoutEffect(() => {
        const head = document.head;
        const links = head.querySelectorAll('link[rel="stylesheet"]');
        const is_last_dtrader = (links[links.length - 1] as HTMLLinkElement)?.href?.includes('/trader');
        const dtrader_links = [...links].filter(link => (link as HTMLLinkElement)?.href?.includes('/trader'));

        if (is_last_dtrader) return;

        const dtrader_links_clone = dtrader_links?.map(link => link?.cloneNode(true));
        dtrader_links_clone.forEach(link => head.appendChild(link));

        return () => dtrader_links_clone?.forEach(link => head.removeChild(link));
    }, []);

    return (
        <TraderProviders store={root_store}>
            <ReportsStoreProvider>
                <ModulesProvider store={root_store}>
                    <NotificationsProvider>
                        <SnackbarProvider>
                            <Notifications />
                            <AppShell />
                            <ServicesErrorSnackbar />
                        </SnackbarProvider>
                    </NotificationsProvider>
                </ModulesProvider>
            </ReportsStoreProvider>
        </TraderProviders>
    );
};

export default App;
