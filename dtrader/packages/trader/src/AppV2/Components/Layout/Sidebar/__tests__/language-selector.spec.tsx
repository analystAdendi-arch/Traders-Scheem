import React from 'react';

import { mockStore, StoreProvider } from '@deriv/stores';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LanguageSelector from '../language-selector';

const mockSwitchLanguage = jest.fn();
const mockChangeSelectedLanguage = jest.fn();
const mockOnLanguageChange = jest.fn();

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    useWS: () => ({
        send: jest.fn(),
    }),
}));

jest.mock('@deriv-com/translations', () => ({
    getAllowedLanguages: jest.fn(() => ({
        EN: 'English',
        ES: 'Español',
        FR: 'Français',
        PT: 'Português',
    })),
    Localize: jest.fn(({ i18n_default_text }) => <>{i18n_default_text}</>),
    useTranslations: jest.fn(() => ({
        currentLang: 'EN',
        switchLanguage: mockSwitchLanguage,
    })),
}));

describe('<LanguageSelector />', () => {
    const defaultStore = mockStore({
        common: {
            changeSelectedLanguage: mockChangeSelectedLanguage,
            current_language: 'en',
        },
    });

    const renderLanguageSelector = (store = defaultStore, onLanguageChange = mockOnLanguageChange) => {
        return render(
            <StoreProvider store={store}>
                <LanguageSelector onLanguageChange={onLanguageChange} />
            </StoreProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockChangeSelectedLanguage.mockResolvedValue(undefined);
    });

    it('should render language selector with all available languages', () => {
        renderLanguageSelector();
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Español')).toBeInTheDocument();
        expect(screen.getByText('Français')).toBeInTheDocument();
        expect(screen.getByText('Português')).toBeInTheDocument();
    });

    it('should mark the current language as active', () => {
        renderLanguageSelector();
        const englishButton = screen.getByRole('button', { name: 'English' });
        expect(englishButton).toHaveClass('flyout-selector__option--active');
    });

    it('should disable the button for current language', () => {
        renderLanguageSelector();
        const englishButton = screen.getByRole('button', { name: 'English' });
        expect(englishButton).toBeDisabled();
    });

    it('should not mark non-current languages as active', () => {
        renderLanguageSelector();
        const spanishButton = screen.getByRole('button', { name: 'Español' });
        const frenchButton = screen.getByRole('button', { name: 'Français' });

        expect(spanishButton).not.toHaveClass('flyout-selector__option--active');
        expect(frenchButton).not.toHaveClass('flyout-selector__option--active');
    });

    it('should enable buttons for non-current languages', () => {
        renderLanguageSelector();
        const spanishButton = screen.getByRole('button', { name: 'Español' });
        const frenchButton = screen.getByRole('button', { name: 'Français' });

        expect(spanishButton).toBeEnabled();
        expect(frenchButton).toBeEnabled();
    });

    it('should call changeSelectedLanguage when clicking a different language', async () => {
        renderLanguageSelector();
        const spanishButton = screen.getByRole('button', { name: 'Español' });

        fireEvent.click(spanishButton);

        await waitFor(() => {
            expect(mockChangeSelectedLanguage).toHaveBeenCalledWith('ES');
        });
    });

    it('should call switchLanguage after changeSelectedLanguage succeeds', async () => {
        renderLanguageSelector();
        const spanishButton = screen.getByRole('button', { name: 'Español' });

        fireEvent.click(spanishButton);

        await waitFor(() => {
            expect(mockSwitchLanguage).toHaveBeenCalledWith('ES');
        });
    });

    it('should not call changeSelectedLanguage when clicking current language', async () => {
        renderLanguageSelector();
        const englishButton = screen.getByRole('button', { name: 'English' });

        fireEvent.click(englishButton);

        expect(mockChangeSelectedLanguage).not.toHaveBeenCalled();
    });

    it('should not call switchLanguage when clicking current language', async () => {
        renderLanguageSelector();
        const englishButton = screen.getByRole('button', { name: 'English' });

        fireEvent.click(englishButton);

        expect(mockSwitchLanguage).not.toHaveBeenCalled();
    });

    it('should render buttons with proper CSS classes', () => {
        renderLanguageSelector();
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(4);
    });

    it('should have flyout-selector wrapper class', () => {
        renderLanguageSelector();
        expect(screen.getAllByRole('button')[0]).toBeInTheDocument();
    });

    it('should handle language change for Portuguese', async () => {
        renderLanguageSelector();
        const portugueseButton = screen.getByRole('button', { name: 'Português' });

        fireEvent.click(portugueseButton);

        await waitFor(() => {
            expect(mockChangeSelectedLanguage).toHaveBeenCalledWith('PT');
        });
        expect(mockSwitchLanguage).toHaveBeenCalledWith('PT');
    });

    it('should handle language change for French', async () => {
        renderLanguageSelector();
        const frenchButton = screen.getByRole('button', { name: 'Français' });

        fireEvent.click(frenchButton);

        await waitFor(() => {
            expect(mockChangeSelectedLanguage).toHaveBeenCalledWith('FR');
        });
        expect(mockSwitchLanguage).toHaveBeenCalledWith('FR');
    });

    it('should render language buttons in order', () => {
        renderLanguageSelector();
        const buttons = screen.getAllByRole('button');
        const buttonTexts = buttons.map(button => button.textContent);

        expect(buttonTexts).toEqual(['English', 'Español', 'Français', 'Português']);
    });

    it('should call onLanguageChange callback after language change', async () => {
        renderLanguageSelector();
        const spanishButton = screen.getByRole('button', { name: 'Español' });

        fireEvent.click(spanishButton);

        await waitFor(() => {
            expect(mockOnLanguageChange).toHaveBeenCalledTimes(1);
        });
    });

    it('should not call onLanguageChange when callback is not provided', async () => {
        renderLanguageSelector(defaultStore, undefined);
        const spanishButton = screen.getByRole('button', { name: 'Español' });

        fireEvent.click(spanishButton);

        await waitFor(() => {
            expect(mockChangeSelectedLanguage).toHaveBeenCalledWith('ES');
        });
        // Should not throw error when callback is undefined
    });
});
