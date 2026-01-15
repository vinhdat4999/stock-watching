import React from 'react';
import { CONSTANTS } from '../utils/constants';
import { formatPrice, formatNumber } from '../utils/formatters';
import { getDiffColor } from '../utils/stockUtils';

function IndexCard({ symbol, data }) {
    if (!data) return null;

    const price = data.lastTradePrice || 0;
    const change = data.change || 0;
    const changePercent = data.changePercent || 0;
    const color = getDiffColor(change, changePercent, price, null, null);
    const sign = change >= 0 ? '+' : '-';
    const totalVolume = data.totalVolume ? (data.totalVolume / CONSTANTS.VOLUME_DIVISOR) : 0;

    return (
        <div className="index-card">
            <div className="index-name">{symbol}</div>
            <div className={`index-price ${color}`}>
                {formatPrice(price)}
            </div>
            <div className={`index-change ${color}`}>
                {sign}{formatPrice(Math.abs(change))} ({sign}{formatPrice(Math.abs(changePercent))}%)
            </div>
            {/* Index always shows volume (like original JS) */}
            {totalVolume > 0 && (
                <div className="index-volume">
                    {formatNumber(totalVolume, 3)} tỷ
                </div>
            )}
        </div>
    );
}

export default React.memo(IndexCard);
