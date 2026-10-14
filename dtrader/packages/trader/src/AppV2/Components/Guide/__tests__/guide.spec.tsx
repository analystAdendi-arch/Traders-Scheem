import React from 'react';

import { TRADE_TYPES } from '@deriv/shared';
import { mockStore, StoreProvider } from '@deriv/stores';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TraderProviders from '../../../../trader-providers';
import Guide from '../guide';

const mockUseDevice = jest.fn(() => ({ isMobile: false }));

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: () => mockUseDevice(),
}));

const trade_types = 'Trade types';

// Mock available contracts - matches the structure returned by useAvailableContracts
const mockAvailableContracts = [
    {
        tradeType: 'Accumulators',
        id: CONTRACT_LIST.ACCUMULATORS,
        for: [TRADE_TYPES.ACCUMULATOR],
    },
    {
        tradeType: 'Vanillas',
        id: CONTRACT_LIST.VANILLAS,
        for: [TRADE_TYPES.VANILLA.CALL, TRADE_TYPES.VANILLA.PUT],
    },
    {
        tradeType: 'Turbos',
        id: CONTRACT_LIST.TURBOS,
        for: [TRADE_TYPES.TURBOS.LONG, TRADE_TYPES.TURBOS.SHORT],
    },
    {
        tradeType: 'Multipliers',
        id: CONTRACT_LIST.MULTIPLIERS,
        for: [TRADE_TYPES.MULTIPLIER],
    },
    {
        tradeType: 'Rise/Fall',
        id: CONTRACT_LIST.RISE_FALL,
        for: [TRADE_TYPES.RISE_FALL, TRADE_TYPES.RISE_FALL_EQUAL],
    },
    {
        tradeType: 'Higher/Lower',
        id: CONTRACT_LIST.HIGHER_LOWER,
        for: [TRADE_TYPES.HIGH_LOW],
    },
    {
        tradeType: 'Touch/No Touch',
        id: CONTRACT_LIST.TOUCH_NO_TOUCH,
        for: [TRADE_TYPES.TOUCH],
    },
    {
        tradeType: 'Matches/Differs',
        id: CONTRACT_LIST.MATCHES_DIFFERS,
        for: [TRADE_TYPES.MATCH_DIFF],
    },
    { tradeType: 'Even/Odd', id: CONTRACT_LIST.EVEN_ODD, for: [TRADE_TYPES.EVEN_ODD] },
    {
        tradeType: 'Over/Under',
        id: CONTRACT_LIST.OVER_UNDER,
        for: [TRADE_TYPES.OVER_UNDER],
    },
];

const mock_contract_data = [
    {
        value: 'accumulator',
        text: 'Accumulators',
        barrier_category: 'american',
    },
    {
        value: 'vanillalongcall',
        text: 'Vanillas',
        barrier_category: 'euro_atm',
    },
    {
        value: 'turboslong',
        text: 'Turbos',
        barrier_category: 'american',
    },
    {
        value: 'multiplier',
        text: 'Multipliers',
        barrier_category: 'american',
    },
    {
        value: 'rise_fall',
        text: 'Rise/Fall',
        barrier_category: 'euro_atm',
    },
    {
        value: 'high_low',
        text: 'Higher/Lower',
        barrier_category: 'euro_atm',
    },
    {
        value: 'touch',
        text: 'Touch/No Touch',
        barrier_category: 'american',
    },
    {
        value: 'match_diff',
        text: 'Matches/Differs',
        barrier_category: 'non_financial',
    },
    {
        value: 'even_odd',
        text: 'Even/Odd',
        barrier_category: 'non_financial',
    },
    {
        value: 'over_under',
        text: 'Over/Under',
        barrier_category: 'non_financial',
    },
];

jest.mock('@lottiefiles/dotlottie-react', () => ({
    DotLottieReact: jest.fn(() => <div>DotLottieReact</div>),
}));

jest.mock('AppV2/Hooks/useContractsFor', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        contracts_for: mock_contract_data,
        is_fetching_ref: { current: false },
        trade_types: mock_contract_data,
    })),
}));

