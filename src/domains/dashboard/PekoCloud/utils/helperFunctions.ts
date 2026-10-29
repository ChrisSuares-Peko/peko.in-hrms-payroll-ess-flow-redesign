export function calculatePercentage(used: any, maximum: any) {
    if (!maximum || !used) {
        return 0;
    }

    const percentage = (used / maximum) * 100;
    return percentage; // returns the percentage
}

export function validateNumber(value: any) {
    if (!value) {
        return 0;
    }
    return Number(value.toFixed(0)); // returns the fixed value
}

export function formatBytes(bytes = 0) {
    if (bytes >= 1073741824) {
        // 1 GB
        return `${(bytes / 1073741824).toFixed(2)} GB`;
    }
    if (bytes >= 1048576) {
        // 1 MB
        return `${(bytes / 1048576).toFixed(2)} MB`;
    }
    // 1 KB
    return `${(bytes / 1024).toFixed(2)} KB`;
}

export function formatDate(date: string) {
    if (!date) return '';

    return date.split('T')[0];
}

export const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};

export function getInitials(name: string): string {
    const words = name.split(' ');
    const initials = words
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}
