import React from 'react';
import { observer } from 'mobx-react-lite';

import { Button, useSnackbar } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import useIsVirtualKeyboardOpen from 'AppV2/Hooks/useIsVirtualKeyboardOpen';
import { getSnackBarText } from 'AppV2/Utils/trade-params-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import TakeProfitAndStopLossInput from './take-profit-and-stop-loss-input';

type TTakeProfitAndStopLossContainerProps = {
    closeActionSheet: () => void;
    should_show_deal_cancellation?: boolean;
};

const TakeProfitAndStopLossContainer = observer(({ closeActionSheet }: TTakeProfitAndStopLossContainerProps) => {
    const {
        has_take_profit,
        has_cancellation,
        has_stop_loss,
        take_profit,
        onChangeMultiple,
        stop_loss,
        validation_errors,
    } = useTraderStore();

    const { addSnackbar } = useSnackbar();

    const [tp_error_text, setTPErrorText] = React.useState<React.ReactNode>(validation_errors?.take_profit?.[0] ?? '');
    const tp_ref = React.useRef({ has_take_profit, take_profit, tp_error_text: validation_errors?.take_profit?.[0] });
    const is_api_response_tp_received_ref = React.useRef(false);

    const [sl_error_text, setSLErrorText] = React.useState<React.ReactNode>(validation_errors?.stop_loss?.[0] ?? '');
    const sl_ref = React.useRef({ has_stop_loss, stop_loss, sl_error_text: validation_errors?.stop_loss?.[0] });
    const is_api_response_sl_received_ref = React.useRef(false);

    // Detect keyboard visibility for Stop Loss input
    const { is_key_board_visible: is_sl_keyboard_visible } = useIsVirtualKeyboardOpen('stop_loss');

    const wrapper_ref = React.useRef<HTMLDivElement>(null);

    // Scroll container to bottom when Stop Loss keyboard opens
    React.useEffect(() => {
        if (!is_sl_keyboard_visible || !wrapper_ref.current) return;

        let rafId: number;
        let lastViewportHeight = window.visualViewport?.height || 0;
        let viewportStableFrames = 0;
        const VIEWPORT_STABLE_FRAMES = 3;
        // Save button may have a separate animation cycle from the keyboard —
        // wait for its position to stop changing before scrolling
        const BUTTON_STABLE_FRAMES = 3;

        const scrollToBottom = () => {
            // Find the parent Action Sheet container which is the actual scrollable element
            const scrollableParent = wrapper_ref.current?.closest('.risk-management__picker');
            if (scrollableParent) {
                scrollableParent.scrollTo({
                    top: scrollableParent.scrollHeight,
                    behavior: 'smooth',
                });
            }
        };

        // After viewport is stable, poll save button position each frame until it stops moving.
        // getBoundingClientRect is only called after keyboard animation ends (~20 reads total).
        const checkSaveButtonStability = () => {
            const saveButton = wrapper_ref.current?.querySelector('.risk-management__save-button');
            if (!saveButton) {
                scrollToBottom();
                return;
            }

            let lastTop = saveButton.getBoundingClientRect().top;
            let stableFrames = 0;

            const poll = () => {
                const currentTop = saveButton.getBoundingClientRect().top;
                if (currentTop === lastTop) {
                    stableFrames++;
                    if (stableFrames >= BUTTON_STABLE_FRAMES) {
                        scrollToBottom();
                        return;
                    }
                } else {
                    stableFrames = 0;
                    lastTop = currentTop;
                }
                rafId = requestAnimationFrame(poll);
            };

            rafId = requestAnimationFrame(poll);
        };

        const checkViewportStability = () => {
            const currentHeight = window.visualViewport?.height || 0;

            if (currentHeight === lastViewportHeight) {
                viewportStableFrames++;
                if (viewportStableFrames >= VIEWPORT_STABLE_FRAMES) {
                    // Viewport stable, now wait for save button to stop moving
                    checkSaveButtonStability();
                    return;
                }
            } else {
                // Viewport still changing, reset counter
                viewportStableFrames = 0;
                lastViewportHeight = currentHeight;
            }

            rafId = requestAnimationFrame(checkViewportStability);
        };

        rafId = requestAnimationFrame(checkViewportStability);

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [is_sl_keyboard_visible]);

    const onSave = () => {
        // Prevent from saving if user clicks before we got response from API
        if (!is_api_response_tp_received_ref.current && tp_ref.current.has_take_profit) return;
        if (!is_api_response_sl_received_ref.current && sl_ref.current.has_stop_loss) return;

        const {
            has_take_profit: has_take_profit_current,
            take_profit: take_profit_current,
            tp_error_text: tp_error_text_current,
        } = tp_ref.current;
        const {
            has_stop_loss: has_stop_loss_current,
            stop_loss: stop_loss_current,
            sl_error_text: sl_error_text_current,
        } = sl_ref.current;

        const is_tp_empty = !take_profit_current && has_take_profit_current;
        const is_sl_empty = !stop_loss_current && has_stop_loss_current;
        if (is_tp_empty) setTPErrorText(<Localize i18n_default_text='Please enter a take profit amount.' />);
        if (is_sl_empty) setSLErrorText(<Localize i18n_default_text='Please enter a stop loss amount.' />);
        if ((tp_error_text_current && has_take_profit_current) || (sl_error_text_current && has_stop_loss_current))
            return;
        if (is_sl_empty || is_tp_empty) return;

        // Show notification, that DC will be disabled if TP or SL is enabled
        const is_tp_enabled = tp_error_text_current ? false : has_take_profit_current;
        const is_sl_enabled = sl_error_text_current ? false : has_stop_loss_current;
        if ((is_tp_enabled || is_sl_enabled) && has_cancellation) {
            addSnackbar({
                message: getSnackBarText({
                    has_cancellation,
                    has_stop_loss: is_sl_enabled,
                    has_take_profit: is_tp_enabled,
                    switching_tp_sl: true,
                }),
                hasCloseButton: true,
            });
        }

        onChangeMultiple({
            has_take_profit: has_take_profit_current,
            take_profit: tp_error_text_current || take_profit_current === '0' ? '' : take_profit_current,
            has_stop_loss: has_stop_loss_current,
            stop_loss: sl_error_text_current || stop_loss_current === '0' ? '' : stop_loss_current,
            ...(is_tp_enabled || is_sl_enabled ? { has_cancellation: false } : {}),
        });

        closeActionSheet();
    };

    return (
        <div ref={wrapper_ref} className='risk-management__tp-sl__wrapper'>
            <TakeProfitAndStopLossInput
                classname='risk-management__tp-sl'
                has_save_button={false}
                has_actionsheet_wrapper={false}
                initial_error_text={tp_error_text}
                onActionSheetClose={closeActionSheet}
                parent_ref={tp_ref}
                parent_is_api_response_received_ref={is_api_response_tp_received_ref}
            />
            <TakeProfitAndStopLossInput
                classname='risk-management__tp-sl'
                has_save_button={false}
                has_actionsheet_wrapper={false}
                initial_error_text={sl_error_text}
                onActionSheetClose={closeActionSheet}
                parent_ref={sl_ref}
                parent_is_api_response_received_ref={is_api_response_sl_received_ref}
                type='stop_loss'
            />
            <Button
                color='black-white'
                size='lg'
                label={<Localize i18n_default_text='Save' />}
                fullWidth
                className='risk-management__save-button'
                onClick={onSave}
            />
        </div>
    );
});

export default TakeProfitAndStopLossContainer;
