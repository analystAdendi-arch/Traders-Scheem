import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TermButton from '../term-button';

const OverUnderTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { EXIT_SPOT, EXPIRY, PAYOUT } = getTerm();
    const [over, under] = CONTRACT_LIST.OVER_UNDER.split('/');
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Over/Under lets you predict if the last digit of the <0>exit spot</0> at contract <1>expiry</1> will be over or under your chosen number.'
                    components={[
                        <TermButton key={0} term={EXIT_SPOT} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXIT_SPOT}
                        </TermButton>,
                        <TermButton key={1} term={EXPIRY} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXPIRY}
                        </TermButton>,
                    ]}
                />
            ),
        },
        { type: 'heading', text: <Localize i18n_default_text='Over' /> },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the last digit of the exit spot is greater than your chosen number.'
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
            text: over,
        },
        { type: 'heading', text: <Localize i18n_default_text='Under' /> },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a payout if the last digit of the exit spot is less than your chosen number.' />
            ),
        },
        {
            type: 'video',
            text: under,
        },
    ];
    return <>{getContractDescription(content)}</>;
};

export default OverUnderTradeDescription;
