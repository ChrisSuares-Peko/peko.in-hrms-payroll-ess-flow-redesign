// import { v4 as uuid } from 'uuid';

// import { IForm } from '../../globalBusinessSetup/types/forms';

// const defaultFieldValue = (fieldType: string, value?: any) => {
//     switch (fieldType) {
//         case 'text':
//         case 'textarea':
//         case 'email':
//         case 'radio':
//             return value ?? '';
//         case 'phone':
//             return value ?? '+971';
//         case 'number':
//             return value ?? undefined;
//         case 'select':
//             return value ?? [];
//         case 'checkbox':
//             return value ?? false;
//         case 'date':
//         case 'file':
//         case 'image':
//         default:
//             return value ?? null;
//     }
// };

// const getArrLen = (section: IForm['pages'][0]['sections'][0], len: number) => {
//     let count = len;

//     if (section.repeater?.enabled) {
//         if (section.repeater.source_type === 'fixed_count') {
//             count = section.repeater.fixed_count || 0;
//         } else if (section.repeater.source_type === 'user_controlled') {
//             count = section.repeater.min_instances || 0;
//         }
//     }

//     return count;
// };

// export const generateDefaultValues = (form: IForm, formData: any) => {
//     const defaultValues: any = {
//         pages: [],
//     };

//     if (form.pages) {
//         defaultValues.pages = form.pages.map(page => {
//             const pageData = formData?.pages?.find((p: { page: string }) => p.page === page._id);

//             return {
//                 page: page._id,
//                 sections: page.sections.map(section => {
//                     const sectionData = pageData?.sections?.find(
//                         (s: { section: string }) => s.section === section._id
//                     );

//                     const dataInstances = sectionData?.instances || [];
//                     const instanceCount = section.repeater?.enabled
//                         ? getArrLen(section, dataInstances.length)
//                         : 1;
//                     const instances = [];

//                     for (let i = 0; i < instanceCount; i += 1) {
//                         const instanceData = dataInstances[i];

//                         instances.push({
//                             id: uuid(),
//                             fields: section.fields.map(field => {
//                                 const valueField = instanceData?.fields?.find(
//                                     (f: { field: string }) => f.field === field._id
//                                 );

//                                 return {
//                                     field: field._id,
//                                     name: field.name,
//                                     value: defaultFieldValue(field.type, valueField?.value),
//                                 };
//                             }),
//                         });
//                     }

//                     return {
//                         section: section._id,
//                         instances,
//                     };
//                 }),
//             };
//         });
//     }

//     return defaultValues;
// };

import dayjs from 'dayjs';

import { IForm } from '../types/forms';

const getDefaultValue = (fieldType: string, value?: any) => {
    switch (fieldType) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'radio':
            return '';
        case 'phone':
            return '';
        case 'number':
        case 'currency':
            return undefined;
        case 'select':
            return '';
        case 'checkbox':
            return false;
        case 'nested_select':
            return [];
        case 'date':
        case 'file':
        case 'image':
        default:
            return '';
    }
};

const resolveInitialValue = (field: any, existingValue?: any) => {
    if (field?.type === 'checkbox') {
        if (existingValue !== undefined && existingValue !== null) {
            return (
                existingValue === true ||
                existingValue === 'true' ||
                existingValue === 1 ||
                existingValue === '1'
            );
        }
        // Apply default_value when no saved value exists
        if (field.default_value !== undefined) {
            return field.default_value === true || field.default_value === 'true';
        }
        return false;
    }

    const isEmpty = existingValue === undefined || existingValue === null || existingValue === '';

    // ✅ Redux value
    if (!isEmpty) {
        return existingValue;
    }
    if (field.type === 'select' && field.allow_multiple) {
        return [];
    }
    // ✅ Radio default fallback
    if (field.type === 'radio') {
        return field.default_value ?? field.options?.[0]?.value ?? '';
    }

    return getDefaultValue(field.type, existingValue);
};

const getInitialInstanceCount = (
    section: IForm['pages'][0]['sections'][0],
    existingInstances: any
): number => {
    if (!section.repeater?.enabled) {
        return 1;
    }

    const { source_type, fixed_count, min_instances } = section.repeater;

    if (source_type === 'fixed_count') {
        return fixed_count || 0;
    }

    if (source_type === 'user_controlled') {
        const existingCount =
            existingInstances && typeof existingInstances === 'object'
                ? Object.keys(existingInstances).filter(key => !Number.isNaN(Number(key))).length
                : 0;
        return Math.max(min_instances || 0, existingCount);
    }
    if (existingInstances && typeof existingInstances === 'object') {
        return Object.keys(existingInstances).filter(key => !Number.isNaN(Number(key))).length;
    }

    return 0;
};

