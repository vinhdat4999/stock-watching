import { useMemo } from 'react';
import { CONSTANTS } from '../utils/constants';
import { getCurrentPrice, getDiffColor } from '../utils/stockUtils';

// Calculate holding diff: diff = (currentPrice - refPrice) * quantity * 1000
function calculateHoldingDiff(holding, data) {
    if (!holding || !data) return null;

    const currentPrice = getCurrentPrice(data);
    const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;

    // Follow Java logic: diff = price - refPrice, diffValue = round(diff * quantity)
    const diff = currentPrice - refPrice;
    const diffValue = Math.round(diff * holding.quantity);
    return diffValue * 1000; // Convert to VND
}

// Calculate buy order diff: (currentPrice - avgBuyPrice) * quantity - totalFee
function calculateBuyOrderDiff(symbol, buyOrders, data) {
    const buyOrdersForSymbol = buyOrders.filter(b => b.symbol === symbol);
    if (buyOrdersForSymbol.length === 0) return null;

    // Calculate average buy price (excluding fees) and total fee
    let totalBuyAmount = 0;
    let totalBuyFee = 0;
    let totalQuantity = 0;
    buyOrdersForSymbol.forEach(order => {
        totalBuyAmount += order.price * order.quantity;
        totalBuyFee += order.fee * order.price * order.quantity;
        totalQuantity += order.quantity;
    });

    if (totalQuantity === 0) return null;

    const currentPrice = getCurrentPrice(data);
    const avgBuyPrice = totalBuyAmount / totalQuantity;

    // diff = currentPrice - buyPrice
    const diff = currentPrice - avgBuyPrice;
    // totalDiff = diff * totalQuantity - totalBuyFee
    const totalDiff = diff * totalQuantity - totalBuyFee;

    return Math.round(totalDiff * 1000); // Convert to VND
}

// Calculate sell order diff: (sellPrice - refPrice) * quantity - totalFee
function calculateSellOrderDiff(symbol, sellOrders, data) {
    const sellOrdersForSymbol = sellOrders.filter(s => s.symbol === symbol);
    if (sellOrdersForSymbol.length === 0) return null;

    // Calculate average sell price and total fee
    let totalSellAmount = 0;
    let totalSellFee = 0;
    let totalQuantity = 0;
    sellOrdersForSymbol.forEach(order => {
        totalSellAmount += order.price * order.quantity;
        totalSellFee += (order.fee || 0) * order.price * order.quantity;
        totalQuantity += order.quantity;
    });

    if (totalQuantity === 0) return null;

    const avgSellPrice = totalSellAmount / totalQuantity;
    const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;

    // Realized P/L: diff = sellPrice - refPrice
    const diff = avgSellPrice - refPrice;
    const totalDiff = (diff * totalQuantity) - totalSellFee;

    return Math.round(totalDiff * 1000); // Convert to VND
}

export function usePortfolioCalculations(stockDataMap, holdingStocks, buyOrders, sellOrders, sellWatching = true) {
    return useMemo(() => {
        let totalDiff = 0;
        let totalInvestment = 0;
        let currentValue = 0;
        let todayPL = 0;
        const processedSymbols = new Set();

        // Calculate holding stocks diff and stats
        holdingStocks.forEach(holding => {
            if (processedSymbols.has(holding.symbol)) return;
            processedSymbols.add(holding.symbol);

            const data = stockDataMap.get(holding.symbol);
            if (data && data.messageType === CONSTANTS.MESSAGE_TYPE.MAIN) {
                const currentPrice = getCurrentPrice(data);
                const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
                const quantity = holding.quantity;

                // Find buy orders for this stock to get average buy price
                const buyOrdersForSymbol = buyOrders.filter(b => b.symbol === holding.symbol);
                let avgBuyPrice = refPrice;
                let totalBuyFee = 0;

                if (buyOrdersForSymbol.length > 0) {
                    let totalAmount = 0, totalQty = 0;
                    buyOrdersForSymbol.forEach(order => {
                        totalAmount += order.price * order.quantity;
                        totalBuyFee += (order.fee || 0) * order.price * order.quantity;
                        totalQty += order.quantity;
                    });
                    avgBuyPrice = totalQty > 0 ? totalAmount / totalQty : refPrice;
                }

                const investmentForHolding = avgBuyPrice * quantity * CONSTANTS.PRICE_DIVISOR + totalBuyFee * CONSTANTS.PRICE_DIVISOR;
                const currentValueForHolding = currentPrice * quantity * CONSTANTS.PRICE_DIVISOR;
                const todayPLForHolding = (currentPrice - refPrice) * quantity * CONSTANTS.PRICE_DIVISOR;

                totalInvestment += investmentForHolding;
                currentValue += currentValueForHolding;
                todayPL += todayPLForHolding;

                const diff = calculateHoldingDiff(holding, data);
                if (diff !== null) totalDiff += diff;
            }
        });

        // Calculate buy orders diff (once per symbol) - for stocks NOT in holding
        const buyOnlySymbols = [...new Set(buyOrders.map(b => b.symbol))].filter(
            symbol => !holdingStocks.find(h => h.symbol === symbol)
        );

        buyOnlySymbols.forEach(symbol => {
            if (processedSymbols.has('buy_' + symbol)) return;
            processedSymbols.add('buy_' + symbol);

            const data = stockDataMap.get(symbol);
            if (data && data.messageType === CONSTANTS.MESSAGE_TYPE.MAIN) {
                const currentPrice = getCurrentPrice(data);
                const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
                const symbolBuyOrders = buyOrders.filter(b => b.symbol === symbol);

                let totalAmount = 0, totalQty = 0, totalFee = 0;
                symbolBuyOrders.forEach(order => {
                    totalAmount += order.price * order.quantity;
                    totalFee += (order.fee || 0) * order.price * order.quantity;
                    totalQty += order.quantity;
                });

                const investmentForBuy = (totalAmount + totalFee) * CONSTANTS.PRICE_DIVISOR;
                const currentValueForBuy = currentPrice * totalQty * CONSTANTS.PRICE_DIVISOR;
                const todayPLForBuy = (currentPrice - refPrice) * totalQty * CONSTANTS.PRICE_DIVISOR;

                totalInvestment += investmentForBuy;
                currentValue += currentValueForBuy;
                todayPL += todayPLForBuy;

                const diff = calculateBuyOrderDiff(symbol, buyOrders, data);
                if (diff !== null) totalDiff += diff;
            }
        });

        // Calculate sell orders diff (once per symbol) - only if sellWatching is enabled
        if (sellWatching) {
            const sellSymbols = [...new Set(sellOrders.map(s => s.symbol))];
            sellSymbols.forEach(symbol => {
                const data = stockDataMap.get(symbol);
                if (data && data.messageType === CONSTANTS.MESSAGE_TYPE.MAIN) {
                    const diff = calculateSellOrderDiff(symbol, sellOrders, data);
                    if (diff !== null) totalDiff += diff;
                }
            });
        }

        // Calculate percentages
        const totalPL = currentValue - totalInvestment;
        const totalPLPercent = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;
        const todayPLPercent = totalInvestment > 0 ? (todayPL / totalInvestment) * 100 : 0;

        return {
            totalDiff,
            totalInvestment: Math.round(totalInvestment),
            currentValue: Math.round(currentValue),
            todayPL: Math.round(todayPL),
            totalPL: Math.round(totalPL),
            totalPLPercent,
            todayPLPercent,
            diffColor: getDiffColor(totalDiff, 0, null, null, null)
        };
    }, [stockDataMap, holdingStocks, buyOrders, sellOrders, sellWatching]);
}
