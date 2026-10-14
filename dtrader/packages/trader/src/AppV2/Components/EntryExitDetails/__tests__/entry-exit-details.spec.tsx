import { CONTRACT_TYPES, mockContractInfo, TContractInfo } from '@deriv/shared';
import { render, screen } from '@testing-library/react';

import EntryExitDetails from '../entry-exit-details';

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    addComma: jest.fn(value => value.toString()),
    getEndTime: jest.fn(() => 1623441600),
    formatDate: jest.fn(() => '12/1/23'),
    formatTime: jest.fn(() => '12:23'),
}));

const mock_contract_info: TContractInfo = mockContractInfo({
    entry_spot_time: 1622505600,
    entry_spot: '100',
    exit_spot_time: 1623441400,
    exit_spot: '150',
    date_start: 1622505600,
    contract_type: 'CALL',
});

const mock_digit_contract_info: TContractInfo = mockContractInfo({
    entry_spot_time: 1622505600,
    entry_spot: '100',
    exit_spot_time: 1623441400,
    exit_spot: '150',
    date_start: 1622505600,
    contract_type: CONTRACT_TYPES.MATCH_DIFF.MATCH,
});

describe('EntryExitDetails component', () => {
    describe('Non-digits contracts', () => {
        it('renders entry and exit details correctly for non-digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_contract_info} />);

            expect(screen.getByText('Entry & exit details')).toBeInTheDocument();
            expect(screen.getByText('Start time')).toBeInTheDocument();
            expect(screen.getByText('Entry spot')).toBeInTheDocument();
            expect(screen.getByText('Exit time')).toBeInTheDocument();
            expect(screen.getByText('Exit spot')).toBeInTheDocument();
        });

        it('renders correct entry spot value for non-digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_contract_info} />);

            expect(screen.getByText('100')).toBeInTheDocument();
        });

        it('renders correct exit spot value for non-digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_contract_info} />);

            expect(screen.getByText('150')).toBeInTheDocument();
        });

        it('renders correct entry and exit time for non-digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_contract_info} />);
            expect(screen.queryAllByText('12/1/23').length).toBeGreaterThan(0);
            expect(screen.queryAllByText('12:23').length).toBeGreaterThan(0);
        });
    });

    describe('Digits contracts', () => {
        it('does not render entry spot for digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_digit_contract_info} />);

            expect(screen.getByText('Entry & exit details')).toBeInTheDocument();
            expect(screen.getByText('Start time')).toBeInTheDocument();
            expect(screen.queryByText('Entry spot')).not.toBeInTheDocument();
            expect(screen.getByText('Exit time')).toBeInTheDocument();
            expect(screen.getByText('Exit spot')).toBeInTheDocument();
        });

        it('renders exit spot value for digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_digit_contract_info} />);

            expect(screen.getByText('150')).toBeInTheDocument();
        });

        it('does not render entry spot value for digits contracts', () => {
            render(<EntryExitDetails contract_info={mock_digit_contract_info} />);

            const entrySpotElements = screen.queryAllByText('100');
            expect(entrySpotElements).toHaveLength(0);
        });
    });

    describe('Higher/Lower contracts', () => {
        it('renders entry spot for HIGHER contract type', () => {
            const higher_contract_info: TContractInfo = mockContractInfo({
                entry_spot_time: 1622505600,
                entry_spot: '100',
                exit_spot_time: 1623441400,
                exit_spot: '150',
                date_start: 1622505600,
                contract_type: CONTRACT_TYPES.HIGHER,
            });

            render(<EntryExitDetails contract_info={higher_contract_info} />);

            expect(screen.getByText('Entry spot')).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument();
        });

        it('renders entry spot for LOWER contract type', () => {
            const lower_contract_info: TContractInfo = mockContractInfo({
                entry_spot_time: 1622505600,
                entry_spot: '100',
                exit_spot_time: 1623441400,
                exit_spot: '150',
                date_start: 1622505600,
                contract_type: CONTRACT_TYPES.LOWER,
            });

            render(<EntryExitDetails contract_info={lower_contract_info} />);

            expect(screen.getByText('Entry spot')).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument();
        });
    });
});
