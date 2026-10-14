import React from 'react';
import { observer } from 'mobx-react-lite';

import { useTraderStore } from 'Stores/useTraderStores';

import { TTradeParametersProps } from '../trade-parameters';

import StakeDesktop from './stake-desktop';
import StakeMobile from './stake-mobile';

const Stake = observer((props: TTradeParametersProps) => {
    const { root_store } = useTraderStore();
    const is_mobile = root_store?.ui?.is_mobile;

    return is_mobile ? <StakeMobile {...props} /> : <StakeDesktop {...props} />;
});

export default Stake;
