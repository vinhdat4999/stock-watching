import { CONSTANTS } from './constants';

// Utility functions
export function safeParseLong(str) {
    if (!str) return 0;
    const trimmed = str.trim();
    if (trimmed === '') return 0;
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? 0 : parsed;
}

export function safeParseDouble(str) {
    if (!str) return 0.0;
    const trimmed = str.trim();
    if (trimmed === '') return 0.0;
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0.0 : parsed;
}

export function timestampToLocalTime(timestamp) {
    try {
        const millis = parseInt(timestamp, 10);
        const date = new Date(millis);
        const options = {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return date.toLocaleTimeString('en-US', options);
    } catch (error) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
}

// Calculate current price (same logic as Java StockDataUtils.getCurrentPrice)
export function getCurrentPrice(data) {
    if (!data) {
        return 0.0;
    }

    const atoAtcPrice = (data.atoAtcPrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const updateTime = data.updateTime;

    // Check if ATC on HOSE after 14:30 (same logic as Java)
    if (updateTime && data.board && data.board.toLowerCase() === 'hose') {
        const timeParts = updateTime.split(':');
        if (timeParts.length >= 2) {
            const hour = parseInt(timeParts[0], 10);
            const minute = parseInt(timeParts[1] || '0', 10);
            if (hour > 14 || (hour === 14 && minute >= 30)) {
                return atoAtcPrice;
            }
        }
    }

    const lastTradePrice = (data.lastTradePrice || 0) / CONSTANTS.PRICE_DIVISOR;
    if (!lastTradePrice || lastTradePrice === 0) {
        if (atoAtcPrice === 0 || atoAtcPrice === null) {
            const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
            return refPrice || 0.0;
        }
        return atoAtcPrice;
    }

    return lastTradePrice;
}

export function calculateTotalBuyVolume(data) {
    if (!data) return 0;
    return (data.bidVol1 || 0) + (data.bidVol2 || 0) + (data.bidVol3 || 0) +
           (data.bidVol4 || 0) + (data.bidVol5 || 0) + (data.bidVol6 || 0) +
           (data.bidVol7 || 0) + (data.bidVol8 || 0) + (data.bidVol9 || 0) +
           (data.bidVol10 || 0);
}

export function calculateTotalSellVolume(data) {
    if (!data) return 0;
    return (data.askVol1 || 0) + (data.askVol2 || 0) + (data.askVol3 || 0) +
           (data.askVol4 || 0) + (data.askVol5 || 0) + (data.askVol6 || 0) +
           (data.askVol7 || 0) + (data.askVol8 || 0) + (data.askVol9 || 0) +
           (data.askVol10 || 0);
}

export function getDiffColor(diff, diffPercent, currentPrice, ceilingPrice, floorPrice) {
    if (ceilingPrice !== undefined && ceilingPrice !== null && currentPrice !== undefined && currentPrice !== null) {
        const priceInRaw = currentPrice * CONSTANTS.PRICE_DIVISOR;
        if (priceInRaw >= ceilingPrice) {
            return 'purple';
        }
    }
    if (floorPrice !== undefined && floorPrice !== null && currentPrice !== undefined && currentPrice !== null) {
        const priceInRaw = currentPrice * CONSTANTS.PRICE_DIVISOR;
        if (priceInRaw <= floorPrice) {
            return 'cyan';
        }
    }
    if (diff > 0) return 'green';
    if (diff < 0) return 'red';
    return 'yellow';
}

// Check if market is closed
export function isMarketClosed(useCustomDataSource = false) {
    if (useCustomDataSource) {
        return false;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
    }

    if (hours >= 4) {
        if (hours < 14) {
            return false;
        }
        if (hours === 14 && minutes < 45) {
            return false;
        }
    }

    return true;
}

// Check if in lunch break
export function isLunchBreak(useCustomDataSource = false) {
    if (useCustomDataSource) {
        return false;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (dayOfWeek < 1 || dayOfWeek > 5) {
        return false;
    }

    if (hours === 11 && minutes >= 30) return true;
    if (hours === 12) return true;
    if (hours === 13 && minutes === 0) return true;

    return false;
}
