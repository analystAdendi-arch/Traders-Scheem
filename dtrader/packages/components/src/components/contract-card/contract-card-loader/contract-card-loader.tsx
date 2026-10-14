import ContentLoader from 'react-content-loader';
import React from 'react';

const ContractCardLoader = ({ speed }: { speed: number }) => (
    <ContentLoader
        height={173}
        width={266}
        speed={speed}
        backgroundColor={'var(--color-surface-section)'}
        foregroundColor={'var(--color-interactive-hover)'}
    >
        <rect x='12' y='9' rx='0' ry='0' width='24' height='24' />
        <rect x='44' y='19' rx='0' ry='0' width='85' height='8' />
        <rect x='137' y='9' rx='0' ry='0' width='24' height='24' />
        <rect x='169' y='19' rx='0' ry='0' width='85' height='8' />
        <rect x='12' y='50' rx='0' ry='0' width='66' height='8' />
        <rect x='12' y='68' rx='0' ry='0' width='242' height='8' />
        <rect x='12' y='89' rx='0' ry='0' width='242' height='1' />
        <rect x='12' y='104' rx='0' ry='0' width='66' height='8' />
        <rect x='12' y='118' rx='0' ry='0' width='117' height='8' />
        <rect x='137' y='104' rx='0' ry='0' width='66' height='8' />
        <rect x='137' y='118' rx='0' ry='0' width='117' height='8' />
        <rect x='12' y='139' rx='0' ry='0' width='66' height='8' />
        <rect x='12' y='153' rx='0' ry='0' width='117' height='8' />
        <rect x='137' y='139' rx='0' ry='0' width='66' height='8' />
        <rect x='137' y='153' rx='0' ry='0' width='117' height='8' />
    </ContentLoader>
);

export default ContractCardLoader;
