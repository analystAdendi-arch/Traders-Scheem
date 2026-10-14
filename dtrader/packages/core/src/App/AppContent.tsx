import React from 'react';

import { useMobileBridge } from '@deriv/api';
import { observer, useStore } from '@deriv/stores';
import { ThemeProvider } from '@deriv-com/quill-ui';
import { getInitialLanguage, useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import ErrorBoundary from './Components/Elements/Errors/error-boundary.jsx';
import LandscapeBlocker from './Components/Elements/LandscapeBlocker';
import AppToastMessages from './Containers/app-toast-messages.jsx';
import AppContents from './Containers/Layout/app-contents.jsx';
import { isEmbedded } from '@deriv/shared';

import BottomNav from './Containers/Layout/bottom-nav';
import Header from './Containers/Layout/header';
import AppModals from './Containers/Modals';
import Routes from './Containers/Routes/routes.jsx';
import Devtools from './Devtools';

const AppContent: React.FC<{ passthrough: any }> = observer(({ passthrough }) => {
    const store = useStore();
    const { current_language } = store.common;
    const { is_dark_mode_on } = store.ui;

    const { isMobile } = useDevice();

    const { switchLanguage } = useTranslations();
    const { isBridgeAvailable, sendBridgeEvent } = useMobileBridge();

    const html = document.documentElement;

    React.useEffect(() => {
        switchLanguage(current_language);
        html?.setAttribute('lang', current_language.toLowerCase());
        html?.setAttribute('dir', current_language.toLowerCase() === 'ar' ? 'rtl' : 'ltr');
    }, [current_language, switchLanguage, html]);

    // Send trading:config event when language or theme changes
    React.useEffect(() => {
        if (isBridgeAvailable) {
            const language = current_language || getInitialLanguage();
            sendBridgeEvent('trading:config', {
                lang: language,
                theme: is_dark_mode_on ? 'dark' : 'light',
            });
        }
    }, [isBridgeAvailable, sendBridgeEvent, current_language, is_dark_mode_on]);

    return (
        <ThemeProvider theme={is_dark_mode_on ? 'dark' : 'light'}>
            <LandscapeBlocker />
            {/* [VolaTrades] Inside VolaTrades its own header shows the account. */}
            {isMobile && !isEmbedded() && <Header />}
            <ErrorBoundary root_store={store}>
                <AppContents>
                    <Routes {...({ passthrough } as any)} />
                </AppContents>
            </ErrorBoundary>
            {isMobile && <BottomNav />}
            <ErrorBoundary root_store={store}>
                <AppModals />
            </ErrorBoundary>
            <AppToastMessages />
            <Devtools />
        </ThemeProvider>
    );
});

export default AppContent;
