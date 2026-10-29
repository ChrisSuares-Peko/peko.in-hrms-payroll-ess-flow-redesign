import { fileExtension } from './addTransaction.helpers';

const IMPORT_FORMATS = ['csv', 'xls', 'xlsx'];
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export const validateImportFile = (file: File): string | null => {
    if (!IMPORT_FORMATS.includes(fileExtension(file.name))) {
        return 'Unsupported file. Use CSV, XLS or XLSX.';
    }
    if (file.size > MAX_IMPORT_BYTES) {
        return 'File is too large (max 10MB).';
    }
    return null;
};

export const IMPORT_TEMPLATE_FILENAME = 'transactions-import-template.csv';

export const downloadImportTemplate = (): void => {
    const header = [
        'Date (DD/MM/YYYY)',
        'Description',
        'Amount',
        'Type (income/expense)',
        'Category',
    ];
    const sample = ['01/04/2026', 'Office rent — April', '28500', 'expense', 'Rent'];
    const csv = `${header.join(',')}\n${sample.join(',')}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = IMPORT_TEMPLATE_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
