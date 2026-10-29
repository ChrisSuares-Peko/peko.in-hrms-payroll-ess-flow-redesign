export const formatDuration = (duration: string): string => {
    const [h, m] = duration.replace(/\s*hrs?/i, '').trim().split(':').map(Number);
    if (Number.isNaN(h)) return duration;
    return `${h} hr ${m || 0} min`;
};
