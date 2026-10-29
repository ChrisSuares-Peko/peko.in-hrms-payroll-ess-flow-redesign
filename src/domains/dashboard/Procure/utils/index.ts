
// Output Format: "30 Apr 2026"
export const formatShortDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    if (date instanceof Date) {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};