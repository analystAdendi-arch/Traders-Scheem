import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';

import { hasIntradayDurationUnit } from '@deriv/shared';
import { Text } from '@deriv-com/quill-ui';
import { Localize, localize } from '@deriv-com/translations';

import {
    type DurationPresetsByUnit,
    type DurationUnit,
    getDurationPresets,
    isDurationUnitApplicable,
} from 'AppV2/Config/trade-parameter-presets';
import {
    getSymbolMarketData,
    mapContractTypeToDurationPresetKey,
    mapSymbolToMarketCategory,
} from 'AppV2/Utils/trade-params-preset-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import { TabSelector } from '../../InputPopover';
import { ChipsWithInputToggle } from '../Shared';
import TradeParameterPopover, { useTradeParameterPopover } from '../Shared/TradeParameterPopover';

import DurationEndTimeDesktop from './duration-end-time-desktop';
import DurationHoursInputDesktop from './duration-hours-input-desktop';
import DurationInputDesktop from './duration-input-desktop';
import DurationTicksInputDesktop from './duration-ticks-input-desktop';
import DurationUnitSelector from './duration-unit-selector';

interface DurationDesktopProps {
    is_minimized?: boolean;
}

type DurationConfig = {
    chipValues: number[] | string[];
    selectedValue: number | string;
    onSelect: (value: number | string) => void;
    formatValue: (value: number | string) => string;
    inputComponent: React.ReactNode;
};

