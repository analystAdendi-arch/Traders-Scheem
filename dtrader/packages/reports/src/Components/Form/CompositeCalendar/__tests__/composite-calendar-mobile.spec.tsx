import React from 'react';

import { toMoment } from '@deriv/shared';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompositeCalendarMobile from '../composite-calendar-mobile';

const startDate = 'Start date';
const endDate = 'End date';
const backToTodayButtonText = 'Back to today';
const radioButtonText = ['All time', 'Last 7 days', 'Last 30 days', 'Last 365 days'];
const customDateRangeText = 'Custom';
const mockDefaultProps = {
    duration_list: [
        { value: 'all_time', label: radioButtonText[0], onClick: jest.fn() },
        { value: 'last_7_days', label: radioButtonText[1], onClick: jest.fn() },
        { value: 'last_30_days', label: radioButtonText[2], onClick: jest.fn() },
        { value: 'last_365_days', label: radioButtonText[3], onClick: jest.fn() },
    ],
    from: 1696319493,
    to: 1715346191,
    onChange: jest.fn(),
    setCurrentFocus: jest.fn(),
};

jest.mock('@deriv/components', () => ({
    ...jest.requireActual('@deriv/components'),
    MobileDialog: jest.fn(({ children, visible, footer, onClose }) => (
        <div>
            {visible && (
                <div>
                    {children}
                    {footer}
                    <button onClick={onClose}>Close MobileDialog</button>
                </div>
            )}
        </div>
    )),
}));

describe('CompositeCalendarMobile', () => {
    const checkModalOpenCloseFunctionality = async (buttonName?: string) => {
        await act(async () => {
            await userEvent.click(screen.getByRole('textbox'));
        });

        await waitFor(() => {
            radioButtonText.forEach(item => expect(screen.getByText(item)).toBeInTheDocument());
            expect(screen.getByText(customDateRangeText)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(startDate)).toBeInTheDocument();
            expect(screen.getByText(backToTodayButtonText)).toBeInTheDocument();
        });

        if (!buttonName) return;

        await act(async () => {
            await userEvent.click(screen.getByText(buttonName));
        });

        await waitFor(() => {
            radioButtonText.forEach(item => expect(screen.queryByText(item)).not.toBeInTheDocument());
            expect(screen.queryByText(customDateRangeText)).not.toBeInTheDocument();
            expect(screen.queryByPlaceholderText(startDate)).not.toBeInTheDocument();
            expect(screen.queryByText(backToTodayButtonText)).not.toBeInTheDocument();
        });
    };

    it('should render the input field by default and not render MobileDialog with children if the Modal is closed (default state)', () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        expect(screen.getByRole('textbox')).toBeInTheDocument();
        radioButtonText.forEach(item => expect(screen.queryByText(item)).not.toBeInTheDocument());
        expect(screen.queryByText(customDateRangeText)).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(startDate)).not.toBeInTheDocument();
        expect(screen.queryByText(backToTodayButtonText)).not.toBeInTheDocument();
    });

    it('should render functioning component if props "from" and "to" are equal to 0: MobileDialog should be opened if user clicks on the calendar field', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} from={0} to={0} />);

        radioButtonText.forEach(item => expect(screen.queryByText(item)).not.toBeInTheDocument());
        expect(screen.queryByText(customDateRangeText)).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(startDate)).not.toBeInTheDocument();
        expect(screen.queryByText(backToTodayButtonText)).not.toBeInTheDocument();

        await checkModalOpenCloseFunctionality();
    });

    it('should close the MobileDialog if user clicks on Cancel button', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        await checkModalOpenCloseFunctionality('Cancel');
    });

    it('should close the MobileDialog if user clicks on Close button', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        await checkModalOpenCloseFunctionality('Close MobileDialog');
    });

    it('should close the MobileDialog if user clicks on "Back to today" button', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        await checkModalOpenCloseFunctionality(backToTodayButtonText);
    });

    it('should apply new value and set it to the input if user chooses some radio button value and clicks on OK button', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        const input = screen.getByRole('textbox');

        expect(input).toHaveValue(radioButtonText[0]);

        await act(async () => {
            await userEvent.click(input);
        });

        await waitFor(() => {
            expect(screen.getByText(radioButtonText[1])).toBeInTheDocument();
        });

        await act(async () => {
            await userEvent.click(screen.getByText(radioButtonText[1]));
        });

        await act(async () => {
            await userEvent.click(screen.getByText('OK'));
        });

        await waitFor(() => {
            expect(input).toHaveValue(radioButtonText[1]);
        });
    });

    it('should apply custom value and set it to the input if user clicks on Custom radio button value and clicks on OK button', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        const input = screen.getByRole('textbox');

        expect(input).toHaveValue(radioButtonText[0]);

        await act(async () => {
            await userEvent.click(input);
        });

        await waitFor(() => {
            expect(screen.getByText(customDateRangeText)).toBeInTheDocument();
        });

        await act(async () => {
            await userEvent.click(screen.getByText(customDateRangeText));
        });

        await act(async () => {
            await userEvent.click(screen.getByText('OK'));
        });

        await waitFor(() => {
            expect(input).toHaveValue('03 Oct 2023 - 10 May 2024');
        });
    });

    it('should apply date which user has typed in DatePicker for Start date', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        await act(async () => {
            await userEvent.click(screen.getByRole('textbox'));
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText(startDate)).toBeInTheDocument();
        });

        const inputForStartDate = screen.getByPlaceholderText(startDate);
        expect(inputForStartDate).toHaveValue('03 Oct 2023');

        const newDate = toMoment().format('DD MMM YYYY');

        await act(async () => {
            await userEvent.type(inputForStartDate, newDate);
        });

        await waitFor(() => {
            expect(inputForStartDate).toHaveValue(newDate);
        });
    });

    it('should apply date which user has typed in DatePicker for End date', async () => {
        render(<CompositeCalendarMobile {...mockDefaultProps} />);

        await act(async () => {
            await userEvent.click(screen.getByRole('textbox'));
        });

        await waitFor(() => {
            expect(screen.getByPlaceholderText(endDate)).toBeInTheDocument();
        });

        const inputForEndDate = screen.getByPlaceholderText(endDate);
        expect(inputForEndDate).toHaveValue('10 May 2024');

        const newDate = toMoment().format('DD MMM YYYY');

        await act(async () => {
            await userEvent.type(inputForEndDate, newDate);
        });

        await waitFor(() => {
            expect(inputForEndDate).toHaveValue(newDate);
        });
    });
});
