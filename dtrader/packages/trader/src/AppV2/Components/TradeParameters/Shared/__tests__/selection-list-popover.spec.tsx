import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectionListPopover from '../SelectionListPopover';
import { useTradeParameterPopover } from '../TradeParameterPopover';

jest.mock('../TradeParameterPopover', () => ({
    useTradeParameterPopover: jest.fn(),
}));

describe('SelectionListPopover', () => {
    const mockOnSelect = jest.fn();
    const mockClosePopover = jest.fn();

    const numberOptions = [
        { value: 1, label: 'Option 1' },
        { value: 2, label: 'Option 2' },
        { value: 3, label: 'Option 3' },
    ];

    const stringOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
    ];

    const defaultProps = {
        options: numberOptions,
        selectedValue: 2,
        onSelect: mockOnSelect,
        className: 'test-popover',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useTradeParameterPopover as jest.Mock).mockReturnValue({
            closePopover: mockClosePopover,
        });
    });

    describe('Rendering', () => {
        it('renders all options', () => {
            render(<SelectionListPopover {...defaultProps} />);

            expect(screen.getByText('Option 1')).toBeInTheDocument();
            expect(screen.getByText('Option 2')).toBeInTheDocument();
            expect(screen.getByText('Option 3')).toBeInTheDocument();
        });

        it('renders with correct className', () => {
            render(<SelectionListPopover {...defaultProps} />);

            const listbox = screen.getByRole('listbox');
            expect(listbox).toHaveClass('test-popover__content');
        });

        it('renders options as buttons', () => {
            render(<SelectionListPopover {...defaultProps} />);

            const buttons = screen.getAllByRole('option');
            expect(buttons).toHaveLength(3);
        });

        it('applies selected class to the selected option', () => {
            render(<SelectionListPopover {...defaultProps} selectedValue={2} />);

            const buttons = screen.getAllByRole('option');
            const option2Button = buttons.find(btn => btn.textContent === 'Option 2');
            expect(option2Button).toHaveClass('test-popover__option--selected');
        });

        it('does not apply selected class to non-selected options', () => {
            render(<SelectionListPopover {...defaultProps} selectedValue={2} />);

            const buttons = screen.getAllByRole('option');
            const option1Button = buttons.find(btn => btn.textContent === 'Option 1');
            const option3Button = buttons.find(btn => btn.textContent === 'Option 3');

            expect(option1Button).not.toHaveClass('test-popover__option--selected');
            expect(option3Button).not.toHaveClass('test-popover__option--selected');
        });
    });

    describe('Selection behavior', () => {
        it('calls onSelect when an option is clicked', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option1 = screen.getByText('Option 1');
            await userEvent.click(option1);

            expect(mockOnSelect).toHaveBeenCalledWith(1);
        });

        it('calls closePopover after selection', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option3 = screen.getByText('Option 3');
            await userEvent.click(option3);

            expect(mockClosePopover).toHaveBeenCalled();
        });

        it('calls both onSelect and closePopover', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option1 = screen.getByText('Option 1');
            await userEvent.click(option1);

            expect(mockOnSelect).toHaveBeenCalledWith(1);
            expect(mockClosePopover).toHaveBeenCalled();
        });

        it('allows selecting the currently selected option', async () => {
            render(<SelectionListPopover {...defaultProps} selectedValue={2} />);

            const option2 = screen.getByText('Option 2');
            await userEvent.click(option2);

            expect(mockOnSelect).toHaveBeenCalledWith(2);
            expect(mockClosePopover).toHaveBeenCalled();
        });
    });

    describe('Generic type support', () => {
        it('works with number values', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option1 = screen.getByText('Option 1');
            await userEvent.click(option1);

            expect(mockOnSelect).toHaveBeenCalledWith(1);
            expect(typeof mockOnSelect.mock.calls[0][0]).toBe('number');
        });

        it('works with string values', async () => {
            const stringProps = {
                options: stringOptions,
                selectedValue: 'medium',
                onSelect: mockOnSelect,
                className: 'test-popover',
            };

            render(<SelectionListPopover {...stringProps} />);

            const lowOption = screen.getByText('Low');
            await userEvent.click(lowOption);

            expect(mockOnSelect).toHaveBeenCalledWith('low');
            expect(typeof mockOnSelect.mock.calls[0][0]).toBe('string');
        });

        it('correctly identifies selected string value', () => {
            const stringProps = {
                options: stringOptions,
                selectedValue: 'high',
                onSelect: mockOnSelect,
                className: 'test-popover',
            };

            render(<SelectionListPopover {...stringProps} />);

            const buttons = screen.getAllByRole('option');
            const highButton = buttons.find(btn => btn.textContent === 'High');
            expect(highButton).toHaveClass('test-popover__option--selected');
        });
    });

    describe('Keyboard navigation', () => {
        it('allows keyboard navigation with Tab', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const buttons = screen.getAllByRole('option');

            await userEvent.tab();
            expect(buttons[0]).toHaveFocus();

            await userEvent.tab();
            expect(buttons[1]).toHaveFocus();

            await userEvent.tab();
            expect(buttons[2]).toHaveFocus();
        });

        it('allows selection with Enter key', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option1 = screen.getByText('Option 1');
            option1.focus();

            await userEvent.keyboard('{Enter}');

            expect(mockOnSelect).toHaveBeenCalledWith(1);
            expect(mockClosePopover).toHaveBeenCalled();
        });

        it('allows selection with Space key', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option2 = screen.getByText('Option 2');
            option2.focus();

            await userEvent.keyboard(' ');

            expect(mockOnSelect).toHaveBeenCalledWith(2);
            expect(mockClosePopover).toHaveBeenCalled();
        });

        it('supports reverse tab navigation', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const buttons = screen.getAllByRole('option');

            buttons[2].focus();
            expect(buttons[2]).toHaveFocus();

            await userEvent.tab({ shift: true });
            expect(buttons[1]).toHaveFocus();

            await userEvent.tab({ shift: true });
            expect(buttons[0]).toHaveFocus();
        });
    });

    describe('Edge cases', () => {
        it('handles empty options array', () => {
            const emptyProps = {
                ...defaultProps,
                options: [],
            };

            render(<SelectionListPopover {...emptyProps} />);

            const buttons = screen.queryAllByRole('option');
            expect(buttons).toHaveLength(0);
            const listbox = screen.getByRole('listbox');
            expect(listbox).toHaveClass('test-popover__content');
        });

        it('handles single option', async () => {
            const singleOptionProps = {
                ...defaultProps,
                options: [{ value: 1, label: 'Only Option' }],
                selectedValue: 1,
            };

            render(<SelectionListPopover {...singleOptionProps} />);

            expect(screen.getByText('Only Option')).toBeInTheDocument();

            const button = screen.getByRole('option');
            expect(button).toHaveClass('test-popover__option--selected');
        });

        it('handles options with duplicate labels', async () => {
            const duplicateProps = {
                ...defaultProps,
                options: [
                    { value: 1, label: 'Same Label' },
                    { value: 2, label: 'Same Label' },
                ],
                selectedValue: 1,
            };

            render(<SelectionListPopover {...duplicateProps} />);

            const buttons = screen.getAllByText('Same Label');
            expect(buttons).toHaveLength(2);

            await userEvent.click(buttons[1]);
            expect(mockOnSelect).toHaveBeenCalledWith(2);
        });

        it('handles very long option labels', () => {
            const longLabelProps = {
                ...defaultProps,
                options: [{ value: 1, label: 'This is a very long option label that might cause layout issues' }],
                selectedValue: 1,
            };

            render(<SelectionListPopover {...longLabelProps} />);

            expect(
                screen.getByText('This is a very long option label that might cause layout issues')
            ).toBeInTheDocument();
        });

        it('handles special characters in labels', () => {
            const specialCharsProps = {
                ...defaultProps,
                options: [
                    { value: 1, label: 'Option & Special <chars>' },
                    { value: 2, label: 'Option "with" quotes' },
                ],
                selectedValue: 1,
            };

            render(<SelectionListPopover {...specialCharsProps} />);

            expect(screen.getByText('Option & Special <chars>')).toBeInTheDocument();
            expect(screen.getByText('Option "with" quotes')).toBeInTheDocument();
        });
    });

    describe('Multiple selections', () => {
        it('handles rapid successive clicks', async () => {
            render(<SelectionListPopover {...defaultProps} />);

            const option1 = screen.getByText('Option 1');
            const option2 = screen.getByText('Option 2');

            await userEvent.click(option1);
            await userEvent.click(option2);

            expect(mockOnSelect).toHaveBeenCalledTimes(2);
            expect(mockClosePopover).toHaveBeenCalledTimes(2);
        });
    });

    describe('Button attributes', () => {
        it('renders buttons with correct type attribute', () => {
            render(<SelectionListPopover {...defaultProps} />);

            const buttons = screen.getAllByRole('option');
            buttons.forEach(button => {
                expect(button).toHaveAttribute('type', 'button');
            });
        });

        it('renders correct number of option buttons', () => {
            render(<SelectionListPopover {...defaultProps} />);

            const buttons = screen.getAllByRole('option');
            expect(buttons).toHaveLength(3);
        });
    });
});
