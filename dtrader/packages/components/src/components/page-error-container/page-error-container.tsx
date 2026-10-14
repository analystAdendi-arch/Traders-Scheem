import React from 'react';

import FullscreenError from '../fullscreen-error';
import PageError from '../page-error';

type TPageErrorContainer = {
    buttonOnClick?: () => void;
    error_header?: React.ReactNode;
    error_messages?: Array<{ message: string; has_html?: boolean } | React.ReactNode>;
    redirect_labels: string[];
    redirect_urls?: string[];
    setError?: (has_error: boolean, error: React.ReactNode) => void;
    should_clear_error_on_click?: boolean;
};

const PageErrorContainer = ({ error_header, error_messages, ...props }: TPageErrorContainer) => {
    const hasMessages = error_messages && error_messages.length > 0;
    let errorMessage: string | undefined;
    if (hasMessages) {
        const firstMessage = error_messages[0];
        if (firstMessage && typeof firstMessage === 'object' && 'message' in firstMessage) {
            errorMessage = firstMessage.message;
        } else if (typeof firstMessage === 'string') {
            errorMessage = firstMessage;
        }
    }

    // Full page error with header and messages (e.g., 404, specific page errors)
    if (error_header && hasMessages) {
        return <PageError header={error_header} messages={error_messages} {...props} />;
    }

    // Uncaught errors from ErrorBoundary → show fullscreen error with optional error message
    return <FullscreenError error_message={errorMessage} />;
};

export default PageErrorContainer;
