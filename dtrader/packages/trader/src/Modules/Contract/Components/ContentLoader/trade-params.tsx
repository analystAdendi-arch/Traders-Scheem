import React from 'react';
import ContentLoader from 'react-content-loader';

const TradeParamsLoader = ({ speed }: { speed: number }) => {
    return (
        <ContentLoader
            height={609}
            width={240}
            speed={speed}
            backgroundColor={'var(--color-surface-section)'}
            foregroundColor={'var(--color-interactive-hover)'}
        >
            <rect x='0' y='0' rx='4' ry='4' width='240' height='59' />
            <rect x='0' y='75' rx='4' ry='4' width='240' height='76' />
            <rect x='0' y='159' rx='4' ry='4' width='240' height='132' />
            <rect x='0' y='299' rx='4' ry='4' width='240' height='120' />
            <rect x='0' y='427' rx='4' ry='4' width='240' height='194' />
        </ContentLoader>
    );
};

export { TradeParamsLoader };
