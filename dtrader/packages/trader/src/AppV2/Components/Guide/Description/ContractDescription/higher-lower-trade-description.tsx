import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TermButton from '../term-button';

const HigherLowerTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { BARRIER, EXPIRY, EXIT_SPOT, PAYOUT } = getTerm();
    const [higher, lower] = CONTRACT_LIST.HIGHER_LOWER.split('/');
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Higher/Lower lets you predict if the market price will end higher or lower than a set <0>barrier</0> at contract <1>expiry</1> (<2>exit spot</2>).'
                    components={[
                        <TermButton key={0} term={BARRIER} contract_type={contract_type} onTermClick={onTermClick}>
                            {BARRIER}
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
        { type: 'heading', text: <Localize i18n_default_text='Higher' /> },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the exit spot is strictly higher than the barrier.'
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
            text: higher,
        },
        { type: 'heading', text: <Localize i18n_default_text='Lower' /> },
        {
            type: 'paragraph',
            text: <Localize i18n_default_text='Earn a payout if the exit spot is strictly lower than the barrier.' />,
        },
        {
            type: 'video',
            text: lower,
        },
        {
            type: 'paragraph',
            text: <Localize i18n_default_text="If the exit spot is equal to the barrier, you don't earn the payout." />,
        },
    ];
    return <>{getContractDescription(content)}</>;
};

export default HigherLowerTradeDescription;
