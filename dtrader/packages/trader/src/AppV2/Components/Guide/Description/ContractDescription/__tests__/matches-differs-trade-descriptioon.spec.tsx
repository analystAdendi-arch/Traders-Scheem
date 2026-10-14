import React from 'react';

import { render, screen } from '@testing-library/react';

import MatchesDiffersTradeDescription from '../matches-differs-trade-description';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

describe('MatchesDiffersTradeDescription', () => {
    it('should render a proper content', () => {
        const mockOnTermClick = jest.fn();
        render(
            <MatchesDiffersTradeDescription
                contract_type={CONTRACT_LIST.MATCHES_DIFFERS}
                onTermClick={mockOnTermClick}
            />
        );

        const earnElements = screen.getAllByText(/earn a/i);
        expect(earnElements.length).toBeGreaterThan(0);
    });
});
