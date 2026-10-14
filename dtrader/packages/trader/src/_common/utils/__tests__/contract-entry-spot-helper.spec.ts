import { CONTRACT_TYPES } from '@deriv/shared';

import { getEntrySpotTooltipText } from '../contract-entry-spot-helper';

describe('getEntrySpotTooltipText', () => {
    const FIRST_TICK_AFTER_START = 'The first tick after the start time.';
    const TICK_AT_START_TIME =
        'The tick at the start time. If no tick is available exactly at the start time, the previous tick will be used.';

    describe('should return "The first tick after the start time." for', () => {
        it('Accumulator contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.ACCUMULATOR)).toBe(FIRST_TICK_AFTER_START);
        });

        it('Rise/Fall contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.CALL)).toBe(FIRST_TICK_AFTER_START);
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.PUT)).toBe(FIRST_TICK_AFTER_START);
        });

        it('Higher/Lower contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.HIGHER)).toBe(FIRST_TICK_AFTER_START);
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.LOWER)).toBe(FIRST_TICK_AFTER_START);
        });

        it('Touch/NoTouch contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.TOUCH.ONE_TOUCH)).toBe(FIRST_TICK_AFTER_START);
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.TOUCH.NO_TOUCH)).toBe(FIRST_TICK_AFTER_START);
        });

        it('Multiplier contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.MULTIPLIER.UP)).toBe(FIRST_TICK_AFTER_START);
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.MULTIPLIER.DOWN)).toBe(FIRST_TICK_AFTER_START);
        });

        it('undefined contract type', () => {
            expect(getEntrySpotTooltipText()).toBe(FIRST_TICK_AFTER_START);
        });

        it('empty string contract type', () => {
            expect(getEntrySpotTooltipText('')).toBe(FIRST_TICK_AFTER_START);
        });

        it('unknown contract type', () => {
            expect(getEntrySpotTooltipText('UNKNOWN_CONTRACT_TYPE')).toBe(FIRST_TICK_AFTER_START);
        });
    });

    describe('should return "The tick at the start time..." for', () => {
        it('Vanilla Call contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.VANILLA.CALL)).toBe(TICK_AT_START_TIME);
        });

        it('Vanilla Put contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.VANILLA.PUT)).toBe(TICK_AT_START_TIME);
        });

        it('Turbos Long contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.TURBOS.LONG)).toBe(TICK_AT_START_TIME);
        });

        it('Turbos Short contracts', () => {
            expect(getEntrySpotTooltipText(CONTRACT_TYPES.TURBOS.SHORT)).toBe(TICK_AT_START_TIME);
        });
    });
});
