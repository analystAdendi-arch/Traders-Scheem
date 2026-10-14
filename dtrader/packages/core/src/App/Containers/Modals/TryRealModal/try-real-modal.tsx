import { useMobileBridge } from '@deriv/api';
import { getBrandUrl, openExternalUrl } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { ActionSheet, Modal, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

const TryRealModal = observer(() => {
    const { ui, common } = useStore();
    const { is_try_real_modal_visible, toggleTryRealModal, is_mobile } = ui;
    const { sendBridgeEvent } = useMobileBridge();

    const onClose = () => toggleTryRealModal(false);

    const handleCreateRealAccount = () => {
        const brandUrl = getBrandUrl();
        const lang_param = common.current_language ? `&lang=${common.current_language}` : '';
        sendBridgeEvent('trading:account_creation', () => {
            openExternalUrl(`${brandUrl}/onboarding/personal-details?source=options${lang_param}`);
        });
    };

    if (!is_try_real_modal_visible) return null;

    const sharedContent = {
        title: <Localize i18n_default_text='Complete your profile setup' />,
        message: <Localize i18n_default_text='Finish setting up your profile to continue.' />,
        primaryButtonText: <Localize i18n_default_text='Complete setup' />,
    };

    // Mobile Action Sheet
    if (is_mobile) {
        return (
            <ActionSheet.Root isOpen={is_try_real_modal_visible} onClose={onClose} expandable={false} position='left'>
                <ActionSheet.Portal showHandlebar shouldCloseOnDrag>
                    <ActionSheet.Content>
                        <Text size='lg' bold>
                            {sharedContent.title}
                        </Text>
                        <div style={{ marginTop: '16px' }}>
                            <Text size='sm'>{sharedContent.message}</Text>
                        </div>
                    </ActionSheet.Content>
                    <ActionSheet.Footer
                        alignment='vertical'
                        primaryButtonColor='coral'
                        primaryAction={{
                            content: sharedContent.primaryButtonText,
                            onAction: handleCreateRealAccount,
                        }}
                    />
                </ActionSheet.Portal>
            </ActionSheet.Root>
        );
    }

    // Desktop Modal
    return (
        <Modal
            isOpened={is_try_real_modal_visible}
            toggleModal={onClose}
            primaryButtonLabel={sharedContent.primaryButtonText}
            primaryButtonCallback={handleCreateRealAccount}
            buttonColor='coral'
        >
            <Modal.Header title={sharedContent.title} />
            <Modal.Body>
                <Text size='sm'>{sharedContent.message}</Text>
            </Modal.Body>
        </Modal>
    );
});

export default TryRealModal;
