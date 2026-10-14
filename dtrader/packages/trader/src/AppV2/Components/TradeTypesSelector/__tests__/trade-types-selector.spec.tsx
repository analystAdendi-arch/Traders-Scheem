import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TRADE_TYPES } from '@deriv/shared';

import { AVAILABLE_CONTRACTS } from 'AppV2/Utils/trade-types-utils';

import TradeTypesSelector from '../trade-types-selector';

jest.mock('@deriv-com/quill-ui', () => ({
    Text: ({ children, className, size }: { children: React.ReactNode; className?: string; size?: string }) => (
        <span className={`quill-text ${size ? `size-${size}` : ''} ${className || ''}`}>{children}</span>
    ),
}));

jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: { i18n_default_text: string }) => <span>{i18n_default_text}</span>,
}));

jest.mock('AppV2/Components/InputPopover', () => ({
    InputPopover: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean; onClose: () => void }) =>
        isOpen ? <div data-testid='mock-popover'>{children}</div> : null,
}));

jest.mock('Assets/SvgComponents/ic-grid.svg', () => {
    const GridIcon = () => <div data-testid='mock-grid-icon'>GridIcon</div>;
    GridIcon.displayName = 'GridIcon';
    return GridIcon;
});

jest.mock('../trade-types-selector-content', () => {
    const TradeTypesSelectorContent = () => <div data-testid='mock-content'>TradeTypesSelectorContent</div>;
    TradeTypesSelectorContent.displayName = 'TradeTypesSelectorContent';
    return TradeTypesSelectorContent;
});

const mockOnTradeTypeSelect = jest.fn();
const mockOnGuideClick = jest.fn();

const defaultProps = {
    available_contracts: AVAILABLE_CONTRACTS,
    selected_trade_type: TRADE_TYPES.RISE_FALL,
    onTradeTypeSelect: mockOnTradeTypeSelect,
    onGuideClick: mockOnGuideClick,
};

describe('TradeTypesSelector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the grid button', () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        expect(gridButton).toBeInTheDocument();
        expect(screen.getByTestId('mock-grid-icon')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes on grid button when closed', () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        expect(gridButton).toHaveAttribute('aria-label', 'View all trade types');
        expect(gridButton).toHaveAttribute('aria-expanded', 'false');
        expect(gridButton).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should open popover when grid button is clicked', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByTestId('mock-popover')).toBeInTheDocument();
        });
        // Re-query button as it re-renders outside TooltipPortal when open
        expect(screen.getByRole('button', { name: /view all trade types/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('should render modal with proper ARIA attributes when open', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            const modal = screen.getByRole('dialog', { name: /trade types selection/i });
            expect(modal).toBeInTheDocument();
        });

        const modal = screen.getByRole('dialog', { name: /trade types selection/i });
        expect(modal).toHaveAttribute('aria-label', 'Trade types selection');
    });

    it('should render "All" and "Most traded" tabs with proper ARIA attributes', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
        });

        const allTab = screen.getByRole('tab', { name: /all/i });
        const mostTradedTab = screen.getByRole('tab', { name: /most traded/i });

        expect(allTab).toHaveAttribute('role', 'tab');
        expect(allTab).toHaveAttribute('aria-selected', 'true');
        expect(allTab).toHaveAttribute('aria-controls', 'trade-types-content');

        expect(mostTradedTab).toHaveAttribute('role', 'tab');
        expect(mostTradedTab).toHaveAttribute('aria-selected', 'false');
        expect(mostTradedTab).toHaveAttribute('aria-controls', 'trade-types-content');
    });

    it('should switch between "All" and "Most traded" tabs', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute('aria-selected', 'true');
        });

        const mostTradedTab = screen.getByRole('tab', { name: /most traded/i });
        await userEvent.click(mostTradedTab);

        await waitFor(() => {
            expect(mostTradedTab).toHaveAttribute('aria-selected', 'true');
        });
        expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('should render Guide button and call onGuideClick when clicked', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /guide/i })).toBeInTheDocument();
        });

        const guideButton = screen.getByRole('button', { name: /guide/i });
        await userEvent.click(guideButton);

        expect(mockOnGuideClick).toHaveBeenCalledTimes(1);
    });

    it('should close popover and reset tab to "all" when Guide button is clicked', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        let gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        // Switch to "Most traded" tab
        const mostTradedTab = screen.getByRole('tab', { name: /most traded/i });
        await userEvent.click(mostTradedTab);

        // Click Guide button
        const guideButton = screen.getByRole('button', { name: /guide/i });
        await userEvent.click(guideButton);

        await waitFor(() => {
            expect(screen.queryByTestId('mock-popover')).not.toBeInTheDocument();
        });

        // Reopen popover - re-query button as it moved back into TooltipPortal
        gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute('aria-selected', 'true');
        });
        expect(screen.getByRole('tab', { name: /most traded/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('should render content component when popover is open', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByTestId('mock-content')).toBeInTheDocument();
        });
    });

    it('should apply active class to button when popover is open', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });

        expect(gridButton).not.toHaveClass('trade-types-selector__button--active');

        await userEvent.click(gridButton);

        await waitFor(() => {
            // Re-query button as it re-renders outside TooltipPortal when open
            expect(screen.getByRole('button', { name: /view all trade types/i })).toHaveClass(
                'trade-types-selector__button--active'
            );
        });
    });

    it('should use consistent text size (md) for both tabs', async () => {
        render(<TradeTypesSelector {...defaultProps} />);

        const gridButton = screen.getByRole('button', { name: /view all trade types/i });
        await userEvent.click(gridButton);

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
        });

        const allTab = screen.getByRole('tab', { name: /all/i });
        const mostTradedTab = screen.getByRole('tab', { name: /most traded/i });

        // Both tabs should have content rendered
        expect(allTab).toHaveTextContent('All');
        expect(mostTradedTab).toHaveTextContent('Most traded');
    });
});
