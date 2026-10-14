import React from 'react';
import { observer } from 'mobx-react-lite';

import { formatMoney, getCurrencyDisplayCode, getDecimalPlaces, mapErrorMessage } from '@deriv/shared';
import { Button, Text, TextField, ToggleSwitch } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import useIsVirtualKeyboardOpen from 'AppV2/Hooks/useIsVirtualKeyboardOpen';
import { useProposal } from 'AppV2/Hooks/useProposal';
import { useTraderStore } from 'Stores/useTraderStores';

type TTakeProfitInputDesktop = {
    onClose: () => void;
    is_open?: boolean;
};

type TTakeProfitState = {
    is_enabled: boolean;
    input_value: string;
    error_text: string;
    fe_error_text: string;
    max_length: number;
    min_value: string | number;
    max_value: string | number;
};

type TTakeProfitAction =
    | { type: 'SET_ENABLED'; payload: boolean }
    | { type: 'SET_INPUT_VALUE'; payload: string }
    | { type: 'SET_ERROR_TEXT'; payload: string }
    | { type: 'SET_FE_ERROR_TEXT'; payload: string }
    | { type: 'SET_MAX_LENGTH'; payload: number }
    | { type: 'SET_MIN_MAX'; payload: { min: string | number; max: string | number } }
    | { type: 'RESET_ERRORS' };

const reducer = (state: TTakeProfitState, action: TTakeProfitAction): TTakeProfitState => {
    switch (action.type) {
        case 'SET_ENABLED':
            return { ...state, is_enabled: action.payload };
        case 'SET_INPUT_VALUE':
            return { ...state, input_value: action.payload };
        case 'SET_ERROR_TEXT':
            return { ...state, error_text: action.payload };
        case 'SET_FE_ERROR_TEXT':
            return { ...state, fe_error_text: action.payload };
        case 'SET_MAX_LENGTH':
            return { ...state, max_length: action.payload };
        case 'SET_MIN_MAX':
            return { ...state, min_value: action.payload.min, max_value: action.payload.max };
        case 'RESET_ERRORS':
            return { ...state, error_text: '', fe_error_text: '' };
        default:
            return state;
    }
};

const calculateMaxLength = (value: number | string, decimals: number): number => {
    const is_decimal = String(value).includes('.') || String(value).includes(',');
    return is_decimal ? 11 + decimals : 10;
};

