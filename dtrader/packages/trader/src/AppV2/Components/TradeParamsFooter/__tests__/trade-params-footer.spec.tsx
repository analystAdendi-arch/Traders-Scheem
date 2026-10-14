import React from 'react';

import { render, screen } from '@testing-library/react';

import TradeParamsFooter from '../trade-params-footer';

jest.mock('@deriv/core/src/App/Components/Layout/Footer/network-status', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid='network-status'>Network Status</div>),
}));

jest.mock('../date-time', () => ({
    __esModule: true,
    default: jest.fn(() => (
        <div data-testid='date-time'>
            <div className='trade-params-footer__date'>01 Jan 2024</div>
            <div className='trade-params-footer__time'>12:00:00 GMT</div>
        </div>
    )),
}));

jest.mock('../toggle-fullscreen', () => ({
    __esModule: true,
    default: jest.fn(() => <button data-testid='toggle-fullscreen'>Toggle Fullscreen</button>),
}));

describe('TradeParamsFooter', () => {
    it('should render all footer components', () => {
        render(<TradeParamsFooter />);

        expect(screen.getByTestId('network-status')).toBeInTheDocument();
        expect(screen.getByTestId('date-time')).toBeInTheDocument();
        expect(screen.getByTestId('toggle-fullscreen')).toBeInTheDocument();
    });

    it('should have the correct class name', () => {
        const { container } = render(<TradeParamsFooter />);

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        const footerElement = container.querySelector('.trade-params-footer');
        expect(footerElement).toBeInTheDocument();
    });

    it('should render NetworkStatus component', () => {
        render(<TradeParamsFooter />);

        const networkStatus = screen.getByTestId('network-status');
        expect(networkStatus).toBeInTheDocument();
        expect(networkStatus).toHaveTextContent('Network Status');
    });

    it('should render DateTime component', () => {
        render(<TradeParamsFooter />);

        const dateTime = screen.getByTestId('date-time');
        expect(dateTime).toBeInTheDocument();
    });

    it('should render ToggleFullScreen component with popover enabled', () => {
        render(<TradeParamsFooter />);

        const toggleFullscreen = screen.getByTestId('toggle-fullscreen');
        expect(toggleFullscreen).toBeInTheDocument();
    });

    it('should render components in the correct order', () => {
        const { container } = render(<TradeParamsFooter />);

        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        const footerElement = container.querySelector('.trade-params-footer');
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        const children = footerElement?.children;

        expect(children).toHaveLength(3);
        expect(children?.[0]).toHaveAttribute('data-testid', 'network-status');
        expect(children?.[1]).toHaveAttribute('data-testid', 'date-time');
        expect(children?.[2]).toHaveAttribute('data-testid', 'toggle-fullscreen');
    });
});
