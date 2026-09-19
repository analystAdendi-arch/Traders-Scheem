import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import TradingBackdrop from '@/components/trading-backdrop/TradingBackdrop';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import OnboardTourHandler from '../tutorials/dbot-tours/onboarding-tour';
import Announcements from './announcements';
import Cards from './cards';
import InfoPanel from './info-panel';

type TMobileIconGuide = {
    handleTabChange: (active_number: number) => void;
};

const QUOTES = [
    'The trend is your friend — until it ends.',
    'Plan the trade, trade the plan.',
    'Cut losses short, let profits run.',
    'Discipline beats prediction.',
    'Protect your capital first.',
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return localize('Good morning');
    if (hour < 18) return localize('Good afternoon');
    return localize('Good evening');
};

const DashboardComponent = observer(({ handleTabChange }: TMobileIconGuide) => {
    const { load_modal, dashboard, client } = useStore();
    const { dashboard_strategies } = load_modal;
    const { active_tab, active_tour } = dashboard;
    const has_dashboard_strategies = !!dashboard_strategies?.length;
    const { isDesktop, isTablet } = useDevice();

    const name = client.is_logged_in && client.loginid ? client.loginid : localize('Trader');
    const quote = QUOTES[new Date().getDate() % QUOTES.length];

    return (
        <React.Fragment>
            <div
                className={classNames('tab__dashboard', {
                    'tab__dashboard--tour-active': active_tour,
                })}
            >
                <div className='tab__dashboard__content db-hero'>
                    <TradingBackdrop />
                    {client.is_logged_in && (
                        <Announcements is_mobile={!isDesktop} is_tablet={isTablet} handleTabChange={handleTabChange} />
                    )}
                    <div className='quick-panel db-hero__inner'>
                        <div className='tab__dashboard__header db-hero__header'>
                            <h2 className='db-hero__greeting'>
                                <span className='db-hero__greeting-word'>{getGreeting()}</span>, {name}{' '}
                                <span aria-hidden='true'>👋</span>
                            </h2>
                            <p className='db-hero__quote'>“{quote}”</p>
                        </div>
                        <div className='db-hero__divider'>
                            <span>{localize('Quick actions')}</span>
                        </div>
                        <Cards has_dashboard_strategies={has_dashboard_strategies} is_mobile={!isDesktop} />
                    </div>
                </div>
            </div>
            <InfoPanel />
            {active_tab === 0 && <OnboardTourHandler is_mobile={!isDesktop} />}
        </React.Fragment>
    );
});

export default DashboardComponent;
