import { render, waitFor } from '@testing-library/react';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import TradeDescription from '../trade-description';

jest.mock('../ContractDescription/accumulators-trade-description', () =>
    jest.fn(() => 'mockAccumulatorTradeDescription')
);
jest.mock('../ContractDescription/even-odd-trade-description', () => jest.fn(() => 'mockEvenOddTradeDescription'));
jest.mock('../ContractDescription/higher-lower-trade-description', () =>
    jest.fn(() => 'mockHigherLowerTradeDescription')
);
jest.mock('../ContractDescription/matches-differs-trade-description', () =>
    jest.fn(() => 'mockMatchesDiffersTradeDescription')
);
jest.mock('../ContractDescription/multipliers-trade-description', () =>
    jest.fn(() => 'mockMultipliersTradeDescription')
);
jest.mock('../ContractDescription/over-under-trade-description', () => jest.fn(() => 'mockOverUnderTradeDescription'));
jest.mock('../ContractDescription/rise-fall-trade-description', () => jest.fn(() => 'mockRiseFallTradeDescription'));
jest.mock('../ContractDescription/touch-no-touch-trade-description', () => jest.fn(() => 'mockTouchTradeDescription'));
jest.mock('../ContractDescription/turbos-trade-description', () => jest.fn(() => 'mockTurbosTradeDescription'));
jest.mock('../ContractDescription/vanillas-trade-description', () => jest.fn(() => 'mockVanillasTradeDescription'));

describe('TradeDescription', () => {
    it('should render mockAccumulatorTradeDescription when trade category is "CONTRACT_LIST.ACCUMULATORS"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.ACCUMULATORS} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockAccumulatorTradeDescription');
        });
    });

    it('should render mockEvenOddTradeDescription when trade category is "CONTRACT_LIST.EVEN_ODD"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.EVEN_ODD} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockEvenOddTradeDescription');
        });
    });

    it('should render mockHigherLowerTradeDescription when trade category is "CONTRACT_LIST.HIGHER_LOWER"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.HIGHER_LOWER} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockHigherLowerTradeDescription');
        });
    });

    it('should render mockMatchesDiffersTradeDescription when trade category is "CONTRACT_LIST.MATCHES_DIFFERS"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.MATCHES_DIFFERS} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockMatchesDiffersTradeDescription');
        });
    });

    it('should render mockMultipliersTradeDescription when trade category is "CONTRACT_LIST.MULTIPLIERS"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.MULTIPLIERS} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockMultipliersTradeDescription');
        });
    });

    it('should render mockOverUnderTradeDescription when trade category is "CONTRACT_LIST.OVER_UNDER"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.OVER_UNDER} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockOverUnderTradeDescription');
        });
    });

    it('should render mockRiseFallTradeDescription when trade category is "CONTRACT_LIST.RISE_FALL"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.RISE_FALL} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockRiseFallTradeDescription');
        });
    });

    it('should render mockTouchTradeDescription when trade category is "CONTRACT_LIST.TOUCH_NO_TOUCH"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.TOUCH_NO_TOUCH} onTermClick={jest.fn()} />
        );
        await waitFor(() => {
            expect(container).toHaveTextContent('mockTouchTradeDescription');
        });
    });

    it('should render mockTurbosTradeDescription when trade category is "CONTRACT_LIST.TURBOS"', async () => {
        const { container } = render(<TradeDescription contract_type={CONTRACT_LIST.TURBOS} onTermClick={jest.fn()} />);
        await waitFor(() => {
            expect(container).toHaveTextContent('mockTurbosTradeDescription');
        });
    });

    it('should render mockVanillasTradeDescription when trade category is "CONTRACT_LIST.VANILLAS"', async () => {
        const { container } = render(
            <TradeDescription contract_type={CONTRACT_LIST.VANILLAS} onTermClick={jest.fn()} />
        );

        // Wait for the component to be rendered
        await waitFor(() => {
            // Check if the text content of the container includes the mock text
            expect(container).toHaveTextContent('mockVanillasTradeDescription');
        });
    });

    it('should render "description is not found" when contract_type was not passed', async () => {
        const { container } = render(<TradeDescription contract_type='some_trade_type' onTermClick={jest.fn()} />);
        await waitFor(() => {
            expect(container).toHaveTextContent('Description not found.');
        });
    });
});
