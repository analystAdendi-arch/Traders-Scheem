import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { useApiBase } from '@/hooks/useApiBase';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import { isDemoAccount } from '@/utils/account-helpers';
import { Localize, localize } from '@deriv-com/translations';
import { TAccountSwitcher } from './common/types';
import AccountInfoWrapper from './account-info-wrapper';
import './account-switcher.scss';

const TRADERS_HUB_URL = 'https://hub.deriv.com/tradershub';

/* --------------------------------------------------------------- currency marks */

/** Country flag for a fiat currency; a lettered coin for anything else. */
const CurrencyMark = ({ currency, is_demo, size = 24 }: { currency?: string; is_demo?: boolean; size?: number }) => {
    const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true as const };

    if (is_demo) {
        return (
            <svg {...common} className='acc-mark'>
                <circle cx='12' cy='12' r='11' fill='#ff444f' />
                <text x='12' y='16.5' textAnchor='middle' fontSize='12' fontWeight='800' fill='#fff' fontFamily='Arial'>
                    D
                </text>
            </svg>
        );
    }

    const code = (currency || '').toUpperCase();

    if (code === 'USD') {
        // Stars and stripes, simplified to read clearly at 24px.
        return (
            <svg {...common} className='acc-mark'>
                <defs>
                    <clipPath id='acc-flag-clip'>
                        <circle cx='12' cy='12' r='11' />
                    </clipPath>
                </defs>
                <g clipPath='url(#acc-flag-clip)'>
                    <rect width='24' height='24' fill='#ffffff' />
                    {[0, 2, 4, 6, 8, 10].map(i => (
                        <rect key={i} y={1 + i * 2} width='24' height='2' fill='#b22234' />
                    ))}
                    <rect width='11' height='13' fill='#3c3b6e' />
                    {[2.5, 6.5, 10.5].map(y =>
                        [1.8, 4.4, 7, 9.2].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r='0.7' fill='#fff' />)
                    )}
                </g>
                <circle cx='12' cy='12' r='11' fill='none' stroke='rgba(0,0,0,0.12)' />
            </svg>
        );
    }

    if (code === 'EUR') {
        return (
            <svg {...common} className='acc-mark'>
                <circle cx='12' cy='12' r='11' fill='#003399' />
                <text x='12' y='16.5' textAnchor='middle' fontSize='12' fontWeight='800' fill='#ffcc00'>
                    €
                </text>
            </svg>
        );
    }

    if (code === 'GBP') {
        return (
            <svg {...common} className='acc-mark'>
                <circle cx='12' cy='12' r='11' fill='#012169' />
                <text x='12' y='16.5' textAnchor='middle' fontSize='12' fontWeight='800' fill='#ffffff'>
                    £
                </text>
            </svg>
        );
    }

    return (
        <svg {...common} className='acc-mark'>
            <circle cx='12' cy='12' r='11' fill='#14b8a6' />
            <text x='12' y='16' textAnchor='middle' fontSize='8' fontWeight='800' fill='#ffffff' fontFamily='Arial'>
                {code.slice(0, 3) || '$'}
            </text>
        </svg>
    );
};

