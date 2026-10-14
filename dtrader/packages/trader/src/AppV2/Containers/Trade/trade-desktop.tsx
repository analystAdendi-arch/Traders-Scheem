import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { useLocalStorageData } from '@deriv/api';
import { Loading } from '@deriv/components';
import { getSymbolDisplayName, isEmbedded } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Loader } from '@deriv-com/ui';

import AccountHeader from 'AppV2/Components/AccountHeader';
import AccumulatorStats from 'AppV2/Components/AccumulatorStats';
import ClosedMarketMessage from 'AppV2/Components/ClosedMarketMessage';
import Guide from 'AppV2/Components/Guide';
import OnboardingGuide, {
    OnboardingGuideDesktop,
    OnboardingGuideDesktopReturning,
} from 'AppV2/Components/OnboardingGuide/GuideForPages';
import PurchaseButton from 'AppV2/Components/PurchaseButton';
import TradeErrorSnackbar from 'AppV2/Components/TradeErrorSnackbar';
import { TradeParameters } from 'AppV2/Components/TradeParameters';
import TradeParamsFooter from 'AppV2/Components/TradeParamsFooter';
// Commented out to use chart's native market selector instead
// import MarketSelector from 'AppV2/Components/MarketSelector';
import useContractsFor from 'AppV2/Hooks/useContractsFor';
import useDefaultSymbol from 'AppV2/Hooks/useDefaultSymbol';
import useTabletLandscape from 'AppV2/Hooks/useTabletLandscape';
import { getDisplayedContractTypes } from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import { TradeChart } from '../Chart';

import TradeTypes from './trade-types';

const TradeDesktop = observer(() => {
    const chart_ref = React.useRef<HTMLDivElement>(null);
    const {
        client,
        common: { current_language, network_status },
        ui: { is_dark_mode_on, active_sidebar_flyout },
    } = useStore();
    const { is_logged_in } = client;
    const {
        active_symbols,
        contract_type,
        is_accumulator,
        is_multiplier,
        is_chart_loading,
        is_market_closed,
        onChange,
        onMount,
        onUnmount,
        proposal_info,
        should_show_active_symbols_loading,
        trade_types: trade_types_store,
        trade_type_tab,
    } = useTraderStore();
    const { trade_types } = useContractsFor();
    useDefaultSymbol(); // This will initialize and set the default symbol
    const { should_show_portrait_loader } = useTabletLandscape({
        is_chart_loading,
        should_show_active_symbols_loading,
    });
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
        (
            e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
            source?: string,
            _trade_type_count?: number,
            tab?: 'all' | 'most_traded'
        ) => {
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

    return (
        <>
            {should_show_portrait_loader && <Loader isFullScreen />}
            {symbols.length && trade_types.length ? (
                <div
                    className={clsx('trade', {
                        trade__logout: !is_logged_in,
                        'trade--flyout-open': active_sidebar_flyout !== null,
                    })}
                >
                    <div className='trade__header'>
                        <TradeTypes
                            contract_type={contract_type}
                            onTradeTypeSelect={onTradeTypeSelect}
                            trade_types={trade_types}
                            is_dark_mode_on={is_dark_mode_on}
                        />
                        {/* [VolaTrades] The account and balance live in VolaTrades' header. */}
                        {!isEmbedded() && <AccountHeader />}
                    </div>
                    {/* Commented out to use chart's native market selector instead */}
                    {/* <MarketSelector /> */}
                    <div className='trade__grid'>
                        <div className='trade__chart-tooltip'>
                            <section
                                className={clsx('trade__chart', {
                                    'trade__chart--with-borderRadius': !is_accumulator,
                                })}
                                style={{
                                    height: '100%',
                                }}
                                ref={chart_ref}
                            >
                                <TradeChart />
                            </section>
                            {is_accumulator && <AccumulatorStats />}
                        </div>
                        <div className='trade-params'>
                            <Guide show_guide_for_selected_contract />
                            <TradeParameters />
                            <ClosedMarketMessage />
                            {!is_market_closed && <PurchaseButton />}
                            {/* [VolaTrades] VolaTrades' own footer has the clock and full screen. */}
                            {!isEmbedded() && <TradeParamsFooter />}
                        </div>
                    </div>
                    {/* Mobile onboarding */}
                    {/* [VolaTrades] No DTrader product tours inside VolaTrades. */}
                    {!isEmbedded() && !guide_dtrader_v2?.trade_page && is_logged_in && <OnboardingGuide type='trade_page' />}
                    {/* Desktop onboarding - new users */}
                    {!isEmbedded() && is_logged_in && <OnboardingGuideDesktop type='trade_page' />}
                    {/* [AI] Desktop onboarding - returning mobile users */}
                    {!isEmbedded() && is_logged_in && <OnboardingGuideDesktopReturning type='trade_page' />}
                    {/* [/AI] */}
                </div>
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

export default TradeDesktop;
