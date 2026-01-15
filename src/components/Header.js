import React from 'react';
import { useStock } from '../context/StockContext';
import { useClock } from '../hooks/useClock';

function Header({ onOpenSettings, onOpenImport, onOpenAlerts, onOpenStats, onShare }) {
    const { state } = useStock();
    const time = useClock();

    const getStatusClass = () => {
        switch (state.connectionStatus) {
            case 'connected':
                return 'connected';
            case 'connecting':
                return 'connecting';
            case 'error':
                return 'error';
            default:
                return 'disconnected';
        }
    };

    return (
        <header className="header">
            <div className="connection-status">
                <span className={`status-indicator ${getStatusClass()}`}></span>
                <span>{state.statusText}</span>
            </div>
            <span className="clock">{time}</span>
            <div className="header-actions">
                <button className="alerts-btn" onClick={onOpenAlerts}>Cảnh báo</button>
                <button className="stats-btn" onClick={onOpenStats}>Thống kê</button>
                <button className="settings-btn" onClick={onOpenSettings}>Cài đặt</button>
                <button className="import-btn" onClick={onOpenImport}>Import</button>
                <button className="share-btn" onClick={onShare}>Chia sẻ</button>
            </div>
        </header>
    );
}

export default Header;
