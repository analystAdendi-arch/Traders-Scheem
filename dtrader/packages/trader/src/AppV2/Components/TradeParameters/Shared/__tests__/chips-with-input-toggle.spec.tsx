import { render, screen } from '@testing-library/react';

import ChipsWithInputToggle from '../chips-with-input-toggle';

interface ValueChipsProps {
    values: number[];
    selectedValue: number;
    onSelect: (value: number) => void;
    formatValue?: (value: number) => string;
    className?: string;
}

jest.mock('AppV2/Components/InputPopover', () => ({
    ValueChips: ({ values, selectedValue, onSelect, formatValue, className }: ValueChipsProps) => (
        <div data-testid='value-chips' className={className}>
            {values.map((value: number) => (
                <button
                    key={value}
                    onClick={() => onSelect(value)}
                    className={value === selectedValue ? 'selected' : ''}
                >
                    {formatValue ? formatValue(value) : value}
                </button>
            ))}
        </div>
    ),
}));

describe('ChipsWithInputToggle', () => {
    const mockOnSelect = jest.fn();
    const mockFormatValue = jest.fn((value: number) => `${value} units`);

    const defaultProps = {
        activeTab: 'chips' as const,
        chipValues: [1, 2, 3, 4, 5],
        selectedValue: 3,
        onSelect: mockOnSelect,
        formatValue: mockFormatValue,
        inputComponent: <div data-testid='input-component'>Input Component</div>,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tab switching behavior', () => {
        it('renders ValueChips when activeTab is chips', () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            expect(screen.getByTestId('value-chips')).toBeInTheDocument();
            expect(screen.queryByTestId('input-component')).not.toBeInTheDocument();
        });

        it('renders input component when activeTab is input', () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='input' />);

            expect(screen.getByTestId('input-component')).toBeInTheDocument();
            expect(screen.queryByTestId('value-chips')).not.toBeInTheDocument();
        });

        it('switches from chips to input when activeTab changes', () => {
            const { rerender } = render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            expect(screen.getByTestId('value-chips')).toBeInTheDocument();

            rerender(<ChipsWithInputToggle {...defaultProps} activeTab='input' />);

            expect(screen.getByTestId('input-component')).toBeInTheDocument();
            expect(screen.queryByTestId('value-chips')).not.toBeInTheDocument();
        });

        it('switches from input to chips when activeTab changes', () => {
            const { rerender } = render(<ChipsWithInputToggle {...defaultProps} activeTab='input' />);

            expect(screen.getByTestId('input-component')).toBeInTheDocument();

            rerender(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            expect(screen.getByTestId('value-chips')).toBeInTheDocument();
            expect(screen.queryByTestId('input-component')).not.toBeInTheDocument();
        });
    });

    describe('Props passing to ValueChips', () => {
        it('passes chipValues to ValueChips', () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(5);
        });

        it('passes selectedValue to ValueChips', () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' selectedValue={3} />);

            const buttons = screen.getAllByRole('button');
            const selectedButton = buttons.find(btn => btn.textContent === '3 units');
            expect(selectedButton).toHaveClass('selected');
        });

        it('passes onSelect callback to ValueChips', async () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            const button = screen.getByText('2 units');
            button.click();

            expect(mockOnSelect).toHaveBeenCalledWith(2);
        });

        it('passes formatValue function to ValueChips', () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            expect(screen.getByText('1 units')).toBeInTheDocument();
            expect(screen.getByText('5 units')).toBeInTheDocument();
            expect(mockFormatValue).toHaveBeenCalled();
        });

        it('passes className to ValueChips', () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' className='custom-class' />);

            const valueChips = screen.getByTestId('value-chips');
            expect(valueChips).toHaveClass('custom-class');
        });
    });

    describe('Optional props', () => {
        it('works without formatValue prop', () => {
            const propsWithoutFormat = {
                ...defaultProps,
                formatValue: undefined,
            };

            render(<ChipsWithInputToggle {...propsWithoutFormat} activeTab='chips' />);

            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('works without selectedValue prop', () => {
            const propsWithoutSelected = {
                ...defaultProps,
                selectedValue: undefined,
            };

            render(<ChipsWithInputToggle {...propsWithoutSelected} activeTab='chips' />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).not.toHaveClass('selected');
            });
        });

        it('works without className prop', () => {
            const propsWithoutClassName = {
                ...defaultProps,
                className: undefined,
            };

            render(<ChipsWithInputToggle {...propsWithoutClassName} activeTab='chips' />);

            expect(screen.getByTestId('value-chips')).toBeInTheDocument();
        });
    });

    describe('Input component rendering', () => {
        it('renders custom input component', () => {
            const customInput = <div data-testid='custom-input'>Custom Input</div>;

            render(<ChipsWithInputToggle {...defaultProps} activeTab='input' inputComponent={customInput} />);

            expect(screen.getByTestId('custom-input')).toBeInTheDocument();
            expect(screen.getByText('Custom Input')).toBeInTheDocument();
        });

        it('renders complex input component with multiple elements', () => {
            const complexInput = (
                <div data-testid='complex-input'>
                    <input type='text' placeholder='Enter value' />
                    <button>Submit</button>
                </div>
            );

            render(<ChipsWithInputToggle {...defaultProps} activeTab='input' inputComponent={complexInput} />);

            expect(screen.getByTestId('complex-input')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        });
    });

    describe('Value selection', () => {
        it('handles selection of first value', async () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            const firstButton = screen.getByText('1 units');
            firstButton.click();

            expect(mockOnSelect).toHaveBeenCalledWith(1);
        });

        it('handles selection of last value', async () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            const lastButton = screen.getByText('5 units');
            lastButton.click();

            expect(mockOnSelect).toHaveBeenCalledWith(5);
        });

        it('handles selection of middle value', async () => {
            render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            const middleButton = screen.getByText('3 units');
            middleButton.click();

            expect(mockOnSelect).toHaveBeenCalledWith(3);
        });
    });

    describe('Edge cases', () => {
        it('handles empty chipValues array', () => {
            const emptyProps = {
                ...defaultProps,
                chipValues: [],
            };

            render(<ChipsWithInputToggle {...emptyProps} activeTab='chips' />);

            const buttons = screen.queryAllByRole('button');
            expect(buttons).toHaveLength(0);
        });

        it('handles single chip value', () => {
            const singleValueProps = {
                ...defaultProps,
                chipValues: [10],
                selectedValue: 10,
            };

            render(<ChipsWithInputToggle {...singleValueProps} activeTab='chips' />);

            expect(screen.getByText('10 units')).toBeInTheDocument();
        });

        it('handles large number of chip values', () => {
            const manyValuesProps = {
                ...defaultProps,
                chipValues: Array.from({ length: 20 }, (_, i) => i + 1),
            };

            render(<ChipsWithInputToggle {...manyValuesProps} activeTab='chips' />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(20);
        });
    });

    describe('Component updates', () => {
        it('updates when chipValues change', () => {
            const { rerender } = render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' />);

            expect(screen.getAllByRole('button')).toHaveLength(5);

            rerender(<ChipsWithInputToggle {...defaultProps} activeTab='chips' chipValues={[10, 20, 30]} />);

            expect(screen.getAllByRole('button')).toHaveLength(3);
        });

        it('updates when selectedValue changes', () => {
            const { rerender } = render(<ChipsWithInputToggle {...defaultProps} activeTab='chips' selectedValue={2} />);

            let buttons = screen.getAllByRole('button');
            let selectedButton = buttons.find(btn => btn.textContent === '2 units');
            expect(selectedButton).toHaveClass('selected');

            rerender(<ChipsWithInputToggle {...defaultProps} activeTab='chips' selectedValue={4} />);

            buttons = screen.getAllByRole('button');
            selectedButton = buttons.find(btn => btn.textContent === '4 units');
            expect(selectedButton).toHaveClass('selected');
        });
    });
});
