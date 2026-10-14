import React from 'react';

import { render, screen } from '@testing-library/react';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import HigherLowerTradeDescription from '../higher-lower-trade-description';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('HigherLowerTradeDescription', () => {
    it('should render a proper content', () => {
        const mockOnTermClick = jest.fn();
        render(
            <HigherLowerTradeDescription contract_type={CONTRACT_LIST.HIGHER_LOWER} onTermClick={mockOnTermClick} />
        );

        const earnElements = screen.getAllByText(/earn a/i);
        expect(earnElements.length).toBeGreaterThan(0);
    });
});
