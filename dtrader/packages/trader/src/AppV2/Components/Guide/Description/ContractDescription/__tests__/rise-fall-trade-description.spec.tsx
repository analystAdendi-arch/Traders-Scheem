import React from 'react';

import { render, screen } from '@testing-library/react';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import RiseFallTradeDescription from '../rise-fall-trade-description';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('RiseFallTradeDescription', () => {
    it('should render a proper content', () => {
        const mockOnTermClick = jest.fn();
        render(<RiseFallTradeDescription contract_type={CONTRACT_LIST.RISE_FALL} onTermClick={mockOnTermClick} />);

        const earnElements = screen.getAllByText(/earn a/i);
        expect(earnElements.length).toBeGreaterThan(0);
    });
});
