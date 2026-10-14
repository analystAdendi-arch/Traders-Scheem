import React from 'react';

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OnboardingGuide from '../onboarding-guide';

const trading_modal_text = 'Welcome to Deriv Trader';
const positions_modal_text = 'View your positions';
const guide_container = 'GuideContainer';
const localStorage_key = 'guide_dtrader_v2';

jest.mock('../guide-container', () =>
    jest.fn(({ should_run }: { should_run?: boolean }) => <div>{should_run && guide_container}</div>)
);
jest.mock('../onboarding-video', () => jest.fn(() => <div>OnboardingVideo</div>));
jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(() => ({ isMobile: true, isDesktop: false, isTablet: false })),
}));

describe('OnboardingGuide', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should render Modal with correct content for trading page after 800ms after mounting', async () => {
        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            expect(screen.getByText(trading_modal_text)).toBeInTheDocument();
            expect(screen.getByText("Let's begin")).toBeInTheDocument();
        });

        jest.useRealTimers();
    });

    it('should render Modal with correct content for positions page after 800ms after mounting', async () => {
        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide type='positions_page' />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            expect(screen.getByText('OnboardingVideo')).toBeInTheDocument();
            expect(screen.getByText(positions_modal_text)).toBeInTheDocument();
            expect(screen.getByText('Got it')).toBeInTheDocument();
        });

        jest.useRealTimers();
    });

    it('should close the Modal for trading page and start the guide after user clicks on "Let\'s begin" button', async () => {
        const user = userEvent.setup({ delay: null });
        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            expect(screen.getByText(trading_modal_text)).toBeInTheDocument();
        });

        expect(screen.queryByText(guide_container)).not.toBeInTheDocument();

        jest.useRealTimers();
        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.queryByText(trading_modal_text)).not.toBeInTheDocument();
            expect(screen.getByText(guide_container)).toBeInTheDocument();
        });
    });

    it('should close the Modal for positions page, set flag to localStorage equal to true and do NOT start the guide after user clicks on "Got it" button', async () => {
        const user = userEvent.setup({ delay: null });
        const field = 'positions_page';
        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide type='positions_page' />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            expect(screen.getByText(positions_modal_text)).toBeInTheDocument();
        });

        expect(screen.queryByText(guide_container)).not.toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem(localStorage_key) as string)[field]).toBe(false);

        jest.useRealTimers();
        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.queryByText(positions_modal_text)).not.toBeInTheDocument();
            expect(screen.queryByText(guide_container)).not.toBeInTheDocument();
        });

        expect(JSON.parse(localStorage.getItem(localStorage_key) as string)[field]).toBe(true);
    });

    it('should close the Modal for trading page and set flag to localStorage equal to true if user clicks on overlay and do NOT start the guide', async () => {
        const user = userEvent.setup({ delay: null });
        const field = 'trade_page';
        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            expect(screen.getByText(trading_modal_text)).toBeInTheDocument();
        });

        expect(screen.queryByText(guide_container)).not.toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem(localStorage_key) as string)[field]).toBe(false);

        jest.useRealTimers();
        await user.click(screen.getByTestId('dt-actionsheet-overlay'));

        await waitFor(() => {
            expect(screen.queryByText(trading_modal_text)).not.toBeInTheDocument();
            expect(screen.queryByText(guide_container)).not.toBeInTheDocument();
        });

        expect(JSON.parse(localStorage.getItem(localStorage_key) as string)[field]).toBe(true);
    });

    it('should execute callback function after Modal is closed', async () => {
        const user = userEvent.setup({ delay: null });
        const callback = jest.fn();
        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide callback={callback} type='positions_page' />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            expect(screen.getByText(positions_modal_text)).toBeInTheDocument();
        });

        expect(screen.queryByText(guide_container)).not.toBeInTheDocument();

        jest.useRealTimers();
        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(callback).toBeCalled();
        });
    });

    it('should show partial guide for returning users who completed main onboarding', async () => {
        // Set up localStorage as a returning user who completed main onboarding
        localStorage.setItem(
            localStorage_key,
            JSON.stringify({
                trade_types_selection: true,
                trade_page: true,
                positions_page: false,
            })
        );
        localStorage.setItem('trade_param_guide', 'false');

        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide type='trade_page' />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        await waitFor(() => {
            // Should show guide container directly without modal
            expect(screen.getByText(guide_container)).toBeInTheDocument();
            expect(screen.queryByText(trading_modal_text)).not.toBeInTheDocument();
        });

        jest.useRealTimers();
    });

    it('should not show partial guide if already seen by user', async () => {
        // Set up localStorage as a returning user who completed main onboarding AND partial guide
        localStorage.setItem(
            localStorage_key,
            JSON.stringify({
                trade_types_selection: true,
                trade_page: true,
                positions_page: false,
            })
        );
        localStorage.setItem('trade_param_guide', 'true');

        jest.useFakeTimers({ legacyFakeTimers: true });
        render(<OnboardingGuide type='trade_page' />);

        act(() => {
            jest.advanceTimersByTime(800);
        });

        // Should not show any guides
        expect(screen.queryByText(guide_container)).not.toBeInTheDocument();
        expect(screen.queryByText(trading_modal_text)).not.toBeInTheDocument();

        jest.useRealTimers();
    });
});
