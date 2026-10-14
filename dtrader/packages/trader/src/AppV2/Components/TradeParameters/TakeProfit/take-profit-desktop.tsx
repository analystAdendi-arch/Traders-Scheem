import React from 'react';
import { observer } from 'mobx-react-lite';

import { getCurrencyDisplayCode } from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import { TradeParameterPopover, useTradeParameterPopover } from 'AppV2/Components/TradeParameters/Shared';
import useTradeError from 'AppV2/Hooks/useTradeError';
import { useTraderStore } from 'Stores/useTraderStores';

import { TTradeParametersProps } from '../trade-parameters';

import TakeProfitInputDesktop from './take-profit-input-desktop';

const TakeProfitPopoverContent: React.FC<{ is_open: boolean }> = ({ is_open }) => {
    const { closePopover } = useTradeParameterPopover();
    return <TakeProfitInputDesktop onClose={closePopover} is_open={is_open} />;
};

const TakeProfitDesktop = observer(({ is_minimized }: TTradeParametersProps) => {
    const { currency, has_open_accu_contract, has_take_profit, is_market_closed, take_profit } = useTraderStore();
    const { is_error_matching_field: has_error } = useTradeError({ error_fields: ['take_profit'] });

    const [is_open, setIsOpen] = React.useState(false);

    const onClose = React.useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <TradeParameterPopover
            label={<Localize i18n_default_text='Take profit' key={`take-profit${is_minimized ? '-minimized' : ''}`} />}
            value={has_take_profit && take_profit ? `${take_profit} ${getCurrencyDisplayCode(currency)}` : '-'}
            is_minimized={is_minimized}
            disabled={has_open_accu_contract || is_market_closed}
            has_error={has_error}
            popover_classname='take-profit-popover'
            onOpen={() => setIsOpen(true)}
            onClose={onClose}
            description={
                <Localize i18n_default_text='When your profit reaches or exceeds this amount, your trade will be closed automatically.' />
            }
        >
            <TakeProfitPopoverContent is_open={is_open} />
        </TradeParameterPopover>
    );
});

export default TakeProfitDesktop;
