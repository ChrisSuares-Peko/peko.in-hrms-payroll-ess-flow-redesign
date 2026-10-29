import {
    transactionCategoryOptions,
    transactionSubcategoryOptions,
} from '../../utils/transactionsData';

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'pdf', 'xls', 'xlsx'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const fileExtension = (name: string): string => (name.split('.').pop() ?? '').toLowerCase();

export const validateReceiptFile = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(fileExtension(file.name))) {
        return 'Unsupported file. Use JPG, PNG, PDF or Excel.';
    }
    if (file.size > MAX_FILE_BYTES) {
        return 'File is too large (max 10MB).';
    }
    return null;
};

export const buildCategory = (
    category: string | undefined,
    subcategory: string | undefined
): string | undefined => {
    const catLabel = transactionCategoryOptions.find(option => option.value === category)?.label;
    if (!catLabel) return undefined;
    const subLabel = subcategory
        ? transactionSubcategoryOptions[category ?? '']?.find(o => o.value === subcategory)?.label
        : undefined;
    return subLabel ? `${catLabel} / ${subLabel}` : catLabel;
};
