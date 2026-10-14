import React from 'react';
import { useDevice } from '@deriv-com/ui';
import { Skeleton } from '../../skeleton';

const TradeLoader = () => {
    const { isMobile } = useDevice();

    if (isMobile) {
        return (
            <div className='loading-dtrader-v2__trade' data-testid='dt_trade_loader'>
                <div className='skeleton-box__trade-types'>
                    {[...new Array(4)].map((_, idx) => (
                        <Skeleton key={idx} width={88} height={32} borderRadius={16} />
                    ))}
                </div>
                <div className='skeleton-box__market'>
                    <Skeleton height={42} />
                </div>
                <div className='skeleton-box__chart'>
                    <Skeleton />
                </div>
                <div className='skeleton-box__trade-params'>
                    <Skeleton height={220} />
                </div>
            </div>
        );
    }
    return (
        <div className='loading-dtrader-v2__trade' data-testid='dt_trade_loader'>
            <div className='skeleton-box skeleton-box__header'>
                <div className='skeleton-box__header-trade-types'>
                    {[...new Array(6)].map((_, idx) => (
                        <Skeleton key={idx} width={88} height={32} borderRadius={16} />
                    ))}
                </div>
                <Skeleton width={72} height={32} borderRadius={16} />
            </div>
            <div className='skeleton-box'>
                <div className='skeleton-box__chart'>
                    <Skeleton />
                </div>
                <div className='skeleton-box__trade-params'>
                    <div className='skeleton-box__trade-params-row'>
                        <Skeleton width={192} height={24} />
                    </div>
                    <div className='skeleton-box__trade-params-column'>
                        {[...new Array(3)].map((_, idx) => (
                            <Skeleton key={idx} height={56} />
                        ))}
                    </div>
                    <div className='skeleton-box__trade-params-row'>
                        <Skeleton width={76} height={24} />
                        <Skeleton width={100} height={24} />
                    </div>
                    <div className='skeleton-box__trade-params-row'>
                        <Skeleton height={56} borderRadius={28} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeLoader;
