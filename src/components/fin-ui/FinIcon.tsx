/**
 * Traders Scheem icon set: two-tone financial line icons (a stroked outline over a
 * soft tinted fill), shown inside faceted badges. Used by the splash screen, the
 * landing page and the home page. Colours come from the badge tone in fin-ui.scss.
 */
import type { ReactNode } from 'react';

import './fin-ui.scss';

export type TFinIconName =
    | 'candles'
    | 'bot'
    | 'copy'
    | 'shield'
    | 'radar'
    | 'bolt'
    | 'vault'
    | 'upload'
    | 'blocks'
    | 'cloud'
    | 'globe'
    | 'trend'
    | 'coins'
    | 'clock'
    | 'lock'
    | 'chat';

export type TFinTone = 'gold' | 'sky' | 'purple' | 'red' | 'white';

const PATHS: Record<TFinIconName, ReactNode> = {
    candles: (
        <>
            <path className='fin-fill' d='M5 8h3v8H5zM10.5 5h3v9h-3zM16 10h3v7h-3z' />
            <path d='M6.5 5v3M6.5 16v3M12 2.5V5M12 14v4.5M17.5 7.5V10M17.5 17v3.5M5 8h3v8H5zM10.5 5h3v9h-3zM16 10h3v7h-3z' />
        </>
    ),
    bot: (
        <>
            <rect className='fin-fill' x='4' y='8' width='16' height='12' rx='4' />
            <path d='M12 8V4.5M10 4.5h4M8 20h8a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4zM9 13.5v1M15 13.5v1M2 13v2M22 13v2' />
        </>
    ),
    copy: (
        <>
            <rect className='fin-fill' x='8' y='8' width='12' height='12' rx='2.5' />
            <path d='M10.5 8H17.5a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8 17.5v-7A2.5 2.5 0 0 1 10.5 8zM16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8M11 14l2 2 3.5-4' />
        </>
    ),
    shield: (
        <>
            <path className='fin-fill' d='M12 3 4.5 6v5.5c0 4.6 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.9 7.5-9.5V6z' />
            <path d='M12 3 4.5 6v5.5c0 4.6 3.2 8.1 7.5 9.5 4.3-1.4 7.5-4.9 7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5' />
        </>
    ),
    radar: (
        <>
            <circle className='fin-fill' cx='12' cy='12' r='9' />
            <path d='M12 3a9 9 0 1 0 9 9M12 7.5a4.5 4.5 0 1 0 4.5 4.5M12 12l7-7M17 3.5l2 1.5.5 2.5' />
        </>
    ),
    bolt: (
        <>
            <path className='fin-fill' d='M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z' />
            <path d='M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z' />
        </>
    ),
    vault: (
        <>
            <rect className='fin-fill' x='3' y='4' width='18' height='15' rx='2.5' />
            <path d='M5.5 4h13A2.5 2.5 0 0 1 21 6.5v10a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-10A2.5 2.5 0 0 1 5.5 4zM6 19v1.5M18 19v1.5M12 8.5v1M12 13.5v1M9.5 11.5h1M13.5 11.5h1' />
            <circle cx='12' cy='11.5' r='3' />
        </>
    ),
    upload: (
        <>
            <path className='fin-fill' d='M4 14h16v4.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z' />
            <path d='M12 15V4M7.5 8.5 12 4l4.5 4.5M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14' />
        </>
    ),
    blocks: (
        <>
            <path className='fin-fill' d='M4 4h7v7H4zM13 13h7v7h-7z' />
            <path d='M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' />
        </>
    ),
    cloud: (
        <>
            <path className='fin-fill' d='M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.4 3.8 3.8 0 0 1-.3 7.6z' />
            <path d='M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.4 3.8 3.8 0 0 1-.3 7.6zM12 11v5M9.8 13.2 12 11l2.2 2.2' />
        </>
    ),
    globe: (
        <>
            <circle className='fin-fill' cx='12' cy='12' r='9' />
            <path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9s1.1-6.4 3.6-9z' />
        </>
    ),
    trend: (
        <>
            <path className='fin-fill' d='M3 20 9 13l4 3.5L21 7v13z' />
            <path d='M3 17.5 9 11l4 3.5L21 6M15.5 6H21v5.5' />
        </>
    ),
    coins: (
        <>
            <ellipse className='fin-fill' cx='9' cy='7' rx='6' ry='2.8' />
            <path d='M3 7c0 1.5 2.7 2.8 6 2.8S15 8.5 15 7 12.3 4.2 9 4.2 3 5.5 3 7zM3 7v4c0 1.5 2.7 2.8 6 2.8M3 11v4c0 1.5 2.7 2.8 6 2.8M15 7v3' />
            <ellipse cx='15.5' cy='14' rx='5.5' ry='2.6' />
            <path d='M10 14v3.6c0 1.4 2.5 2.6 5.5 2.6S21 19 21 17.6V14' />
        </>
    ),
    clock: (
        <>
            <circle className='fin-fill' cx='12' cy='12' r='9' />
            <path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.5 2' />
        </>
    ),
    lock: (
        <>
            <rect className='fin-fill' x='4.5' y='10.5' width='15' height='10' rx='2.5' />
            <path d='M7 10.5h10a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18v-5A2.5 2.5 0 0 1 7 10.5zM8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2' />
        </>
    ),
    chat: (
        <>
            <path className='fin-fill' d='M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.2A2.5 2.5 0 0 1 4 13.5z' />
            <path d='M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.2A2.5 2.5 0 0 1 4 13.5zM8.5 9.5h7M8.5 12.5h4' />
        </>
    ),
};

export const FinIcon = ({ name, size = 24 }: { name: TFinIconName; size?: number }) => (
    <svg
        className='fin-icon'
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={1.7}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
    >
        {PATHS[name]}
    </svg>
);

/** The icon inside a faceted, glowing badge in one of the brand tones. */
export const FinBadge = ({
    name,
    tone = 'gold',
    size = 'md',
    className = '',
}: {
    name: TFinIconName;
    tone?: TFinTone;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) => (
    <span className={`fin-badge fin-badge--${tone} fin-badge--${size} ${className}`} aria-hidden='true'>
        <FinIcon name={name} size={size === 'lg' ? 30 : size === 'sm' ? 18 : 24} />
    </span>
);

export default FinIcon;
