import React from 'react';

import { Text } from '@deriv/components';
import { LabelPairedGlobeSmRegularIcon } from '@deriv/quill-icons';
import { observer, useStore } from '@deriv/stores';
import { Localize, useTranslations } from '@deriv-com/translations';

const MenuTitle = observer(() => {
    const { localize, currentLang } = useTranslations();
    const { ui } = useStore();
    const { is_mobile_language_menu_open, setMobileLanguageMenuOpen } = ui;

    return (
        <React.Fragment>
            <div>{localize('Menu')}</div>
            <div
                className='settings-language__language-button_wrapper'
                onClick={() => {
                    if (!is_mobile_language_menu_open) {
                        setMobileLanguageMenuOpen(true);
                    }
                }}
            >
                {!is_mobile_language_menu_open && (
                    <React.Fragment>
                        <LabelPairedGlobeSmRegularIcon />
                        <Text weight='bold' size='xxs' className='ic-settings-language__text'>
                            <Localize i18n_default_text={currentLang} />
                        </Text>
                    </React.Fragment>
                )}
            </div>
        </React.Fragment>
    );
});

export default MenuTitle;
