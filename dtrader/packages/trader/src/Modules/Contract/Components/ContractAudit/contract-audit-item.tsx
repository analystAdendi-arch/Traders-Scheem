import React from 'react';
import classNames from 'classnames';

import { Text, TooltipPortal } from '@deriv/components';
import { formatDate, formatTime } from '@deriv/shared';
import { useDevice } from '@deriv-com/ui';

type TContractAuditItem = {
    additional_info?: React.ReactNode | string;
    icon?: React.ReactNode;
    id: string;
    label?: string | React.ReactNode;
    timestamp?: number;
    value: React.ReactNode;
    value2?: React.ReactNode;
    tooltip_message?: string;
    onLabelClick?: () => void;
};

const ContractAuditItem = ({
    additional_info,
    icon,
    id,
    label,
    timestamp,
    value,
    value2,
    tooltip_message,
    onLabelClick,
}: TContractAuditItem) => {
    const { isDesktop } = useDevice();
    const hasTooltip = !!tooltip_message;

    const labelContent = (
        <Text
            size='xxxs'
            styles={{ lineHeight: 'unset' }}
            className={classNames('contract-audit__label', {
                'contract-audit__label--with-tooltip': hasTooltip,
            })}
            onClick={!isDesktop && hasTooltip ? onLabelClick : undefined}
        >
            {label}
        </Text>
    );

    return (
        <div id={id} className='contract-audit__grid' data-testid={id}>
            {icon && <div className='contract-audit__icon'>{icon}</div>}
            <div className='contract-audit__item'>
                {hasTooltip && tooltip_message ? (
                    isDesktop ? (
                        <TooltipPortal
                            message={tooltip_message}
                            position='top'
                            className='contract-audit__label-tooltip contract-audit__entry-spot-tooltip'
                        >
                            {labelContent}
                        </TooltipPortal>
                    ) : (
                        labelContent
                    )
                ) : (
                    labelContent
                )}
                <div className='contract-audit__value-wrapper'>
                    <Text weight='bold' size='xxs' line_height='m' color='primary' className='contract-audit__value'>
                        {value}
                    </Text>
                    {value2 && (
                        <Text
                            weight='bold'
                            size='xxs'
                            line_height='m'
                            color='primary'
                            className='contract-audit__value2'
                        >
                            {value2}
                        </Text>
                    )}
                    {additional_info && (
                        <Text
                            size='xxxs'
                            line_height='s'
                            color='less-prominent'
                            className='contract-audit__timestamp-value'
                        >
                            {additional_info}
                        </Text>
                    )}
                </div>
            </div>
            {timestamp && (
                <div className='contract-audit__timestamp'>
                    <Text size='xxxs' align='right' line_height='xs' className='contract-audit__timestamp-value'>
                        {formatDate(timestamp)}
                    </Text>
                    <Text size='xxxs' align='right' line_height='xs' className='contract-audit__timestamp-value'>
                        {formatTime(timestamp)}
                    </Text>
                </div>
            )}
        </div>
    );
};

export default ContractAuditItem;
