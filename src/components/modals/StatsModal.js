import React, { useMemo } from 'react';
import { useStock } from '../../context/StockContext';
import { usePortfolioCalculations } from '../../hooks/usePortfolioCalculations';
import { formatNumber, formatPrice } from '../../utils/formatters';
import { CONSTANTS } from '../../utils/constants';
import { getCurrentPrice, getDiffColor } from '../../utils/stockUtils';

function StatsModal({ isOpen, onClose }) {
    const { state } = useStock();
    const { stockDataMap, holdingStocks, buyOrders, sellOrders } = state;

    const {
        totalDiff,
        totalInvestment,
        currentValue,
        todayPL,
        totalPLPercent,
        todayPLPercent
    } = usePortfolioCalculations(stockDataMap, holdingStocks, buyOrders, sellOrders);

    // Calculate detailed stats
    const stats = useMemo(() => {
        let profitableCount = 0;
        let losingCount = 0;
        let totalProfit = 0;
        let totalLoss = 0;
        let bestStock = { symbol: '-', value: 0, percent: 0 };
        let worstStock = { symbol: '-', value: 0, percent: 0 };
        let bestToday = { symbol: '-', value: 0, percent: 0 };
        let worstToday = { symbol: '-', value: 0, percent: 0 };
        let largestPosition = { symbol: '-', value: 0 };

        const breakdown = [];

        holdingStocks.forEach(holding => {
            const data = stockDataMap.get(holding.symbol);
            if (!data) return;

            const currentPrice = getCurrentPrice(data);
            const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
            const buyOrder = buyOrders.find(b => b.symbol === holding.symbol);
            const costBasis = buyOrder ? buyOrder.price : refPrice;

            const holdingValue = currentPrice * holding.quantity * CONSTANTS.PRICE_DIVISOR;
            const costValue = costBasis * holding.quantity * CONSTANTS.PRICE_DIVISOR;
            const diff = holdingValue - costValue;
            const diffPercent = costValue > 0 ? (diff / costValue) * 100 : 0;

            const todayChange = (currentPrice - refPrice) * holding.quantity * CONSTANTS.PRICE_DIVISOR;
            const todayChangePercent = refPrice > 0 ? ((currentPrice - refPrice) / refPrice) * 100 : 0;

            // Track profitable/losing
            if (diff > 0) {
                profitableCount++;
                totalProfit += diff;
            } else if (diff < 0) {
                losingCount++;
                totalLoss += Math.abs(diff);
            }

            // Track best/worst overall
            if (diff > bestStock.value) {
                bestStock = { symbol: holding.symbol, value: diff, percent: diffPercent };
            }
            if (diff < worstStock.value) {
                worstStock = { symbol: holding.symbol, value: diff, percent: diffPercent };
            }

            // Track best/worst today
            if (todayChange > bestToday.value) {
                bestToday = { symbol: holding.symbol, value: todayChange, percent: todayChangePercent };
            }
            if (todayChange < worstToday.value) {
                worstToday = { symbol: holding.symbol, value: todayChange, percent: todayChangePercent };
            }

            // Track largest position
            if (holdingValue > largestPosition.value) {
                largestPosition = { symbol: holding.symbol, value: holdingValue };
            }

            breakdown.push({
                symbol: holding.symbol,
                quantity: holding.quantity,
                costBasis,
                currentPrice,
                holdingValue,
                costValue,
                diff,
                diffPercent,
                todayChange,
                todayChangePercent
            });
        });

        const totalStocks = holdingStocks.length;
        const winRate = totalStocks > 0 ? (profitableCount / totalStocks) * 100 : 0;
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
        const avgProfit = profitableCount > 0 ? totalProfit / profitableCount : 0;
        const avgLoss = losingCount > 0 ? totalLoss / losingCount : 0;

        // Calculate max drawdown (simplified)
        const maxDrawdown = totalInvestment > 0 ? Math.min(0, totalDiff) / totalInvestment * 100 : 0;

        return {
            totalStocks,
            profitableCount,
            losingCount,
            winRate,
            profitFactor,
            avgProfit,
            avgLoss,
            maxDrawdown,
            bestStock,
            worstStock,
            bestToday,
            worstToday,
            largestPosition,
            breakdown
        };
    }, [stockDataMap, holdingStocks, buyOrders, totalInvestment, totalDiff]);

    if (!isOpen) return null;

    const formatStockStat = (stat) => {
        if (stat.symbol === '-') return '-';
        const sign = stat.value >= 0 ? '+' : '';
        return `${stat.symbol}: ${sign}${formatNumber(stat.value)}đ (${sign}${formatPrice(stat.percent)}%)`;
    };

    return (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content stats-modal-content">
                <div className="modal-header">
                    <h3>📊 Thống kê danh mục</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {/* Financial Overview */}
                    <div className="stats-section">
                        <h4 className="stats-section-title">💰 Tổng quan tài chính</h4>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">Tổng đầu tư</div>
                                <div className="stat-value">{formatNumber(totalInvestment)} đ</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Giá trị hiện tại</div>
                                <div className="stat-value">{formatNumber(currentValue)} đ</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Lời/Lỗ hôm nay</div>
                                <div className={`stat-value ${getDiffColor(todayPL, 0, null, null, null)}`}>
                                    {todayPL >= 0 ? '+' : ''}{formatNumber(todayPL)} đ
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">% Lời/Lỗ hôm nay</div>
                                <div className={`stat-value ${getDiffColor(todayPLPercent, 0, null, null, null)}`}>
                                    {todayPLPercent >= 0 ? '+' : ''}{formatPrice(todayPLPercent)}%
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Tổng lời/lỗ</div>
                                <div className={`stat-value ${getDiffColor(totalDiff, 0, null, null, null)}`}>
                                    {totalDiff >= 0 ? '+' : ''}{formatNumber(totalDiff)} đ
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">% Tổng lời/lỗ</div>
                                <div className={`stat-value ${getDiffColor(totalPLPercent, 0, null, null, null)}`}>
                                    {totalPLPercent >= 0 ? '+' : ''}{formatPrice(totalPLPercent)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Performance */}
                    <div className="stats-section">
                        <h4 className="stats-section-title">📊 Hiệu suất danh mục</h4>
                        <div className="stats-grid stats-grid-small">
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">Tổng số mã</div>
                                <div className="stat-value">{stats.totalStocks}</div>
                            </div>
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">Lãi / Lỗ</div>
                                <div className="stat-value">{stats.profitableCount} / {stats.losingCount}</div>
                            </div>
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">Tỷ lệ thắng</div>
                                <div className="stat-value">{formatPrice(stats.winRate)}%</div>
                            </div>
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">Profit Factor</div>
                                <div className="stat-value">
                                    {stats.profitFactor === Infinity ? '∞' : formatPrice(stats.profitFactor)}
                                </div>
                            </div>
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">Max Drawdown</div>
                                <div className="stat-value red">{formatPrice(stats.maxDrawdown)}%</div>
                            </div>
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">Vị thế lớn nhất</div>
                                <div className="stat-value stat-value-small">
                                    {stats.largestPosition.symbol}: {formatNumber(stats.largestPosition.value)}đ
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="stats-section">
                        <h4 className="stats-section-title">🏆 Mã nổi bật</h4>
                        <div className="stats-grid stats-grid-4col">
                            <div className="stat-card stat-card-performer">
                                <div className="stat-label">🥇 Tốt nhất (Tổng)</div>
                                <div className="stat-value stat-value-small green">
                                    {formatStockStat(stats.bestStock)}
                                </div>
                            </div>
                            <div className="stat-card stat-card-performer">
                                <div className="stat-label">📉 Tệ nhất (Tổng)</div>
                                <div className="stat-value stat-value-small red">
                                    {formatStockStat(stats.worstStock)}
                                </div>
                            </div>
                            <div className="stat-card stat-card-performer">
                                <div className="stat-label">⭐ Tốt nhất hôm nay</div>
                                <div className="stat-value stat-value-small green">
                                    {formatStockStat(stats.bestToday)}
                                </div>
                            </div>
                            <div className="stat-card stat-card-performer">
                                <div className="stat-label">📌 Tệ nhất hôm nay</div>
                                <div className="stat-value stat-value-small red">
                                    {formatStockStat(stats.worstToday)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Average Statistics */}
                    <div className="stats-section">
                        <h4 className="stats-section-title">📈 Thống kê trung bình</h4>
                        <div className="stats-grid stats-grid-small">
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">TB lời mỗi mã</div>
                                <div className="stat-value green">+{formatNumber(stats.avgProfit)} đ</div>
                            </div>
                            <div className="stat-card stat-card-small">
                                <div className="stat-label">TB lỗ mỗi mã</div>
                                <div className="stat-value red">-{formatNumber(stats.avgLoss)} đ</div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    {stats.breakdown.length > 0 && (
                        <div className="stats-breakdown">
                            <h4>📋 Chi tiết theo mã</h4>
                            <div className="stats-table-container">
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th>Mã</th>
                                            <th>SL</th>
                                            <th>Giá vốn</th>
                                            <th>Giá hiện tại</th>
                                            <th>Giá trị</th>
                                            <th>Lời/Lỗ</th>
                                            <th>%</th>
                                            <th>Hôm nay</th>
                                            <th>% HN</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.breakdown.map(item => (
                                            <tr key={item.symbol}>
                                                <td>{item.symbol}</td>
                                                <td>{formatNumber(item.quantity)}</td>
                                                <td>{formatPrice(item.costBasis)}</td>
                                                <td>{formatPrice(item.currentPrice)}</td>
                                                <td>{formatNumber(item.holdingValue)}</td>
                                                <td className={getDiffColor(item.diff, 0, null, null, null)}>
                                                    {item.diff >= 0 ? '+' : ''}{formatNumber(item.diff)}
                                                </td>
                                                <td className={getDiffColor(item.diffPercent, 0, null, null, null)}>
                                                    {item.diffPercent >= 0 ? '+' : ''}{formatPrice(item.diffPercent)}%
                                                </td>
                                                <td className={getDiffColor(item.todayChange, 0, null, null, null)}>
                                                    {item.todayChange >= 0 ? '+' : ''}{formatNumber(item.todayChange)}
                                                </td>
                                                <td className={getDiffColor(item.todayChangePercent, 0, null, null, null)}>
                                                    {item.todayChangePercent >= 0 ? '+' : ''}{formatPrice(item.todayChangePercent)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="stats-table-total">
                                            <td>Tổng</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td>{formatNumber(currentValue)}</td>
                                            <td className={getDiffColor(totalDiff, 0, null, null, null)}>
                                                {totalDiff >= 0 ? '+' : ''}{formatNumber(totalDiff)}
                                            </td>
                                            <td className={getDiffColor(totalPLPercent, 0, null, null, null)}>
                                                {totalPLPercent >= 0 ? '+' : ''}{formatPrice(totalPLPercent)}%
                                            </td>
                                            <td className={getDiffColor(todayPL, 0, null, null, null)}>
                                                {todayPL >= 0 ? '+' : ''}{formatNumber(todayPL)}
                                            </td>
                                            <td className={getDiffColor(todayPLPercent, 0, null, null, null)}>
                                                {todayPLPercent >= 0 ? '+' : ''}{formatPrice(todayPLPercent)}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StatsModal;
