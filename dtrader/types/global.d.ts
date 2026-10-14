declare global {
    namespace NodeJS {
        interface ProcessEnv {
            OAUTH_CLIENT_ID?: string;
            REF_NAME?: string;
            TRANSLATIONS_CDN_URL?: string;
            NODE_ENV?: string;
        }
    }
    interface Window {
        DerivAppChannel?: DerivAppChannel;
        navigator: Navigator;
    }
    interface TradingConfigData {
        lang?: string;
        theme?: 'light' | 'dark';
    }
    interface DerivAppChannelMessage {
        event:
            | 'trading:config'
            | 'trading:ready'
            | 'trading:back'
            | 'trading:home'
            | 'trading:transfer'
            | 'trading:account_creation';
        data?: TradingConfigData; // Config data for trading:config event
    }
    interface DerivAppChannel {
        postMessage: (message: string) => void;
    }
    interface Navigator {
        connection?: NetworkInformation;
    }
    interface NetworkInformation {
        effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
        rtt?: number;
        downlink?: number;
    }
}

export {};
