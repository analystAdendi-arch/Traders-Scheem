import React from 'react';

import { localize } from '@deriv-com/translations';

import TriangleWarningImage from './triangle-warning.webp';

interface TriangleWarningIconProps {
    width?: number;
    height?: number;
}

const TriangleWarningIcon: React.FC<TriangleWarningIconProps> = ({ width = 100, height = 100 }) => {
    return (
        <img
            src={TriangleWarningImage}
            alt={localize('Error: An unexpected error has occurred')}
            width={width}
            height={height}
        />
    );
};

export default TriangleWarningIcon;
