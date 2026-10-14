import React from 'react';

import { render, screen } from '@testing-library/react';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TouchNoTouchTradeDescription from '../touch-no-touch-trade-description';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('TouchNoTouchTradeDescription', () => {
    it('should render a proper content', () => {
        const mockOnTermClick = jest.fn();
        render(
            <TouchNoTouchTradeDescription contract_type={CONTRACT_LIST.TOUCH_NO_TOUCH} onTermClick={mockOnTermClick} />
        );

        const earnElements = screen.getAllByText(/earn a/i);
        expect(earnElements.length).toBeGreaterThan(0);
    });
});
