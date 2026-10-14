import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import BarrierDesktop from '../barrier-desktop';

describe('BarrierDesktop', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: {
                trade: {
                    ...mockStore({}).modules.trade,
                    barrier_1: '+0.5',
                    is_market_closed: false,
                    symbol: '1HZ100V',
                    active_symbols: [
                        {
                            underlying_symbol: '1HZ100V',
                            market: 'synthetic_index',
                            underlying_symbol_type: 'synthetic_index',
                        },
                    ],
                    tick_data: {
                        quote: 1234.56,
                        pip_size: 2,
                    },
                    onChange: jest.fn(),
                },
            },
        });
    });

    const MockedBarrierDesktop = ({
        store = default_mock_store,
        isDays = false,
    }: {
        store?: ReturnType<typeof mockStore>;
        isDays?: boolean;
    }) => (
        <TraderProviders store={store}>
            <ModulesProvider store={store}>
                <BarrierDesktop is_minimized={false} isDays={isDays} />
            </ModulesProvider>
        </TraderProviders>
    );

    it('renders with Barrier label and current barrier value', () => {
        render(<MockedBarrierDesktop />);

        expect(screen.getByText('Barrier')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue('+0.5');
    });

    it('opens popover when clicked', async () => {
        render(<MockedBarrierDesktop />);

        await userEvent.click(screen.getByText('Barrier'));

        expect(screen.getByText('Above spot')).toBeInTheDocument();
        expect(screen.getByText('Below spot')).toBeInTheDocument();
        expect(screen.getByText('Fixed barrier')).toBeInTheDocument();
    });

    it('initializes with correct barrier type for above_spot (+)', async () => {
        default_mock_store.modules.trade.barrier_1 = '+0.5';
        render(<MockedBarrierDesktop />);

        await userEvent.click(screen.getByText('Barrier'));

        const tabs = screen.getAllByRole('tab');
        const aboveSpotTab = tabs.find(tab => tab.textContent === 'Above spot');
        expect(aboveSpotTab).toHaveAttribute('aria-selected', 'true');
    });

    it('initializes with correct barrier type for below_spot (-)', async () => {
        default_mock_store.modules.trade.barrier_1 = '-0.5';
        render(<MockedBarrierDesktop />);

        await userEvent.click(screen.getByText('Barrier'));

        const tabs = screen.getAllByRole('tab');
        const belowSpotTab = tabs.find(tab => tab.textContent === 'Below spot');
        expect(belowSpotTab).toHaveAttribute('aria-selected', 'true');
    });

    it('initializes with correct barrier type for fixed_barrier', async () => {
        default_mock_store.modules.trade.barrier_1 = '1234.00';
        render(<MockedBarrierDesktop />);

        await userEvent.click(screen.getByText('Barrier'));

        const tabs = screen.getAllByRole('tab');
        const fixedBarrierTab = tabs.find(tab => tab.textContent === 'Fixed barrier');
        expect(fixedBarrierTab).toHaveAttribute('aria-selected', 'true');
    });

    it('switches barrier type when different type is selected', async () => {
        render(<MockedBarrierDesktop />);

        await userEvent.click(screen.getByText('Barrier'));
        await userEvent.click(screen.getByText('Below spot'));

        const tabs = screen.getAllByRole('tab');
        const belowSpotTab = tabs.find(tab => tab.textContent === 'Below spot');
        expect(belowSpotTab).toHaveAttribute('aria-selected', 'true');
    });

    it('disables input when market is closed', () => {
        default_mock_store.modules.trade.is_market_closed = true;
        render(<MockedBarrierDesktop />);

        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('closes popover when Save button is clicked', async () => {
        render(<MockedBarrierDesktop />);

        await userEvent.click(screen.getByText('Barrier'));
        expect(screen.getByText('Save')).toBeInTheDocument();

        await userEvent.click(screen.getByText('Save'));

        expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('renders correctly when minimized', () => {
        render(
            <TraderProviders store={default_mock_store}>
                <ModulesProvider store={default_mock_store}>
                    <BarrierDesktop is_minimized={true} isDays={false} />
                </ModulesProvider>
            </TraderProviders>
        );

        const textField = screen.getByRole('textbox');
        expect(textField).toBeInTheDocument();
        expect(textField).toHaveValue('+0.5');
    });

    it('shows only Fixed barrier tab when isDays is true', async () => {
        render(<MockedBarrierDesktop isDays={true} />);

        await userEvent.click(screen.getByText('Barrier'));

        expect(screen.queryByText('Above spot')).not.toBeInTheDocument();
        expect(screen.queryByText('Below spot')).not.toBeInTheDocument();
        expect(screen.getByText('Fixed barrier')).toBeInTheDocument();
    });

    it('shows only Fixed barrier tab for forex markets', async () => {
        default_mock_store.modules.trade.symbol = 'frxEURUSD';
        default_mock_store.modules.trade.active_symbols = [
            { underlying_symbol: 'frxEURUSD', market: 'forex', underlying_symbol_type: 'forex' },
        ];
        render(<MockedBarrierDesktop isDays={false} />);

        await userEvent.click(screen.getByText('Barrier'));

        expect(screen.queryByText('Above spot')).not.toBeInTheDocument();
        expect(screen.queryByText('Below spot')).not.toBeInTheDocument();
        expect(screen.getByText('Fixed barrier')).toBeInTheDocument();
    });

    it('shows all barrier type tabs for non-daily non-forex contracts', async () => {
        render(<MockedBarrierDesktop isDays={false} />);

        await userEvent.click(screen.getByText('Barrier'));

        expect(screen.getByText('Above spot')).toBeInTheDocument();
        expect(screen.getByText('Below spot')).toBeInTheDocument();
        expect(screen.getByText('Fixed barrier')).toBeInTheDocument();
    });
});
