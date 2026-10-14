import React from 'react';
import clsx from 'clsx';

import { TooltipPortal } from '@deriv/components';
import { LabelPairedCircleInfoMdRegularIcon } from '@deriv/quill-icons';
import { TextField } from '@deriv-com/quill-ui';

import { InputPopover } from 'AppV2/Components/InputPopover';

type TTradeParameterPopoverProps = {
    label: React.ReactNode;
    value: string;
    is_minimized?: boolean;
    disabled?: boolean;
    has_error?: boolean;
    popover_classname: string;
    popoverWidth?: number;
    children: React.ReactNode;
    header?: React.ReactNode;
    onOpen?: () => void;
    onClose?: () => void;
    description?: React.ReactNode;
};

type TTradeParameterPopoverContext = {
    closePopover: () => void;
};

export const TradeParameterPopoverContext = React.createContext<TTradeParameterPopoverContext | null>(null);

export const useTradeParameterPopover = () => {
    const context = React.useContext(TradeParameterPopoverContext);
    if (!context) {
        throw new Error('useTradeParameterPopover must be used within TradeParameterPopover');
    }
    return context;
};

const TradeParameterPopover = ({
    label,
    value,
    is_minimized,
    disabled,
    has_error,
    popover_classname,
    popoverWidth,
    children,
    header,
    onOpen: onOpenCallback,
    onClose: onCloseCallback,
    description,
}: TTradeParameterPopoverProps) => {
    const [is_open, setIsOpen] = React.useState(false);
    const field_ref = React.useRef<HTMLDivElement>(null);

    const onOpen = React.useCallback(() => {
        setIsOpen(true);
        onOpenCallback?.();
    }, [onOpenCallback]);

    const onClose = React.useCallback(() => {
        setIsOpen(false);
        onCloseCallback?.();
    }, [onCloseCallback]);

    const closePopover = React.useCallback(() => {
        onClose();
    }, [onClose]);

    const contextValue = React.useMemo(() => ({ closePopover }), [closePopover]);

    return (
        <React.Fragment>
            <div ref={field_ref} className={clsx(description && 'trade-params__field-with-info')}>
                <TextField
                    disabled={disabled}
                    variant='fill'
                    readOnly
                    label={label}
                    noStatusIcon
                    onClick={onOpen}
                    value={value}
                    className={clsx('trade-params__option', is_minimized && 'trade-params__option--minimized')}
                    status={has_error ? 'error' : 'neutral'}
                />
                {description && (
                    <div className='trade-params__info-icon-wrapper'>
                        <TooltipPortal
                            message={description}
                            anchorRef={field_ref}
                            position='left'
                            className='trade-params__parameter-tooltip'
                        >
                            <LabelPairedCircleInfoMdRegularIcon className='trade-params__info-icon' />
                        </TooltipPortal>
                    </div>
                )}
            </div>
            <InputPopover
                isOpen={is_open}
                onClose={onClose}
                triggerRef={field_ref}
                className={popover_classname}
                popoverWidth={popoverWidth}
                spacing={8}
            >
                <TradeParameterPopoverContext.Provider value={contextValue}>
                    {header && <div className={`${popover_classname}__header`}>{header}</div>}
                    {children}
                </TradeParameterPopoverContext.Provider>
            </InputPopover>
        </React.Fragment>
    );
};

export default TradeParameterPopover;
