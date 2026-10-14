import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getTerm } from 'AppV2/Utils/contract-description-utils';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import VanillasTradeDescription from '../vanillas-trade-description';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('VanillasTradeDescription', () => {
    it('should render a proper content', () => {
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={jest.fn()} />);

        expect(screen.getByText(/Vanillas allow you to predict if the underlying asset/i)).toBeInTheDocument();
    });

    it('should call onTermClick if user clicks on term "payout"', async () => {
        const onTermClick = jest.fn();
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().PAYOUT }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "exit spot"', async () => {
        const onTermClick = jest.fn();
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().EXIT_SPOT }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "strike price"', async () => {
        const onTermClick = jest.fn();
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().STRIKE_PRICE }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "expiry"', async () => {
        const onTermClick = jest.fn();
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().EXPIRY }));

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "payout per point"', async () => {
        const onTermClick = jest.fn();
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={onTermClick} />);

        const buttons = screen.getAllByRole('button', { name: getTerm().PAYOUT_PER_POINT });
        await userEvent.click(buttons[buttons.length - 1]);

        expect(onTermClick).toHaveBeenCalled();
    });

    it('should call onTermClick if user clicks on term "contract value"', async () => {
        const onTermClick = jest.fn();
        render(<VanillasTradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={onTermClick} />);

        await userEvent.click(screen.getByRole('button', { name: getTerm().CONTRACT_VALUE }));

        expect(onTermClick).toHaveBeenCalled();
    });
});
