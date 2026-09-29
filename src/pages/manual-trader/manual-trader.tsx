/**
 * Manual Trader.
 *
 * Sends the trader to Deriv's own platform rather than framing it. A frame
 * cannot carry the session: the platform keeps it on its own origin, so an
 * embedded copy asks for a login of its own and loses the account this site is
 * signed in as. Going there directly keeps the session that Deriv already
 * holds for the trader.
 *
 * standalone_routes.trade resolves to the platform for the current domain, so
 * this follows staging or production without anything to configure here.
 */
import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { localize } from '@deriv-com/translations';

import { standalone_routes } from '@/components/shared/utils/routes/routes';
import './manual-trader.scss';

const ManualTrader = observer(() => {
    useEffect(() => {
        window.location.href = standalone_routes.trade;
    }, []);

    return (
        <div className='manual-trader-container'>
            <div className='manual-trader'>
                <div className='manual-trader__loading' role='status' aria-live='polite'>
                    <span className='manual-trader__spinner' aria-hidden='true' />
                    <span className='manual-trader__loading-text'>{localize('Opening trader…')}</span>
                </div>
            </div>
        </div>
    );
});

export default ManualTrader;
