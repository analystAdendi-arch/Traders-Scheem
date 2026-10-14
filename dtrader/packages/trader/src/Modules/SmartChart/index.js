import { getUrlBase } from '@deriv/shared';
import { setSmartChartsPublicPath } from '@deriv-com/smartcharts-champion';

// Set SmartCharts public path
setSmartChartsPublicPath(getUrlBase('/js/smartcharts/'));

// Export all SmartChart components directly
export {
    SmartChart,
    ChartTitle,
    ChartSize,
    ChartMode,
    DrawTools,
    Share,
    StudyLegend,
    Views,
    ToolbarWidget,
    FastMarker,
    RawMarker,
} from '@deriv-com/smartcharts-champion';
