import dayjs from 'dayjs';

import { CountryResolver } from './types';
import { IField } from '../../../types/forms';
import { getDefaultValue } from '../utils/fieldDefaults';

// Complex/file-backed types can't be represented in a spreadsheet cell.
// (`table` options load from a remote table in Peko, so it's non-importable
// here, unlike the vendor.)
export const NON_IMPORTABLE_TYPES = ['file', 'image', 'nested_select', 'table'];

const CHECKBOX_TRUTHY = new Set(['yes', 'y', 'true', '1', 'checked', 'x']);
const CHECKBOX_FALSY = new Set(['no', 'n', 'false', '0', '']);

const norm = (v: unknown) =>
    String(v ?? '')
        .trim()
        .toLowerCase();

const isBlank = (raw: unknown) => raw === undefined || raw === null || String(raw).trim() === '';

const resolveOption = (field: IField, token: unknown): string | undefined => {
    const t = norm(token);
    if (!t) return undefined;
    const opt = (field.options ?? []).find(o => norm(o.value) === t || norm(o.label) === t);
    return opt?.value !== undefined ? String(opt.value) : undefined;
};

export type CoercedCell = { value: unknown; warning?: string };

// Turn a raw spreadsheet cell into the exact value shape the field's Yup rule
// expects (Peko defaults: phone '+91', date 'YYYY-MM-DD' string, single
// select '' / multi select array). Ported from the vendor's
// coerceCellToFieldValue, adapted to Peko's value shapes.
export function coerceCellToFieldValue(
    field: IField,
    raw: unknown,
    countryResolver?: CountryResolver
): CoercedCell {
    if (NON_IMPORTABLE_TYPES.includes(field.type)) {
        return {
            value: getDefaultValue(field.type),
            warning: isBlank(raw)
                ? undefined
                : `${field.label}: this field type can't be imported from a spreadsheet`,
        };
    }

    if (isBlank(raw)) {
        return { value: getDefaultValue(field.type) };
    }

    switch (field.type) {
        case 'radio': {
            const value = resolveOption(field, raw);
            return value !== undefined
                ? { value }
                : { value: '', warning: `${field.label}: "${raw}" is not a valid option` };
        }
        case 'select': {
            const cell = String(raw).trim();
            const whole = resolveOption(field, cell);
            // Whole-cell match first (labels can legitimately contain commas),
            // then split on ';'/newline (preferred) or comma.
            const tokens = whole !== undefined ? [cell] : cell.split(/[;\n]+|,/).filter(Boolean);
            const resolved = tokens
                .map(t => resolveOption(field, t))
                .filter((v): v is string => v !== undefined);
            const unresolved = tokens.length - resolved.length;
            const warning =
                unresolved > 0 ? `${field.label}: some values didn't match an option` : undefined;

            if (field.allow_multiple) return { value: resolved, warning };
            return { value: resolved[0] ?? '', warning };
        }
        case 'checkbox': {
            const t = norm(raw);
            if (CHECKBOX_TRUTHY.has(t)) return { value: true };
            if (CHECKBOX_FALSY.has(t)) return { value: false };
            return { value: false, warning: `${field.label}: "${raw}" isn't yes/no` };
        }
        case 'date': {
            const d = raw instanceof Date ? dayjs(raw) : dayjs(String(raw).trim());
            return d.isValid()
                ? { value: d.format('YYYY-MM-DD') }
                : { value: '', warning: `${field.label}: "${raw}" is not a valid date` };
        }
        case 'number':
        case 'currency': {
            const n = Number(String(raw).replace(/,/g, '').trim());
            return Number.isNaN(n)
                ? { value: undefined, warning: `${field.label}: "${raw}" is not a number` }
                : { value: n };
        }
        case 'country': {
            const id = countryResolver ? countryResolver(raw) : null;
            return id
                ? { value: id }
                : { value: '', warning: `${field.label}: country "${raw}" not recognised` };
        }
        case 'phone': {
            const digits = String(raw).trim();
            return { value: digits.startsWith('+') ? digits : `+${digits.replace(/\D/g, '')}` };
        }
        default:
            return { value: String(raw).trim() };
    }
}

// Build a country resolver from Peko's useCountries options
// ({value: _id, label: name}), matching by id, name, or code.
export function buildCountryResolver(
    options: { value: string; label: string; code?: string }[]
): CountryResolver {
    const map = new Map<string, string>();
    options.forEach(o => {
        [o.value, o.label, o.code].forEach(key => {
            const k = norm(key);
            if (k && !map.has(k)) map.set(k, o.value);
        });
    });
    return raw => map.get(norm(raw)) ?? null;
}
