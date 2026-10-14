import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { getDurationMinMaxValues } from '@deriv/shared';
import { Button, TextField } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import { useTraderStore } from 'Stores/useTraderStores';

type TDurationTicksInputDesktopProps = {
    onClose: () => void;
};

const FALLBACK_MIN_TICKS = 1;
const FALLBACK_MAX_TICKS = 10;

const DurationTicksInputDesktop: React.FC<TDurationTicksInputDesktopProps> = observer(({ onClose }) => {
    const { localize } = useTranslations();
    const { duration, duration_unit, onChangeMultiple, duration_min_max } = useTraderStore();

    // Get dynamic min/max from backend, fallback to hardcoded values if unavailable
    // Always use 'tick' as the expiry type key - ticks always correspond to the 'tick' entry
    // in duration_min_max, regardless of the store's current contract_expiry_type (which may
    // be stale, e.g. 'daily' after selecting End Time).
    const [backendMin, backendMax] = getDurationMinMaxValues(duration_min_max, 'tick', 't');
    const min = backendMin ?? FALLBACK_MIN_TICKS;
    const max = backendMax ?? FALLBACK_MAX_TICKS;

    const [inputValue, setInputValue] = useState<string>(duration_unit === 't' ? String(duration) : '');
    const [error, setError] = useState<string>('');

    const validateInput = useCallback(
        (value: string): boolean => {
            if (!value) {
                setError(localize('Duration is a required field.'));
                return false;
            }

            const numValue = Number(value);
            if (isNaN(numValue)) {
                setError(localize('Should be a valid number.'));
                return false;
            }

            if (numValue < min || numValue > max) {
                setError(
                    localize('Please enter a duration between {{min}} to {{max}} ticks.', {
                        min,
                        max,
                    })
                );
                return false;
            }

            setError('');
            return true;
        },
        [localize, min, max]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (value !== '' && !/^\d+$/.test(value)) return;

            setInputValue(value);

            if (value) {
                validateInput(value);
            } else {
                setError('');
            }
        },
        [validateInput]
    );

    const handleSave = useCallback(() => {
        if (!validateInput(inputValue)) {
            return;
        }

        onChangeMultiple({
            duration_unit: 't',
            duration: Number(inputValue),
            expiry_type: 'duration',
        });
        onClose();
    }, [inputValue, validateInput, onChangeMultiple, onClose]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const isSaveDisabled = !!error || !inputValue;
            if (!isSaveDisabled) {
                handleSave();
            }
            return;
        }
        if (e.key.length === 1 && !/\d/.test(e.key)) {
            e.preventDefault();
        }
    };

    const getRangeMessage = () => {
        return (
            <Localize
                i18n_default_text='Range: {{min}} - {{max}} ticks'
                values={{
                    min,
                    max,
                }}
            />
        );
    };

    return (
        <div className='duration-input-desktop__wrapper'>
            <TextField
                label={localize('Ticks')}
                name='duration'
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                variant='fill'
                inputMode='numeric'
                maxLength={2}
                message={error || getRangeMessage()}
                status={error ? 'error' : 'neutral'}
                noStatusIcon
                data-testid='dt_duration_ticks_input_desktop'
            />
            <div className='duration-input-desktop__footer'>
                <Button
                    fullWidth
                    size='lg'
                    variant='primary'
                    color='black-white'
                    onClick={handleSave}
                    disabled={!!error || !inputValue}
                    className='duration-input-desktop__save-button'
                >
                    <Localize i18n_default_text='Save' />
                </Button>
            </div>
        </div>
    );
});

export default DurationTicksInputDesktop;
