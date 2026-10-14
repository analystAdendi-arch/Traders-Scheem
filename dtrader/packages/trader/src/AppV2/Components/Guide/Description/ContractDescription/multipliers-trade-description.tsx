import React from 'react';

import { Localize } from '@deriv-com/translations';

import { getContractDescription, getTerm } from 'AppV2/Utils/contract-description-utils';

import TermButton from '../term-button';

const MultipliersTradeDescription = ({
    contract_type,
    onTermClick,
}: {
    contract_type: string;
    onTermClick: (term: string) => void;
}) => {
    const { STOP_OUT_LEVEL, TAKE_PROFIT, STOP_LOSS, DEAL_CANCELLATION, SLIPPAGE_RISK } = getTerm();
    const content = [
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Multipliers let you amplify your potential profit or loss by applying a multiplier to the asset price movement.' />
            ),
        },
        {
            type: 'heading',
            text: <Localize i18n_default_text='Up' />,
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a profit if the asset price rises above the entry price at the time you close the trade.' />
            ),
        },
        {
            type: 'video',
            text: 'multipliers_up',
        },
        {
            type: 'heading',
            text: <Localize i18n_default_text='Down' />,
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Earn a profit if the asset price falls below the entry price at the time you close the trade.' />
            ),
        },
        {
            type: 'video',
            text: 'multipliers_down',
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='A fixed commission is charged when you open a Multipliers trade. The amount varies by asset class and market volatility.' />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize i18n_default_text='Profit/loss = (Percentage of price difference × multiplier × stake) − commission.' />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='Your trade closes automatically if the <0>stop out level</0> is hit.'
                    components={[
                        <TermButton
                            key={0}
                            term={STOP_OUT_LEVEL}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {STOP_OUT_LEVEL}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='You can manage risk with features like <0>take profit</0>, <1>stop loss</1>, and <2>deal cancellation</2> (when available).'
                    components={[
                        <TermButton key={0} term={TAKE_PROFIT} contract_type={contract_type} onTermClick={onTermClick}>
                            {TAKE_PROFIT}
                        </TermButton>,
                        <TermButton key={1} term={STOP_LOSS} contract_type={contract_type} onTermClick={onTermClick}>
                            {STOP_LOSS}
                        </TermButton>,
                        <TermButton
                            key={2}
                            term={DEAL_CANCELLATION}
                            contract_type={contract_type}
                            onTermClick={onTermClick}
                        >
                            {DEAL_CANCELLATION}
                        </TermButton>,
                    ]}
                />
            ),
        },
        {
            type: 'paragraph',
            text: (
                <Localize
                    i18n_default_text='You can close your trade anytime. However, be aware that <0>slippage risk</0> may affect your final return.'
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

export default MultipliersTradeDescription;
