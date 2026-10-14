import React from 'react';
import clsx from 'clsx';

import usePopoverPosition from './hooks/use-popover-position';
import { InputPopoverProps } from './types';

const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

const InputPopover = React.memo(
    ({
        isOpen,
        onClose,
        triggerRef,
        children,
        className,
        popoverWidth = 240,
        spacing = 16,
        placement = 'left',
    }: InputPopoverProps) => {
        const position = usePopoverPosition({
            triggerRef,
            isOpen,
            popoverWidth,
            spacing,
            placement,
        });

        const style = React.useMemo(
            () => ({
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${popoverWidth}px`,
            }),
            [position.top, position.left, popoverWidth]
        );

        if (!isOpen) return null;

        return (
            <div className='input-popover-overlay' onClick={onClose}>
                <div className={clsx('input-popover', className)} onClick={stopPropagation} style={style}>
                    {children}
                </div>
            </div>
        );
    }
);
InputPopover.displayName = 'InputPopover';

export default InputPopover;
