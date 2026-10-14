import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';

import { useDerivativesAccount, useMobileBridge } from '@deriv/api';
import { Button, Skeleton, Text } from '@deriv/components';
import { getBrandUrl, getSignupUrl, openExternalUrl } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';

import { LoginButton } from './login-button';

import 'Sass/app/_common/components/account-switcher.scss';

const AccountInfo = React.lazy(
    () =>
        import(/* webpackChunkName: "account-info", webpackPreload: true */ 'App/Components/Layout/Header/account-info')
);

const AccountActionsComponent = observer(() => {
    const { client, common, ui } = useStore();
    const { currency, is_logged_in, loginid } = client;
    const { is_switching_account, setIsSwitchingAccount } = ui;

    const { localize } = useTranslations();
    const { sendBridgeEvent } = useMobileBridge();

    // Fetch derivatives accounts to determine button type (single source of truth)
    const { data, isLoading, error, refetch } = useDerivativesAccount(loginid, is_logged_in);
    const accounts = data?.data || [];

    // Handle account switch start
    const handleAccountSwitchStart = React.useCallback(() => {
        setIsSwitchingAccount(true);
    }, [setIsSwitchingAccount]);

    // Reset switching state when loading completes with either data or error
    React.useEffect(() => {
        if (!isLoading && (accounts.length > 0 || error)) {
            setIsSwitchingAccount(false);
        }
    }, [isLoading, accounts, error, setIsSwitchingAccount]);

    // Determine account types available
    const hasOnlyDemoAccounts = accounts.length > 0 && accounts.every(acc => acc.account_type === 'demo');

    // Button logic:
    // - If only demo accounts exist -> show "Try real"
    // - Otherwise (real only or both real and demo) -> show "Deposit"
    const buttonLabel = hasOnlyDemoAccounts ? localize('Try real') : localize('Deposit');

    const handleTransferClick = () => {
        if (hasOnlyDemoAccounts) {
            // Show modal instead of redirecting directly
            ui.toggleTryRealModal(true);
        } else {
            // Deposit button (for both account types or real-only accounts)
            const brandUrl = getBrandUrl();
            const lang_param = common.current_language ? `&lang=${common.current_language}` : '';
            sendBridgeEvent('trading:transfer', () => {
                openExternalUrl(`${brandUrl}/transfer?from=dtrader&source=options&acc=options&curr=${currency}${lang_param}`);
            });
        }
    };

    const renderAccountInfo = () => (
        <React.Suspense fallback={<div />}>
            <AccountInfo
                accounts={accounts}
                isLoading={isLoading}
                error={error}
                refetch={refetch}
                onAccountSwitch={handleAccountSwitchStart}
            />
            <Button
                className='acc-info__transfer-button'
                onClick={handleTransferClick}
                aria-label={buttonLabel}
                type='button'
                has_effect
            >
                <Text size='xs' weight='bold' color='white'>
                    {buttonLabel}
                </Text>
            </Button>
        </React.Suspense>
    );

    if (!is_logged_in) {
        const signup_url = getSignupUrl();
        return (
            <div
                id='dt_core_header_acc-info-container'
                className={classNames('acc-info__container', {
                    'acc-info__container--logged-out': !is_logged_in,
                })}
            >
                <Button
                    id='dt_signup_button'
                    className='acc-info__button'
                    has_effect
                    text={localize('Sign up')}
                    onClick={() => window.open(signup_url, '_blank', 'noopener,noreferrer')}
                    secondary
                />
                <LoginButton className='acc-info__button' />
            </div>
        );
    }

    const shouldShowLoader = isLoading || is_switching_account;

    return (
        <div
            id='dt_core_header_acc-info-container'
            className={classNames('acc-info__container', {
                'acc-info__container--loading': shouldShowLoader,
            })}
        >
            {shouldShowLoader ? (
                <React.Fragment>
                    <Skeleton height={32} width={120} borderRadius={16} />
                    <Skeleton height={32} width={80} borderRadius={16} />
                </React.Fragment>
            ) : (
                renderAccountInfo()
            )}
        </div>
    );
});

AccountActionsComponent.displayName = 'AccountActions';

const AccountActions = React.memo(AccountActionsComponent);

export { AccountActions };
