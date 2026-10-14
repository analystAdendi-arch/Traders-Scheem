import { TCommonStoreServicesError } from '@deriv/stores/types';

import { isDigitTradeType } from 'AppV2/Utils/digits';

import { getTradeParams } from './trade-params-utils';

export const HEIGHT = {
    HEADER: 56,
    TRADE_TYPE: 48,
    MARKET_SELECTOR: 58,
    CHART_STATS: 82,
    TRADE_PARAM_SHEET: 170,
    ADDITIONAL_INFO: 30,
    DIGIT_INFO: 56,
    BOTTOM_NAV: 56,
};

export const ASPECT_RATIO = 0.5625;

export const isTradeParamVisible = ({
    component_key,
    contract_type,
    has_cancellation,
    symbol,
}: {
    component_key: string;
    contract_type: string;
    has_cancellation: boolean;
    symbol: string;
}) => {
    const params = getTradeParams(symbol, has_cancellation)?.[contract_type] ?? {};
    return component_key in params;
};

export const getChartHeight = ({
    contract_type,
    has_cancellation,
    is_accumulator,
    symbol,
}: {
    contract_type: string;
    has_cancellation: boolean;
    is_accumulator: boolean;
    symbol: string;
}) => {
    let height =
        window.innerHeight -
        HEIGHT.HEADER -
        HEIGHT.TRADE_TYPE -
        HEIGHT.MARKET_SELECTOR -
        HEIGHT.TRADE_PARAM_SHEET -
        HEIGHT.BOTTOM_NAV;
    const isVisible = (component_key: string) =>
        isTradeParamVisible({ component_key, symbol, has_cancellation, contract_type });

    if (is_accumulator) {
        height -= HEIGHT.CHART_STATS;
    }

    if (isDigitTradeType(contract_type)) {
        height -= HEIGHT.DIGIT_INFO;
    }

    if (
        isVisible('expiration') ||
        isVisible('mult_info_display') ||
        isVisible('payout_per_point_info') ||
        isVisible('allow_equals') ||
        isVisible('payout') ||
        isVisible('barrier_info') ||
        isVisible('multipliers_info')
    ) {
        height -= HEIGHT.ADDITIONAL_INFO;
    }

    return height;
};

export const SERVICE_ERROR = {
    INSUFFICIENT_BALANCE: 'InsufficientBalance',
    INVALID_CONTRACT_PROPOSAL: 'InvalidContractProposal',
    AUTHORIZATION_REQUIRED: 'AuthorizationRequired',
    COMPANY_WIDE_LIMIT_EXCEEDED: 'CompanyWideLimitExceeded',
};

export const checkIsServiceModalError = ({ services_error }: { services_error: TCommonStoreServicesError }) => {
    const { code, type } = services_error || {};
    // Error modal is shown only for next four types. For the rest - snackbar.
    const is_insufficient_balance = code === SERVICE_ERROR.INSUFFICIENT_BALANCE;
    const is_authorization_required = code === SERVICE_ERROR.AUTHORIZATION_REQUIRED && type === 'buy';
    return is_insufficient_balance || is_authorization_required;
};
