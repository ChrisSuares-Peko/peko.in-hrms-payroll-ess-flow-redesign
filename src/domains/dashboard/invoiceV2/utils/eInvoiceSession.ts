export const SESSION_DURATION_MS = 6 * 60 * 60 * 1000;

export const formatTimeLeft = (expiry: string | null): string => {
    if (!expiry) return '—';
    const remaining = new Date(expiry).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m ${seconds}s left`;
};

export const computeProgress = (expiry: string | null): number => {
    if (!expiry) return 0;
    const remaining = new Date(expiry).getTime() - Date.now();
    if (remaining <= 0) return 0;
    return Math.min(100, Math.round((remaining / SESSION_DURATION_MS) * 100));
};

export const formatExpiry = (expiry: string | null): string => {
    if (!expiry) return '—';
    return new Date(expiry).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};
