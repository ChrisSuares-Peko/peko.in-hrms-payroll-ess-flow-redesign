import { VARIABLE_TOKEN_REGEX } from './templateSyntax';

export type EmailPreviewResult =
    | { status: 'success'; html: string; missingVariablePaths: string[] }
    | { status: 'error'; message: string };

const stringifyValue = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    return String(value);
};

// Frontend-only mock standing in for a future backend Preview API. Resolves
// simple `${key}` placeholders against the flat sample-data object; this is
// the seam to swap for a real Preview API call later.
export const renderEmailPreview = (
    templateHtml: string,
    sampleData: Record<string, unknown>
): EmailPreviewResult => {
    try {
        const missingVariablePaths = new Set<string>();

        const html = templateHtml.replace(VARIABLE_TOKEN_REGEX, (_match, key: string) => {
            const value = sampleData[key];
            if (value === undefined || value === null) {
                missingVariablePaths.add(key);
                return '';
            }
            return stringifyValue(value);
        });

        return { status: 'success', html, missingVariablePaths: Array.from(missingVariablePaths) };
    } catch {
        return {
            status: 'error',
            message: 'Unable to render preview. Please check the template syntax.',
        };
    }
};
