import { buildBarriersConfig } from '../barrier';

describe('buildBarriersConfig', () => {
    const higher_lower_contract = {
        contract_category: 'higherLower',
        contract_category_display: 'Higher/Lower',
        contract_display: 'Higher',
        contract_type: 'CALL',
        exchange_name: 'FOREX',
        expiry_type: 'daily',
        market: 'forex',
        max_contract_duration: '365d',
        min_contract_duration: '1d',
        sentiment: 'up',
        start_type: 'spot',
        submarket: 'major_pairs',
        underlying_symbol: 'frxAUDJPY',
    };

    const rise_fall_contract = {
        contract_category: 'callput',
        contract_category_display: 'Up/Down',
        contract_display: 'Rise',
        contract_type: 'CALL',
        exchange_name: 'RANDOM',
        expiry_type: 'daily',
        market: 'synthetic_index',
        max_contract_duration: '365d',
        min_contract_duration: '1d',
        sentiment: 'up',
        start_type: 'spot',
        submarket: 'random_index',
        underlying_symbol: 'R_100',
    };
    it('Returns Undefined if contract has no barriers', () => {
        const contract = {
            ...higher_lower_contract,
        };
        expect(buildBarriersConfig(contract)).toBeUndefined();
    });

    it('Returns barriers with added values when contract has barrier but equals to zero', () => {
        const contract = {
            ...higher_lower_contract,
            barriers: 0,
        };
        expect(buildBarriersConfig(contract)).toBeUndefined();
    });

    it('Returns undefined for Rise/Fall contracts even when barriers > 0', () => {
        const contract = {
            ...rise_fall_contract,
            barriers: 1,
            barrier: '1234.56',
        };
        expect(buildBarriersConfig(contract)).toBeUndefined();
    });

    it('Returns barriers with including empty object when Higher/Lower contract has barriers but not values', () => {
        const contract = {
            ...higher_lower_contract,
            barriers: 1,
        };
        expect(buildBarriersConfig(contract)).toEqual({
            count: 1,
            daily: {},
        });
    });

    it('Returns barriers with added values when Higher/Lower contract has barriers', () => {
        const contract = {
            ...higher_lower_contract,
            barriers: 1,
            low_barrier: '22',
            barrier: '33',
            high_barrier: '44',
        };
        expect(buildBarriersConfig(contract)).toEqual({
            count: 1,
            daily: {
                low_barrier: '22',
                barrier: '33',
                high_barrier: '44',
            },
        });
    });

    it('Returns barriers with some of the values when Higher/Lower contract has barriers and some of the values', () => {
        const contract = {
            ...higher_lower_contract,
            barriers: 1,
            low_barrier: '22',
            barrier: '33',
        };
        expect(buildBarriersConfig(contract)).toEqual({
            count: 1,
            daily: {
                low_barrier: '22',
                barrier: '33',
            },
        });
    });

    it('Returns undefined for Rise/Fall contracts regardless of expiry_type', () => {
        const contract = {
            ...rise_fall_contract,
            barriers: 1,
            expiry_type: 'intraday',
            barrier: '1234.56',
        };
        expect(buildBarriersConfig(contract)).toBeUndefined();
    });
});
