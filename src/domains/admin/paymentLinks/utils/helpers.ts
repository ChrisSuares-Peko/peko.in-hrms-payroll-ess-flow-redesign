export function formatDate(date: string) {
    if (!date) return '';

    return date.split('T')[0];
}
export function formatTime(date: string) {
    if (!date) return '';

    return date.split('T')[1].split('.')[0];
}
