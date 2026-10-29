import { useState, useEffect, useCallback } from 'react';

interface UseCashfreeSDK {
    isLoading: boolean;
    isLoaded: boolean;
    error: Error | null;
}

export const useCashfreeSDK = (): UseCashfreeSDK => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadSDK = useCallback(async (): Promise<void> => {
        if (isLoaded || isLoading) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if SDK is already present
            if ((window as any).Cashfree) {
                setIsLoaded(true);
                setIsLoading(false);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.async = true;

            const loadPromise = new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
            });

            document.body.appendChild(script);

            await loadPromise;

            setIsLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, isLoading]);

    useEffect(() => {
        loadSDK();
    }, [loadSDK]);

    return {
        isLoading,
        isLoaded,
        error,
    };
};
