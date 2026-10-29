import React, { useEffect, useMemo } from 'react';

import { Alert, Col, Flex, Form, Row, Select, Spin, Typography } from 'antd';
import { useField } from 'formik';

import { useFormTableById } from '../../hooks/useGetTableData';
import { INestedLevel } from '../../types/forms';
import { NestedSelectEntry } from '../DynamicForm/utils/nestedSelectValue';

interface NestedSelectInputProps {
    name: string;
    label?: string;
    required?: boolean;
    description?: string;
    tableId?: string;
    levels: INestedLevel[];
    allowMultiple?: boolean;
}

const NestedSelectInput: React.FC<NestedSelectInputProps> = ({
    name,
    label,
    required,
    description,
    tableId,
    levels,
    allowMultiple,
}) => {
    const [field, meta, helpers] = useField<NestedSelectEntry[]>(name);
    const lastIdx = levels.length - 1;

    const rawValue = useMemo<NestedSelectEntry[]>(
        () => (Array.isArray(field.value) ? field.value : []),
        [field.value]
    );

    const path = useMemo<string[]>(() => {
        const entries = allowMultiple ? rawValue.slice(0, lastIdx) : rawValue;
        return entries.map(entry => (typeof entry === 'string' ? entry : ''));
    }, [rawValue, allowMultiple, lastIdx]);

    const leafValues = useMemo<string[]>(
        () =>
            allowMultiple && Array.isArray(rawValue[lastIdx])
                ? (rawValue[lastIdx] as string[])
                : [],
        [allowMultiple, rawValue, lastIdx]
    );

    const { data, loading, error, fetchFormTableById } = useFormTableById();

    useEffect(() => {
        if (tableId) fetchFormTableById(tableId);
    }, [tableId, fetchFormTableById]);

    const rows = useMemo<Record<string, any>[]>(
        () => (Array.isArray(data?.data) ? (data.data as Record<string, any>[]) : []),
        [data]
    );

    const optionsForLevel = (levelIdx: number): string[] => {
        const lvl = levels[levelIdx];
        if (!lvl?.column) return [];
        const seen = new Set<string>();
        const out: string[] = [];
        rows.forEach(row => {
            const matchesParents = levels
                .slice(0, levelIdx)
                .every((parent, i) => String(row[parent.column] ?? '') === String(path[i] ?? ''));
            if (!matchesParents) return;
            const raw = row[lvl.column];
            if (raw === undefined || raw === null || raw === '') return;
            const v = String(raw);
            if (!seen.has(v)) {
                seen.add(v);
                out.push(v);
            }
        });
        return out;
    };

    const handleSelectParent = (levelIdx: number, value: string | null) => {
        const next: NestedSelectEntry[] = path.slice(0, levelIdx);
        if (value) next[levelIdx] = value;
        helpers.setValue(next);
    };

    const handleSelectLeaf = (keys: string[]) => {
        helpers.setValue(keys.length > 0 ? [...path, keys] : [...path]);
    };

    const parentsComplete = levels
        .slice(0, allowMultiple ? lastIdx : levels.length)
        .every((_, i) => Boolean(path[i]));
    const firstMissingIdx = levels.findIndex((_, i) => !path[i]);
    const hasFieldError = meta.touched && Boolean(meta.error);

    const heading = (label || description) && (
        <Flex vertical gap={2} className="mb-2">
            {label && (
                <Typography.Text className="text-sm font-medium text-neutral-900">
                    {label}
                    {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
                </Typography.Text>
            )}
            {description && (
                <Typography.Text className="text-xs text-neutral-500">
                    {description}
                </Typography.Text>
            )}
        </Flex>
    );

    if (!tableId || levels.length === 0) {
        return (
            <>
                {heading}
                <Alert
                    type="warning"
                    showIcon
                    message="Nested select field is not fully configured"
                />
            </>
        );
    }

    if (loading && !data) {
        return (
            <>
                {heading}
                <Spin size="small" />
            </>
        );
    }

    if (error) {
        return (
            <>
                {heading}
                <Alert type="error" showIcon message="Failed to load options" />
            </>
        );
    }

    return (
        <>
            {heading}
            <Row gutter={[12, 12]}>
                {levels.map((lvl, idx) => {
                    const opts = optionsForLevel(idx);
                    const isVisible = idx === 0 || (Boolean(path[idx - 1]) && opts.length > 0);
                    if (!isVisible) return null;

                    if (allowMultiple && idx === lastIdx) {
                        const showLeafError = hasFieldError && parentsComplete;
                        let leafHelp: string | undefined;
                        if (showLeafError) leafHelp = meta.error as string;
                        else if (leafValues.length > 0) leafHelp = `${leafValues.length} selected`;

                        return (
                            <Col key={`${lvl.column}-${idx}`} xs={24} md={12} lg={8}>
                                <Form.Item
                                    label={lvl.label}
                                    required={required}
                                    validateStatus={showLeafError ? 'error' : ''}
                                    help={leafHelp}
                                >
                                    <Select
                                        mode="multiple"
                                        style={{ width: '100%' }}
                                        placeholder={`Select ${lvl.label}`}
                                        value={leafValues}
                                        onChange={vals => handleSelectLeaf(vals ?? [])}
                                        allowClear
                                        options={opts.map(o => ({ value: o, label: o }))}
                                        maxTagCount="responsive"
                                    />
                                </Form.Item>
                            </Col>
                        );
                    }

                    const showError = hasFieldError && firstMissingIdx === idx;

                    return (
                        <Col key={`${lvl.column}-${idx}`} xs={24} md={12} lg={8}>
                            <Form.Item
                                label={lvl.label}
                                required={required}
                                validateStatus={showError ? 'error' : ''}
                                help={showError ? (meta.error as string) : undefined}
                            >
                                <Select
                                    style={{ width: '100%' }}
                                    placeholder={`Select ${lvl.label}`}
                                    value={path[idx] || undefined}
                                    onChange={val => handleSelectParent(idx, val ?? null)}
                                    allowClear
                                    options={opts.map(o => ({ value: o, label: o }))}
                                />
                            </Form.Item>
                        </Col>
                    );
                })}
            </Row>
        </>
    );
};

export default NestedSelectInput;
