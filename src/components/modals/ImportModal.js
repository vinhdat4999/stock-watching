import React, { useState } from 'react';
import { useStock } from '../../context/StockContext';
import { parseYamlImport } from '../../services/storageService';
import { CONSTANTS } from '../../utils/constants';

function ImportModal({ isOpen, onClose }) {
    const { importData, updateSettings } = useStock();
    const [yamlText, setYamlText] = useState('');

    const handleImport = () => {
        if (!yamlText.trim()) return;

        const parsed = parseYamlImport(yamlText);

        // Convert prices from VND to internal format
        const convertedBuy = parsed.buy.map(b => ({
            ...b,
            price: b.price / CONSTANTS.PRICE_DIVISOR
        }));

        const convertedSell = parsed.sell.map(s => ({
            ...s,
            price: s.price / CONSTANTS.PRICE_DIVISOR
        }));

        importData({
            followingSymbols: parsed.following,
            holdingStocks: parsed.holding,
            buyOrders: convertedBuy,
            sellOrders: convertedSell
        });

        updateSettings(parsed.config);

        setYamlText('');
        onClose();
    };

    if (!isOpen) return null;

    const placeholder = `following:
- symbol: MBB
- symbol: PDR
holding:
  - symbol: MBB
    quantity: 35000
  - symbol: PDR
    quantity: 5000
buy:
sell:
config:
  displayIndex: true
  displayVolume: false
  sellWatching: true`;

    return (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>📥 Import dữ liệu</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="import-instructions">
                        <p>Dán định dạng YAML vào đây:</p>
                        <textarea
                            id="importTextarea"
                            placeholder={placeholder}
                            value={yamlText}
                            onChange={e => setYamlText(e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="save-btn" onClick={handleImport}>Import</button>
                </div>
            </div>
        </div>
    );
}

export default ImportModal;
