import React, { lazy, Suspense } from 'react';

import { SmartFallbackLoader } from '@deriv/components';
import { useDevice } from '@deriv-com/ui';

const V1Contract = lazy(() => import(/* webpackChunkName: "trader-contract-v1" */ 'Modules/Contract'));
const V2ContractDetails = lazy(
    () => import(/* webpackChunkName: "trader-contract-details" */ 'AppV2/Containers/ContractDetails')
);

const ContractDetailsSwitch = () => {
    const { isMobile } = useDevice();

    return <Suspense fallback={<SmartFallbackLoader />}>{isMobile ? <V2ContractDetails /> : <V1Contract />}</Suspense>;
};

export default ContractDetailsSwitch;
