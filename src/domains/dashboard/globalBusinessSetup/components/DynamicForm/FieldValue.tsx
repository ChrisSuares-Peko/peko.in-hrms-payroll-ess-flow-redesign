import React from 'react';

import dayjs from 'dayjs';

import { formatNestedValue } from './utils/nestedSelectValue';
import { IField } from '../../types/forms';

interface FieldValueProps {
    field: IField;
    value: unknown;
}

const formatScalar = (field: IField, value: unknown): string => {
    if (value == null || value === '') return '-';

    switch (field.type) {
        case 'date': {
            const d = dayjs(value as string | Date);
            return d.isValid() ? d.format('DD MMM YYYY') : '-';
        }
        case 'checkbox':
            return value === true || value === 'true' ? 'Yes' : 'No';
        case 'select':
        case 'radio':
        case 'checkbox_group': {
            const arr = Array.isArray(value) ? value : [value];
            const labels = arr.map(v => {
                const opt = field.options?.find(o => String(o.value) === String(v));
                return opt?.label ?? String(v);
            });
            return labels.filter(Boolean).join(', ') || '-';
        }
        case 'nested_select': {
            if (!Array.isArray(value) || value.length === 0) return '-';
            return formatNestedValue(value) || '-';
        }
        case 'file':
        case 'image': {
            const extractName = (v: unknown): string | null => {
                if (!v) return null;
                if (typeof v === 'string') return v;
                if (v instanceof File) return v.name;
                if (typeof v === 'object') {
                    const o = v as { name?: unknown; url?: unknown };
                    if (typeof o.name === 'string' && o.name) return o.name;
                    if (typeof o.url === 'string' && o.url) {
                        const last = o.url.split('/').pop();
                        return last || 'Uploaded';
                    }
                }
                return null;
            };
            if (Array.isArray(value)) {
                const names = value.map(extractName).filter(Boolean) as string[];
                return names.length > 0 ? names.join(', ') : '-';
            }
            return extractName(value) ?? '-';
        }
        default:
            return String(value);
    }
};

const FieldValue: React.FC<FieldValueProps> = ({ field, value }) => (
    <span className="text-neutral-700">{formatScalar(field, value)}</span>
);

export default FieldValue;
