import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import OnboardingVideo from '../onboarding-video';

const dt_video = 'dt_onboarding_guide_video';
const dt_loader = 'square-skeleton';

jest.mock('AppV2/Components/StreamIframe', () => jest.fn(() => <div data-testid={dt_video}>StreamIframe</div>));

jest.mock('AppV2/Utils/video-config', () => ({
    getOnboardingVideoId: jest.fn(() => 'mock_video_id_123'),
}));

jest.mock('@deriv/stores', () => ({
    useStore: jest.fn(() => ({
        ui: {
            is_dark_mode_on: false,
        },
    })),
}));

describe('OnboardingVideo', () => {
    beforeAll(() => {
        HTMLVideoElement.prototype.load = jest.fn();
        HTMLVideoElement.prototype.play = jest.fn();
    });

    it('should render StreamIframe component', () => {
        render(<OnboardingVideo type='trade_page' />);

        expect(screen.getByTestId(dt_video)).toBeInTheDocument();
        expect(screen.getByText('StreamIframe')).toBeInTheDocument();
    });

    it('should render StreamIframe for positions page', () => {
        render(<OnboardingVideo type='positions_page' />);

        expect(screen.getByTestId(dt_video)).toBeInTheDocument();
    });
});
