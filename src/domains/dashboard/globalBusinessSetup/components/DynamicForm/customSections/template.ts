const TOKEN_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Replace `{{ token }}` placeholders in a template string with values from `data`.
 * Arrays are joined with ", "; missing tokens resolve to an empty string.
 * Returns plain text (no HTML escaping) — escape at the output boundary if needed.
 */
export const renderTemplate = (template: string, data: Record<string, unknown>): string =>
    template.replace(TOKEN_PATTERN, (_full, key: string) => {
        const value = data[key];

        if (value === undefined || value === null) return '';

        return Array.isArray(value) ? value.join(', ') : String(value);
    });

/** List the distinct `{{ token }}` names referenced in a template. */
export const extractTokens = (template: string): string[] => {
    const tokens = new Set<string>();
    const pattern = new RegExp(TOKEN_PATTERN);
    let match: RegExpExecArray | null;

    match = pattern.exec(template);

    while (match !== null) {
        tokens.add(match[1]);
        match = pattern.exec(template);
    }

    return [...tokens];
};
