import React, { useState, useEffect, useRef } from 'react';
import { useStock } from '../../context/StockContext';
import { DEFAULT_DATA_SOURCE_URL } from '../../utils/constants';

function SettingsModal({ isOpen, onClose }) {
    const { state, updateSettings } = useStock();
    const prevIsOpenRef = useRef(false);

    const [displayIndex, setDisplayIndex] = useState(state.displayIndex);
    const [displayVolume, setDisplayVolume] = useState(state.displayVolume);
    const [sellWatching, setSellWatching] = useState(state.sellWatching);
    const [useCustomDataSource, setUseCustomDataSource] = useState(state.useCustomDataSource);
    const [dataSourceUrl, setDataSourceUrl] = useState(state.dataSourceUrl || DEFAULT_DATA_SOURCE_URL);

    // Only sync values when modal opens (transition from closed to open)
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setDisplayIndex(state.displayIndex);
            setDisplayVolume(state.displayVolume);
            setSellWatching(state.sellWatching);
            setUseCustomDataSource(state.useCustomDataSource);
            setDataSourceUrl(state.dataSourceUrl || DEFAULT_DATA_SOURCE_URL);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, state.displayIndex, state.displayVolume, state.sellWatching, state.useCustomDataSource, state.dataSourceUrl]);

    const handleSave = () => {
        updateSettings({
            displayIndex,
            displayVolume,
            sellWatching,
            useCustomDataSource,
            dataSourceUrl: dataSourceUrl || DEFAULT_DATA_SOURCE_URL
        });
        onClose();
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
                                checked={displayIndex}
                                onChange={e => setDisplayIndex(e.target.checked)}
                            />
                            Hiển thị chỉ số
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={displayVolume}
                                onChange={e => setDisplayVolume(e.target.checked)}
                            />
                            Hiển thị khối lượng
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={sellWatching}
                                onChange={e => setSellWatching(e.target.checked)}
                            />
                            Theo dõi lệnh bán (Sell Watching)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', justifyContent: 'flex-start' }}>
                            <input
                                type="checkbox"
                                checked={useCustomDataSource}
                                onChange={e => setUseCustomDataSource(e.target.checked)}
                            />
                            <span>Sử dụng test URL</span>
                            <input
                                type="text"
                                value={dataSourceUrl}
                                onChange={e => setDataSourceUrl(e.target.value)}
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
                </div>
                <div className="modal-footer">
                    <button className="save-btn" onClick={handleSave}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
