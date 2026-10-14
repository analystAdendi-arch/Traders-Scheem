import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import AccumulatorsTradeDescription from '../accumulators-trade-description';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('AccumulatorsTradeDescription', () => {
    it('should render a proper content', () => {
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={jest.fn()} />);

        expect(screen.getByText(/Accumulators allow you to predict/i)).toBeInTheDocument();
        expect(screen.getByText(/Set a target payout to automatically close your contract/i)).toBeInTheDocument();
    });

    it('should call onTermClick if user clicks on term "growth rate"', async () => {
        const onTermClick = jest.fn();
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().GROWTH_RATE }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "range"', async () => {
        const onTermClick = jest.fn();
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().RANGE }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "previous spot price"', async () => {
        const onTermClick = jest.fn();
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().PREVIOUS_SPOT_PRICE }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "payout"', async () => {
        const onTermClick = jest.fn();
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().PAYOUT }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "Take profit"', async () => {
        const onTermClick = jest.fn();
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={onTermClick} />);

        const buttons = screen.getAllByRole('button', { name: getTerm().TAKE_PROFIT });
        await userEvent.click(buttons[buttons.length - 1]);

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "slippage risk"', async () => {
        const onTermClick = jest.fn();
        render(<AccumulatorsTradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().SLIPPAGE_RISK }));

        expect(onTermClick).toHaveBeenCalled();
    });
});
