import { v4 as uuid } from 'uuid';

import { IForm, SubmissionMeta } from '../types/forms';

export const objectToFormData = (obj: any, formData = new FormData(), parentKey = '') => {
    if (obj === null || obj === undefined) return formData;

    // Handle FileList objects
    if (obj instanceof FileList) {
        Array.from(obj).forEach(file => {
            formData.append(parentKey, file);
        });

        return formData;
    }

    // Handle File objects
    if (obj instanceof File) {
        formData.append(parentKey, obj);

        return formData;
    }

    if (typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
            const formKey = parentKey ? `${parentKey}[${key}]` : key;

            if (value instanceof FileList) {
                Array.from(value).forEach(file => {
                    formData.append(formKey, file);
                });
            } else if (value instanceof File) {
                formData.append(formKey, value);
            } else if (value instanceof Date) {
                formData.append(formKey, value.toISOString());
            } else if (Array.isArray(value)) {
                value.forEach((v, i) => {
                    objectToFormData(v, formData, `${formKey}[${i}]`);
                });
            } else if (typeof value === 'object' && value !== null) {
                objectToFormData(value, formData, formKey);
            } else if (value !== undefined && value !== null) {
                formData.append(formKey, String(value));
            }
        });
    } else {
        formData.append(parentKey, String(obj));
    }

    return formData;
};

/**
 * Transforms form values to submission payload matching base64 structure
 * Handles repeatable sections with instances array, each instance having id and fields
 */
export const transformToSubmissionPayload = (
    formSchema: IForm,
    values: any,
    meta: SubmissionMeta
) => {
    const pages = formSchema.pages.map(page => {
        const sections = page.sections.map(section => {
            const sectionData = values.pages?.[page._id]?.[section._id];
            // Custom sections (e.g. shareholding_pattern) can manage multiple
            // instances themselves, storing numeric-keyed groups without the
            // section being served as a repeater — walk those as instances so
            // shareholders beyond the first are not dropped from the payload.
            const hasNumericGroups =
                section.section_type === 'custom' &&
                sectionData &&
                typeof sectionData === 'object' &&
                Object.keys(sectionData).some(key => !Number.isNaN(Number(key)));
            const isRepeatable = section.repeater?.enabled || hasNumericGroups;

            if (isRepeatable) {
                // For repeatable sections, collect all instances
                const instances: Array<{
                    id: string;
                    fields: Array<{ field: string; name: string; value: any }>;
                }> = [];

                if (sectionData && typeof sectionData === 'object') {
                    // Get all numeric keys (instance indices)
                    const instanceIndices = Object.keys(sectionData)
                        .filter(key => !Number.isNaN(Number(key)))
                        .map(key => Number(key))
                        .sort((a, b) => a - b); // Sort to maintain order

                    // Create an instance for each index that exists in form values
                    instanceIndices.forEach(instanceIdx => {
                        const instanceData = sectionData[instanceIdx];

                        // Create instance even if empty (matches base64 behavior)
                        const fields = section.fields.map(field => {
                            const fieldValue = instanceData?.[field.name];

                            // Handle different value types
                            let processedValue: any = fieldValue;

                            if (field.type === 'nested_select') {
                                processedValue = Array.isArray(fieldValue)
                                    ? fieldValue.map(v =>
                                          Array.isArray(v) ? v.map(String) : String(v)
                                      )
                                    : [];
                            } else if (
                                // Select and checkbox_group fields should always be arrays
                                field.type === 'select' ||
                                field.type === 'checkbox_group'
                            ) {
                                if (Array.isArray(fieldValue)) {
                                    processedValue = fieldValue.map(v => String(v));
                                } else if (
                                    fieldValue !== null &&
                                    fieldValue !== undefined &&
                                    fieldValue !== ''
                                ) {
                                    processedValue = [String(fieldValue)];
                                } else {
                                    processedValue = [];
                                }
                            } else if (fieldValue instanceof File) {
                                // File will be handled by objectToFormData
                                processedValue = fieldValue;
                            } else if (fieldValue instanceof Date) {
                                processedValue = fieldValue.toISOString();
                            } else if (
                                (field.type === 'file' || field.type === 'image') &&
                                fieldValue &&
                                typeof fieldValue === 'object'
                            ) {
                                processedValue = fieldValue;
                            } else if (fieldValue === null || fieldValue === undefined) {
                                processedValue = null;
                            } else {
                                processedValue = String(fieldValue);
                            }

                            return {
                                field: field._id,
                                name: field.name,
                                value: processedValue,
                            };
                        });

                        instances.push({
                            id: uuid(),
                            fields,
                        });
                    });
                }

                // If no instances found but section has min_instances, create empty instances
                if (instances.length === 0 && section.repeater?.min_instances) {
                    const minInstances = section.repeater.min_instances;
                    for (let i = 0; i < minInstances; i += 1) {
                        instances.push({
                            id: uuid(),
                            fields: section.fields.map(field => ({
                                field: field._id,
                                name: field.name,
                                value: null,
                            })),
                        });
                    }
                }

                return {
                    section: section._id,
                    instances,
                };
            }
            // Non-repeatable section - single instance
            const fields = section.fields.map(field => {
                const fieldValue = values.pages?.[page._id]?.[section._id]?.[field.name];

                // Handle different value types
                let processedValue: any = fieldValue;

                if (field.type === 'nested_select') {
                    processedValue = Array.isArray(fieldValue)
                        ? fieldValue.map(v => (Array.isArray(v) ? v.map(String) : String(v)))
                        : [];
                } else if (field.type === 'select' || field.type === 'checkbox_group') {
                    if (Array.isArray(fieldValue)) {
                        processedValue = fieldValue.map(v => String(v));
                    } else if (
                        fieldValue !== null &&
                        fieldValue !== undefined &&
                        fieldValue !== ''
                    ) {
                        processedValue = [String(fieldValue)];
                    } else {
                        processedValue = [];
                    }
                } else if (fieldValue instanceof File) {
                    processedValue = fieldValue;
                } else if (fieldValue instanceof Date) {
                    processedValue = fieldValue.toISOString();
                } else if (
                    (field.type === 'file' || field.type === 'image') &&
                    fieldValue &&
                    typeof fieldValue === 'object'
                ) {
                    processedValue = fieldValue;
                } else if (fieldValue === null || fieldValue === undefined) {
                    processedValue = null;
                } else {
                    processedValue = String(fieldValue);
                }

                return {
                    field: field._id,
                    name: field.name,
                    value: processedValue,
                };
            });

            return {
                section: section._id,
                instances: [
                    {
                        id: uuid(),
                        fields,
                    },
                ],
            };
        });

        return {
            page: page._id,
            sections,
        };
    });

    return {
        form: formSchema._id,
        quote_config: JSON.stringify(meta.quoteConfig ?? meta.metrics),
        pricing: meta.pricingId,
        country: meta.countryData.country,
        freezone: meta.countryData.freezone,
        type: meta.countryData.type,
        status: meta.status,
        reference_id: meta.reference_id,
        pages,
    };
};
