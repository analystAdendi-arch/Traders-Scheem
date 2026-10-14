import React from 'react';

import DesktopWrapper from '../desktop-wrapper';
import MobileDialog from '../mobile-dialog';
import MobileWrapper from '../mobile-wrapper';
import Modal from '../modal';

import ErrorModalContent from './error-modal-content';

type TMessageObject = {
    message: string;
    toString: () => string;
};

type TErrorModalProps = {
    messages: Array<TMessageObject | React.ReactNode>;
};

const ErrorModal = ({ messages }: TErrorModalProps) => {
    const [is_error_modal_open, setErrorModalOpen] = React.useState(false);

    // Extract error message - handle both TMessageObject and React.ReactNode
    const firstMessage = messages?.[0];
    const error_message_description =
        typeof firstMessage === 'object' && firstMessage && 'message' in firstMessage
            ? firstMessage.message
            : firstMessage?.toString();

    React.useEffect(() => {
        setErrorModalOpen(true);
    }, []);

    const toggleErrorModal = () => {
        setErrorModalOpen(!is_error_modal_open);
    };

    return (
        <Modal has_close_icon width='440px' is_open={is_error_modal_open} toggleModal={toggleErrorModal}>
            <DesktopWrapper>
                <Modal.Body>
                    <ErrorModalContent error_message={error_message_description} />
                </Modal.Body>
            </DesktopWrapper>
            <MobileWrapper>
                <MobileDialog
                    portal_element_id='modal_root'
                    has_close_icon
                    visible={is_error_modal_open}
                    onClose={toggleErrorModal}
                >
                    <Modal.Body>
                        <ErrorModalContent error_message={error_message_description} />
                    </Modal.Body>
                </MobileDialog>
            </MobileWrapper>
        </Modal>
    );
};

export default ErrorModal;
