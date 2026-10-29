import React, { useState } from 'react';

import { Button, Checkbox, Input, Select, Tooltip, Typography } from 'antd';
import { useField, useFormikContext } from 'formik';

import type { FieldDef, TableColumnDef } from '../../types/formConfig';

const { Text } = Typography;

type RowData = Record<string, string | boolean>;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const DIN_REGEX = /^[0-9]{8}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function getColError(col: TableColumnDef, value: string, showRequired: boolean, requiredByRow?: boolean): string | undefined {
    if (!value) {
        if (showRequired && col.required) return `${col.label} is required`;
        if (showRequired && requiredByRow && (col.requiredIfAnyOtherFilled || col.requiredIfColFilled)) return `${col.label} is required`;
        return undefined;
    }
    switch (col.validation) {
        case 'pan': return PAN_REGEX.test(value) ? undefined : 'Enter a valid PAN (e.g. ABCDE1234F)';
        case 'din': return DIN_REGEX.test(value) ? undefined : 'Enter a valid 8-digit DIN';
        case 'dinPan': return (DIN_REGEX.test(value) || PAN_REGEX.test(value)) ? undefined : 'Enter a valid DIN (8 digits) or PAN (e.g. ABCDE1234F)';
        case 'mobile': return MOBILE_REGEX.test(value) ? undefined : 'Enter a valid 10-digit mobile number starting with 6–9';
        case 'email': return EMAIL_REGEX.test(value) ? undefined : 'Enter a valid email address';
        case 'mobileOrEmail': return (MOBILE_REGEX.test(value) || EMAIL_REGEX.test(value)) ? undefined : 'Enter a valid mobile number or email address';
        default: return undefined;
    }
}

interface CellProps {
    col: TableColumnDef;
    value: string | boolean;
    showError: boolean;
    requiredByRow: boolean;
    externalError?: string;
    onChange: (val: string | boolean) => void;
    onBlur: () => void;
}

