import { observer } from 'mobx-react-lite';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import { useStore } from '@/hooks/useStore';
import { LegacyLogout1pxIcon, LegacyTheme1pxIcon } from '@deriv/quill-icons/Legacy';
import { useTranslations } from '@deriv-com/translations';

type TMenuContentProps = {
    enableThemeToggle?: boolean;
    onOpenSubmenu?: (submenu: string) => void;
    onLogout?: () => void;
};

/**
 * The phone menu behind the ≡ button: pick a theme, and log out.
 *
 * Written as plain markup rather than the shared MenuItem/ToggleSwitch pair,
 * which rendered nothing inside this drawer - the panel opened with only its
 * title and an empty body. Our own elements, with our own styles, cannot
 * disappear the same way, and a two-button theme choice reads more clearly on a
 * phone than a switch whose label has to explain which way is on.
 */
const MenuContent = observer(({ enableThemeToggle = true, onLogout }: TMenuContentProps) => {
    const { localize } = useTranslations();
    const { client } = useStore() ?? {};
    const { is_dark_mode_on, setTheme } = useThemeSwitcher();

    return (
        <div className='mobile-menu__content'>
            {enableThemeToggle && (
                <section className='mobile-menu__group'>
                    <h3 className='mobile-menu__group-title'>
                        <LegacyTheme1pxIcon iconSize='xs' />
                        {localize('Theme')}
                    </h3>

                    <div className='mobile-menu__theme' role='group' aria-label={localize('Theme')}>
                        <button
                            type='button'
                            aria-pressed={!is_dark_mode_on}
                            className={`mobile-menu__theme-option${
                                !is_dark_mode_on ? ' mobile-menu__theme-option--active' : ''
                            }`}
                            onClick={() => setTheme('light')}
                        >
                            <span aria-hidden='true'>☀️</span>
                            {localize('Light')}
                        </button>
                        <button
                            type='button'
                            aria-pressed={is_dark_mode_on}
                            className={`mobile-menu__theme-option${
                                is_dark_mode_on ? ' mobile-menu__theme-option--active' : ''
                            }`}
                            onClick={() => setTheme('dark')}
                        >
                            <span aria-hidden='true'>🌙</span>
                            {localize('Dark')}
                        </button>
                    </div>
                </section>
            )}

            {client?.is_logged_in && onLogout && (
                <section className='mobile-menu__group'>
                    <button type='button' className='mobile-menu__logout' onClick={onLogout}>
                        <LegacyLogout1pxIcon iconSize='xs' />
                        {localize('Log out')}
                    </button>
                </section>
            )}
        </div>
    );
});

export default MenuContent;
