import { TProfitTableResponse } from '@deriv/api';
import { formatMoney, getMarketInformation, getSymbolDisplayName } from '@deriv/shared';

export type TTransaction = NonNullable<NonNullable<TProfitTableResponse['profit_table']>['transactions']>[number];

export const formatProfitTableTransactions = (transaction: TTransaction, currency: string) => {
    const purchase_time_unix = transaction.purchase_time;
    const sell_time_unix = transaction.sell_time;
    const payout = transaction.payout ?? NaN;
    const sell_price = transaction.sell_price ?? NaN;
    const buy_price = transaction.buy_price ?? NaN;
    const profit_loss = formatMoney(currency, Number(sell_price - buy_price), true);
    const display_name = getSymbolDisplayName(getMarketInformation(transaction.shortcode ?? '').underlying);

    return {
        ...transaction,
        ...{
            payout,
            sell_price,
            buy_price,
            profit_loss,
            sell_time_unix,
            purchase_time_unix,
            display_name,
        },
    };
};
