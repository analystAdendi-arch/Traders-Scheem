/**
 * Outline icons for the main navigation, drawn in one style (2px round strokes)
 * so every tab matches; colour comes from CSS (`.nav-icon`).
 */
export type TNavIconName =
    | 'dashboard'
    | 'bot-builder'
    | 'charts'
    | 'tutorials'
    | 'free-bots'
    | 'analysis-tool'
    | 'scanner'
    | 'auto-trader'
    | 'manual-trader'
    | 'trading-view'
    | 'bulk-trader'
    | 'copy-trader';

const PATHS: Record<TNavIconName, JSX.Element> = {
    dashboard: (
        <>
            <path d='M3 10.5 12 3l9 7.5' />
            <path d='M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5' />
        </>
    ),
    'bot-builder': (
        <>
            <rect x='4' y='8' width='16' height='12' rx='3' />
            <path d='M12 8V4.5' />
            <circle cx='12' cy='3.5' r='1' />
            <circle cx='9' cy='13' r='1.2' />
            <circle cx='15' cy='13' r='1.2' />
            <path d='M9.5 17h5M2 13v3M22 13v3' />
        </>
    ),
    charts: (
        <>
            <path d='M4 20h16' />
            <path d='M6 17v-4M10 17V9M14 17v-6M18 17V6' />
            <path d='M5 9l4-3 4 3 6-5' />
        </>
    ),
    tutorials: (
        <>
            <path d='M2 9l10-5 10 5-10 5z' />
            <path d='M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5' />
            <path d='M22 9v6' />
        </>
    ),
    'free-bots': (
        <>
            <circle cx='12' cy='6' r='3' />
            <circle cx='6' cy='17' r='3' />
            <circle cx='18' cy='17' r='3' />
            <path d='M10.5 8.6 7.5 14.4M13.5 8.6l3 5.8M9 17h6' />
        </>
    ),
    'analysis-tool': (
        <>
            <circle cx='10.5' cy='10.5' r='6.5' />
            <path d='M20 20l-4.8-4.8' />
        </>
    ),
    scanner: (
        <>
            <path d='M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3' />
            <path d='M4 12h16' />
            <path d='M8 9l2 2 2-4 2 5 2-2' />
        </>
    ),
    'auto-trader': (
        <>
            <rect x='3' y='7' width='18' height='13' rx='2' />
            <path d='M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
            <path d='M3 12h18M11 12v2h2v-2' />
        </>
    ),
    'manual-trader': (
        <>
            <rect x='3' y='4' width='18' height='13' rx='2' />
            <path d='M8 21h8M12 17v4' />
            <path d='M10 8.5v5l4-2.5z' />
        </>
    ),
    'trading-view': (
        <>
            <path d='M6 4v4M6 14v6M12 7v3M12 16v4M18 3v5M18 13v4' />
            <rect x='4' y='8' width='4' height='6' rx='0.8' />
            <rect x='10' y='10' width='4' height='6' rx='0.8' />
            <rect x='16' y='8' width='4' height='5' rx='0.8' />
        </>
    ),
    'bulk-trader': (
        <>
            <path d='M3 14h3l4-3h4a1.5 1.5 0 0 1 0 3h-3' />
            <path d='M6 14v5h2l3.5 1.5L20 16a1.5 1.5 0 0 0-2-2l-4 2' />
            <circle cx='16' cy='6' r='2.5' />
            <circle cx='20.5' cy='9.5' r='1.5' />
        </>
    ),
    'copy-trader': (
        <>
            <rect x='8' y='8' width='13' height='13' rx='2' />
            <path d='M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3' />
        </>
    ),
};

const NavIcon = ({ name }: { name: TNavIconName }) => (
    <svg
        className='nav-icon'
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
    >
        {PATHS[name]}
    </svg>
);

export default NavIcon;
