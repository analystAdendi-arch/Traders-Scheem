import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';

import TermButton from '../term-button';

const TouchNoTouchTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { BARRIER, PAYOUT, EXPIRY } = getTerm();
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Touch/No Touch lets you predict if the market price will reach a set <0>barrier</0> at any time during the contract period.'
                    components={[
                        <TermButton key={0} term={BARRIER} contract_type={contract_type} onTermClick={onTermClick}>
                            {BARRIER}
                        </TermButton>,
                    ]}
                />
            ),
        },
        { type: 'heading', text: <Localize i18n_default_text='Touch' /> },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the market touches the barrier at any time before <1>expiry</1>.'
                    components={[
                        <TermButton key={0} term={PAYOUT} contract_type={contract_type} onTermClick={onTermClick}>
                            {PAYOUT}
                        </TermButton>,
                        <TermButton key={1} term={EXPIRY} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXPIRY}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'video',
            text: 'touch',
        },
        { type: 'heading', text: <Localize i18n_default_text='No Touch' /> },
        {
            type: 'paragraph',
            text: <Localize i18n_default_text='Earn a payout if the market never touches the barrier before expiry.' />,
        },
        {
            type: 'video',
            text: 'no_touch',
        },
    ];
    return <>{getContractDescription(content)}</>;
};

export default TouchNoTouchTradeDescription;
