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
    ANALYSIS_TOOL: 5,
    SCANNER: 6,
    AUTO_TRADER: 7,
    MANUAL_TRADER: 8,
    TRADING_VIEW: 9,
    BULK_TRADER: 10,
    COPY_TRADER: 11,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-tutorials',
    'id-free-bots',
    'id-analysis-tool',
    'id-scanner',
    'id-auto-trader',
    'id-manual-trader',
    'id-trading-view',
    'id-bulk-trader',
    'id-copy-trader',
];

export const DEBOUNCE_INTERVAL_TIME = 500;
