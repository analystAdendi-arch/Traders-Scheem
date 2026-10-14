import { mockStore } from '@deriv/stores';
import { render, screen } from '@testing-library/react';

import ModulesProvider from 'Stores/Providers/modules-providers';

import TraderProviders from '../../../../../trader-providers';
import MultipliersInformation from '../multipliers-information';

const stop_out_label = 'Stop out';
const commission_label = 'Commission';

describe('MultipliersInformation', () => {
    let default_mock_store: ReturnType<typeof mockStore>;

    beforeEach(
        () =>
            (default_mock_store = mockStore({
                modules: {
                    trade: {
                        currency: 'USD',
                        is_market_closed: false,
                        proposal_info: {
                            MULTUP: {
                                commission: 0.5,
                                limit_order: {
                                    stop_out: {
                                        order_amount: -10.5,
                                    },
                                },
                            },
                            MULTDOWN: {
                                commission: 0.5,
                                limit_order: {
                                    stop_out: {
                                        order_amount: -10.5,
                                    },
                                },
                            },
                        },
                    },
                },
            }))
    );

    const mockMultipliersInformation = () =>
        render(
            <TraderProviders store={default_mock_store}>
                <ModulesProvider store={default_mock_store}>
                    <MultipliersInformation />
                </ModulesProvider>
            </TraderProviders>
        );

    it('does not render if there is an API error in MULTUP', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                has_error: true,
            },
        };
        const { container } = mockMultipliersInformation();

        expect(container).toBeEmptyDOMElement();
    });

    it('does not render if there is an API error in MULTDOWN', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTDOWN: {
                has_error: true,
            },
        };
        const { container } = mockMultipliersInformation();

        expect(container).toBeEmptyDOMElement();
    });

    it('does not render if there is an API error in both MULTUP and MULTDOWN', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                has_error: true,
            },
            MULTDOWN: {
                has_error: true,
            },
        };
        const { container } = mockMultipliersInformation();

        expect(container).toBeEmptyDOMElement();
    });

    it('renders skeleton for stop out if stop_out is undefined but there is no API error', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {},
            MULTDOWN: {},
        };
        mockMultipliersInformation();

        expect(screen.getByText(stop_out_label)).toBeInTheDocument();
        expect(screen.getAllByTestId('dt_skeleton')).toHaveLength(2);
    });

    it('renders skeleton for commission if commission is undefined but there is no API error', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                limit_order: {
                    stop_out: {
                        order_amount: -10.5,
                    },
                },
            },
        };
        mockMultipliersInformation();

        expect(screen.getByText(commission_label)).toBeInTheDocument();
        expect(screen.getByTestId('dt_skeleton')).toBeInTheDocument();
    });

    it('renders stop out and commission with correct values from MULTUP', () => {
        mockMultipliersInformation();

        expect(screen.getByText(stop_out_label)).toBeInTheDocument();
        expect(screen.getByText(commission_label)).toBeInTheDocument();
        expect(screen.getByText('10.50 USD')).toBeInTheDocument();
        expect(screen.getByText('0.50 USD')).toBeInTheDocument();
    });

    it('uses absolute value for negative stop out amount', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                commission: 0.5,
                limit_order: {
                    stop_out: {
                        order_amount: -25.75,
                    },
                },
            },
        };
        mockMultipliersInformation();

        expect(screen.getByText('25.75 USD')).toBeInTheDocument();
    });

    it('falls back to MULTDOWN values if MULTUP is not available', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTDOWN: {
                commission: 1.25,
                limit_order: {
                    stop_out: {
                        order_amount: -15.0,
                    },
                },
            },
        };
        mockMultipliersInformation();

        expect(screen.getByText('15.00 USD')).toBeInTheDocument();
        expect(screen.getByText('1.25 USD')).toBeInTheDocument();
    });

    it('prefers MULTUP values over MULTDOWN when both are available', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                commission: 0.5,
                limit_order: {
                    stop_out: {
                        order_amount: -10.5,
                    },
                },
            },
            MULTDOWN: {
                commission: 1.5,
                limit_order: {
                    stop_out: {
                        order_amount: -20.5,
                    },
                },
            },
        };
        mockMultipliersInformation();

        expect(screen.getByText('10.50 USD')).toBeInTheDocument();
        expect(screen.getByText('0.50 USD')).toBeInTheDocument();
    });

    it('applies disabled class when market is closed', () => {
        default_mock_store.modules.trade.is_market_closed = true;
        mockMultipliersInformation();

        expect(screen.getByText(stop_out_label)).toHaveClass('trade-params__text--disabled');
        expect(screen.getByText(commission_label)).toHaveClass('trade-params__text--disabled');
    });

    it('does not apply disabled class when market is open', () => {
        mockMultipliersInformation();

        expect(screen.getByText(stop_out_label)).not.toHaveClass('trade-params__text--disabled');
        expect(screen.getByText(commission_label)).not.toHaveClass('trade-params__text--disabled');
    });

    it('renders with different currency', () => {
        default_mock_store.modules.trade.currency = 'EUR';
        mockMultipliersInformation();

        expect(screen.getByText('10.50 EUR')).toBeInTheDocument();
        expect(screen.getByText('0.50 EUR')).toBeInTheDocument();
    });

    it('handles zero commission value', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                commission: 0,
                limit_order: {
                    stop_out: {
                        order_amount: -10.5,
                    },
                },
            },
        };
        mockMultipliersInformation();

        expect(screen.getByText('0.00 USD')).toBeInTheDocument();
    });

    it('handles zero stop out value', () => {
        default_mock_store.modules.trade.proposal_info = {
            MULTUP: {
                commission: 0.5,
                limit_order: {
                    stop_out: {
                        order_amount: 0,
                    },
                },
            },
        };
        mockMultipliersInformation();

        expect(screen.getByText('0.00 USD')).toBeInTheDocument();
    });

    // [AI]
    it('renders commission row with collapsible class', () => {
        mockMultipliersInformation();
        const commissionText = screen.getByText(commission_label);
        const commissionValue = screen.getByText('0.50 USD');

        expect(commissionText).toBeInTheDocument();
        expect(commissionValue).toBeInTheDocument();
    });
});
// [/AI]
