import type { CellValue } from 'exceljs';

// ExcelJS returns rich objects where SheetJS returned a primitive (formula,
// hyperlink, styled text and error cells). Callers do String(cell), so these
// have to be flattened or a linked cell imports as "[object Object]".
export const cellToPrimitive = (value: CellValue): unknown => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value;
    if (typeof value !== 'object') return value;

    if ('richText' in value) return value.richText.map(part => part.text).join('');
    if ('hyperlink' in value) return value.text ?? '';
    if ('error' in value) return '';
    if ('formula' in value || 'sharedFormula' in value) return cellToPrimitive(value.result);

    return '';
};
