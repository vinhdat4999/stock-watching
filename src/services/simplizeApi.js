import { CONSTANTS } from '../utils/constants';

const API_BASE_URL = 'https://api2.simplize.vn/api/historical/quote';

// Fetch stock data from Simplize API
export async function fetchStockDataFromSimplizeAPI(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}/${symbol}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result && result.status === 200 && result.data) {
            return convertSimplizeDataToStockData(symbol, result.data);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching data for ${symbol} from Simplize API:`, error);
        return null;
    }
}

// Convert Simplize API response to WebSocket-like format
function convertSimplizeDataToStockData(symbol, apiData) {
    const change = apiData.netChange !== undefined ? apiData.netChange : (apiData.priceClose - apiData.priceReference);
    const changePercent = apiData.pctChange !== undefined ? apiData.pctChange : (apiData.priceReference > 0 ? (change / apiData.priceReference) * 100 : 0);

    return {
        messageType: CONSTANTS.MESSAGE_TYPE.MAIN,
        symbolWithPrefix: `S#${symbol}`,
        symbol: symbol,
        board: 'MAIN',
        bidVol1: apiData.quantityBid1 || 0,
        bidVol2: apiData.quantityBid2 || 0,
        bidVol3: apiData.quantityBid3 || 0,
        bidVol4: 0,
        bidVol5: 0,
        bidVol6: 0,
        bidVol7: 0,
        bidVol8: 0,
        bidVol9: 0,
        bidVol10: 0,
        askVol1: apiData.quantityAsk1 || 0,
        askVol2: apiData.quantityAsk2 || 0,
        askVol3: apiData.quantityAsk3 || 0,
        askVol4: 0,
        askVol5: 0,
        askVol6: 0,
        askVol7: 0,
        askVol8: 0,
        askVol9: 0,
        askVol10: 0,
        lastTradePrice: apiData.priceClose || 0,
        lastTradeVolume: apiData.totalVolume || 0,
        highestPrice: apiData.priceHigh || 0,
        lowestPrice: apiData.priceLow || 0,
        averagePrice: apiData.priceAverage || 0,
        ceilingPrice: apiData.priceCeiling || 0,
        floorPrice: apiData.priceFloor || 0,
        referencePrice: apiData.priceReference || 0,
        openPrice: apiData.priceOpen || 0,
        atoAtcPrice: 0,
        updateTime: apiData.timestamp ? new Date(apiData.timestamp * 1000).toLocaleTimeString('vi-VN') : new Date().toLocaleTimeString('vi-VN')
    };
}

// Fetch index data from Simplize API
export async function fetchIndexDataFromSimplizeAPI(indexSymbol) {
    try {
        const response = await fetch(`${API_BASE_URL}/${indexSymbol}?type=index`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result && result.status === 200 && result.data) {
            return convertSimplizeIndexDataToStockData(indexSymbol, result.data);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching index data for ${indexSymbol} from Simplize API:`, error);
        return null;
    }
}

// Convert Simplize index API response to WebSocket-like format
function convertSimplizeIndexDataToStockData(indexSymbol, apiData) {
    const change = apiData.netChange !== undefined ? apiData.netChange : (apiData.priceClose - apiData.priceReference);
    const changePercent = apiData.pctChange !== undefined ? apiData.pctChange : (apiData.priceReference > 0 ? (change / apiData.priceReference) * 100 : 0);

    return {
        messageType: CONSTANTS.MESSAGE_TYPE.INDEX,
        symbolWithPrefix: `I#${indexSymbol}`,
        symbol: indexSymbol,
        lastTradePrice: apiData.priceClose || 0,
        totalVolume: apiData.totalValue || 0,
        change: change,
        changePercent: changePercent
    };
}

// Fetch all symbols from Simplize API
export async function fetchAllSymbolsFromAPI(symbols, displayIndex = true) {
    const MAX_CONCURRENT_REQUESTS = 10;
    const results = new Map();

    // Fetch stock data
    for (let i = 0; i < symbols.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = symbols.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const batchPromises = batch.map(async (symbol) => {
            try {
                const data = await fetchStockDataFromSimplizeAPI(symbol);
                if (data) {
                    results.set(symbol, data);
                }
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
            }
        });
        await Promise.all(batchPromises);

        // Small delay between batches
        if (i + MAX_CONCURRENT_REQUESTS < symbols.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Fetch index data
    if (displayIndex) {
        try {
            const vnindexData = await fetchIndexDataFromSimplizeAPI('VNINDEX');
            if (vnindexData) results.set('VNINDEX', vnindexData);
        } catch (err) {
            console.error('Error fetching VNINDEX:', err);
        }

        try {
            const vn30Data = await fetchIndexDataFromSimplizeAPI('VN30');
            if (vn30Data) results.set('VN30', vn30Data);
        } catch (err) {
            console.error('Error fetching VN30:', err);
        }
    }

    return results;
}
