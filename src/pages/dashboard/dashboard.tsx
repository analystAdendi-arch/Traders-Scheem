import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { FinIcon } from '@/components/fin-ui/FinIcon';
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
    'Plan the trade, then trade the plan.',
    'Protect your capital first; returns follow discipline.',
    'Cut losses short and let winning positions run.',
    'Risk management is the only edge you fully control.',
    'The trend is your friend — until it bends.',
    'Size every position as if the next trade could be a loss.',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

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

    // Session clock for the desk header.
    const [now, setNow] = React.useState(() => new Date());
    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    const account = !client.is_logged_in
        ? localize('Guest view')
        : client.is_virtual
          ? localize('Demo account')
          : localize('Real account');

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
                            <span className='fin-eyebrow'>
                                <i aria-hidden='true' />
                                {localize('Trading desk · Markets live')}
                            </span>
                            <h2 className='db-hero__greeting'>
                                <span className='db-hero__greeting-word'>{getGreeting()}</span>, {name}
                            </h2>
                            <p className='db-hero__quote'>
                                <span className='db-hero__quote-label'>{localize('Principle of the day')}</span>“{quote}”
                            </p>
                            <div className='db-hero__session'>
                                <span className='db-hero__chip'>
                                    <FinIcon name='clock' size={16} />
                                    {clock}
                                </span>
                                <span className='db-hero__chip'>
                                    <FinIcon name='globe' size={16} />
                                    {localize('Synthetic indices open 24/7')}
                                </span>
                                <span className='db-hero__chip'>
                                    <FinIcon name='vault' size={16} />
                                    {account}
                                </span>
                            </div>
                        </div>
                        <div className='db-hero__divider'>
                            <span>{localize('Strategy desk')}</span>
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
