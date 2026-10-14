import { act, renderHook } from '@testing-library/react-hooks';

import useTabletLandscape from '../useTabletLandscape';

const mockUseDevice = jest.fn(() => ({ isTabletPortrait: false }));

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: () => mockUseDevice(),
}));

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    isTabletOs: true,
}));

describe('useTabletLandscape', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockUseDevice.mockReturnValue({ isTabletPortrait: false });
        document.documentElement.classList.remove('tablet-landscape');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return should_show_portrait_loader as false when not on tablet portrait', () => {
        const { result } = renderHook(() => useTabletLandscape());

        expect(result.current.should_show_portrait_loader).toBe(false);
    });

    it('should set should_show_portrait_loader to true when on tablet portrait', () => {
        mockUseDevice.mockReturnValue({ isTabletPortrait: true });

        const { result } = renderHook(() => useTabletLandscape());

        expect(result.current.should_show_portrait_loader).toBe(true);
    });

    it('should add tablet-landscape class to html after 500ms', () => {
        mockUseDevice.mockReturnValue({ isTabletPortrait: true });

        renderHook(() => useTabletLandscape());

        expect(document.documentElement).not.toHaveClass('tablet-landscape');

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(document.documentElement).toHaveClass('tablet-landscape');
    });

    it('should hide loader after 1100ms total', () => {
        mockUseDevice.mockReturnValue({ isTabletPortrait: true });

        const { result } = renderHook(() => useTabletLandscape());

        expect(result.current.should_show_portrait_loader).toBe(true);

        act(() => {
            jest.advanceTimersByTime(1100);
        });

        expect(result.current.should_show_portrait_loader).toBe(false);
    });

    it('should not add tablet-landscape class while chart is loading', () => {
        mockUseDevice.mockReturnValue({ isTabletPortrait: true });

        const { result } = renderHook(() => useTabletLandscape({ is_chart_loading: true }));

        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(document.documentElement).not.toHaveClass('tablet-landscape');
        expect(result.current.should_show_portrait_loader).toBe(true);
    });

    it('should not add tablet-landscape class while active symbols are loading', () => {
        mockUseDevice.mockReturnValue({ isTabletPortrait: true });

        const { result } = renderHook(() => useTabletLandscape({ should_show_active_symbols_loading: true }));

        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(document.documentElement).not.toHaveClass('tablet-landscape');
        expect(result.current.should_show_portrait_loader).toBe(true);
    });

    it('should remove tablet-landscape class on unmount', () => {
        mockUseDevice.mockReturnValue({ isTabletPortrait: true });

        const { unmount } = renderHook(() => useTabletLandscape());

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(document.documentElement).toHaveClass('tablet-landscape');

        unmount();

        expect(document.documentElement).not.toHaveClass('tablet-landscape');
    });
});
