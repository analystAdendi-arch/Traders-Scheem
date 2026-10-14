import React from 'react';

import NetworkStatus from '@deriv/core/src/App/Components/Layout/Footer/network-status';

import DateTime from './date-time';
import ToggleFullScreen from './toggle-fullscreen';

import './trade-params-footer.scss';

const TradeParamsFooter: React.FC = () => {
    return (
        <div className='trade-params-footer'>
            <NetworkStatus />
            <DateTime />
            <ToggleFullScreen showPopover={true} />
        </div>
    );
};

TradeParamsFooter.displayName = 'TradeParamsFooter';

export default TradeParamsFooter;
