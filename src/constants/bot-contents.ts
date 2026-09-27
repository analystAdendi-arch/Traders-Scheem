type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TUTORIAL: 3,
    FREE_BOTS: 4,
    AUTO_TRADER: 5,
    ANALYSIS_TOOL: 6,
    SCANNER: 7,
    MANUAL_TRADER: 8,
    BULK_TRADER: 9,
    COPY_TRADER: 10,
    TRADING_VIEW: 11,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-tutorials',
    'id-free-bots',
    'id-auto-trader',
    'id-analysis-tool',
    'id-scanner',
    'id-manual-trader',
    'id-bulk-trader',
    'id-copy-trader',
    'id-trading-view',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
