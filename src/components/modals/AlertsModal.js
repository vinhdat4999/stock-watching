import React, { useState } from 'react';
import { useStock } from '../../context/StockContext';

function AlertsModal({ isOpen, onClose }) {
    const { state, addAlert, updateAlert, removeAlert } = useStock();
    const { alerts } = state;

    const [symbol, setSymbol] = useState('');
    const [condition, setCondition] = useState('above');
    const [value, setValue] = useState('');

    const handleAddAlert = () => {
        if (!symbol || !value) return;

        addAlert({
            symbol: symbol.toUpperCase(),
            condition,
            value: parseFloat(value),
            triggered: false,
            createdAt: new Date().toISOString()
        });

        setSymbol('');
        setValue('');
    };

    const handleResetAlert = (alert) => {
        updateAlert({ ...alert, triggered: false });
    };

    const getConditionText = (condition, value) => {
        switch (condition) {
            case 'above':
                return `Giá ≥ ${value}`;
            case 'below':
                return `Giá ≤ ${value}`;
            case 'change_up':
                return `Tăng ≥ ${value}%`;
            case 'change_down':
                return `Giảm ≥ ${value}%`;
            default:
                return '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content alerts-modal-content">
                <div className="modal-header">
                    <h3>🔔 Cảnh báo giá</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="alert-form">
                        <h4>Thêm cảnh báo mới</h4>
                        <div className="form-row alert-form-row">
                            <input
                                type="text"
                                placeholder="Mã CK"
                                maxLength={10}
                                value={symbol}
                                onChange={e => setSymbol(e.target.value.toUpperCase())}
                            />
                            <select value={condition} onChange={e => setCondition(e.target.value)}>
                                <option value="above">Giá ≥</option>
                                <option value="below">Giá ≤</option>
                                <option value="change_up">Tăng ≥ %</option>
                                <option value="change_down">Giảm ≥ %</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Giá trị"
                                step="0.01"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                            />
                            <button className="add-alert-btn" onClick={handleAddAlert}>Thêm</button>
                        </div>
                    </div>
                    <div className="alerts-list">
                        {alerts.length === 0 ? (
                            <div className="empty-message">Chưa có cảnh báo nào</div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className={`alert-item ${alert.triggered ? 'alert-triggered' : ''}`}>
                                    <div className="alert-info">
                                        <strong>{alert.symbol}</strong>
                                        <span className="alert-condition">
                                            {getConditionText(alert.condition, alert.value)}
                                        </span>
                                        <span className="alert-status">
                                            {alert.triggered ? 'Đã kích hoạt' : 'Đang theo dõi'}
                                        </span>
                                    </div>
                                    <div className="alert-actions">
                                        {alert.triggered && (
                                            <button
                                                className="reset-alert-btn"
                                                onClick={() => handleResetAlert(alert)}
                                                title="Reset"
                                            >
                                                ↻
                                            </button>
                                        )}
                                        <button
                                            className="delete-alert-btn"
                                            onClick={() => removeAlert(alert.id)}
                                            title="Xóa"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AlertsModal;
