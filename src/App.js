import React, { useState, useCallback } from 'react';
import { StockProvider, useStock } from './context/StockContext';
import Header from './components/Header';
import IndexSection from './components/IndexSection';
import PortfolioTabs from './components/PortfolioTabs';
import PortfolioSummary from './components/PortfolioSummary';
import StockTable from './components/StockTable';
import AlertToast from './components/AlertToast';
import { SettingsModal, ImportModal, AlertsModal, StatsModal, ChartModal } from './components/modals';
import { generateShareUrl } from './services/storageService';
import './styles/stock-monitor.css';

function AppContent() {
    const { state } = useStock();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [chartOpen, setChartOpen] = useState(false);
    const [chartSymbol, setChartSymbol] = useState('');

    const handleOpenChart = useCallback((symbol) => {
        setChartSymbol(symbol);
        setChartOpen(true);
    }, []);

    const handleShare = useCallback(() => {
        const shareData = {
            following: state.followingSymbols,
            holding: state.holdingStocks,
            buy: state.buyOrders,
            sell: state.sellOrders
        };

        const url = generateShareUrl(shareData);
        if (url) {
            navigator.clipboard.writeText(url).then(() => {
                alert('Đã copy link chia sẻ vào clipboard!');
            }).catch(() => {
                prompt('Copy link này:', url);
            });
        }
    }, [state.followingSymbols, state.holdingStocks, state.buyOrders, state.sellOrders]);

    return (
        <div className="container">
            <Header
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenImport={() => setImportOpen(true)}
                onOpenAlerts={() => setAlertsOpen(true)}
                onOpenStats={() => setStatsOpen(true)}
                onShare={handleShare}
            />

            <div className="portfolio-section">
                <div className="portfolio-layout">
                    <IndexSection />
                    <PortfolioTabs />
                </div>
            </div>

            <div className="stock-data-container">
                <PortfolioSummary />
                <StockTable onOpenChart={handleOpenChart} />
            </div>

            {/* Modals */}
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
            <AlertsModal isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} />
            <StatsModal isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
            <ChartModal isOpen={chartOpen} onClose={() => setChartOpen(false)} symbol={chartSymbol} />

            {/* Alert Toast */}
            <AlertToast />
        </div>
    );
}

function App() {
    return (
        <StockProvider>
            <AppContent />
        </StockProvider>
    );
}

export default App;
