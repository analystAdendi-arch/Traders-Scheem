import React from 'react';

import { mockStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TraderProviders from '../../../../../trader-providers';
import PayoutPerPointInfo from '../payout-per-point-info';

const label = 'Payout per point';
const description = "The money you earn or lose for every one-point change in an asset's price.";

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(() => ({ isDesktop: false })),
}));

describe('<PayoutPerPointInfo />', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(
        () =>
            (default_mock_store = mockStore({
                modules: {
                    trade: {
                        ...mockStore({}),
                        contract_type: 'vanillalongcall',
                        currency: 'USD',
                        proposal_info: {
                            VANILLALONGCALL: {
                                obj_contract_basis: {
                                    text: 'payout',
                                    value: 123,
                                },
                            },
                        },
                    },
                },
            }))
    );

    afterEach(() => jest.clearAllMocks());

    const mockedPayoutPerPointInfo = () =>
        render(
            <TraderProviders store={default_mock_store}>
                <PayoutPerPointInfo />
            </TraderProviders>
        );

    it('does not render if there is an API error ', () => {
        default_mock_store.modules.trade.proposal_info = {
            VANILLALONGCALL: {
                has_error: true,
            },
        };
        const { container } = mockedPayoutPerPointInfo();

        expect(container).toBeEmptyDOMElement();
    });

    it('renders loader if payout is falsy but there is no API error', () => {
        default_mock_store.modules.trade.proposal_info = {};
        mockedPayoutPerPointInfo();

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByTestId('dt_skeleton')).toBeInTheDocument();
        expect(screen.queryByText('123 USD')).not.toBeInTheDocument();
    });
    it('displays the correct label, value and currency', () => {
        mockedPayoutPerPointInfo();

        expect(screen.getByText('123 USD')).toBeInTheDocument();
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(label)).not.toHaveClass('trade-params__text--disabled');
    });
    it('applies specific className if is_market_closed === true', () => {
        default_mock_store.modules.trade.is_market_closed = true;
        mockedPayoutPerPointInfo();

        expect(screen.getByText(label)).toHaveClass('trade-params__text--disabled');
    });

    it('opens ActionSheet with description when user clicks on label (mobile)', async () => {
        mockedPayoutPerPointInfo();

        await userEvent.click(screen.getByText(label));

        expect(screen.getByText(description)).toBeInTheDocument();
        expect(screen.getByText('Got it')).toBeInTheDocument();
    });

    it('does not open ActionSheet when market is closed (mobile)', async () => {
        default_mock_store.modules.trade.is_market_closed = true;
        mockedPayoutPerPointInfo();

        await userEvent.click(screen.getByText(label));

        expect(screen.queryByText('Got it')).not.toBeInTheDocument();
    });

    it('renders TooltipPortal on desktop without ActionSheet', () => {
        (useDevice as jest.Mock).mockReturnValue({ isDesktop: true });
        mockedPayoutPerPointInfo();

        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText('123 USD')).toBeInTheDocument();
    });
});
