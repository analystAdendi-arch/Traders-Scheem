import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';

import TermButton from '../term-button';

const VanillasTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { STRIKE_PRICE, EXPIRY, EXIT_SPOT, PAYOUT, PAYOUT_PER_POINT, STAKE, CONTRACT_VALUE } = getTerm();
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text="Vanillas allow you to predict if the underlying asset's price will be above or below the <0>strike price</0> at contract <1>expiry</1> (<2>exit spot</2>)."
                    components={[
                        <TermButton key={0} term={STRIKE_PRICE} contract_type={contract_type} onTermClick={onTermClick}>
                            {STRIKE_PRICE}
                        </TermButton>,
                        <TermButton key={1} term={EXPIRY} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXPIRY}
                        </TermButton>,
                        <TermButton key={2} term={EXIT_SPOT} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXIT_SPOT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'heading',
            text: <Localize i18n_default_text='Call' />,
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the exit spot is above the strike price at expiry.'
                    components={[
                        <TermButton key={0} term={PAYOUT} contract_type={contract_type} onTermClick={onTermClick}>
                            {PAYOUT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'video',
            text: 'vanillas_call',
        },
        {
            type: 'heading',
            text: <Localize i18n_default_text='Put' />,
        },
        {
            type: 'paragraph',
            text: <Localize i18n_default_text='Earn a payout if the exit spot is below the strike price at expiry.' />,
        },
        {
            type: 'video',
            text: 'vanillas_put',
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Payout = <0>Payout per point</0> × Difference between exit spot and strike price'
                    components={[
                        <TermButton
                            key={0}
                            term={PAYOUT_PER_POINT}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {PAYOUT_PER_POINT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='You make a profit only if the payout is greater than your <0>stake</0>.'
                    components={[
                        <TermButton key={0} term={STAKE} contract_type={contract_type} onTermClick={onTermClick}>
                            {STAKE}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text="You may sell your contract up to 60 seconds before expiry. If you do, we'll pay you the <0>contract value</0>."
                    components={[
                        <TermButton
                            key={0}
                            term={CONTRACT_VALUE}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {CONTRACT_VALUE}
                        </TermButton>,
                    ]}
                />
            ),
        },
    ];

    return <>{getContractDescription(content)}</>;
};

export default VanillasTradeDescription;
