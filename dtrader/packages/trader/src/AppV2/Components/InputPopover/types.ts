export type PopoverPlacement = 'left' | 'bottom';

export interface InputPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
    className?: string;
    popoverWidth?: number;
    spacing?: number;
    placement?: PopoverPlacement;
}

export interface ValueChipsProps {
    values: number[];
    selectedValue?: number;
    onSelect: (value: number) => void;
    formatValue?: (value: number) => string;
    className?: string;
    chipClassName?: string;
}

export interface UsePopoverPositionProps {
    triggerRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    popoverWidth?: number;
    spacing?: number;
    placement?: PopoverPlacement;
}

export interface PopoverPosition {
    top: number;
    left: number;
}
