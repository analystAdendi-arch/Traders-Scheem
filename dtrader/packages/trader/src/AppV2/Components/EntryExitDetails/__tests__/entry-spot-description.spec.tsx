import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EntrySpotDescription from '../entry-spot-description';

// Mock the entry spot helper
jest.mock('_common/utils/contract-entry-spot-helper', () => ({
    getEntrySpotTooltipText: jest.fn((contract_type?: string) => {
        if (contract_type === 'VANILLA' || contract_type === 'TURBOS') {
            return 'The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.';
        }
        return 'The first tick after the start time.';
    }),
}));

// Mock the dependencies
jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: { i18n_default_text: string }) => i18n_default_text,
}));

jest.mock('@deriv-com/quill-ui', () => ({
    ActionSheet: {
        Portal: ({
            children,
            showHandlebar,
            shouldCloseOnDrag,
        }: {
            children: React.ReactNode;
            showHandlebar: boolean;
            shouldCloseOnDrag: boolean;
        }) => (
            <div
                data-testid='action-sheet-portal'
                data-showhandlebar={showHandlebar}
                data-shouldcloseondrag={shouldCloseOnDrag}
            >
                {children}
            </div>
        ),
        Footer: ({
            alignment,
            primaryAction,
        }: {
            alignment: string;
            primaryAction: { content: React.ReactNode; onAction: () => void };
        }) => (
            <div data-testid='action-sheet-footer' data-alignment={alignment}>
                <button onClick={primaryAction.onAction}>{primaryAction.content}</button>
            </div>
        ),
    },
    Text: ({
        as,
        size,
        bold,
        color,
        className,
        children,
    }: {
        as?: string;
        size?: string;
        bold?: boolean;
        color?: string;
        className?: string;
        children: React.ReactNode;
    }) => (
        <div
            data-testid='text-component'
            data-as={as}
            data-size={size}
            data-bold={bold}
            data-color={color}
            className={className}
        >
            {children}
        </div>
    ),
}));

describe('EntrySpotDescription', () => {
    const mockOnActionSheetClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render the component with correct structure', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} />);

        // Check if the ActionSheet.Portal is rendered with correct props
        const portal = screen.getByTestId('action-sheet-portal');
        expect(portal).toBeInTheDocument();
        expect(portal).toHaveAttribute('data-showhandlebar', 'true');
        expect(portal).toHaveAttribute('data-shouldcloseondrag', 'true');

        // Check if the content is rendered correctly
        expect(screen.getByText('Entry spot')).toBeInTheDocument();
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();

        // Check if the footer is rendered with correct props
        const footer = screen.getByTestId('action-sheet-footer');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveAttribute('data-alignment', 'vertical');

        // Check if the button is rendered
        expect(screen.getByText('Got it')).toBeInTheDocument();
    });

    test('should call onActionSheetClose when "Got it" button is clicked', async () => {
        const user = userEvent.setup();
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} />);

        const gotItButton = screen.getByText('Got it');
        await user.click(gotItButton);

        expect(mockOnActionSheetClose).toHaveBeenCalledTimes(1);
    });

    test('should have the correct title styling', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} />);

        const titleElement = screen.getAllByTestId('text-component')[0];
        expect(titleElement).toHaveAttribute('data-size', 'xl');
        expect(titleElement).toHaveAttribute('data-bold', 'true');
        expect(titleElement).toHaveAttribute('data-color', 'quill-typography__color--prominent');
        expect(titleElement).toHaveClass('entry-spot-description__content__title');
    });

    test('should have the correct content structure', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} />);

        // Check if the content elements are within the correct containers
        expect(screen.getByText('Entry spot')).toBeInTheDocument();
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();

        // Check for the presence of the container divs by adding data-testid attributes to the mocked component
        expect(screen.getByTestId('action-sheet-portal')).toBeInTheDocument();

        // Since we're using mocks, we can't directly test for class names
        // Instead, we verify that the component structure is correct based on the rendered text
        expect(screen.getByText('Entry spot')).toBeInTheDocument();
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });

    test('should show "The first tick after the start time" for Accumulator contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='ACCU' />);
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });

    test('should show "The first tick after the start time" for Rise/Fall contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='RISE_FALL' />);
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });

    test('should show "The first tick after the start time" for Higher/Lower contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='HIGHER_LOWER' />);
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });

    test('should show "The first tick after the start time" for Touch/NoTouch contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='TOUCH' />);
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });

    test('should show "The first tick after the start time" for Multiplier contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='MULT' />);
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });

    test('should show "The tick at the start time..." for Vanilla contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='VANILLA' />);
        expect(
            screen.getByText(
                'The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.'
            )
        ).toBeInTheDocument();
    });

    test('should show "The tick at the start time..." for Turbos contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='TURBOS' />);
        expect(
            screen.getByText(
                'The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.'
            )
        ).toBeInTheDocument();
    });

    test('should show default tooltip text for unknown contract type', () => {
        render(<EntrySpotDescription onActionSheetClose={mockOnActionSheetClose} contract_type='UNKNOWN' />);
        expect(screen.getByText('The first tick after the start time.')).toBeInTheDocument();
    });
});
