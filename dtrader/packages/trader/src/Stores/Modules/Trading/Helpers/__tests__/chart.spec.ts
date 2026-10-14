import { ACTION, getChartAnalyticsData, STATE_TYPES, SUBFORM_NAME } from '../chart';

describe('getChartAnalyticsData', () => {
    const mocked_data = {
        indicator_type_name: 'Donchian Channel',
        indicators_category_name: 'Volatility',
        is_favorite: true,
        is_info_open: true,
        is_open: true,
        chart_type_name: 'area',
        search_string: 'test',
        symbol: 'Volatility 75 (1s) Index',
        symbol_category: 'derived-synthetics-continuous_indices',
        time_interval_name: '1 minute',
        drawing_tool_name: 'horizontal_line',
        pxthickness: '2',
        color_name: 'red',
        cta_name: 'price',
    };
    const market_type_name = mocked_data.symbol;
    const tab_market_name = mocked_data.symbol_category;
    const chart_event_type = 'ce_chart_types_form_v2';
    const market_event_type = 'ce_market_types_form_v2';
    const indicators_event_type = 'ce_indicators_types_form_v2';
    it('should return empty object if args are empty', () => {
        expect(getChartAnalyticsData('' as keyof typeof STATE_TYPES)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.CHART_TYPE_CHANGE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.CHART_TYPE_CHANGE, {
                chart_type_name: mocked_data.chart_type_name,
                time_interval_name: mocked_data.time_interval_name,
            })
        ).toEqual({
            data: {
                action: ACTION.CHOOSE_CHART_TYPE,
                chart_type_name: mocked_data.chart_type_name,
                time_interval_name: mocked_data.time_interval_name,
            },
            event_type: chart_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.CHART_TYPE_CHANGE)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.CHART_INTERVAL_CHANGE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.CHART_INTERVAL_CHANGE, {
                chart_type_name: mocked_data.chart_type_name,
                time_interval_name: mocked_data.time_interval_name,
            })
        ).toEqual({
            data: {
                action: ACTION.CHOOSE_TIME_INTERVAL,
                chart_type_name: mocked_data.chart_type_name,
                time_interval_name: mocked_data.time_interval_name,
            },
            event_type: chart_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.CHART_INTERVAL_CHANGE)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATOR_DELETED', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_DELETED, {
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.DELETE_ACTIVE,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            },
            event_type: indicators_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_DELETED)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATOR_SETTINGS_OPEN', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_SETTINGS_OPEN, {
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.EDIT_ACTIVE,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            },
            event_type: indicators_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_SETTINGS_OPEN)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATOR_INFO_TOGGLE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_INFO_TOGGLE, {
                is_info_open: mocked_data.is_info_open,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.INFO_OPEN,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            },
            event_type: indicators_event_type,
        });
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_INFO_TOGGLE, {
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.INFO_CLOSE,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            },
            event_type: indicators_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_INFO_TOGGLE)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATORS_MODAL_OPEN', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATORS_MODAL_OPEN, {
                is_open: mocked_data.is_open,
            })
        ).toEqual({
            data: { action: ACTION.OPEN },
            event_type: indicators_event_type,
        });
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATOR_ADDED', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_ADDED, {
                is_info_open: mocked_data.is_info_open,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.ADD_ACTIVE,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
                subform_name: SUBFORM_NAME.INDICATORS_INFO,
            },
            event_type: indicators_event_type,
        });
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_ADDED, {
                is_info_open: false,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.ADD_ACTIVE,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
                subform_name: SUBFORM_NAME.INDICATORS_TYPE,
            },
            event_type: indicators_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_ADDED)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATORS_CLEAR_ALL', () => {
        expect(getChartAnalyticsData(STATE_TYPES.INDICATORS_CLEAR_ALL)).toEqual({
            data: { action: ACTION.CLEAN_ALL_ACTIVE },
            event_type: indicators_event_type,
        });
    });
    it('should return correct object with data and event_type for STATE_TYPES.INDICATOR_SEARCH', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_SEARCH, {
                search_string: mocked_data.search_string,
            })
        ).toEqual({
            data: {
                action: ACTION.SEARCH,
                search_string: mocked_data.search_string,
            },
            event_type: indicators_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_SEARCH, { search_string: '' })).toEqual({});
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_SEARCH)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.MARKET_SEARCH', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.MARKET_SEARCH, {
                search_string: mocked_data.search_string,
            })
        ).toEqual({
            data: {
                action: ACTION.SEARCH,
                search_string: mocked_data.search_string,
            },
            event_type: market_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.MARKET_SEARCH)).toEqual({});
    });
    it('should return correct object with data and event_type for STATE_TYPES.SYMBOL_CHANGE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.SYMBOL_CHANGE, {
                symbol: mocked_data.symbol,
                symbol_category: mocked_data.symbol_category,
            })
        ).toEqual({
            data: {
                action: ACTION.CHOOSE_MARKET_TYPE,
                tab_market_name,
                market_type_name,
            },
            event_type: market_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.SYMBOL_CHANGE)).toEqual({
            data: {
                action: ACTION.CHOOSE_MARKET_TYPE,
                market_type_name: '',
                tab_market_name: '',
            },
            event_type: market_event_type,
        });
    });
    it('should return correct object with data and event_type for STATE_TYPES.FAVORITE_MARKETS_TOGGLE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.FAVORITE_MARKETS_TOGGLE, {
                is_favorite: mocked_data.is_favorite,
                symbol: mocked_data.symbol,
            })
        ).toEqual({
            data: {
                action: ACTION.ADD_TO_FAVORITES,
                market_type_name,
                tab_market_name: '',
            },
            event_type: market_event_type,
        });
        expect(
            getChartAnalyticsData(STATE_TYPES.FAVORITE_MARKETS_TOGGLE, {
                is_favorite: false,
                symbol: mocked_data.symbol,
            })
        ).toEqual({
            data: {
                action: ACTION.DELETE_FROM_FAVORITES,
                market_type_name,
                tab_market_name: '',
            },
            event_type: market_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.FAVORITE_MARKETS_TOGGLE)).toEqual({});
    });

    it('should return correct object with data and event_type for STATE_TYPES.CHART_MODE_MODAL_OPEN', () => {
        expect(getChartAnalyticsData(STATE_TYPES.CHART_MODE_MODAL_OPEN)).toEqual({
            data: { action: ACTION.OPEN },
            event_type: chart_event_type,
        });
    });

    it('should return correct object with data and event_type for STATE_TYPES.CHART_SWITCH_TOGGLE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.CHART_SWITCH_TOGGLE, {
                chart_type_name: mocked_data.chart_type_name,
            })
        ).toEqual({
            data: {
                action: ACTION.CHART_SMOOTHING_TOGGLE,
                chart_type_name: mocked_data.chart_type_name,
            },
            event_type: chart_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.CHART_SWITCH_TOGGLE)).toEqual({});
    });

    it('should return correct object with data and event_type for STATE_TYPES.MARKET_MENU_MODAL_TOGGLE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.MARKET_MENU_MODAL_TOGGLE, {
                is_open: true,
            })
        ).toEqual({
            data: { action: ACTION.OPEN },
            event_type: market_event_type,
        });
        expect(
            getChartAnalyticsData(STATE_TYPES.MARKET_MENU_MODAL_TOGGLE, {
                is_open: false,
            })
        ).toEqual({
            data: { action: ACTION.CLOSE },
            event_type: market_event_type,
        });
    });

    it('should return correct object with data and event_type for STATE_TYPES.INDICATOR_EDITED', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.INDICATOR_EDITED, {
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            })
        ).toEqual({
            data: {
                action: ACTION.EDIT_ACTIVE,
                indicator_type_name: mocked_data.indicator_type_name,
                indicators_category_name: mocked_data.indicators_category_name,
            },
            event_type: indicators_event_type,
        });
        expect(getChartAnalyticsData(STATE_TYPES.INDICATOR_EDITED)).toEqual({});
    });
});

