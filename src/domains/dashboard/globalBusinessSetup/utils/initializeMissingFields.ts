import dayjs from 'dayjs';

import { getNestedValue, evaluateCondition } from './conditionalUtils';
import { getValueFromComplexPath } from './pathResolver';
import { getDefaultValue } from '../components/DynamicForm/utils/fieldDefaults';
import { IForm } from '../types/forms';

const resolveDefault = (field: IForm['pages'][0]['sections'][0]['fields'][0]) => {
    if (field.type === 'date' && field.default_value) {
        const parsed = dayjs(field.default_value);
        if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
    }
    return getDefaultValue(field.type);
};

const shouldRenderSection = (
    section: IForm['pages'][0]['sections'][0],
    form: IForm,
    values: any,
    pageId: string
): boolean => {
    if (!section.conditional?.enabled || !section.conditional.source_field_name) {
        return true;
    }

    const sourceValue = getValueFromComplexPath(
        form,
        values,
        section.conditional.source_field_name,
        pageId,
        section._id
    );

    if (sourceValue === undefined || sourceValue === null) {
        return false;
    }

    if (!section.conditional.operator) {
        return false;
    }

    return evaluateCondition(sourceValue, section.conditional.operator, section.conditional.value);
};

const shouldRenderField = (
    field: IForm['pages'][0]['sections'][0]['fields'][0],
    form: IForm,
    values: any,
    pageId: string,
    sectionId: string,
    instanceIdx?: number
): boolean => {
    if (!field.conditional?.enabled || !field.conditional.source_field_name) {
        return true;
    }

    const sourceValue = getValueFromComplexPath(
        form,
        values,
        field.conditional.source_field_name,
        pageId,
        sectionId,
        instanceIdx
    );

    if (sourceValue === undefined || sourceValue === null) {
        return false;
    }

    if (!field.conditional.operator) {
        return false;
    }

    return evaluateCondition(sourceValue, field.conditional.operator, field.conditional.value);
};

export const initializeMissingFields = (
    form: IForm,
    values: any,
    setFieldValue: (field: string, value: any) => void
): void => {
    form.pages.forEach(page => {
        if (!values.pages?.[page._id]) {
            return;
        }

        page.sections.forEach(section => {
            if (!shouldRenderSection(section, form, values, page._id)) {
                return;
            }

            const isRepeatable = section.repeater?.enabled;

            if (isRepeatable) {
                const sectionValues = getNestedValue(values, `pages.${page._id}.${section._id}`);

                if (sectionValues && typeof sectionValues === 'object') {
                    const instanceIndices = Object.keys(sectionValues)
                        .filter(key => !Number.isNaN(Number(key)))
                        .map(key => Number(key))
                        .sort((a, b) => a - b);

                    instanceIndices.forEach(instanceIdx => {
                        section.fields.forEach(field => {
                            if (
                                !shouldRenderField(
                                    field,
                                    form,
                                    values,
                                    page._id,
                                    section._id,
                                    instanceIdx
                                )
                            ) {
                                return;
                            }

                            const fieldPath = `pages.${page._id}.${section._id}.${instanceIdx}.${field.name}`;
                            const currentValue = getNestedValue(values, fieldPath);

                            if (currentValue === undefined) {
                                setFieldValue(fieldPath, resolveDefault(field));
                            }
                        });
                    });
                } else {
                    const minInstances = section.repeater?.min_instances || 0;
                    if (minInstances > 0) {
                        for (let i = 0; i < minInstances; i += 1) {
                            section.fields.forEach(field => {
                                if (
                                    !shouldRenderField(
                                        field,
                                        form,
                                        values,
                                        page._id,
                                        section._id,
                                        i
                                    )
                                ) {
                                    return;
                                }

                                const fieldPath = `pages.${page._id}.${section._id}.${i}.${field.name}`;
                                const currentValue = getNestedValue(values, fieldPath);

                                if (currentValue === undefined) {
                                    setFieldValue(fieldPath, resolveDefault(field));
                                }
                            });
                        }
                    }
                }
            } else {
                section.fields.forEach(field => {
                    if (!shouldRenderField(field, form, values, page._id, section._id)) {
                        return;
                    }

                    const fieldPath = `pages.${page._id}.${section._id}.${field.name}`;
                    const currentValue = getNestedValue(values, fieldPath);

                    if (currentValue === undefined) {
                        setFieldValue(fieldPath, resolveDefault(field));
                    }
                });
            }
        });
    });
};
