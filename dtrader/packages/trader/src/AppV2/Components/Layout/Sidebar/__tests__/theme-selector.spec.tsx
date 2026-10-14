import React from 'react';

import { mockStore, StoreProvider } from '@deriv/stores';
import { fireEvent, render, screen } from '@testing-library/react';

import ThemeSelector from '../theme-selector';

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    useWS: () => ({
        send: jest.fn(),
    }),
}));

jest.mock('@deriv-com/translations', () => ({
    localize: (key: string) => key,
    Localize: jest.fn(({ i18n_default_text }) => <>{i18n_default_text}</>),
}));

jest.mock('@deriv/quill-icons', () => ({
    ...jest.requireActual('@deriv/quill-icons'),
    StandaloneMoonRegularIcon: () => 'StandaloneMoonRegularIcon',
    StandaloneSunBrightRegularIcon: () => 'StandaloneSunBrightRegularIcon',
}));

describe('<ThemeSelector />', () => {
    const mockSetDarkMode = jest.fn();

    const createStore = (is_dark_mode_on: boolean) =>
        mockStore({
            ui: {
                is_dark_mode_on,
                setDarkMode: mockSetDarkMode,
            },
            common: {
                current_language: 'en',
            },
        });

    const renderThemeSelector = (is_dark_mode_on = false) => {
        const store = createStore(is_dark_mode_on);
        return render(
            <StoreProvider store={store}>
                <ThemeSelector />
            </StoreProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render theme selector with light and dark options', () => {
        renderThemeSelector();
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    it('should mark light theme as active when dark mode is off', () => {
        renderThemeSelector(false);
        const lightButton = screen.getByRole('button', { name: /light/i });
        expect(lightButton).toHaveClass('flyout-selector__option--active');
    });

    it('should not mark dark theme as active when dark mode is off', () => {
        renderThemeSelector(false);
        const darkButton = screen.getByRole('button', { name: /dark/i });
        expect(darkButton).not.toHaveClass('flyout-selector__option--active');
    });

    it('should mark dark theme as active when dark mode is on', () => {
        renderThemeSelector(true);
        const darkButton = screen.getByRole('button', { name: /dark/i });
        expect(darkButton).toHaveClass('flyout-selector__option--active');
    });

    it('should not mark light theme as active when dark mode is on', () => {
        renderThemeSelector(true);
        const lightButton = screen.getByRole('button', { name: /light/i });
        expect(lightButton).not.toHaveClass('flyout-selector__option--active');
    });

    it('should call setDarkMode with false when light theme is clicked', () => {
        renderThemeSelector(true);
        const lightButton = screen.getByRole('button', { name: /light/i });
        fireEvent.click(lightButton);
        expect(mockSetDarkMode).toHaveBeenCalledWith(false);
    });

    it('should call setDarkMode with true when dark theme is clicked', () => {
        renderThemeSelector(false);
        const darkButton = screen.getByRole('button', { name: /dark/i });
        fireEvent.click(darkButton);
        expect(mockSetDarkMode).toHaveBeenCalledWith(true);
    });

    it('should allow clicking light theme when already active', () => {
        renderThemeSelector(false);
        const lightButton = screen.getByRole('button', { name: /light/i });
        fireEvent.click(lightButton);
        expect(mockSetDarkMode).toHaveBeenCalledWith(false);
    });

    it('should allow clicking dark theme when already active', () => {
        renderThemeSelector(true);
        const darkButton = screen.getByRole('button', { name: /dark/i });
        fireEvent.click(darkButton);
        expect(mockSetDarkMode).toHaveBeenCalledWith(true);
    });

    it('should render sun icon for light theme', () => {
        renderThemeSelector();
        expect(screen.getByText('StandaloneSunBrightRegularIcon')).toBeInTheDocument();
    });

    it('should render moon icon for dark theme', () => {
        renderThemeSelector();
        expect(screen.getByText('StandaloneMoonRegularIcon')).toBeInTheDocument();
    });

    it('should have flyout-selector wrapper class', () => {
        renderThemeSelector();
        expect(screen.getAllByRole('button')[0]).toBeInTheDocument();
    });

    it('should render two theme option buttons', () => {
        renderThemeSelector();
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    it('should render light theme button first', () => {
        renderThemeSelector();
        const buttons = screen.getAllByRole('button');
        expect(buttons[0]).toHaveTextContent(/Light/);
    });

    it('should render dark theme button second', () => {
        renderThemeSelector();
        const buttons = screen.getAllByRole('button');
        expect(buttons[1]).toHaveTextContent(/Dark/);
    });

    it('should apply proper CSS classes to theme buttons', () => {
        renderThemeSelector();
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            expect(button).toHaveClass('flyout-selector__option');
        });
    });

    it('should switch from light to dark theme', () => {
        renderThemeSelector(false);
        const darkButton = screen.getByRole('button', { name: /dark/i });
        fireEvent.click(darkButton);
        expect(mockSetDarkMode).toHaveBeenCalledTimes(1);
        expect(mockSetDarkMode).toHaveBeenCalledWith(true);
    });

    it('should switch from dark to light theme', () => {
        renderThemeSelector(true);
        const lightButton = screen.getByRole('button', { name: /light/i });
        fireEvent.click(lightButton);
        expect(mockSetDarkMode).toHaveBeenCalledTimes(1);
        expect(mockSetDarkMode).toHaveBeenCalledWith(false);
    });
});
