import React from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

import { Localize } from '@deriv-com/translations';

import GuideTooltip from './guide-tooltip';
import STEPS from './steps-config';

type TGuideContainerProps = {
    should_run: boolean;
    onFinishGuide: () => void;
    step_indices?: number[]; // If provided, show only these steps (e.g., [3] for single, [3, 4] for multiple)
    custom_steps?: Step[]; // [AI] If provided, use these steps instead of the default mobile STEPS
};

type TFinishedStatuses = CallBackProps['status'][];

const GuideContainer = ({ should_run, onFinishGuide, step_indices, custom_steps }: TGuideContainerProps) => {
    const [step_index, setStepIndex] = React.useState(0);
    const base_steps = custom_steps ?? STEPS;
    const is_partial_guide = step_indices !== undefined && step_indices.length > 0;
    const is_single_step = is_partial_guide && step_indices.length === 1;

    // For partial guides, filter and customize steps
    const steps = React.useMemo(() => {
        if (is_partial_guide) {
            const partial_steps = step_indices.map(index => {
                const step = { ...base_steps[index] };
                // Customize title for single-step trade params tooltip
                if (is_single_step && index === 3) {
                    step.title = <Localize i18n_default_text='Trade Parameters' />;
                }
                return step;
            });
            return partial_steps;
        }
        return base_steps;
    }, [is_partial_guide, is_single_step, step_indices, base_steps]);

    const callbackHandle = (data: CallBackProps) => {
        const { status, step, index } = data;
        if (index === 0) {
            step.disableBeacon = true;
        }
        const finished_statuses: TFinishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finished_statuses.includes(status)) onFinishGuide();
    };

    return (
        <Joyride
            continuous={!is_single_step}
            callback={callbackHandle}
            disableCloseOnEsc
            disableOverlayClose
            disableScrolling
            floaterProps={{
                styles: {
                    arrow: {
                        length: 4,
                        spread: 8,
                    },
                },
            }}
            run={should_run}
            showSkipButton={!is_single_step}
            steps={steps}
            spotlightPadding={0}
            scrollToFirstStep
            styles={{
                options: {
                    arrowColor: 'var(--component-textIcon-normal-prominent)',
                    overlayColor: 'var(--core-color-opacity-black-600)',
                },
                spotlight: {
                    borderRadius: 'unset',
                },
            }}
            stepIndex={step_index}
            tooltipComponent={props => (
                <GuideTooltip {...props} setStepIndex={setStepIndex} is_single_step={is_single_step} />
            )}
        />
    );
};

export default React.memo(GuideContainer);
