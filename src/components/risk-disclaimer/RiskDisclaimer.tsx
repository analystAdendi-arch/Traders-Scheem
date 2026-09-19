import { useEffect, useRef, useState } from 'react';
import { localize } from '@deriv-com/translations';

import './risk-disclaimer.scss';

/** Sticky, app-wide risk disclaimer pinned bottom-left above the footer. */
const RiskDisclaimer = () => {
    const [is_open, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!is_open) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) setIsOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [is_open]);

    return (
        <div className='risk-disclaimer' ref={ref}>
            {is_open && (
                <div className='risk-disclaimer__popover' role='dialog' aria-label={localize('Risk disclaimer')}>
                    <div className='risk-disclaimer__head'>
                        <strong>{localize('Risk Disclaimer')}</strong>
                        <button
                            type='button'
                            className='risk-disclaimer__close'
                            onClick={() => setIsOpen(false)}
                            aria-label={localize('Close')}
                        >
                            ×
                        </button>
                    </div>
                    <p>
                        {localize(
                            'Trading derivatives such as digit and rise/fall contracts is highly risky and you can lose all the money you invest. Past tick statistics, scanner signals and bot results do not guarantee future outcomes.'
                        )}
                    </p>
                    <p>
                        {localize(
                            'Only trade with money you can afford to lose. This site is a third-party tool built on the Deriv API and is not operated by Deriv.'
                        )}
                    </p>
                </div>
            )}
            <button
                type='button'
                className='risk-disclaimer__button'
                onClick={() => setIsOpen(open => !open)}
                aria-expanded={is_open}
            >
                <span aria-hidden='true'>⚠</span>
                {localize('Risk Disclaimer')}
            </button>
        </div>
    );
};

export default RiskDisclaimer;
