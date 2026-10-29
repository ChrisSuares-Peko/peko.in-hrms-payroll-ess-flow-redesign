// PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export interface PanHolder {
    fullName?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fathersName?: string;
}

// Defensive parse of the IndiaFilings verify-pan response. The BE wraps the
// vendor payload, and the exact field names aren't finalised, so we probe the
// common shapes and fall back to composing a full name from the parts.
export const parsePanHolder = (res: unknown): PanHolder | null => {
    const inner = (res as { data?: unknown } | null)?.data ?? res;
    const o = (Array.isArray(inner) ? inner[0] : inner) as Record<string, unknown> | null | undefined;
    if (!o || typeof o !== 'object') return null;

    const s = (...keys: string[]) => {
        const key = keys.find(k => o[k] != null && String(o[k]).trim());
        return key ? String(o[key]).trim() : undefined;
    };

    let firstName = s('first_name', 'firstName', 'firstname');
    let middleName = s('middle_name', 'middleName', 'middlename');
    let lastName = s('last_name', 'lastName', 'lastname');
    const fathersName = s('father_name', 'fathers_name', 'fatherName');
    const composed = [firstName, middleName, lastName].filter(Boolean).join(' ') || undefined;
    // Sandbox-verified shape (2026-07-09): name comes as `nameoncard` with the
    // first/last fields empty — split it so the KYC name fields can be filled
    // (the vendor's people API requires names to match the PAN record exactly).
    const fullName = s('full_name', 'fullName', 'name', 'registered_name', 'nameoncard') ?? composed;
    if (fullName && !firstName && !lastName) {
        const parts = fullName.split(/\s+/);
        firstName = parts[0];
        lastName = parts.length > 1 ? parts[parts.length - 1] : undefined;
        middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined;
    }

    if (!fullName && !firstName && !lastName) return null;
    return { fullName, firstName, middleName, lastName, fathersName };
};
