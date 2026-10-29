import { useFormikContext } from 'formik';

export type FormValuesMap = {
    byName: Record<string, unknown>;
    allByName: Record<string, unknown[]>;
    get: (name: string, fallback?: unknown) => unknown;
};

const isEmpty = (v: unknown) =>
    v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

export function buildFormValuesMap(
    pages: Record<string, Record<string, unknown>> = {}
): FormValuesMap {
    const byName: Record<string, unknown> = {};
    const allByName: Record<string, unknown[]> = {};

    const addValue = (fieldName: string, value: unknown) => {
        if (!allByName[fieldName]) allByName[fieldName] = [];
        allByName[fieldName].push(value);
        if (byName[fieldName] === undefined && !isEmpty(value)) byName[fieldName] = value;
    };

    Object.values(pages).forEach(pageData => {
        if (!pageData || typeof pageData !== 'object') return;
        Object.values(pageData as Record<string, unknown>).forEach(sectionValues => {
            if (!sectionValues || typeof sectionValues !== 'object') return;
            const sectionObj = sectionValues as Record<string, unknown>;
            const keys = Object.keys(sectionObj);
            // Check if this is a repeatable section (all numeric keys)
            const isRepeatable = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
            if (isRepeatable) {
                keys.forEach(idx => {
                    const instance = sectionObj[idx];
                    if (instance && typeof instance === 'object') {
                        Object.entries(instance as Record<string, unknown>).forEach(
                            ([name, val]) => {
                                addValue(name, val);
                            }
                        );
                    }
                });
            } else {
                keys.forEach(fieldName => {
                    addValue(fieldName, sectionObj[fieldName]);
                });
            }
        });
    });

    const get = (name: string, fallback?: unknown) =>
        byName[name] !== undefined ? byName[name] : fallback;

    return { byName, allByName, get };
}

export function useFormValues(): FormValuesMap {
    const { values } = useFormikContext<any>();
    return buildFormValuesMap(values?.pages ?? {});
}
