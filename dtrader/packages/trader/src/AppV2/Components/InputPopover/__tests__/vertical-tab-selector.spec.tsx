import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VerticalTabSelector, { VerticalTabItem } from '../vertical-tab-selector';

describe('VerticalTabSelector', () => {
    const mockItems: VerticalTabItem[] = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
    ];

    const mockOnSelect = jest.fn();

    const defaultProps = {
        items: mockItems,
        selectedValue: 'option1',
        onSelect: mockOnSelect,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all tab items', () => {
        render(<VerticalTabSelector {...defaultProps} />);

        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('marks the selected item with aria-selected', () => {
        render(<VerticalTabSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
        expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onSelect when a tab is clicked', async () => {
        render(<VerticalTabSelector {...defaultProps} />);

        await userEvent.click(screen.getByText('Option 2'));

        expect(mockOnSelect).toHaveBeenCalledWith('option2');
    });

    it('has proper ARIA attributes', () => {
        render(<VerticalTabSelector {...defaultProps} />);

        const container = screen.getByRole('tablist');
        expect(container).toHaveAttribute('aria-orientation', 'vertical');

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);

        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
        expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('sets correct tabIndex for keyboard navigation', () => {
        render(<VerticalTabSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');

        expect(tabs[0]).toHaveAttribute('tabIndex', '0');
        expect(tabs[1]).toHaveAttribute('tabIndex', '-1');
        expect(tabs[2]).toHaveAttribute('tabIndex', '-1');
    });

    it('handles ArrowDown key navigation', async () => {
        render(<VerticalTabSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');
        tabs[0].focus();

        await userEvent.keyboard('{ArrowDown}');

        expect(mockOnSelect).toHaveBeenCalledWith('option2');
    });

    it('handles ArrowUp key navigation', async () => {
        render(<VerticalTabSelector {...defaultProps} selectedValue='option2' />);

        const tabs = screen.getAllByRole('tab');
        tabs[1].focus();

        await userEvent.keyboard('{ArrowUp}');

        expect(mockOnSelect).toHaveBeenCalledWith('option1');
    });

    it('wraps to last item when ArrowUp is pressed on first item', async () => {
        render(<VerticalTabSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');
        tabs[0].focus();

        await userEvent.keyboard('{ArrowUp}');

        expect(mockOnSelect).toHaveBeenCalledWith('option3');
    });

    it('wraps to first item when ArrowDown is pressed on last item', async () => {
        render(<VerticalTabSelector {...defaultProps} selectedValue='option3' />);

        const tabs = screen.getAllByRole('tab');
        tabs[2].focus();

        await userEvent.keyboard('{ArrowDown}');

        expect(mockOnSelect).toHaveBeenCalledWith('option1');
    });

    it('handles Home key to select first item', async () => {
        render(<VerticalTabSelector {...defaultProps} selectedValue='option2' />);

        const tabs = screen.getAllByRole('tab');
        tabs[1].focus();

        await userEvent.keyboard('{Home}');

        expect(mockOnSelect).toHaveBeenCalledWith('option1');
    });

    it('handles End key to select last item', async () => {
        render(<VerticalTabSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');
        tabs[0].focus();

        await userEvent.keyboard('{End}');

        expect(mockOnSelect).toHaveBeenCalledWith('option3');
    });

    it('renders correctly with custom className', () => {
        render(<VerticalTabSelector {...defaultProps} className='custom-class' />);

        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();
    });
});
