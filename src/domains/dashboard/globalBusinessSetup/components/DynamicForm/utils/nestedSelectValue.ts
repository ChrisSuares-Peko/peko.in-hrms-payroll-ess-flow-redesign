export type NestedSelectEntry = string | string[];

const asEntries = (value: unknown): NestedSelectEntry[] => (Array.isArray(value) ? value : []);

/** Values chosen at the deepest level, always as an array. */
export const getNestedLeaves = (value: unknown): string[] => {
    const entries = asEntries(value);
    const last = entries[entries.length - 1];

    if (last === undefined) return [];

    return Array.isArray(last) ? last.map(String) : [String(last)];
};

export const getNestedLeafCount = (value: unknown): number => {
    const entries = asEntries(value);
    const last = entries[entries.length - 1];

    return Array.isArray(last) ? last.length : 0;
};

/** Values chosen at every level above the deepest one. */
export const getNestedParents = (value: unknown): string[] =>
    asEntries(value)
        .slice(0, -1)
        .map(entry => String(entry));

/** The value as a single path, collapsing a multi-selection to its first entry. */
export const toNestedPath = (value: unknown): string[] => {
    const parents = getNestedParents(value);
    const leaves = getNestedLeaves(value);

    return leaves.length > 0 ? [...parents, leaves[0]] : parents;
};

/** Readable form, e.g. "India › Kerala › Thrissur › Thrissur, Guruvayur". */
export const formatNestedValue = (value: unknown, separator = ' › '): string => {
    const parts = getNestedParents(value);
    const leaves = getNestedLeaves(value);

    if (leaves.length > 0) parts.push(leaves.join(', '));

    return parts.join(separator);
};

/** True when any level is unset — including a multi-selection with nothing picked. */
export const hasEmptyNestedEntry = (value: unknown): boolean =>
    asEntries(value).some(entry => (Array.isArray(entry) ? entry.length === 0 : !entry));

const isLevelValue = (entry: unknown) => typeof entry === 'string' || typeof entry === 'number';

/** True when every entry is a level value, or an array of them at the deepest level. */
export const isValidNestedShape = (value: unknown): boolean => {
    const entries = asEntries(value);

    return entries.every(
        (entry, idx) =>
            isLevelValue(entry) ||
            (Array.isArray(entry) && idx === entries.length - 1 && entry.every(isLevelValue))
    );
};
