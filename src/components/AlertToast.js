import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStock } from '../context/StockContext';
import { CONSTANTS } from '../utils/constants';
import { getCurrentPrice } from '../utils/stockUtils';
import { formatPrice, formatNumber } from '../utils/formatters';

const ALERT_CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
const TOAST_AUTO_HIDE_MS = 10000; // Auto hide after 10 seconds

function AlertToast() {
    const { state, updateAlert } = useStock();
    const { alerts, stockDataMap } = state;
    const [toastMessage, setToastMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const hideTimeoutRef = useRef(null);
    const checkIntervalRef = useRef(null);
    
    // Use refs to store latest values to avoid recreating checkAlerts on every change
    const alertsRef = useRef(alerts);
    const stockDataMapRef = useRef(stockDataMap);
    const updateAlertRef = useRef(updateAlert);
    
    // Keep refs updated
    useEffect(() => {
        alertsRef.current = alerts;
    }, [alerts]);
    
    useEffect(() => {
        stockDataMapRef.current = stockDataMap;
    }, [stockDataMap]);
    
    useEffect(() => {
        updateAlertRef.current = updateAlert;
    }, [updateAlert]);

    // Play alert sound using Web Audio API
    const playAlertSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 200);
        } catch (e) {
            console.log('Audio notification not available');
        }
    }, []);

    // Show toast notification
    const showToast = useCallback((message) => {
        setToastMessage(message);
        setIsVisible(true);
        playAlertSound();

        // Clear any existing timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        // Auto hide after timeout
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, TOAST_AUTO_HIDE_MS);
    }, [playAlertSound]);

    // Hide toast
    const hideToast = useCallback(() => {
        setIsVisible(false);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
    }, []);

    // Check alerts - using refs to avoid recreating function
    const checkAlerts = useCallback(() => {
        const currentAlerts = alertsRef.current;
        const currentStockDataMap = stockDataMapRef.current;
        
        currentAlerts.forEach(alert => {
            if (alert.triggered) return;

            const data = currentStockDataMap.get(alert.symbol);
            if (!data || data.messageType !== CONSTANTS.MESSAGE_TYPE.MAIN) return;

            const currentPrice = getCurrentPrice(data);
            const refPrice = (data.referencePrice || 0) / CONSTANTS.PRICE_DIVISOR;
            const changePercent = refPrice > 0 ? ((currentPrice - refPrice) / refPrice) * 100 : 0;

            let shouldTrigger = false;
            let message = '';

            switch (alert.condition) {
                case 'above':
                    if (currentPrice >= alert.value / CONSTANTS.PRICE_DIVISOR) {
                        shouldTrigger = true;
                        message = `${alert.symbol} đạt giá ${formatPrice(currentPrice)} (≥ ${formatNumber(alert.value)} đ)`;
                    }
                    break;
                case 'below':
                    if (currentPrice <= alert.value / CONSTANTS.PRICE_DIVISOR) {
                        shouldTrigger = true;
                        message = `${alert.symbol} xuống giá ${formatPrice(currentPrice)} (≤ ${formatNumber(alert.value)} đ)`;
                    }
                    break;
                case 'change_up':
                    if (changePercent >= alert.value) {
                        shouldTrigger = true;
                        message = `${alert.symbol} tăng ${formatPrice(changePercent)}% (≥ ${alert.value}%)`;
                    }
                    break;
                case 'change_down':
                    if (changePercent <= -alert.value) {
                        shouldTrigger = true;
                        message = `${alert.symbol} giảm ${formatPrice(Math.abs(changePercent))}% (≥ ${alert.value}%)`;
                    }
                    break;
                default:
                    break;
            }

            if (shouldTrigger) {
                updateAlertRef.current({ ...alert, triggered: true });
                showToast(message);
            }
        });
    }, [showToast]);

    // Start checking alerts periodically
    useEffect(() => {
        // Initial check
        checkAlerts();

        // Set up interval
        checkIntervalRef.current = setInterval(checkAlerts, ALERT_CHECK_INTERVAL_MS);

        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [checkAlerts]);

    if (!isVisible) return null;

    return (
        <div className="alert-toast" style={{ display: 'block' }}>
            <div className="toast-content">
                <span className="toast-icon">🔔</span>
                <span className="toast-message">{toastMessage}</span>
                <button className="toast-close" onClick={hideToast}>&times;</button>
            </div>
        </div>
    );
}

export default AlertToast;