const normalizeFieldValue = (value: any, field?: any): any => {
    if (value === null || value === undefined) return value;

    if (field?.type === 'checkbox') {
        return value === true || value === 'true' || value === 1 || value === '1';
    }

    if (field?.type === 'select') {
        if (field.allow_multiple) {
            return Array.isArray(value) ? value : [];
        }

        if (Array.isArray(value)) {
            return value.length > 0 ? String(value[0]) : '';
        }

        return value ?? '';
    }

    return value;
};

const transformNewFormatToOldFormat = (newFormatData: any, formSchema: IForm): any => {
    if (!newFormatData || !newFormatData.pages || !Array.isArray(newFormatData.pages)) {
        return newFormatData;
    }

    const transformed: any = { pages: {} };

    newFormatData.pages.forEach((pageData: any, pageIndex: number) => {
        const pageId = pageData.page;
        if (!pageId) return;
        // const formPage = formSchema.pages.find(p => p._id === pageId);
        // if (!formPage) {
        //     console.warn("❌ Page not found in schema:", pageId);
        //     return;
        //   }
        const formPage = formSchema?.pages[pageIndex];
        // if (!formPage) return;
        if (!formPage) {
            console.warn('❌ Page not found in schema:', pageId);
            return;
        }
        transformed.pages[pageId] = {};

        if (pageData.sections && Array.isArray(pageData.sections)) {
            pageData.sections.forEach((sectionData: any, sectionIndex: number) => {
                const sectionId = sectionData.section;
                if (!sectionId) return;

                // const formSection = formPage.sections.find(s => s._id === sectionId);
                const formSection = formPage.sections[sectionIndex];

                // Custom sections can save multiple self-managed instances
                // without being served as repeaters (e.g. shareholding_pattern)
                // — hydrate those as numeric-keyed groups so shareholders
                // beyond the first survive a draft continue.
                const isRepeatable =
                    formSection?.repeater?.enabled ||
                    (formSection?.section_type === 'custom' &&
                        (sectionData.instances?.length ?? 0) > 1);

                // Vendor's saved-application API returns each field as
                // `{ field: <fieldId>, value: ..., _id: ... }` — no `name`
                // property. Look up the schema field by `_id` to recover
                // the name + type used by the renderer/Formik state.
                const resolveField = (fieldData: any) => {
                    if (!fieldData) return { fieldName: undefined, formField: undefined };
                    const formField =
                        (fieldData.field &&
                            formSection?.fields.find(f => f._id === fieldData.field)) ||
                        (fieldData.name &&
                            formSection?.fields.find(f => f.name === fieldData.name));
                    return {
                        fieldName: formField?.name || fieldData.name,
                        formField,
                    };
                };

                if (sectionData.instances && Array.isArray(sectionData.instances)) {
                    if (isRepeatable) {
                        transformed.pages[pageId][sectionId] = {};

                        sectionData.instances.forEach((instance: any, instanceIndex: number) => {
                            transformed.pages[pageId][sectionId][instanceIndex] = {};

                            if (instance.fields && Array.isArray(instance.fields)) {
                                instance.fields.forEach((fieldData: any) => {
                                    const { fieldName, formField } = resolveField(fieldData);
                                    if (fieldName) {
                                        transformed.pages[pageId][sectionId][instanceIndex][
                                            fieldName
                                        ] = normalizeFieldValue(fieldData.value, formField);
                                    }
                                });
                            }
                        });
                    } else {
                        transformed.pages[pageId][sectionId] = {};

                        if (sectionData.instances.length > 0) {
                            const firstInstance = sectionData.instances[0];
                            if (firstInstance.fields && Array.isArray(firstInstance.fields)) {
                                firstInstance.fields.forEach((fieldData: any) => {
                                    const { fieldName, formField } = resolveField(fieldData);
                                    if (fieldName) {
                                        transformed.pages[pageId][sectionId][fieldName] =
                                            normalizeFieldValue(fieldData.value, formField);
                                    }
                                });
                            }
                        }
                    }
                } else {
                    transformed.pages[pageId][sectionId] = {};
                }
            });
        }
    });

    return transformed;
};

