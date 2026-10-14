import React from 'react';

import { useLocalStorageData } from '@deriv/api';
import { Modal } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import GuideContainer from './guide-container';
import OnboardingVideo from './onboarding-video';

type TOnboardingGuideProps = {
    callback?: () => void;
    is_dark_mode_on?: boolean;
    type?: 'trade_page' | 'positions_page';
};

// Configuration for partial guide flows (single or multiple steps)
type TPartialGuideConfig = {
    step_indices: number[]; // Which steps to show (e.g., [3] for single step, [3, 4] for two steps)
    storage_key: string; // localStorage key to track if seen
    show_modal?: boolean; // Whether to show initial modal (default: false for partial guides)
};

const PARTIAL_GUIDE_CONFIGS: Record<string, TPartialGuideConfig> = {
    trade_page: {
        step_indices: [3], // Trade Parameters step
        storage_key: 'trade_param_guide',
        show_modal: false,
    },
};

const OnboardingGuide = ({ type = 'trade_page', is_dark_mode_on, callback }: TOnboardingGuideProps) => {
    const { isMobile } = useDevice();
    const [is_modal_open, setIsModalOpen] = React.useState(false);
    const [should_run_guide, setShouldRunGuide] = React.useState(false);
    const guide_timeout_ref = React.useRef<ReturnType<typeof setTimeout>>();
    const is_button_clicked_ref = React.useRef(false);

    const [guide_dtrader_v2, setGuideDtraderV2] = useLocalStorageData<Record<string, boolean>>('guide_dtrader_v2', {
        trade_types_selection: false,
        trade_page: false,
        positions_page: false,
    });

    // Get partial guide config for this page type
    const partial_guide_config = PARTIAL_GUIDE_CONFIGS[type];
    const [partial_guide_seen, setPartialGuideSeen] = useLocalStorageData<boolean>(
        partial_guide_config?.storage_key || 'default_partial_guide',
        false
    );

    const is_trade_page_guide = type === 'trade_page';
    // For returning users: show partial guide after main onboarding is completed
    const should_show_partial_guide = partial_guide_config && guide_dtrader_v2?.[type] && !partial_guide_seen;

    const onFinishGuide = React.useCallback(() => {
        setShouldRunGuide(false);
        setGuideDtraderV2({ ...guide_dtrader_v2, [type]: true });
        // Mark partial guide as seen if it exists for this page
        if (partial_guide_config) {
            setPartialGuideSeen(true);
        }
        callback?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setGuideDtraderV2, setPartialGuideSeen, partial_guide_config]);

    const onGuideSkip = () => {
        if (is_button_clicked_ref.current) return;
        onFinishGuide();
        setIsModalOpen(false);
    };

    const onGuideStart = () => {
        is_button_clicked_ref.current = true;
        setShouldRunGuide(true);
        setIsModalOpen(false);
    };

    const modal_content = {
        image: !is_trade_page_guide ? <OnboardingVideo type={is_dark_mode_on ? `${type}_dark` : type} /> : undefined,
        title: <Localize i18n_default_text='View your positions' />,
        content: (
            <Localize i18n_default_text='You can view your open and closed positions here. Tap an item for more details.' />
        ),
        button_label: <Localize i18n_default_text='Got it' />,
        primaryButtonCallback: onGuideSkip,
        ...(is_trade_page_guide
            ? {
                  title: <Localize i18n_default_text='Welcome to Deriv Trader' />,
                  content: (
                      <Localize i18n_default_text='Enjoy a smooth, intuitive trading experience. Here’s a quick tour to get you started.' />
                  ),
                  button_label: <Localize i18n_default_text="Let's begin" />,
                  primaryButtonCallback: onGuideStart,
              }
            : {}),
    };

    React.useEffect(() => {
        // Only show onboarding for mobile users
        if (!isMobile) return;

        clearTimeout(guide_timeout_ref.current);

        // For new users: show modal to start full onboarding
        if (!guide_dtrader_v2?.[type]) {
            guide_timeout_ref.current = setTimeout(() => setIsModalOpen(true), 800);
        }
        // For returning users: show partial guide (single or multiple steps) directly
        else if (should_show_partial_guide) {
            guide_timeout_ref.current = setTimeout(() => setShouldRunGuide(true), 800);
        }

        return () => clearTimeout(guide_timeout_ref.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guide_dtrader_v2?.[type], should_show_partial_guide, isMobile]);

    // Only show onboarding for mobile users
    if (!isMobile) return null;

    return (
        <React.Fragment>
            <Modal
                isOpened={is_modal_open}
                isNonExpandable
                isMobile
                showHandleBar
                shouldCloseModalOnSwipeDown
                toggleModal={onGuideSkip}
                primaryButtonLabel={modal_content.button_label}
                primaryButtonCallback={modal_content.primaryButtonCallback}
            >
                <Modal.Header image={modal_content.image} title={modal_content.title} />
                <Modal.Body>{modal_content.content}</Modal.Body>
            </Modal>
            {is_trade_page_guide && (
                <GuideContainer
                    should_run={should_run_guide}
                    onFinishGuide={onFinishGuide}
                    step_indices={should_show_partial_guide ? partial_guide_config.step_indices : undefined}
                />
            )}
        </React.Fragment>
    );
};

export default React.memo(OnboardingGuide);
