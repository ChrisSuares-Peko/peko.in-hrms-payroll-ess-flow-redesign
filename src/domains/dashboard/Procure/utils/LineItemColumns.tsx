import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { UNIT_OPTIONS } from './data';

const { Text } = Typography;

export const GST_OPTIONS = [
    { value: '0',  label: 'GST 0%' },
    { value: '5',  label: 'GST 5%' },
    { value: '12', label: 'GST 12%' },
    { value: '18', label: 'GST 18%' },
    { value: '28', label: 'GST 28%' },
];

export const GST_TYPE_OPTIONS = [
    { value: 'exclusive', label: 'Exclusive (GST added on top)' },
    { value: 'inclusive', label: 'Inclusive (GST included in price)' },
];

export const computeLineItemTotal = (qty: number, amount: number, taxRate: number, gstType: string): number => {
    const base = qty * amount;
    if (gstType === 'inclusive') return base;
    return base * (1 + taxRate / 100);
};

export interface EditableLineItem {
    key: string;
    description: string;
    qty: string | number;
    unit: string;
    taxRate?: string;
    gstType?: string;
    [amountField: string]: string | number | undefined;
}

type Options = {
    removeItem: (key: string) => void;
    itemsLength: number;
    formPrefix?: string;
    amountField?: string;
    amountLabel?: string;
    readOnly?: boolean;
};

export const getLineItemColumns = ({
    removeItem,
    itemsLength,
    formPrefix = 'lineItems',
    amountField = 'amount',
    amountLabel = 'Est. Amount',
    readOnly = false,
}: Options): TableColumnsType<EditableLineItem> => [
    {
        title: 'Description', dataIndex: 'description', key: 'description', width: 260,
        render: (_: unknown, record: EditableLineItem, i: number) => readOnly
            ? <Text className="text-sm" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{record.description || '—'}</Text>
            : (
                <TextInput
                    name={`${formPrefix}[${i}].description`}
                    type="text"
                    placeholder="Enter item description"
                    maxLength={200}
                    isRequired
                    formItemClass="!mb-0"
                    removeEmoji
                />
            ),
    },
    {
        title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80,
        render: (_: unknown, record: EditableLineItem, i: number) => readOnly
            ? <Text className="text-sm">{record.qty}</Text>
            : (
                <TextInput
                    name={`${formPrefix}[${i}].qty`}
                    type="text"
                    placeholder="0"
                    allowTwoDecimalsOnly
                    inputMode="numeric"
                    maxLength={8}
                    formItemClass="!mb-0"
                />
            ),
    },
    {
        title: 'Unit', dataIndex: 'unit', key: 'unit', width: 100,
        render: (_: unknown, record: EditableLineItem, i: number) => readOnly
            ? <Text className="text-sm">{record.unit}</Text>
            : (
                <SelectInput
                    name={`${formPrefix}[${i}].unit`}
                    placeholder="Unit"
                    options={UNIT_OPTIONS}
                    classes="w-full"
                    formItemClass="!mb-0"
                />
            ),
    },
    {
        title: amountLabel, dataIndex: amountField, key: amountField, width: 130,
        render: (_: unknown, record: EditableLineItem, i: number) => readOnly
            ? <Text className="text-sm">₹ {Number(record[amountField]).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            : (
                <TextInput
                    name={`${formPrefix}[${i}].${amountField}`}
                    type="text"
                    placeholder="0"
                    allowTwoDecimalsOnly
                    inputMode="decimal"
                    prefix={<span style={{ color: '#0a0a0a' }}>₹</span>}
                    maxLength={10}
                    formItemClass="!mb-0"
                    isRequired
                />
            ),
    },
    {
        title: 'GST Rate', key: 'taxRate', width: 120,
        render: (_: unknown, record: EditableLineItem, i: number) => readOnly
            ? <Text className="text-sm">{record.taxRate ? `GST ${record.taxRate}%` : '—'}</Text>
            : (
                <SelectInput
                    name={`${formPrefix}[${i}].taxRate`}
                    placeholder="GST"
                    options={GST_OPTIONS}
                    classes="w-full"
                    formItemClass="!mb-0"
                />
            ),
    },
    {
        title: 'GST Type', key: 'gstType', width: 120,
        render: (_: unknown, record: EditableLineItem, i: number) => {
            const gstTypeLabel = { inclusive: 'Inclusive', exclusive: 'Exclusive' }[record.gstType ?? ''] ?? '—';
            return readOnly
                ? <Text className="text-sm">{gstTypeLabel}</Text>
                : (
                    <SelectInput
                        name={`${formPrefix}[${i}].gstType`}
                        placeholder="Type"
                        options={GST_TYPE_OPTIONS}
                        classes="w-full"
                        formItemClass="!mb-0"
                    />
                );
        },
    },
    {
        title: 'Net Amount', key: 'total', width: 120,
        render: (_: unknown, row: EditableLineItem) => {
            const qty = parseFloat(String(row.qty)) || 0;
            const amount = parseFloat(String(row[amountField])) || 0;
            const taxRate = parseFloat(String(row.taxRate)) || 0;
            const gstType = row.gstType ?? 'exclusive';
            const total = computeLineItemTotal(qty, amount, taxRate, gstType);
            return (
                <Text className="!text-xs whitespace-nowrap block pt-[5px]" style={{ color: '#FF4F4F', fontWeight: 600 }}>
                    {total ? `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </Text>
            );
        },
    },
    ...(!readOnly ? [{
        title: '', key: 'action', width: 40,
        render: (_: unknown, row: EditableLineItem) => (
            <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={itemsLength === 1}
                onClick={() => removeItem(row.key)}
                className="!pt-[5px]"
            />
        ),
    }] : []),
];
