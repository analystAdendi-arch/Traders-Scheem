import React, { useCallback, useReducer } from 'react';
import { observer } from 'mobx-react-lite';

import { Button, TextField } from '@deriv-com/quill-ui';
import { Localize, localize } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

interface DurationHoursInputDesktopProps {
    onClose: () => void;
}

type ValidationState = {
    hoursValue: string;
    minutesValue: string;
    hoursError: string;
    minutesError: string;
    isValid: boolean;
    isMinutesDisabled: boolean;
};

type ValidationAction =
    | { type: 'SET_HOURS'; payload: string }
    | { type: 'SET_MINUTES'; payload: string }
    | { type: 'VALIDATE' };

const MIN_HOURS = 1;
const MAX_HOURS = 24;
const MIN_MINUTES = 0;
const MAX_MINUTES = 59;
const MIN_TOTAL_MINUTES = 60; // Minimum 1 hour

const getHoursRangeError = () => localize('Range: {{min}} - {{max}} hours', { min: MIN_HOURS, max: MAX_HOURS });
const getMinutesRangeError = () => localize('Range: {{min}} - {{max}} minutes', { min: MIN_MINUTES, max: MAX_MINUTES });
const getHoursRequiredError = () => localize('Hours is required');
const getMinDurationError = () => localize('Minimum duration is 1 hour');

const validationReducer = (state: ValidationState, action: ValidationAction): ValidationState => {
    switch (action.type) {
        case 'SET_HOURS': {
            const hoursValue = action.payload;
            const hours = parseInt(hoursValue) || 0;
            const isMaxHours = hours === MAX_HOURS;

            // Immediate validation for hours
            let hoursError = '';
            if (hoursValue !== '' && (hours < MIN_HOURS || hours > MAX_HOURS)) {
                hoursError = getHoursRangeError();
            }

            return {
                ...state,
                hoursValue,
                hoursError,
                isValid: false,
                isMinutesDisabled: isMaxHours,
                minutesValue: isMaxHours ? '0' : state.minutesValue,
            };
        }
        case 'SET_MINUTES': {
            const minutesValue = action.payload;
            const minutes = parseInt(minutesValue) || 0;

            // Immediate validation for minutes
            let minutesError = '';
            if (minutesValue !== '' && minutes > MAX_MINUTES) {
                minutesError = getMinutesRangeError();
            }

            return {
                ...state,
                minutesValue,
                minutesError,
                isValid: false,
            };
        }
        case 'VALIDATE': {
            const hours = parseInt(state.hoursValue) || 0;
            const minutes = parseInt(state.minutesValue) || 0;
            const totalMinutes = hours * 60 + minutes;

            let hoursError = '';
            let minutesError = '';
            let isValid = true;

            // Validate hours
            if (state.hoursValue === '') {
                hoursError = getHoursRequiredError();
                isValid = false;
            } else if (hours < MIN_HOURS || hours > MAX_HOURS) {
                hoursError = getHoursRangeError();
                isValid = false;
            }

            // Validate minutes
            if (state.minutesValue !== '' && (minutes < MIN_MINUTES || minutes > MAX_MINUTES)) {
                minutesError = getMinutesRangeError();
                isValid = false;
            }

            // Validate total duration (minimum 1 hour)
            if (totalMinutes < MIN_TOTAL_MINUTES) {
                hoursError = getMinDurationError();
                isValid = false;
            }

            return {
                ...state,
                hoursError,
                minutesError,
                isValid,
            };
        }
        default:
            return state;
    }
};
// [/AI]

