import React from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';

import { useOnClickOutside } from '../../../hooks/use-onclickoutside';

import './sass/contract-card-dialog.scss';

export type TContractCardDialogProps = {
    children: React.ReactNode;
    is_visible: boolean;
    left: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toggleDialog: (e: any) => void; // This function accomodates events for various HTML elements, which have no overlap, so typing it to any
    toggle_ref?: React.RefObject<HTMLElement>;
    top: number;
};

const ContractCardDialog = React.forwardRef(
    (
        { children, is_visible, left, toggleDialog, toggle_ref, top }: TContractCardDialogProps,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        const validateClickOutside = (event: MouseEvent) =>
            is_visible && !toggle_ref?.current?.contains(event.target as Node);

        useOnClickOutside(ref as React.RefObject<HTMLDivElement>, toggleDialog, validateClickOutside);

        const nodeRef = React.useRef(null);

        const dialog = (
            <CSSTransition
                in={is_visible}
                classNames={{
                    enter: 'dc-contract-card-dialog--enter',
                    enterDone: 'dc-contract-card-dialog--enter-done',
                    exit: 'dc-contract-card-dialog--exit',
                }}
                timeout={150}
                nodeRef={nodeRef}
                unmountOnExit
            >
                <div
                    ref={node => {
                        (nodeRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                        if (typeof ref === 'function') {
                            ref(node);
                        } else if (ref) {
                            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                        }
                    }}
                    className='dc-contract-card-dialog'
                    style={{
                        top,
                        left: `calc(${left}px + 32px)`,
                    }}
                >
                    {children}
                </div>
            </CSSTransition>
        );
        const derivatives_trader_element = document.getElementById('derivatives_trader');
        return ReactDOM.createPortal(
            dialog, // use portal to render dialog above ThemedScrollbars container
            derivatives_trader_element || document.body
        );
    }
);

ContractCardDialog.displayName = 'ContractCardDialog';

export default ContractCardDialog;
