import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TermButton from '../term-button';

const RiseFallTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { ENTRY_SPOT, EXPIRY, PAYOUT, EXIT_SPOT } = getTerm();
    const [rise, fall] = CONTRACT_LIST.RISE_FALL.split('/');
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Rise/Fall lets you predict if the market price will end higher or lower than the <0>entry spot</0> at contract <1>expiry</1>.'
                    components={[
                        <TermButton key={0} term={ENTRY_SPOT} contract_type={contract_type} onTermClick={onTermClick}>
                            {ENTRY_SPOT}
                        </TermButton>,
                        <TermButton key={1} term={EXPIRY} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXPIRY}
                        </TermButton>,
                    ]}
                />
            ),
        },
        { type: 'heading', text: <Localize i18n_default_text='Rise' /> },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the <1>exit spot</1> is strictly higher than the entry spot.'
                    components={[
                        <TermButton key={0} term={PAYOUT} contract_type={contract_type} onTermClick={onTermClick}>
                            {PAYOUT}
                        </TermButton>,
                        <TermButton key={1} term={EXIT_SPOT} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXIT_SPOT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'video',
            text: rise,
        },
        { type: 'heading', text: <Localize i18n_default_text='Fall' /> },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a payout if the exit spot is strictly lower than the entry spot.' />
            ),
        },
        {
            type: 'video',
            text: fall,
        },
        { type: 'heading', text: <Localize i18n_default_text='Allow equals:' /> },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='For Rise, earn if the exit spot is higher than or equal to the entry spot.' />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='For Fall, earn if the exit spot is lower than or equal to the entry spot.' />
            ),
        },
    ];
    return <>{getContractDescription(content)}</>;
};

export default RiseFallTradeDescription;
