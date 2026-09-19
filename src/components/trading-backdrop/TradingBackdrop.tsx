import './trading-backdrop.scss';

// Deterministic values so the backdrop never jumps between renders.
const CANDLES = [
    [40, 1], [58, 1], [52, 0], [70, 1], [64, 0], [86, 1], [78, 1], [96, 0], [90, 1], [112, 1],
    [104, 0], [124, 1], [118, 1], [138, 0], [132, 1], [150, 1],
] as const;
const VOLUME = [18, 30, 22, 40, 28, 46, 34, 52, 38, 44, 30, 56, 42, 36, 48, 60, 40, 32, 50, 44];
const STARS = [
    [80, 60], [210, 110], [340, 40], [460, 150], [620, 70], [760, 120], [880, 40], [1010, 95],
    [1120, 55], [150, 200], [540, 230], [930, 210], [1080, 180], [300, 260], [700, 190],
] as const;

/**
 * Shared dark trading backdrop (Dashboard + Free Bots): midnight/indigo gradient,
 * a teal perspective grid floor, an emerald-to-cyan aurora line, faint candles
 * and volume bars. Purely decorative.
 */
const TradingBackdrop = () => (
    <div className='trading-backdrop' aria-hidden='true'>
        <svg className='trading-backdrop__svg' viewBox='0 0 1200 600' preserveAspectRatio='xMidYMid slice'>
            <defs>
                <linearGradient id='tb-aurora' x1='0' x2='1'>
                    <stop offset='0%' stopColor='#10b981' stopOpacity='0' />
                    <stop offset='35%' stopColor='#10b981' stopOpacity='0.9' />
                    <stop offset='70%' stopColor='#22d3ee' stopOpacity='0.9' />
                    <stop offset='100%' stopColor='#6366f1' stopOpacity='0' />
                </linearGradient>
                <linearGradient id='tb-aurora-soft' x1='0' x2='1'>
                    <stop offset='0%' stopColor='#a78bfa' stopOpacity='0' />
                    <stop offset='50%' stopColor='#a78bfa' stopOpacity='0.55' />
                    <stop offset='100%' stopColor='#22d3ee' stopOpacity='0' />
                </linearGradient>
                <linearGradient id='tb-floor' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#2dd4bf' stopOpacity='0' />
                    <stop offset='100%' stopColor='#2dd4bf' stopOpacity='0.45' />
                </linearGradient>
                <filter id='tb-glow' x='-20%' y='-50%' width='140%' height='200%'>
                    <feGaussianBlur stdDeviation='4' result='blur' />
                    <feMerge>
                        <feMergeNode in='blur' />
                        <feMergeNode in='SourceGraphic' />
                    </feMerge>
                </filter>
            </defs>

            {STARS.map(([x, y]) => (
                <circle key={`s-${x}-${y}`} cx={x} cy={y} r='1.3' fill='#e0f2fe' opacity='0.55' />
            ))}

            {/* perspective grid floor */}
            <g stroke='url(#tb-floor)' strokeWidth='1'>
                {Array.from({ length: 9 }, (_, i) => {
                    const y = 430 + i * i * 2.4;
                    return <line key={`h-${i}`} x1='0' x2='1200' y1={y} y2={y} />;
                })}
                {Array.from({ length: 25 }, (_, i) => {
                    const x = -600 + i * 100;
                    return <line key={`v-${i}`} x1='600' y1='420' x2={x} y2='620' />;
                })}
            </g>

            {/* faint volume bars */}
            <g opacity='0.22'>
                {VOLUME.map((h, i) => (
                    <rect key={`v-${i}`} x={30 + i * 58} y={420 - h} width='30' height={h} rx='3' fill='#6366f1' />
                ))}
            </g>

            {/* candles on the right */}
            <g opacity='0.55'>
                {CANDLES.map(([h, up], i) => {
                    const x = 760 + i * 26;
                    const top = 380 - h;
                    const color = up ? '#34d399' : '#fb7185';
                    return (
                        <g key={`c-${x}`}>
                            <line x1={x + 6} x2={x + 6} y1={top - 14} y2={top + h * 0.6 + 12} stroke={color} strokeWidth='1.2' />
                            <rect x={x} y={top} width='12' height={h * 0.6} rx='2' fill={color} />
                        </g>
                    );
                })}
            </g>

            {/* aurora lines */}
            <path
                d='M0 330 C 180 250, 330 380, 520 300 S 860 200, 1200 260'
                stroke='url(#tb-aurora)'
                strokeWidth='3'
                fill='none'
                filter='url(#tb-glow)'
            />
            <path
                d='M0 380 C 220 330, 420 430, 640 360 S 980 300, 1200 340'
                stroke='url(#tb-aurora-soft)'
                strokeWidth='2'
                fill='none'
            />
        </svg>
    </div>
);

export default TradingBackdrop;
