import React from 'react';
import classNames from 'classnames';

import { TDerivativesAccount } from '@deriv/api';
import { Text } from '@deriv/components';
import { LegacyChevronDown1pxIcon } from '@deriv/quill-icons';
import { addComma, formatMoney, getAccountType, getCurrencyDisplayCode } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { Localize, useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { RefetchOptions, RefetchQueryFilters } from '@tanstack/react-query';

import AccountInfoWrapper from './account-info-wrapper';
import AccountSwitcher from './account-switcher';

interface AccountInfoProps {
    accounts?: TDerivativesAccount[];
    isLoading?: boolean;
    error?: Error | null;
    refetch?: <TPageData>(options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined) => Promise<unknown>;
    onAccountSwitch?: () => void;
}

const AccountInfo = observer(
    ({ accounts = [], isLoading = false, error = null, refetch, onAccountSwitch }: AccountInfoProps) => {
        const { localize } = useTranslations();
        const { isMobile } = useDevice();

        // Get client data from store
        const { client } = useStore();
        const { loginid, balance, currency } = client;

        // Dropdown open/close state
        const [is_dropdown_open, setIsDropdownOpen] = React.useState(false);
        const dropdown_ref = React.useRef<HTMLDivElement>(null);

        const accountType = getAccountType();
        const accountTypeHeader = accountType === 'real' ? localize('Real account') : localize('Demo account');
        const isDemoAccount = accountType === 'demo';

        const formattedBalance = balance != null ? formatMoney(currency, balance, true) : undefined;

        // Determine if user has only demo accounts (to disable dropdown)
        const hasOnlyDemoAccounts = accounts.length > 0 && accounts.every(acc => acc.account_type === 'demo');

        // Close dropdown when clicking outside
        React.useEffect(() => {
            if (!is_dropdown_open || isMobile) return;

            const handleClickOutside = (event: MouseEvent) => {
                if (dropdown_ref.current && !dropdown_ref.current.contains(event.target as Node)) {
                    setIsDropdownOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [is_dropdown_open, isMobile]);

        const toggleDropdown = () => {
            setIsDropdownOpen(!is_dropdown_open);
        };

        return (
            <React.Fragment>
                <div className='acc-info__wrapper' ref={dropdown_ref}>
                    <AccountInfoWrapper is_mobile={isMobile}>
                        <div className='acc-info__container'>
                            <div
                                data-testid='dt_acc_info'
                                id='dt_core_account-info_acc-info'
                                className={classNames('acc-info', {
                                    'acc-info--is-demo': isDemoAccount,
                                    'acc-info--show': is_dropdown_open && !isMobile,
                                    'acc-info--no-switcher': hasOnlyDemoAccounts,
                                })}
                                onClick={hasOnlyDemoAccounts ? undefined : toggleDropdown}
                            >
                                <div className='acc-info__content'>
                                    <div className='acc-info__account-type-header'>
                                        <Text
                                            as='p'
                                            size='xs'
                                            color={isDemoAccount ? 'tertiary' : 'secondary-alternate'}
                                        >
                                            {accountTypeHeader}
                                        </Text>
                                        {!hasOnlyDemoAccounts && (
                                            <LegacyChevronDown1pxIcon
                                                className={classNames('acc-info__select-arrow', {
                                                    'acc-info__select-arrow--invert': is_dropdown_open && !isMobile,
                                                })}
                                                fill='var(--color-text-primary)'
                                                iconSize='xs'
                                            />
                                        )}
                                    </div>
                                    {(typeof formattedBalance !== 'undefined' || !currency) && (
                                        <div className='acc-info__balance-section'>
                                            <Text
                                                data-testid='dt_balance'
                                                className={classNames('acc-info__balance', {
                                                    'acc-info__balance--no-currency': !currency && !isDemoAccount,
                                                })}
                                                size='s'
                                                color='primary'
                                                weight='bold'
                                            >
                                                {!currency ? (
                                                    <Localize i18n_default_text='No currency assigned' />
                                                ) : (
                                                    `${addComma(formattedBalance, 2)} ${getCurrencyDisplayCode(currency)}`
                                                )}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AccountInfoWrapper>
                    {!hasOnlyDemoAccounts && (
                        <AccountSwitcher
                            accounts={accounts}
                            current_loginid={loginid}
                            is_loading={isLoading}
                            error={error}
                            is_open={is_dropdown_open}
                            onClose={() => setIsDropdownOpen(false)}
                            onRefetch={refetch}
                            onAccountSwitch={onAccountSwitch}
                        />
                    )}
                </div>
            </React.Fragment>
        );
    }
);

AccountInfo.displayName = 'AccountInfo';

export default AccountInfo;
