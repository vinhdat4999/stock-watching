const STORAGE_KEY = 'stockMonitorData';

export function saveToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to storage:', error);
    }
}

export function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to load from storage:', error);
    }
    return null;
}

export function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear storage:', error);
    }
}

// Parse YAML-like import format
export function parseYamlImport(yamlText) {
    const result = {
        following: [],
        holding: [],
        buy: [],
        sell: [],
        config: {
            displayIndex: true,
            displayVolume: false,
            sellWatching: true
        }
    };

    try {
        const lines = yamlText.split('\n');
        let currentSection = null;
        let currentItem = null;

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Check section headers
            if (trimmed === 'following:') {
                currentSection = 'following';
                currentItem = null;
            } else if (trimmed === 'holding:') {
                currentSection = 'holding';
                currentItem = null;
            } else if (trimmed === 'buy:') {
                currentSection = 'buy';
                currentItem = null;
            } else if (trimmed === 'sell:') {
                currentSection = 'sell';
                currentItem = null;
            } else if (trimmed === 'config:') {
                currentSection = 'config';
                currentItem = null;
            } else if (trimmed.startsWith('- ')) {
                // List item
                const itemContent = trimmed.substring(2).trim();
                if (itemContent.startsWith('symbol:')) {
                    const symbol = itemContent.substring(7).trim();
                    if (currentSection === 'following') {
                        result.following.push(symbol);
                    } else {
                        currentItem = { symbol };
                        if (currentSection === 'holding') {
                            result.holding.push(currentItem);
                        } else if (currentSection === 'buy') {
                            result.buy.push(currentItem);
                        } else if (currentSection === 'sell') {
                            result.sell.push(currentItem);
                        }
                    }
                }
            } else if (currentItem && trimmed.includes(':')) {
                // Property of current item
                const [key, value] = trimmed.split(':').map(s => s.trim());
                if (key === 'quantity') {
                    currentItem.quantity = parseInt(value, 10) || 0;
                } else if (key === 'price') {
                    currentItem.price = parseFloat(value) || 0;
                } else if (key === 'fee') {
                    currentItem.fee = parseFloat(value) || 0;
                }
            } else if (currentSection === 'config' && trimmed.includes(':')) {
                const [key, value] = trimmed.split(':').map(s => s.trim());
                if (key === 'displayIndex') {
                    result.config.displayIndex = value === 'true';
                } else if (key === 'displayVolume') {
                    result.config.displayVolume = value === 'true';
                } else if (key === 'sellWatching') {
                    result.config.sellWatching = value === 'true';
                }
            }
        }
    } catch (error) {
        console.error('Failed to parse YAML:', error);
    }

    return result;
}

// Generate shareable URL
export function generateShareUrl(data) {
    try {
        const shareData = {
            f: data.following || [],
            h: (data.holding || []).map(h => ({ s: h.symbol, q: h.quantity })),
            b: (data.buy || []).map(b => ({ s: b.symbol, q: b.quantity, p: b.price, f: b.fee })),
            e: (data.sell || []).map(s => ({ s: s.symbol, q: s.quantity, p: s.price, f: s.fee }))
        };
        const encoded = btoa(JSON.stringify(shareData));
        return `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    } catch (error) {
        console.error('Failed to generate share URL:', error);
        return null;
    }
}

// Parse shared URL data
export function parseSharedUrl(encodedData) {
    try {
        const decoded = JSON.parse(atob(encodedData));
        return {
            following: decoded.f || [],
            holding: (decoded.h || []).map(h => ({ symbol: h.s, quantity: h.q })),
            buy: (decoded.b || []).map(b => ({ symbol: b.s, quantity: b.q, price: b.p, fee: b.f })),
            sell: (decoded.e || []).map(s => ({ symbol: s.s, quantity: s.q, price: s.p, fee: s.f }))
        };
    } catch (error) {
        console.error('Failed to parse shared URL:', error);
        return null;
    }
}
