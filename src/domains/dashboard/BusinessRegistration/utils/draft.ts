// Draft-payload helpers shared by the form shell and step components.

export interface UploadedFileValue {
    name?: string;
    base64?: string;
}

export const isUploadedFile = (v: unknown): v is Required<UploadedFileValue> =>
    Boolean(v) && typeof v === 'object' && 'base64' in (v as object) && 'name' in (v as object);

// Replace any {name, base64} upload values with just the filename so the stored
// applicationData stays light — file contents go via the per-document endpoint.
export const stripFileContents = (value: unknown): unknown => {
    if (isUploadedFile(value)) return value.name;
    if (Array.isArray(value)) return value.map(stripFileContents);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripFileContents(v)])
        );
    }
    return value;
};

// Merge the redux-stored application data with the live form values and strip
// transient/file fields — the shape every draft save & submit sends.
export const buildDraftData = (
    currentApplication: Record<string, unknown> | undefined,
    values: Record<string, unknown>
): Record<string, unknown> => {
    const merged: Record<string, unknown> = { ...currentApplication, ...values };
    delete merged.activitySearch; // transient NIC picker field
    return stripFileContents(merged) as Record<string, unknown>;
};
