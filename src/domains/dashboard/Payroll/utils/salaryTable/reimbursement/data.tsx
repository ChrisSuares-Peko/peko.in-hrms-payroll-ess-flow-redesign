export const statusData = [
    {
        value: 'UNPAID',
        label: 'Unpaid',
    },
    {
        value: 'APPROVED',
        label: 'Approved',
    },
    {
        value: 'REJECTED',
        label: 'Rejected',
    },
    {
        value: 'PAID',
        label: 'Paid',
    },
];

export const getAllowedStatusOptions = (currentStatus: string) => {
    switch (currentStatus?.toUpperCase()) {
        case 'UNPAID':
            return statusData.filter(s => s.value === 'APPROVED' || s.value === 'REJECTED');
        case 'APPROVED':
            return statusData.filter(s => s.value === 'PAID');
        case 'PAID':
        case 'REJECTED':
            return [];
        default:
            return [];
    }
};

export function capitalizeFirstLetter(str?: string) {
    if (!str) return ''; // Handle cases where the string might be undefined or null
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}