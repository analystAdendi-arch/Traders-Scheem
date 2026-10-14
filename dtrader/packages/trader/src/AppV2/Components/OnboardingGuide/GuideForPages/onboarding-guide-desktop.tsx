import React from 'react';

import { useLocalStorageData } from '@deriv/api';
import { Modal } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import GuideContainer from './guide-container';
import DESKTOP_STEPS from './steps-config-desktop';

import './onboarding-guide-desktop.scss';

type TOnboardingGuideDesktopProps = {
    callback?: () => void;
    type?: 'trade_page' | 'positions_page';
};

const OnboardingGuideDesktop = ({ type = 'trade_page', callback }: TOnboardingGuideDesktopProps) => {
    const { isDesktop } = useDevice();
    const [is_modal_open, setIsModalOpen] = React.useState(false);
    const [should_run_guide, setShouldRunGuide] = React.useState(false);
    const guide_timeout_ref = React.useRef<ReturnType<typeof setTimeout>>();

    // Desktop onboarding uses its own key, separate from mobile
    const [guide_dtrader_v2_desktop, setGuideDtraderV2Desktop] = useLocalStorageData<Record<string, boolean>>(
        'guide_dtrader_v2_desktop',
        {
            trade_page: false,
            positions_page: false,
        }
    );

    // Read the mobile key to check if user already saw the mobile onboarding
    const [guide_dtrader_v2] = useLocalStorageData<Record<string, boolean>>('guide_dtrader_v2', {
        trade_types_selection: false,
        trade_page: false,
        positions_page: false,
    });

    // Read the returning-user desktop key to avoid showing both onboardings
    const [guide_dtrader_v2_desktop_returning] = useLocalStorageData<Record<string, boolean>>(
        'guide_dtrader_v2_desktop_returning',
        {
            trade_page: false,
            positions_page: false,
        }
    );

    // Only show desktop onboarding to truly new users who haven't seen any onboarding
    const has_seen_mobile_onboarding = !!guide_dtrader_v2?.[type];
    const has_seen_desktop_onboarding = !!guide_dtrader_v2_desktop?.[type];
    const has_seen_returning_desktop_onboarding = !!guide_dtrader_v2_desktop_returning?.[type];

    const onGuideStart = React.useCallback(() => {
        setShouldRunGuide(true);
        setIsModalOpen(false);
    }, []);

    const onFinishGuide = React.useCallback(() => {
        setShouldRunGuide(false);
        setGuideDtraderV2Desktop({ ...guide_dtrader_v2_desktop, [type]: true });
        callback?.();
    }, [setGuideDtraderV2Desktop, guide_dtrader_v2_desktop, type, callback]);

    const onSkipGuide = React.useCallback(() => {
        setIsModalOpen(false);
        setGuideDtraderV2Desktop({ ...guide_dtrader_v2_desktop, [type]: true });
        callback?.();
    }, [setGuideDtraderV2Desktop, guide_dtrader_v2_desktop, type, callback]);

    React.useEffect(() => {
        if (!isDesktop) return;

        // Show only for new users who haven't seen any onboarding (mobile, desktop, or returning)
        if (!has_seen_mobile_onboarding && !has_seen_desktop_onboarding && !has_seen_returning_desktop_onboarding) {
            guide_timeout_ref.current = setTimeout(() => setIsModalOpen(true), 800);
        }

        return () => clearTimeout(guide_timeout_ref.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [has_seen_mobile_onboarding, has_seen_desktop_onboarding, has_seen_returning_desktop_onboarding, isDesktop]);

    if (!isDesktop) return null;

    return (
        <React.Fragment>
            <Modal
                isOpened={is_modal_open}
                toggleModal={onSkipGuide}
                primaryButtonLabel={<Localize i18n_default_text="Let's begin" />}
                primaryButtonCallback={onGuideStart}
                shouldCloseOnPrimaryButtonClick
                showCrossIcon
                className='onboarding-guide-desktop'
            >
                <Modal.Body className='onboarding-guide-desktop__body'>
                    <h2 className='onboarding-guide-desktop__title'>
                        <Localize i18n_default_text='Welcome to the new Deriv Trader' />
                    </h2>
                    <p className='onboarding-guide-desktop__description'>
                        <Localize i18n_default_text="Enjoy a smoother, more intuitive trading experience. Here's a quick tour to get you started." />
                    </p>
                </Modal.Body>
            </Modal>
            <GuideContainer should_run={should_run_guide} onFinishGuide={onFinishGuide} custom_steps={DESKTOP_STEPS} />
        </React.Fragment>
    );
};

export default React.memo(OnboardingGuideDesktop);
