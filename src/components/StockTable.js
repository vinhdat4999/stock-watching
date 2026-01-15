import React, { useMemo, useCallback, useState } from 'react';
import { useStock } from '../context/StockContext';
import { StockRow, BuyRow, SellRow } from './StockRow';
import { CONSTANTS } from '../utils/constants';
import { getCurrentPrice, calculateTotalBuyVolume, calculateTotalSellVolume } from '../utils/stockUtils';

function StockTable({ onOpenChart }) {
    const {
        state,
        removeHolding,
        removeBuyOrder,
        removeSellOrder,
        removeFollowing,
        updateHolding,
        updateBuyOrder,
        updateSellOrder,
        addHolding
    } = useStock();

    const {
        stockDataMap,
        holdingStocks,
        buyOrders,
        sellOrders,
        followingSymbols,
        sellWatching,
        displayVolume,
        alerts
    } = state;

    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    // Build rows data: stock rows (holding + following), buy rows, sell rows (if sellWatching)
    const rowsData = useMemo(() => {
        const rows = [];

        // Collect portfolio symbols (holding + following)
        const portfolioSymbols = new Set();
        holdingStocks.forEach(h => portfolioSymbols.add(h.symbol));
        const allDisplaySymbols = [...new Set([...followingSymbols, ...Array.from(portfolioSymbols)])];

        // Stock rows (holding + following only)
        allDisplaySymbols.forEach(symbol => {
            const data = stockDataMap.get(symbol);
            rows.push({ symbol, data, type: 'stock' });
        });

        // Buy order rows (separate)
        const buySymbols = [...new Set(buyOrders.map(b => b.symbol))];
        buySymbols.forEach(symbol => {
            const data = stockDataMap.get(symbol);
            rows.push({ symbol, data, type: 'buy' });
        });

        // Sell order rows (separate, if sellWatching)
        if (sellWatching) {
            const sellSymbols = [...new Set(sellOrders.map(s => s.symbol))];
            sellSymbols.forEach(symbol => {
                const data = stockDataMap.get(symbol);
                rows.push({ symbol, data, type: 'sell' });
            });
        }

        return rows;
    }, [stockDataMap, holdingStocks, followingSymbols, buyOrders, sellOrders, sellWatching]);

    // Sort rows
    const sortedRows = useMemo(() => {
        if (!sortColumn) return rowsData;

        return [...rowsData].sort((a, b) => {
            // Keep sell rows after stock/buy rows
            if (a.type === 'sell' && b.type !== 'sell') return 1;
            if (a.type !== 'sell' && b.type === 'sell') return -1;
            // Keep buy rows after stock rows
            if (a.type === 'buy' && b.type === 'stock') return 1;
            if (a.type === 'stock' && b.type === 'buy') return -1;

            // Same type, compare by column
            return compareRows(a, b, sortColumn, sortDirection, holdingStocks, buyOrders, sellOrders, sellWatching);
        });
    }, [rowsData, sortColumn, sortDirection, holdingStocks, buyOrders, sellOrders, sellWatching]);

    const handleSort = useCallback((column) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    const handleEdit = useCallback((symbol, type) => {
        if (type === 'buy') {
            const order = buyOrders.find(b => b.symbol === symbol);
            if (order) {
                const currentPriceInVND = order.price * CONSTANTS.PRICE_DIVISOR;
                const newPrice = prompt(`Chỉnh sửa giá mua cho ${symbol} (đồng):`, currentPriceInVND);
                if (newPrice !== null && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
                    updateBuyOrder({ ...order, price: parseFloat(newPrice) / CONSTANTS.PRICE_DIVISOR });
                }
            }
        } else if (type === 'sell') {
            const order = sellOrders.find(s => s.symbol === symbol);
            if (order) {
                const currentPriceInVND = order.price * CONSTANTS.PRICE_DIVISOR;
                const newPrice = prompt(`Chỉnh sửa giá bán cho ${symbol} (đồng):`, currentPriceInVND);
                if (newPrice !== null && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
                    updateSellOrder({ ...order, price: parseFloat(newPrice) / CONSTANTS.PRICE_DIVISOR });
                }
            }
        } else {
            const holding = holdingStocks.find(h => h.symbol === symbol);
            if (holding) {
                const newQuantity = prompt(`Chỉnh sửa số lượng cho ${symbol}:`, holding.quantity);
                if (newQuantity !== null && !isNaN(newQuantity) && parseInt(newQuantity) > 0) {
                    updateHolding(symbol, parseInt(newQuantity));
                }
            } else if (followingSymbols.includes(symbol)) {
                const quantity = prompt(`Nhập số lượng cho ${symbol} (để chuyển thành cổ phiếu đang nắm giữ):`, '');
                if (quantity !== null && quantity.trim() !== '') {
                    const qty = parseInt(quantity.trim());
                    if (!isNaN(qty) && qty > 0) {
                        removeFollowing(symbol);
                        addHolding(symbol, qty);
                    }
                }
            }
        }
    }, [buyOrders, sellOrders, holdingStocks, followingSymbols, updateBuyOrder, updateSellOrder, updateHolding, removeFollowing, addHolding]);

    const handleDelete = useCallback((symbol, type) => {
        if (!window.confirm(`Bạn có chắc muốn xóa ${symbol}?`)) return;

        if (type === 'buy') {
            removeBuyOrder(symbol);
        } else if (type === 'sell') {
            removeSellOrder(symbol);
        } else {
            // Stock type - check holding first, then following
            const holding = holdingStocks.find(h => h.symbol === symbol);
            if (holding) {
                removeHolding(symbol);
            } else if (followingSymbols.includes(symbol)) {
                removeFollowing(symbol);
            }
        }
    }, [holdingStocks, followingSymbols, removeHolding, removeBuyOrder, removeSellOrder, removeFollowing]);

    const getSortIcon = (column) => {
        if (sortColumn !== column) return ' ↕';
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    const getSortIconOpacity = (column) => {
        return sortColumn === column ? '1' : '0.3';
    };

    if (sortedRows.length === 0) {
        return (
            <div className="stock-section">
                <div className="empty-message">
                    Chưa có mã cổ phiếu nào. Hãy thêm mã theo dõi hoặc danh mục.
                </div>
            </div>
        );
    }

    return (
        <div className="stock-section">
            <div className="stock-table-container">
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th className="sortable" data-column="symbol" onClick={() => handleSort('symbol')}>
                                Mã CK <span className="sort-icon" style={{ opacity: getSortIconOpacity('symbol') }}>{getSortIcon('symbol')}</span>
                            </th>
                            <th className="sortable" data-column="quantity" onClick={() => handleSort('quantity')}>
                                Số lượng <span className="sort-icon" style={{ opacity: getSortIconOpacity('quantity') }}>{getSortIcon('quantity')}</span>
                            </th>
                            <th className="sortable" data-column="ceiling" onClick={() => handleSort('ceiling')}>
                                Trần <span className="sort-icon" style={{ opacity: getSortIconOpacity('ceiling') }}>{getSortIcon('ceiling')}</span>
                            </th>
                            <th className="sortable" data-column="floor" onClick={() => handleSort('floor')}>
                                Sàn <span className="sort-icon" style={{ opacity: getSortIconOpacity('floor') }}>{getSortIcon('floor')}</span>
                            </th>
                            <th className="sortable" data-column="ref" onClick={() => handleSort('ref')}>
                                TC <span className="sort-icon" style={{ opacity: getSortIconOpacity('ref') }}>{getSortIcon('ref')}</span>
                            </th>
                            <th className="sortable" data-column="price" onClick={() => handleSort('price')}>
                                Giá <span className="sort-icon" style={{ opacity: getSortIconOpacity('price') }}>{getSortIcon('price')}</span>
                            </th>
                            <th className="sortable" data-column="changeValue" onClick={() => handleSort('changeValue')}>
                                +/- <span className="sort-icon" style={{ opacity: getSortIconOpacity('changeValue') }}>{getSortIcon('changeValue')}</span>
                            </th>
                            <th className="sortable" data-column="changePercent" onClick={() => handleSort('changePercent')}>
                                % <span className="sort-icon" style={{ opacity: getSortIconOpacity('changePercent') }}>{getSortIcon('changePercent')}</span>
                            </th>
                            <th className="sortable" data-column="high" onClick={() => handleSort('high')}>
                                Cao <span className="sort-icon" style={{ opacity: getSortIconOpacity('high') }}>{getSortIcon('high')}</span>
                            </th>
                            <th className="sortable" data-column="low" onClick={() => handleSort('low')}>
                                Thấp <span className="sort-icon" style={{ opacity: getSortIconOpacity('low') }}>{getSortIcon('low')}</span>
                            </th>
                            {displayVolume && (
                                <>
                                    <th className="sortable" data-column="buyVol" onClick={() => handleSort('buyVol')}>
                                        Mua <span className="sort-icon" style={{ opacity: getSortIconOpacity('buyVol') }}>{getSortIcon('buyVol')}</span>
                                    </th>
                                    <th className="sortable" data-column="sellVol" onClick={() => handleSort('sellVol')}>
                                        Bán <span className="sort-icon" style={{ opacity: getSortIconOpacity('sellVol') }}>{getSortIcon('sellVol')}</span>
                                    </th>
                                </>
                            )}
                            <th className="sortable" data-column="diff" onClick={() => handleSort('diff')}>
                                Lời/Lỗ <span className="sort-icon" style={{ opacity: getSortIconOpacity('diff') }}>{getSortIcon('diff')}</span>
                            </th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map(({ symbol, data, type }) => {
                            if (type === 'buy') {
                                return (
                                    <BuyRow
                                        key={`${symbol}-buy`}
                                        symbol={symbol}
                                        data={data}
                                        buyOrders={buyOrders}
                                        displayVolume={displayVolume}
                                        alerts={alerts}
                                        onEdit={(s) => handleEdit(s, 'buy')}
                                        onDelete={(s) => handleDelete(s, 'buy')}
                                        onOpenChart={onOpenChart}
                                    />
                                );
                            } else if (type === 'sell') {
                                return (
                                    <SellRow
                                        key={`${symbol}-sell`}
                                        symbol={symbol}
                                        data={data}
                                        sellOrders={sellOrders}
                                        displayVolume={displayVolume}
                                        alerts={alerts}
                                        onEdit={(s) => handleEdit(s, 'sell')}
                                        onDelete={(s) => handleDelete(s, 'sell')}
                                        onOpenChart={onOpenChart}
                                    />
                                );
                            } else {
                                const holding = holdingStocks.find(h => h.symbol === symbol);
                                return (
                                    <StockRow
                                        key={`${symbol}-stock`}
                                        symbol={symbol}
                                        data={data}
                                        holding={holding}
                                        displayVolume={displayVolume}
                                        alerts={alerts}
                                        onEdit={(s) => handleEdit(s, 'stock')}
                                        onDelete={(s) => handleDelete(s, 'stock')}
                                        onOpenChart={onOpenChart}
                                    />
                                );
                            }
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Compare function for sorting
function compareRows(a, b, column, direction, holdingStocks, buyOrders, sellOrders, sellWatching) {
    const aData = a.data;
    const bData = b.data;

    if (!aData || !bData) return 0;
    if (aData.messageType !== CONSTANTS.MESSAGE_TYPE.MAIN || bData.messageType !== CONSTANTS.MESSAGE_TYPE.MAIN) return 0;

    let aValue, bValue;

    switch (column) {
        case 'symbol':
            aValue = a.symbol;
            bValue = b.symbol;
            break;
        case 'quantity':
            aValue = getQuantityForRow(a, holdingStocks, buyOrders, sellOrders);
            bValue = getQuantityForRow(b, holdingStocks, buyOrders, sellOrders);
            break;
        case 'price':
            aValue = getCurrentPrice(aData);
            bValue = getCurrentPrice(bData);
            break;
        case 'changeValue':
            aValue = getChangeValue(a, aData, buyOrders, sellOrders);
            bValue = getChangeValue(b, bData, buyOrders, sellOrders);
            break;
        case 'changePercent':
            aValue = getChangePercent(a, aData, buyOrders, sellOrders);
            bValue = getChangePercent(b, bData, buyOrders, sellOrders);
            break;
        case 'ref':
            aValue = (aData.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
            bValue = (bData.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
            break;
        case 'high':
            aValue = (aData.highestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            bValue = (bData.highestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            break;
        case 'low':
            aValue = (aData.lowestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            bValue = (bData.lowestPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            break;
        case 'ceiling':
            aValue = (aData.ceilingPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            bValue = (bData.ceilingPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            break;
        case 'floor':
            aValue = (aData.floorPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            bValue = (bData.floorPrice || 0) / CONSTANTS.PRICE_DIVISOR;
            break;
        case 'buyVol':
            aValue = calculateTotalBuyVolume(aData);
            bValue = calculateTotalBuyVolume(bData);
            break;
        case 'sellVol':
            aValue = calculateTotalSellVolume(aData);
            bValue = calculateTotalSellVolume(bData);
            break;
        case 'diff':
            aValue = getDiffValue(a, aData, holdingStocks, buyOrders, sellOrders);
            bValue = getDiffValue(b, bData, holdingStocks, buyOrders, sellOrders);
            break;
        default:
            return 0;
    }

    if (typeof aValue === 'string') {
        return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
}

function getQuantityForRow(row, holdingStocks, buyOrders, sellOrders) {
    if (row.type === 'buy') {
        return buyOrders.filter(b => b.symbol === row.symbol).reduce((sum, o) => sum + o.quantity, 0);
    } else if (row.type === 'sell') {
        return sellOrders.filter(s => s.symbol === row.symbol).reduce((sum, o) => sum + o.quantity, 0);
    } else {
        const holding = holdingStocks.find(h => h.symbol === row.symbol);
        return holding ? holding.quantity : 0;
    }
}

function getChangeValue(row, data, buyOrders, sellOrders) {
    const currentPrice = getCurrentPrice(data);
    const marketRef = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;

    if (row.type === 'buy') {
        const orders = buyOrders.filter(b => b.symbol === row.symbol);
        let totalAmount = 0, totalQty = 0;
        orders.forEach(o => { totalAmount += o.price * o.quantity; totalQty += o.quantity; });
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        return currentPrice - avgPrice;
    } else if (row.type === 'sell') {
        const orders = sellOrders.filter(s => s.symbol === row.symbol);
        let totalAmount = 0, totalQty = 0;
        orders.forEach(o => { totalAmount += o.price * o.quantity; totalQty += o.quantity; });
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        return avgPrice - currentPrice;
    }
    return currentPrice - marketRef;
}

function getChangePercent(row, data, buyOrders, sellOrders) {
    const changeValue = getChangeValue(row, data, buyOrders, sellOrders);
    const currentPrice = getCurrentPrice(data);
    const marketRef = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;

    if (row.type === 'buy') {
        const orders = buyOrders.filter(b => b.symbol === row.symbol);
        let totalAmount = 0, totalQty = 0;
        orders.forEach(o => { totalAmount += o.price * o.quantity; totalQty += o.quantity; });
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        return avgPrice > 0 ? (changeValue / avgPrice) * 100 : 0;
    } else if (row.type === 'sell') {
        const orders = sellOrders.filter(s => s.symbol === row.symbol);
        let totalAmount = 0, totalQty = 0;
        orders.forEach(o => { totalAmount += o.price * o.quantity; totalQty += o.quantity; });
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        return avgPrice > 0 ? (changeValue / avgPrice) * 100 : 0;
    }
    return marketRef > 0 ? (changeValue / marketRef) * 100 : 0;
}

function getDiffValue(row, data, holdingStocks, buyOrders, sellOrders) {
    const currentPrice = getCurrentPrice(data);
    const marketRef = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;

    if (row.type === 'buy') {
        const orders = buyOrders.filter(b => b.symbol === row.symbol);
        let totalAmount = 0, totalFee = 0, totalQty = 0;
        orders.forEach(o => {
            totalAmount += o.price * o.quantity;
            totalFee += o.fee * o.price * o.quantity;
            totalQty += o.quantity;
        });
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        return Math.round(((currentPrice - avgPrice) * totalQty - totalFee) * 1000);
    } else if (row.type === 'sell') {
        const orders = sellOrders.filter(s => s.symbol === row.symbol);
        let totalAmount = 0, totalQty = 0;
        orders.forEach(o => { totalAmount += o.price * o.quantity; totalQty += o.quantity; });
        const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;
        return Math.round((avgPrice - currentPrice) * totalQty * 1000);
    } else {
        const holding = holdingStocks.find(h => h.symbol === row.symbol);
        if (holding) {
            return Math.round((currentPrice - marketRef) * holding.quantity * 1000);
        }
        return 0;
    }
}

export default StockTable;
