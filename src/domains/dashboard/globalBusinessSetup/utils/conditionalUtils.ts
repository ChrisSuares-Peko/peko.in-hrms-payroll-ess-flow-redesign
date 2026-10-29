import { ComparisonOperator, ConditionalOperator } from '../types/forms';

export function evaluateCondition(
    sourceValue: any,
    operator: ConditionalOperator | ComparisonOperator,
    targetValue: any
): boolean {
    // Array sources compare by membership (equals/contains) or by length
    // (numeric operators), mirroring the vendor's evaluateCondition.
    if (Array.isArray(sourceValue)) {
        switch (operator) {
            case 'equals':
            case 'contains':
                return sourceValue.includes(targetValue);
            case 'not_equals':
            case 'not_contains':
                return !sourceValue.includes(targetValue);
            case 'in': {
                const inVals = String(targetValue)
                    .split(',')
                    .map((v: string) => v.trim());

                return sourceValue.some((v: any) => inVals.includes(String(v)));
            }
            case 'not_in': {
                const notInVals = String(targetValue)
                    .split(',')
                    .map((v: string) => v.trim());

                return !sourceValue.some((v: any) => notInVals.includes(String(v)));
            }
            case 'greater_than':
                return sourceValue.length > Number(targetValue);
            case 'less_than':
                return sourceValue.length < Number(targetValue);
            case 'greater_than_equals':
                return sourceValue.length >= Number(targetValue);
            case 'less_than_equals':
                return sourceValue.length <= Number(targetValue);
            default:
                return false;
        }
    }

    switch (operator) {
        case 'equals':
            if (typeof sourceValue === 'boolean') {
                return sourceValue === (targetValue === 'true');
            }

            return sourceValue === targetValue;

        case 'not_equals':
            return sourceValue !== targetValue;

        case 'greater_than':
            return Number(sourceValue) > Number(targetValue);

        case 'less_than':
            return Number(sourceValue) < Number(targetValue);

        case 'greater_than_equals':
            return Number(sourceValue) >= Number(targetValue);

        case 'less_than_equals':
            return Number(sourceValue) <= Number(targetValue);

        case 'contains':
            return String(sourceValue).includes(String(targetValue));

        case 'not_contains':
            return !String(sourceValue).includes(String(targetValue));

        case 'in': {
            const values = String(targetValue)
                .split(',')
                .map((v: string) => v.trim());

            return values.includes(String(sourceValue));
        }
        case 'not_in': {
            const notValues = String(targetValue)
                .split(',')
                .map((v: string) => v.trim());

            return !notValues.includes(String(sourceValue));
        }
        default:
            return false;
    }
}

export function getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((current, key) => {
        if (current && typeof current === 'object') {
            return current[key];
        }
        return undefined;
    }, obj);
}

export function resolveFieldPath(
    formData: any,
    sourceFieldName: string,
    currentPageId: string,
    currentSectionId?: string,
    instanceIdx?: number
): string | null {
    if (currentSectionId) {
        const currentPath =
            typeof instanceIdx === 'number'
                ? `pages.${currentPageId}.${currentSectionId}.${instanceIdx}.${sourceFieldName}`
                : `pages.${currentPageId}.${currentSectionId}.${sourceFieldName}`;
        const value = getNestedValue(formData, currentPath);
        if (value !== undefined) {
            return currentPath;
        }
    }

    if (formData?.pages) {
        const pageIds = Object.keys(formData.pages);
        const foundPage = pageIds.find(pageId => {
            const page = formData.pages[pageId];
            if (page && typeof page === 'object') {
                const sectionIds = Object.keys(page);
                const foundSection = sectionIds.find(sectionId => {
                    const section = page[sectionId];
                    return (
                        section &&
                        typeof section === 'object' &&
                        section[sourceFieldName] !== undefined
                    );
                });
                if (foundSection) {
                    return true;
                }
            }
            return false;
        });

        if (foundPage) {
            const page = formData.pages[foundPage];
            const sectionIds = Object.keys(page);
            const foundSectionId = sectionIds.find(sectionId => {
                const section = page[sectionId];
                if (section && typeof section === 'object') {
                    const numericKeys = Object.keys(section).filter(
                        key => !Number.isNaN(Number(key))
                    );
                    if (numericKeys.length > 0) {
                        return section[0]?.[sourceFieldName] !== undefined;
                    }
                    return section[sourceFieldName] !== undefined;
                }
                return false;
            });
            if (foundSectionId) {
                const foundSection = page[foundSectionId];
                const numericKeys = Object.keys(foundSection).filter(
                    key => !Number.isNaN(Number(key))
                );
                if (numericKeys.length > 0) {
                    return `pages.${foundPage}.${foundSectionId}.0.${sourceFieldName}`;
                }
                return `pages.${foundPage}.${foundSectionId}.${sourceFieldName}`;
            }
        }
    }

    return null;
}
