import React from 'react';
import moment from 'moment';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TimeGridPicker from '../time-grid-picker';

describe('TimeGridPicker', () => {
    const mockOnTimeChange = jest.fn();

    const defaultProps = {
        selectedTime: '10:30',
        onTimeChange: mockOnTimeChange,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders hour and minute grids', () => {
        render(<TimeGridPicker {...defaultProps} />);

        expect(screen.getByText('Hour')).toBeInTheDocument();
        expect(screen.getByText('Minute')).toBeInTheDocument();
    });

    it('renders all 24 hours (00-23)', () => {
        render(<TimeGridPicker {...defaultProps} />);

        for (let i = 0; i < 24; i++) {
            const hour = String(i).padStart(2, '0');
            expect(screen.getByRole('button', { name: `Hour ${hour}` })).toBeInTheDocument();
        }
    });

    it('renders minutes in 5-minute intervals (00, 05, 10, ..., 55)', () => {
        render(<TimeGridPicker {...defaultProps} />);

        const expectedMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
        expectedMinutes.forEach(minute => {
            expect(screen.getByRole('button', { name: `Minute ${minute}` })).toBeInTheDocument();
        });
    });

    it('highlights the selected hour and minute', () => {
        render(<TimeGridPicker {...defaultProps} selectedTime='14:25' />);

        const hourItems = screen.getAllByText('14');
        const minuteItems = screen.getAllByText('25');

        expect(hourItems[0]).toHaveClass('time-grid-picker__item--selected');
        expect(minuteItems[0]).toHaveClass('time-grid-picker__item--selected');
    });

    it('calls onTimeChange when a valid hour is clicked', async () => {
        render(<TimeGridPicker {...defaultProps} />);

        const hour15 = screen.getAllByText('15')[0];
        await userEvent.click(hour15);

        expect(mockOnTimeChange).toHaveBeenCalledWith('15:30');
    });

    it('calls onTimeChange when a valid minute is clicked', async () => {
        render(<TimeGridPicker {...defaultProps} />);

        const minute45 = screen.getAllByText('45')[0];
        await userEvent.click(minute45);

        expect(mockOnTimeChange).toHaveBeenCalledWith('10:45');
    });

    describe('Market hours validation', () => {
        it('allows all times when no market hours are provided', async () => {
            render(<TimeGridPicker {...defaultProps} />);

            const hour20 = screen.getAllByText('20')[0];
            await userEvent.click(hour20);

            expect(mockOnTimeChange).toHaveBeenCalledWith('20:30');
            expect(hour20).not.toHaveClass('time-grid-picker__item--disabled');
        });

        it('disables times outside market hours using isBetween logic', () => {
            const startTimes = [moment().hour(9).minute(0)];
            const endTimes = [moment().hour(17).minute(0)];

            render(<TimeGridPicker {...defaultProps} startTimes={startTimes} endTimes={endTimes} />);

            const hour08 = screen.getAllByText('08')[0];
            const hour10 = screen.getAllByText('10')[0];
            const hour18 = screen.getAllByText('18')[0];

            expect(hour08).toHaveClass('time-grid-picker__item--disabled');
            expect(hour10).not.toHaveClass('time-grid-picker__item--disabled');
            expect(hour18).toHaveClass('time-grid-picker__item--disabled');
        });

        it('handles boundary times correctly with isBetween inclusive', () => {
            const startTimes = [moment().hour(9).minute(0)];
            const endTimes = [moment().hour(17).minute(0)];

            render(
                <TimeGridPicker {...defaultProps} selectedTime='09:00' startTimes={startTimes} endTimes={endTimes} />
            );

            const hour09 = screen.getAllByText('09')[0];
            const hour17 = screen.getAllByText('17')[0];

            expect(hour09).not.toHaveClass('time-grid-picker__item--disabled');
            expect(hour17).not.toHaveClass('time-grid-picker__item--disabled');
        });

        it('handles multiple market sessions', () => {
            const startTimes = [moment().hour(9).minute(0), moment().hour(14).minute(0)];
            const endTimes = [moment().hour(12).minute(0), moment().hour(17).minute(0)];

            render(<TimeGridPicker {...defaultProps} startTimes={startTimes} endTimes={endTimes} />);

            const hour10 = screen.getAllByText('10')[0];
            const hour13 = screen.getAllByText('13')[0];
            const hour15 = screen.getAllByText('15')[0];

            expect(hour10).not.toHaveClass('time-grid-picker__item--disabled');
            expect(hour13).toHaveClass('time-grid-picker__item--disabled');
            expect(hour15).not.toHaveClass('time-grid-picker__item--disabled');
        });

        it('does not call onTimeChange when clicking disabled hour', async () => {
            const startTimes = [moment().hour(9).minute(0)];
            const endTimes = [moment().hour(17).minute(0)];

            render(<TimeGridPicker {...defaultProps} startTimes={startTimes} endTimes={endTimes} />);

            const hour20 = screen.getAllByText('20')[0];
            await userEvent.click(hour20);

            expect(mockOnTimeChange).not.toHaveBeenCalled();
        });

        it('disables minutes outside market hours for selected hour', () => {
            const startTimes = [moment().hour(9).minute(30)];
            const endTimes = [moment().hour(17).minute(45)];

            render(
                <TimeGridPicker {...defaultProps} selectedTime='09:00' startTimes={startTimes} endTimes={endTimes} />
            );

            const minute00 = screen.getAllByText('00')[0];
            const minute30 = screen.getAllByText('30')[0];
            const minute35 = screen.getAllByText('35')[0];

            expect(minute00).toHaveClass('time-grid-picker__item--disabled');
            expect(minute30).not.toHaveClass('time-grid-picker__item--disabled');
            expect(minute35).not.toHaveClass('time-grid-picker__item--disabled');
        });

        it('handles empty market hours arrays', () => {
            render(<TimeGridPicker {...defaultProps} startTimes={[]} endTimes={[]} />);

            const hour10 = screen.getAllByText('10')[0];
            expect(hour10).not.toHaveClass('time-grid-picker__item--disabled');
        });
    });

    describe('Edge cases', () => {
        it('handles midnight (00:00) correctly', async () => {
            render(<TimeGridPicker {...defaultProps} selectedTime='00:00' />);

            const hour00 = screen.getAllByText('00')[0];
            const minute00 = screen.getAllByText('00')[0];

            expect(hour00).toHaveClass('time-grid-picker__item--selected');
            expect(minute00).toHaveClass('time-grid-picker__item--selected');
        });

        it('handles end of day (23:55) correctly', async () => {
            render(<TimeGridPicker {...defaultProps} selectedTime='23:55' />);

            const hour23 = screen.getAllByText('23')[0];
            const minute55 = screen.getAllByText('55')[0];

            expect(hour23).toHaveClass('time-grid-picker__item--selected');
            expect(minute55).toHaveClass('time-grid-picker__item--selected');
        });

        it('handles single-digit hours with leading zeros', () => {
            render(<TimeGridPicker {...defaultProps} selectedTime='05:15' />);

            const hour05 = screen.getAllByText('05')[0];
            expect(hour05).toHaveClass('time-grid-picker__item--selected');
        });

        it('updates time when switching from one hour to another', async () => {
            const { rerender } = render(<TimeGridPicker {...defaultProps} selectedTime='10:30' />);

            const hour14 = screen.getAllByText('14')[0];
            await userEvent.click(hour14);

            expect(mockOnTimeChange).toHaveBeenCalledWith('14:30');

            rerender(<TimeGridPicker {...defaultProps} selectedTime='14:30' />);

            const hour14Selected = screen.getAllByText('14')[0];
            expect(hour14Selected).toHaveClass('time-grid-picker__item--selected');
        });
    });

    describe('Time format validation', () => {
        it('maintains HH:MM format for all selections', async () => {
            render(<TimeGridPicker {...defaultProps} />);

            const hour05 = screen.getAllByText('05')[0];
            await userEvent.click(hour05);

            expect(mockOnTimeChange).toHaveBeenCalledWith('05:30');
            expect(mockOnTimeChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{2}:\d{2}$/));
        });

        it('parses selectedTime correctly', () => {
            render(<TimeGridPicker {...defaultProps} selectedTime='09:45' />);

            const hour09 = screen.getAllByText('09')[0];
            const minute45 = screen.getAllByText('45')[0];

            expect(hour09).toHaveClass('time-grid-picker__item--selected');
            expect(minute45).toHaveClass('time-grid-picker__item--selected');
        });
    });
});
