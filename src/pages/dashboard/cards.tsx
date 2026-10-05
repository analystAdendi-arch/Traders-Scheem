// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
// TODO: Complete MobX integration for popup functionality
// Some code is kept commented out pending popup integration
import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import { FinBadge } from '@/components/fin-ui/FinIcon';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
/* [AI] - Analytics event tracking removed - see migrate-docs/MONITORING_PACKAGES.md for re-implementation guide */
/* [/AI] */

type TCardProps = {
    has_dashboard_strategies: boolean;
    is_mobile: boolean;
};

type TCardAccent = 'orange' | 'green' | 'purple' | 'yellow' | 'cyan';

type TCardArray = {
    id: string;
    accent: TCardAccent;
    icon: React.ReactElement;
    title: string;
    description: string;
    callback: () => void;
};

const Cards = observer(({ is_mobile, has_dashboard_strategies }: TCardProps) => {
    const { dashboard, load_modal, quick_strategy, google_drive } = useStore();
    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { is_google_drive_configured } = google_drive;
    const { isDesktop } = useDevice();
    const { onCloseDialog, dialog_options, is_dialog_open, setActiveTab, setPreviewOnPopup } = dashboard;
    const { setFormVisibility } = quick_strategy;

    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 0 : 1);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const openGoogleDriveDialog = () => {
        const google_drive_tab_index = isDesktop ? 2 : 1;
        toggleLoadModal();
        setActiveTabIndex(google_drive_tab_index); // Google Drive tab index
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const actions: TCardArray[] = [
        {
            id: 'my-computer',
            accent: 'orange',
            icon: <FinBadge name='upload' tone='red' />,
            title: localize('Upload Bot'),
            description: localize('Import a saved XML strategy and deploy it in seconds'),
            callback: openFileLoader,
        },
        {
            id: 'free-bots',
            accent: 'green',
            icon: <FinBadge name='bot' tone='white' />,
            title: localize('Free Bots'),
            description: localize('A library of automated strategies, ready to run'),
            callback: () => setActiveTab(DBOT_TABS.FREE_BOTS),
        },
        {
            id: 'bot-builder',
            accent: 'purple',
            icon: <FinBadge name='blocks' tone='purple' />,
            title: localize('Bot Editor'),
            description: localize('Design entry, exit and risk rules visually - no code'),
            callback: () => setActiveTab(DBOT_TABS.BOT_BUILDER),
        },
        {
            id: 'quick-strategy',
            accent: 'yellow',
            icon: <FinBadge name='bolt' tone='gold' />,
            title: localize('Quick Strategy'),
            description: localize('Launch a pre-built strategy template with your own limits'),
            callback: () => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                setFormVisibility(true);
            },
        },
        {
            id: 'google-drive',
            accent: 'cyan',
            icon: <FinBadge name='cloud' tone='sky' />,
            title: localize('Google Drive'),
            description: localize('Load strategies stored securely in your Google Drive'),
            callback: openGoogleDriveDialog,
        },
    ]
        // Hide the Google Drive tile when the feature isn't configured (no GD_* env vars).
        .filter(action => action.id !== 'google-drive' || is_google_drive_configured);

    return React.useMemo(
        () => (
            <div
                className={classNames('tab__dashboard__table', {
                    'tab__dashboard__table--minimized': has_dashboard_strategies && is_mobile,
                })}
            >
                <div
                    className={classNames('tab__dashboard__table__tiles', {
                        'tab__dashboard__table__tiles--minimized': has_dashboard_strategies && is_mobile,
                    })}
                    id='tab__dashboard__table__tiles'
                >
                    {actions.map(({ id, accent, icon, title, description, callback }) => (
                        <button
                            key={id}
                            id={id}
                            type='button'
                            className={classNames('db-card', `db-card--${accent}`, {
                                'db-card--compact': has_dashboard_strategies && is_mobile,
                            })}
                            onClick={callback}
                        >
                            <span className='db-card__top'>
                                <span className='db-card__icon'>{icon}</span>
                                <span className='db-card__arrow' aria-hidden='true'>
                                    →
                                </span>
                            </span>
                            <span className='db-card__title'>{title}</span>
                            <span className='db-card__description'>{description}</span>
                            <span className='db-card__open'>
                                {localize('Open')}
                                <span className='db-card__open-coin' aria-hidden='true'>
                                    →
                                </span>
                            </span>
                        </button>
                    ))}

                    {!isDesktop ? (
                        <Dialog
                            title={dialog_options.title}
                            is_visible={is_dialog_open}
                            onCancel={onCloseDialog}
                            is_mobile_full_width
                            className='dc-dialog__wrapper--google-drive'
                            has_close_icon
                        >
                            <GoogleDrive />
                        </Dialog>
                    ) : (
                        <MobileFullPageModal
                            is_modal_open={is_dialog_open}
                            className='load-strategy__wrapper'
                            header={localize('Load strategy')}
                            onClickClose={() => {
                                setPreviewOnPopup(false);
                                onCloseDialog();
                            }}
                            height_offset='80px'
                        >
                            <div label='Google Drive' className='google-drive-label'>
                                <GoogleDrive />
                            </div>
                        </MobileFullPageModal>
                    )}
                </div>
            </div>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [is_dialog_open, has_dashboard_strategies, is_google_drive_configured]
    );
});

export default Cards;
