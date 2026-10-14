import React, { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import moment from 'moment';

import { Localize } from '@deriv-com/translations';

interface TimeGridPickerProps {
    selectedTime: string;
    onTimeChange: (time: string) => void;
    startTimes?: moment.Moment[];
    endTimes?: moment.Moment[];
}

const TimeGridPicker: React.FC<TimeGridPickerProps> = ({ selectedTime, onTimeChange, startTimes, endTimes }) => {
    const [selectedHour, selectedMinute] = selectedTime.split(':');

    // Generate hours array (00-23)
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);

    // Generate minutes array with 5-minute intervals (00, 05, 10, ..., 55)
    const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')), []);

    const isTimeValid = useCallback(
        (hour: string, minute: string) => {
            if (!startTimes || !endTimes || startTimes.length === 0 || endTimes.length === 0) {
                return true;
            }

            const hourNum = parseInt(hour);
            const minuteNum = parseInt(minute);

            if (isNaN(hourNum) || isNaN(minuteNum)) {
                return false;
            }

            const timeToCheck = moment().hour(hourNum).minute(minuteNum);

            for (let i = 0; i < startTimes.length; i++) {
                if (timeToCheck.isBetween(startTimes[i], endTimes[i], 'minute', '[]')) {
                    return true;
                }
            }
            return false;
        },
        [startTimes, endTimes]
    );

    const handleHourClick = useCallback(
        (hour: string) => {
            onTimeChange(`${hour}:${selectedMinute}`);
        },
        [selectedMinute, onTimeChange]
    );

    const handleMinuteClick = useCallback(
        (minute: string) => {
            onTimeChange(`${selectedHour}:${minute}`);
        },
        [selectedHour, onTimeChange]
    );

    return (
        <div className='time-grid-picker'>
            <div className='time-grid-picker__section'>
                <div className='time-grid-picker__label'>
                    <Localize i18n_default_text='Hour' />
                </div>
                <div className='time-grid-picker__grid time-grid-picker__grid--hours' role='grid' aria-label='Hours'>
                    {hours.map(hour => {
                        const isValid = isTimeValid(hour, selectedMinute);
                        const isSelected = hour === selectedHour;
                        return (
                            <button
                                key={hour}
                                type='button'
                                className={classNames('time-grid-picker__item', {
                                    'time-grid-picker__item--selected': isSelected,
                                    'time-grid-picker__item--disabled': !isValid,
                                })}
                                onClick={() => handleHourClick(hour)}
                                disabled={!isValid}
                                aria-label={`Hour ${hour}`}
                            >
                                {hour}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className='time-grid-picker__section'>
                <div className='time-grid-picker__label'>
                    <Localize i18n_default_text='Minute' />
                </div>
                <div
                    className='time-grid-picker__grid time-grid-picker__grid--minutes'
                    role='grid'
                    aria-label='Minutes'
                >
                    {minutes.map(minute => {
                        const isValid = isTimeValid(selectedHour, minute);
                        const isSelected = minute === selectedMinute;
                        return (
                            <button
                                key={minute}
                                type='button'
                                className={classNames('time-grid-picker__item', {
                                    'time-grid-picker__item--selected': isSelected,
                                    'time-grid-picker__item--disabled': !isValid,
                                })}
                                onClick={() => handleMinuteClick(minute)}
                                disabled={!isValid}
                                aria-label={`Minute ${minute}`}
                            >
                                {minute}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TimeGridPicker;
