import { ColumnMapping, MappingResult } from './types';
import { IField, ISection } from '../../../types/forms';

// .xls (legacy BIFF) dropped — exceljs reads only .xlsx/.csv.
export const ACCEPTED_IMPORT_EXTENSIONS = ['.csv', '.xlsx'];
export const IMPORT_ACCEPT = ACCEPTED_IMPORT_EXTENSIONS.join(',');

// Header matching is forgiving: case-insensitive, collapsed whitespace, and a
// trailing required-asterisk is ignored (so "Full Name *" matches "Full Name").
export const normalizeHeader = (h: unknown): string =>
    String(h ?? '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\*\s*$/, '')
        .trim();

// Only visible fields participate in import/export — hidden fields are
// control/sentinel state the user never sees.
export const visibleImportFields = (section: ISection): IField[] =>
    (section.fields ?? []).filter(f => !f.view?.is_hidden);

// Match each spreadsheet header to at most one field, by label first then by
// field name. Unmatched headers and unmapped required fields are surfaced as
// non-blocking warnings.
export function mapColumnsToFields(headers: unknown[], section: ISection): MappingResult {
    const fields = visibleImportFields(section);
    const byLabel = new Map<string, IField>();
    const byName = new Map<string, IField>();

    fields.forEach(f => {
        const label = normalizeHeader(f.label);
        if (label && !byLabel.has(label)) byLabel.set(label, f);
        const name = normalizeHeader(f.name);
        if (name && !byName.has(name)) byName.set(name, f);
    });

    const mappings: ColumnMapping[] = [];
    const unmatchedColumns: string[] = [];
    const matched = new Set<string>();

    headers.forEach((header, columnIndex) => {
        const key = normalizeHeader(header);
        if (!key) return;

        const field = byLabel.get(key) ?? byName.get(key);

        if (field && !matched.has(field._id)) {
            matched.add(field._id);
            mappings.push({ columnIndex, field });
        } else {
            unmatchedColumns.push(String(header).trim());
        }
    });

    const unmatchedRequiredFields = fields
        .filter(f => f.validation?.required?.value && !matched.has(f._id))
        .map(f => f.label);

    return { mappings, unmatchedColumns, unmatchedRequiredFields };
}
