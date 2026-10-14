import { useDevice } from '@deriv-com/ui';
import { fireEvent, render, screen } from '@testing-library/react';

import TermButton from '../term-button';

jest.mock('@deriv-com/ui', () => ({
    useDevice: jest.fn(),
}));

describe('TermButton', () => {
    const mockOnTermClick = jest.fn();
    const defaultProps = {
        term: 'Payout',
        contract_type: 'multiplier',
        onTermClick: mockOnTermClick,
        children: 'payout',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Mobile rendering', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        });

        it('should render button with correct text on mobile', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('payout');
        });

        it('should have correct CSS class on mobile', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            expect(button).toHaveClass('description__content--definition');
        });

        it('should call onTermClick with correct term when clicked on mobile', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledTimes(1);
            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });

        it('should have type="button" attribute on mobile', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            expect(button).toHaveAttribute('type', 'button');
        });

        it('should have aria-label attribute on mobile', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            expect(button).toHaveAttribute('aria-label', 'Payout');
        });
    });

    describe('Desktop rendering', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: false });
        });

        it('should render button wrapped in tooltip on desktop', () => {
            render(<TermButton {...defaultProps} />);

            // Check for button with aria-label
            const button = screen.getByRole('button', { name: 'Payout' });
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('payout');
        });

        it('should have correct CSS class on inner button on desktop', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: 'Payout' });
            expect(button).toHaveClass('description__content--definition');
        });

        it('should call onTermClick when inner button is clicked on desktop', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: 'Payout' });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledTimes(1);
            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });

        it('should have type="button" attribute on inner button on desktop', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: 'Payout' });
            expect(button).toHaveAttribute('type', 'button');
        });

        it('should have aria-label attribute on inner button on desktop', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: 'Payout' });
            expect(button).toHaveAttribute('aria-label', 'Payout');
        });
    });

    describe('Different terms', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        });

        it('should handle "Entry Spot" term correctly', () => {
            render(
                <TermButton {...defaultProps} term='Entry Spot'>
                    entry spot
                </TermButton>
            );

            const button = screen.getByRole('button', { name: /entry spot/i });
            expect(button).toHaveTextContent('entry spot');
            expect(button).toHaveAttribute('aria-label', 'Entry Spot');

            fireEvent.click(button);
            expect(mockOnTermClick).toHaveBeenCalledWith('Entry Spot');
        });

        it('should handle "Stop Out Level" term correctly', () => {
            render(
                <TermButton {...defaultProps} term='Stop Out Level'>
                    stop out level
                </TermButton>
            );

            const button = screen.getByRole('button', { name: /stop out level/i });
            expect(button).toHaveTextContent('stop out level');
            expect(button).toHaveAttribute('aria-label', 'Stop Out Level');

            fireEvent.click(button);
            expect(mockOnTermClick).toHaveBeenCalledWith('Stop Out Level');
        });

        it('should handle "Take Profit" term correctly', () => {
            render(
                <TermButton {...defaultProps} term='Take Profit'>
                    take profit
                </TermButton>
            );

            const button = screen.getByRole('button', { name: /take profit/i });
            expect(button).toHaveTextContent('take profit');
            expect(button).toHaveAttribute('aria-label', 'Take Profit');

            fireEvent.click(button);
            expect(mockOnTermClick).toHaveBeenCalledWith('Take Profit');
        });
    });

    describe('Different contract types', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        });

        it('should work with accumulator contract type', () => {
            render(<TermButton {...defaultProps} contract_type='accumulator' />);

            const button = screen.getByRole('button', { name: /payout/i });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });

        it('should work with turbos contract type', () => {
            render(<TermButton {...defaultProps} contract_type='turbos' />);

            const button = screen.getByRole('button', { name: /payout/i });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });

        it('should work with vanillas contract type', () => {
            render(<TermButton {...defaultProps} contract_type='vanillas' />);

            const button = screen.getByRole('button', { name: /payout/i });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        });

        it('should be keyboard accessible', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            button.focus();

            expect(button).toHaveFocus();
        });

        it('should trigger onClick on button click', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledTimes(1);
            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });
    });

    describe('Edge cases', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        });

        it('should handle empty children gracefully', () => {
            render(<TermButton {...defaultProps}>{''}</TermButton>);

            const button = screen.getByRole('button', { name: 'Payout' });
            expect(button).toBeInTheDocument();
        });

        it('should call onTermClick on each click', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: /payout/i });
            fireEvent.click(button);
            fireEvent.click(button);
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledTimes(3);
            expect(mockOnTermClick).toHaveBeenCalledWith('Payout');
        });

        it('should handle special characters in term', () => {
            render(
                <TermButton {...defaultProps} term='Payout/Loss'>
                    payout/loss
                </TermButton>
            );

            const button = screen.getByRole('button', { name: /payout\/loss/i });
            fireEvent.click(button);

            expect(mockOnTermClick).toHaveBeenCalledWith('Payout/Loss');
        });
    });

    describe('Desktop tooltip interaction', () => {
        beforeEach(() => {
            (useDevice as jest.Mock).mockReturnValue({ isMobile: false });
        });

        it('should render tooltip wrapper on desktop', () => {
            render(<TermButton {...defaultProps} />);

            const button = screen.getByRole('button', { name: 'Payout' });
            expect(button).toBeInTheDocument();
        });
    });
});
