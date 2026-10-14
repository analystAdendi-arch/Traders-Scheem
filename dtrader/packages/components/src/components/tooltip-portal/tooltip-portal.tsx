// TODO: this component is created as a temporary solution until we migrate to a new design system. We can replace it with existing popover/tooltip component when they meet our requirements.

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import debounce from 'lodash.debounce';

// Tooltip positioning constants
const TOOLTIP_OFFSET = 4; // Distance between tooltip and trigger in pixels
const VIEWPORT_PADDING = 8; // Minimum padding from viewport edges in pixels

type TTooltipPortalProps = {
    /**
     * Tooltip content to display.
     * @security If passing user-generated content, ensure proper sanitization.
     * Current safe usage: <Localize> components and localize() function which handle sanitization.
     */
    message: React.ReactNode;
    /** Element that triggers the tooltip on hover/focus */
    children: React.ReactNode;
    /** Additional CSS class names */
    className?: string;
    /** Position of the tooltip relative to the trigger element */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Optional ref to an external element to position the tooltip relative to (instead of the trigger) */
    anchorRef?: React.RefObject<HTMLElement>;
};

/**
 * TooltipPortal component for displaying contextual information.
 * Renders tooltip content in a React Portal to escape parent overflow constraints.
 *
 * @accessibility
 * - Supports keyboard navigation (Tab to focus, Escape to close)
 * - Includes ARIA attributes for screen readers
 * - Focusable trigger element with role="button"
 *
 * @security
 * - message prop accepts React.ReactNode for localization support
 * - All current usage sites use <Localize> component which handles sanitization
 * - If adding new usage, ensure user input is properly sanitized
 */
const TooltipPortal = ({ message, children, className, position = 'top', anchorRef }: TTooltipPortalProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const calculatePosition = React.useCallback(() => {
        // Use anchorRef if provided, otherwise use triggerRef
        const positioningElement = anchorRef?.current || triggerRef.current;
        if (!positioningElement || !tooltipRef.current) return;

        const triggerRect = positioningElement.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        let top = 0;
        let left = 0;
        let arrowTop = 0;
        let arrowLeft = 0;

        switch (position) {
            case 'top':
                // Position tooltip above and to the right of trigger
                // Arrow will be on the left side of tooltip, aligned with trigger left edge
                top = triggerRect.top + scrollY - tooltipRect.height - TOOLTIP_OFFSET;
                left = triggerRect.left + scrollX;
                // Arrow positioned at bottom of tooltip, 1.6rem from left edge (absolute positioning)
                arrowTop = tooltipRect.height - 0.6;
                arrowLeft = 16; // 1.6rem = 16px
                break;
            case 'bottom':
                top = triggerRect.bottom + scrollY + TOOLTIP_OFFSET;
                left = triggerRect.left + scrollX;
                arrowTop = -6;
                arrowLeft = 16;
                break;
            case 'left':
                top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.left + scrollX - tooltipRect.width - VIEWPORT_PADDING;
                break;
            case 'right':
                top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.right + scrollX + VIEWPORT_PADDING;
                break;
            default:
                // Default to top position
                top = triggerRect.top + scrollY - tooltipRect.height - TOOLTIP_OFFSET;
                left = triggerRect.left + scrollX;
                arrowTop = tooltipRect.height - 0.6;
                arrowLeft = 16;
                break;
        }

        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 0) left = VIEWPORT_PADDING;
        if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - VIEWPORT_PADDING;
        }
        if (top < scrollY) top = scrollY + VIEWPORT_PADDING;
        if (top + tooltipRect.height > scrollY + viewportHeight) {
            top = scrollY + viewportHeight - tooltipRect.height - VIEWPORT_PADDING;
        }

        setTooltipPosition({ top, left });
        if (position === 'top' || position === 'bottom') {
            setArrowPosition({ top: arrowTop, left: arrowLeft });
        }
    }, [position, anchorRef]);

    const debouncedCalculatePosition = React.useMemo(() => debounce(calculatePosition, 100), [calculatePosition]);

    useEffect(() => {
        if (isVisible) {
            calculatePosition();
            window.addEventListener('scroll', debouncedCalculatePosition);
            window.addEventListener('resize', debouncedCalculatePosition);

            return () => {
                window.removeEventListener('scroll', debouncedCalculatePosition);
                window.removeEventListener('resize', debouncedCalculatePosition);
                debouncedCalculatePosition.cancel();
            };
        }
    }, [isVisible, calculatePosition, debouncedCalculatePosition]);

    const handleMouseEnter = React.useCallback(() => {
        setIsVisible(true);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        setIsVisible(false);
    }, []);

    const handleFocus = React.useCallback(() => {
        setIsVisible(true);
    }, []);

    const handleBlur = React.useCallback(() => {
        setIsVisible(false);
    }, []);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsVisible(false);
        }
    }, []);

    // Generate unique ID for ARIA attributes
    const tooltipId = React.useId();

    return (
        <>
            <span
                ref={triggerRef}
                className='dc-tooltip-portal__trigger'
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role='button'
                aria-describedby={isVisible ? tooltipId : undefined}
                style={{ display: 'inline-block' }}
            >
                {children}
            </span>
            {typeof document !== 'undefined' &&
                isVisible &&
                createPortal(
                    <div
                        id={tooltipId}
                        ref={tooltipRef}
                        role='tooltip'
                        aria-live='polite'
                        className={classNames('dc-tooltip-portal', className)}
                        style={{
                            position: 'absolute',
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            zIndex: 9999,
                        }}
                    >
                        <div className='dc-tooltip-portal__content'>{message}</div>
                        <div
                            className={`dc-tooltip-portal__arrow dc-tooltip-portal__arrow--${position}`}
                            data-testid={`arrow-${position}`}
                            style={
                                position === 'top' || position === 'bottom'
                                    ? {
                                          position: 'absolute',
                                          top: `${arrowPosition.top}px`,
                                          left: `${arrowPosition.left}px`,
                                          bottom: 'auto',
                                          right: 'auto',
                                      }
                                    : undefined
                            }
                        />
                    </div>,
                    document.body
                )}
        </>
    );
};

export default TooltipPortal;
