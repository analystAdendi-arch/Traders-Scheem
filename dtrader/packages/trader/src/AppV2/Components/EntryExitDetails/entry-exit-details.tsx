import { useMemo } from 'react';
import moment from 'moment';

import {
    addComma,
    formatDate,
    formatTime,
    getEndTime,
    getEntrySpotTooltipMessage,
    isDigitContract,
    TContractInfo,
} from '@deriv/shared';
import { Localize } from '@deriv-com/translations';

import CardWrapper from '../CardWrapper';

import EntryExitDetailRow from './entry-exit-details-row';

const getDateTimeFromEpoch = (epoch: number | string | undefined | null) => {
    // Handle undefined, null, or empty values
    if (epoch === undefined || epoch === null || epoch === '') {
        return undefined;
    }

    // Convert to number and validate
    const epochNumber = typeof epoch === 'string' ? parseFloat(epoch) : epoch;

    // Check if conversion resulted in a valid number and is positive
    if (isNaN(epochNumber) || epochNumber <= 0) {
        return undefined;
    }

    try {
        const date = new Date(epochNumber * 1000);

        // Validate the created date is valid
        if (isNaN(date.getTime())) {
            return undefined;
        }

        const momentDate = moment(date);
        const formattedDate = formatDate(momentDate, 'DD MMM YYYY');
        const formattedTime = formatTime(epochNumber, 'HH:mm:ss [GMT]');

        return {
            date: formattedDate,
            time: formattedTime,
        };
    } catch {
        // Handle any unexpected errors in date formatting
        return undefined;
    }
};

const EntryExitDetails = ({ contract_info }: { contract_info: TContractInfo }) => {
    const { entry_spot_time, entry_spot, exit_spot_time, exit_spot, date_start, contract_type } = contract_info;
    const entry_spot_tooltip = getEntrySpotTooltipMessage(contract_type);

    const dateTimes = useMemo(
        () => ({
            entry: entry_spot_time ? getDateTimeFromEpoch(entry_spot_time) : undefined,
            exit: exit_spot_time ? getDateTimeFromEpoch(exit_spot_time) : undefined,
            start: date_start ? getDateTimeFromEpoch(date_start) : undefined,
            end: getEndTime(contract_info) ? getDateTimeFromEpoch(getEndTime(contract_info) ?? 0) : undefined,
        }),
        [entry_spot_time, exit_spot_time, date_start, contract_info]
    );

    const entryValue = entry_spot ? addComma(entry_spot.toString()) : null;
    const exitValue = exit_spot ? addComma(exit_spot.toString()) : null;

    return (
        <CardWrapper title={<Localize i18n_default_text='Entry & exit details' />} className='entry-exit-details'>
            <div className='entry-exit-details__table'>
                {dateTimes.start && (
                    <EntryExitDetailRow
                        label={<Localize i18n_default_text='Start time' />}
                        value={dateTimes.start.date}
                        time={dateTimes.start.time}
                    />
                )}
                {dateTimes.entry && entryValue && !isDigitContract(contract_type) && (
                    <EntryExitDetailRow
                        label={<Localize i18n_default_text='Entry spot' />}
                        value={entryValue}
                        {...dateTimes.entry}
                        tooltip_message={entry_spot_tooltip}
                    />
                )}
                {dateTimes.end && (
                    <EntryExitDetailRow
                        label={<Localize i18n_default_text='Exit time' />}
                        value={dateTimes.end.date}
                        time={dateTimes.end.time}
                    />
                )}
                {dateTimes.exit && exitValue && (
                    <EntryExitDetailRow
                        label={<Localize i18n_default_text='Exit spot' />}
                        value={exitValue}
                        {...dateTimes.exit}
                    />
                )}
            </div>
        </CardWrapper>
    );
};

export default EntryExitDetails;
