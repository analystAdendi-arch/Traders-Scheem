import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { useLocalStorageData } from '@deriv/api';
import { Loading } from '@deriv/components';
import { getSymbolDisplayName } from '@deriv/shared';
import { useStore } from '@deriv/stores';

import AccumulatorStats from 'AppV2/Components/AccumulatorStats';
import CurrentSpot from 'AppV2/Components/CurrentSpot';
import Guide from 'AppV2/Components/Guide';
import MarketSelector from 'AppV2/Components/MarketSelector';
import OnboardingGuide from 'AppV2/Components/OnboardingGuide/GuideForPages';
import TradeErrorSnackbar from 'AppV2/Components/TradeErrorSnackbar';
import { TradeParametersContainer } from 'AppV2/Components/TradeParameters';
import useContractsFor from 'AppV2/Hooks/useContractsFor';
import useDefaultSymbol from 'AppV2/Hooks/useDefaultSymbol';
import { getChartHeight } from 'AppV2/Utils/layout-utils';
import { getDisplayedContractTypes } from 'AppV2/Utils/trade-types-utils';
import { isDigitTradeType } from 'AppV2/Utils/digits';
import { useTraderStore } from 'Stores/useTraderStores';

import { TradeChart } from '../Chart';

import TradeTypes from './trade-types';

const Trade = observer(() => {
    const chart_ref = React.useRef<HTMLDivElement>(null);
    const {
        client,
        common: { current_language, network_status },
        ui: { is_dark_mode_on },
        contract_trade,
    } = useStore();
    const { is_logged_in } = client;
    const {
        active_symbols,
        contract_type,
        has_cancellation,
        is_accumulator,
        is_multiplier,
        is_market_closed,
        onChange,
        onMount,
        onUnmount,
        symbol,
        proposal_info,
        trade_types: trade_types_store,
        trade_type_tab,
    } = useTraderStore();
    const { trade_types } = useContractsFor();
    useDefaultSymbol(); // This will initialize and set the default symbol
    const [guide_dtrader_v2] = useLocalStorageData<Record<string, boolean>>('guide_dtrader_v2', {
        trade_types_selection: false,
        trade_page: false,
        positions_page: false,
    });

    // For handling edge cases of snackbar:
    const contract_types = getDisplayedContractTypes(trade_types_store, contract_type, trade_type_tab);
    const is_all_types_with_errors = contract_types.every(item => proposal_info?.[item]?.has_error);
    const is_any_type_with_errors = contract_types.some(item => proposal_info?.[item]?.has_error);
    const is_high_low = /^high_low$/.test(contract_type.toLowerCase());

    // Showing snackbar for all cases, except when it is Rise/Fall or Digits and only one subtype has error
    const should_show_snackbar =
        contract_types.length === 1 ||
        is_multiplier ||
        is_all_types_with_errors ||
        (is_high_low && is_any_type_with_errors);

    const symbols = React.useMemo(
        () =>
            active_symbols.map(({ underlying_symbol: underlying }) => ({
                text: getSymbolDisplayName(underlying || ''),
                value: underlying || '',
            })),
        [active_symbols]
    );

    const onTradeTypeSelect = React.useCallback(
        (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
            const selected_trade_type = trade_types.find(
                ({ text }) => text === (e.target as HTMLButtonElement).textContent
            );
            onChange({
                target: {
                    name: 'contract_type',
                    value: selected_trade_type?.value,
                },
            });
        },
        [trade_types, onChange]
    );

    React.useEffect(() => {
        onMount();
        return onUnmount;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current_language, network_status.class]);

    // Clear contract markers when navigating to trade page from reports
    React.useEffect(() => {
        // Clear any existing contract markers from closed contracts
        if (contract_trade && 'clearClosedContractMarkers' in contract_trade) {
            contract_trade.clearClosedContractMarkers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {symbols.length && trade_types.length ? (
                <React.Fragment>
                    <div className='trade'>
                        <TradeTypes
                            contract_type={contract_type}
                            onTradeTypeSelect={onTradeTypeSelect}
                            trade_types={trade_types}
                            is_dark_mode_on={is_dark_mode_on}
                        />
                        <div className='trade__market-selector-guide'>
                            <MarketSelector />
                            <Guide show_guide_for_selected_contract />
                        </div>
                        {isDigitTradeType(contract_type) && <CurrentSpot />}
                        <div className='trade__chart-tooltip'>
                            <section
                                className={clsx('trade__chart', { 'trade__chart--with-borderRadius': !is_accumulator })}
                                style={{
                                    height: getChartHeight({
                                        is_accumulator,
                                        symbol,
                                        has_cancellation,
                                        contract_type,
                                    }),
                                }}
                                ref={chart_ref}
                            >
                                <TradeChart />
                            </section>
                        </div>
                        {is_accumulator && <AccumulatorStats />}
                    </div>
                    <TradeParametersContainer is_market_closed={is_market_closed} />
                    {is_logged_in && <OnboardingGuide type='trade_page' is_dark_mode_on={is_dark_mode_on} />}
                </React.Fragment>
            ) : (
                <Loading.DTraderV2 />
            )}
            <TradeErrorSnackbar
                error_fields={['stop_loss', 'take_profit', 'date_start', 'stake', 'amount']}
                should_show_snackbar={should_show_snackbar}
            />
        </>
    );
});

export default Trade;