export const generateInitialValues = (form: IForm, reduxValues: any) => {
    const normalizedReduxValues = transformNewFormatToOldFormat(reduxValues, form);
    console.log(normalizedReduxValues);
    const values: any = { pages: {} };

    form?.pages.forEach(page => {
        values.pages[page._id] = {};

        page.sections.forEach(section => {
            const isRepeatable = section.repeater?.enabled;
            // const existingSectionData = normalizedReduxValues?.pages?.[page._id]?.[section._id];
            const pageIndex = form.pages.findIndex(p => p._id === page._id);

            const existingPageData =
                normalizedReduxValues?.pages?.[page._id] ||
                Object.values(normalizedReduxValues?.pages || {})[pageIndex];

            const existingSectionData =
                existingPageData?.[section._id] ||
                Object.values(existingPageData || {})[
                    page.sections.findIndex(s => s._id === section._id)
                ];

            if (isRepeatable) {
                values.pages[page._id][section._id] = {};

                const instanceCount = getInitialInstanceCount(section, existingSectionData);

                for (let i = 0; i < instanceCount; i += 1) {
                    values.pages[page._id][section._id][i] = {};

                    section.fields.forEach(field => {
                        const existingValue = existingSectionData?.[i]?.[field.name];

                        if (field.type === 'date' && !existingValue) {
                            if (field.default_value) {
                                try {
                                    values.pages[page._id][section._id][i][field.name] = dayjs(
                                        field.default_value
                                    ).format('YYYY-MM-DD');
                                } catch {
                                    values.pages[page._id][section._id][i][field.name] = '';
                                }
                            } else {
                                values.pages[page._id][section._id][i][field.name] =
                                    resolveInitialValue(field);
                            }
                        } else {
                            values.pages[page._id][section._id][i][field.name] =
                                resolveInitialValue(field, existingValue);
                        }
                    });
                }

                if (
                    section.repeater.source_type === 'field_value' &&
                    existingSectionData &&
                    typeof existingSectionData === 'object'
                ) {
                    const existingIndices = Object.keys(existingSectionData)
                        .filter(key => !Number.isNaN(Number(key)))
                        .map(key => Number(key))
                        .filter(idx => idx >= instanceCount);

                    existingIndices.forEach(instanceIdx => {
                        values.pages[page._id][section._id][instanceIdx] = {};
                        section.fields.forEach(field => {
                            const existingValue = existingSectionData[instanceIdx]?.[field.name];
                            if (field.type === 'date' && !existingValue && field.default_value) {
                                try {
                                    values.pages[page._id][section._id][instanceIdx][field.name] =
                                        dayjs(field.default_value).format('YYYY-MM-DD');
                                } catch {
                                    values.pages[page._id][section._id][instanceIdx][field.name] =
                                        resolveInitialValue(field);
                                }
                            } else {
                                values.pages[page._id][section._id][instanceIdx][field.name] =
                                    resolveInitialValue(field, existingValue);
                            }
                        });
                    });
                }
            } else {
                values.pages[page._id][section._id] = {};

                section.fields.forEach(field => {
                    // const reduxValue =
                    //     normalizedReduxValues?.pages?.[page._id]?.[section._id]?.[field.name];
                    const reduxValue = existingSectionData?.[field.name];

                    if (field.type === 'date' && !reduxValue) {
                        if (field.default_value) {
                            try {
                                values.pages[page._id][section._id][field.name] = dayjs(
                                    field.default_value
                                ).format('YYYY-MM-DD');
                            } catch {
                                values.pages[page._id][section._id][field.name] =
                                    resolveInitialValue(field.type);
                            }
                        } else {
                            values.pages[page._id][section._id][field.name] = resolveInitialValue(
                                field.type
                            );
                        }
                    } else {
                        values.pages[page._id][section._id][field.name] = resolveInitialValue(
                            field,
                            reduxValue
                        );
                    }
                });

                // Custom sections may carry self-managed numeric-keyed instance
                // groups (e.g. shareholding_pattern shareholders) alongside the
                // flat field values — carry them over so a continued draft
                // restores every instance, not just the flat mirror.
                if (
                    section.section_type === 'custom' &&
                    existingSectionData &&
                    typeof existingSectionData === 'object'
                ) {
                    Object.keys(existingSectionData)
                        .filter(key => !Number.isNaN(Number(key)))
                        .forEach(key => {
                            values.pages[page._id][section._id][key] = existingSectionData[key];
                        });
                }
            }
        });
    });

    return values;
};