const Chevron = ({ up }: { up?: boolean }) => (
    <svg
        className={classNames('acc-chevron', { 'acc-chevron--up': up })}
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
    >
        <path d='M6 9l6 6 6-6' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const LogoutIcon = () => (
    <svg width='15' height='15' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <path
            d='M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
        />
        <path d='M9 12h11M16 8l4 4-4 4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

/* ---------------------------------------------------------------------- page */

const AccountSwitcher = observer(({ activeAccount }: TAccountSwitcher) => {
    const [isOpen, setIsOpen] = useState(false);
    const [typeTab, setTypeTab] = useState<'real' | 'demo'>('real');
    const [listOpen, setListOpen] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { accountList, activeLoginid } = useApiBase();
    const { client, run_panel } = useStore() ?? {};
    const handleLogout = useLogout();

    const is_bot_running = run_panel?.is_running || api_base.is_running;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
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
        // The panel also holds the account list and logout, so it opens even
        // with one account; only a running bot keeps it shut.
        if (is_bot_running) return;
        if (!isOpen && activeLoginid) setTypeTab(isDemoAccount(activeLoginid) ? 'demo' : 'real');
        setIsOpen(prev => !prev);
    }, [is_bot_running, isOpen, activeLoginid]);

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
        return accountList.map(account => ({
            loginid: account.loginid,
            currency: account.currency,
            balance: addComma(Number(account.balance ?? 0).toFixed(getDecimalPlaces(account.currency))),
            isVirtual: isDemoAccount(account.loginid),
            isActive: account.loginid === activeLoginid,
        }));
    }, [accountList, activeLoginid]);

    const realAccounts = formattedAccounts.filter(account => !account.isVirtual);
    const demoAccounts = formattedAccounts.filter(account => account.isVirtual);
    const tabAccounts = typeTab === 'real' ? realAccounts : demoAccounts;

    if (!activeAccount) return null;

    const { currency, isVirtual, balance } = activeAccount;

    return (
        <div className='acc-info__wrapper' ref={wrapperRef}>
            <AccountInfoWrapper>
                <div
                    data-testid='dt_acc_info'
                    id='dt_core_account-info_acc-info'
                    role='button'
                    tabIndex={0}
                    aria-expanded={isOpen}
                    aria-haspopup='menu'
                    className={classNames('acc-trigger', { 'acc-trigger--disabled': is_bot_running })}
                    onClick={toggleDropdown}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown();
                        }
                    }}
                >
                    <CurrencyMark currency={currency} is_demo={!!isVirtual} size={26} />
                    <span data-testid='dt_balance' className='acc-trigger__balance'>
                        {!currency ? (
                            <Localize i18n_default_text='No currency assigned' />
                        ) : (
                            `${balance} ${getCurrencyDisplayCode(currency)}`
                        )}
                    </span>
                    <Chevron up={isOpen} />
                </div>
            </AccountInfoWrapper>

            {isOpen && (
                <div className='acc-menu' role='menu'>
                    <div className='acc-menu__tabs' role='tablist'>
                        {(['real', 'demo'] as const).map(tab => (
                            <button
                                key={tab}
                                type='button'
                                role='tab'
                                aria-selected={typeTab === tab}
                                className={classNames('acc-menu__tab', { 'acc-menu__tab--active': typeTab === tab })}
                                onClick={() => setTypeTab(tab)}
                            >
                                {tab === 'real' ? (
                                    <Localize i18n_default_text='Real' />
                                ) : (
                                    <Localize i18n_default_text='Demo' />
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        type='button'
                        className='acc-menu__section'
                        aria-expanded={listOpen}
                        onClick={() => setListOpen(open => !open)}
                    >
                        <span>
                            {tabAccounts.length === 1 ? (
                                <Localize i18n_default_text='Deriv account' />
                            ) : (
                                <Localize i18n_default_text='Deriv accounts' />
                            )}
                        </span>
                        <Chevron up={listOpen} />
                    </button>

                    {listOpen && (
                        <div className='acc-menu__list'>
                            {tabAccounts.length === 0 && (
                                <p className='acc-menu__empty'>
                                    {typeTab === 'real' ? (
                                        <Localize i18n_default_text='No real account on this login yet.' />
                                    ) : (
                                        <Localize i18n_default_text='No demo account on this login.' />
                                    )}
                                </p>
                            )}
                            {tabAccounts.map(account => (
                                <div
                                    key={account.loginid}
                                    role='menuitemradio'
                                    aria-checked={account.isActive}
                                    tabIndex={0}
                                    className={classNames('acc-menu__row', {
                                        'acc-menu__row--active': account.isActive,
                                    })}
                                    onClick={() => !account.isActive && handleAccountSelect(account.loginid)}
                                    onKeyDown={e => {
                                        if (!account.isActive && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            handleAccountSelect(account.loginid);
                                        }
                                    }}
                                >
                                    <CurrencyMark currency={account.currency} is_demo={account.isVirtual} />
                                    <span className='acc-menu__row-text'>
                                        <span className='acc-menu__row-title'>
                                            {account.isVirtual ? (
                                                <Localize i18n_default_text='Demo' />
                                            ) : (
                                                getCurrencyDisplayCode(account.currency) ||
                                                localize('No currency')
                                            )}
                                        </span>
                                        <span className='acc-menu__row-id'>{account.loginid}</span>
                                    </span>
                                    <span className='acc-menu__row-balance'>
                                        {account.currency
                                            ? `${account.balance} ${getCurrencyDisplayCode(account.currency)}`
                                            : '--'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <a className='acc-menu__hub' href={TRADERS_HUB_URL} target='_blank' rel='noopener noreferrer'>
                        <Localize i18n_default_text="Looking for CFD accounts? Go to Trader's Hub" />
                    </a>

                    <div className='acc-menu__footer'>
                        <button
                            type='button'
                            className='acc-menu__logout'
                            onClick={() => {
                                setIsOpen(false);
                                handleLogout();
                            }}
                        >
                            <Localize i18n_default_text='Logout' />
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AccountSwitcher;
