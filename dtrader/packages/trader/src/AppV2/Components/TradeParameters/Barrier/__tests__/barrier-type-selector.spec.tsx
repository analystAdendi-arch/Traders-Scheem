import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BarrierTypeSelector from '../barrier-type-selector';

describe('BarrierTypeSelector', () => {
    const mockOnSelectType = jest.fn();

    const defaultProps = {
        selectedType: 'above_spot',
        onSelectType: mockOnSelectType,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all barrier type options', () => {
        render(<BarrierTypeSelector {...defaultProps} />);

        expect(screen.getByText('Above spot')).toBeInTheDocument();
        expect(screen.getByText('Below spot')).toBeInTheDocument();
        expect(screen.getByText('Fixed barrier')).toBeInTheDocument();
    });

    it('marks the selected barrier type with aria-selected', () => {
        render(<BarrierTypeSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');
        const aboveSpotTab = tabs.find(tab => tab.textContent === 'Above spot');
        expect(aboveSpotTab).toHaveAttribute('aria-selected', 'true');
    });

    it('calls onSelectType when a barrier type is clicked', async () => {
        render(<BarrierTypeSelector {...defaultProps} />);

        await userEvent.click(screen.getByText('Below spot'));

        expect(mockOnSelectType).toHaveBeenCalledWith('below_spot');
    });

    it('renders with below_spot selected', () => {
        render(<BarrierTypeSelector {...defaultProps} selectedType='below_spot' />);

        const tabs = screen.getAllByRole('tab');
        const belowSpotTab = tabs.find(tab => tab.textContent === 'Below spot');
        expect(belowSpotTab).toHaveAttribute('aria-selected', 'true');
    });

    it('renders with fixed_barrier selected', () => {
        render(<BarrierTypeSelector {...defaultProps} selectedType='fixed_barrier' />);

        const tabs = screen.getAllByRole('tab');
        const fixedBarrierTab = tabs.find(tab => tab.textContent === 'Fixed barrier');
        expect(fixedBarrierTab).toHaveAttribute('aria-selected', 'true');
    });

    it('has proper ARIA attributes for accessibility', () => {
        render(<BarrierTypeSelector {...defaultProps} />);

        const container = screen.getByRole('tablist');
        expect(container).toHaveAttribute('aria-orientation', 'vertical');

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
    });

    it('supports keyboard navigation', async () => {
        render(<BarrierTypeSelector {...defaultProps} />);

        const tabs = screen.getAllByRole('tab');
        tabs[0].focus();

        await userEvent.keyboard('{ArrowDown}');

        expect(mockOnSelectType).toHaveBeenCalledWith('below_spot');
    });
});
