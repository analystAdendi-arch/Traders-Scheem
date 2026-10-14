import { render, screen } from '@testing-library/react';

import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';

import VideoPreview from '../video-preview';

const mock_props = { contract_type: CONTRACT_LIST.ACCUMULATORS, toggleVideoPlayer: jest.fn(), video_src: '' };

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: () => ({ isDesktop: false }),
}));

describe('VideoPreview', () => {
    it('should render component', () => {
        render(<VideoPreview {...mock_props} />);

        expect(screen.getByText(/Watch this video to learn about this trade type/i)).toBeInTheDocument();
    });
});
