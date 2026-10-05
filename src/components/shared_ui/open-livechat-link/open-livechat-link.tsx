import React from 'react';
import clsx from 'clsx';
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/constants/contact';
import { Localize } from '@deriv-com/translations';
import Text from '../text';
import './open-livechat-link.scss';

type TOpenLiveChatLink = {
    text_size?: React.ComponentProps<typeof Text>['size'];
    className?: string;
};

/**
 * "Contact us" link used inside messages ("...contact us via <link>"). WhatsApp is the
 * site's only support channel, so this opens a WhatsApp chat rather than Deriv's live
 * chat (whose script is not loaded here - the old call threw on click).
 */
const OpenLiveChatLink = ({ children, text_size, className }: React.PropsWithChildren<TOpenLiveChatLink>) => (
    <a
        className={clsx('open-livechat__link', className)}
        href={WHATSAPP_URL}
        target='_blank'
        rel='noopener noreferrer'
        title={`WhatsApp ${WHATSAPP_NUMBER}`}
    >
        <Text size={text_size || 'xs'} weight='bold' color='brand-red-coral'>
            {children || <Localize i18n_default_text='WhatsApp' />}
        </Text>
    </a>
);

export default OpenLiveChatLink;
