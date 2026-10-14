import React from 'react';

import { useLocalStorageData } from '@deriv/api';
import { Modal } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import GuideContainer from './guide-container';
import RETURNING_DESKTOP_STEPS from './steps-config-desktop-returning';

import './onboarding-guide-desktop.scss';

type TOnboardingGuideDesktopReturningProps = {
    callback?: () => void;
    type?: 'trade_page' | 'positions_page';
};

const OnboardingGuideDesktopReturning = ({ type = 'trade_page', callback }: TOnboardingGuideDesktopReturningProps) => {
    const { isDesktop } = useDevice();
    const [is_modal_open, setIsModalOpen] = React.useState(false);
    const [should_run_guide, setShouldRunGuide] = React.useState(false);
    const guide_timeout_ref = React.useRef<ReturnType<typeof setTimeout>>();

    // Returning-user desktop onboarding key
    const [guide_dtrader_v2_desktop_returning, setGuideDtraderV2DesktopReturning] = useLocalStorageData<
        Record<string, boolean>
    >('guide_dtrader_v2_desktop_returning', {
        trade_page: false,
        positions_page: false,
    });

    // Check mobile onboarding key (must have seen it)
    const [guide_dtrader_v2] = useLocalStorageData<Record<string, boolean>>('guide_dtrader_v2', {
        trade_types_selection: false,
        trade_page: false,
        positions_page: false,
    });

    // Check new-user desktop onboarding key (must NOT have seen it)
    const [guide_dtrader_v2_desktop] = useLocalStorageData<Record<string, boolean>>('guide_dtrader_v2_desktop', {
        trade_page: false,
        positions_page: false,
    });

    const has_seen_mobile_onboarding = !!guide_dtrader_v2?.[type];
    const has_seen_new_user_desktop_onboarding = !!guide_dtrader_v2_desktop?.[type];
    const has_seen_returning_desktop_onboarding = !!guide_dtrader_v2_desktop_returning?.[type];

    const onGuideStart = React.useCallback(() => {
        setShouldRunGuide(true);
        setIsModalOpen(false);
    }, []);

    const onFinishGuide = React.useCallback(() => {
        setShouldRunGuide(false);
        setGuideDtraderV2DesktopReturning({ ...guide_dtrader_v2_desktop_returning, [type]: true });
        callback?.();
    }, [setGuideDtraderV2DesktopReturning, guide_dtrader_v2_desktop_returning, type, callback]);

    const onSkipGuide = React.useCallback(() => {
        setIsModalOpen(false);
        setGuideDtraderV2DesktopReturning({ ...guide_dtrader_v2_desktop_returning, [type]: true });
        callback?.();
    }, [setGuideDtraderV2DesktopReturning, guide_dtrader_v2_desktop_returning, type, callback]);

    React.useEffect(() => {
        if (!isDesktop) return;

        // Show only for returning users: saw mobile onboarding, didn't see either desktop onboarding
        if (
            has_seen_mobile_onboarding &&
            !has_seen_new_user_desktop_onboarding &&
            !has_seen_returning_desktop_onboarding
        ) {
            guide_timeout_ref.current = setTimeout(() => setIsModalOpen(true), 800);
        }

        return () => clearTimeout(guide_timeout_ref.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        has_seen_mobile_onboarding,
        has_seen_new_user_desktop_onboarding,
        has_seen_returning_desktop_onboarding,
        isDesktop,
    ]);

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
                        <Localize i18n_default_text="What's new in Deriv Trader" />
                    </h2>
                    <p className='onboarding-guide-desktop__description'>
                        <Localize i18n_default_text="We've updated the trading experience to make it smoother and easier to use." />
                    </p>
                </Modal.Body>
            </Modal>
            <GuideContainer
                should_run={should_run_guide}
                onFinishGuide={onFinishGuide}
                custom_steps={RETURNING_DESKTOP_STEPS}
            />
        </React.Fragment>
    );
};

export default React.memo(OnboardingGuideDesktopReturning);
