import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useTraderStore } from 'Stores/useTraderStores';

import DurationTicksInputDesktop from '../duration-ticks-input-desktop';

jest.mock('Stores/useTraderStores');
jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getDurationMinMaxValues: jest.fn(),
}));
jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text, values }: any) => {
        if (values) {
            let text = i18n_default_text;
            Object.keys(values).forEach(key => {
                text = text.replace(`{{${key}}}`, values[key]);
            });
            return <span>{text}</span>;
        }
        return <span>{i18n_default_text}</span>;
    },
    useTranslations: () => ({
        localize: (text: string, values?: Record<string, any>) => {
            if (values) {
                let result = text;
                Object.keys(values).forEach(key => {
                    result = result.replace(`{{${key}}}`, values[key]);
                });
                return result;
            }
            return text;
        },
    }),
}));

describe('DurationTicksInputDesktop', () => {
    const mockOnClose = jest.fn();
    const mockOnChangeMultiple = jest.fn();

    const defaultProps = {
        onClose: mockOnClose,
    };

    const mockGetDurationMinMaxValues = jest.requireMock('@deriv/shared').getDurationMinMaxValues;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetDurationMinMaxValues.mockReturnValue([1, 10]);
        (useTraderStore as jest.Mock).mockReturnValue({
            duration: 5,
            duration_unit: 't',
            onChangeMultiple: mockOnChangeMultiple,
            duration_min_max: { tick: { min: 1, max: 10 } },
        });
    });

    it('renders the ticks input field', () => {
        render(<DurationTicksInputDesktop {...defaultProps} />);

        expect(screen.getByLabelText('Ticks')).toBeInTheDocument();
        expect(screen.getByTestId('dt_duration_ticks_input_desktop')).toBeInTheDocument();
    });

    it('displays current duration value when duration_unit is ticks', () => {
        render(<DurationTicksInputDesktop {...defaultProps} />);

        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input).toHaveValue('5');
    });

    it('displays empty value when duration_unit is not ticks', () => {
        (useTraderStore as jest.Mock).mockReturnValue({
            duration: 60,
            duration_unit: 'm',
            onChangeMultiple: mockOnChangeMultiple,
            duration_min_max: { tick: { min: 1, max: 10 } },
        });

        render(<DurationTicksInputDesktop {...defaultProps} />);

        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input).toHaveValue('');
    });

    it('displays range message by default', () => {
        render(<DurationTicksInputDesktop {...defaultProps} />);

        expect(screen.getByText('Range: 1 - 10 ticks')).toBeInTheDocument();
    });

    describe('Input validation - Valid range (1-10)', () => {
        it('accepts minimum valid value (1)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '1');

            expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
            expect(screen.getByText('Range: 1 - 10 ticks')).toBeInTheDocument();
        });

        it('accepts maximum valid value (10)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '10');

            expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
            expect(screen.getByText('Range: 1 - 10 ticks')).toBeInTheDocument();
        });

        it('accepts mid-range value (5)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '5');

            expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        });
    });

    describe('Input validation - Edge cases', () => {
        it('shows error for value below minimum (0)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '0');

            expect(screen.getByText('Please enter a duration between 1 to 10 ticks.')).toBeInTheDocument();
        });

        it('shows error for value above maximum (11)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '11');

            expect(screen.getByText('Please enter a duration between 1 to 10 ticks.')).toBeInTheDocument();
        });

        it('ignores non-digit characters like minus sign', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox') as HTMLInputElement;
            await userEvent.clear(input);
            await userEvent.type(input, '-1');

            expect(input).toHaveValue('1');
        });

        it('shows error for large value (99)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '99');

            expect(screen.getByText('Please enter a duration between 1 to 10 ticks.')).toBeInTheDocument();
        });
    });

    describe('Input validation - Invalid input types', () => {
        it('ignores decimal/float characters (5.5 becomes 55)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox') as HTMLInputElement;
            await userEvent.clear(input);
            await userEvent.type(input, '5.5');

            expect(input).toHaveValue('55');
        });

        it('ignores decimal point (5. becomes 5)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox') as HTMLInputElement;
            await userEvent.clear(input);
            await userEvent.type(input, '5.');

            expect(input).toHaveValue('5');
        });

        it('ignores comma (5, becomes 5)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox') as HTMLInputElement;
            await userEvent.clear(input);
            await userEvent.type(input, '5,');

            expect(input).toHaveValue('5');
        });

        it('ignores non-numeric input (abc)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox') as HTMLInputElement;
            await userEvent.clear(input);
            await userEvent.type(input, 'abc');

            expect(input).toHaveValue('');
        });

        it('shows error for empty input when trying to save', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeDisabled();
        });
    });

    describe('Save button behavior', () => {
        it('enables save button for valid input', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '7');

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeEnabled();
        });

        it('disables save button for invalid input', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '15');

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeDisabled();
        });

        it('disables save button for empty input', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeDisabled();
        });

        it('calls onChangeMultiple with correct values on save', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '8');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await userEvent.click(saveButton);

            expect(mockOnChangeMultiple).toHaveBeenCalledWith({
                duration_unit: 't',
                duration: 8,
                expiry_type: 'duration',
            });
        });

        it('calls onClose after successful save', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '3');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await userEvent.click(saveButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not call onChangeMultiple or onClose for invalid input', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '15');

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeDisabled();

            expect(mockOnChangeMultiple).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Input field properties', () => {
        it('has numeric input mode', () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('inputMode', 'numeric');
        });

        it('has maxLength of 2', () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('maxLength', '2');
        });
    });

    describe('Error message display', () => {
        it('shows required field error for empty input on validation', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '5');
            await userEvent.clear(input);

            expect(screen.queryByText('Range: 1 - 10 ticks')).toBeInTheDocument();
        });

        it('clears error when valid input is entered after invalid', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '15');

            expect(screen.getByText('Please enter a duration between 1 to 10 ticks.')).toBeInTheDocument();

            await userEvent.clear(input);
            await userEvent.type(input, '5');

            expect(screen.queryByText('Please enter a duration between 1 to 10 ticks.')).not.toBeInTheDocument();
            expect(screen.getByText('Range: 1 - 10 ticks')).toBeInTheDocument();
        });
    });

    describe('Boundary value testing', () => {
        it('accepts boundary value 1', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '1');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await userEvent.click(saveButton);

            expect(mockOnChangeMultiple).toHaveBeenCalledWith({
                duration_unit: 't',
                duration: 1,
                expiry_type: 'duration',
            });
        });

        it('accepts boundary value 10', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '10');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await userEvent.click(saveButton);

            expect(mockOnChangeMultiple).toHaveBeenCalledWith({
                duration_unit: 't',
                duration: 10,
                expiry_type: 'duration',
            });
        });

        it('rejects value just below minimum (0)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '0');

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeDisabled();
        });

        it('rejects value just above maximum (11)', async () => {
            render(<DurationTicksInputDesktop {...defaultProps} />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '11');

            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeDisabled();
        });
    });

    describe('Backend min/max values', () => {
        it('uses backend min/max when available (e.g., min=5, max=10)', async () => {
            mockGetDurationMinMaxValues.mockReturnValue([5, 10]);
            (useTraderStore as jest.Mock).mockReturnValue({
                duration: 5,
                duration_unit: 't',
                onChangeMultiple: mockOnChangeMultiple,
                duration_min_max: { tick: { min: 5, max: 10 } },
                contract_expiry_type: 'tick',
            });

            render(<DurationTicksInputDesktop {...defaultProps} />);

            expect(screen.getByText('Range: 5 - 10 ticks')).toBeInTheDocument();

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);
            await userEvent.type(input, '3');

            expect(screen.getByText('Please enter a duration between 5 to 10 ticks.')).toBeInTheDocument();
        });

        it('falls back to defaults when backend values are unavailable', () => {
            mockGetDurationMinMaxValues.mockReturnValue([]);
            (useTraderStore as jest.Mock).mockReturnValue({
                duration: 5,
                duration_unit: 't',
                onChangeMultiple: mockOnChangeMultiple,
                duration_min_max: {},
            });

            render(<DurationTicksInputDesktop {...defaultProps} />);

            expect(screen.getByText('Range: 1 - 10 ticks')).toBeInTheDocument();
        });

        it('always uses tick expiry type regardless of store contract_expiry_type', () => {
            mockGetDurationMinMaxValues.mockReturnValue([1, 10]);
            (useTraderStore as jest.Mock).mockReturnValue({
                duration: 5,
                duration_unit: 't',
                onChangeMultiple: mockOnChangeMultiple,
                duration_min_max: { tick: { min: 1, max: 10 }, daily: { min: 86400, max: 31536000 } },
            });

            render(<DurationTicksInputDesktop {...defaultProps} />);

            expect(mockGetDurationMinMaxValues).toHaveBeenCalledWith(
                expect.objectContaining({ tick: { min: 1, max: 10 } }),
                'tick',
                't'
            );
        });
    });
});
