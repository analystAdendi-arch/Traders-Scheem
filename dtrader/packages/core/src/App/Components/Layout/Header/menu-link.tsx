import React from 'react';
import classNames from 'classnames';

import { Text } from '@deriv/components';
import { getBrandUrl } from '@deriv/shared';
import { observer } from '@deriv/stores';
import { isExternalLink } from '@deriv/utils';

import { BinaryLink } from 'App/Components/Routes';

type TMenuLink = {
    data_testid?: string;
    icon: React.ReactElement;
    is_active?: boolean;
    is_disabled?: boolean;
    is_hidden?: boolean;
    link_to: string;
    onClickLink: () => void;
    suffix_icon?: React.ReactElement;
    text: React.ReactNode;
};

const MenuLink = observer(
    ({
        data_testid,
        icon,
        is_active,
        is_disabled,
        is_hidden,
        link_to = '',
        onClickLink,
        suffix_icon,
        text,
    }: Partial<TMenuLink>) => {
        const deriv_static_url = `${getBrandUrl()}/${link_to}`;
        const is_external_link = deriv_static_url && isExternalLink(link_to);

        const renderIcon = (IconComponent: React.ReactElement, className: string) => {
            return React.cloneElement(IconComponent, {
                className,
                iconSize: IconComponent.props.iconSize || 'xs',
                fill: IconComponent.props.fill || 'var(--color-text-primary)',
            });
        };

        if (is_hidden) return null;

        if (!link_to) {
            return (
                <div
                    className={classNames('header__menu-mobile-link', {
                        'header__menu-mobile-link--disabled': is_disabled,
                    })}
                    data-testid={data_testid}
                >
                    {icon && renderIcon(icon, 'header__menu-mobile-link-icon')}
                    <div className='header__menu-mobile-link-text'>
                        <Text size='s'>{text}</Text>
                        {suffix_icon && renderIcon(suffix_icon, 'header__menu-mobile-link-suffix-icon')}
                    </div>
                </div>
            );
        } else if (is_external_link) {
            return (
                <a
                    className={classNames('header__menu-mobile-link', {
                        'header__menu-mobile-link--disabled': is_disabled,
                        'header__menu-mobile-link--active': is_active,
                    })}
                    href={link_to}
                    data-testid={data_testid}
                >
                    {icon && renderIcon(icon, 'header__menu-mobile-link-icon')}
                    <div className='header__menu-mobile-link-text'>
                        <Text className='header__menu-mobile-link-text' as='h3' size='s'>
                            {text}
                        </Text>
                        {suffix_icon && renderIcon(suffix_icon, 'header__menu-mobile-link-suffix-icon')}
                    </div>
                </a>
            );
        }

        return (
            <BinaryLink
                to={link_to}
                className={classNames('header__menu-mobile-link', {
                    'header__menu-mobile-link--disabled': is_disabled,
                    'header__menu-mobile-link--active': is_active,
                })}
                onClick={onClickLink}
                data-testid={data_testid}
            >
                {icon && renderIcon(icon, 'header__menu-mobile-link-icon')}
                <div className='header__menu-mobile-link-text'>
                    <Text as='h3' size='s'>
                        {text}
                    </Text>
                    {suffix_icon && renderIcon(suffix_icon, 'header__menu-mobile-link-suffix-icon')}
                </div>
            </BinaryLink>
        );
    }
);

export default MenuLink;
