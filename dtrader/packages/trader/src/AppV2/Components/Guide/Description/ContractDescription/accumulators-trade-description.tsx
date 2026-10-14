import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TermButton from '../term-button';

const AccumulatorsTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { INDEX, STAKE, GROWTH_RATE, PAYOUT, SPOT_PRICE, RANGE, PREVIOUS_SPOT_PRICE, TAKE_PROFIT, SLIPPAGE_RISK } =
        getTerm();
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Accumulators allow you to predict how much an <0>index</0> can move and potentially grow your <1>stake</1> exponentially at a fixed <2>growth rate</2>.'
                    components={[
                        <TermButton key={0} term={INDEX} contract_type={contract_type} onTermClick={onTermClick}>
                            {INDEX}
                        </TermButton>,
                        <TermButton key={1} term={STAKE} contract_type={contract_type} onTermClick={onTermClick}>
                            {STAKE}
                        </TermButton>,
                        <TermButton key={2} term={GROWTH_RATE} contract_type={contract_type} onTermClick={onTermClick}>
                            {GROWTH_RATE}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Your <0>payout</0> is the sum of your initial stake and profit. It keeps growing as long as the <1>spot price</1> stays within a specified barrier <2>range</2> from the <3>previous spot price</3> at each interval.'
                    components={[
                        <TermButton key={0} term={PAYOUT} contract_type={contract_type} onTermClick={onTermClick}>
                            {PAYOUT}
                        </TermButton>,
                        <TermButton key={1} term={SPOT_PRICE} contract_type={contract_type} onTermClick={onTermClick}>
                            {SPOT_PRICE}
                        </TermButton>,
                        <TermButton key={2} term={RANGE} contract_type={contract_type} onTermClick={onTermClick}>
                            {RANGE}
                        </TermButton>,
                        <TermButton
                            key={3}
                            term={PREVIOUS_SPOT_PRICE}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {PREVIOUS_SPOT_PRICE}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='If the spot price goes outside that range, you lose your stake and the trade is terminated.' />
            ),
        },
        {
            type: 'video',
            text: CONTRACT_LIST.ACCUMULATORS,
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='<0>Take profit</0>: Set a target payout to automatically close your contract and secure your gains (not available for ongoing trades).'
                    components={[
                        <TermButton key={0} term={TAKE_PROFIT} contract_type={contract_type} onTermClick={onTermClick}>
                            {TAKE_PROFIT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='You can close your trade anytime. However, be aware of <0>slippage risk</0>.'
                    components={[
                        <TermButton
                            key={0}
                            term={SLIPPAGE_RISK}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {SLIPPAGE_RISK}
                        </TermButton>,
                    ]}
                />
            ),
        },
    ];

    return <>{getContractDescription(content)}</>;
};

export default AccumulatorsTradeDescription;
