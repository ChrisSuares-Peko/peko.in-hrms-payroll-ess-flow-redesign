export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'email' | 'phone' | 'textarea' | 'checkbox' | 'repeatable-table' | 'note';
export type ValidationType = 'pan' | 'tan' | 'gst' | 'email' | 'mobile' | 'numeric' | 'alphaSpace' | 'ifsc' | 'cin' | 'dinPan' | 'din' | 'mobileOrEmail' | 'fullName';

export interface SelectOption {
    label: string;
    value: string;
}

export type TableColumnType = 'serial' | 'text' | 'textarea' | 'checkbox' | 'select';

export interface TableColumnDef {
    key: string;
    label: string;
    type: TableColumnType;
    width?: number;
    minWidth?: number;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    allowNumbersOnly?: boolean;
    allowTwoDecimalsOnly?: boolean;
    convertToUppercase?: boolean;
    validation?: ValidationType;
    options?: SelectOption[];
    requiredIfAnyOtherFilled?: boolean;
    requiredIfColFilled?: string;
}

export interface FieldDef {
    key: string;
    label?: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: SelectOption[];
    optionsSource?: 'indianStates' | 'financialYears';
    prefillFrom?: 'user.contactPersonName';
    prefillDefault?: string;
    validation?: ValidationType;
    maxLength?: number;
    convertToUppercase?: boolean;
    allowNumbersOnly?: boolean;
    allowTwoDecimalsOnly?: boolean;
    minValue?: number;
    allowAlphabetsAndSpace?: boolean;
    allowAlphabetsAndNumbersOnly?: boolean;
    allowAlphabetsSpaceAndNumbers?: boolean;
    allowAlphabetsNumberAndSpecialCharacters?: string[];
    addonBefore?: string;
    minRows?: number;
    section?: string;
    colSpan?: 1 | 2;
    // repeatable-table specific
    title?: string;
    description?: string;
    defaultRows?: number;
    columns?: TableColumnDef[];
    selectable?: boolean;
    selectFills?: { sourceKey: string; targetKey: string }[];
}

export interface DocDef {
    key: string;
    label: string;
    required?: boolean;
    multiple?: boolean;
}

export interface ComplianceTypeConfig {
    fields: FieldDef[];
    docs: DocDef[];
}