const DurationHoursInputDesktop: React.FC<DurationHoursInputDesktopProps> = observer(({ onClose }) => {
    const { duration, duration_unit, onChangeMultiple } = useTraderStore();

    // Initialize with current duration if it's in minutes (hours unit)
    const initialHours = duration_unit === 'm' ? Math.floor(duration / 60) : 1;
    const initialMinutes = duration_unit === 'm' ? duration % 60 : 0;

    const [state, dispatch] = useReducer(validationReducer, {
        hoursValue: initialHours.toString(),
        minutesValue: initialMinutes.toString(),
        hoursError: '',
        minutesError: '',
        isValid: false,
        isMinutesDisabled: initialHours === MAX_HOURS,
    });

    const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers
        if (value === '' || /^\d+$/.test(value)) {
            dispatch({ type: 'SET_HOURS', payload: value });
        }
    }, []);

    const handleMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers
        if (value === '' || /^\d+$/.test(value)) {
            dispatch({ type: 'SET_MINUTES', payload: value });
        }
    }, []);

    const handleSave = useCallback(() => {
        dispatch({ type: 'VALIDATE' });

        // Re-validate to get the latest state
        const hours = parseInt(state.hoursValue) || 0;
        const minutes = parseInt(state.minutesValue) || 0;
        const totalMinutes = hours * 60 + minutes;

        // Check if valid
        if (
            state.hoursValue !== '' &&
            hours >= MIN_HOURS &&
            hours <= MAX_HOURS &&
            (state.minutesValue === '' || (minutes >= MIN_MINUTES && minutes <= MAX_MINUTES)) &&
            totalMinutes >= MIN_TOTAL_MINUTES
        ) {
            // Convert to total minutes and save
            onChangeMultiple({
                duration_unit: 'm', // Store as minutes
                duration: totalMinutes,
                expiry_type: 'duration',
            });
            onClose();
        }
    }, [state.hoursValue, state.minutesValue, onChangeMultiple, onClose]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const isSaveDisabled = state.hoursValue === '' && state.minutesValue === '';
            if (!isSaveDisabled) {
                handleSave();
            }
            return;
        }
        if (e.key.length === 1 && !/\d/.test(e.key)) {
            e.preventDefault();
        }
    };

    const getRangeMessage = useCallback(() => {
        if (state.hoursError) {
            return state.hoursError;
        }
        if (state.minutesError) {
            return state.minutesError;
        }
        return localize('Range: {{min}} - {{max}} hours', { min: MIN_HOURS, max: MAX_HOURS });
    }, [state.hoursError, state.minutesError]);

    return (
        <div className='duration-input-desktop__wrapper'>
            <div className='duration-input-desktop__fields duration-input-desktop__fields--hours-minutes'>
                <div className='duration-input-desktop__field-group'>
                    <TextField
                        variant='fill'
                        label={localize('Hours')}
                        value={state.hoursValue}
                        onChange={handleHoursChange}
                        onKeyDown={handleKeyDown}
                        maxLength={2}
                        status={state.hoursError ? 'error' : 'neutral'}
                        message={state.hoursError}
                    />
                </div>
                <div className='duration-input-desktop__field-group'>
                    <TextField
                        variant='fill'
                        label={localize('Minutes')}
                        value={state.minutesValue}
                        onChange={handleMinutesChange}
                        onKeyDown={handleKeyDown}
                        maxLength={2}
                        status={state.minutesError ? 'error' : 'neutral'}
                        message={state.minutesError}
                        disabled={state.isMinutesDisabled}
                    />
                </div>
            </div>
            {!state.hoursError && !state.minutesError && (
                <div className='duration-input-desktop__range'>
                    <span className='duration-input-desktop__range-text'>{getRangeMessage()}</span>
                </div>
            )}
            <div className='duration-input-desktop__footer'>
                <Button
                    size='lg'
                    fullWidth
                    onClick={handleSave}
                    color='black-white'
                    disabled={
                        (state.hoursValue === '' && state.minutesValue === '') ||
                        !!state.hoursError ||
                        !!state.minutesError
                    }
                >
                    <Localize i18n_default_text='Save' />
                </Button>
            </div>
        </div>
    );
});

export default DurationHoursInputDesktop;
