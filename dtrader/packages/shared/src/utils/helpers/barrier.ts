type TContract = {
    high_barrier?: null | string;
    barriers?: number;
    barrier?: null | string;
    low_barrier?: null | string;
    expiry_type: string;
    contract_category?: string;
};

type TObjectBarrier = Pick<TContract, 'barrier' | 'low_barrier' | 'high_barrier'>;

export const buildBarriersConfig = (contract: TContract, barriers = { count: contract.barriers }) => {
    // Rise/Fall contracts should not have barriers, even if API incorrectly returns barriers > 0
    if (contract.contract_category === 'callput') {
        return undefined;
    }

    if (!contract.barriers) {
        return undefined;
    }

    const obj_barrier: TObjectBarrier = {};

    ['barrier', 'low_barrier', 'high_barrier'].forEach(field => {
        if (field in contract) obj_barrier[field as keyof TObjectBarrier] = contract[field as keyof TObjectBarrier];
    });

    return Object.assign(barriers || {}, {
        [contract.expiry_type]: obj_barrier,
    });
};

export const getBarrierPipSize = (barrier: string) => {
    if (!barrier || barrier.length < 1 || isNaN(+barrier)) return 0;
    return barrier.split('.')[1]?.length || 0;
};
