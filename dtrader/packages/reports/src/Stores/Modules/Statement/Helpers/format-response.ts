import { TStatementResponse } from '@deriv/api';
import { formatMoney, getMarketInformation, getSymbolDisplayName, toTitleCase } from '@deriv/shared';
import { localize } from '@deriv-com/translations';

export const formatStatementTransaction = (
    transaction: NonNullable<NonNullable<TStatementResponse['statement']>['transactions']>[number],
    currency: string
) => {
    const { action_type, contract_id, longcode, purchase_time, app_id } = transaction;
    const payout = transaction.payout ?? NaN;
    const amount = transaction.amount ?? NaN;
    const balance = transaction.balance_after ?? NaN;
    const should_exclude_currency = true;
    const shortcode = ['buy', 'sell'].includes(action_type ?? '') ? transaction.shortcode : null;
    const display_name = shortcode ? getSymbolDisplayName(getMarketInformation(shortcode).underlying) : '';

    return {
        action: localize(toTitleCase(action_type ?? '')), // 'Buy', 'Sell', 'Deposit', 'Withdrawal'
        display_name,
        refid: transaction.transaction_id,
        payout: isNaN(payout) ? '-' : formatMoney(currency, payout, should_exclude_currency),
        amount: isNaN(amount) ? '-' : formatMoney(currency, amount, should_exclude_currency),
        balance: isNaN(balance) ? '-' : formatMoney(currency, balance, should_exclude_currency),
        desc: longcode?.replace(/\n/g, '<br />'),
        id: contract_id,
        shortcode,
        action_type,
        purchase_time,
        transaction_time: transaction.transaction_time,
        app_id,
    };
};
