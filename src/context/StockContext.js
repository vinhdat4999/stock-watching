import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { CONSTANTS, DEFAULT_BUY_FEE, DEFAULT_SELL_FEE, DEFAULT_DATA_SOURCE_URL } from '../utils/constants';
import { saveToStorage, loadFromStorage, parseSharedUrl } from '../services/storageService';
import websocketService from '../services/websocketService';
import { fetchAllSymbolsFromAPI } from '../services/simplizeApi';
import { isMarketClosed, isLunchBreak } from '../utils/stockUtils';

const API_POLLING_INTERVAL_MS = 60000; // 60 seconds
const LUNCH_POLLING_INTERVAL_MS = 30000; // 30 seconds during lunch

const StockContext = createContext();

const initialState = {
    // Stock data
    stockDataMap: new Map(),

    // Portfolio
    followingSymbols: [],
    holdingStocks: [],
    buyOrders: [],
    sellOrders: [],

    // Settings
    displayIndex: true,
    displayVolume: false,
    sellWatching: true,
    useCustomDataSource: false,
    dataSourceUrl: DEFAULT_DATA_SOURCE_URL,

    // Connection status
    connectionStatus: 'disconnected',
    statusText: 'Chưa kết nối',

    // Alerts
    alerts: [],

    // UI state
    activeTab: 'holding',
    sortColumn: null,
    sortDirection: 'asc'
};

function stockReducer(state, action) {
    switch (action.type) {
        case 'SET_STOCK_DATA':
            const newMap = new Map(state.stockDataMap);
            action.payload.forEach((value, key) => {
                newMap.set(key, value);
            });
            return { ...state, stockDataMap: newMap };

        case 'SET_FOLLOWING':
            return { ...state, followingSymbols: action.payload };

        case 'ADD_FOLLOWING':
            if (state.followingSymbols.includes(action.payload)) {
                return state;
            }
            return { ...state, followingSymbols: [...state.followingSymbols, action.payload] };

        case 'REMOVE_FOLLOWING':
            return { ...state, followingSymbols: state.followingSymbols.filter(s => s !== action.payload) };

        case 'SET_HOLDING':
            return { ...state, holdingStocks: action.payload };

        case 'ADD_HOLDING':
            const existingHolding = state.holdingStocks.find(h => h.symbol === action.payload.symbol);
            if (existingHolding) {
                return {
                    ...state,
                    holdingStocks: state.holdingStocks.map(h =>
                        h.symbol === action.payload.symbol
                            ? { ...h, quantity: h.quantity + action.payload.quantity }
                            : h
                    )
                };
            }
            return { ...state, holdingStocks: [...state.holdingStocks, action.payload] };

        case 'UPDATE_HOLDING':
            return {
                ...state,
                holdingStocks: state.holdingStocks.map(h =>
                    h.symbol === action.payload.symbol ? action.payload : h
                )
            };

        case 'REMOVE_HOLDING':
            return { ...state, holdingStocks: state.holdingStocks.filter(h => h.symbol !== action.payload) };

        case 'SET_BUY_ORDERS':
            return { ...state, buyOrders: action.payload };

        case 'ADD_BUY_ORDER': {
            // Merge with existing order if same symbol AND same fee (like original JS)
            const newOrder = action.payload;
            const existingIndex = state.buyOrders.findIndex(
                b => b.symbol === newOrder.symbol && Math.abs(b.fee - newOrder.fee) < 0.0001
            );
            
            if (existingIndex !== -1) {
                // Calculate weighted average price
                const existing = state.buyOrders[existingIndex];
                const existingAmount = existing.price * existing.quantity;
                const newAmount = newOrder.price * newOrder.quantity;
                const totalQuantity = existing.quantity + newOrder.quantity;
                const avgPrice = totalQuantity > 0 ? (existingAmount + newAmount) / totalQuantity : 0;
                
                const updatedOrders = [...state.buyOrders];
                updatedOrders[existingIndex] = {
                    ...existing,
                    quantity: totalQuantity,
                    price: avgPrice
                };
                return { ...state, buyOrders: updatedOrders };
            }
            return { ...state, buyOrders: [...state.buyOrders, newOrder] };
        }

        case 'UPDATE_BUY_ORDER':
            return {
                ...state,
                buyOrders: state.buyOrders.map(b =>
                    b.symbol === action.payload.symbol ? action.payload : b
                )
            };

        case 'REMOVE_BUY_ORDER':
            return { ...state, buyOrders: state.buyOrders.filter(b => b.symbol !== action.payload) };

        case 'SET_SELL_ORDERS':
            return { ...state, sellOrders: action.payload };

        case 'ADD_SELL_ORDER': {
            // Merge with existing order if same symbol AND same fee (like original JS)
            const newOrder = action.payload;
            const existingIndex = state.sellOrders.findIndex(
                s => s.symbol === newOrder.symbol && Math.abs(s.fee - newOrder.fee) < 0.0001
            );
            
            if (existingIndex !== -1) {
                // Calculate weighted average price
                const existing = state.sellOrders[existingIndex];
                const existingAmount = existing.price * existing.quantity;
                const newAmount = newOrder.price * newOrder.quantity;
                const totalQuantity = existing.quantity + newOrder.quantity;
                const avgPrice = totalQuantity > 0 ? (existingAmount + newAmount) / totalQuantity : 0;
                
                const updatedOrders = [...state.sellOrders];
                updatedOrders[existingIndex] = {
                    ...existing,
                    quantity: totalQuantity,
                    price: avgPrice
                };
                return { ...state, sellOrders: updatedOrders };
            }
            return { ...state, sellOrders: [...state.sellOrders, newOrder] };
        }

        case 'UPDATE_SELL_ORDER':
            return {
                ...state,
                sellOrders: state.sellOrders.map(s =>
                    s.symbol === action.payload.symbol ? action.payload : s
                )
            };

        case 'REMOVE_SELL_ORDER':
            return { ...state, sellOrders: state.sellOrders.filter(s => s.symbol !== action.payload) };

        case 'SET_SETTINGS':
            return { ...state, ...action.payload };

        case 'SET_CONNECTION_STATUS':
            return { ...state, connectionStatus: action.payload.status, statusText: action.payload.text };

        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };

        case 'SET_SORT':
            return { ...state, sortColumn: action.payload.column, sortDirection: action.payload.direction };

        case 'SET_ALERTS':
            return { ...state, alerts: action.payload };

        case 'ADD_ALERT':
            return { ...state, alerts: [...state.alerts, action.payload] };

        case 'UPDATE_ALERT':
            return {
                ...state,
                alerts: state.alerts.map(a => a.id === action.payload.id ? action.payload : a)
            };

        case 'REMOVE_ALERT':
            return { ...state, alerts: state.alerts.filter(a => a.id !== action.payload) };

        case 'LOAD_STATE':
            return { ...state, ...action.payload };

        default:
            return state;
    }
}

