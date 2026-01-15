import { useEffect, useRef } from 'react';
import { formatNumber } from '../utils/formatters';

const TITLE_UPDATE_DEBOUNCE_MS = 200;

export function usePageTitle(totalDiff, hasPortfolio) {
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce title updates
        timeoutRef.current = setTimeout(() => {
            const sign = totalDiff >= 0 ? '+' : '';
            const formattedDiff = formatNumber(totalDiff);

            if (totalDiff !== 0 || hasPortfolio) {
                document.title = `${sign}${formattedDiff} đ`;
            } else {
                document.title = 'Stock Monitor';
            }
        }, TITLE_UPDATE_DEBOUNCE_MS);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [totalDiff, hasPortfolio]);
}

