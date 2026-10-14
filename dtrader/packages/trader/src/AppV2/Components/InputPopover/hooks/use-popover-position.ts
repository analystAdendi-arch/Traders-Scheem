import React from 'react';

import { PopoverPosition, UsePopoverPositionProps } from '../types';

const usePopoverPosition = ({
    triggerRef,
    isOpen,
    popoverWidth = 280,
    spacing = 16,
    placement = 'left',
}: UsePopoverPositionProps): PopoverPosition => {
    const [position, setPosition] = React.useState<PopoverPosition>({ top: 0, left: 0 });

    React.useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const calculatePosition = () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            if (placement === 'bottom') {
                // Position below the trigger element
                let left = rect.left;

                // If popover would overflow right edge, adjust position
                if (left + popoverWidth > viewportWidth - spacing) {
                    left = Math.max(spacing, viewportWidth - popoverWidth - spacing);
                }

                setPosition({
                    top: rect.bottom + spacing,
                    left,
                });
            } else {
                // Default 'left' placement - position to the left of the trigger
                setPosition({
                    top: rect.top,
                    left: rect.left - popoverWidth - spacing,
                });
            }
        };

        calculatePosition();

        window.addEventListener('resize', calculatePosition);
        return () => window.removeEventListener('resize', calculatePosition);
    }, [isOpen, triggerRef, popoverWidth, spacing, placement]);

    return position;
};

export default usePopoverPosition;
