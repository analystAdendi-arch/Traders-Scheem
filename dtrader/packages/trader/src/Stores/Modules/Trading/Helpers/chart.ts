export type TPayload = {
    data: Partial<Record<string, unknown>> & {
        action: string;
    };
    event_type:
        | 'ce_chart_types_form_v2'
        | 'ce_market_types_form_v2'
        | 'ce_indicators_types_form_v2'
        | 'ce_drawing_tools_form_v2'
        | 'ce_crosshair_v2';
};

type TStateChangeOption = {
    indicator_type_name?: string;
    indicators_category_name?: string;
    isClosed?: boolean;
    is_favorite?: boolean;
    is_info_open?: boolean;
    is_open?: boolean;
    chart_type_name?: string;
    search_string?: string;
    symbol?: string;
    symbol_category?: string;
    time_interval_name?: string;
    drawing_tool_name?: string;
    pxthickness?: string;
    color_name?: string;
    cta_name?: string;
};

export const ACTION = {
    ADD_ACTIVE: 'add_active',
    ADD_TO_FAVORITES: 'add_to_favorites',
    CHOOSE_CHART_TYPE: 'choose_chart_type',
    CHOOSE_MARKET_TYPE: 'choose_market_type',
    CHOOSE_TIME_INTERVAL: 'choose_time_interval',
    CLEAN_ALL_ACTIVE: 'clean_all_active',
    CLOSE: 'close',
    DELETE_ACTIVE: 'delete_active',
    DELETE_FROM_FAVORITES: 'delete_from_favorites',
    EDIT_ACTIVE: 'edit_active',
    INFO_OPEN: 'info_open',
    INFO_CLOSE: 'info_close',
    INFO_REDIRECT: 'info_redirect',
    OPEN: 'open',
    SEARCH: 'search',
    ADD_DRAWING_TOOL: 'add',
    DELETE_DRAWING_TOOL: 'delete',
    EDIT_DRAWING_TOOL_PX: 'edit_px',
    EDIT_DRAWING_TOOL_COLOR: 'edit_color',
    CROSSHAIR_CLICK: 'click',
    CHART_SMOOTHING_TOGGLE: 'switch_toggle',
} as const;

export const STATE_TYPES = {
    CHART_MODE_MODAL_OPEN: 'CHART_MODE_MODAL_OPEN',
    CHART_INTERVAL_CHANGE: 'CHART_INTERVAL_CHANGE',
    CHART_TYPE_CHANGE: 'CHART_TYPE_CHANGE',
    CHART_SWITCH_TOGGLE: 'CHART_SWITCH_TOGGLE',
    MARKET_MENU_MODAL_TOGGLE: 'MARKET_MENU_MODAL_TOGGLE',
    FAVORITE_MARKETS_TOGGLE: 'FAVORITE_MARKETS_TOGGLE',
    INDICATOR_ADDED: 'INDICATOR_ADDED',
    INDICATOR_DELETED: 'INDICATOR_DELETED',
    INDICATOR_EDITED: 'INDICATOR_EDITED',
    INDICATOR_INFO_TOGGLE: 'INDICATOR_INFO_TOGGLE',
    INDICATOR_SEARCH: 'INDICATOR_SEARCH',
    INDICATOR_SETTINGS_OPEN: 'INDICATOR_SETTINGS_OPEN',
    INDICATORS_CLEAR_ALL: 'INDICATORS_CLEAR_ALL',
    INDICATORS_MODAL_OPEN: 'INDICATORS_MODAL_OPEN',
    INITIAL: 'INITIAL',
    MARKET_SEARCH: 'MARKET_SEARCH',
    MARKET_STATE_CHANGE: 'MARKET_STATE_CHANGE',
    READY: 'READY',
    SCROLL_TO_LEFT: 'SCROLL_TO_LEFT',
    SET_CHART_MODE: 'SET_CHART_MODE',
    SYMBOL_CHANGE: 'SYMBOL_CHANGE',
    DRAWING_TOOLS_OPEN: 'DRAWING_TOOLS_OPEN',
    DRAWING_TOOLS_ADD: 'DRAWING_TOOLS_ADD',
    DRAWING_TOOLS_DELETE: 'DRAWING_TOOLS_DELETE',
    DRAWING_TOOLS_EDIT_PX: 'DRAWING_TOOLS_EDIT_PX',
    DRAWING_TOOLS_EDIT_COLOR: 'DRAWING_TOOLS_EDIT_COLOR',
    DRAWING_TOOLS_MODAL_OPEN: 'DRAWING_TOOLS_MODAL_OPEN',
    CROSSHAIR_CLICK: 'CROSSHAIR_CLICK',
} as const;

export const SUBFORM_NAME = {
    INDICATORS_INFO: 'indicators_info',
    INDICATORS_TYPE: 'indicators_type',
} as const;

const getChartTypeFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TStateChangeOption = {}) => {
    const { chart_type_name = '', time_interval_name } = option;
    const chart_event_type = 'ce_chart_types_form_v2';

    if (state === STATE_TYPES.CHART_MODE_MODAL_OPEN) {
        return {
            data: { action: ACTION.OPEN },
            event_type: chart_event_type,
        };
    }

    const payload: TPayload = {
        data: {
            action: '',
            chart_type_name,
            time_interval_name,
        },
        event_type: chart_event_type,
    };
    if (!chart_type_name) return {};
    switch (state) {
        case STATE_TYPES.CHART_INTERVAL_CHANGE:
            payload.data.action = ACTION.CHOOSE_TIME_INTERVAL;
            break;
        case STATE_TYPES.CHART_TYPE_CHANGE:
            payload.data.action = ACTION.CHOOSE_CHART_TYPE;
            break;
        case STATE_TYPES.CHART_SWITCH_TOGGLE:
            payload.data.action = ACTION.CHART_SMOOTHING_TOGGLE;
            break;
        default:
            return {};
    }
    return payload;
};

const getCrossHairAnalyticsData = (state: keyof typeof STATE_TYPES, option: TStateChangeOption = {}) => {
    const { cta_name = '' } = option;
    const chart_event_type = 'ce_crosshair_v2';
    const payload = {
        data: {
            cta_name,
            action: '',
        },
        event_type: chart_event_type,
    } as TPayload;
    switch (state) {
        case STATE_TYPES.CROSSHAIR_CLICK:
            payload.data.action = ACTION.CROSSHAIR_CLICK;
            break;
        default:
            return {};
    }
    return payload;
};

const getIndicatorTypeFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TStateChangeOption = {}) => {
    const { indicator_type_name = '', indicators_category_name = '', is_info_open, is_open, search_string } = option;
    const indicators_event_type = 'ce_indicators_types_form_v2';
    const indicators_subform = is_info_open ? SUBFORM_NAME.INDICATORS_INFO : SUBFORM_NAME.INDICATORS_TYPE;
    const info_open_close_action = is_info_open ? ACTION.INFO_OPEN : ACTION.INFO_CLOSE;
    const payload = {
        event_type: indicators_event_type,
    } as TPayload;
    if (
        (state === STATE_TYPES.INDICATOR_SEARCH && !option.search_string) ||
        ((state === STATE_TYPES.INDICATOR_ADDED ||
            state === STATE_TYPES.INDICATOR_DELETED ||
            state === STATE_TYPES.INDICATOR_EDITED ||
            state === STATE_TYPES.INDICATOR_INFO_TOGGLE ||
            state === STATE_TYPES.INDICATOR_SETTINGS_OPEN) &&
            !indicator_type_name)
    ) {
        return {};
    }
    switch (state) {
        case STATE_TYPES.INDICATOR_ADDED:
            payload.data = {
                action: ACTION.ADD_ACTIVE,
                indicator_type_name,
                indicators_category_name,
                subform_name: indicators_subform,
            };
            break;
        case STATE_TYPES.INDICATOR_DELETED:
            payload.data = {
                action: ACTION.DELETE_ACTIVE,
                indicator_type_name,
                indicators_category_name,
            };
            break;
        case STATE_TYPES.INDICATOR_EDITED:
            payload.data = {
                action: ACTION.EDIT_ACTIVE,
                indicator_type_name,
                indicators_category_name,
            };
            break;
        case STATE_TYPES.INDICATOR_INFO_TOGGLE:
            payload.data = {
                action: info_open_close_action,
                indicator_type_name,
                indicators_category_name,
            };
            break;
        case STATE_TYPES.INDICATOR_SEARCH:
            payload.data = {
                action: ACTION.SEARCH,
                search_string,
            };
            break;
        case STATE_TYPES.INDICATOR_SETTINGS_OPEN:
            payload.data = {
                action: ACTION.EDIT_ACTIVE,
                indicator_type_name,
                indicators_category_name,
            };
            break;
        case STATE_TYPES.INDICATORS_MODAL_OPEN:
            payload.data = {
                action: ACTION.OPEN,
            };

            break;
        case STATE_TYPES.INDICATORS_CLEAR_ALL:
            payload.data = {
                action: ACTION.CLEAN_ALL_ACTIVE,
            };
            break;
        default:
            return {};
    }
    return payload;
};

const getMarketTypeFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TStateChangeOption = {}) => {
    const { is_favorite, symbol_category: tab_market_name = '', search_string, symbol: market_type_name = '' } = option;
    const market_event_type = 'ce_market_types_form_v2';
    const favorites_action = is_favorite ? ACTION.ADD_TO_FAVORITES : ACTION.DELETE_FROM_FAVORITES;
    const payload = {
        event_type: market_event_type,
    } as TPayload;
    if (
        (state === STATE_TYPES.MARKET_SEARCH && !option.search_string) ||
        (state === STATE_TYPES.FAVORITE_MARKETS_TOGGLE && !market_type_name)
    ) {
        return {};
    }
    switch (state) {
        case STATE_TYPES.MARKET_MENU_MODAL_TOGGLE:
            payload.data = {
                action: option.is_open ? ACTION.OPEN : ACTION.CLOSE,
            };
            break;
        case STATE_TYPES.FAVORITE_MARKETS_TOGGLE:
            payload.data = {
                action: favorites_action,
                market_type_name,
                tab_market_name,
            };
            break;
        case STATE_TYPES.MARKET_SEARCH:
            payload.data = {
                action: ACTION.SEARCH,
                search_string,
            };
            break;
        case STATE_TYPES.SYMBOL_CHANGE:
            payload.data = {
                action: ACTION.CHOOSE_MARKET_TYPE,
                market_type_name,
                tab_market_name,
            };
            break;
        default:
            return {};
    }
    return payload;
};

const getDrawingToolsFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TStateChangeOption = {}) => {
    const { drawing_tool_name = '', pxthickness = '', color_name = '' } = option;
    const drawing_tools_event_type = 'ce_drawing_tools_form_v2';
    const payload = {
        event_type: drawing_tools_event_type,
    } as TPayload;

    switch (state) {
        case STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN:
            payload.data = {
                action: ACTION.OPEN,
            };
            break;
        case STATE_TYPES.DRAWING_TOOLS_ADD:
            payload.data = {
                action: ACTION.ADD_DRAWING_TOOL,
                drawing_tool_name,
                pxthickness,
                color_name,
            };
            break;
        case STATE_TYPES.DRAWING_TOOLS_DELETE:
            payload.data = {
                action: ACTION.DELETE_DRAWING_TOOL,
                drawing_tool_name,
                pxthickness,
                color_name,
            };
            break;
        case STATE_TYPES.DRAWING_TOOLS_EDIT_PX:
            payload.data = {
                action: ACTION.EDIT_DRAWING_TOOL_PX,
                drawing_tool_name,
                pxthickness,
            };
            break;
        case STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR:
            payload.data = {
                action: ACTION.EDIT_DRAWING_TOOL_COLOR,
                drawing_tool_name,
                color_name,
            };
            break;
        default:
            return {};
    }
    return payload;
};

export const getChartAnalyticsData = (state: keyof typeof STATE_TYPES, option: TStateChangeOption = {}) => {
    const chart_type_form_events: string[] = [
        STATE_TYPES.CHART_INTERVAL_CHANGE,
        STATE_TYPES.CHART_TYPE_CHANGE,
        STATE_TYPES.CHART_MODE_MODAL_OPEN,
        STATE_TYPES.CHART_SWITCH_TOGGLE,
    ];
    const indicator_type_form_events: string[] = [
        STATE_TYPES.INDICATOR_ADDED,
        STATE_TYPES.INDICATOR_DELETED,
        STATE_TYPES.INDICATOR_EDITED,
        STATE_TYPES.INDICATOR_INFO_TOGGLE,
        STATE_TYPES.INDICATOR_SEARCH,
        STATE_TYPES.INDICATOR_SETTINGS_OPEN,
        STATE_TYPES.INDICATORS_CLEAR_ALL,
        STATE_TYPES.INDICATORS_MODAL_OPEN,
    ];
    const market_type_form_events: string[] = [
        STATE_TYPES.FAVORITE_MARKETS_TOGGLE,
        STATE_TYPES.MARKET_SEARCH,
        STATE_TYPES.SYMBOL_CHANGE,
        STATE_TYPES.MARKET_MENU_MODAL_TOGGLE,
    ];
    const drawing_tools_form_events: string[] = [
        STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN,
        STATE_TYPES.DRAWING_TOOLS_ADD,
        STATE_TYPES.DRAWING_TOOLS_DELETE,
        STATE_TYPES.DRAWING_TOOLS_EDIT_PX,
        STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR,
    ];
    const crosshair_events: string[] = [STATE_TYPES.CROSSHAIR_CLICK];
    if (crosshair_events.includes(state)) return getCrossHairAnalyticsData(state, option);
    if (chart_type_form_events.includes(state)) return getChartTypeFormAnalyticsData(state, option);
    if (indicator_type_form_events.includes(state)) return getIndicatorTypeFormAnalyticsData(state, option);
    if (market_type_form_events.includes(state)) return getMarketTypeFormAnalyticsData(state, option);
    if (drawing_tools_form_events.includes(state)) return getDrawingToolsFormAnalyticsData(state, option);
    return {};
};
