import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { useDevice } from '@deriv-com/ui';
import './main-body.scss';

type TMainBodyProps = {
    children: React.ReactNode;
};

const MainBody: React.FC<TMainBodyProps> = observer(({ children }) => {
    const { ui } = useStore() ?? {
        ui: {
            setDevice: () => {},
            is_dark_mode_on: false,
        },
    };
    const { setDevice, is_dark_mode_on } = ui;
    const { isDesktop, isMobile, isTablet } = useDevice();

    // Apply the theme from the ui store, which defaults to the OS preference
    // when the user hasn't explicitly chosen one (see UiStore.getInitialDarkMode).
    useEffect(() => {
        const body = document.querySelector('body');
        if (!body) return;
        if (is_dark_mode_on) {
            body.classList.remove('theme--light');
            body.classList.add('theme--dark');
        } else {
            body.classList.remove('theme--dark');
            body.classList.add('theme--light');
        }
    }, [is_dark_mode_on]);

    useEffect(() => {
        if (isMobile) {
            setDevice('mobile');
        } else if (isTablet) {
            setDevice('tablet');
        } else {
            setDevice('desktop');
        }
    }, [isDesktop, isMobile, isTablet, setDevice]);

    return <div className='main-body'>{children}</div>;
});

export default MainBody;
