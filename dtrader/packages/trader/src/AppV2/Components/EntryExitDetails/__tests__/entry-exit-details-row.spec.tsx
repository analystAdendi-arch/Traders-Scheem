import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EntryExitDetailRow from '../entry-exit-details-row';

// Mock the useDevice hook
jest.mock('@deriv-com/ui', () => ({
    useDevice: jest.fn(() => ({ isDesktop: false })),
}));

describe('EntryExitDetailRow', () => {
    const mockProps = {
        label: 'Test Label',
        value: '1234.5678',
        date: '01 Jan 2023',
        time: '12:34:56 GMT',
    };

    const mockOnClick = jest.fn();

    test('should render with all props correctly', () => {
        render(<EntryExitDetailRow {...mockProps} />);

        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByText('1234.5678')).toBeInTheDocument();
        expect(screen.getByText('01 Jan 2023')).toBeInTheDocument();
        expect(screen.getByText('12:34:56 GMT')).toBeInTheDocument();
    });

    test('should not apply tooltip class when tooltip_message is not provided', () => {
        render(<EntryExitDetailRow {...mockProps} />);

        const labelElement = screen.getByText('Test Label');
        expect(labelElement).not.toHaveClass('entry-exit-details__label--with-tooltip');
    });

    test('should apply tooltip class when tooltip_message is provided', () => {
        render(<EntryExitDetailRow {...mockProps} tooltip_message='Tooltip content' />);

        const labelElement = screen.getByText('Test Label');
        expect(labelElement).toHaveClass('entry-exit-details__label--with-tooltip');
    });

    test('should call onLabelClick when label is clicked and tooltip_message is provided', async () => {
        const user = userEvent.setup();
        render(<EntryExitDetailRow {...mockProps} tooltip_message='Tooltip content' onLabelClick={mockOnClick} />);

        const labelElement = screen.getByText('Test Label');
        await user.click(labelElement);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should not call onLabelClick when label is clicked but tooltip_message is not provided', async () => {
        const user = userEvent.setup();
        render(<EntryExitDetailRow {...mockProps} onLabelClick={mockOnClick} />);

        const labelElement = screen.getByText('Test Label');

        // Reset the mock before clicking
        mockOnClick.mockReset();

        await user.click(labelElement);

        expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should render without date if not provided', () => {
        const { date, ...propsWithoutDate } = mockProps;
        render(<EntryExitDetailRow {...propsWithoutDate} />);

        expect(screen.queryByText('01 Jan 2023')).not.toBeInTheDocument();
    });

    test('should render without value if not provided', () => {
        const { value, ...propsWithoutValue } = mockProps;
        render(<EntryExitDetailRow {...propsWithoutValue} />);

        expect(screen.queryByText('1234.5678')).not.toBeInTheDocument();
    });
});
