// Constants
export const CONSTANTS = {
    PRICE_DIVISOR: 1000.0,
    VOLUME_DIVISOR: 1000000000.0,
    HEARTBEAT_MSG: '__TICK__',
    MESSAGE_TYPE: {
        MAIN: 'MAIN',
        INDEX: 'INDEX'
    },
    SOCKET_URL: 'wss://iboard-pushstream.ssi.com.vn/realtime',
    API_SIMPLIZE_BASE_URL: 'https://api2.simplize.vn/api/historical/quote'
};

export const DEFAULT_BUY_FEE = 0.0003; // 0.03%
export const DEFAULT_SELL_FEE = 0.0013; // 0.13%
export const DEFAULT_DATA_SOURCE_URL = 'ws://localhost:8025/websocket/stockdata';

// Performance constants
export const RENDER_THROTTLE_MS = 16; // ~60fps max
export const MESSAGE_BATCH_DELAY = 50;
export const MAX_BATCH_DELAY = 200;
export const API_POLLING_INTERVAL_MS = 60000;