const TakeProfitInputDesktop = observer(({ onClose, is_open }: TTakeProfitInputDesktop) => {
    const { localize } = useTranslations();
    const trade_store = useTraderStore();
    const { currency, has_take_profit, take_profit, onChangeMultiple, validation_params, trade_types } = trade_store;

    const decimals = getDecimalPlaces(currency);

    // Extract primitive min/max values during render so MobX tracks deep property access
    // and React's useEffect can detect changes via primitive comparison
    const contract_type_keys = Object.keys(validation_params);
    const tp_params = contract_type_keys.length > 0 ? validation_params[contract_type_keys[0]]?.take_profit : undefined;

    const initial_state: TTakeProfitState = {
        is_enabled: has_take_profit,
        input_value: take_profit || '',
        error_text: '',
        fe_error_text: '',
        max_length: calculateMaxLength(take_profit || '', decimals),
        min_value: tp_params?.min || '',
        max_value: tp_params?.max || '',
    };

    const [state, dispatch] = React.useReducer(reducer, initial_state);
    const input_ref = React.useRef<HTMLInputElement>(null);

    // Update min/max when validation params change - uses primitive deps for reliable React effect triggering
    React.useEffect(() => {
        if (tp_params) {
            dispatch({
                type: 'SET_MIN_MAX',
                payload: { min: tp_params.min || '', max: tp_params.max || '' },
            });
        }
    }, [tp_params?.min, tp_params?.max]);

    // Scroll the page when a virtual keyboard pops up
    const input_id = 'take_profit_input';
    const { is_key_board_visible: should_scroll } = useIsVirtualKeyboardOpen(input_id);

    React.useEffect(() => {
        if (should_scroll) window?.scrollTo({ top: 225, behavior: 'smooth' });
    }, [should_scroll]);

    // Proposal for validation
    const proposal_request_values = {
        has_take_profit: state.is_enabled,
        take_profit: state.is_enabled ? state.input_value : '',
    };

    const {
        data: response,
        error: proposal_error,
        isFetching: is_loading,
    } = useProposal({
        trade_store,
        proposal_request_values,
        contract_type: Object.keys(trade_types)[0],
        is_enabled: is_open && state.is_enabled && state.input_value !== '',
        should_skip_validation: 'stop_loss',
    });

    React.useEffect(() => {
        if (!state.is_enabled || state.input_value === '') {
            dispatch({ type: 'SET_ERROR_TEXT', payload: '' });
            return;
        }

        const new_error = proposal_error ? mapErrorMessage(proposal_error) : '';
        const is_error_field_match =
            ['take_profit'].includes(proposal_error?.details?.field ?? '') || !proposal_error?.details?.field;

        dispatch({ type: 'SET_ERROR_TEXT', payload: is_error_field_match ? new_error : '' });
    }, [response, proposal_error, state.is_enabled, state.input_value]);

    const onToggleSwitch = (is_enabled: boolean) => {
        dispatch({ type: 'SET_ENABLED', payload: is_enabled });
        if (is_enabled && input_ref.current) {
            setTimeout(() => input_ref.current?.focus(), 100);
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_value = String(e.target.value);
        dispatch({
            type: 'SET_MAX_LENGTH',
            payload: calculateMaxLength(new_value, decimals),
        });

        if (new_value.endsWith('.') || new_value.endsWith(',')) {
            dispatch({
                type: 'SET_FE_ERROR_TEXT',
                payload: localize('Should be a valid number.'),
            });
            return;
        }

        dispatch({ type: 'RESET_ERRORS' });
        dispatch({ type: 'SET_INPUT_VALUE', payload: new_value });
    };

    const onBeforeInputChange = (e: React.FormEvent<HTMLInputElement>) => {
        if (
            ['.', ','].includes((e.nativeEvent as InputEvent)?.data ?? '') &&
            (String(state.input_value)?.length ?? 0) <= 10
        ) {
            dispatch({
                type: 'SET_MAX_LENGTH',
                payload: decimals ? 11 + decimals : 10,
            });
        }
    };

    const onSave = () => {
        if (is_loading || (state.error_text && state.is_enabled) || state.fe_error_text) return;

        if (state.is_enabled && state.input_value === '') {
            dispatch({
                type: 'SET_FE_ERROR_TEXT',
                payload: localize('Please enter a take profit amount.'),
            });
            return;
        }

        onChangeMultiple({
            has_take_profit: state.is_enabled,
            take_profit: state.error_text || state.input_value === '0' ? '' : state.input_value,
        });

        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const isSaveDisabled = is_loading || !!(state.fe_error_text || (state.error_text && state.is_enabled));
            if (!isSaveDisabled) {
                onSave();
            }
        }
    };

    const getInputMessage = () => {
        // Always show range if available, regardless of error state
        if (state.min_value && state.max_value) {
            return (
                <Localize
                    i18n_default_text='Range: {{min_value}} to {{max_value}} {{currency}}'
                    values={{
                        currency: getCurrencyDisplayCode(currency),
                        min_value: formatMoney(currency, +state.min_value, true),
                        max_value: formatMoney(currency, +state.max_value, true),
                    }}
                />
            );
        }
        return '';
    };

    return (
        <div className='take-profit-input-desktop__wrapper'>
            <div className='take-profit-input-desktop__header'>
                <Text size='md' bold>
                    <Localize i18n_default_text='Take profit' />
                </Text>
                <ToggleSwitch
                    checked={state.is_enabled}
                    onChange={onToggleSwitch}
                    data-testid='dt_take_profit_toggle'
                />
            </div>
            <div className='take-profit-input-desktop__content'>
                <TextField
                    id={input_id}
                    ref={input_ref}
                    label={`${localize('Amount')} (${getCurrencyDisplayCode(currency)})`}
                    name='take_profit'
                    value={state.input_value}
                    onChange={onInputChange}
                    onBeforeInput={onBeforeInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={localize('Amount')}
                    variant='fill'
                    inputMode='decimal'
                    customType='commaRemoval'
                    allowDecimals
                    decimals={decimals}
                    regex={/[^0-9.,]/g}
                    maxLength={state.max_length}
                    message={state.fe_error_text || state.error_text || getInputMessage()}
                    status={state.fe_error_text || state.error_text ? 'error' : 'neutral'}
                    noStatusIcon
                    disabled={!state.is_enabled}
                    data-testid='dt_take_profit_input'
                />
                {!state.is_enabled && (
                    <div
                        className='take-profit-input-desktop__overlay'
                        onClick={() => onToggleSwitch(true)}
                        data-testid='dt_take_profit_overlay'
                    />
                )}
            </div>
            <Button
                fullWidth
                size='lg'
                variant='primary'
                color='black-white'
                onClick={onSave}
                disabled={is_loading || !!(state.fe_error_text || (state.error_text && state.is_enabled))}
                className='take-profit-input-desktop__save-button'
            >
                <Localize i18n_default_text='Save' />
            </Button>
        </div>
    );
});

export default TakeProfitInputDesktop;
