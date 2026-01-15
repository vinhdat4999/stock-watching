import { CONSTANTS } from '../utils/constants';
import { safeParseLong, safeParseDouble, timestampToLocalTime } from '../utils/stockUtils';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectTimeout = null;
        this.messageBatch = new Map();
        this.messageBatchTimeout = null;
        this.onDataUpdate = null;
        this.onStatusChange = null;
    }

    connect(url, onDataUpdate, onStatusChange) {
        this.onDataUpdate = onDataUpdate;
        this.onStatusChange = onStatusChange;

        if (onStatusChange) {
            onStatusChange('connecting', 'Đang kết nối...');
        }

        try {
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                if (onStatusChange) {
                    onStatusChange('connected', 'Đã kết nối');
                }
                this.cancelReconnect();
            };

            this.socket.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.socket.onclose = () => {
                if (onStatusChange) {
                    onStatusChange('disconnected', 'Mất kết nối');
                }
                this.scheduleReconnect(url);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (onStatusChange) {
                    onStatusChange('error', 'Lỗi kết nối');
                }
            };
        } catch (error) {
            console.error('Failed to connect:', error);
            if (onStatusChange) {
                onStatusChange('error', 'Lỗi kết nối');
            }
            this.scheduleReconnect(url);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.cancelReconnect();
        if (this.messageBatchTimeout) {
            clearTimeout(this.messageBatchTimeout);
            this.messageBatchTimeout = null;
        }
    }

    scheduleReconnect(url) {
        this.cancelReconnect();
        this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect(url, this.onDataUpdate, this.onStatusChange);
        }, 3000);
    }

    cancelReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    subscribeToStocks(symbols) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: 'sub',
            topic: 'stockRealtimeBySymbolsAndBoards',
            variables: {
                symbols: symbols,
                boardIds: ['MAIN']
            },
            component: 'priceTableEquities'
        };

        this.socket.send(JSON.stringify(message));
    }

    subscribeToIndex() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: 'sub',
            topic: 'notifyIndexRealtimeByListV2',
            variables: ['VNINDEX', 'VN30']
        };

        this.socket.send(JSON.stringify(message));
    }

    handleMessage(rawMessage) {
        if (!rawMessage) return;

        if (rawMessage.startsWith('Subscribed')) {
            console.log('Successfully subscribed');
            return;
        }

        const stockData = this.parseMessage(rawMessage);
        if (stockData) {
            this.messageBatch.set(stockData.symbol, stockData);

            if (this.messageBatchTimeout) {
                clearTimeout(this.messageBatchTimeout);
            }

            this.messageBatchTimeout = setTimeout(() => {
                if (this.onDataUpdate && this.messageBatch.size > 0) {
                    const batchData = new Map(this.messageBatch);
                    this.messageBatch.clear();
                    this.onDataUpdate(batchData);
                }
                this.messageBatchTimeout = null;
            }, 50);
        }
    }

    parseMessage(rawMessage) {
        if (!rawMessage) return null;

        if (rawMessage.startsWith('MAIN|S#')) {
            return this.parseMainStockData(rawMessage);
        } else if (rawMessage.startsWith('I#')) {
            return this.parseIndexStockData(rawMessage);
        } else if (rawMessage.startsWith(CONSTANTS.HEARTBEAT_MSG)) {
            return {
                messageType: CONSTANTS.HEARTBEAT_MSG,
                symbol: CONSTANTS.HEARTBEAT_MSG
            };
        }

        return null;
    }

    parseMainStockData(rawMessage) {
        const parts = rawMessage.split('|');
        if (parts.length < 102) {
            console.warn('Malformed MAIN message:', parts.length);
            return null;
        }

        try {
            const symbolWithPrefix = parts[1] || '';
            const symbol = symbolWithPrefix.length > 2 ? symbolWithPrefix.substring(2) : '';

            return {
                messageType: CONSTANTS.MESSAGE_TYPE.MAIN,
                symbolWithPrefix: symbolWithPrefix,
                symbol: symbol,
                board: parts[45] || '',
                bidVol1: safeParseLong(parts[3]),
                bidVol2: safeParseLong(parts[5]),
                bidVol3: safeParseLong(parts[7]),
                bidVol4: safeParseLong(parts[9]),
                bidVol5: safeParseLong(parts[11]),
                bidVol6: safeParseLong(parts[13]),
                bidVol7: safeParseLong(parts[15]),
                bidVol8: safeParseLong(parts[17]),
                bidVol9: safeParseLong(parts[19]),
                bidVol10: safeParseLong(parts[21]),
                askVol1: safeParseLong(parts[23]),
                askVol2: safeParseLong(parts[25]),
                askVol3: safeParseLong(parts[27]),
                askVol4: safeParseLong(parts[29]),
                askVol5: safeParseLong(parts[31]),
                askVol6: safeParseLong(parts[33]),
                askVol7: safeParseLong(parts[35]),
                askVol8: safeParseLong(parts[37]),
                askVol9: safeParseLong(parts[39]),
                askVol10: safeParseLong(parts[41]),
                lastTradePrice: safeParseDouble(parts[42]),
                lastTradeVolume: safeParseLong(parts[43]),
                highestPrice: safeParseDouble(parts[44]),
                lowestPrice: safeParseDouble(parts[46]),
                averagePrice: safeParseDouble(parts[47]),
                ceilingPrice: safeParseDouble(parts[59]),
                floorPrice: safeParseDouble(parts[60]),
                referencePrice: safeParseDouble(parts[61]),
                openPrice: safeParseDouble(parts[75]),
                atoAtcPrice: safeParseDouble(parts[96]),
                updateTime: timestampToLocalTime(parts[101])
            };
        } catch (error) {
            console.error('Error parsing MAIN stock data:', error);
            return null;
        }
    }

    parseIndexStockData(rawMessage) {
        const parts = rawMessage.split('|');
        if (parts.length < 19) {
            return null;
        }

        try {
            const symbolWithPrefix = parts[0] || '';
            const symbol = symbolWithPrefix.startsWith('I#') ? symbolWithPrefix.substring(2) : symbolWithPrefix;

            return {
                messageType: CONSTANTS.MESSAGE_TYPE.INDEX,
                symbolWithPrefix: symbolWithPrefix,
                symbol: symbol,
                lastTradePrice: safeParseDouble(parts[1]),
                totalVolume: safeParseLong(parts[10]),
                change: safeParseDouble(parts[18]),
                changePercent: safeParseDouble(parts[19])
            };
        } catch (error) {
            console.error('Error parsing INDEX data:', error);
            return null;
        }
    }
}

export default new WebSocketService();
