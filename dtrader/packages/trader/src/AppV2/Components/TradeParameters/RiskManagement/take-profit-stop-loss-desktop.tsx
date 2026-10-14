import React from 'react';
import { observer } from 'mobx-react-lite';

import { formatMoney, getCurrencyDisplayCode, getDecimalPlaces, mapErrorMessage } from '@deriv/shared';
import { Button, Text, TextField, ToggleSwitch, useSnackbar } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import useIsVirtualKeyboardOpen from 'AppV2/Hooks/useIsVirtualKeyboardOpen';
import { useProposal } from 'AppV2/Hooks/useProposal';
import { getSnackBarText } from 'AppV2/Utils/trade-params-utils';
import { ExpandedProposal } from 'Stores/Modules/Trading/Helpers/proposal';
import { useTraderStore } from 'Stores/useTraderStores';

type TTakeProfitStopLossDesktopProps = {
    onClose: () => void;
    is_open?: boolean;
};

type TFieldState = {
    is_enabled: boolean;
    input_value: string;
    error_text: string;
    fe_error_text: string;
    max_length: number;
    min_value: string | number;
    max_value: string | number;
};

const calculateMaxLength = (value: number | string, decimals: number): number => {
    const is_decimal = String(value).includes('.') || String(value).includes(',');
    return is_decimal ? 11 + decimals : 10;
};

