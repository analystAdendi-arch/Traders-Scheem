import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { useMobileBridge } from '@deriv/api';
import { Button, Modal } from '@deriv/components';
import { getBrandUrl, openExternalUrl } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useTranslations } from '@deriv-com/translations';

type TInsufficientBalanceModal = RouteComponentProps & {
    is_virtual?: boolean;
    is_visible: boolean;
    message: string;
    toggleModal: () => void;
};

const InsufficientBalanceModal = observer(
    ({ is_virtual, is_visible, message, toggleModal }: TInsufficientBalanceModal) => {
        const {
            ui: { is_mobile },
            client: { currency },
            common: { current_language },
        } = useStore();
        const { localize } = useTranslations();
        const { sendBridgeEvent } = useMobileBridge();

        const handleTransferClick = () => {
            if (!is_virtual) {
                const brandUrl = getBrandUrl();
                const lang_param = current_language ? `&lang=${current_language}` : '';
                sendBridgeEvent('trading:transfer', () => {
                    openExternalUrl(`${brandUrl}/transfer?from=dtrader&source=options&acc=options&curr=${currency}${lang_param}`);
                });
            } else {
                toggleModal();
            }
        };

        return (
            <Modal
                id='dt_insufficient_balance_modal'
                is_open={is_visible}
                small
                is_vertical_centered={is_mobile}
                toggleModal={toggleModal}
                title={localize('Insufficient balance')}
            >
                <Modal.Body>{message}</Modal.Body>
                <Modal.Footer>
                    <Button
                        has_effect
                        text={is_virtual ? localize('OK') : localize('Deposit now')}
                        onClick={handleTransferClick}
                        primary
                    />
                </Modal.Footer>
            </Modal>
        );
    }
);

export default withRouter(InsufficientBalanceModal);
