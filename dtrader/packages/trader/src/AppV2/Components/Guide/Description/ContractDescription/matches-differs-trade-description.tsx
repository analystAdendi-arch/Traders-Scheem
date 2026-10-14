import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TermButton from '../term-button';

const MatchesDiffersTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { EXPIRY, EXIT_SPOT, PAYOUT } = getTerm();
    const [matches, differs] = CONTRACT_LIST.MATCHES_DIFFERS.split('/');
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text="Matches/Differs lets you predict whether the last digit of the last tick's price will match your chosen number at contract <0>expiry</0> (<1>exit spot</1>)."
                    components={[
                        <TermButton key={0} term={EXPIRY} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXPIRY}
                        </TermButton>,
                        <TermButton key={1} term={EXIT_SPOT} contract_type={contract_type} onTermClick={onTermClick}>
                            {EXIT_SPOT}
                        </TermButton>,
                    ]}
                />
            ),
        },
        { type: 'heading', text: <Localize i18n_default_text='Matches' /> },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the last digit of the exit spot matches your prediction.'
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
            text: matches,
        },
        { type: 'heading', text: <Localize i18n_default_text='Differs' /> },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a payout if the last digit of the exit spot differs from your prediction.' />
            ),
        },
        {
            type: 'video',
            text: differs,
        },
    ];
    return <>{getContractDescription(content)}</>;
};

export default MatchesDiffersTradeDescription;
