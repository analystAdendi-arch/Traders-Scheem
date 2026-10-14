import React from 'react';
import classNames from 'classnames';

import type { TDerivativesAccount } from '@deriv/api';
import { Skeleton, Text } from '@deriv/components';
import { StandaloneArrowsRotateRegularIcon, StandaloneCircleExclamationRegularIcon } from '@deriv/quill-icons';
import { addComma, getCurrencyDisplayCode } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { ActionSheet, Button } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

type TAccountSwitcherProps = {
    accounts: TDerivativesAccount[];
    current_loginid: string | undefined;
    is_loading: boolean;
    error: Error | null;
    is_open?: boolean;
    onClose?: () => void;
    onRefetch?: () => void;
    onAccountSwitch?: () => void;
};

/**
 * AccountSwitcher Component
 * Handles displaying account list in either ActionSheet (mobile) or dropdown (desktop)
 */
const AccountSwitcher = observer(
    ({
        accounts,
        current_loginid,
        is_loading,
        error,
        is_open = true,
        onClose,
        onRefetch,
        onAccountSwitch,
    }: TAccountSwitcherProps) => {
        const { isMobile } = useDevice();
        const { client } = useStore();

        const handleAccountClick = (account: TDerivativesAccount) => {
            // Switch account if different from current
            if (account.account_id !== current_loginid) {
                // Notify parent that account switch is starting (fire-and-forget)
                onAccountSwitch?.();

                // Note: switchAccount is fire-and-forget - it updates localStorage and reconnects WebSocket
                // The parent component's loading state will be reset when new data arrives via useDerivativesAccount
                client.switchAccount(account.account_id, account.account_type);
            }

            // Close dropdown/sheet after switching
            onClose?.();
        };

        const handleRefreshClick = () => {
            onRefetch?.();
        };

        // Render account list content
        const renderContent = () => {
            if (is_loading) {
                return (
                    <div className='acc-switcher__wrapper'>
                        <div className='acc-switcher__loader'>
                            <Skeleton className='acc-switcher__loader-skeleton' />
                            <Skeleton className='acc-switcher__loader-skeleton' />
                        </div>
                    </div>
                );
            }

            if (error || !accounts || accounts.length === 0) {
                return (
                    <div className='acc-switcher__wrapper'>
                        <div className='acc-switcher__error-container'>
                            <div className='acc-switcher__error-items'>
                                <div className='acc-switcher__error-message'>
                                    <StandaloneCircleExclamationRegularIcon
                                        iconSize='sm'
                                        fill='var(--color-text-warning)'
                                    />
                                    <Text size='xs' color='secondary'>
                                        <Localize i18n_default_text='Failed to load' />
                                    </Text>
                                </div>
                                <Button
                                    className='acc-switcher__refresh-button'
                                    onClick={handleRefreshClick}
                                    variant='secondary'
                                    color='black-white'
                                    size={isMobile ? 'lg' : 'md'}
                                    fullWidth
                                    label={<Localize i18n_default_text='Refresh' />}
                                >
                                    <StandaloneArrowsRotateRegularIcon iconSize='sm' />
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className='acc-switcher__wrapper'>
                    <div className='acc-switcher__accounts'>
                        {[...accounts]
                            .sort((a, b) => {
                                // Sort real accounts first, then demo accounts
                                if (a.account_type === 'real' && b.account_type === 'demo') return -1;
                                if (a.account_type === 'demo' && b.account_type === 'real') return 1;
                                return 0;
                            })
                            .map(account => {
                                const is_selected = account.account_id === current_loginid;
                                const formatted_balance = addComma(account.balance, 2);
                                const currency_display = getCurrencyDisplayCode(account.currency);
                                const account_type_label =
                                    account.account_type === 'real' ? (
                                        <Localize i18n_default_text='Real account' />
                                    ) : (
                                        <Localize i18n_default_text='Demo account' />
                                    );

                                return (
                                    <button
                                        key={account.account_id}
                                        className={classNames('acc-switcher__account', {
                                            'acc-switcher__account--selected': is_selected,
                                        })}
                                        onClick={() => handleAccountClick(account)}
                                        disabled={is_selected}
                                        aria-label={`${account.account_type === 'real' ? 'Real' : 'Demo'} account ${
                                            account.account_id
                                        } with balance ${formatted_balance} ${currency_display}`}
                                        aria-current={is_selected ? 'true' : undefined}
                                        data-testid={`dt_account_item_${account.account_id}`}
                                        type='button'
                                    >
                                        <div className='acc-switcher__account-details'>
                                            <Text
                                                size='xs'
                                                color={
                                                    account.account_type === 'demo' ? 'tertiary' : 'secondary-alternate'
                                                }
                                            >
                                                {account_type_label}
                                            </Text>
                                            <Text size='s' color='primary' weight='bold'>
                                                {formatted_balance} {currency_display}
                                            </Text>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            );
        };

        // For mobile: wrap in ActionSheet
        if (isMobile && is_open && onClose) {
            return (
                <ActionSheet.Root isOpen={is_open} onClose={onClose} expandable={false}>
                    <ActionSheet.Portal showHandlebar shouldCloseOnDrag>
                        <div className='account-switcher-action-sheet'>{renderContent()}</div>
                    </ActionSheet.Portal>
                </ActionSheet.Root>
            );
        }

        // For desktop: render dropdown directly (only if open)
        if (!isMobile && is_open) {
            return renderContent();
        }

        // If not open, render nothing
        return null;
    }
);

export default AccountSwitcher;
