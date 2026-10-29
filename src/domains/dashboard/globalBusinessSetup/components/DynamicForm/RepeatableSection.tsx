import { useEffect, useMemo, useRef, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { getIn, useFormikContext } from 'formik';
import { v4 as uuid } from 'uuid';

import RepeaterClearButton from './RepeaterClearButton';
import RepeaterImport from './RepeaterImport';
import { buildBlankInstance } from './RepeaterImport/buildInstances';
import RepeaterItemModal from './RepeaterItemModal';
import RepeaterSummary from './RepeaterSummary';
import RepeaterViewModal from './RepeaterViewModal';
import useRepeaterLabels from './useRepeaterLabels';
import { getDefaultValue } from './utils/fieldDefaults';
import { ISection, IForm } from '../../types/forms';
import { getNestedValue, evaluateCondition } from '../../utils/conditionalUtils';
import { resolveComplexPath, getValueFromComplexPath } from '../../utils/pathResolver';

const MAX_REPEAT_INSTANCES_SAFETY = 50;

const deepMerge = (target: any, source: any): any => {
    const result = { ...target };
    Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    });
    return result;
};

const initializeInstanceFields = (
    section: ISection,
    form: IForm,
    values: any,
    pageId: string,
    sectionId: string,
    instanceIdx: number,
    setFieldValue: (field: string, value: any) => void
) => {
    section.fields.forEach(field => {
        let shouldInitialize = true;

        if (field.conditional?.enabled && field.conditional.source_field_name) {
            const sourceValue = getValueFromComplexPath(
                form,
                values,
                field.conditional.source_field_name,
                pageId,
                sectionId
            );

            if (sourceValue === undefined || sourceValue === null || !field.conditional.operator) {
                shouldInitialize = false;
            } else {
                shouldInitialize = evaluateCondition(
                    sourceValue,
                    field.conditional.operator,
                    field.conditional.value
                );
            }
        }

        if (!shouldInitialize) {
            return;
        }

        const fieldPath = `pages.${pageId}.${sectionId}.${instanceIdx}.${field.name}`;
        const currentValue = getNestedValue(values, fieldPath);

        if (currentValue === undefined) {
            let defaultValue: any;

            if (field.type === 'date' && field.default_value) {
                const parsed = dayjs(field.default_value);
                defaultValue = parsed.isValid()
                    ? parsed.format('YYYY-MM-DD')
                    : getDefaultValue(field.type);
            } else {
                defaultValue = getDefaultValue(field.type);
            }

            setFieldValue(fieldPath, defaultValue);
        }
    });
};

type RepeatableSectionProps = {
    section: ISection;
    pageId: string;
    sectionId: string;
    form: IForm;
};

