import * as shared from '@deriv/shared';
import { render, screen } from '@testing-library/react';

import FullscreenError from '../fullscreen-error';

jest.mock('@deriv/shared', () => ({
    ...jest.requireActual('@deriv/shared'),
    getBrandHomeUrl: jest.fn(() => 'https://deriv.com/home'),
}));

describe('<FullscreenError />', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the fullscreen error component', () => {
        render(<FullscreenError />);

        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
    });

    it('should display default error message when no custom message provided', () => {
        render(<FullscreenError />);

        expect(screen.getByText(/We're sorry for the disruption. Refreshing the page may help./i)).toBeInTheDocument();
    });

    it('should display custom error message when provided', () => {
        const customMessage = 'Custom error message from backend';
        render(<FullscreenError error_message={customMessage} />);

        expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should have fullscreen error container with correct class', () => {
        render(<FullscreenError />);

        // Verify fullscreen error is rendered by checking for key elements
        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
    });

    it('should render TriangleWarningIcon', () => {
        render(<FullscreenError />);

        // Verify icon is rendered by checking the title text above it
        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should navigate to brand home URL when Back to Home button is clicked', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).location;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.location = { href: '' } as any;

        render(<FullscreenError />);

        const button = screen.getByRole('button', { name: /Back to Home/i });
        button.click();

        expect(shared.getBrandHomeUrl).toHaveBeenCalled();
        expect(window.location.href).toBe('https://deriv.com/home');
    });

    it('should have proper ARIA attributes for accessibility', () => {
        render(<FullscreenError />);

        const title = screen.getByText(/An unexpected error occurred/i);
        const description = screen.getByText(/We're sorry for the disruption/i);

        expect(title).toHaveAttribute('id', 'fullscreen-error-title');
        expect(description).toHaveAttribute('id', 'fullscreen-error-description');
    });

    it('should render Back to Home button', () => {
        render(<FullscreenError />);

        const button = screen.getByRole('button', { name: /Back to Home/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('dc-btn');
    });

    it('should render content and button containers', () => {
        render(<FullscreenError />);

        // Verify both content and button are rendered
        expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
        expect(screen.getByText(/We're sorry for the disruption/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
    });

    it('should render Refresh button when error_message is provided', () => {
        const customMessage = 'Custom error message from backend';
        render(<FullscreenError error_message={customMessage} />);

        const button = screen.getByRole('button', { name: /Refresh/i });
        expect(button).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Back to Home/i })).not.toBeInTheDocument();
    });

    it('should reload page when Refresh button is clicked with error_message', () => {
        const customMessage = 'Custom error message from backend';
        const reloadMock = jest.fn();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).location;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.location = { reload: reloadMock } as any;

        render(<FullscreenError error_message={customMessage} />);

        const button = screen.getByRole('button', { name: /Refresh/i });
        button.click();

        expect(reloadMock).toHaveBeenCalled();
    });
});
