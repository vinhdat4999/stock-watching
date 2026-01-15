import React from 'react';
import { useStock } from '../context/StockContext';
import { usePortfolioCalculations } from '../hooks/usePortfolioCalculations';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatNumber } from '../utils/formatters';

function PortfolioSummary() {
    const { state } = useStock();
    const { stockDataMap, holdingStocks, buyOrders, sellOrders, sellWatching } = state;

    const {
        totalDiff,
        diffColor
    } = usePortfolioCalculations(stockDataMap, holdingStocks, buyOrders, sellOrders, sellWatching);

    // Update page title with portfolio P/L
    const hasPortfolio = holdingStocks.length > 0 || buyOrders.length > 0 || sellOrders.length > 0;
    usePageTitle(totalDiff, hasPortfolio);

    if (holdingStocks.length === 0 && buyOrders.length === 0) {
        return null;
    }

    const sign = totalDiff >= 0 ? '+' : '';

    return (
        <div className="portfolio-summary-section">
            <div className="portfolio-summary-card">
                <span className="summary-title">Lời/Lỗ hôm nay:</span>
                <span className={`summary-amount ${diffColor}`}>
                    {sign}{formatNumber(totalDiff)} đ
                </span>
            </div>
        </div>
    );
}

export default PortfolioSummary;
