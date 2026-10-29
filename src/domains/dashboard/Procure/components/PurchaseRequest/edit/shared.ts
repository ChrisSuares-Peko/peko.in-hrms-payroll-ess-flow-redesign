export const sectionCard = {
    bordered: false,
    styles: { body: { padding: '20px 24px' } },
    className: 'mb-4 mt-5',
    style: { borderRadius: 20, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' },
};

export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