const TakeProfitStopLossDesktop = observer(({ onClose, is_open }: TTakeProfitStopLossDesktopProps) => {
    const { localize } = useTranslations();
    const { addSnackbar } = useSnackbar();
    const trade_store = useTraderStore();
    const {
        currency,
        has_take_profit,
        has_stop_loss,
        has_cancellation,
        take_profit,
        stop_loss,
        onChangeMultiple,
        validation_params,
        trade_types,
    } = trade_store;

    const decimals = getDecimalPlaces(currency);

    // Extract primitive min/max values during render so MobX tracks deep property access
    // and React's useEffect can detect changes via primitive comparison
    const contract_type_keys = Object.keys(validation_params);
    const tp_params = contract_type_keys.length > 0 ? validation_params[contract_type_keys[0]]?.take_profit : undefined;
    const sl_params = contract_type_keys.length > 0 ? validation_params[contract_type_keys[0]]?.stop_loss : undefined;

    const [tp_state, setTpState] = React.useState<TFieldState>({
        is_enabled: has_take_profit,
        input_value: take_profit || '',
        error_text: '',
        fe_error_text: '',
        max_length: calculateMaxLength(take_profit || '', decimals),
        min_value: tp_params?.min || '',
        max_value: tp_params?.max || '',
    });

    const [sl_state, setSlState] = React.useState<TFieldState>({
        is_enabled: has_stop_loss,
        input_value: stop_loss || '',
        error_text: '',
        fe_error_text: '',
        max_length: calculateMaxLength(stop_loss || '', decimals),
        min_value: sl_params?.min || '',
        max_value: sl_params?.max || '',
    });

    const tp_input_ref = React.useRef<HTMLInputElement>(null);
    const sl_input_ref = React.useRef<HTMLInputElement>(null);

    // Update min/max when validation params change - uses primitive deps for reliable React effect triggering
    React.useEffect(() => {
        if (tp_params) {
            setTpState(prev => ({
                ...prev,
                min_value: tp_params.min || '',
                max_value: tp_params.max || '',
            }));
        }
        if (sl_params) {
            setSlState(prev => ({
                ...prev,
                min_value: sl_params.min || '',
                max_value: sl_params.max || '',
            }));
        }
    }, [tp_params?.min, tp_params?.max, sl_params?.min, sl_params?.max]);

    // Scroll handling for virtual keyboard
    const tp_input_id = 'tp_input_desktop';
    const sl_input_id = 'sl_input_desktop';
    const { is_key_board_visible: tp_should_scroll } = useIsVirtualKeyboardOpen(tp_input_id);
    const { is_key_board_visible: sl_should_scroll } = useIsVirtualKeyboardOpen(sl_input_id);

    React.useEffect(() => {
        if (tp_should_scroll || sl_should_scroll) {
            // Wait for next frame to ensure layout is complete
            requestAnimationFrame(() => {
                window?.scrollTo({ top: 225, behavior: 'smooth' });
            });
        }
    }, [tp_should_scroll, sl_should_scroll]);

    // Proposal for TP validation
    const tp_proposal_values = {
        has_take_profit: tp_state.is_enabled,
        take_profit: tp_state.is_enabled ? tp_state.input_value : '',
        has_cancellation: false,
    };

    const {
        data: tp_response,
        error: tp_proposal_error,
        isFetching: tp_is_loading,
    } = useProposal({
        trade_store,
        proposal_request_values: tp_proposal_values,
        contract_type: Object.keys(trade_types)[0],
        is_enabled: is_open && tp_state.is_enabled,
        should_skip_validation: 'stop_loss',
    });

    // Proposal for SL validation
    const sl_proposal_values = {
        has_stop_loss: sl_state.is_enabled,
        stop_loss: sl_state.is_enabled ? sl_state.input_value : '',
        has_cancellation: false,
    };

    const {
        data: sl_response,
        error: sl_proposal_error,
        isFetching: sl_is_loading,
    } = useProposal({
        trade_store,
        proposal_request_values: sl_proposal_values,
        contract_type: Object.keys(trade_types)[0],
        is_enabled: is_open && sl_state.is_enabled,
        should_skip_validation: 'take_profit',
    });

    // Update TP error
    React.useEffect(() => {
        if (!tp_state.is_enabled || tp_state.input_value === '') {
            setTpState(prev => ({ ...prev, error_text: '' }));
            return;
        }

        const new_error = tp_proposal_error ? mapErrorMessage(tp_proposal_error) : '';
        const is_error_field_match =
            ['take_profit'].includes(tp_proposal_error?.details?.field ?? '') || !tp_proposal_error?.details?.field;

        setTpState(prev => ({ ...prev, error_text: is_error_field_match ? new_error : '' }));
    }, [tp_proposal_error, tp_state.is_enabled, tp_state.input_value]);

    // Update SL error
    React.useEffect(() => {
        if (!sl_state.is_enabled || sl_state.input_value === '') {
            setSlState(prev => ({ ...prev, error_text: '' }));
            return;
        }

        const new_error = sl_proposal_error ? mapErrorMessage(sl_proposal_error) : '';
        const is_error_field_match =
            ['stop_loss'].includes(sl_proposal_error?.details?.field ?? '') || !sl_proposal_error?.details?.field;

        setSlState(prev => ({ ...prev, error_text: is_error_field_match ? new_error : '' }));
    }, [sl_proposal_error, sl_state.is_enabled, sl_state.input_value]);

    // Recovery for min/max validation params from proposal response
    // when the store's params are missing (e.g. after DC was enabled and cleared TP/SL state)
    React.useEffect(() => {
        const proposal = tp_response?.proposal as ExpandedProposal | undefined;
        const tp_validation = proposal?.validation_params?.take_profit;
        if (tp_validation && (!tp_state.min_value || !tp_state.max_value)) {
            setTpState(prev => ({
                ...prev,
                min_value: tp_validation.min || prev.min_value,
                max_value: tp_validation.max || prev.max_value,
            }));
        }
    }, [tp_response]);

    React.useEffect(() => {
        const proposal = sl_response?.proposal as ExpandedProposal | undefined;
        const sl_validation = proposal?.validation_params?.stop_loss;
        if (sl_validation && (!sl_state.min_value || !sl_state.max_value)) {
            setSlState(prev => ({
                ...prev,
                min_value: sl_validation.min || prev.min_value,
                max_value: sl_validation.max || prev.max_value,
            }));
        }
    }, [sl_response]);

    const onTpToggle = (is_enabled: boolean) => {
        setTpState(prev => ({ ...prev, is_enabled }));
        if (is_enabled && tp_input_ref.current) {
            setTimeout(() => tp_input_ref.current?.focus(), 100);
        }
    };

    const onSlToggle = (is_enabled: boolean) => {
        setSlState(prev => ({ ...prev, is_enabled }));
        if (is_enabled && sl_input_ref.current) {
            setTimeout(() => sl_input_ref.current?.focus(), 100);
        }
    };

    const onTpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_value = String(e.target.value);
        setTpState(prev => ({
            ...prev,
            max_length: calculateMaxLength(new_value, decimals),
        }));

        if (new_value.endsWith('.') || new_value.endsWith(',')) {
            setTpState(prev => ({
                ...prev,
                fe_error_text: localize('Should be a valid number.'),
            }));
            return;
        }

        setTpState(prev => ({
            ...prev,
            input_value: new_value,
            error_text: '',
            fe_error_text: '',
        }));
    };

    const onSlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_value = String(e.target.value);
        setSlState(prev => ({
            ...prev,
            max_length: calculateMaxLength(new_value, decimals),
        }));

        if (new_value.endsWith('.') || new_value.endsWith(',')) {
            setSlState(prev => ({
                ...prev,
                fe_error_text: localize('Should be a valid number.'),
            }));
            return;
        }

        setSlState(prev => ({
            ...prev,
            input_value: new_value,
            error_text: '',
            fe_error_text: '',
        }));
    };

    const onBeforeInputChange = (field: 'tp' | 'sl') => (e: React.FormEvent<HTMLInputElement>) => {
        if (
            ['.', ','].includes((e.nativeEvent as InputEvent)?.data ?? '') &&
            (String(field === 'tp' ? tp_state.input_value : sl_state.input_value)?.length ?? 0) <= 10
        ) {
            const setState = field === 'tp' ? setTpState : setSlState;
            setState(prev => ({
                ...prev,
                max_length: decimals ? 11 + decimals : 10,
            }));
        }
    };

    const onSave = () => {
        // Validate required fields first
        if (tp_state.is_enabled && tp_state.input_value === '') {
            setTpState(prev => ({
                ...prev,
                fe_error_text: localize('Please enter a take profit amount.'),
            }));
            return;
        }

        if (sl_state.is_enabled && sl_state.input_value === '') {
            setSlState(prev => ({
                ...prev,
                fe_error_text: localize('Please enter a stop loss amount.'),
            }));
            return;
        }

        // Then check for other errors
        const is_loading = tp_is_loading || sl_is_loading;
        const has_tp_error = tp_state.error_text && tp_state.is_enabled;
        const has_sl_error = sl_state.error_text && sl_state.is_enabled;
        const has_fe_error = tp_state.fe_error_text || sl_state.fe_error_text;

        if (is_loading || has_tp_error || has_sl_error || has_fe_error) return;

        // Show notification if DC will be disabled
        if ((tp_state.is_enabled || sl_state.is_enabled) && has_cancellation) {
            addSnackbar({
                message: getSnackBarText({
                    has_cancellation,
                    has_stop_loss: sl_state.is_enabled,
                    has_take_profit: tp_state.is_enabled,
                    switching_tp_sl: true,
                }),
                hasCloseButton: true,
            });
        }

        onChangeMultiple({
            has_take_profit: tp_state.is_enabled,
            take_profit: tp_state.error_text || tp_state.input_value === '0' ? '' : tp_state.input_value,
            has_stop_loss: sl_state.is_enabled,
            stop_loss: sl_state.error_text || sl_state.input_value === '0' ? '' : sl_state.input_value,
            ...(tp_state.is_enabled || sl_state.is_enabled ? { has_cancellation: false } : {}),
        });

        onClose();
    };

    const getInputMessage = React.useCallback(
        (state: TFieldState) => {
            if (state.min_value && state.max_value) {
                return (
                    <Localize
                        i18n_default_text='Acceptable range: {{min_value}} to {{max_value}} {{currency}}'
                        values={{
                            currency: getCurrencyDisplayCode(currency),
                            min_value: formatMoney(currency, +state.min_value, true),
                            max_value: formatMoney(currency, +state.max_value, true),
                        }}
                    />
                );
            }
            return '';
        },
        [currency]
    );

    return (
        <div className='risk-management-desktop__tp-sl-wrapper'>
            {/* Take Profit */}
            <div className='risk-management-desktop__field'>
                <div className='risk-management-desktop__field-header'>
                    <Text size='md' bold>
                        <Localize i18n_default_text='Take profit' />
                    </Text>
                    <ToggleSwitch
                        checked={tp_state.is_enabled}
                        onChange={onTpToggle}
                        data-testid='dt_tp_toggle_desktop'
                    />
                </div>
                <div className='risk-management-desktop__field-content'>
                    <TextField
                        id={tp_input_id}
                        ref={tp_input_ref}
                        label={localize('Amount')}
                        name='take_profit'
                        value={tp_state.input_value}
                        onChange={onTpInputChange}
                        onBeforeInput={onBeforeInputChange('tp')}
                        placeholder={localize('Amount')}
                        variant='fill'
                        inputMode='decimal'
                        customType='commaRemoval'
                        allowDecimals
                        decimals={decimals}
                        regex={/[^0-9.,]/g}
                        maxLength={tp_state.max_length}
                        message={tp_state.fe_error_text || tp_state.error_text || getInputMessage(tp_state)}
                        status={tp_state.fe_error_text || tp_state.error_text ? 'error' : 'neutral'}
                        noStatusIcon
                        disabled={!tp_state.is_enabled}
                        data-testid='dt_tp_input_desktop'
                    />
                    {!tp_state.is_enabled && (
                        <div
                            className='risk-management-desktop__field-overlay'
                            onClick={() => onTpToggle(true)}
                            data-testid='dt_tp_overlay_desktop'
                        />
                    )}
                </div>
            </div>

            {/* Stop Loss */}
            <div className='risk-management-desktop__field'>
                <div className='risk-management-desktop__field-header'>
                    <Text size='md' bold>
                        <Localize i18n_default_text='Stop loss' />
                    </Text>
                    <ToggleSwitch
                        checked={sl_state.is_enabled}
                        onChange={onSlToggle}
                        data-testid='dt_sl_toggle_desktop'
                    />
                </div>
                <div className='risk-management-desktop__field-content'>
                    <TextField
                        id={sl_input_id}
                        ref={sl_input_ref}
                        label={localize('Amount')}
                        name='stop_loss'
                        value={sl_state.input_value}
                        onChange={onSlInputChange}
                        onBeforeInput={onBeforeInputChange('sl')}
                        placeholder={localize('Amount')}
                        variant='fill'
                        inputMode='decimal'
                        customType='commaRemoval'
                        allowDecimals
                        decimals={decimals}
                        regex={/[^0-9.,]/g}
                        maxLength={sl_state.max_length}
                        message={sl_state.fe_error_text || sl_state.error_text || getInputMessage(sl_state)}
                        status={sl_state.fe_error_text || sl_state.error_text ? 'error' : 'neutral'}
                        noStatusIcon
                        disabled={!sl_state.is_enabled}
                        data-testid='dt_sl_input_desktop'
                    />
                    {!sl_state.is_enabled && (
                        <div
                            className='risk-management-desktop__field-overlay'
                            onClick={() => onSlToggle(true)}
                            data-testid='dt_sl_overlay_desktop'
                        />
                    )}
                </div>
            </div>

            {/* Save Button */}
            <Button
                fullWidth
                size='lg'
                variant='primary'
                color='black-white'
                onClick={onSave}
                disabled={
                    tp_is_loading ||
                    sl_is_loading ||
                    !!(tp_state.fe_error_text || (tp_state.error_text && tp_state.is_enabled)) ||
                    !!(sl_state.fe_error_text || (sl_state.error_text && sl_state.is_enabled))
                }
                className='risk-management-desktop__save-button'
            >
                <Localize i18n_default_text='Save' />
            </Button>
        </div>
    );
});

export default TakeProfitStopLossDesktop;
