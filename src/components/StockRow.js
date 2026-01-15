import React from 'react';
import { CONSTANTS } from '../utils/constants';
import { formatPrice, formatNumber } from '../utils/formatters';
import { getCurrentPrice, calculateTotalBuyVolume, calculateTotalSellVolume, getDiffColor } from '../utils/stockUtils';

// Stock row (holding + following)
export function StockRow({ symbol, data, holding, displayVolume, alerts, onEdit, onDelete, onOpenChart }) {
    const alertIndicator = getAlertIndicator(symbol, alerts);

    const handleSymbolClick = () => {
        if (onOpenChart) {
            onOpenChart(symbol);
        }
    };

    if (!data || data.messageType !== CONSTANTS.MESSAGE_TYPE.MAIN) {
        return (
            <tr className="stock-row" data-symbol={symbol}>
                <td className="symbol-cell" onClick={handleSymbolClick} style={{ cursor: 'pointer' }}><strong>{symbol}</strong>{alertIndicator}</td>
                <td className="quantity-cell">{holding ? formatNumber(holding.quantity) : '-'}</td>
                <td className="ceiling-cell purple">-</td>
                <td className="floor-cell cyan">-</td>
                <td className="ref-cell">-</td>
                <td className="price-cell highlight-cell">Đang chờ...</td>
                <td className="change-cell highlight-cell">-</td>
                <td className="change-cell">-</td>
                <td className="high-cell">-</td>
                <td className="low-cell">-</td>
                {displayVolume && <><td className="buy-vol-cell">-</td><td className="sell-vol-cell">-</td></>}
                <td className="portfolio-diff-cell">-</td>
                <td className="actions-cell">
                    <ActionButtons onEdit={() => onEdit(symbol)} onDelete={() => onDelete(symbol)} />
                </td>
            </tr>
        );
    }

    const currentPrice = getCurrentPrice(data);
    const marketRef = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const ceilingPrice = data.ceilingPrice;
    const floorPrice = data.floorPrice;
    const highPriceValue = (data.highestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const lowPriceValue = (data.lowestPrice || 0) / CONSTANTS.PRICE_DIVISOR;

    // Calculate change based on market reference
    const diff = currentPrice - marketRef;
    const diffPercent = marketRef > 0 ? (diff / marketRef) * 100 : 0;
    const color = getDiffColor(diff, diffPercent, currentPrice, ceilingPrice, floorPrice);
    const sign = diff >= 0 ? '+' : '-';

    // High/Low price colors
    const highPriceClass = getHighLowClass(highPriceValue, marketRef);
    const lowPriceClass = getHighLowClass(lowPriceValue, marketRef);

    // Portfolio diff for holding stocks (use market reference)
    let portfolioDiff = null;
    if (holding) {
        const holdingDiff = (currentPrice - marketRef) * holding.quantity;
        portfolioDiff = Math.round(holdingDiff * 1000); // Convert to VND
    }

    const buyVolume = displayVolume ? calculateTotalBuyVolume(data) : 0;
    const sellVolume = displayVolume ? calculateTotalSellVolume(data) : 0;

    return (
        <tr className="stock-row" data-symbol={symbol}>
            <td className={`symbol-cell ${color}`} onClick={handleSymbolClick} style={{ cursor: 'pointer' }}>
                <strong>{symbol}</strong>{alertIndicator}
            </td>
            <td className="quantity-cell">{holding ? formatNumber(holding.quantity) : '-'}</td>
            <td className="ceiling-cell purple">{formatPrice(ceilingPrice / CONSTANTS.PRICE_DIVISOR)}</td>
            <td className="floor-cell cyan">{formatPrice(floorPrice / CONSTANTS.PRICE_DIVISOR)}</td>
            <td className="ref-cell">{formatPrice(marketRef)}</td>
            <td className={`price-cell ${color} highlight-cell`}>{formatPrice(currentPrice)}</td>
            <td className={`change-cell change-value-cell ${color} highlight-cell`}>{sign}{formatPrice(Math.abs(diff))}</td>
            <td className={`change-cell change-percent-cell ${color} highlight-cell`}>{sign}{formatPrice(Math.abs(diffPercent))}%</td>
            <td className={`high-cell ${highPriceClass}`}>{formatPrice(highPriceValue)}</td>
            <td className={`low-cell ${lowPriceClass}`}>{formatPrice(lowPriceValue)}</td>
            {displayVolume && (
                <>
                    <td className="buy-vol-cell">{formatNumber(buyVolume)}</td>
                    <td className="sell-vol-cell">{formatNumber(sellVolume)}</td>
                </>
            )}
            <td className="portfolio-diff-cell">
                {portfolioDiff !== null ? (
                    <span className={getDiffColor(portfolioDiff, 0, undefined, undefined, undefined)}>
                        {portfolioDiff >= 0 ? '+' : ''}{formatNumber(portfolioDiff)} đ
                    </span>
                ) : '-'}
            </td>
            <td className="actions-cell">
                <ActionButtons onEdit={() => onEdit(symbol)} onDelete={() => onDelete(symbol)} />
            </td>
        </tr>
    );
}

// Buy order row
export function BuyRow({ symbol, data, buyOrders, displayVolume, alerts, onEdit, onDelete, onOpenChart }) {
    const alertIndicator = getAlertIndicator(symbol, alerts);

    const handleSymbolClick = () => {
        if (onOpenChart) {
            onOpenChart(symbol);
        }
    };

    // Calculate total quantity, average buy price (excluding fees), and total fee
    const buyOrdersForSymbol = buyOrders.filter(b => b.symbol === symbol);
    let totalBuyAmount = 0;
    let totalBuyFee = 0;
    let totalQuantity = 0;
    buyOrdersForSymbol.forEach(order => {
        totalBuyAmount += order.price * order.quantity;
        totalBuyFee += order.fee * order.price * order.quantity;
        totalQuantity += order.quantity;
    });
    const avgBuyPrice = totalQuantity > 0 ? totalBuyAmount / totalQuantity : 0;

    if (!data || data.messageType !== CONSTANTS.MESSAGE_TYPE.MAIN) {
        return (
            <tr className="stock-row buy-row" data-symbol={symbol}>
                <td className="symbol-cell" onClick={handleSymbolClick} style={{ cursor: 'pointer' }}><strong>{symbol}+</strong>{alertIndicator}</td>
                <td className="quantity-cell">{totalQuantity > 0 ? formatNumber(totalQuantity) : '-'}</td>
                <td className="ceiling-cell purple">-</td>
                <td className="floor-cell cyan">-</td>
                <td className="ref-cell">-</td>
                <td className="price-cell highlight-cell">Đang chờ...</td>
                <td className="change-cell highlight-cell">-</td>
                <td className="change-cell">-</td>
                <td className="high-cell">-</td>
                <td className="low-cell">-</td>
                {displayVolume && <><td className="buy-vol-cell">-</td><td className="sell-vol-cell">-</td></>}
                <td className="portfolio-diff-cell">-</td>
                <td className="actions-cell">
                    <ActionButtons onEdit={() => onEdit(symbol)} onDelete={() => onDelete(symbol)} />
                </td>
            </tr>
        );
    }

    const currentPrice = getCurrentPrice(data);
    const marketRef = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const ceilingPrice = data.ceilingPrice;
    const floorPrice = data.floorPrice;
    const highPriceValue = (data.highestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const lowPriceValue = (data.lowestPrice || 0) / CONSTANTS.PRICE_DIVISOR;

    // Use buy price as reference for change calculation (same as Java logic)
    const diff = currentPrice - avgBuyPrice;
    const diffPercent = avgBuyPrice > 0 ? (diff / avgBuyPrice) * 100 : 0;
    const color = getDiffColor(diff, diffPercent, currentPrice, ceilingPrice, floorPrice);
    const sign = diff >= 0 ? '+' : '-';

    // High/Low price colors (based on market reference)
    const highPriceClass = getHighLowClass(highPriceValue, marketRef);
    const lowPriceClass = getHighLowClass(lowPriceValue, marketRef);

    // Portfolio diff: (currentPrice - avgBuyPrice) * quantity - totalFee
    const totalDiff = Math.round(((diff * totalQuantity) - totalBuyFee) * 1000);

    return (
        <tr className="stock-row buy-row" data-symbol={symbol}>
            <td className={`symbol-cell ${color}`} onClick={handleSymbolClick} style={{ cursor: 'pointer' }}>
                <strong>{symbol}+</strong>{alertIndicator}
            </td>
            <td className="quantity-cell">{totalQuantity > 0 ? formatNumber(totalQuantity) : '-'}</td>
            <td className="ceiling-cell purple">{formatPrice(ceilingPrice / CONSTANTS.PRICE_DIVISOR)}</td>
            <td className="floor-cell cyan">{formatPrice(floorPrice / CONSTANTS.PRICE_DIVISOR)}</td>
            <td className="ref-cell">{formatPrice(marketRef)}</td>
            <td className={`price-cell ${color} highlight-cell`}>{formatPrice(currentPrice)}</td>
            <td className={`change-cell change-value-cell ${color} highlight-cell`}>{sign}{formatPrice(Math.abs(diff))}</td>
            <td className={`change-cell change-percent-cell ${color} highlight-cell`}>{sign}{formatPrice(Math.abs(diffPercent))}%</td>
            <td className={`high-cell ${highPriceClass}`}>{formatPrice(highPriceValue)}</td>
            <td className={`low-cell ${lowPriceClass}`}>{formatPrice(lowPriceValue)}</td>
            {displayVolume && <><td className="buy-vol-cell">-</td><td className="sell-vol-cell">-</td></>}
            <td className="portfolio-diff-cell">
                {totalDiff !== 0 ? (
                    <span className={getDiffColor(totalDiff, 0, undefined, undefined, undefined)}>
                        {totalDiff >= 0 ? '+' : ''}{formatNumber(totalDiff)} đ
                    </span>
                ) : '-'}
            </td>
            <td className="actions-cell">
                <ActionButtons onEdit={() => onEdit(symbol)} onDelete={() => onDelete(symbol)} />
            </td>
        </tr>
    );
}

// Sell order row
export function SellRow({ symbol, data, sellOrders, displayVolume, alerts, onEdit, onDelete, onOpenChart }) {
    const alertIndicator = getAlertIndicator(symbol, alerts);

    const handleSymbolClick = () => {
        if (onOpenChart) {
            onOpenChart(symbol);
        }
    };

    // Calculate total quantity and average sell price
    const sellOrdersForSymbol = sellOrders.filter(s => s.symbol === symbol);
    let totalSellAmount = 0;
    let totalQuantity = 0;
    sellOrdersForSymbol.forEach(order => {
        totalSellAmount += order.price * order.quantity;
        totalQuantity += order.quantity;
    });
    const avgSellPrice = totalQuantity > 0 ? totalSellAmount / totalQuantity : 0;

    if (!data || data.messageType !== CONSTANTS.MESSAGE_TYPE.MAIN) {
        return (
            <tr className="stock-row sell-row" data-symbol={symbol}>
                <td className="symbol-cell" onClick={handleSymbolClick} style={{ cursor: 'pointer' }}><strong>{symbol}-</strong>{alertIndicator}</td>
                <td className="quantity-cell">{totalQuantity > 0 ? formatNumber(totalQuantity) : '-'}</td>
                <td className="ceiling-cell purple">-</td>
                <td className="floor-cell cyan">-</td>
                <td className="ref-cell">-</td>
                <td className="price-cell highlight-cell">Đang chờ...</td>
                <td className="change-cell highlight-cell">-</td>
                <td className="change-cell">-</td>
                <td className="high-cell">-</td>
                <td className="low-cell">-</td>
                {displayVolume && <><td className="buy-vol-cell">-</td><td className="sell-vol-cell">-</td></>}
                <td className="portfolio-diff-cell">-</td>
                <td className="actions-cell">
                    <ActionButtons onEdit={() => onEdit(symbol)} onDelete={() => onDelete(symbol)} />
                </td>
            </tr>
        );
    }

    const currentPrice = getCurrentPrice(data);
    const marketRef = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const ceilingPrice = data.ceilingPrice;
    const floorPrice = data.floorPrice;
    const highPriceValue = (data.highestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
    const lowPriceValue = (data.lowestPrice || 0) / CONSTANTS.PRICE_DIVISOR;

    // Use sell price as reference for change calculation
    // diff = sellPrice - currentPrice (opposite of buy)
    const diff = avgSellPrice - currentPrice;
    const diffPercent = avgSellPrice > 0 ? (diff / avgSellPrice) * 100 : 0;
    const color = getDiffColor(diff, diffPercent, currentPrice, ceilingPrice, floorPrice);
    const sign = diff >= 0 ? '+' : '-';

    // High/Low price colors (based on market reference)
    const highPriceClass = getHighLowClass(highPriceValue, marketRef);
    const lowPriceClass = getHighLowClass(lowPriceValue, marketRef);

    // Portfolio diff for sell: (sellPrice - currentPrice) * quantity (NO fee for display)
    const displayTotalDiff = Math.round((avgSellPrice - currentPrice) * totalQuantity * 1000);

    return (
        <tr className="stock-row sell-row" data-symbol={symbol}>
            <td className={`symbol-cell ${color}`} onClick={handleSymbolClick} style={{ cursor: 'pointer' }}>
                <strong>{symbol}-</strong>{alertIndicator}
            </td>
            <td className="quantity-cell">{totalQuantity > 0 ? formatNumber(totalQuantity) : '-'}</td>
            <td className="ceiling-cell purple">{formatPrice(ceilingPrice / CONSTANTS.PRICE_DIVISOR)}</td>
            <td className="floor-cell cyan">{formatPrice(floorPrice / CONSTANTS.PRICE_DIVISOR)}</td>
            <td className="ref-cell">{formatPrice(marketRef)}</td>
            <td className={`price-cell ${color} highlight-cell`}>{formatPrice(currentPrice)}</td>
            <td className={`change-cell change-value-cell ${color} highlight-cell`}>{sign}{formatPrice(Math.abs(diff))}</td>
            <td className={`change-cell change-percent-cell ${color} highlight-cell`}>{sign}{formatPrice(Math.abs(diffPercent))}%</td>
            <td className={`high-cell ${highPriceClass}`}>{formatPrice(highPriceValue)}</td>
            <td className={`low-cell ${lowPriceClass}`}>{formatPrice(lowPriceValue)}</td>
            {displayVolume && <><td className="buy-vol-cell">-</td><td className="sell-vol-cell">-</td></>}
            <td className="portfolio-diff-cell">
                <span className={getDiffColor(displayTotalDiff, 0, undefined, undefined, undefined)}>
                    {displayTotalDiff >= 0 ? '+' : ''}{formatNumber(displayTotalDiff)} đ
                </span>
            </td>
            <td className="actions-cell">
                <ActionButtons onEdit={() => onEdit(symbol)} onDelete={() => onDelete(symbol)} />
            </td>
        </tr>
    );
}

// Helper functions
function getHighLowClass(price, marketRef) {
    if (price > 0 && marketRef > 0) {
        if (price > marketRef) return 'green';
        if (price < marketRef) return 'red';
        return 'yellow';
    }
    return '';
}

function getAlertIndicator(symbol, alerts) {
    if (!alerts || alerts.length === 0) return null;

    const stockAlerts = alerts.filter(a => a.symbol === symbol);
    const hasActiveAlert = stockAlerts.some(a => !a.triggered);
    const hasTriggeredAlert = stockAlerts.some(a => a.triggered);

    if (hasTriggeredAlert) {
        return <span className="alert-indicator triggered" title="Đã kích hoạt">✓</span>;
    }
    if (hasActiveAlert) {
        return <span className="alert-indicator active" title="Đang theo dõi">🔔</span>;
    }
    return null;
}

function ActionButtons({ onEdit, onDelete }) {
    return (
        <>
            <button className="action-btn edit-action" onClick={onEdit} title="Chỉnh sửa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button className="action-btn delete-action" onClick={onDelete} title="Xóa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </>
    );
}

export default StockRow;
