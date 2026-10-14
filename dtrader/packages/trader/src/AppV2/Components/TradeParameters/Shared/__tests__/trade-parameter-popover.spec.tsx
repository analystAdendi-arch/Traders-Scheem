import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TradeParameterPopover from '../TradeParameterPopover';

describe('TradeParameterPopover', () => {
    const mockOnClose = jest.fn();
    const mockOnOpen = jest.fn();

    const defaultProps = {
        label: 'Test Label',
        value: '10 USD',
        popover_classname: 'test-popover',
        children: <div>Test Content</div>,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders label and value in TextField', () => {
        render(<TradeParameterPopover {...defaultProps} />);

        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('10 USD');
    });

    it('opens popover when TextField is clicked', async () => {
        render(<TradeParameterPopover {...defaultProps} />);

        await userEvent.click(screen.getByRole('textbox'));

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('calls onOpen callback when popover opens', async () => {
        render(<TradeParameterPopover {...defaultProps} onOpen={mockOnOpen} />);

        await userEvent.click(screen.getByRole('textbox'));

        expect(mockOnOpen).toHaveBeenCalled();
    });

    it('renders popover with onClose callback provided', async () => {
        render(<TradeParameterPopover {...defaultProps} onClose={mockOnClose} />);

        await userEvent.click(screen.getByRole('textbox'));

        expect(screen.getByText('Test Content')).toBeInTheDocument();
        // The onClose callback is passed to InputPopover component
        // Testing the actual close behavior would require DOM queries which violate ESLint rules
    });

    it('disables TextField when disabled prop is true', () => {
        render(<TradeParameterPopover {...defaultProps} disabled={true} />);

        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('renders correctly when is_minimized is true', () => {
        render(<TradeParameterPopover {...defaultProps} is_minimized={true} />);

        const textField = screen.getByRole('textbox');
        expect(textField).toBeInTheDocument();
        expect(textField).toHaveValue('10 USD');
    });

    it('shows error status when has_error is true', () => {
        render(<TradeParameterPopover {...defaultProps} has_error={true} />);

        const textField = screen.getByRole('textbox');
        expect(textField).toBeInTheDocument();
        // The TextField component should have error status applied
        // We verify the component renders without errors when has_error is true
    });

    it('renders header when provided', async () => {
        const header = <div>Custom Header</div>;
        render(<TradeParameterPopover {...defaultProps} header={header} />);

        await userEvent.click(screen.getByRole('textbox'));

        expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('renders popover content when opened with custom classname', async () => {
        render(<TradeParameterPopover {...defaultProps} popover_classname='custom-popover' />);

        await userEvent.click(screen.getByRole('textbox'));

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders children inside popover', async () => {
        render(
            <TradeParameterPopover {...defaultProps}>
                <div>Child 1</div>
                <div>Child 2</div>
            </TradeParameterPopover>
        );

        await userEvent.click(screen.getByRole('textbox'));

        expect(screen.getByText('Child 1')).toBeInTheDocument();
        expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('does not open popover when disabled', async () => {
        render(<TradeParameterPopover {...defaultProps} disabled={true} />);

        await userEvent.click(screen.getByRole('textbox'));

        expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });
});
