import React from 'react';
import classNames from 'classnames';

import { Button, Text } from '@deriv/components';
import { UNSUPPORTED_LANGUAGES } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { getAllowedLanguages, useTranslations } from '@deriv-com/translations';

type TLanguageSelectorProps = {
    onLanguageChange?: () => void;
};

const LanguageSelector = observer(({ onLanguageChange }: TLanguageSelectorProps) => {
    const { common } = useStore();
    const { currentLang, switchLanguage } = useTranslations();
    const { changeSelectedLanguage } = common;
    const allowed_languages = getAllowedLanguages(UNSUPPORTED_LANGUAGES);

    const handleLanguageChange = async (lang: string) => {
        await changeSelectedLanguage(lang);
        switchLanguage(lang);
        onLanguageChange?.();
    };

    return (
        <div className='flyout-selector'>
            {Object.keys(allowed_languages).map(lang => {
                const isActive = lang === currentLang;
                return (
                    <Button
                        key={lang}
                        className={classNames('flyout-selector__option', {
                            'flyout-selector__option--active': isActive,
                        })}
                        onClick={() => !isActive && handleLanguageChange(lang)}
                        disabled={isActive}
                        type='button'
                    >
                        <Text>{allowed_languages[lang]}</Text>
                    </Button>
                );
            })}
        </div>
    );
});

export default LanguageSelector;
