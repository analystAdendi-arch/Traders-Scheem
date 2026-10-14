import React from 'react';
import classNames from 'classnames';

import { LegacyMinimize2pxIcon } from '@deriv/quill-icons';

import Text from '../text/text';

type TFlyout = {
    is_open: boolean;
    onClose: () => void;
    title?: string | React.ReactNode;
    header_content?: React.ReactNode;
    footer_content?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

const Flyout = ({ is_open, onClose, title, header_content, footer_content, children, className }: TFlyout) => {
    return (
        <div
            className={classNames('dc-flyout', className, {
                'dc-flyout--open': is_open,
            })}
            role='dialog'
            aria-labelledby='flyout-title'
            aria-hidden={!is_open}
            aria-modal='true'
        >
            <div className='dc-flyout__header'>
                {header_content || (
                    <React.Fragment>
                        <Text color='primary' weight='bold' size='xs' id='flyout-title'>
                            {title}
                        </Text>
                        <button
                            className='dc-flyout__icon-close'
                            onClick={onClose}
                            aria-label='Close flyout'
                            type='button'
                        >
                            <LegacyMinimize2pxIcon iconSize='xs' fill='var(--color-text-primary)' />
                        </button>
                    </React.Fragment>
                )}
            </div>
            <div
                className={classNames('dc-flyout__body', {
                    'dc-flyout__body--with-footer': !!footer_content,
                })}
            >
                {children}
            </div>
            {footer_content && <div className='dc-flyout__footer'>{footer_content}</div>}
        </div>
    );
};

export default Flyout;
