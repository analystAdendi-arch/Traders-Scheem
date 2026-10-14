import React from 'react';

import { TooltipPortal } from '@deriv/components';
import { useDevice } from '@deriv-com/ui';

import { getTermDefinition } from 'AppV2/Utils/contract-description-utils';

export type TTermName =
    | 'Payout'
    | 'Entry Spot'
    | 'Exit Spot'
    | 'Spot Price'
    | 'Barrier'
    | 'Target'
    | 'Last Digit'
    | 'Stop Out Level'
    | 'Take Profit'
    | 'Stop Loss'
    | 'Deal Cancellation'
    | 'Slippage Risk';

type TTermButton = {
    term: TTermName | string;
    contract_type: string;
    onTermClick: (term: string) => void;
    children?: React.ReactNode;
};

const TermButton = ({ term, contract_type, onTermClick, children }: TTermButton) => {
    const { isMobile } = useDevice();
    const definition = getTermDefinition({ term, contract_type });

    if (isMobile) {
        return (
            <button
                className='description__content--definition'
                onClick={() => onTermClick(term)}
                aria-label={term}
                type='button'
            >
                {children}
            </button>
        );
    }

    return (
        <TooltipPortal message={definition} position='top' className='guide-definition-tooltip'>
            <button
                className='description__content--definition'
                onClick={() => onTermClick(term)}
                aria-label={term}
                type='button'
            >
                {children}
            </button>
        </TooltipPortal>
    );
};

export default TermButton;