const Cell: React.FC<CellProps> = ({ col, value, showError, requiredByRow, externalError, onChange, onBlur }) => {
    const localError = typeof value === 'string' ? getColError(col, value, showError, requiredByRow) : undefined;
    const error = localError ?? (showError ? externalError : undefined);

    if (col.type === 'serial') {
        return (
            <div className="flex items-center justify-center h-full text-[13px] text-[rgba(0,0,0,0.45)]">
                {String(value)}
            </div>
        );
    }

    if (col.type === 'checkbox') {
        return (
            <div className="flex items-center justify-center h-full">
                <Checkbox checked={!!value} onChange={e => onChange(e.target.checked)} />
            </div>
        );
    }

    if (col.type === 'select') {
        return (
            <div>
                <Select
                    value={(value as string) || undefined}
                    placeholder={col.placeholder ?? 'Select'}
                    status={error ? 'error' : undefined}
                    className="!text-[13px] w-full"
                    options={col.options}
                    onChange={val => onChange(val ?? '')}
                    onBlur={onBlur}
                    allowClear
                />
                {error && <div className="text-[11px] mt-0.5 px-1 text-[#ff4f4f]">{error}</div>}
            </div>
        );
    }

    if (col.type === 'textarea') {
        return (
            <div>
                <Input.TextArea
                    value={value as string}
                    placeholder={col.placeholder}
                    maxLength={col.maxLength}
                    autoSize={{ minRows: 2 }}
                    status={error ? 'error' : undefined}
                    className="!text-[13px] !border-0 !shadow-none !bg-transparent !resize-none"
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                />
                {error && <div className="text-[11px] mt-0.5 px-1 text-[#ff4f4f]">{error}</div>}
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center min-h-[32px]">
            <Tooltip title={value as string} mouseEnterDelay={0.5}>
                <Input
                    value={value as string}
                    placeholder={col.placeholder}
                    maxLength={col.maxLength}
                    status={error ? 'error' : undefined}
                    className="!text-[13px] !border-0 !shadow-none !bg-transparent"
                    onChange={e => {
                        let val = e.target.value;
                        if (col.allowNumbersOnly) val = val.replace(/\D/g, '');
                        if (col.allowTwoDecimalsOnly) {
                            val = val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1').replace(/(\.\d{2})\d+/, '$1');
                            if (val === '.') val = '0.';
                        }
                        if (col.convertToUppercase) val = val.toUpperCase();
                        onChange(val);
                    }}
                    onBlur={onBlur}
                />
            </Tooltip>
            {error && <div className="text-[11px] mt-0.5 px-1 text-[#ff4f4f]">{error}</div>}
        </div>
    );
};

interface Props {
    field: FieldDef;
}

const buildEmptyRow = (columns: TableColumnDef[]): RowData =>
    Object.fromEntries(columns.map(c => [c.key, c.type === 'checkbox' ? false : '']));

const RepeatableTable: React.FC<Props> = ({ field }) => {
    const columns = field.columns ?? [];
    const defaultRows = field.defaultRows ?? 1;

    const [, meta, helpers] = useField<RowData[]>(field.key);
    const { submitCount, setFieldValue, setFieldError, setFieldTouched, errors } = useFormikContext<Record<string, any>>();
    const tableErrors = (errors[field.key] ?? []) as Array<Record<string, string> | undefined>;

    // Compute duplicate-value errors synchronously so they show immediately on change
    const dupColKeys = columns.filter(c => c.validation === 'pan' || c.validation === 'din').map(c => c.key);
    // touched[rowIndex][colKey] — local state since Formik array-item touch is unreliable
    const [touchedCells, setTouchedCells] = useState<Record<number, Record<string, boolean>>>({});
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const rows: RowData[] = meta.value?.length
        ? meta.value
        : Array.from({ length: defaultRows }, () => buildEmptyRow(columns));

    // Build a map of rowIndex -> colKey -> duplicate error message, derived directly from current rows
    const dupErrors = dupColKeys.reduce<Record<number, Record<string, string>>>((acc, colKey) => {
        const col = columns.find(c => c.key === colKey);
        const label = col?.validation === 'pan' ? 'PAN' : 'DIN';
        const seen = new Map<string, number>();
        rows.forEach((row, idx) => {
            const val = row[colKey] as string | undefined;
            if (!val) return;
            if (seen.has(val)) {
                const firstIdx = seen.get(val)!;
                const msg = `Duplicate ${label} — each director must have a unique ${label}`;
                acc[idx] = { ...(acc[idx] ?? {}), [colKey]: msg };
                acc[firstIdx] = { ...(acc[firstIdx] ?? {}), [colKey]: msg };
            } else {
                seen.set(val, idx);
            }
        });
        return acc;
    }, {});

    const rowHasData = (row: RowData) =>
        columns.some(col => col.type !== 'serial' && col.type !== 'checkbox' && !!row[col.key]);

    const updateCell = (rowIndex: number, colKey: string, val: string | boolean) => {
        const updated = rows.map((r, i) => (i === rowIndex ? { ...r, [colKey]: val } : r));
        helpers.setValue(updated);
    };

    const touchCell = (rowIndex: number, colKey: string) => {
        setTouchedCells(prev => ({
            ...prev,
            [rowIndex]: { ...(prev[rowIndex] ?? {}), [colKey]: true },
        }));
    };

    const addRow = () => helpers.setValue([...rows, buildEmptyRow(columns)]);

    const removeRow = (index: number) => {
        if (rows.length <= 1) return;
        helpers.setValue(rows.filter((_, i) => i !== index));
        setTouchedCells(prev => {
            const next: Record<number, Record<string, boolean>> = {};
            Object.entries(prev).forEach(([k, v]) => {
                const ki = Number(k);
                if (ki !== index) next[ki > index ? ki - 1 : ki] = v;
            });
            return next;
        });
    };

    return (
        <div className="col-span-2 w-full">
            {field.title && (
                <Text className="!text-[13px] !font-semibold !text-black block mb-1">{field.title}</Text>
            )}
            {field.description && (
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] block mb-3">{field.description}</Text>
            )}

            <div className="w-full overflow-x-auto rounded-xl border border-[#ebebeb] mt-4">
                <table className="w-max min-w-full border-collapse text-[13px]">
                    <thead>
                        <tr className="bg-[#fafafa]">
                            {field.selectable && (
                                <th className="w-8 px-3 py-2 border-b border-[#ebebeb]" />
                            )}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width, minWidth: col.minWidth }}
                                    className="px-4 py-2 text-left text-[12px] font-semibold text-[rgba(0,0,0,0.65)] border-b border-[#ebebeb] whitespace-nowrap"
                                >
                                    {col.label}
                                    {col.required && <span className="text-[#ff4f4f] ml-0.5">*</span>}
                                </th>
                            ))}
                            <th className="w-10 border-b border-[#ebebeb]" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-[#ebebeb] last:border-b-0 hover:bg-[#fafafa]"
                                style={field.selectable && selectedRow === rowIndex ? { background: '#fff1f1' } : undefined}
                            >
                                {field.selectable && (
                                    <td className="px-3 py-1 align-middle">
                                        <div>
                                            <Checkbox
                                                checked={selectedRow === rowIndex}
                                                onChange={e => {
                                                    const next = e.target.checked ? rowIndex : null;
                                                    setSelectedRow(next);
                                                    if (field.selectFills) {
                                                        field.selectFills.forEach(({ sourceKey, targetKey }) => {
                                                            setFieldValue(targetKey, next !== null ? ((row[sourceKey] as string) ?? '') : '');
                                                            if (next !== null) {
                                                                setFieldError(targetKey, undefined);
                                                                setFieldTouched(targetKey, false, false);
                                                            }
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </td>
                                )}
                                {columns.map(col => {
                                    const otherColsFilled = columns.some(
                                        c => c.key !== col.key && c.type !== 'serial' && c.type !== 'checkbox' && !!row[c.key]
                                    );
                                    return (
                                        <td key={col.key} style={{ minWidth: col.minWidth }} className="px-1 py-1 align-middle">
                                            <Cell
                                                col={col}
                                                value={row[col.key] ?? (col.type === 'checkbox' ? false : '')}
                                                showError={submitCount > 0 || !!(touchedCells[rowIndex]?.[col.key]) || rowHasData(row)}
                                                requiredByRow={otherColsFilled}
                                                externalError={dupErrors[rowIndex]?.[col.key] ?? tableErrors[rowIndex]?.[col.key]}
                                                onChange={val => updateCell(rowIndex, col.key, val)}
                                                onBlur={() => touchCell(rowIndex, col.key)}
                                            />
                                        </td>
                                    );
                                })}
                                <td className="px-3 py-1 text-center align-middle">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(rowIndex)}
                                        disabled={rows.length <= 1}
                                        className="text-[#ff4f4f] text-[16px] disabled:opacity-30 leading-none"
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Button
                type="dashed"
                size="small"
                onClick={addRow}
                className="mt-2 !text-[12px] !text-[#ff4f4f] !border-[#ff4f4f]"
            >
                + Add row
            </Button>
            {field.selectable && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[rgba(0,0,0,0.45)]">
                   
                    <span>Select a director using the checkbox to auto-fill <strong className="text-[rgba(0,0,0,0.55)]">Authorised Signatory</strong> details.</span>
                </div>
            )}
        </div>
    );
};

export default RepeatableTable;
