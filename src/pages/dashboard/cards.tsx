// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
// TODO: Complete MobX integration for popup functionality
// Some code is kept commented out pending popup integration
import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
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

const Glyph = ({ children }: { children: React.ReactNode }) => (
    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        {children}
    </svg>
);

const FolderGlyph = () => (
    <Glyph>
        <path d='M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z' fill='#fbbf24' />
        <path d='M3 10h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z' fill='#f59e0b' />
    </Glyph>
);

const RobotGlyph = () => (
    <Glyph>
        <rect x='4' y='8' width='16' height='11' rx='3' fill='#c4b5fd' />
        <rect x='11' y='3' width='2' height='5' rx='1' fill='#a78bfa' />
        <circle cx='9' cy='13' r='1.8' fill='#1e1b4b' />
        <circle cx='15' cy='13' r='1.8' fill='#1e1b4b' />
        <rect x='9' y='16' width='6' height='1.5' rx='0.75' fill='#1e1b4b' />
    </Glyph>
);

const PuzzleGlyph = () => (
    <Glyph>
        <path
            d='M10 3a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v3h1a2 2 0 1 1 0 4h-1v3a1 1 0 0 1-1 1h-3v-1a2 2 0 1 0-4 0v1H5a1 1 0 0 1-1-1v-3h1a2 2 0 1 0 0-4H4V7a1 1 0 0 1 1-1h3V5a2 2 0 0 1 2-2z'
            fill='#86efac'
        />
    </Glyph>
);

const BoltGlyph = () => (
    <Glyph>
        <path d='M13 2 4 14h7l-1 8 9-12h-7l1-8z' fill='#fb923c' />
    </Glyph>
);

const CloudGlyph = () => (
    <Glyph>
        <path d='M7 18a5 5 0 1 1 1.2-9.85A6 6 0 0 1 20 10a4 4 0 0 1-1 7.9V18H7z' fill='#67e8f9' />
    </Glyph>
);

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
            icon: <FolderGlyph />,
            title: localize('Upload Bot'),
            description: localize('Import an XML bot from your computer'),
            callback: openFileLoader,
        },
        {
            id: 'free-bots',
            accent: 'green',
            icon: <RobotGlyph />,
            title: localize('Free Bots'),
            description: localize('Browse ready-made trading strategies'),
            callback: () => setActiveTab(DBOT_TABS.FREE_BOTS),
        },
        {
            id: 'bot-builder',
            accent: 'purple',
            icon: <PuzzleGlyph />,
            title: localize('Bot Editor'),
            description: localize('Build a custom bot with the visual editor'),
            callback: () => setActiveTab(DBOT_TABS.BOT_BUILDER),
        },
        {
            id: 'quick-strategy',
            accent: 'yellow',
            icon: <BoltGlyph />,
            title: localize('Quick Strategy'),
            description: localize('Start fast with a pre-built strategy template'),
            callback: () => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                setFormVisibility(true);
            },
        },
        {
            id: 'google-drive',
            accent: 'cyan',
            icon: <CloudGlyph />,
            title: localize('Google Drive'),
            description: localize('Load a bot saved in your Google Drive'),
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
                            <span className='db-card__open'>{localize('Open')} →</span>
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
