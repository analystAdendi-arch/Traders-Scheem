import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';

import TermButton from '../term-button';

const TurbosTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { SPOT_PRICE, BARRIER, PAYOUT, PAYOUT_PER_POINT, EXIT_SPOT, STAKE, CONTRACT_VALUE, EXPIRY } = getTerm();
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text="Turbos allow you to predict the direction of the underlying asset's movements." />
            ),
        },
        {
            type: 'heading',
            text: <Localize i18n_default_text='Up' />,
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the <1>spot price</1> never falls below the <2>barrier</2> during the contract period.'
                    components={[
                        <TermButton key={0} term={PAYOUT} contract_type={contract_type} onTermClick={onTermClick}>
                            {PAYOUT}
                        </TermButton>,
                        <TermButton key={1} term={SPOT_PRICE} contract_type={contract_type} onTermClick={onTermClick}>
                            {SPOT_PRICE}
                        </TermButton>,
                        <TermButton key={2} term={BARRIER} contract_type={contract_type} onTermClick={onTermClick}>
                            {BARRIER}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'video',
            text: 'turbos_up',
        },
        {
            type: 'heading',
            text: <Localize i18n_default_text='Down' />,
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a payout if the spot price never rises above the barrier during the contract period.' />
            ),
        },
        {
            type: 'video',
            text: 'turbos_down',
        },
        {
            type: 'paragraph',
            text: <Localize i18n_default_text='If the barrier is breached at any time, your contract ends early.' />,
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Payout = <0>Payout per point</0> × Distance between <1>exit spot</1> and barrier'
                    components={[
                        <TermButton
                            key={0}
                            term={PAYOUT_PER_POINT}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {PAYOUT_PER_POINT}
                        </TermButton>,
                        <TermButton key={1} term={EXIT_SPOT} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXIT_SPOT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='You make a profit only if your payout is more than your <0>stake</0>.'
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
                    i18n_default_text="You may sell your contract up to 15 seconds before <0>expiry</0>. If you do, we'll pay you the <1>contract value</1>."
                    components={[
                        <TermButton key={0} term={EXPIRY} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXPIRY}
                        </TermButton>,
                        <TermButton
                            key={1}
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
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='If you set your duration in ticks, you cannot close the contract early.' />
            ),
        },
    ];

    return <>{getContractDescription(content)}</>;
};

export default TurbosTradeDescription;
