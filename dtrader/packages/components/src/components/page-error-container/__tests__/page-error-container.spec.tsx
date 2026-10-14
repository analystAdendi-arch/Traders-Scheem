import React from 'react';

import { render, screen } from '@testing-library/react';

import PageErrorContainer from '../page-error-container';

// Mock child components
jest.mock('../../page-error', () => ({
    __esModule: true,
    default: ({ header, messages }: { header: React.ReactNode; messages: any[] }) => (
        <div data-testid='page-error'>
            <div data-testid='page-error-header'>{header}</div>
            <div data-testid='page-error-messages'>{messages?.length} messages</div>
        </div>
    ),
}));

jest.mock('../../fullscreen-error', () => ({
    __esModule: true,
    default: ({ error_message }: { error_message?: string }) => (
        <div data-testid='fullscreen-error'>
            {error_message ? (
                <div data-testid='fullscreen-error-message'>{error_message}</div>
            ) : (
                <div>Fullscreen Error Component</div>
            )}
        </div>
    ),
}));

describe('<PageErrorContainer />', () => {
    const mockRedirectLabels = ['Back to home'];
    const mockRedirectUrls = ['/'];

    it('should render PageError when both error_header and error_messages are provided', () => {
        const header = 'Test Error Header';
        const messages = [{ message: 'Error message 1' }, { message: 'Error message 2' }];

        render(
            <PageErrorContainer
                error_header={header}
                error_messages={messages}
                redirect_labels={mockRedirectLabels}
                redirect_urls={mockRedirectUrls}
            />
        );

        expect(screen.getByTestId('page-error')).toBeInTheDocument();
        expect(screen.getByTestId('page-error-header')).toHaveTextContent(header);
        expect(screen.getByTestId('page-error-messages')).toHaveTextContent('2 messages');
    });

    it('should render FullscreenError with error message when only error_messages are provided', () => {
        const messages = [{ message: 'API error message' }];

        render(<PageErrorContainer error_messages={messages} redirect_labels={mockRedirectLabels} />);

        expect(screen.getByTestId('fullscreen-error')).toBeInTheDocument();
        expect(screen.getByTestId('fullscreen-error-message')).toHaveTextContent('API error message');
    });

    it('should render FullscreenError without error message when no error_messages provided', () => {
        render(<PageErrorContainer redirect_labels={mockRedirectLabels} />);

        expect(screen.getByTestId('fullscreen-error')).toBeInTheDocument();
        expect(screen.queryByTestId('fullscreen-error-message')).not.toBeInTheDocument();
    });

    it('should render FullscreenError without error message when error_messages is empty array', () => {
        render(<PageErrorContainer error_messages={[]} redirect_labels={mockRedirectLabels} />);

        expect(screen.getByTestId('fullscreen-error')).toBeInTheDocument();
        expect(screen.queryByTestId('fullscreen-error-message')).not.toBeInTheDocument();
    });

    it('should render FullscreenError with first error message when multiple messages provided', () => {
        const messages = [{ message: 'Error 1' }, { message: 'Error 2' }, { message: 'Error 3' }];

        render(<PageErrorContainer error_messages={messages} redirect_labels={mockRedirectLabels} />);

        expect(screen.getByTestId('fullscreen-error')).toBeInTheDocument();
        expect(screen.getByTestId('fullscreen-error-message')).toHaveTextContent('Error 1');
    });

    it('should handle string messages', () => {
        const messages = ['String error message'];

        render(<PageErrorContainer error_messages={messages} redirect_labels={mockRedirectLabels} />);

        expect(screen.getByTestId('fullscreen-error')).toBeInTheDocument();
        expect(screen.getByTestId('fullscreen-error-message')).toHaveTextContent('String error message');
    });

    it('should handle React.ReactNode messages by not passing them as error_message', () => {
        const messages = [<span key='1'>React Node message</span>];

        render(<PageErrorContainer error_messages={messages} redirect_labels={mockRedirectLabels} />);

        expect(screen.getByTestId('fullscreen-error')).toBeInTheDocument();
        // React nodes are not extracted as error_message, so no error message should be displayed
        expect(screen.queryByTestId('fullscreen-error-message')).not.toBeInTheDocument();
    });
});
