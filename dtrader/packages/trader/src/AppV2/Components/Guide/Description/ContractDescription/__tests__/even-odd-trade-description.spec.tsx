import React from 'react';

import { render, screen } from '@testing-library/react';

import EvenOddTradeDescription from '../even-odd-trade-description';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('EvenOddTradeDescription ', () => {
    it('should render a proper content', () => {
        const mockOnTermClick = jest.fn();
        render(<EvenOddTradeDescription contract_type={CONTRACT_LIST.EVEN_ODD} onTermClick={mockOnTermClick} />);

        const earnElements = screen.getAllByText(/earn a/i);
        expect(earnElements.length).toBeGreaterThan(0);
    });
});