const DurationPopoverContent: React.FC<{
    selectedUnit: string;
    storedUnit: string; // The unit that the duration was originally stored in
    activeTab: 'chips' | 'input';
    selectedDuration: number;
    availableUnits: string[];
    contract_type: string;
    symbol: string;
    active_symbols: any;
    onDurationSelect: (value: number) => void;
    onHourSelect: (hours: number) => void;
    onEndTimeSelect: (time: string) => void;
    onUnitSelect: (unit: string) => void;
    onTabChange: (tab: 'chips' | 'input') => void;
    formatTickValue: (value: number) => string;
    formatSecondsValue: (value: number) => string;
    formatMinutesValue: (value: number) => string;
    formatHoursValue: (value: number) => string;
    formatEndTimeValue: (value: string) => string;
}> = ({
    selectedUnit,
    storedUnit,
    activeTab,
    selectedDuration,
    availableUnits,
    contract_type,
    symbol,
    active_symbols,
    onDurationSelect,
    onHourSelect,
    onEndTimeSelect,
    onUnitSelect,
    onTabChange,
    formatTickValue,
    formatSecondsValue,
    formatMinutesValue,
    formatHoursValue,
    formatEndTimeValue,
}) => {
    const { closePopover } = useTradeParameterPopover();

    // Safety check: If config is null, automatically switch to a valid unit
    React.useEffect(() => {
        const validUnits = ['t', 's', 'm', 'h', 'end_time'];
        if (!validUnits.includes(selectedUnit)) {
            // Find first valid unit from available units
            const firstValid = availableUnits.find(unit => validUnits.includes(unit));
            if (firstValid && firstValid !== selectedUnit) {
                onUnitSelect(firstValid);
            }
        }
    }, [selectedUnit, availableUnits, onUnitSelect]);

    const handleDurationSelectAndClose = useCallback(
        (value: number) => {
            onDurationSelect(value);
            closePopover();
        },
        [onDurationSelect, closePopover]
    );

    const handleHourSelectAndClose = useCallback(
        (hours: number) => {
            onHourSelect(hours);
            closePopover();
        },
        [onHourSelect, closePopover]
    );

    const handleEndTimeSelectAndClose = useCallback(
        (time: string) => {
            onEndTimeSelect(time);
            closePopover();
        },
        [onEndTimeSelect, closePopover]
    );

    const config = useMemo(() => {
        // Get market category and trade type for preset lookup
        const symbolData = getSymbolMarketData(symbol, active_symbols);
        const marketCategory = mapSymbolToMarketCategory(symbolData?.market, symbolData?.submarket, symbolData?.symbol);
        const tradeTypeKey = mapContractTypeToDurationPresetKey(contract_type);

        // Default chip values for end_time (not trade-type specific)
        const defaultEndTimeChips = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

        // Fallback chip values if presets not found
        const fallbackTicks = [1, 2, 3, 5, 7, 10];
        const fallbackSeconds = [15, 30, 45, 60, 90, 120];
        const fallbackMinutes = [1, 2, 3, 5, 10, 15];
        const fallbackHours = [1, 2, 4, 8, 12, 24];

        // Get presets from config
        const tickPresets = tradeTypeKey ? getDurationPresets(tradeTypeKey, marketCategory, 't') : undefined;
        const secondPresets = tradeTypeKey ? getDurationPresets(tradeTypeKey, marketCategory, 's') : undefined;
        const minutePresets = tradeTypeKey ? getDurationPresets(tradeTypeKey, marketCategory, 'm') : undefined;
        const hourPresets = tradeTypeKey ? getDurationPresets(tradeTypeKey, marketCategory, 'h') : undefined;

        // Only highlight chips for the tab that matches the stored unit
        // This prevents highlighting "10 hours" when "10 minutes" was selected
        const configs: Record<string, DurationConfig | null> = {
            t: {
                chipValues: tickPresets || fallbackTicks,
                selectedValue: storedUnit === 't' ? selectedDuration : -1,
                onSelect: handleDurationSelectAndClose as (value: number | string) => void,
                formatValue: formatTickValue as (value: number | string) => string,
                inputComponent: <DurationTicksInputDesktop onClose={closePopover} />,
            },
            s: {
                chipValues: secondPresets || fallbackSeconds,
                selectedValue: storedUnit === 's' ? selectedDuration : -1,
                onSelect: handleDurationSelectAndClose as (value: number | string) => void,
                formatValue: formatSecondsValue as (value: number | string) => string,
                inputComponent: <DurationInputDesktop unit='s' onClose={closePopover} />,
            },
            m: {
                chipValues: minutePresets || fallbackMinutes,
                selectedValue: storedUnit === 'm' ? selectedDuration : -1,
                onSelect: handleDurationSelectAndClose as (value: number | string) => void,
                formatValue: formatMinutesValue as (value: number | string) => string,
                inputComponent: <DurationInputDesktop unit='m' onClose={closePopover} />,
            },
            h: {
                chipValues: hourPresets || fallbackHours,
                selectedValue: storedUnit === 'h' ? Math.floor(selectedDuration / 60) : -1,
                onSelect: handleHourSelectAndClose as (value: number | string) => void,
                formatValue: formatHoursValue as (value: number | string) => string,
                inputComponent: <DurationHoursInputDesktop onClose={closePopover} />,
            },
            end_time: {
                chipValues: defaultEndTimeChips,
                selectedValue: storedUnit === 'end_time' ? defaultEndTimeChips[0] : '',
                onSelect: handleEndTimeSelectAndClose as (value: number | string) => void,
                formatValue: formatEndTimeValue as (value: number | string) => string,
                inputComponent: <DurationEndTimeDesktop onClose={closePopover} />,
            },
        };
        return configs[selectedUnit] || null;
    }, [
        selectedUnit,
        storedUnit,
        selectedDuration,
        contract_type,
        symbol,
        active_symbols,
        handleDurationSelectAndClose,
        handleHourSelectAndClose,
        handleEndTimeSelectAndClose,
        formatTickValue,
        formatSecondsValue,
        formatMinutesValue,
        formatHoursValue,
        formatEndTimeValue,
        closePopover,
    ]);

    const hasOnlyOneUnit = availableUnits.length === 1;

    // Check if presets are disabled for the current unit (end_time doesn't use presets from config)
    const presetsDisabled = selectedUnit === 'end_time';

    return (
        <div className={`duration-popover__layout ${hasOnlyOneUnit ? 'duration-popover__layout--single-unit' : ''}`}>
            {!hasOnlyOneUnit && (
                <div className='duration-popover__sidebar'>
                    <DurationUnitSelector
                        selectedUnit={selectedUnit}
                        onSelectUnit={onUnitSelect}
                        availableUnits={availableUnits}
                    />
                </div>
            )}
            <div className='duration-popover__main'>
                {config && !presetsDisabled && (
                    <div className='duration-popover__header'>
                        <TabSelector activeTab={activeTab} onTabChange={onTabChange} />
                    </div>
                )}
                <div className='duration-popover__content'>
                    {config ? (
                        presetsDisabled ? (
                            config.inputComponent
                        ) : (
                            <ChipsWithInputToggle
                                key={selectedUnit}
                                activeTab={activeTab}
                                chipValues={config.chipValues as number[]}
                                selectedValue={config.selectedValue as number}
                                onSelect={config.onSelect as (value: number) => void}
                                formatValue={config.formatValue as (value: number) => string}
                                inputComponent={config.inputComponent}
                            />
                        )
                    ) : (
                        <div className='duration-popover__coming-soon'>
                            <Text size='md' color='quill-typography-default'>
                                <Localize i18n_default_text='Coming soon' />
                            </Text>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DurationDesktop: React.FC<DurationDesktopProps> = observer(({ is_minimized }) => {
    const {
        duration,
        duration_unit,
        duration_units_list,
        onChangeMultiple,
        is_market_closed,
        expiry_type,
        expiry_time,
        expiry_date,
        contract_type,
        symbol,
        active_symbols,
    } = useTraderStore();

    // Normalize stale daily duration: when duration_unit is 'd' and no explicit end time has
    // been saved, convert to endtime expiry with the correct default date.
    // useLayoutEffect runs synchronously before browser paint, preventing visible flicker.
    useLayoutEffect(() => {
        if (duration_unit === 'd' && expiry_type !== 'endtime' && duration_units_list.length > 0) {
            const has_intraday = hasIntradayDurationUnit(duration_units_list);
            const default_date = has_intraday ? moment() : moment().add(1, 'days');
            onChangeMultiple({
                expiry_type: 'endtime',
                expiry_date: default_date.format('YYYY-MM-DD'),
                expiry_time: '23:59:00',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration_units_list]);

    // Get market category for duration preset filtering
    const marketCategory = React.useMemo(() => {
        const symbolData = getSymbolMarketData(symbol, active_symbols);
        return mapSymbolToMarketCategory(symbolData?.market, symbolData?.submarket, symbolData?.symbol);
    }, [symbol, active_symbols]);

    // Get trade type key for duration presets
    const tradeTypeKey = React.useMemo(() => {
        return mapContractTypeToDurationPresetKey(contract_type);
    }, [contract_type]);

    const availableUnits = React.useMemo(() => {
        // Start with all units from duration_units_list - these are the units available for this contract
        // We should NOT filter these out based on presets - presets are only for chip values
        const units = duration_units_list.map(unit => unit.value);

        // Add end_time for contracts that support it
        // (it's an expiry type, not a duration unit, so it's not in duration_units_list)
        // Match mobile behavior: only show end_time when duration_units_list.length > 1
        // This ensures forex markets (or any market with only 1 duration unit) don't show end time option
        // HOWEVER: If the current state is using endtime expiry, we must include it
        // regardless of duration_units_list.length to avoid breaking the modal
        const show_end_time = duration_units_list.length > 1;
        const is_currently_using_endtime = expiry_type === 'endtime';
        // Special case: 'd' (days) is a duration_unit that maps to end_time (combined date+time picker)
        const is_currently_using_days = duration_unit === 'd';

        // Add end_time when appropriate
        if (show_end_time || is_currently_using_endtime || is_currently_using_days) {
            if (!units.includes('end_time')) {
                units.push('end_time');
            }
        }

        return units;
    }, [duration_units_list, expiry_type, duration_unit]);

    const popoverWidth = React.useMemo(() => {
        // Use narrower width for single-unit contracts (like digit contracts)
        return availableUnits.length === 1 ? 280 : 360;
    }, [availableUnits]);

    // Initialize selectedUnit based on current duration_unit or first available unit
    // If duration_unit is an expiry type (like 'endtime'), default to first available unit
    // Helper function to get the first valid unit from available units
    const getFirstValidUnit = React.useCallback((units: string[]): string => {
        const validUnits = ['t', 's', 'm', 'h', 'end_time'];
        const firstValid = units.find(unit => validUnits.includes(unit));
        return firstValid || 't'; // Fallback to 't' if no valid unit found
    }, []);

    const getInitialUnit = React.useCallback(() => {
        // Priority 1: If expiry_type is 'endtime', always show end_time tab
        if (expiry_type === 'endtime') {
            return 'end_time';
        }

        // Priority 2: Special case: 'd' (days) maps to 'end_time' (combined date+time picker)
        if (duration_unit === 'd') {
            return 'end_time';
        }

        // Priority 3: Detect if current duration represents Hours
        // Hours are stored as duration_unit: 'm' with duration >= 60
        // Check if it's likely hours (duration is 60 or more minutes AND 'h' is available)
        if (duration_unit === 'm' && duration >= 60 && availableUnits.includes('h')) {
            return 'h';
        }

        // Priority 4: Check if current duration_unit is in available units AND has a valid config
        if (availableUnits.includes(duration_unit)) {
            const validUnits = ['t', 's', 'm', 'h', 'end_time'];
            if (validUnits.includes(duration_unit)) {
                return duration_unit;
            }
        }

        // Default to first valid unit from available units
        return getFirstValidUnit(availableUnits);
    }, [duration_unit, duration, expiry_type, availableUnits, getFirstValidUnit]);

    // Compute the effective stored unit from current store values.
    // Extracted as a function so it can be called from both state initializer and handleOpenPopover.
    const getEffectiveStoredUnit = React.useCallback(() => {
        if (expiry_type === 'endtime') return 'end_time';
        if (duration_unit === 'd') return 'end_time';
        if (duration_unit === 'm' && duration >= 60 && availableUnits.includes('h')) return 'h';
        return duration_unit;
    }, [expiry_type, duration_unit, duration, availableUnits]);

    const [selectedUnit, setSelectedUnit] = useState(() => getInitialUnit());
    const [selectedDuration, setSelectedDuration] = useState(duration);
    // Local state tracking which unit the selectedDuration belongs to.
    // Unlike a store-derived useMemo, this only updates at controlled moments
    // (popover open + chip selection), preventing brief flashes when the async
    // store processing in onChangeMultiple temporarily reverts duration_unit.
    const [selectedDurationUnit, setSelectedDurationUnit] = useState(() => getEffectiveStoredUnit());
    const [activeTab, setActiveTab] = useState<'chips' | 'input'>('chips');

    const handleOpenPopover = useCallback(() => {
        // Determine which unit to show based on current state
        let unitToShow: string;
        const validUnits = ['t', 's', 'm', 'h', 'end_time'];

        // Priority 1: If expiry_type is 'endtime', always show end_time tab
        if (expiry_type === 'endtime') {
            unitToShow = 'end_time';
        }
        // Priority 2: Special case: 'd' (days) maps to 'end_time'
        else if (duration_unit === 'd') {
            unitToShow = 'end_time';
        }
        // Priority 3: Detect if current duration represents Hours
        // Hours are stored as duration_unit: 'm' with duration >= 60
        else if (duration_unit === 'm' && duration >= 60 && availableUnits.includes('h')) {
            unitToShow = 'h';
        }
        // Priority 4: Use current duration_unit if valid
        else if (availableUnits.includes(duration_unit) && validUnits.includes(duration_unit)) {
            unitToShow = duration_unit;
        }
        // Default to first valid unit
        else {
            unitToShow = getFirstValidUnit(availableUnits);
        }

        setSelectedUnit(unitToShow);
        setSelectedDuration(duration);
        setSelectedDurationUnit(getEffectiveStoredUnit());
        setActiveTab('chips'); // Always start with chips tab
    }, [duration, duration_unit, expiry_type, availableUnits, getFirstValidUnit, getEffectiveStoredUnit]);

    const handleClosePopover = useCallback(() => {
        setActiveTab('chips'); // Reset to chips tab on close
    }, []);

    const handleUnitSelect = useCallback(
        (unit: string) => {
            // Validate that the selected unit has a valid config
            const validUnits = ['t', 's', 'm', 'h', 'end_time'];

            if (validUnits.includes(unit)) {
                // Unit has a valid config, proceed with selection
                setSelectedUnit(unit);
                setActiveTab('chips'); // Reset to chips tab when changing units
            } else {
                // Unit doesn't have a valid config, fallback to first valid unit
                const fallbackUnit = getFirstValidUnit(availableUnits);
                setSelectedUnit(fallbackUnit);
                setActiveTab('chips');
            }
        },
        [availableUnits, getFirstValidUnit]
    );

    const handleTabChange = useCallback((tab: 'chips' | 'input') => {
        setActiveTab(tab);
    }, []);

    const handleDurationSelect = useCallback(
        (value: number) => {
            setSelectedDuration(value);
            setSelectedDurationUnit(selectedUnit);
            // Apply the change immediately based on selected unit
            onChangeMultiple({
                duration_unit: selectedUnit,
                duration: value,
                expiry_type: 'duration',
            });
        },
        [selectedUnit, onChangeMultiple]
    );

    const handleHourSelect = useCallback(
        (hours: number) => {
            const totalMinutes = hours * 60;
            setSelectedDuration(totalMinutes);
            setSelectedDurationUnit('h');
            // Save as minutes
            onChangeMultiple({
                duration_unit: 'm',
                duration: totalMinutes,
                expiry_type: 'duration',
            });
        },
        [onChangeMultiple]
    );

    const formatTickValue = useCallback((value: number) => {
        return localize('{{count}} {{tick_label}}', {
            count: value,
            tick_label: value === 1 ? localize('tick') : localize('ticks'),
        });
    }, []);

    const formatSecondsValue = useCallback((value: number) => {
        return localize('{{count}} {{second_label}}', {
            count: value,
            second_label: localize('sec'),
        });
    }, []);

    const formatMinutesValue = useCallback((value: number) => {
        return localize('{{count}} {{minute_label}}', {
            count: value,
            minute_label: localize('min'),
        });
    }, []);

    const formatHoursValue = useCallback((value: number) => {
        return localize('{{count}} hr', {
            count: value,
        });
    }, []);

    const formatEndTimeValue = useCallback((value: string) => {
        return value; // Time is already formatted as HH:MM
    }, []);

    const handleEndTimeSelect = useCallback(
        (time: string) => {
            setSelectedDurationUnit('end_time');
            onChangeMultiple({
                expiry_type: 'endtime',
                expiry_time: time,
            });
        },
        [onChangeMultiple]
    );

    const getDisplayValue = useCallback(() => {
        if (expiry_type === 'endtime') {
            if (expiry_time && expiry_date) {
                const date = moment(expiry_date);
                const formattedDate = date.format('D MMM');
                const formattedTime = expiry_time.substring(0, 5);
                return `${formattedDate}, ${formattedTime}`;
            }
            if (expiry_date) {
                const date = moment(expiry_date);
                const formattedDate = date.format('D MMM');
                return formattedDate;
            }
        }

        if (duration_unit === 't') {
            return formatTickValue(duration);
        }
        if (duration_unit === 's') {
            return formatSecondsValue(duration);
        }
        if (duration_unit === 'm') {
            // Check if this is hours (stored as minutes)
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;

            // If it's a whole hour value (no remainder), display as hours
            if (minutes === 0 && hours > 0) {
                return localize('{{count}} {{hour_label}}', {
                    count: hours,
                    hour_label: hours === 1 ? localize('hour') : localize('hours'),
                });
            }
            // If it has both hours and minutes
            if (hours > 0 && minutes > 0) {
                return localize('{{hours_count}} {{hour_label}} {{minutes_count}} {{minute_label}}', {
                    hours_count: hours,
                    hour_label: hours === 1 ? localize('hour') : localize('hours'),
                    minutes_count: minutes,
                    minute_label: minutes === 1 ? localize('minute') : localize('minutes'),
                });
            }
            // Otherwise display as minutes
            return formatMinutesValue(duration);
        }
        if (duration_unit === 'd') {
            // Display the correct default: today for intraday contracts, tomorrow for daily-only.
            // When duration_units_list hasn't loaded yet, default to today (most 'd' contracts
            // have intraday units) to avoid a visible tomorrow→today flicker.
            const has_intraday = duration_units_list.length === 0 || hasIntradayDurationUnit(duration_units_list);
            const expiryDate = has_intraday ? moment() : moment().add(1, 'days');
            expiryDate.set({ hour: 23, minute: 59 });
            const formattedDate = expiryDate.format('D MMM');
            const formattedTime = expiryDate.format('HH:mm');
            return `${formattedDate}, ${formattedTime}`;
        }
        return `${duration} ${duration_unit}`;
    }, [
        duration,
        duration_unit,
        duration_units_list,
        expiry_type,
        expiry_time,
        expiry_date,
        formatTickValue,
        formatSecondsValue,
        formatMinutesValue,
    ]);

    return (
        <TradeParameterPopover
            popoverWidth={popoverWidth}
            label={<Localize i18n_default_text='Duration' key={`duration${is_minimized ? '-minimized' : ''}`} />}
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='duration-popover'
            value={getDisplayValue()}
            onOpen={handleOpenPopover}
            onClose={handleClosePopover}
        >
            <DurationPopoverContent
                selectedUnit={selectedUnit}
                storedUnit={selectedDurationUnit}
                activeTab={activeTab}
                selectedDuration={selectedDuration}
                availableUnits={availableUnits}
                contract_type={contract_type}
                symbol={symbol}
                active_symbols={active_symbols}
                onDurationSelect={handleDurationSelect}
                onHourSelect={handleHourSelect}
                onEndTimeSelect={handleEndTimeSelect}
                onUnitSelect={handleUnitSelect}
                onTabChange={handleTabChange}
                formatTickValue={formatTickValue}
                formatSecondsValue={formatSecondsValue}
                formatMinutesValue={formatMinutesValue}
                formatHoursValue={formatHoursValue}
                formatEndTimeValue={formatEndTimeValue}
            />
        </TradeParameterPopover>
    );
});

export default DurationDesktop;
