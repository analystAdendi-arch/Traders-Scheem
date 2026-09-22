// Shared logo + app name "mark" rendered in the header (desktop & mobile, next to the
// hamburger) and in the mobile drawer. Logo priority: live App Builder preview data URL
// → public/logo.<png|jpg|jpeg|webp> → letter-badge fallback. The app name comes from the
// live preview, else the resolved deploy/build name (see getAppName).
import { useEffect, useMemo, useState } from 'react';
import {
    getPreviewAppName,
    getPreviewLogo,
    subscribePreviewAppName,
    subscribePreviewLogo,
} from '@/utils/live-branding-store';
import { isPreviewMode } from '@/utils/is-preview-mode';
import { getAppName, LOGO_CANDIDATES } from '../../../utils/branding';

type TLogoMarkProps = {
    height?: number;
};

/**
 * "VolaTrades" -> ["Vola", "Trades"]: splits at the first inner capital so
 * each half gets its own colour and the emblem initials read "VT".
 */
const splitWordmark = (name: string): [string, string] => {
    for (let i = 1; i < name.length; i++) {
        if (/[A-Z]/.test(name[i])) return [name.slice(0, i), name.slice(i)];
    }
    return [name, ''];
};

/**
 * Round emblem used until a real logo file is supplied in public/logo.<ext>:
 * a volatility wave under the app initials, on a cyan-to-violet ring.
 */
const Emblem = ({ size, initials }: { size: number; initials: string }) => (
    <svg
        className='app-header__logo-emblem'
        width={size}
        height={size}
        viewBox='0 0 40 40'
        aria-hidden='true'
    >
        <defs>
            <linearGradient id='vt-ring' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#22c55e' />
                <stop offset='100%' stopColor='#ef4444' />
            </linearGradient>
            <radialGradient id='vt-core' cx='50%' cy='38%' r='62%'>
                <stop offset='0%' stopColor='#1e293b' />
                <stop offset='100%' stopColor='#020617' />
            </radialGradient>
            <linearGradient id='vt-wave' x1='0' x2='1'>
                <stop offset='0%' stopColor='#22c55e' />
                <stop offset='100%' stopColor='#ef4444' />
            </linearGradient>
        </defs>
        <circle cx='20' cy='20' r='19' fill='url(#vt-ring)' />
        <circle cx='20' cy='20' r='16.5' fill='url(#vt-core)' />
        {/* volatility swing */}
        <path
            d='M7 27 l4.5-6 3.5 4 4-9 4 7 3.5-4.5 3.5 5'
            fill='none'
            stroke='url(#vt-wave)'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <text x='20' y='17' textAnchor='middle' fontSize='12' fontWeight='900' fontFamily='Arial, sans-serif'>
            <tspan fill='#22c55e'>{initials.charAt(0)}</tspan>
            <tspan fill='#f43f5e'>{initials.charAt(1)}</tspan>
        </text>
    </svg>
);

export const LogoMark = ({ height = 32 }: TLogoMarkProps) => {
    const [previewLogo, setPreviewLogo] = useState<string | null>(getPreviewLogo());
    const [previewAppName, setPreviewAppName] = useState<string | null>(getPreviewAppName());
    const [candidateIndex, setCandidateIndex] = useState(0);

    useEffect(() => subscribePreviewLogo(setPreviewLogo), []);
    useEffect(() => subscribePreviewAppName(setPreviewAppName), []);

    // Preview data URL wins, then the deploy-time public/logo.<ext> candidates. The static
    // preview build ships no public/logo.* (the live App Builder logo arrives as a data URL),
    // so skip the file candidates there to avoid pointless 404 probes — fall back to the badge.
    const candidates = useMemo(() => {
        const fileFallbacks = isPreviewMode() ? [] : LOGO_CANDIDATES;
        return previewLogo ? [previewLogo, ...fileFallbacks] : [...fileFallbacks];
    }, [previewLogo]);

    // Restart probing whenever the candidate list changes (e.g. a new preview logo).
    useEffect(() => setCandidateIndex(0), [candidates]);

    const appName = previewAppName || getAppName();
    const logoSrc = candidateIndex < candidates.length ? candidates[candidateIndex] : null;
    const [first, second] = splitWordmark(appName.trim());
    const initials = `${first.charAt(0)}${second.charAt(0) || first.charAt(1) || ''}`.toUpperCase();

    return (
        <span className='app-header__logo-mark'>
            {logoSrc ? (
                <img
                    data-logo
                    src={logoSrc}
                    alt={appName}
                    className='app-header__logo-img'
                    style={{ height: `${height}px` }}
                    onError={() => setCandidateIndex((index) => index + 1)}
                />
            ) : (
                <Emblem size={height + 8} initials={initials || 'A'} />
            )}
            {/* A supplied logo file carries the name itself, so skip the wordmark. */}
            {!logoSrc && (
                <span className='app-header__logo-text' aria-label={appName}>
                    <span className='app-header__logo-text-first'>{first}</span>
                    {second && <span className='app-header__logo-text-second'>{second}</span>}
                </span>
            )}
        </span>
    );
};
