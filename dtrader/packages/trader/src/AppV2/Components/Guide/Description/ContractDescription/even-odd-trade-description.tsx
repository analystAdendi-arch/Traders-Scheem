import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TermButton from '../term-button';

const EvenOddTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { EXPIRY, EXIT_SPOT, PAYOUT } = getTerm();
    const [even, odd] = CONTRACT_LIST.EVEN_ODD.split('/');
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text="Even/Odd lets you predict if the last digit of the last tick's price will be an even or odd number at contract <0>expiry</0> (<1>exit spot</1>)."
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
        { type: 'heading', text: <Localize i18n_default_text='Even' /> },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Earn a <0>payout</0> if the last digit of the exit spot is even (0, 2, 4, 6, or 8).'
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
            text: even,
        },
        { type: 'heading', text: <Localize i18n_default_text='Odd' /> },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a payout if the last digit of the exit spot is odd (1, 3, 5, 7, or 9).' />
            ),
        },
        {
            type: 'video',
            text: odd,
        },
    ];
    return <>{getContractDescription(content)}</>;
};

export default EvenOddTradeDescription;
