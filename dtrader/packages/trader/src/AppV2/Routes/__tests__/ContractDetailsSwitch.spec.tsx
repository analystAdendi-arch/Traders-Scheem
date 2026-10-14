import React from 'react';

import { useDevice } from '@deriv-com/ui';
import { render, screen } from '@testing-library/react';

import ContractDetailsSwitch from '../ContractDetailsSwitch';

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(),
}));

jest.mock('Modules/Contract', () => {
    const V1Contract = () => <div data-testid='v1-contract'>V1 Contract Details</div>;
    V1Contract.displayName = 'V1Contract';
    return { __esModule: true, default: V1Contract };
});

jest.mock('AppV2/Containers/ContractDetails', () => {
    const V2ContractDetails = () => <div data-testid='v2-contract'>V2 Contract Details</div>;
    V2ContractDetails.displayName = 'V2ContractDetails';
    return { __esModule: true, default: V2ContractDetails };
});

describe('ContractDetailsSwitch', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render V2 ContractDetails on mobile', async () => {
        (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        render(<ContractDetailsSwitch />);
        expect(await screen.findByTestId('v2-contract')).toBeInTheDocument();
    });

    it('should render V1 Contract on desktop', async () => {
        (useDevice as jest.Mock).mockReturnValue({ isMobile: false });
        render(<ContractDetailsSwitch />);
        expect(await screen.findByTestId('v1-contract')).toBeInTheDocument();
    });

    it('should not render V1 Contract on mobile', async () => {
        (useDevice as jest.Mock).mockReturnValue({ isMobile: true });
        render(<ContractDetailsSwitch />);
        await screen.findByTestId('v2-contract');
        expect(screen.queryByTestId('v1-contract')).not.toBeInTheDocument();
    });

    it('should not render V2 ContractDetails on desktop', async () => {
        (useDevice as jest.Mock).mockReturnValue({ isMobile: false });
        render(<ContractDetailsSwitch />);
        await screen.findByTestId('v1-contract');
        expect(screen.queryByTestId('v2-contract')).not.toBeInTheDocument();
    });
});
