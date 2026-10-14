import { useMobileBridge } from '@deriv/api';

/**
 * Returns undefined when not in a native mobile app context, indicating no trade type filtering.
 * White-label operators can extend this hook to restrict trade types for their native app.
 */
const useNativeAppAllowedTradeTypes = (): string[] | undefined => {
    const { isBridgeAvailable } = useMobileBridge();
    if (!isBridgeAvailable) return undefined;
    return undefined;
};

export default useNativeAppAllowedTradeTypes;
