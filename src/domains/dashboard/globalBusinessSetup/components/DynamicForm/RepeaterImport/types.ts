import { IField } from '../../../types/forms';

// An imported repeater instance in Peko's value shape: field name → value.
export type ImportInstance = Record<string, unknown>;

export type ColumnMapping = { columnIndex: number; field: IField };

export type MappingResult = {
    mappings: ColumnMapping[];
    unmatchedColumns: string[];
    unmatchedRequiredFields: string[];
};

export type RowValidation = { valid: boolean; errors: string[] };

// Everything the preview stage needs after a file is parsed.
export type ParsedImport = {
    instances: ImportInstance[];
    rowValidations: RowValidation[];
    warnings: string[];
    unmatchedColumns: string[];
    unmatchedRequiredFields: string[];
    mappings: ColumnMapping[];
};

// Resolves a spreadsheet cell (country name/code/id) to the country _id.
export type CountryResolver = (raw: unknown) => string | null;