export default function RepeatableSection({
    section,
    pageId,
    sectionId,
    form,
}: RepeatableSectionProps) {
    const { values, errors, touched, setFieldValue, validateForm, setTouched } =
        useFormikContext<any>();

    const sectionError = getIn(errors, `pages.${pageId}.${sectionId}`);
    const sectionTouched = getIn(touched, `pages.${pageId}.${sectionId}`);
    const [instances, setInstances] = useState<Array<{ id: string; index: number }>>([]);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<'add' | 'edit' | 'view'>('add');
    const [isNewDraft, setIsNewDraft] = useState(false);
    const snapshotRef = useRef<Record<string, any> | null>(null);
    const isOpen = editingIndex !== null;

    const repeater = section.repeater || { enabled: false };
    const isUserControlled = repeater.enabled && repeater.source_type === 'user_controlled';
    const isFixedCount = repeater.enabled && repeater.source_type === 'fixed_count';
    const isFieldValue = repeater.enabled && repeater.source_type === 'field_value';

    const sourceFieldPath = useMemo(() => {
        if (isFieldValue && repeater.source_field_name) {
            return resolveComplexPath(form, repeater.source_field_name, pageId, sectionId);
        }
        return null;
    }, [isFieldValue, repeater.source_field_name, form, pageId, sectionId]);

    const sourceFieldValue = useMemo(() => {
        if (sourceFieldPath) {
            return getNestedValue(values, sourceFieldPath);
        }
        return undefined;
    }, [sourceFieldPath, values]);

    const sourceFieldMaxValue = useMemo(() => {
        if (!isFieldValue || !sourceFieldPath) return null;
        const fieldName = sourceFieldPath.split('.').pop();
        let found: number | null = null;
        form.pages.some(page =>
            page.sections.some(sec => {
                const f = sec.fields.find(field => field.name === fieldName);
                if (f?.validation?.max?.value !== undefined) {
                    found = Number(f.validation.max.value);
                    return true;
                }
                return false;
            })
        );
        if (found !== null) return found;
        return null;
    }, [isFieldValue, sourceFieldPath, form]);

    const effectiveMax = useMemo(() => {
        if (isFieldValue && sourceFieldMaxValue && sourceFieldMaxValue > 0) {
            return sourceFieldMaxValue;
        }
        const configMax = repeater.max_instances;
        if (configMax && configMax > 0) {
            return configMax;
        }
        return MAX_REPEAT_INSTANCES_SAFETY;
    }, [isFieldValue, sourceFieldMaxValue, repeater.max_instances]);

    const requiredCount = useMemo(() => {
        if (!isFieldValue) return null;

        const numericValue = Number(sourceFieldValue);

        if (Number.isNaN(numericValue) || numericValue < 0) return 0;

        return Math.min(numericValue, effectiveMax);
    }, [isFieldValue, sourceFieldValue, effectiveMax]);

    const [debouncedRequiredCount, setDebouncedRequiredCount] = useState<number | null>(
        requiredCount
    );
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedRequiredCount(requiredCount), 400);
        return () => clearTimeout(timer);
    }, [requiredCount]);

    useEffect(() => {
        if (!isFieldValue || !sourceFieldPath) return;
        const raw = Number(sourceFieldValue);
        if (!Number.isNaN(raw) && raw > effectiveMax) {
            setFieldValue(sourceFieldPath, effectiveMax);
            message.warning({
                content: `Maximum ${effectiveMax} entries allowed for this section`,
                key: `max-limit-${sectionId}`,
            });
        }
    }, [isFieldValue, sourceFieldPath, sourceFieldValue, effectiveMax, setFieldValue, sectionId]);

    const userMutatedInstancesRef = useRef(false);

    // Optional per-instance title labels from a linked sibling repeater field
    // (repeater.label_field_name) — e.g. "Director 2 - John".
    const labels = useRepeaterLabels(section.repeater, form, instances.length);

    useEffect(() => {
        if (!repeater.enabled) {
            if (instances.length !== 1) setInstances([{ id: uuid(), index: 0 }]);
            return;
        }

        if (isFieldValue) {
            return;
        }

        const sectionData = getIn(values, `pages.${pageId}.${sectionId}`);
        const savedCount =
            sectionData && typeof sectionData === 'object'
                ? Object.keys(sectionData).filter(k => !Number.isNaN(Number(k))).length
                : 0;

        let expectedCount: number;
        if (isFixedCount) {
            expectedCount = repeater.fixed_count || 1;
        } else if (isUserControlled) {
            const minCount = repeater.min_instances || 1;
            expectedCount = userMutatedInstancesRef.current
                ? instances.length
                : Math.max(minCount, savedCount);
        } else {
            expectedCount = 1;
        }

        if (instances.length === expectedCount) return;
        setInstances(Array.from({ length: expectedCount }, (_, i) => ({ id: uuid(), index: i })));
    }, [
        repeater.enabled,
        isFixedCount,
        isUserControlled,
        isFieldValue,
        repeater.source_type,
        repeater.fixed_count,
        repeater.min_instances,
        sectionId,
        pageId,
        values,
        instances.length,
    ]);

    useEffect(() => {
        if (isFieldValue && sourceFieldPath && debouncedRequiredCount !== null) {
            if (instances.length !== debouncedRequiredCount) {
                if (instances.length < debouncedRequiredCount) {
                    const newInstanceIndices = Array.from(
                        { length: debouncedRequiredCount - instances.length },
                        (_, i) => instances.length + i
                    );
                    const newInstances = [
                        ...instances,
                        ...newInstanceIndices.map(index => ({
                            id: uuid(),
                            index,
                        })),
                    ];
                    setInstances(newInstances);

                    newInstanceIndices.forEach(instanceIdx => {
                        initializeInstanceFields(
                            section,
                            form,
                            values,
                            pageId,
                            sectionId,
                            instanceIdx,
                            setFieldValue
                        );
                    });
                } else if (instances.length > debouncedRequiredCount) {
                    const newInstances = instances.slice(0, debouncedRequiredCount);
                    setInstances(newInstances);
                    const indicesToClear = Array.from(
                        { length: instances.length - debouncedRequiredCount },
                        (_, idx) => debouncedRequiredCount + idx
                    );
                    indicesToClear.forEach(i => {
                        const instancePath = `pages.${pageId}.${sectionId}.${i}`;
                        setFieldValue(instancePath, undefined);
                    });
                }
            } else if (instances.length === 0 && debouncedRequiredCount > 0) {
                const newInstances = Array.from({ length: debouncedRequiredCount }, (_, i) => ({
                    id: uuid(),
                    index: i,
                }));
                setInstances(newInstances);

                for (let i = 0; i < debouncedRequiredCount; i += 1) {
                    initializeInstanceFields(
                        section,
                        form,
                        values,
                        pageId,
                        sectionId,
                        i,
                        setFieldValue
                    );
                }
            }
        }
    }, [
        isFieldValue,
        sourceFieldPath,
        debouncedRequiredCount,
        instances.length,
        pageId,
        sectionId,
        setFieldValue,
        instances,
        section,
        form,
        values,
    ]);

    // Atomically swap ALL instances (Formik has no useFieldArray.replace, so we
    // emulate it): write each new instance object wholesale, clear stale
    // overflow indices, and rebuild the parallel instances state. Used by Bulk
    // Import (markTouched: rows validate + flag immediately, like the vendor)
    // and Clear All (untouched: blank rows stay calm).
    const replaceInstances = (
        objects: Array<Record<string, unknown>>,
        opts?: { markTouched?: boolean }
    ) => {
        const sectionPath = `pages.${pageId}.${sectionId}`;
        const oldCount = instances.length;

        objects.forEach((obj, i) => setFieldValue(`${sectionPath}.${i}`, obj));
        for (let i = objects.length; i < oldCount; i += 1) {
            setFieldValue(`${sectionPath}.${i}`, undefined);
        }

        userMutatedInstancesRef.current = true;
        setInstances(objects.map((_, i) => ({ id: uuid(), index: i })));

        if (opts?.markTouched) {
            const instanceTouched: Record<string, true> = {};
            section.fields.forEach(field => {
                instanceTouched[field.name] = true;
            });
            const sectionTouchedPatch: Record<number, Record<string, true>> = {};
            objects.forEach((_, i) => {
                sectionTouchedPatch[i] = instanceTouched;
            });

            setTouched(
                deepMerge(touched, {
                    pages: { [pageId]: { [sectionId]: sectionTouchedPatch } },
                }),
                false
            );
        }

        // Always recompute errors after a bulk swap so stale entries from
        // removed/cleared rows are flushed and imported rows flag immediately
        // (touched-marking above is import-only, so blank rows stay calm).
        setTimeout(() => validateForm(), 0);
    };

    const removeInstance = (indexToRemove: number) => {
        if (!isUserControlled) return;

        const minCount = repeater.min_instances || 1;
        if (instances.length <= minCount) {
            message.warning(`Minimum ${minCount} instances required`);
            return;
        }

        const newInstances = instances.filter((_, idx) => idx !== indexToRemove);
        const reindexedInstances = newInstances.map((inst, idx) => ({
            ...inst,
            index: idx,
        }));

        const sectionPath = `pages.${pageId}.${sectionId}`;

        const indicesToShift = Array.from(
            { length: instances.length - indexToRemove - 1 },
            (_, idx) => indexToRemove + 1 + idx
        );
        indicesToShift.forEach(i => {
            const oldPath = `${sectionPath}.${i}`;
            const newPath = `${sectionPath}.${i - 1}`;
            const oldValue = getNestedValue(values, oldPath);
            if (oldValue) {
                setFieldValue(newPath, oldValue);
            }
        });

        const lastIndex = instances.length - 1;
        setFieldValue(`${sectionPath}.${lastIndex}`, undefined);

        userMutatedInstancesRef.current = true;
        setInstances(reindexedInstances);
    };

    const shouldRenderByCondition = (
        conditional: any | undefined,
        _form: IForm,
        _values: any,
        _pageId: string,
        _sectionId: string
    ) => {
        if (!conditional?.enabled || !conditional.source_field_name) {
            return true;
        }

        const sourceValue = getValueFromComplexPath(
            _form,
            _values,
            conditional.source_field_name,
            _pageId,
            _sectionId
        );
        if (sourceValue === undefined || sourceValue === null) return false;
        if (!conditional.operator) return false;

        return evaluateCondition(sourceValue, conditional.operator, conditional.value);
    };
    const shouldRenderSection = useMemo(
        () => shouldRenderByCondition(section.conditional, form, values, pageId, section._id),
        [section.conditional, values, pageId, section._id, form]
    );

    if (!shouldRenderSection) {
        return null;
    }

    if (isFieldValue && requiredCount === 0) {
        return null;
    }

    const noun =
        (repeater.title_template || 'Item {index}').replace('{index}', '').trim() || 'Item';

    const handleAdd = () => {
        if (!isUserControlled) return;
        const maxCount = repeater.max_instances || Infinity;
        if (instances.length >= maxCount) {
            message.warning(`Maximum ${maxCount} ${noun.toLowerCase()}(s) allowed`);
            return;
        }
        const newIndex = instances.length;
        userMutatedInstancesRef.current = true;
        setInstances([...instances, { id: uuid(), index: newIndex }]);
        initializeInstanceFields(section, form, values, pageId, sectionId, newIndex, setFieldValue);
        snapshotRef.current = null;
        setIsNewDraft(true);
        setMode('add');
        setEditingIndex(newIndex);
    };

    const handleView = (idx: number) => {
        setMode('view');
        setEditingIndex(idx);
    };

    const handleFill = (idx: number) => {
        snapshotRef.current = null;
        setIsNewDraft(false);
        setMode('add');
        setEditingIndex(idx);
    };

    const handleEdit = (idx: number) => {
        const snapshot = getIn(values, `pages.${pageId}.${sectionId}.${idx}`);
        snapshotRef.current = snapshot ? structuredClone(snapshot) : null;
        setMode('edit');
        setEditingIndex(idx);
    };

    const handleSave = async () => {
        if (editingIndex === null) return;

        const instanceTouched: Record<string, true> = {};
        section.fields.forEach(field => {
            instanceTouched[field.name] = true;
        });

        const touchedPatch = {
            pages: {
                [pageId]: {
                    [sectionId]: {
                        [editingIndex]: instanceTouched,
                    },
                },
            },
        };

        // Touch all fields first so errors render immediately when validateForm updates errors state
        setTouched(deepMerge(touched, touchedPatch), false);

        const latestErrors = await validateForm();

        const instanceErrors = getIn(latestErrors, `pages.${pageId}.${sectionId}.${editingIndex}`);
        // Only block saving the row on VISIBLE field errors. Hidden fields carry
        // cross-instance state (e.g. a totals sentinel that only passes once
        // every row is filled) and must not block saving one row.
        const visibleFieldNames = new Set(
            section.fields.filter(f => !f.view?.is_hidden).map(f => f.name)
        );
        const hasVisibleError =
            instanceErrors &&
            typeof instanceErrors === 'object' &&
            Object.keys(instanceErrors).some(k => visibleFieldNames.has(k));
        if (hasVisibleError) {
            return;
        }

        setIsNewDraft(false);
        setEditingIndex(null);
        snapshotRef.current = null;
    };

    const handleCancel = () => {
        if (editingIndex === null) {
            return;
        }
        if (isNewDraft) {
            // Drop the freshly-appended draft instance + its Formik subtree
            const newInstances = instances.filter(i => i.index !== editingIndex);
            setInstances(newInstances);
            setFieldValue(`pages.${pageId}.${sectionId}.${editingIndex}`, undefined);
        } else if (snapshotRef.current !== null) {
            setFieldValue(
                `pages.${pageId}.${sectionId}.${editingIndex}`,
                snapshotRef.current,
                false
            );
        }
        snapshotRef.current = null;
        setIsNewDraft(false);
        setEditingIndex(null);
    };

    const minInstances = repeater.min_instances || 0;
    const canDelete = isUserControlled && instances.length > minInstances;

    // "Clear All": swap every instance for blanks at the section's natural
    // count (fixed count / minimum / current for field_value-driven).
    const handleClearAll = () => {
        let count = instances.length;
        if (isFixedCount) count = repeater.fixed_count || 1;
        else if (isUserControlled) count = repeater.min_instances || 1;
        replaceInstances(Array.from({ length: count }, () => buildBlankInstance(section)));
    };

    return (
        <Flex vertical gap={15} id={`section-${section._id}`}>
            <Flex justify="space-between" align="center" gap={10} wrap="wrap">
                <Flex vertical>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                        {section.title}
                    </Typography.Title>
                    {section.description && (
                        <Typography.Text type="secondary">{section.description}</Typography.Text>
                    )}
                </Flex>
                <Flex gap={8} wrap="wrap">
                    <RepeaterClearButton
                        section={section}
                        pageId={pageId}
                        sectionId={sectionId}
                        instanceCount={instances.length}
                        noun={noun}
                        onClear={handleClearAll}
                    />
                    <RepeaterImport
                        section={section}
                        form={form}
                        pageId={pageId}
                        sectionId={sectionId}
                        noun={noun}
                        instanceCount={instances.length}
                        onReplace={objects => replaceInstances(objects, { markTouched: true })}
                        onDriverWrite={
                            isFieldValue && sourceFieldPath
                                ? count => setFieldValue(sourceFieldPath, count)
                                : undefined
                        }
                    />
                    {isUserControlled && (
                        <Button
                            type="default"
                            danger
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            disabled={instances.length >= (repeater.max_instances || Infinity)}
                        >
                            Add {noun}
                        </Button>
                    )}
                </Flex>
            </Flex>

            <RepeaterSummary
                pageId={pageId}
                sectionId={sectionId}
                section={section}
                noun={noun}
                instances={instances}
                labels={labels}
                hiddenIndex={isOpen && isNewDraft ? editingIndex : null}
                canDelete={canDelete}
                onView={handleView}
                onFill={handleFill}
                onEdit={handleEdit}
                onDelete={removeInstance}
            />

            {isOpen && editingIndex !== null && mode === 'view' && (
                <RepeaterViewModal
                    open
                    noun={noun}
                    section={section}
                    pageId={pageId}
                    sectionId={sectionId}
                    instanceIdx={editingIndex}
                    onClose={handleCancel}
                />
            )}

            {isOpen && editingIndex !== null && mode !== 'view' && (
                <RepeaterItemModal
                    open
                    mode={mode}
                    noun={noun}
                    label={labels[editingIndex]}
                    section={section}
                    pageId={pageId}
                    sectionId={sectionId}
                    instanceIdx={editingIndex}
                    form={form}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            {typeof sectionError === 'string' && sectionTouched && (
                <Alert
                    type="error"
                    showIcon
                    message="Please correct the below error"
                    description={sectionError}
                    className="mt-3"
                />
            )}
        </Flex>
    );
}
