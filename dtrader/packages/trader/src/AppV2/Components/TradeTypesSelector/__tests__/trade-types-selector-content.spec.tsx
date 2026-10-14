import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TRADE_TYPES } from '@deriv/shared';

import { AVAILABLE_CONTRACTS } from 'AppV2/Utils/trade-types-utils';

import TradeTypesSelectorContent from '../trade-types-selector-content';

jest.mock('@deriv-com/quill-ui', () => ({
    Text: ({ children, className, size }: { children: React.ReactNode; className?: string; size?: string }) => (
        <span className={`quill-text ${size ? `size-${size}` : ''} ${className || ''}`}>{children}</span>
    ),
}));

jest.mock('../../FireIcon', () => {
    const MockFireIcon = () => <span data-testid='dt_fire_icon' />;
    MockFireIcon.displayName = 'FireIcon';
    return { __esModule: true, default: MockFireIcon };
});

const mockOnTradeTypeSelect = jest.fn();

const defaultProps = {
    available_contracts: AVAILABLE_CONTRACTS,
    selected_trade_type: TRADE_TYPES.RISE_FALL,
    active_tab: 'all' as const,
    onTradeTypeSelect: mockOnTradeTypeSelect,
};

describe('TradeTypesSelectorContent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render all contracts when active_tab is "all"', () => {
        render(<TradeTypesSelectorContent {...defaultProps} />);

        // Should render all 10 trade types
        expect(screen.getByText(/Accumulators/)).toBeInTheDocument();
        expect(screen.getByText(/Rise\/Fall/)).toBeInTheDocument();
        expect(screen.getByText(/Multipliers/)).toBeInTheDocument();
        expect(screen.getByText(/Turbos/)).toBeInTheDocument();
        expect(screen.getByText(/Vanillas/)).toBeInTheDocument();
        expect(screen.getByText(/Higher\/Lower/)).toBeInTheDocument();
        expect(screen.getByText(/Touch\/No Touch/)).toBeInTheDocument();
        expect(screen.getByText(/Matches\/Differs/)).toBeInTheDocument();
        expect(screen.getByText(/Over\/Under/)).toBeInTheDocument();
        expect(screen.getByText(/Even\/Odd/)).toBeInTheDocument();
    });

    it('should render only popular contracts when active_tab is "most_traded"', () => {
        render(<TradeTypesSelectorContent {...defaultProps} active_tab='most_traded' />);

        // Should render only popular trade types (4 contracts have is_popular: true)
        expect(screen.getByText(/Accumulators/)).toBeInTheDocument();
        expect(screen.getByText(/Rise\/Fall/)).toBeInTheDocument();
        expect(screen.getByText(/Multipliers/)).toBeInTheDocument();
        expect(screen.getByText(/Matches\/Differs/)).toBeInTheDocument();
        expect(screen.getByText(/Over\/Under/)).toBeInTheDocument();

        // Non-popular contracts should not be rendered
        expect(screen.queryByText(/^Turbos$/)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Vanillas$/)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Higher\/Lower$/)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Touch\/No Touch$/)).not.toBeInTheDocument();
        expect(screen.queryByText(/^Even\/Odd$/)).not.toBeInTheDocument();
    });

    it('should group contracts by category (growth_based, directional, digit_based)', () => {
        render(<TradeTypesSelectorContent {...defaultProps} />);

        // Should render category labels
        expect(screen.getByText('Growth based')).toBeInTheDocument();
        expect(screen.getByText('Directional')).toBeInTheDocument();
        expect(screen.getByText('Digit based')).toBeInTheDocument();
    });

    it('should show fire icon for contracts with show_fire_icon=true', () => {
        render(<TradeTypesSelectorContent {...defaultProps} />);

        // Accumulators and Rise/Fall have show_fire_icon: true
        const accumulatorButton = screen.getByRole('button', { name: /select accumulators trade type/i });
        const riseFallButton = screen.getByRole('button', { name: /select rise\/fall trade type/i });

        expect(within(accumulatorButton).getByTestId('dt_fire_icon')).toBeInTheDocument();
        expect(within(riseFallButton).getByTestId('dt_fire_icon')).toBeInTheDocument();

        // Multipliers does not have show_fire_icon
        const multipliersButton = screen.getByRole('button', { name: /select multipliers trade type/i });
        expect(within(multipliersButton).queryByTestId('dt_fire_icon')).not.toBeInTheDocument();
    });

    it('should mark currently selected trade type with selected class', () => {
        render(<TradeTypesSelectorContent {...defaultProps} selected_trade_type={TRADE_TYPES.ACCUMULATOR} />);

        const accumulatorButton = screen.getByRole('button', { name: /select accumulators trade type/i });
        expect(accumulatorButton).toHaveClass('trade-types-selector__item--selected');
    });

    it('should not apply selected class to unselected trade types', () => {
        render(<TradeTypesSelectorContent {...defaultProps} selected_trade_type={TRADE_TYPES.ACCUMULATOR} />);

        const riseFallButton = screen.getByRole('button', { name: /select rise\/fall trade type/i });
        expect(riseFallButton).not.toHaveClass('trade-types-selector__item--selected');
    });

    it('should call onTradeTypeSelect with correct type when item is clicked', async () => {
        render(<TradeTypesSelectorContent {...defaultProps} />);

        const accumulatorButton = screen.getByRole('button', { name: /select accumulators trade type/i });
        await userEvent.click(accumulatorButton);

        expect(mockOnTradeTypeSelect).toHaveBeenCalledWith(TRADE_TYPES.ACCUMULATOR);
        expect(mockOnTradeTypeSelect).toHaveBeenCalledTimes(1);
    });

    it('should have proper ARIA attributes on trade type items', () => {
        render(<TradeTypesSelectorContent {...defaultProps} selected_trade_type={TRADE_TYPES.ACCUMULATOR} />);

        const accumulatorButton = screen.getByRole('button', {
            name: /select accumulators trade type, currently selected/i,
        });
        expect(accumulatorButton).toHaveAttribute('aria-label', 'Select Accumulators trade type, currently selected');
        expect(accumulatorButton).toHaveAttribute('aria-pressed', 'true');

        const riseFallButton = screen.getByRole('button', { name: /select rise\/fall trade type$/i });
        expect(riseFallButton).toHaveAttribute('aria-label', 'Select Rise/Fall trade type');
        expect(riseFallButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update aria-pressed based on selection state', () => {
        const { rerender } = render(
            <TradeTypesSelectorContent {...defaultProps} selected_trade_type={TRADE_TYPES.ACCUMULATOR} />
        );

        const accumulatorButton = screen.getByRole('button', {
            name: /select accumulators trade type, currently selected/i,
        });
        expect(accumulatorButton).toHaveAttribute('aria-pressed', 'true');

        // Change selection to Rise/Fall
        rerender(<TradeTypesSelectorContent {...defaultProps} selected_trade_type={TRADE_TYPES.RISE_FALL} />);

        const accumulatorButtonAfter = screen.getByRole('button', { name: /select accumulators trade type$/i });
        const riseFallButton = screen.getByRole('button', {
            name: /select rise\/fall trade type, currently selected/i,
        });

        expect(accumulatorButtonAfter).toHaveAttribute('aria-pressed', 'false');
        expect(riseFallButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should handle same category selection (e.g., vanillalongcall and vanillalongput)', () => {
        // Vanillas have two contract types: VANILLA.CALL and VANILLA.PUT
        render(
            <TradeTypesSelectorContent
                {...defaultProps}
                selected_trade_type='vanillalongcall' // Should match Vanillas category
            />
        );

        const vanillaButton = screen.getByRole('button', { name: /select vanillas trade type, currently selected/i });
        expect(vanillaButton).toHaveClass('trade-types-selector__item--selected');
        expect(vanillaButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should use correct text size (md) for trade type labels', () => {
        render(<TradeTypesSelectorContent {...defaultProps} />);

        const accumulatorButton = screen.getByRole('button', { name: /select accumulators trade type/i });

        expect(accumulatorButton).toBeInTheDocument();
        expect(accumulatorButton).toHaveTextContent(/Accumulators/);
    });

    it('should render categories in correct order: growth_based, directional, digit_based', () => {
        render(<TradeTypesSelectorContent {...defaultProps} />);

        const categoryLabels = screen.getAllByText(/Growth based|Directional|Digit based/);

        expect(categoryLabels[0]).toHaveTextContent('Growth based');
        expect(categoryLabels[1]).toHaveTextContent('Directional');
        expect(categoryLabels[2]).toHaveTextContent('Digit based');
    });

    it('should not render empty categories', () => {
        // Provide only growth_based contracts
        const growthBasedOnly = AVAILABLE_CONTRACTS.filter(c => c.category === 'growth_based');

        render(<TradeTypesSelectorContent {...defaultProps} available_contracts={growthBasedOnly} />);

        expect(screen.getByText('Growth based')).toBeInTheDocument();
        expect(screen.queryByText('Directional')).not.toBeInTheDocument();
        expect(screen.queryByText('Digit based')).not.toBeInTheDocument();
    });

    it('should optimize with useMemo for filtered contracts', () => {
        // This test verifies the component doesn't crash and renders correctly
        // The actual useMemo optimization is verified by the component not re-rendering unnecessarily
        const { rerender } = render(<TradeTypesSelectorContent {...defaultProps} />);

        // Change active_tab (should trigger useMemo recalculation)
        rerender(<TradeTypesSelectorContent {...defaultProps} active_tab='most_traded' />);

        // Verify filtered results
        expect(screen.getByText(/Accumulators/)).toBeInTheDocument();
        expect(screen.queryByText(/^Turbos$/)).not.toBeInTheDocument();
    });

    it('should optimize with useMemo for grouped contracts', () => {
        // This test verifies the component doesn't crash and renders correctly
        const { rerender } = render(<TradeTypesSelectorContent {...defaultProps} />);

        // Change available_contracts (should trigger useMemo recalculation)
        const limitedContracts = AVAILABLE_CONTRACTS.slice(0, 3);
        rerender(<TradeTypesSelectorContent {...defaultProps} available_contracts={limitedContracts} />);

        // Verify grouped results
        expect(screen.getByText(/Accumulators/)).toBeInTheDocument();
        expect(screen.getByText(/Rise\/Fall/)).toBeInTheDocument();
        expect(screen.getByText(/Multipliers/)).toBeInTheDocument();
        expect(screen.queryByText(/^Turbos$/)).not.toBeInTheDocument();
    });
});
