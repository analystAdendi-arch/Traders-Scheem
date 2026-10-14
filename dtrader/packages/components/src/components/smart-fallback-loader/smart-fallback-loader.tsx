import React from 'react';

import { getPositionsV2TabIndexFromURL, routes } from '@deriv/shared';

import Loading from '../loading';

/**
 * Smart fallback loader that shows appropriate skeleton based on current route
 * Used in React.Suspense fallback to provide context-aware loading states
 */
const SmartFallbackLoader: React.FC = () => {
    const pathname = window.location.pathname;
    const is_contract_details = pathname.startsWith('/contract/');
    const is_positions = pathname === routes.trader_positions;
    const is_closed_tab = getPositionsV2TabIndexFromURL() === 1;

    // Show DTraderV2 skeleton for trader routes, generic loader for others
    const is_trader_route = pathname === '/' || is_contract_details || is_positions;

    if (is_trader_route) {
        return (
            <Loading.DTraderV2
                initial_app_loading
                is_contract_details={is_contract_details}
                is_positions={is_positions}
                is_closed_tab={is_closed_tab}
            />
        );
    }

    return <Loading />;
};

export default SmartFallbackLoader;
