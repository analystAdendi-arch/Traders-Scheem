import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useDerivativesAccount, useMobileBridge } from '@deriv/api';
import { Button, Skeleton, Text } from '@deriv/components';
import AccountSwitcher from '@deriv/core/src/App/Components/Layout/Header/account-switcher';
import { LegacyChevronDown1pxIcon } from '@deriv/quill-icons';
import { addComma, getDepositUrl, getCurrencyDisplayCode, getSignupUrl, redirectToLogin, openExternalUrl } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Localize, useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import '@deriv/core/src/sass/app/_common/components/account-switcher.scss';

type AccountHeaderProps = {
    balance?: string | number;
    currency?: string;
    is_logged_in?: boolean;
    is_virtual?: boolean;
};

const AccountHeader = observer(
    ({
        balance: balanceProp,
        currency: currencyProp,
        is_logged_in: isLoggedInProp,
        is_virtual: isVirtualProp,
    }: AccountHeaderProps = {}) => {
        const { localize } = useTranslations();
        const { client, common, ui } = useStore();
        const { is_switching_account, setIsSwitchingAccount } = ui;

        const { isMobile } = useDevice();
        const { sendBridgeEvent } = useMobileBridge();

        // Use props if provided, otherwise fall back to store
        const balance = balanceProp ?? client.balance;
        const currency = currencyProp ?? client.currency;
        const is_logged_in = isLoggedInProp ?? client.is_logged_in;
        const is_virtual = isVirtualProp ?? client.is_virtual;

        const { data, isLoading, error, refetch } = useDerivativesAccount(client.loginid, is_logged_in);
        const accounts = data?.data || [];

        // Dropdown state
        const [is_dropdown_open, setIsDropdownOpen] = React.useState(false);
        const dropdown_ref = React.useRef<HTMLDivElement>(null);

        // Handle account switch start
        const handleAccountSwitchStart = React.useCallback(() => {
            setIsSwitchingAccount(true);
        }, [setIsSwitchingAccount]);

        // Reset switching state when loading completes (success or error)
        React.useEffect(() => {
            if (!isLoading && (data || error)) {
                setIsSwitchingAccount(false);
            }
        }, [isLoading, data, error, setIsSwitchingAccount]);

        // Close dropdown when clicking outside
        React.useEffect(() => {
            if (!is_dropdown_open) return;

            const handleClickOutside = (event: MouseEvent) => {
                if (dropdown_ref.current && !dropdown_ref.current.contains(event.target as Node)) {
                    setIsDropdownOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [is_dropdown_open]);

        const toggleDropdown = () => {
            setIsDropdownOpen(!is_dropdown_open);
        };

        // Check if balance is a valid number (handles comma-formatted strings like "10,000.00" and numeric 0)
        const isValidBalance =
            balance !== undefined &&
            balance !== null &&
            balance !== '' &&
            !isNaN(Number(String(balance).replace(/,/g, '')));

        const accountTypeHeader = is_virtual ? localize('Demo account') : localize('Real account');

        // Determine account types available — only evaluate once data has loaded.
        // While loading, accounts is [] which would incorrectly default to "Deposit".
        const hasOnlyDemoAccounts =
            !isLoading && accounts.length > 0 && accounts.every(acc => acc.account_type === 'demo');

        // Button logic:
        // - If only demo accounts exist -> show "Try real"
        // - Otherwise (real only or both real and demo) -> show "Deposit"
        const buttonLabel = hasOnlyDemoAccounts ? localize('Try real') : localize('Deposit');

        const handleTransferClick = () => {
            if (hasOnlyDemoAccounts) {
                // Show modal instead of redirecting directly
                ui.toggleTryRealModal(true);
            } else {
                // Transfer button (for both account types or real-only accounts)
                sendBridgeEvent('trading:transfer', () => {
                    openExternalUrl(getDepositUrl());
                });
            }
        };

        const renderAccountInfo = () => (
            <React.Fragment>
                <div className='account-header__container'>
                    <div
                        className={classNames('account-header__info', {
                            'account-header__info--no-switcher': hasOnlyDemoAccounts,
                        })}
                        onClick={hasOnlyDemoAccounts ? undefined : toggleDropdown}
                    >
                        <div
                            className={classNames('account-header__content', {
                                'account-header__content--active': is_dropdown_open,
                            })}
                        >
                            <div className='account-header__content-header'>
                                <Text size='xs' color={is_virtual ? 'tertiary' : 'secondary-alternate'}>
                                    {accountTypeHeader}
                                </Text>
                                {!hasOnlyDemoAccounts && (
                                    <LegacyChevronDown1pxIcon
                                        className={classNames('account-header__select-arrow', {
                                            'account-header__select-arrow--invert': is_dropdown_open && !isMobile,
                                        })}
                                        fill='var(--color-text-primary)'
                                        iconSize='xs'
                                    />
                                )}
                            </div>
                            <Text size='s' weight='bold' className='account-header__balance'>
                                {!currency ? (
                                    <Localize i18n_default_text='No currency assigned' />
                                ) : isValidBalance ? (
                                    `${addComma(balance, 2)} ${getCurrencyDisplayCode(currency)}`
                                ) : (
                                    `0.00 ${getCurrencyDisplayCode(currency)}`
                                )}
                            </Text>
                        </div>
                    </div>
                    {!hasOnlyDemoAccounts && (
                        <AccountSwitcher
                            accounts={accounts}
                            current_loginid={client.loginid}
                            is_loading={isLoading}
                            error={error}
                            is_open={is_dropdown_open}
                            onClose={() => setIsDropdownOpen(false)}
                            onRefetch={refetch}
                            onAccountSwitch={handleAccountSwitchStart}
                        />
                    )}
                </div>
                <Button
                    className='account-header__transfer'
                    onClick={handleTransferClick}
                    aria-label={buttonLabel}
                    type='button'
                >
                    <Text size='xs' weight='bold' color='white'>
                        {buttonLabel}
                    </Text>
                </Button>
            </React.Fragment>
        );

        if (!is_logged_in) {
            const handleLoginClick = async () => {
                await redirectToLogin(common.current_language);
            };
            const signup_url = getSignupUrl();

            return (
                <div className='account-header'>
                    <div className='account-header__logged-out'>
                        {signup_url && (
                            <Button
                                className='account-header__signup'
                                onClick={() => window.open(signup_url, '_blank', 'noopener,noreferrer')}
                                aria-label={localize('Sign up')}
                                type='button'
                                secondary
                            >
                                <Text size='xs' weight='bold'>
                                    <Localize i18n_default_text='Sign up' />
                                </Text>
                            </Button>
                        )}
                        <Button
                            className='account-header__login'
                            onClick={handleLoginClick}
                            aria-label={localize('Log in')}
                            type='button'
                        >
                            <Text size='xs' weight='bold' color='white'>
                                <Localize i18n_default_text='Log in' />
                            </Text>
                        </Button>
                    </div>
                </div>
            );
        }

        const shouldShowLoader = isLoading || is_switching_account;

        return (
            <React.Fragment>
                <div className='account-header' ref={dropdown_ref}>
                    {shouldShowLoader ? (
                        <div className='account-header--loading'>
                            <Skeleton height={44} width={240} borderRadius={22} />
                        </div>
                    ) : (
                        renderAccountInfo()
                    )}
                </div>
            </React.Fragment>
        );
    }
);

AccountHeader.displayName = 'AccountHeader';

export default AccountHeader;
