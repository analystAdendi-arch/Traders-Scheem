import { useCallback, useEffect, useRef, useState } from 'react';
import { localize } from '@deriv-com/translations';
import { getAppName, LOGO_CANDIDATES } from '@/utils/branding';
import './manual-trader.scss';

// app.deriv.com now 301-redirects to the deriv.com marketing site; DTrader lives here.
const DTRADER_URL = 'https://dtrader.deriv.com';
/** After this long with no load event, offer a retry instead of spinning forever. */
const SLOW_MS = 15000;

const ManualTrader = () => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [slow, setSlow] = useState(false);
    const [logo_failed, setLogoFailed] = useState(false);
    // Bumping this remounts the iframe, which is how "Try again" reloads it.
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (loaded) return undefined;
        const timer = setTimeout(() => setSlow(true), SLOW_MS);
        return () => clearTimeout(timer);
    }, [loaded, attempt]);

    // Stop the embedded platform's socket when leaving the tab.
    useEffect(
        () => () => {
            try {
                iframeRef.current?.setAttribute('src', 'about:blank');
            } catch {
                /* ignore */
            }
        },
        []
    );

    const retry = useCallback(() => {
        setLoaded(false);
        setSlow(false);
        setAttempt(count => count + 1);
    }, []);

    return (
        <div className='manual-trader-container'>
            <div className='manual-trader'>
                <iframe
                    key={attempt}
                    ref={iframeRef}
                    title={localize('Deriv manual trader')}
                    className='manual-trader__iframe'
                    src={DTRADER_URL}
                    allow='clipboard-read; clipboard-write; fullscreen; web-share'
                    /**
                     * The platform was pulling the whole site out of this tab.
                     * Withholding allow-top-navigation stops it steering our
                     * window, and leaving out allow-popups stops new tabs, so
                     * it stays put here. The rest is what it needs to run:
                     * scripts, its own storage and cookies, forms, dialogs and
                     * statement downloads.
                     */
                    sandbox='allow-scripts allow-same-origin allow-forms allow-modals allow-downloads'
                    onLoad={() => setLoaded(true)}
                />

                {/* Branded cover while the platform boots, so the tab never looks broken. */}
                {!loaded && (
                    <div className='manual-trader__loader' role='status' aria-live='polite'>
                        <div className='manual-trader__ring'>
                            {logo_failed ? (
                                <span className='manual-trader__ring-mark'>{getAppName().charAt(0)}</span>
                            ) : (
                                <img
                                    className='manual-trader__ring-logo'
                                    src={LOGO_CANDIDATES[0]}
                                    alt=''
                                    onError={() => setLogoFailed(true)}
                                />
                            )}
                        </div>
                        <h2 className='manual-trader__loader-title'>{localize('Manual Trader')}</h2>
                        <p className='manual-trader__loader-text'>
                            {slow
                                ? localize('Deriv is taking longer than usual to answer.')
                                : localize('Loading live Deriv prices for your own entries…')}
                        </p>
                        {slow && (
                            <button type='button' className='manual-trader__retry' onClick={retry}>
                                {localize('Try again')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualTrader;
