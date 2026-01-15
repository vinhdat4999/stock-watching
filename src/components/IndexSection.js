import React from 'react';
import { useStock } from '../context/StockContext';
import { CONSTANTS } from '../utils/constants';
import IndexCard from './IndexCard';

function IndexSection() {
    const { state } = useStock();
    const { stockDataMap, displayIndex } = state;

    if (!displayIndex) return null;

    const indices = ['VNINDEX', 'VN30'];

    return (
        <div className="index-section-left">
            <div className="index-grid">
                {indices.map(symbol => {
                    const data = stockDataMap.get(symbol);
                    if (!data || data.messageType !== CONSTANTS.MESSAGE_TYPE.INDEX) {
                        return null;
                    }
                    return (
                        <IndexCard
                            key={symbol}
                            symbol={symbol}
                            data={data}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default IndexSection;
