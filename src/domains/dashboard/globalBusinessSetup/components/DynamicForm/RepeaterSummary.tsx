import React, { useMemo, useState } from 'react';

import {
    DeleteOutlined,
    DownOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import FieldValue from './FieldValue';
import { useCountries } from '../../hooks/useCountries';
import { ISection } from '../../types/forms';

const SUMMARY_COUNT = 3;

interface RepeaterSummaryProps {
    pageId: string;
    sectionId: string;
    section: ISection;
    // Row noun from the repeater's title_template (e.g. "Item", "Director") —
    // rows title as "{noun} {n}" like the vendor, not the section title.
    noun: string;
    instances: { id: string; index: number }[];
    // Optional per-instance title labels (from repeater.label_field_name).
    labels?: (string | undefined)[];
    hiddenIndex?: number | null;
    canDelete: boolean;
    onView?: (index: number) => void;
    onFill?: (index: number) => void;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

// Whether a value is still the untouched default for its field type.
export const isDefaultFieldValue = (fieldType: string, value: unknown): boolean => {
    if (value === undefined || value === null) return true;
    switch (fieldType) {
        case 'phone':
            return value === '' || value === '+91' || value === '+971';
        case 'checkbox':
            return value === false;
        case 'nested_select':
            return Array.isArray(value) && value.length === 0;
        case 'number':
            return value === undefined || value === null;
        default:
            return value === '';
    }
};

// Whether an instance has any user-entered data in its visible fields (shared
// with RepeaterClearButton so "Clear All" only shows when there's data).
export const isInstanceFilled = (section: ISection, instanceValues: Record<string, unknown>) =>
    section.fields
        .filter(f => !f.view?.is_hidden)
        .some(f => !isDefaultFieldValue(f.type, instanceValues[f.name]));

function FieldBlock({ label, field, value }: { label: string; field: any; value: unknown }) {
    return (
        <div className="min-w-0">
            <Typography.Text className="text-xs text-gray-400 font-medium block truncate">
                {label}
            </Typography.Text>
            {/* truncate keeps long unbroken values from blowing the grid layout */}
            <div
                className="mt-0.5 text-sm font-medium text-gray-800 truncate"
                title={typeof value === 'string' ? value : undefined}
            >
                <FieldValue field={field} value={value} />
            </div>
        </div>
    );
}

const RepeaterSummary: React.FC<RepeaterSummaryProps> = ({
    pageId,
    sectionId,
    section,
    noun,
    instances,
    labels,
    hiddenIndex,
    canDelete,
    onView: _onView,
    onFill,
    onEdit,
    onDelete,
}) => {
    const { values, errors, touched } = useFormikContext<any>();
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const sectionPath = `pages.${pageId}.${sectionId}`;

    const hasCountryField = useMemo(
        () => section.fields.some(f => f.type === 'country'),
        [section.fields]
    );
    const { countryOptions } = useCountries('', '', hasCountryField ? 'is_active=true' : '');
    const countryLabelById = useMemo(() => {
        const map: Record<string, string> = {};
        countryOptions.forEach(c => {
            map[c.value] = c.label;
        });
        return map;
    }, [countryOptions]);

    const visibleFields = useMemo(
        () => section.fields.filter(f => !f.view?.is_hidden),
        [section.fields]
    );
    const summaryFields = visibleFields.slice(0, SUMMARY_COUNT);
    const restFields = visibleFields.slice(SUMMARY_COUNT);

    const rows = useMemo(
        () => instances.filter(inst => inst.index !== hiddenIndex),
        [instances, hiddenIndex]
    );

    const toggleExpand = (index: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const isDefaultValue = isDefaultFieldValue;

    const isFilled = (instanceValues: Record<string, unknown>) =>
        visibleFields.some(f => !isDefaultValue(f.type, instanceValues[f.name]));

    if (rows.length === 0) return null;

    return (
        <Flex vertical gap={8}>
            {rows.map(inst => {
                const instanceValues =
                    (getIn(values, `${sectionPath}.${inst.index}`) as Record<string, unknown>) ||
                    {};
                const instanceErrors =
                    (getIn(errors, `${sectionPath}.${inst.index}`) as Record<string, string>) || {};
                const filled = isFilled(instanceValues);
                const isExpanded = expandedRows.has(inst.index);
                // Only visible-field errors mark a row incomplete — a hidden
                // cross-instance sentinel (e.g. "totals must equal 100%") that
                // fails until every row is filled must not flag every row red.
                const visibleFieldNames = new Set(visibleFields.map(f => f.name));
                const instanceTouched = getIn(touched, `${sectionPath}.${inst.index}`);
                const wasAttempted =
                    instanceTouched != null &&
                    typeof instanceTouched === 'object' &&
                    Object.values(instanceTouched as Record<string, unknown>).some(Boolean);
                const hasError =
                    wasAttempted &&
                    Object.entries(instanceErrors).some(
                        ([key, e]) => visibleFieldNames.has(key) && typeof e === 'string' && e
                    );

                const resolveValue = (field: any) => {
                    let val = instanceValues[field.name];
                    if (field.type === 'country' && val) val = countryLabelById[String(val)] ?? val;
                    return val;
                };

                if (!filled) {
                    return (
                        <div
                            key={inst.id}
                            className="rounded-2xl border p-4"
                            style={
                                hasError
                                    ? { borderColor: '#fecaca', backgroundColor: '#fff5f5' }
                                    : { borderColor: '#e5e7eb' }
                            }
                        >
                            <Flex align="center" justify="space-between" gap={16}>
                                <Flex align="center" gap={16} className="shrink-0">
                                    <span
                                        className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold shrink-0 ${hasError ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        {inst.index + 1}
                                    </span>
                                    <Typography.Text className="text-sm font-semibold text-gray-700">
                                        {noun} {inst.index + 1}
                                        {labels?.[inst.index] ? ` - ${labels[inst.index]}` : ''}
                                    </Typography.Text>
                                </Flex>
                                {hasError ? (
                                    <Flex
                                        align="center"
                                        gap={6}
                                        className="hidden sm:flex"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
                                        <Typography.Text style={{ color: '#ef4444', fontSize: 14 }}>
                                            Please add the details for {noun} {inst.index + 1}
                                        </Typography.Text>
                                    </Flex>
                                ) : (
                                    <Typography.Text
                                        className="text-sm text-gray-400 hidden sm:block"
                                        style={{ flex: 1, textAlign: 'center' }}
                                    >
                                        No details added yet
                                    </Typography.Text>
                                )}
                                <Button
                                    icon={<PlusOutlined />}
                                    onClick={() => (onFill ?? onEdit)(inst.index)}
                                >
                                    Add details
                                </Button>
                            </Flex>
                        </div>
                    );
                }

                return (
                    <div
                        key={inst.id}
                        className="rounded-2xl border p-4 relative"
                        style={
                            hasError
                                ? { borderColor: '#fecaca', backgroundColor: '#fff5f5' }
                                : { borderColor: '#e5e7eb' }
                        }
                    >
                        <Flex align="flex-start" gap={16}>
                            <span
                                className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold shrink-0 ${hasError ? 'bg-red-100 text-red-500' : 'bg-red-50 text-red-500'}`}
                            >
                                {inst.index + 1}
                            </span>
                            <div className="min-w-0 flex-grow pr-20">
                                {hasError && (
                                    <Flex align="center" gap={6} className="mb-2">
                                        <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
                                        <Typography.Text style={{ color: '#ef4444', fontSize: 13 }}>
                                            Please add the details for {noun} {inst.index + 1}
                                        </Typography.Text>
                                    </Flex>
                                )}
                                <div className="grid grid-cols-3 gap-x-8 gap-y-3">
                                    {summaryFields
                                        .filter(
                                            f => !isDefaultValue(f.type, instanceValues[f.name])
                                        )
                                        .map(field => (
                                            <FieldBlock
                                                key={field._id}
                                                label={field.label}
                                                field={field}
                                                value={resolveValue(field)}
                                            />
                                        ))}
                                </div>
                                {isExpanded && restFields.length > 0 && (
                                    <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-3 gap-x-8 gap-y-3">
                                        {restFields
                                            .filter(
                                                f => !isDefaultValue(f.type, instanceValues[f.name])
                                            )
                                            .map(field => (
                                                <FieldBlock
                                                    key={field._id}
                                                    label={field.label}
                                                    field={field}
                                                    value={resolveValue(field)}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>
                        </Flex>
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => onEdit(inst.index)}
                            />
                            {canDelete && (
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => onDelete(inst.index)}
                                />
                            )}
                            {restFields.length > 0 && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={
                                        <DownOutlined
                                            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    }
                                    onClick={() => toggleExpand(inst.index)}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </Flex>
    );
};

export default RepeaterSummary;
