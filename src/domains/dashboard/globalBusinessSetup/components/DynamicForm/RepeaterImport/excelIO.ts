import { visibleImportFields } from './mapColumns';
import { ImportInstance } from './types';
import { IField, ISection } from '../../../types/forms';
import { downloadSheet } from '../../../utils/excel/downloadSheet';
import { readSheetTable } from '../../../utils/excel/readSheetTable';
import { formatNestedValue } from '../utils/nestedSelectValue';

// Read the first sheet of a CSV/XLSX file: first row = headers, rest = data
// rows (blank rows already dropped by readSheetTable). Date cells arrive as
// JS Dates so date fields coerce cleanly.
export async function parseImportFile(
    file: File
): Promise<{ headers: unknown[]; rows: unknown[][] }> {
    const [headers = [], ...rows] = await readSheetTable(file);

    return { headers, rows };
}

const optionLabel = (field: IField, value: unknown): string => {
    const opt = (field.options ?? []).find(o => String(o.value) === String(value));
    return opt?.label ?? String(value ?? '');
};

// Render a stored value back to a human cell so exports round-trip through the
// same label matcher the import uses.
export const formatValueForCell = (
    field: IField,
    value: unknown,
    countryLabelById?: Record<string, string>
): string => {
    if (value === undefined || value === null || value === '') return '';

    switch (field.type) {
        case 'select':
            return (Array.isArray(value) ? value : [value])
                .map(v => optionLabel(field, v))
                .join('; ');
        case 'radio':
            return optionLabel(field, value);
        case 'checkbox':
            return value === true || value === 'true' ? 'Yes' : 'No';
        case 'country':
            return countryLabelById?.[String(value)] ?? String(value);
        case 'nested_select':
            return Array.isArray(value) ? formatNestedValue(value, ' > ') : String(value);
        case 'file':
        case 'image': {
            if (value instanceof File) return value.name;
            if (typeof value === 'object') {
                return String((value as { name?: string }).name ?? '');
            }
            return String(value);
        }
        default:
            return String(value);
    }
};

// Header-only workbook the user fills and re-imports.
export function downloadImportTemplate(section: ISection) {
    const headers = visibleImportFields(section).map(f => f.label);
    return downloadSheet([headers], 'Template', `${section.title || 'import'} template.xlsx`);
}

// Current instances as a re-importable workbook.
export function exportInstancesToExcel(
    section: ISection,
    instances: ImportInstance[],
    countryLabelById?: Record<string, string>
) {
    const fields = visibleImportFields(section);
    const rows = [
        fields.map(f => f.label),
        ...instances.map(inst =>
            fields.map(f => formatValueForCell(f, inst[f.name], countryLabelById))
        ),
    ];
    return downloadSheet(rows, 'Data', `${section.title || 'data'}.xlsx`);
}
