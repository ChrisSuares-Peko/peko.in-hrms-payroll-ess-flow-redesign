export const AVATAR_COLORS = ['#FFF5F5', '#FFF2EA', '#F0F4FF', '#F5FFF8', '#FFF8E1'];

export const getInitials = (name: string | null): string => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

export const transactionTypeOptions = [
    { value: 'NEFT', label: 'NEFT' },
    { value: 'IMPS', label: 'IMPS' },
    { value: 'RTGS', label: 'RTGS' },
];
