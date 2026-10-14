import React from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useLocalStorageData, useMobileBridge } from '@deriv/api';
import { getPositionsV2TabIndexFromURL, routes } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Tab } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import OnboardingGuide from 'AppV2/Components/OnboardingGuide/GuideForPages';
import { setPositionURLParams, TAB_NAME } from 'AppV2/Utils/positions-utils';
import { useModulesStore } from 'Stores/useModulesStores';

import PositionsContent from './positions-content';

const Positions = observer(() => {
    const analyticsCalledRef = React.useRef(false);
    const [hasButtonsDemo, setHasButtonsDemo] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState(getPositionsV2TabIndexFromURL());
    const [guide_dtrader_v2] = useLocalStorageData<Record<string, boolean>>('guide_dtrader_v2', {
        trade_types_selection: false,
        trade_page: false,
        positions_page: false,
    });
    const history = useHistory();

    const {
        client: { is_logged_in },
        ui: { is_dark_mode_on },
    } = useStore();
    const { isBridgeAvailable } = useMobileBridge();
    const {
        positions: { onUnmount },
    } = useModulesStore();

    const tabs = [
        {
            id: TAB_NAME.OPEN.toLowerCase(),
            title: <Localize i18n_default_text='Open' />,
            content: <PositionsContent hasButtonsDemo={hasButtonsDemo} setHasButtonsDemo={setHasButtonsDemo} />,
        },
        {
            id: TAB_NAME.CLOSED.toLowerCase(),
            title: <Localize i18n_default_text='Closed' />,
            content: <PositionsContent isClosedTab />,
        },
    ];

    const onChangeTab = (new_active_tab: number) => {
        setActiveTab(new_active_tab);
        setPositionURLParams(tabs[new_active_tab].id);
    };

    React.useEffect(() => {
        if (analyticsCalledRef.current) return;
        analyticsCalledRef.current = true;
    }, []);

    React.useEffect(() => {
        setPositionURLParams(tabs[activeTab].id);

        if (guide_dtrader_v2?.positions_page) {
            setHasButtonsDemo(true);
        }

        return () => {
            const is_contract_details = history.location.pathname.startsWith(
                routes.contract.replace('/:contract_id', '')
            );
            if (!is_contract_details) onUnmount();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <div className='positions-page'>
                <Tab.Container
                    contentStyle='fill'
                    className='positions-page-container__tabs'
                    size='md'
                    selectedTabIndex={activeTab}
                    onChangeTab={onChangeTab}
                >
                    <Tab.List>
                        {tabs.map(({ id, title }) => (
                            <Tab.Trigger key={id}>{title}</Tab.Trigger>
                        ))}
                    </Tab.List>
                    <Tab.Content className='positions-page-container__tabs-content'>
                        {tabs.map(({ id, content }) => (
                            <Tab.Panel key={id}>{content}</Tab.Panel>
                        ))}
                    </Tab.Content>
                </Tab.Container>
            </div>
            {/* TODO: Remove isBridgeAvailable check when onboarding video with Accumulators is available*/}
            {/* OnboardingGuide now only shows for mobile users */}
            {!guide_dtrader_v2?.positions_page && is_logged_in && !isBridgeAvailable && (
                <OnboardingGuide
                    type='positions_page'
                    is_dark_mode_on={is_dark_mode_on}
                    callback={() => setHasButtonsDemo(true)}
                />
            )}
        </>
    );
});

export default Positions;
