import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccumulatorsStatsManualModal } from '../accumulators-stats-manual-modal';

jest.mock('AppV2/Components/StreamIframe', () =>
    jest.fn(() => <div data-testid='dt_accumulators_stats_manual_video'>StreamIframe</div>)
);

jest.mock('AppV2/Utils/video-config', () => ({
    getAccumulatorManualVideoId: jest.fn(() => 'mock_accumulator_video_id'),
}));

jest.mock('@deriv/components', () => {
    const MockModalBody = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    MockModalBody.displayName = 'MockModalBody';

    const MockModal = ({ children, is_open, title }: { children: React.ReactNode; is_open: boolean; title: string }) =>
        is_open ? (
            <div>
                <h1>{title}</h1>
                {children}
            </div>
        ) : null;

    MockModal.displayName = 'MockModal';
    MockModal.Body = MockModalBody;

    const MockText = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    MockText.displayName = 'MockText';

    return {
        ...jest.requireActual('@deriv/components'),
        Modal: MockModal,
        Text: MockText,
    };
});

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    isMobile: jest.fn(() => false),
}));

const default_mocked_props = {
    icon_classname: 'info',
    is_dark_theme: false,
    is_manual_open: false,
    title: 'Stats',
    toggleManual: jest.fn(),
};

describe('<AccumulatorsStatsManualModal />', () => {
    it('should render icon', () => {
        render(<AccumulatorsStatsManualModal {...default_mocked_props} />);
        expect(screen.getByTestId('dt_ic_info_icon')).toBeInTheDocument();
    });

    it('should render modal with StreamIframe when is_manual_open is true', () => {
        render(<AccumulatorsStatsManualModal {...default_mocked_props} is_manual_open />);

        expect(screen.getByRole('heading', { name: 'Stats' })).toBeInTheDocument();
        expect(screen.getByTestId('dt_accumulators_stats_manual_video')).toBeInTheDocument();
        expect(screen.getByText(/stats show the history of consecutive tick counts/i)).toBeInTheDocument();
    });

    it('should call toggleManual when icon is clicked', async () => {
        render(<AccumulatorsStatsManualModal {...default_mocked_props} />);
        const icon = screen.getByTestId('dt_ic_info_icon');
        await userEvent.click(icon);
        expect(default_mocked_props.toggleManual).toHaveBeenCalled();
    });
});