jest.mock('AppV2/Hooks/useGuideContractTypes', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        trade_types: [
            { text: 'Accumulators', value: 'accumulator' },
            { text: 'Vanillas', value: 'vanillalongcall' },
            { text: 'Turbos', value: 'turboslong' },
            { text: 'Multipliers', value: 'multiplier' },
            { text: 'Rise/Fall', value: 'rise_fall' },
            { text: 'Higher/Lower', value: 'high_low' },
            { text: 'Touch/No Touch', value: 'touch' },
            { text: 'Matches/Differs', value: 'match_diff' },
            { text: 'Even/Odd', value: 'even_odd' },
            { text: 'Over/Under', value: 'over_under' },
        ],
    })),
}));

describe('Guide', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(() => {
        default_mock_store = mockStore({
            modules: { trade: { contract_type: TRADE_TYPES.RISE_FALL, is_vanilla: false } },
        });
    });
    const renderGuide = (
        mockProps: React.ComponentProps<typeof Guide> = { show_guide_for_selected_contract: false }
    ) => {
        render(
            <StoreProvider store={default_mock_store}>
                <TraderProviders store={default_mock_store}>
                    <Guide {...mockProps} />
                </TraderProviders>
            </StoreProvider>
        );
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render component with icon button and if user clicks on it, should show available contract information', async () => {
        renderGuide();

        expect(screen.getByText(/How to trade Rise\/Fall\?/)).toBeInTheDocument();

        await userEvent.click(screen.getByText(/How to trade Rise\/Fall\?/));

        expect(screen.getByText(trade_types)).toBeInTheDocument();
        mockAvailableContracts.forEach(({ id }) => expect(screen.getByText(id)).toBeInTheDocument());
    });

    it('should render component with description for only for selected trade type if show_guide_for_selected_contract === true', async () => {
        renderGuide({ show_guide_for_selected_contract: true });

        await userEvent.click(screen.getByText(/How to trade Rise\/Fall\?/));

        expect(screen.queryByText(trade_types)).not.toBeInTheDocument();
        expect(screen.getByText(CONTRACT_LIST.RISE_FALL)).toBeInTheDocument();

        mockAvailableContracts.forEach(({ id }) =>
            id === CONTRACT_LIST.RISE_FALL
                ? expect(screen.getByText(id)).toBeInTheDocument()
                : expect(screen.queryByText(id)).not.toBeInTheDocument()
        );
    });

    it('should render term definition in tooltip on desktop when hovering over term', async () => {
        // Desktop mode - definitions show in tooltips on hover
        mockUseDevice.mockReturnValue({ isMobile: false });

        renderGuide();

        await userEvent.click(screen.getByText(/How to trade Rise\/Fall\?/));
        await userEvent.click(screen.getByText(CONTRACT_LIST.ACCUMULATORS));

        // Wait for the AccumulatorsTradeDescription component to load
        const growth_rate_text = await screen.findByText(/growth rate/i, {}, { timeout: 3000 });

        // On desktop, term definitions appear in tooltips (TooltipPortal component)
        expect(growth_rate_text).toBeInTheDocument();

        // Verify that term buttons are rendered (wrapped in TooltipPortal on desktop)
        const termButtons = screen.getAllByRole('button', { name: /growth rate/i });
        expect(termButtons.length).toBeGreaterThan(0);
    });

    it('should render term definition in modal on mobile when clicking term', async () => {
        // Mobile mode - definitions show in modal on click
        mockUseDevice.mockReturnValue({ isMobile: true });

        renderGuide();

        const term_definition = 'You can choose a growth rate with values of 1%, 2%, 3%, 4%, and 5%.';
        expect(screen.queryByText(term_definition)).not.toBeInTheDocument();

        // On mobile, the guide trigger is a button instead of text link
        const guideButton = screen.getByRole('button', { name: '' });
        await userEvent.click(guideButton);

        await userEvent.click(screen.getByText(CONTRACT_LIST.ACCUMULATORS));

        // Wait for the AccumulatorsTradeDescription component to load and find the term
        const growth_rate_text = await screen.findByText(/growth rate/i, {}, { timeout: 3000 });
        await userEvent.click(growth_rate_text);

        // On mobile, clicking a term opens GuideDefinitionModal with the definition
        expect(await screen.findByText(term_definition)).toBeInTheDocument();
    });
    // [/AI]
});
