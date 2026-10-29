export const complaintStatusStyles = {
    RESOLVED: {
        text: '#16a34a',
        background: '#d1fae5',
    },
    PENDING: {
        text: '#B78912',
        background: '#FFFDD4',
    },
    REJECTED: {
        text: '#d97b7b',
        background: '#ffc2c2',
    },
};

export type ComplaintStatus = keyof typeof complaintStatusStyles;

export const findColorByStatus = (status: string) =>
    status === 'REJECTED' || status === 'PENDING' || status === 'RESOLVED'
        ? complaintStatusStyles[status as ComplaintStatus]
        : complaintStatusStyles.PENDING;

export const complaintStatusLabel = (status: string) =>
    status === 'PENDING' ? 'ASSIGNED' : status;