describe('getChartAnalyticsData for crosshair events', () => {
    const mocked_data = {
        cta_name: 'price',
    };
    const crosshair_event_type = 'ce_crosshair_v2';

    it('should return correct object with data and event_type for STATE_TYPES.CROSSHAIR_CLICK', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.CROSSHAIR_CLICK, {
                cta_name: mocked_data.cta_name,
            })
        ).toEqual({
            data: {
                action: ACTION.CROSSHAIR_CLICK,
                cta_name: mocked_data.cta_name,
            },
            event_type: crosshair_event_type,
        });
    });
});

describe('getChartAnalyticsData for drawing tools events', () => {
    const mocked_data = {
        drawing_tool_name: 'horizontal_line',
        pxthickness: '2',
        color_name: 'red',
    };
    const drawing_tools_event_type = 'ce_drawing_tools_form_v2';

    it('should return correct object with data and event_type for STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN', () => {
        expect(getChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN)).toEqual({
            data: { action: ACTION.OPEN },
            event_type: drawing_tools_event_type,
        });
    });

    it('should return correct object with data and event_type for STATE_TYPES.DRAWING_TOOLS_ADD', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_ADD, {
                drawing_tool_name: mocked_data.drawing_tool_name,
                pxthickness: mocked_data.pxthickness,
                color_name: mocked_data.color_name,
            })
        ).toEqual({
            data: {
                action: ACTION.ADD_DRAWING_TOOL,
                drawing_tool_name: mocked_data.drawing_tool_name,
                pxthickness: mocked_data.pxthickness,
                color_name: mocked_data.color_name,
            },
            event_type: drawing_tools_event_type,
        });
    });

    it('should return correct object with data and event_type for STATE_TYPES.DRAWING_TOOLS_DELETE', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_DELETE, {
                drawing_tool_name: mocked_data.drawing_tool_name,
                pxthickness: mocked_data.pxthickness,
                color_name: mocked_data.color_name,
            })
        ).toEqual({
            data: {
                action: ACTION.DELETE_DRAWING_TOOL,
                drawing_tool_name: mocked_data.drawing_tool_name,
                pxthickness: mocked_data.pxthickness,
                color_name: mocked_data.color_name,
            },
            event_type: drawing_tools_event_type,
        });
    });

    it('should return correct object with data and event_type for STATE_TYPES.DRAWING_TOOLS_EDIT_PX', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_EDIT_PX, {
                drawing_tool_name: mocked_data.drawing_tool_name,
                pxthickness: mocked_data.pxthickness,
            })
        ).toEqual({
            data: {
                action: ACTION.EDIT_DRAWING_TOOL_PX,
                drawing_tool_name: mocked_data.drawing_tool_name,
                pxthickness: mocked_data.pxthickness,
            },
            event_type: drawing_tools_event_type,
        });
    });

    it('should return correct object with data and event_type for STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR', () => {
        expect(
            getChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR, {
                drawing_tool_name: mocked_data.drawing_tool_name,
                color_name: mocked_data.color_name,
            })
        ).toEqual({
            data: {
                action: ACTION.EDIT_DRAWING_TOOL_COLOR,
                drawing_tool_name: mocked_data.drawing_tool_name,
                color_name: mocked_data.color_name,
            },
            event_type: drawing_tools_event_type,
        });
    });
});
