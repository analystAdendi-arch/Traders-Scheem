// [AI]
import React from 'react';
import { observer } from 'mobx-react-lite';
import { getBrandLogo, getBrandLogoDark, getBrandName } from '@deriv/shared';
import { useStore } from '@deriv/stores';

type TBrandLogoProps = {
    className?: string;
    width?: number | string;
    height?: number | string;
};

const BrandLogo = observer(({ className, width, height }: TBrandLogoProps) => {
    const { ui } = useStore();
    const src = ui.is_dark_mode_on ? getBrandLogoDark() : getBrandLogo();
    return <img src={`/${src}`} alt={getBrandName()} className={className} width={width} height={height} />;
});

BrandLogo.displayName = 'BrandLogo';

export default BrandLogo;
// [/AI]
