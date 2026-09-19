import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import Text from '@/components/shared_ui/text';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { isDemoAccount } from '@/utils/account-helpers';
import { Localize } from '@deriv-com/translations';
import { TAccountSwitcher } from './common/types';
import AccountInfoWrapper from './account-info-wrapper';
import './account-switcher.scss';

const CoinIcon = ({ is_demo }: { is_demo: boolean }) => (
    <svg className='acc-info__coin' width='26' height='26' viewBox='0 0 26 26' aria-hidden='true'>
        <circle cx='13' cy='13' r='12' fill={is_demo ? '#0ea5e9' : '#14b8a6'} />
        <circle cx='13' cy='13' r='9' fill='none' stroke='rgba(255,255,255,0.55)' strokeWidth='1.2' />
        <text x='13' y='17.5' textAnchor='middle' fontSize='12' fontWeight='800' fill='#ffffff' fontFamily='Arial'>
            {is_demo ? 'D' : '$'}
        </text>
    </svg>
);

const AccountSwitcher = observer(({ activeAccount }: TAccountSwitcher) => {
    const [isOpen, setIsOpen] = useState(false);
    const [typeTab, setTypeTab] = useState<'real' | 'demo'>('real');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { accountList, activeLoginid } = useApiBase();
    const { client, run_panel } = useStore() ?? {};

    const is_bot_running = run_panel?.is_running || api_base.is_running;
    const isSingleAccount = !accountList || accountList.length <= 1;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const toggleDropdown = useCallback(() => {
        if (is_bot_running || isSingleAccount) return;
        // Open on the tab of the account currently in use.
        if (!isOpen && activeLoginid) setTypeTab(isDemoAccount(activeLoginid) ? 'demo' : 'real');
        setIsOpen(prev => !prev);
    }, [is_bot_running, isSingleAccount, isOpen, activeLoginid]);

    const handleAccountSelect = useCallback(
        (loginid: string) => {
            localStorage.setItem('active_loginid', loginid);
            client?.checkAndRegenerateWebSocket();
            setIsOpen(false);
        },
        [client]
    );

    const formattedAccounts = useMemo(() => {
        if (!accountList) return [];
        return accountList
            .map(account => ({
                loginid: account.loginid,
                currency: account.currency,
                balance: addComma(Number(account.balance ?? 0).toFixed(getDecimalPlaces(account.currency))),
                isVirtual: isDemoAccount(account.loginid),
                isActive: account.loginid === activeLoginid,
            }))
            .sort((a, b) => (a.isActive ? -1 : b.isActive ? 1 : 0));
    }, [accountList, activeLoginid]);

    const realAccounts = formattedAccounts.filter(account => !account.isVirtual);
    const demoAccounts = formattedAccounts.filter(account => account.isVirtual);
    const tabAccounts = typeTab === 'real' ? realAccounts : demoAccounts;

    if (!activeAccount) return null;

    const { currency, isVirtual, balance } = activeAccount;
    const showChevron = !isSingleAccount && !is_bot_running;

    return (
        <div className='acc-info__wrapper' ref={wrapperRef}>
            <AccountInfoWrapper>
                <div
                    data-testid='dt_acc_info'
                    id='dt_core_account-info_acc-info'
                    role={showChevron ? 'button' : undefined}
                    tabIndex={showChevron ? 0 : -1}
                    aria-expanded={showChevron ? isOpen : undefined}
                    aria-haspopup={showChevron ? 'listbox' : undefined}
                    className={classNames('acc-info', {
                        'acc-info--is-virtual': isVirtual,
                        'acc-info--interactive': showChevron,
                    })}
                    onClick={toggleDropdown}
                    onKeyDown={e => {
                        if (showChevron && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            toggleDropdown();
                        }
                    }}
                >
                    <span className='acc-info__id' aria-hidden='true'></span>
                    <CoinIcon is_demo={!!isVirtual} />
                    <div className='acc-info__content'>
                        <div className='acc-info__account-type-header'>
                            <Text as='p' size='xs' className='acc-info__account-type'>
                                {isVirtual ? (
                                    <Localize i18n_default_text='Demo account' />
                                ) : (
                                    <Localize i18n_default_text='Real account' />
                                )}
                            </Text>
                            {showChevron && (
                                <span
                                    className={classNames('acc-info__select-arrow', {
                                        'acc-info__select-arrow--invert': isOpen,
                                    })}
                                >
                                    <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                                        <path
                                            d='M2 4L6 8L10 4'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                </span>
                            )}
                        </div>
                        {(typeof balance !== 'undefined' || !currency) && (
                            <div className='acc-info__balance-section'>
                                <p
                                    data-testid='dt_balance'
                                    className={classNames('acc-info__balance', {
                                        'acc-info__balance--no-currency': !currency && !isVirtual,
                                    })}
                                >
                                    {!currency ? (
                                        <Localize i18n_default_text='No currency assigned' />
                                    ) : (
                                        `${balance} ${getCurrencyDisplayCode(currency)}`
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </AccountInfoWrapper>
            {isOpen && (
                <div className='acc-dropdown' role='listbox'>
                    <div className='acc-dropdown__tabs' role='tablist'>
                        {(['real', 'demo'] as const).map(tab => (
                            <button
                                key={tab}
                                type='button'
                                role='tab'
                                aria-selected={typeTab === tab}
                                className={classNames('acc-dropdown__tab', {
                                    'acc-dropdown__tab--active': typeTab === tab,
                                    'acc-dropdown__tab--demo': tab === 'demo',
                                })}
                                onClick={() => setTypeTab(tab)}
                            >
                                {tab === 'real' ? (
                                    <Localize i18n_default_text='Real' />
                                ) : (
                                    <Localize i18n_default_text='Demo' />
                                )}
                                <span className='acc-dropdown__tab-count'>
                                    {tab === 'real' ? realAccounts.length : demoAccounts.length}
                                </span>
                            </button>
                        ))}
                    </div>
                    {tabAccounts.length === 0 && (
                        <div className='acc-dropdown__empty'>
                            {typeTab === 'real' ? (
                                <Localize i18n_default_text='No real account on this login yet.' />
                            ) : (
                                <Localize i18n_default_text='No demo account on this login.' />
                            )}
                        </div>
                    )}
                    {tabAccounts.map(account => (
                        <div
                            key={account.loginid}
                            role='option'
                            aria-selected={account.isActive}
                            tabIndex={0}
                            className={classNames('acc-dropdown__account', {
                                'acc-dropdown__account--selected': account.isActive,
                                'acc-dropdown__account--virtual': account.isVirtual,
                            })}
                            onClick={() => !account.isActive && handleAccountSelect(account.loginid)}
                            onKeyDown={e => {
                                if (!account.isActive && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    handleAccountSelect(account.loginid);
                                }
                            }}
                        >
                            <Text
                                size='xxxs'
                                className={classNames('acc-dropdown__account-type', {
                                    'acc-dropdown__account-type--virtual': account.isVirtual,
                                })}
                            >
                                {account.isVirtual ? (
                                    <Localize i18n_default_text='Demo account' />
                                ) : (
                                    <Localize i18n_default_text='Real account' />
                                )}
                            </Text>
                            <Text size='xs' weight='bold' className='acc-dropdown__balance'>
                                {account.currency ? (
                                    `${account.balance} ${getCurrencyDisplayCode(account.currency)}`
                                ) : (
                                    <Localize i18n_default_text='No currency assigned' />
                                )}
                            </Text>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default AccountSwitcher;
