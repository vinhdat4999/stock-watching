import React, { useEffect, useRef } from 'react';
import { useStock } from '../../context/StockContext';
import { DEFAULT_DATA_SOURCE_URL } from '../../utils/constants';

function SettingsModal({ isOpen, onClose }) {
    const { state, updateSettings } = useStock();
    const dataSourceUrlRef = useRef(state.dataSourceUrl || DEFAULT_DATA_SOURCE_URL);

    // Auto-save when checkbox settings change
    const handleDisplayIndexChange = (checked) => {
        updateSettings({ displayIndex: checked });
    };

    const handleDisplayVolumeChange = (checked) => {
        updateSettings({ displayVolume: checked });
    };

    const handleSellWatchingChange = (checked) => {
        updateSettings({ sellWatching: checked });
    };

    const handleUseCustomDataSourceChange = (checked) => {
        updateSettings({ useCustomDataSource: checked });
    };

    // Debounce URL changes to avoid too many updates while typing
    const handleDataSourceUrlChange = (value) => {
        dataSourceUrlRef.current = value;
        // Auto-save URL after a short delay (500ms)
        clearTimeout(window.dataSourceUrlTimeout);
        window.dataSourceUrlTimeout = setTimeout(() => {
            updateSettings({ dataSourceUrl: value || DEFAULT_DATA_SOURCE_URL });
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>⚙️ Cài đặt</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="settings-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={state.displayIndex}
                                onChange={e => handleDisplayIndexChange(e.target.checked)}
                            />
                            Hiển thị chỉ số
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={state.displayVolume}
                                onChange={e => handleDisplayVolumeChange(e.target.checked)}
                            />
                            Hiển thị khối lượng
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={state.sellWatching}
                                onChange={e => handleSellWatchingChange(e.target.checked)}
                            />
                            Theo dõi lệnh bán (Sell Watching)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', justifyContent: 'flex-start' }}>
                            <input
                                type="checkbox"
                                checked={state.useCustomDataSource}
                                onChange={e => handleUseCustomDataSourceChange(e.target.checked)}
                            />
                            <span>Sử dụng test URL</span>
                            <input
                                type="text"
                                defaultValue={state.dataSourceUrl || DEFAULT_DATA_SOURCE_URL}
                                onChange={e => handleDataSourceUrlChange(e.target.value)}
                                placeholder={DEFAULT_DATA_SOURCE_URL}
                                style={{
                                    padding: '6px',
                                    fontSize: '13px',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    background: '#2a2a2a',
                                    color: '#fff',
                                    textAlign: 'left',
                                    flex: 1,
                                    minWidth: '300px'
                                }}
                            />
                        </label>
                    </div>
                    <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '4px', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#a0a0a0' }}>
                            💡 Tất cả thay đổi được lưu tự động
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
