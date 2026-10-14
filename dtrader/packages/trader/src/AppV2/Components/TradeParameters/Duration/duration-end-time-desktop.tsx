import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';

import { hasIntradayDurationUnit, setTime, toMoment, useIsMounted } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { Button, DatePicker, TextField } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import { InputPopover } from 'AppV2/Components/InputPopover';
import { getClosestTimeToCurrentGMT, getDatePickerStartDate } from 'AppV2/Utils/trade-params-utils';
import { ContractType } from 'Stores/Modules/Trading/Helpers/contract-type';
import { getBoundaries } from 'Stores/Modules/Trading/Helpers/end-time';
import { useTraderStore } from 'Stores/useTraderStores';

import TimeGridPicker from './time-grid-picker';

import './time-grid-picker.scss';
import './duration-end-time-desktop.scss';

interface DurationEndTimeDesktopProps {
    onClose: () => void;
}

const DurationEndTimeDesktop: React.FC<DurationEndTimeDesktopProps> = observer(({ onClose }) => {
    const { localize } = useTranslations();
    const { common } = useStore();
    const { server_time } = common;
    const {
        expiry_type,
        expiry_time,
        expiry_date,
        duration_unit,
        duration,
        duration_units_list,
        duration_min_max,
        market_open_times,
        market_close_times,
        start_date,
        start_time,
        symbol,
        onChangeMultiple,
    } = useTraderStore();
    const isMounted = useIsMounted();

    // Calculate adjusted_start_time based on TODAY's market boundaries (like mobile)
    const adjusted_start_time = useMemo(() => {
        const today_moment = toMoment(server_time);
        const market_open_datetimes = market_open_times.map((open_time: string) =>
            setTime(today_moment.clone(), open_time)
        );
        const market_close_datetimes = market_close_times.map((close_time: string) =>
            setTime(today_moment.clone(), close_time)
        );
        const boundaries = getBoundaries(today_moment.clone(), market_open_datetimes, market_close_datetimes);
        return boundaries.start[0]?.clone().add(5, 'minutes').format('HH:mm') || getClosestTimeToCurrentGMT(5);
    }, [server_time, market_open_times, market_close_times]);

    // Helper to check if a date is today
    const isToday = useCallback((date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    }, []);

    // Helper to get initial date
    const getInitialDate = useCallback(() => {
        // Priority 1: If user has explicitly saved an endtime, use the stored expiry_date
        if (expiry_type === 'endtime' && expiry_date) {
            const expiryMoment = moment(expiry_date);
            if (expiryMoment.isSameOrAfter(moment(), 'day')) {
                return expiryMoment.toDate();
            }
        }
        // Priority 2: If expiry_date exists and is today or a future date, use it
        if (expiry_date) {
            const expiryMoment = moment(expiry_date);
            if (expiryMoment.isSameOrAfter(moment(), 'day')) {
                return expiryMoment.toDate();
            }
        }
        // Default to the minimum allowed date for this contract (matches mobile behavior)
        return getDatePickerStartDate(duration_units_list, server_time, start_time, duration_min_max);
    }, [expiry_date, expiry_type, duration_units_list, server_time, start_time, duration_min_max]);

    // Helper to get initial time based on date
    const getInitialTime = useCallback(
        (date: Date) => {
            const is_today = isToday(date);
            if (is_today) {
                // For today, use expiry_time if available, otherwise use adjusted_start_time
                if (expiry_time) {
                    return expiry_time.substring(0, 5);
                }
                return adjusted_start_time;
            }
            // For future dates, use stored expiry_time if available (e.g. market close time)
            return expiry_time ? expiry_time.substring(0, 5) : '23:59';
        },
        [expiry_time, adjusted_start_time, isToday]
    );

    // Local state - not saved to store until Save is clicked
    const [selectedDate, setSelectedDate] = useState<Date>(() => getInitialDate());
    const [selectedTime, setSelectedTime] = useState<string>(() => getInitialTime(getInitialDate()));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [disabled_days, setDisabledDays] = useState<number[]>([]);

    const dateFieldRef = useRef<HTMLDivElement>(null);
    const timeFieldRef = useRef<HTMLDivElement>(null);

    // Calculate if time picker should be enabled (like mobile's is_24_hours_contract)
    const is_24_hours_contract = useMemo(() => {
        const has_intraday_duration_unit = hasIntradayDurationUnit(duration_units_list);
        const is_selected_date_today = isToday(selectedDate);

        // Time picker is enabled only when:
        // 1. Selected date is today (or start_date is set)
        // 2. AND contract has intraday duration units (t, s, m, h)
        return (!!start_date || is_selected_date_today) && has_intraday_duration_unit;
    }, [duration_units_list, selectedDate, start_date, isToday]);

    // Disable date selection for contracts that don't support daily duration (e.g. Daily Resets)
    // Mirrors mobile logic in day.tsx line 221
    const is_date_disabled = useMemo(() => {
        return duration_units_list.filter(item => item.value === 'd').length === 0;
    }, [duration_units_list]);

    // Calculate the display time (what to show in the field)
    const displayTime = useMemo(() => {
        return selectedTime;
    }, [selectedTime]);

    // Update time when date changes
    useEffect(() => {
        const is_today = isToday(selectedDate);
        if (is_today) {
            // For today, keep the selected time or use adjusted_start_time
            // Only reset if the time hasn't been set yet or was 23:59
            if (selectedTime === '23:59') {
                setSelectedTime(adjusted_start_time);
            }
        } else {
            // For future dates, use stored expiry_time if available (e.g. market close time)
            const storedTime = expiry_time ? expiry_time.substring(0, 5) : '23:59';
            setSelectedTime(storedTime);
        }
    }, [selectedDate, isToday, adjusted_start_time, expiry_time]);

    // Fetch trading days for calendar disabled days
    const onChangeCalendarMonth = useCallback(
        async (e = toMoment().format('YYYY-MM-DD')) => {
            let new_disabled_days: number[] = [];
            const trading_days = await ContractType.getTradingDays(e, symbol);
            if (trading_days) {
                const all_days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
                new_disabled_days = all_days
                    .map((day, index) => (!trading_days.includes(day) ? index : -1))
                    .filter(index => index !== -1);
            }
            if (isMounted()) {
                setDisabledDays(new_disabled_days);
            }
        },
        [isMounted, symbol]
    );

    useEffect(() => {
        onChangeCalendarMonth();
    }, [onChangeCalendarMonth]);

    // Market times for time picker (only used when is_24_hours_contract is true)
    const start_times = useMemo(() => {
        if (is_24_hours_contract) {
            // For today, earliest selectable time is adjusted_start_time (server time + 5 min)
            return [moment(adjusted_start_time, 'HH:mm')];
        }
        if (market_open_times?.length > 0) {
            return market_open_times.map((time: string) => moment(time, 'HH:mm'));
        }
        return [moment().add(5, 'minutes')];
    }, [market_open_times, is_24_hours_contract, adjusted_start_time]);

    const end_times = useMemo(() => {
        if (market_open_times?.length > 0) {
            return market_open_times.map((time: string) => moment(time, 'HH:mm').add(1, 'day'));
        }
        return [moment().add(1, 'day').hour(23).minute(59)];
    }, [market_open_times]);

    // Date picker handlers
    const handleDateClick = useCallback(() => {
        if (!is_date_disabled) {
            setIsDatePickerOpen(true);
        }
    }, [is_date_disabled]);

    const handleDateChange = useCallback(
        (value: Date | Date[] | null | [Date | null, Date | null]) => {
            let newDate: Date | null = null;

            if (value && value instanceof Date) {
                newDate = value;
            } else if (Array.isArray(value) && value[0] instanceof Date) {
                newDate = value[0];
            }

            if (newDate) {
                setSelectedDate(newDate);

                // Auto-set time based on whether it's today or future
                const is_today = isToday(newDate);
                if (is_today) {
                    setSelectedTime(adjusted_start_time);
                } else {
                    // For future dates, use stored expiry_time if available (e.g. market close time)
                    const storedTime = expiry_time ? expiry_time.substring(0, 5) : '23:59';
                    setSelectedTime(storedTime);
                }

                setIsDatePickerOpen(false); // Auto-close on selection
            }
        },
        [isToday, adjusted_start_time, expiry_time]
    );

    const handleDatePickerClose = useCallback(() => {
        setIsDatePickerOpen(false);
    }, []);

    // Time picker handlers
    const handleTimeClick = useCallback(() => {
        // Only open time picker if it's enabled (is_24_hours_contract)
        if (is_24_hours_contract) {
            setIsTimePickerOpen(true);
        }
    }, [is_24_hours_contract]);

    const handleTimeChange = useCallback((time: string) => {
        setSelectedTime(time);
    }, []);

    const handleTimePickerDone = useCallback(() => {
        setIsTimePickerOpen(false); // Just close, don't save to store
    }, []);

    const handleTimePickerClose = useCallback(() => {
        setIsTimePickerOpen(false);
    }, []);

    // Save handler - saves both date AND time to store
    const handleSave = useCallback(() => {
        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
        const timeToSave = selectedTime;
        const formattedTime =
            timeToSave.includes(':') && timeToSave.split(':').length === 2 ? `${timeToSave}:00` : timeToSave;

        onChangeMultiple({
            expiry_type: 'endtime',
            expiry_date: formattedDate,
            expiry_time: formattedTime,
        });
        onClose();
    }, [selectedDate, selectedTime, onChangeMultiple, onClose]);

    // Disabled days for calendar
    const getDisabledDays = useCallback(
        ({ date }: { date: Date }) => {
            const day = date.getDay();
            return disabled_days.includes(day);
        },
        [disabled_days]
    );

    // Min date for calendar - use same logic as mobile to respect contract-specific restrictions
    const getMinDate = useCallback(() => {
        return getDatePickerStartDate(duration_units_list, server_time, start_time, duration_min_max);
    }, [duration_units_list, server_time, start_time, duration_min_max]);

    const getMaxDate = useCallback(() => {
        return moment().add(1, 'year').toDate();
    }, []);

    // Format date for display
    const getFormattedDate = useCallback(() => {
        return moment(selectedDate).format('DD/MM/YYYY');
    }, [selectedDate]);

    // Dynamic expiry message
    const getExpiryMessage = useCallback(() => {
        const formattedDate = moment(selectedDate).format('DD/MM/YYYY');
        return localize('Contract will expire on {{formatted_date}} at {{time}} GMT.', {
            formatted_date: formattedDate,
            time: selectedTime,
        });
    }, [selectedDate, selectedTime, localize]);

    return (
        <div className='duration-end-time-desktop__wrapper'>
            {/* Date Field */}
            <div ref={dateFieldRef} className='duration-end-time-desktop__field'>
                <TextField
                    label={localize('End date')}
                    name='end_date'
                    value={getFormattedDate()}
                    onClick={handleDateClick}
                    readOnly
                    variant='fill'
                    status='neutral'
                    noStatusIcon
                    disabled={is_date_disabled}
                    data-testid='dt_duration_end_date_input'
                />
            </div>

            {/* Time Field */}
            <div ref={timeFieldRef} className='duration-end-time-desktop__field'>
                <TextField
                    label={localize('End time')}
                    name='end_time'
                    value={`${displayTime} GMT`}
                    onClick={handleTimeClick}
                    readOnly
                    variant='fill'
                    status='neutral'
                    noStatusIcon
                    disabled={!is_24_hours_contract}
                    data-testid='dt_duration_end_time_input'
                />
            </div>

            {/* Expiry Message */}
            <div className='duration-end-time-desktop__message'>{getExpiryMessage()}</div>

            {/* Date Picker Popover */}
            <InputPopover
                isOpen={isDatePickerOpen}
                onClose={handleDatePickerClose}
                triggerRef={dateFieldRef}
                className='duration-end-time-desktop__date-popover'
                popoverWidth={312}
                placement='bottom'
                spacing={4}
            >
                <div className='duration-end-time-desktop__date-picker-content'>
                    <DatePicker
                        hasFixedWidth={false}
                        minDate={getMinDate()}
                        maxDate={getMaxDate()}
                        view='month'
                        value={selectedDate}
                        onChange={handleDateChange}
                        tileDisabled={getDisabledDays}
                    />
                    {/* NO save button here - auto-closes on date selection */}
                </div>
            </InputPopover>

            {/* Time Picker Popover - only shown when is_24_hours_contract */}
            {is_24_hours_contract && (
                <InputPopover
                    isOpen={isTimePickerOpen}
                    onClose={handleTimePickerClose}
                    triggerRef={timeFieldRef}
                    className='duration-end-time-desktop__time-popover'
                    popoverWidth={321}
                    placement='bottom'
                    spacing={4}
                >
                    <div className='duration-end-time-desktop__time-picker-content'>
                        <TimeGridPicker
                            selectedTime={selectedTime}
                            onTimeChange={handleTimeChange}
                            startTimes={start_times}
                            endTimes={end_times}
                        />
                        <div className='duration-end-time-desktop__time-picker-footer'>
                            <Button
                                size='lg'
                                color='black-white'
                                variant='primary'
                                fullWidth
                                onClick={handleTimePickerDone}
                            >
                                <Localize i18n_default_text='Done' />
                            </Button>
                        </div>
                    </div>
                </InputPopover>
            )}

            {/* Main Save Button */}
            <div className='duration-end-time-desktop__footer'>
                <Button
                    size='lg'
                    color='black-white'
                    variant='primary'
                    fullWidth
                    onClick={handleSave}
                    className='duration-end-time-desktop__save-button'
                >
                    <Localize i18n_default_text='Save' />
                </Button>
            </div>
        </div>
    );
});

export default DurationEndTimeDesktop;
