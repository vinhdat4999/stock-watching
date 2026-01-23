import React, { useState, useRef } from 'react';
import { useStock } from '../context/StockContext';
import { CONSTANTS, DEFAULT_BUY_FEE, DEFAULT_SELL_FEE } from '../utils/constants';

function PortfolioTabs() {
    const { state, addHolding, addBuyOrder, addSellOrder, addFollowing, setActiveTab } = useStock();
    const { activeTab } = state;

    // Form states
    const [holdingSymbol, setHoldingSymbol] = useState('');
    const [holdingQuantity, setHoldingQuantity] = useState('');

    const [buySymbol, setBuySymbol] = useState('');
    const [buyQuantity, setBuyQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [buyFee, setBuyFee] = useState('0.15');

    const [sellSymbol, setSellSymbol] = useState('');
    const [sellQuantity, setSellQuantity] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [sellFee, setSellFee] = useState('0.25');

    const [followingSymbol, setFollowingSymbol] = useState('');

    // Mobile form visibility states
    const [holdingFormOpen, setHoldingFormOpen] = useState(false);
    const [buyFormOpen, setBuyFormOpen] = useState(false);
    const [sellFormOpen, setSellFormOpen] = useState(false);
    const [followingFormOpen, setFollowingFormOpen] = useState(false);

    // Refs for input fields
    const holdingSymbolRef = useRef(null);
    const buySymbolRef = useRef(null);
    const sellSymbolRef = useRef(null);
    const followingSymbolRef = useRef(null);

    const handleAddHolding = () => {
        if (holdingSymbol && holdingQuantity > 0) {
            addHolding(holdingSymbol, parseInt(holdingQuantity));
            setHoldingSymbol('');
            setHoldingQuantity('');
            // Focus back to symbol input
            setTimeout(() => {
                if (holdingSymbolRef.current) {
                    holdingSymbolRef.current.focus();
                }
            }, 0);
        }
    };

    const handleAddBuy = () => {
        if (buySymbol && buyQuantity > 0 && buyPrice > 0) {
            const price = parseFloat(buyPrice) / CONSTANTS.PRICE_DIVISOR;
            const fee = parseFloat(buyFee) / 100 || DEFAULT_BUY_FEE;
            addBuyOrder(buySymbol, parseInt(buyQuantity), price, fee);
            setBuySymbol('');
            setBuyQuantity('');
            setBuyPrice('');
            // Focus back to symbol input
            setTimeout(() => {
                if (buySymbolRef.current) {
                    buySymbolRef.current.focus();
                }
            }, 0);
        }
    };

    const handleAddSell = () => {
        if (sellSymbol && sellQuantity > 0 && sellPrice > 0) {
            const price = parseFloat(sellPrice) / CONSTANTS.PRICE_DIVISOR;
            const fee = parseFloat(sellFee) / 100 || DEFAULT_SELL_FEE;
            addSellOrder(sellSymbol, parseInt(sellQuantity), price, fee);
            setSellSymbol('');
            setSellQuantity('');
            setSellPrice('');
            // Focus back to symbol input
            setTimeout(() => {
                if (sellSymbolRef.current) {
                    sellSymbolRef.current.focus();
                }
            }, 0);
        }
    };

    const handleAddFollowing = () => {
        if (followingSymbol) {
            const symbols = followingSymbol.split(',')
                .map(s => s.trim().toUpperCase())
                .filter(s => s.length > 0);
            symbols.forEach(symbol => addFollowing(symbol));
            setFollowingSymbol('');
            // Focus back to symbol input
            setTimeout(() => {
                if (followingSymbolRef.current) {
                    followingSymbolRef.current.focus();
                }
            }, 0);
        }
    };

    const handleKeyPress = (e, handler) => {
        if (e.key === 'Enter') {
            handler();
        }
    };

    const tabs = [
        { id: 'holding', label: 'Đang nắm giữ' },
        { id: 'buy', label: 'Lệnh mua' },
        { id: 'sell', label: 'Lệnh bán' },
        { id: 'following', label: 'Theo dõi' }
    ];

    return (
        <div className="portfolio-content">
            <div className="portfolio-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Holding Tab */}
            <div className={`tab-content ${activeTab === 'holding' ? 'active' : ''}`}>
                <button 
                    className={`mobile-form-toggle ${holdingFormOpen ? 'active' : ''}`}
                    onClick={() => setHoldingFormOpen(!holdingFormOpen)}
                >
                    <span className="toggle-icon">{holdingFormOpen ? '−' : '+'}</span>
                    <span className="toggle-text">Thêm cổ phiếu đang nắm giữ</span>
                </button>
                <div className={`form-group ${holdingFormOpen ? 'active' : ''}`}>
                    <h3>Thêm cổ phiếu đang nắm giữ</h3>
                    <div className="form-row">
                        <input
                            ref={holdingSymbolRef}
                            type="text"
                            placeholder="Mã CK (VD: MBB)"
                            maxLength={10}
                            value={holdingSymbol}
                            onChange={e => setHoldingSymbol(e.target.value.toUpperCase())}
                            onKeyPress={e => handleKeyPress(e, handleAddHolding)}
                        />
                        <input
                            type="number"
                            placeholder="Số lượng"
                            min={1}
                            value={holdingQuantity}
                            onChange={e => setHoldingQuantity(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddHolding)}
                        />
                        <button onClick={handleAddHolding}>Thêm</button>
                    </div>
                </div>
            </div>

            {/* Buy Tab */}
            <div className={`tab-content ${activeTab === 'buy' ? 'active' : ''}`}>
                <button 
                    className={`mobile-form-toggle ${buyFormOpen ? 'active' : ''}`}
                    onClick={() => setBuyFormOpen(!buyFormOpen)}
                >
                    <span className="toggle-icon">{buyFormOpen ? '−' : '+'}</span>
                    <span className="toggle-text">Thêm lệnh mua</span>
                </button>
                <div className={`form-group ${buyFormOpen ? 'active' : ''}`}>
                    <h3>Thêm lệnh mua</h3>
                    <div className="form-row">
                        <input
                            ref={buySymbolRef}
                            type="text"
                            placeholder="Mã CK"
                            maxLength={10}
                            value={buySymbol}
                            onChange={e => setBuySymbol(e.target.value.toUpperCase())}
                            onKeyPress={e => handleKeyPress(e, handleAddBuy)}
                        />
                        <input
                            type="number"
                            placeholder="Số lượng"
                            min={1}
                            value={buyQuantity}
                            onChange={e => setBuyQuantity(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddBuy)}
                        />
                        <input
                            type="number"
                            placeholder="Giá mua (đồng)"
                            min={0}
                            step={0.01}
                            value={buyPrice}
                            onChange={e => setBuyPrice(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddBuy)}
                        />
                        <input
                            type="number"
                            placeholder="Phí (%)"
                            min={0}
                            max={100}
                            step={0.0001}
                            value={buyFee}
                            onChange={e => setBuyFee(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddBuy)}
                        />
                        <button onClick={handleAddBuy}>Thêm</button>
                    </div>
                </div>
            </div>

            {/* Sell Tab */}
            <div className={`tab-content ${activeTab === 'sell' ? 'active' : ''}`}>
                <button 
                    className={`mobile-form-toggle ${sellFormOpen ? 'active' : ''}`}
                    onClick={() => setSellFormOpen(!sellFormOpen)}
                >
                    <span className="toggle-icon">{sellFormOpen ? '−' : '+'}</span>
                    <span className="toggle-text">Thêm lệnh bán</span>
                </button>
                <div className={`form-group ${sellFormOpen ? 'active' : ''}`}>
                    <h3>Thêm lệnh bán</h3>
                    <div className="form-row">
                        <input
                            ref={sellSymbolRef}
                            type="text"
                            placeholder="Mã CK"
                            maxLength={10}
                            value={sellSymbol}
                            onChange={e => setSellSymbol(e.target.value.toUpperCase())}
                            onKeyPress={e => handleKeyPress(e, handleAddSell)}
                        />
                        <input
                            type="number"
                            placeholder="Số lượng"
                            min={1}
                            value={sellQuantity}
                            onChange={e => setSellQuantity(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddSell)}
                        />
                        <input
                            type="number"
                            placeholder="Giá bán (đồng)"
                            min={0}
                            step={0.01}
                            value={sellPrice}
                            onChange={e => setSellPrice(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddSell)}
                        />
                        <input
                            type="number"
                            placeholder="Phí (%)"
                            min={0}
                            max={100}
                            step={0.0001}
                            value={sellFee}
                            onChange={e => setSellFee(e.target.value)}
                            onKeyPress={e => handleKeyPress(e, handleAddSell)}
                        />
                        <button onClick={handleAddSell}>Thêm</button>
                    </div>
                </div>
            </div>

            {/* Following Tab */}
            <div className={`tab-content ${activeTab === 'following' ? 'active' : ''}`}>
                <button 
                    className={`mobile-form-toggle ${followingFormOpen ? 'active' : ''}`}
                    onClick={() => setFollowingFormOpen(!followingFormOpen)}
                >
                    <span className="toggle-icon">{followingFormOpen ? '−' : '+'}</span>
                    <span className="toggle-text">Thêm mã theo dõi</span>
                </button>
                <div className={`form-group ${followingFormOpen ? 'active' : ''}`}>
                    <h3>Thêm mã theo dõi</h3>
                    <div className="form-row">
                        <input
                            ref={followingSymbolRef}
                            type="text"
                            placeholder="Mã CK (VD: MBB, HPG)"
                            maxLength={50}
                            value={followingSymbol}
                            onChange={e => setFollowingSymbol(e.target.value.toUpperCase())}
                            onKeyPress={e => handleKeyPress(e, handleAddFollowing)}
                        />
                        <button onClick={handleAddFollowing}>Thêm</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PortfolioTabs;
