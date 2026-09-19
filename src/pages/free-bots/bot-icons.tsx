import React from 'react';

type TIconProps = {
    className?: string;
};

const Svg = ({ children, className }: React.PropsWithChildren<TIconProps>) => (
    <svg
        className={className}
        width='32'
        height='32'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        focusable='false'
    >
        {children}
    </svg>
);

/** Rise/Fall — a trend line breaking upwards. */
export const RiseFallIcon = (props: TIconProps) => (
    <Svg {...props}>
        <path d='M3 17.5 9 11l4 4 7.5-7.5' />
        <path d='M15 7.5h5.5V13' />
    </Svg>
);

/** Over/Under — a die-like digit block with a threshold marker. */
export const OverUnderIcon = (props: TIconProps) => (
    <Svg {...props}>
        <rect x='3' y='4' width='18' height='16' rx='3' />
        <path d='M3 12h18' />
        <path d='M8.5 8.5h1M14.5 15.5h1' />
    </Svg>
);

/** Matches/Differs — two digits compared. */
export const MatchesDiffersIcon = (props: TIconProps) => (
    <Svg {...props}>
        <rect x='3' y='5' width='7.5' height='14' rx='2' />
        <rect x='13.5' y='5' width='7.5' height='14' rx='2' />
        <path d='M10.5 12h3' />
    </Svg>
);

/** Even/Odd — alternating parity dots. */
export const EvenOddIcon = (props: TIconProps) => (
    <Svg {...props}>
        <circle cx='7' cy='8' r='2.5' />
        <circle cx='17' cy='16' r='2.5' />
        <path d='M13 8h6M5 16h6' />
    </Svg>
);

/** Accumulators — a compounding staircase. */
export const AccumulatorIcon = (props: TIconProps) => (
    <Svg {...props}>
        <path d='M3 20h4v-5h5V9h5V4h4' />
        <path d='M3 20V4' />
    </Svg>
);

export const FALLBACK_ICON = RiseFallIcon;
