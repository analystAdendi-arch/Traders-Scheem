import React from 'react';

import { Button, Modal } from '@deriv/components';
import { redirectToLogin, redirectToSignUp } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';

type TAuthorizationRequiredModal = {
    is_visible: boolean;
    toggleModal: () => void;
    is_appstore?: boolean;
    is_logged_in: boolean;
};

const AuthorizationRequiredModal = ({ is_visible, toggleModal }: TAuthorizationRequiredModal) => {
    const { localize } = useTranslations();
    const { common } = useStore();
    return (
        <Modal
            id='dt_authorization_required_modal'
            is_open={is_visible}
            small
            toggleModal={toggleModal}
            title={localize('Start trading with us')}
        >
            <Modal.Body>{localize('Log in or create a free account to place a trade.')}</Modal.Body>
            <Modal.Footer>
                <Button
                    has_effect
                    text={localize('Log in')}
                    onClick={() => redirectToLogin(common.current_language)}
                    secondary
                />
                <Button
                    has_effect
                    text={localize('Create free account')}
                    onClick={() => redirectToSignUp(common.current_language)}
                    primary
                />
            </Modal.Footer>
        </Modal>
    );
};

export default AuthorizationRequiredModal;
