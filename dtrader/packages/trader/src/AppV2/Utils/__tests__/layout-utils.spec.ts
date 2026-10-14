import { TRADE_TYPES } from '@deriv/shared';

import { checkIsServiceModalError, getChartHeight, isTradeParamVisible } from '../layout-utils';

describe('isTradeParamVisible', () => {
    it('should return correct value for expiration component key', () => {
        const common_args = {
            component_key: 'expiration',
            contract_type: TRADE_TYPES.MULTIPLIER,
            has_cancellation: false,
            symbol: 'cryBTCUSD',
        };
        expect(
            isTradeParamVisible({
                ...common_args,
            })
        ).toEqual(true);
        expect(
            isTradeParamVisible({
                ...common_args,
                symbol: '1HZ100V',
            })
        ).toEqual(false);
        expect(
            isTradeParamVisible({
                ...common_args,
                contract_type: TRADE_TYPES.ACCUMULATOR,
            })
        ).toEqual(false);
    });

    it('should return correct value for mult_info_display component key', () => {
        const common_args = {
            component_key: 'mult_info_display',
            contract_type: TRADE_TYPES.MULTIPLIER,
            has_cancellation: true,
            symbol: '1HZ100V',
        };
        expect(
            isTradeParamVisible({
                ...common_args,
            })
        ).toEqual(true);
        expect(
            isTradeParamVisible({
                ...common_args,
                has_cancellation: false,
            })
        ).toEqual(false);
    });
    it('should return false if there is no such contract type or component_key', () => {
        const common_args = {
            component_key: 'barrier',
            contract_type: TRADE_TYPES.HIGH_LOW,
            has_cancellation: false,
            symbol: '1HZ150V',
        };
        expect(
            isTradeParamVisible({
                ...common_args,
                component_key: 'mock_component_key',
            })
        ).toEqual(false);
        expect(
            isTradeParamVisible({
                ...common_args,
                contract_type: 'mock_contract_type',
            })
        ).toEqual(false);
    });
});

describe('getChartHeight', () => {
    const original_height = window.innerHeight;

    beforeAll(() => (window.innerHeight = 740));
    afterAll(() => (window.innerHeight = original_height));

    it('should return correct chart height', () => {
        const common_args = {
            contract_type: TRADE_TYPES.MATCH_DIFF,
            has_cancellation: false,
            is_accumulator: false,
            symbol: '1HZ100V',
        };
        // window.innerHeight (740) - HEADER (56) - TRADE_TYPE (48) - MARKET_SELECTOR (58) - TRADE_PARAM_SHEET (170) - BOTTOM_NAV (56) = 352
        // MATCH_DIFF is a digit type, so subtract DIGIT_INFO (56): 352 - 56 = 296
        const default_chart_height = 296;
        // base (352) - CHART_STATS (82) = 270
        const accumulators_chart_height = 270;
        // base (352) - ADDITIONAL_INFO (30) = 322
        const chart_height_with_additional_info = 322;
        // HIGH_LOW has no additional info components (barrier vs barrier_info)
        const high_low_chart_height = 352;

        expect(
            getChartHeight({
                ...common_args,
            })
        ).toEqual(default_chart_height);
        expect(
            getChartHeight({
                ...common_args,
                contract_type: TRADE_TYPES.ACCUMULATOR,
                is_accumulator: true,
            })
        ).toEqual(accumulators_chart_height);
        expect(
            getChartHeight({
                ...common_args,
                contract_type: TRADE_TYPES.MULTIPLIER,
                has_cancellation: true,
            })
        ).toEqual(chart_height_with_additional_info);
        expect(
            getChartHeight({
                ...common_args,
                contract_type: TRADE_TYPES.MULTIPLIER,
                symbol: 'cryBTCUSD',
            })
        ).toEqual(chart_height_with_additional_info);
        expect(
            getChartHeight({
                ...common_args,
                contract_type: TRADE_TYPES.VANILLA.CALL,
            })
        ).toEqual(chart_height_with_additional_info);
        expect(
            getChartHeight({
                ...common_args,
                contract_type: TRADE_TYPES.RISE_FALL,
            })
        ).toEqual(chart_height_with_additional_info);
        expect(
            getChartHeight({
                ...common_args,
                contract_type: TRADE_TYPES.HIGH_LOW,
            })
        ).toEqual(high_low_chart_height);
    });
});

describe('checkIsServiceModalError', () => {
    it('returns false if services_error is empty object', () => {
        expect(checkIsServiceModalError({ services_error: {} })).toBe(false);
    });
    it('returns true if services_error has appropriate code', () => {
        expect(checkIsServiceModalError({ services_error: { code: 'InsufficientBalance' } })).toBe(true);
    });
    it('returns true if services_error code is AuthorizationRequired and type is buy', () => {
        expect(checkIsServiceModalError({ services_error: { code: 'AuthorizationRequired', type: 'buy' } })).toBe(true);
    });
});
