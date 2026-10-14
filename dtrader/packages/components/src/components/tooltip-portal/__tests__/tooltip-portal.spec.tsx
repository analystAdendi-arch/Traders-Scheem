import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import TooltipPortal from '../tooltip-portal';

describe('TooltipPortal', () => {
    beforeEach(() => {
        // Clear any existing portals
        document.body.innerHTML = '';
    });

    describe('Rendering', () => {
        it('should render trigger element with children', () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            expect(screen.getByText('Hover me')).toBeInTheDocument();
        });

        it('should not render tooltip initially', () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
        });

        it('should apply custom className to tooltip', async () => {
            render(
                <TooltipPortal message='Test tooltip' className='custom-tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByRole('tooltip')).toHaveClass('custom-tooltip');
            });
        });
    });

    describe('Mouse Interactions', () => {
        it('should show tooltip on mouse enter', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });
        });

        it('should hide tooltip on mouse leave', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            fireEvent.mouseLeave(trigger);

            await waitFor(() => {
                expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
            });
        });
    });

    describe('Keyboard Accessibility', () => {
        it('should show tooltip on focus', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Focus me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Focus me');
            fireEvent.focus(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });
        });

        it('should hide tooltip on blur', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Focus me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Focus me');
            fireEvent.focus(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            fireEvent.blur(trigger);

            await waitFor(() => {
                expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
            });
        });

        it('should hide tooltip on Escape key press', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Focus me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Focus me');
            fireEvent.focus(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            fireEvent.keyDown(trigger, { key: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
            });
        });

        it('should be keyboard focusable with tabIndex', () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Focus me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByRole('button');
            expect(trigger).toHaveAttribute('tabIndex', '0');
        });
    });

    describe('ARIA Attributes', () => {
        it('should have role="button" on trigger', () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByRole('button');
            expect(trigger).toBeInTheDocument();
        });

        it('should have aria-describedby when tooltip is visible', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByRole('button');
            expect(trigger).not.toHaveAttribute('aria-describedby');

            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(trigger).toHaveAttribute('aria-describedby');
            });
        });

        it('should have role="tooltip" on tooltip element', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                expect(tooltip).toBeInTheDocument();
            });
        });

        it('should have aria-live="polite" on tooltip', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                expect(tooltip).toHaveAttribute('aria-live', 'polite');
            });
        });

        it('should have matching IDs for aria-describedby and tooltip id', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByRole('button');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const describedById = trigger.getAttribute('aria-describedby');
                const tooltip = screen.getByRole('tooltip');
                expect(tooltip.id).toBe(describedById);
            });
        });
    });

    describe('Positioning', () => {
        beforeEach(() => {
            // Mock getBoundingClientRect
            Element.prototype.getBoundingClientRect = jest.fn(() => ({
                width: 100,
                height: 50,
                top: 100,
                left: 100,
                bottom: 150,
                right: 200,
                x: 100,
                y: 100,
                toJSON: () => {},
            }));
        });

        it('should position tooltip at top by default', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                expect(tooltip).toHaveStyle({ position: 'absolute' });
            });
        });

        it('should position tooltip at bottom when specified', async () => {
            render(
                <TooltipPortal message='Test tooltip' position='bottom'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                const arrow = within(tooltip).getByTestId('arrow-bottom');
                expect(arrow).toBeInTheDocument();
            });
        });

        it('should position tooltip at left when specified', async () => {
            render(
                <TooltipPortal message='Test tooltip' position='left'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                const arrow = within(tooltip).getByTestId('arrow-left');
                expect(arrow).toBeInTheDocument();
            });
        });

        it('should position tooltip at right when specified', async () => {
            render(
                <TooltipPortal message='Test tooltip' position='right'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                const arrow = within(tooltip).getByTestId('arrow-right');
                expect(arrow).toBeInTheDocument();
            });
        });
    });

    describe('Portal Rendering', () => {
        it('should render tooltip in document.body', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                // Verify tooltip is rendered (portal creates it in document.body)
                expect(tooltip).toBeInTheDocument();
                expect(tooltip).toBeVisible();
            });
        });

        it('should have high z-index for tooltip', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                expect(tooltip).toHaveStyle({ zIndex: '9999' });
            });
        });
    });

    describe('Content Types', () => {
        it('should render string message', async () => {
            render(
                <TooltipPortal message='Simple text tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Simple text tooltip')).toBeInTheDocument();
            });
        });

        it('should render React element message', async () => {
            render(
                <TooltipPortal
                    message={
                        <div>
                            <strong>Bold text</strong> and normal text
                        </div>
                    }
                >
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Bold text')).toBeInTheDocument();
            });

            expect(screen.getByText('and normal text')).toBeInTheDocument();
        });

        it('should render localized message component', async () => {
            const LocalizeComponent = ({ i18n_default_text }: { i18n_default_text: string }) => (
                <span>{i18n_default_text}</span>
            );

            render(
                <TooltipPortal message={<LocalizeComponent i18n_default_text='Localized tooltip' />}>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Localized tooltip')).toBeInTheDocument();
            });
        });
    });

    describe('Event Cleanup', () => {
        it('should remove event listeners on unmount', async () => {
            const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            const { unmount } = render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

            addEventListenerSpy.mockRestore();
            removeEventListenerSpy.mockRestore();
        });

        it('should remove event listeners when tooltip is hidden', async () => {
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            fireEvent.mouseLeave(trigger);

            await waitFor(() => {
                expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
            });

            await waitFor(() => {
                expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
            });

            removeEventListenerSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid hover on/off', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');

            // Rapid hover on/off
            fireEvent.mouseEnter(trigger);
            fireEvent.mouseLeave(trigger);
            fireEvent.mouseEnter(trigger);
            fireEvent.mouseLeave(trigger);
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });
        });

        it('should handle missing refs gracefully', () => {
            const { container } = render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            // Component should render without errors even if refs are not yet set
            expect(container).toBeInTheDocument();
        });

        it('should handle window resize while tooltip is visible', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            // Trigger resize event
            fireEvent(window, new Event('resize'));

            // Tooltip should still be visible
            expect(screen.getByText('Test tooltip')).toBeInTheDocument();
        });

        it('should handle window scroll while tooltip is visible', async () => {
            render(
                <TooltipPortal message='Test tooltip'>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Test tooltip')).toBeInTheDocument();
            });

            // Trigger scroll event
            fireEvent(window, new Event('scroll'));

            // Tooltip should still be visible
            expect(screen.getByText('Test tooltip')).toBeInTheDocument();
        });
    });

    describe('Security', () => {
        it('should safely render sanitized JSX content', async () => {
            const SafeComponent = () => <span>Safe content</span>;

            render(
                <TooltipPortal message={<SafeComponent />}>
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                expect(screen.getByText('Safe content')).toBeInTheDocument();
            });
        });

        it('should render Localize component safely', async () => {
            const Localize = ({ i18n_default_text }: { i18n_default_text: string }) => (
                <span data-testid='localized'>{i18n_default_text}</span>
            );

            render(
                <TooltipPortal
                    message={
                        <Localize i18n_default_text='The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.' />
                    }
                >
                    <span>Hover me</span>
                </TooltipPortal>
            );

            const trigger = screen.getByText('Hover me');
            fireEvent.mouseEnter(trigger);

            await waitFor(() => {
                const localized = screen.getByTestId('localized');
                expect(localized).toBeInTheDocument();
            });
        });
    });
});
