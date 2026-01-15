import React, { useEffect, useRef } from 'react';

function ChartModal({ isOpen, onClose, symbol }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !symbol) return;

        // TradingView uses format: EXCHANGE:SYMBOL
        // Vietnamese stocks use HOSE (Ho Chi Minh) or HNX (Hanoi)
        const tvSymbol = `HOSE:${symbol}`;

        // Clean up previous content
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Try to load TradingView widget
        const loadTradingView = () => {
            if (window.TradingView) {
                try {
                    new window.TradingView.widget({
                        symbol: tvSymbol,
                        interval: 'D',
                        timezone: 'Asia/Ho_Chi_Minh',
                        theme: 'dark',
                        style: '1',
                        locale: 'vi_VN',
                        toolbar_bg: '#1a1a1a',
                        enable_publishing: false,
                        allow_symbol_change: true,
                        container_id: 'tradingview-widget-container',
                        width: '100%',
                        height: '500'
                    });
                } catch (err) {
                    console.error('TradingView widget error:', err);
                    showFallback();
                }
            } else {
                showFallback();
            }
        };

        const showFallback = () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #888;">
                        <p style="font-size: 18px; margin-bottom: 20px;">Không thể tải biểu đồ TradingView</p>
                        <a href="https://www.tradingview.com/chart/?symbol=${tvSymbol}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           style="color: #60a5fa; font-size: 16px; text-decoration: underline;">
                            Mở trên TradingView
                        </a>
                    </div>
                `;
            }
        };

        // Check if TradingView script is already loaded
        const existingScript = document.querySelector('script[src*="tradingview.com/tv.js"]');
        if (existingScript) {
            loadTradingView();
        } else {
            // Load TradingView script
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = loadTradingView;
            script.onerror = () => {
                showFallback();
            };
            document.head.appendChild(script);
        }

        const container = containerRef.current;
        return () => {
            // Cleanup on unmount
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isOpen, symbol]);

    if (!isOpen) return null;

    return (
        <div 
            className="modal chart-modal" 
            style={{ display: 'flex' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-content chart-modal-content">
                <div className="modal-header">
                    <h3>📈 Biểu đồ {symbol}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body chart-modal-body">
                    <div id="tradingview-widget-container" ref={containerRef}></div>
                </div>
            </div>
        </div>
    );
}

export default ChartModal;

