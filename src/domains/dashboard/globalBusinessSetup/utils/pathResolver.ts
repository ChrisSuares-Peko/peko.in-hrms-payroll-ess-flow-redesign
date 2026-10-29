import { evaluateCondition, getNestedValue } from './conditionalUtils';
import { IForm } from '../types/forms';

/**
 * Parses a complex path like "pages.1.sections.0.instances.0.fields.0.value"
 * and converts it to our ID-based structure
 */
export function resolveComplexPath(
    form: IForm,
    complexPath: string,
    currentPageId: string,
    currentSectionId?: string,
    currentInstanceIdx?: number
): string | null {
    if (!complexPath) return null;

    // If it's already in our format (starts with pages.{id} where id is not numeric), return as is
    if (complexPath.startsWith('pages.') && !complexPath.match(/pages\.\d+\./)) {
        return complexPath;
    }

    // Check if it's a simple field name (no dots or just field name)
    if (!complexPath.includes('pages.')) {
        // Simple field name - try to find in current section or search
        if (currentSectionId) {
            return `pages.${currentPageId}.${currentSectionId}.${complexPath}`;
        }
        return null;
    }

    // Parse the complex path format: pages.{pageIndex}.sections.{sectionIndex}.instances.{instanceIndex}.fields.{fieldIndex}.value
    const parts = complexPath.split('.');

    // Must have at least: pages, pageIndex, sections, sectionIndex
    if (parts.length < 4 || parts[0] !== 'pages' || parts[2] !== 'sections') {
        return null;
    }

    try {
        const pageIndex = parseInt(parts[1], 10);

        // Validate page index
        if (Number.isNaN(pageIndex) || pageIndex < 0 || pageIndex >= form.pages.length) {
            return null;
        }

        const page = form.pages[pageIndex];
        const sectionIndex = parseInt(parts[3], 10);

        // Validate section index
        if (
            Number.isNaN(sectionIndex) ||
            sectionIndex < 0 ||
            sectionIndex >= page.sections.length
        ) {
            return null;
        }

        const section = page.sections[sectionIndex];

        // Check if path includes instances (repeatable section)
        const instancesIndex = parts.indexOf('instances');
        const fieldsIndex = parts.indexOf('fields');

        if (instancesIndex >= 0 && fieldsIndex >= 0) {
            // Path includes instances: pages.X.sections.Y.instances.Z.fields.W.value
            const fieldIndex = parseInt(parts[fieldsIndex + 1], 10);

            if (
                !Number.isNaN(fieldIndex) &&
                fieldIndex >= 0 &&
                fieldIndex < section.fields.length
            ) {
                const field = section.fields[fieldIndex];
                // Check if the source section is repeatable
                if (section.repeater?.enabled) {
                    // If source is within the same repeater section, use the current instance index
                    // so intra-repeater conditionals read from the correct instance
                    const instanceIdx =
                        section._id === currentSectionId && currentInstanceIdx !== undefined
                            ? currentInstanceIdx
                            : 0;
                    return `pages.${page._id}.${section._id}.${instanceIdx}.${field.name}`;
                }
                // Source section is NOT repeatable - ignore instance index
                return `pages.${page._id}.${section._id}.${field.name}`;
            }
            return null;
        }

        if (fieldsIndex >= 0) {
            // Non-repeatable section path: pages.X.sections.Y.fields.Z.value
            const fieldIndex = parseInt(parts[fieldsIndex + 1], 10);

            if (
                !Number.isNaN(fieldIndex) &&
                fieldIndex >= 0 &&
                fieldIndex < section.fields.length
            ) {
                const field = section.fields[fieldIndex];
                return `pages.${page._id}.${section._id}.${field.name}`;
            }
        } else {
            // Simple field name in path: pages.X.sections.Y.fieldName
            // Try to find field by name
            const fieldName = parts[parts.length - 1];
            const field = section.fields.find(f => f.name === fieldName);
            if (field) {
                return `pages.${page._id}.${section._id}.${field.name}`;
            }
        }
    } catch (error) {
        // If parsing fails, return null
        return null;
    }

    return null;
}

/**
 * Gets the value from a complex path, handling both ID-based and index-based paths
 */
export function getValueFromComplexPath(
    form: IForm,
    formValues: any,
    path: string,
    currentPageId: string,
    currentSectionId?: string,
    currentInstanceIdx?: number
): any {
    // First try to resolve as complex path
    const resolvedPath = resolveComplexPath(
        form,
        path,
        currentPageId,
        currentSectionId,
        currentInstanceIdx
    );

    if (resolvedPath) {
        return getNestedValue(formValues, resolvedPath);
    }

    // If not a complex path, try direct lookup
    return getNestedValue(formValues, path);
}

/**
 * Whether a field/section conditional is currently satisfied against the live
 * form values. This is the single source of truth for the render gate — mirrored
 * by SectionRenderer/FieldRenderer — and reused by the pricing bindings so a
 * hidden bound field/section is treated as "nothing selected" (not charged),
 * exactly as the UI hides it. A missing/unresolved source counts as hidden.
 */
export function isConditionMet(
    conditional: any,
    form: IForm,
    formValues: any,
    pageId: string,
    sectionId: string,
    instanceIdx?: number
): boolean {
    if (!conditional?.enabled || !conditional.source_field_name) return true;

    const sourceValue = getValueFromComplexPath(
        form,
        formValues,
        conditional.source_field_name,
        pageId,
        sectionId,
        instanceIdx
    );

    if (sourceValue === undefined || sourceValue === null) return false;
    if (!conditional.operator) return false;

    return evaluateCondition(sourceValue, conditional.operator, conditional.value);
}