export function StockProvider({ children }) {
    const [state, dispatch] = useReducer(stockReducer, initialState);
    const isInitialized = useRef(false);
    const apiPollingRef = useRef(null);
    const lunchBreakCheckRef = useRef(null);

    // Load data from storage on mount
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        // Check for shared URL data
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');

        if (sharedData) {
            const parsed = parseSharedUrl(sharedData);
            if (parsed) {
                dispatch({
                    type: 'LOAD_STATE',
                    payload: {
                        followingSymbols: parsed.following,
                        holdingStocks: parsed.holding,
                        buyOrders: parsed.buy,
                        sellOrders: parsed.sell
                    }
                });
            }
        } else {
            const savedData = loadFromStorage();
            if (savedData) {
                dispatch({
                    type: 'LOAD_STATE',
                    payload: {
                        followingSymbols: savedData.following || [],
                        holdingStocks: savedData.holding || [],
                        buyOrders: savedData.buy || [],
                        sellOrders: savedData.sell || [],
                        displayIndex: savedData.config?.displayIndex ?? true,
                        displayVolume: savedData.config?.displayVolume ?? false,
                        sellWatching: savedData.config?.sellWatching ?? true,
                        useCustomDataSource: savedData.config?.useCustomDataSource ?? false,
                        dataSourceUrl: savedData.config?.dataSourceUrl || DEFAULT_DATA_SOURCE_URL,
                        alerts: savedData.alerts || []
                    }
                });
            }
        }
    }, []);

    // Save to storage when data changes
    useEffect(() => {
        if (!isInitialized.current) return;

        const dataToSave = {
            following: state.followingSymbols,
            holding: state.holdingStocks,
            buy: state.buyOrders,
            sell: state.sellOrders,
            alerts: state.alerts,
            config: {
                displayIndex: state.displayIndex,
                displayVolume: state.displayVolume,
                sellWatching: state.sellWatching,
                useCustomDataSource: state.useCustomDataSource,
                dataSourceUrl: state.dataSourceUrl
            }
        };
        saveToStorage(dataToSave);
    }, [
        state.followingSymbols,
        state.holdingStocks,
        state.buyOrders,
        state.sellOrders,
        state.alerts,
        state.displayIndex,
        state.displayVolume,
        state.sellWatching,
        state.useCustomDataSource,
        state.dataSourceUrl
    ]);

    // Handle WebSocket connection
    const handleDataUpdate = useCallback((batchData) => {
        dispatch({ type: 'SET_STOCK_DATA', payload: batchData });
    }, []);

    const handleStatusChange = useCallback((status, text) => {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status, text } });
    }, []);

    // Get all symbols that need data
    const getAllSymbols = useCallback(() => {
        const allSymbols = new Set([
            ...state.followingSymbols,
            ...state.holdingStocks.map(h => h.symbol),
            ...state.buyOrders.map(b => b.symbol),
            ...state.sellOrders.map(s => s.symbol)
        ]);
        return Array.from(allSymbols);
    }, [state.followingSymbols, state.holdingStocks, state.buyOrders, state.sellOrders]);

    // Start API polling
    const startApiPolling = useCallback(() => {
        // Stop WebSocket
        websocketService.disconnect();

        // Stop existing polling
        if (apiPollingRef.current) {
            clearInterval(apiPollingRef.current);
        }

        // Update status based on reason
        if (isLunchBreak(state.useCustomDataSource)) {
            handleStatusChange('disconnected', 'Giờ nghỉ trưa - Đang dùng API');
        } else {
            handleStatusChange('disconnected', 'Sàn đã đóng cửa');
        }

        // Fetch immediately
        const symbols = getAllSymbols();
        if (symbols.length > 0) {
            fetchAllSymbolsFromAPI(symbols, state.displayIndex).then(results => {
                dispatch({ type: 'SET_STOCK_DATA', payload: results });
            });
        }

        // Poll periodically
        const pollingInterval = isLunchBreak(state.useCustomDataSource)
            ? LUNCH_POLLING_INTERVAL_MS
            : API_POLLING_INTERVAL_MS;

        apiPollingRef.current = setInterval(() => {
            const inLunchBreak = isLunchBreak(state.useCustomDataSource);
            const marketClosed = isMarketClosed(state.useCustomDataSource);

            if (inLunchBreak) {
                // Still in lunch break, continue polling
                const currentSymbols = getAllSymbols();
                if (currentSymbols.length > 0) {
                    fetchAllSymbolsFromAPI(currentSymbols, state.displayIndex).then(results => {
                        dispatch({ type: 'SET_STOCK_DATA', payload: results });
                    });
                }
            } else if (!marketClosed) {
                // Lunch break ended and market is open, switch to WebSocket
                stopApiPolling();
                connectToWebSocket();
            } else {
                // Market is closed, continue polling
                const currentSymbols = getAllSymbols();
                if (currentSymbols.length > 0) {
                    fetchAllSymbolsFromAPI(currentSymbols, state.displayIndex).then(results => {
                        dispatch({ type: 'SET_STOCK_DATA', payload: results });
                    });
                }
            }
        }, pollingInterval);
    }, [state.useCustomDataSource, state.displayIndex, getAllSymbols, handleStatusChange]);

    // Stop API polling
    const stopApiPolling = useCallback(() => {
        if (apiPollingRef.current) {
            clearInterval(apiPollingRef.current);
            apiPollingRef.current = null;
        }
    }, []);

    // Connect to WebSocket
    const connectToWebSocket = useCallback(() => {
        const wsUrl = state.useCustomDataSource && state.dataSourceUrl
            ? state.dataSourceUrl
            : CONSTANTS.SOCKET_URL;

        websocketService.connect(wsUrl, handleDataUpdate, handleStatusChange);
    }, [state.useCustomDataSource, state.dataSourceUrl, handleDataUpdate, handleStatusChange]);

    // Start lunch break monitoring
    const startLunchBreakMonitoring = useCallback(() => {
        // Clear existing interval
        if (lunchBreakCheckRef.current) {
            clearInterval(lunchBreakCheckRef.current);
        }

        // Check every 30 seconds
        lunchBreakCheckRef.current = setInterval(() => {
            // Skip if using custom data source
            if (state.useCustomDataSource) {
                return;
            }

            const inLunchBreak = isLunchBreak(state.useCustomDataSource);
            const marketClosed = isMarketClosed(state.useCustomDataSource);
            const isWebSocketConnected = websocketService.isConnected();
            const isApiPolling = apiPollingRef.current !== null;

            // If in lunch break and WebSocket is connected, switch to API
            if (inLunchBreak && isWebSocketConnected && !isApiPolling) {
                console.log('Lunch break started, switching to API');
                startApiPolling();
            }
            // If lunch break ended and market is open, switch to WebSocket
            else if (!inLunchBreak && !marketClosed && isApiPolling && !isWebSocketConnected) {
                console.log('Lunch break ended, switching to WebSocket');
                stopApiPolling();
                connectToWebSocket();
            }
        }, 30000);
    }, [state.useCustomDataSource, startApiPolling, stopApiPolling, connectToWebSocket]);

    // Main connection effect
    useEffect(() => {
        if (!isInitialized.current) return;

        const shouldUseApi = isMarketClosed(state.useCustomDataSource) || isLunchBreak(state.useCustomDataSource);

        if (shouldUseApi && !state.useCustomDataSource) {
            startApiPolling();
        } else {
            stopApiPolling();
            connectToWebSocket();
        }

        // Start lunch break monitoring
        startLunchBreakMonitoring();

        return () => {
            websocketService.disconnect();
            stopApiPolling();
            if (lunchBreakCheckRef.current) {
                clearInterval(lunchBreakCheckRef.current);
            }
        };
    }, [state.useCustomDataSource, state.dataSourceUrl, startApiPolling, stopApiPolling, connectToWebSocket, startLunchBreakMonitoring]);

    // Subscribe to symbols when connected
    useEffect(() => {
        if (state.connectionStatus !== 'connected') return;

        const allSymbols = new Set([
            ...state.followingSymbols,
            ...state.holdingStocks.map(h => h.symbol),
            ...state.buyOrders.map(b => b.symbol),
            ...state.sellOrders.map(s => s.symbol)
        ]);

        if (allSymbols.size > 0) {
            websocketService.subscribeToStocks(Array.from(allSymbols));
        }

        if (state.displayIndex) {
            websocketService.subscribeToIndex();
        }
    }, [
        state.connectionStatus,
        state.followingSymbols,
        state.holdingStocks,
        state.buyOrders,
        state.sellOrders,
        state.displayIndex
    ]);

    const value = {
        state,
        dispatch,

        // Actions
        addFollowing: (symbol) => dispatch({ type: 'ADD_FOLLOWING', payload: symbol.toUpperCase() }),
        removeFollowing: (symbol) => dispatch({ type: 'REMOVE_FOLLOWING', payload: symbol }),

        addHolding: (symbol, quantity) => dispatch({
            type: 'ADD_HOLDING',
            payload: { symbol: symbol.toUpperCase(), quantity }
        }),
        updateHolding: (symbol, quantity) => dispatch({
            type: 'UPDATE_HOLDING',
            payload: { symbol, quantity }
        }),
        removeHolding: (symbol) => dispatch({ type: 'REMOVE_HOLDING', payload: symbol }),

        addBuyOrder: (symbol, quantity, price, fee = DEFAULT_BUY_FEE) => dispatch({
            type: 'ADD_BUY_ORDER',
            payload: { symbol: symbol.toUpperCase(), quantity, price, fee }
        }),
        updateBuyOrder: (order) => dispatch({ type: 'UPDATE_BUY_ORDER', payload: order }),
        removeBuyOrder: (symbol) => dispatch({ type: 'REMOVE_BUY_ORDER', payload: symbol }),

        addSellOrder: (symbol, quantity, price, fee = DEFAULT_SELL_FEE) => dispatch({
            type: 'ADD_SELL_ORDER',
            payload: { symbol: symbol.toUpperCase(), quantity, price, fee }
        }),
        updateSellOrder: (order) => dispatch({ type: 'UPDATE_SELL_ORDER', payload: order }),
        removeSellOrder: (symbol) => dispatch({ type: 'REMOVE_SELL_ORDER', payload: symbol }),

        updateSettings: (settings) => dispatch({ type: 'SET_SETTINGS', payload: settings }),
        setActiveTab: (tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),
        setSort: (column, direction) => dispatch({ type: 'SET_SORT', payload: { column, direction } }),

        addAlert: (alert) => dispatch({ type: 'ADD_ALERT', payload: { ...alert, id: Date.now() } }),
        updateAlert: (alert) => dispatch({ type: 'UPDATE_ALERT', payload: alert }),
        removeAlert: (id) => dispatch({ type: 'REMOVE_ALERT', payload: id }),

        importData: (data) => dispatch({ type: 'LOAD_STATE', payload: data })
    };

    return (
        <StockContext.Provider value={value}>
            {children}
        </StockContext.Provider>
    );
}

export function useStock() {
    const context = useContext(StockContext);
    if (!context) {
        throw new Error('useStock must be used within a StockProvider');
    }
    return context;
}
