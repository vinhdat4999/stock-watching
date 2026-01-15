// Pre-create formatters for better performance
const numberFormatters = {
    0: new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    2: new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    3: new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
};

export function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) {
        return '0';
    }
    const formatter = numberFormatters[decimals] || numberFormatters[0];
    return formatter.format(num);
}

export function formatPrice(price) {
    return numberFormatters[2].format(price);
}

export function formatCurrency(amount) {
    return numberFormatters[0].format(amount) + ' đ';
}

export function formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${formatPrice(value)}%`;
}
