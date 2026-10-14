import React from 'react';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';

type TToast = {
    className?: string;
    is_open?: boolean;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onClose?: () => void;
    type?: 'error' | 'info' | 'notification';
    timeout?: number;
};

const Toast = ({
    children,
    className,
    is_open = true,
    onClose,
    onClick,
    type = 'info',
    timeout = 0,
}: React.PropsWithChildren<TToast>) => {
    const [is_visible, setVisible] = React.useState(false);
    const nodeRef = React.useRef(null);

    React.useEffect(() => {
        setVisible(is_open);

        if (timeout) {
            const timeout_id = setTimeout(() => {
                setVisible(false);
            }, timeout);
            return () => clearTimeout(timeout_id);
        }

        return undefined;
    }, [is_open, timeout]);

    return (
        <CSSTransition
            in={is_visible}
            timeout={100}
            unmountOnExit
            onExited={() => {
                if (typeof onClose === 'function') {
                    onClose();
                }
                setVisible(false);
            }}
            classNames={{
                appear: 'dc-toast--enter',
                enter: 'dc-toast--enter',
                enterDone: 'dc-toast--enter-done',
                exit: 'dc-toast--exit',
            }}
            nodeRef={nodeRef}
        >
            <div
                ref={nodeRef}
                className={classNames('dc-toast', className, {
                    [`dc-toast__${type}`]: type,
                })}
                onMouseDown={e => {
                    // To prevent click outside for modal
                    e.nativeEvent.preventDefault();
                    e.nativeEvent.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}
            >
                <div className='dc-toast__message' onClick={onClick}>
                    <div className='dc-toast__message-content'>{children}</div>
                </div>
            </div>
        </CSSTransition>
    );
};

export default Toast;
