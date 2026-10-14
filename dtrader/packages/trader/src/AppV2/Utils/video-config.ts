// [AI]
type TDtraderVideoUrl = {
    [key: string]: TVideoVariants;
};

type TVideoVariants = {
    dark: string;
    light: string;
};

/* The video upload feature is not available yet. The following video ids are taken from CF Stream account.
If considered necessary later, the current approach can be replaced with HTTP-request to fetch videos by their file names. */
export const DESCRIPTION_VIDEO_ID: TDtraderVideoUrl = {
    accumulator: {
        light: 'c1d64d5ffaf449e3326d387a70621a4c',
        dark: '9657e4adcfd9274d41a042b7b6c42d60',
    },
    even_odd: {
        light: 'a3930b0a535c4f23daea5cf98a718941',
        dark: 'e311e25dd68761d6ab73e8158ec83ea4',
    },
    high_low: {
        light: 'f528c662c377601908a741ae2aedaec6',
        dark: '4c05445e1bd28f3f9f95b0ab566c4f9b',
    },
    turbos: {
        light: '63f8b8f93e83e98481f20aa971ef7723',
        dark: 'ce0158579fcee186de1ddeb97646f892',
    },
    match_diff: {
        light: '8693a02397d284ffcf0608e4fda702d9',
        dark: '2e56ad7ea67bf3f9a869de6336df1796',
    },
    multiplier: {
        light: 'bca032791da88023e81ebf7341226f83',
        dark: '3d10e25e2e0eaaf96d1874aae257029f',
    },
    over_under: {
        light: '9e2be907cba9b38352890e52cfd8cbaf',

        dark: '4b31fc188c2f365faa310f7e34715af7',
    },
    rise_fall: {
        light: '7719c7e5436f58e59ab47510445108ba',
        dark: 'b72ef7ec914afe3dbb2a1601cad3a76f',
    },
    touch: {
        light: 'c781a6844f37a3308fe8774b4450dfc9',
        dark: 'c91f2b9859dc95ce8eecf7df327aaf00',
    },
    vanilla: {
        light: '9b8b6ae67d3a720e4aee2665889d17fb',
        dark: '8f04e9d768b8e08a1d87830c95c6b9c8',
    },
    trade_type_selection: {
        light: 'ffd6ce15fe1d47014262a00f562f5d7b',
        dark: '194a02d2924a27fdbc7420da44d392cc',
    },
};

// The ids here won't have dark and light theme
export const UNIFIED_MODE_VIDEO_ID = {
    accumulator_stats: '26d1401d2e3f6ae16913a21ec0579fc1',
};

// Onboarding videos
export const ONBOARDING_VIDEO_ID: TDtraderVideoUrl = {
    trade_page: {
        light: '166b342c39cdf08e3700590800ea0059', // user-onboarding-guide-trade-page.mp4
        dark: 'c1706dfdee97113ca2c85b65d70cddac', // user-onboarding-guide-trade-page-dark.mp4
    },
    positions_page: {
        light: '4b0f1938a87040b4d89adf4503cf97e2', // user-onboarding-guide-positions-page.mp4
        dark: '810669c92ea3094ba48891fe6c055a92', // user-onboarding-guide-positions-page-dark.mp4
    },
};

// Accumulator manual videos
export const ACCUMULATOR_MANUAL_VIDEO_ID = {
    desktop: {
        light: '7221d8b2b532def533e0448a8a410d62', // accumulators_manual_desktop.mp4
        dark: '2627ac2a8744e9c42e8dea01790edc93', // accumulators_manual_desktop_dark.mp4
    },
    mobile: {
        light: 'b7909afcfea13c6ee05caf1b1272f184', // accumulators_manual_mobile.mp4
        dark: '385da1df9eabcae32e45d7e3b8f44602', // accumulators_manual_mobile_dark.mp4
    },
};

export const getDescriptionVideoId = (contract_type = '', is_dark_theme = false) =>
    DESCRIPTION_VIDEO_ID[contract_type]?.[is_dark_theme ? 'dark' : 'light'];

// Helper function to get onboarding video ID
export const getOnboardingVideoId = (page_type: 'trade_page' | 'positions_page', is_dark_theme = false) =>
    ONBOARDING_VIDEO_ID[page_type]?.[is_dark_theme ? 'dark' : 'light'];

// Helper function to get accumulator manual video ID
export const getAccumulatorManualVideoId = (device: 'desktop' | 'mobile', is_dark_theme = false) =>
    ACCUMULATOR_MANUAL_VIDEO_ID[device]?.[is_dark_theme ? 'dark' : 'light'];
// [/AI]
