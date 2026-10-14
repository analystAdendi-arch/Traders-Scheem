import { useMemo } from 'react';

import { getAvailableContracts } from 'AppV2/Utils/trade-types-utils';

import useNativeAppAllowedTradeTypes from './useNativeAppAllowedTradeTypes';

/**
 * Hook that provides available contracts list filtered by native app allowed trade types.
 * Returns the full AVAILABLE_CONTRACTS list for web, and filtered list for native mobile apps.
 */
const useAvailableContracts = () => {
    const nativeAppAllowedTradeTypes = useNativeAppAllowedTradeTypes();

    const available_contracts = useMemo(() => {
        return getAvailableContracts(nativeAppAllowedTradeTypes);
    }, [nativeAppAllowedTradeTypes]);

    return available_contracts;
};

export default useAvailableContracts;
