import React from 'react';

import type { TCoreStores } from '@deriv/stores/types';

import Routes from 'Containers/routes';

import ReportsProviders from './reports-providers';

import 'Sass/app.scss';

type TAppProps = {
    passthrough: {
        root_store: TCoreStores;
    };
};

const TradeModalsLazy = React.lazy(
    () => import(/* webpackChunkName: "trade-modals", webpackPrefetch: true */ './Components/Modals')
);

const TradeModals = () => (
    <React.Suspense fallback={null}>
        <TradeModalsLazy />
    </React.Suspense>
);

const App = ({ passthrough }: TAppProps) => {
    return (
        <ReportsProviders store={passthrough.root_store}>
            <Routes />
            <TradeModals />
        </ReportsProviders>
    );
};

export default App;
