import React, { useEffect, useState } from 'react';

import { useMobileBridge } from '@deriv/api';
import { getBrandUrl, isEmptyObject, mapErrorMessage, redirectToLogin, redirectToSignUp, openExternalUrl } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { ActionSheet, Modal, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { checkIsServiceModalError, SERVICE_ERROR } from 'AppV2/Utils/layout-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import ServiceErrorDescription from './service-error-description';

const ServiceErrorSheet = observer(() => {
    const [is_open, setIsOpen] = useState(false);
    const { common, client, ui } = useStore();
    const { is_mobile } = ui;
    const { is_virtual, currency } = client;
    const { services_error, resetServicesError, current_language } = common;
    const { clearPurchaseInfo, requestProposal: resetPurchase } = useTraderStore();
    const { sendBridgeEvent } = useMobileBridge();

    const { code, type } = services_error || {};

    // Get mapped error message
    const mappedMessage = mapErrorMessage(services_error || {});
    const is_insufficient_balance = code === SERVICE_ERROR.INSUFFICIENT_BALANCE;
    const is_authorization_required = code === SERVICE_ERROR.AUTHORIZATION_REQUIRED && type === 'buy';
    const should_show_error_modal = !isEmptyObject(services_error) && checkIsServiceModalError({ services_error });

    const onClose = () => {
        setIsOpen(false);
        if (services_error.type === 'buy') {
            if (is_insufficient_balance) {
                return;
            }
            clearPurchaseInfo();
            resetPurchase();
        }
    };

    const getActionButtonProps = () => {
        if (is_insufficient_balance) {
            // Show OK button for virtual accounts, Deposit now for real accounts
            if (is_virtual) {
                return {
                    primaryAction: {
                        content: <Localize i18n_default_text='OK' />,
                        onAction: () => {
                            resetServicesError();
                            onClose();
                        },
                    },
                };
            }
            return {
                primaryAction: {
                    content: <Localize i18n_default_text='Deposit now' />,
                    onAction: () => {
                        resetServicesError();
                        const brandUrl = getBrandUrl();
                        const lang_param = current_language ? `&lang=${current_language}` : '';
                        sendBridgeEvent('trading:transfer', () => {
                            openExternalUrl(`${brandUrl}/transfer?from=dtrader&source=options&acc=options&curr=${currency}${lang_param}`);
                        });
                    },
                },
            };
        }
        if (is_authorization_required) {
            return {
                primaryAction: {
                    content: <Localize i18n_default_text='Create free account' />,
                    onAction: () => {
                        resetServicesError();
                        redirectToSignUp(current_language);
                    },
                },
                secondaryAction: {
                    content: <Localize i18n_default_text='Login' />,
                    onAction: () => {
                        resetServicesError();
                        redirectToLogin(current_language);
                    },
                },
            };
        }
    };

    const getErrorType = () => {
        if (is_insufficient_balance) return SERVICE_ERROR.INSUFFICIENT_BALANCE;
        if (is_authorization_required) return SERVICE_ERROR.AUTHORIZATION_REQUIRED;
        return null;
    };

    useEffect(() => {
        setIsOpen(should_show_error_modal);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [should_show_error_modal]);

    useEffect(() => {
        if (!is_open && code) resetServicesError();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [is_open]);

    const getModalContent = () => {
        if (is_insufficient_balance) {
            return {
                title: <Localize i18n_default_text='Insufficient balance' />,
                message: mappedMessage || <Localize i18n_default_text='An error occurred.' />,
            };
        }
        if (is_authorization_required) {
            return {
                title: <Localize i18n_default_text='Start trading with us' />,
                message: <Localize i18n_default_text='Log in or create a free account to place a trade.' />,
            };
        }
        return { title: null, message: null };
    };

    const getModalButtonProps = () => {
        const action_button_props = getActionButtonProps();
        if (!action_button_props) return {};

        const props: Record<string, unknown> = {
            primaryButtonLabel: action_button_props.primaryAction?.content,
            primaryButtonCallback: action_button_props.primaryAction?.onAction,
        };

        if (action_button_props.secondaryAction) {
            props.showSecondaryButton = true;
            props.secondaryButtonLabel = action_button_props.secondaryAction.content;
            props.secondaryButtonCallback = action_button_props.secondaryAction.onAction;
        }

        return props;
    };

    if (!should_show_error_modal) return null;

    if (is_mobile) {
        return (
            <ActionSheet.Root
                className='service-error-sheet'
                isOpen={is_open}
                onClose={onClose}
                expandable={false}
                position='left'
            >
                <ActionSheet.Portal showHandlebar shouldCloseOnDrag>
                    <div className='service-error-sheet__body'>
                        <ServiceErrorDescription error_type={getErrorType()} services_error_message={mappedMessage} />
                    </div>
                    <ActionSheet.Footer
                        className='service-error-sheet__footer'
                        alignment='vertical'
                        primaryButtonColor='coral'
                        {...getActionButtonProps()}
                    />
                </ActionSheet.Portal>
            </ActionSheet.Root>
        );
    }

    const { title, message } = getModalContent();

    return (
        <Modal
            isOpened={is_open}
            toggleModal={onClose}
            buttonColor='coral'
            shouldCloseOnPrimaryButtonClick={false}
            {...getModalButtonProps()}
        >
            <Modal.Header title={title} />
            <Modal.Body>
                <Text size='sm'>{message}</Text>
            </Modal.Body>
        </Modal>
    );
});

export default ServiceErrorSheet;
