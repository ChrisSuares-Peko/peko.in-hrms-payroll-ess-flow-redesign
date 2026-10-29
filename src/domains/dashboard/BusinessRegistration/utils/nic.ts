// NIC-2008 helpers for the Business Activity picker. A user selects a Level-3
// activity; Level 2 (division) and Level 1 (section) are mapped back from it.
// The exact vendor (IndiaFilings) response shape isn't finalised, so normalize()
// probes the common field names and derives parents when they aren't supplied.

// Section letter -> name (NIC-2008 Level 1).
export const NIC_SECTIONS: Record<string, string> = {
    A: 'Agriculture, Forestry and Fishing',
    B: 'Mining and Quarrying',
    C: 'Manufacturing',
    D: 'Electricity, Gas, Steam and Air Conditioning Supply',
    E: 'Water Supply, Sewerage, Waste Management',
    F: 'Construction',
    G: 'Wholesale and Retail Trade; Repair of Motor Vehicles',
    H: 'Transportation and Storage',
    I: 'Accommodation and Food Service Activities',
    J: 'Information and Communication',
    K: 'Financial and Insurance Activities',
    L: 'Real Estate Activities',
    M: 'Professional, Scientific and Technical Activities',
    N: 'Administrative and Support Service Activities',
    O: 'Public Administration and Defence',
    P: 'Education',
    Q: 'Human Health and Social Work Activities',
    R: 'Arts, Entertainment and Recreation',
    S: 'Other Service Activities',
    T: 'Activities of Households as Employers',
    U: 'Activities of Extraterritorial Organisations',
};

// Division (2-digit) ranges that make up each section.
const SECTION_DIVISION_RANGES: Record<string, [number, number]> = {
    A: [1, 3], B: [5, 9], C: [10, 33], D: [35, 35], E: [36, 39], F: [41, 43],
    G: [45, 47], H: [49, 53], I: [55, 56], J: [58, 63], K: [64, 66], L: [68, 68],
    M: [69, 75], N: [77, 82], O: [84, 84], P: [85, 85], Q: [86, 88], R: [90, 93],
    S: [94, 96], T: [97, 98], U: [99, 99],
};

const sectionForDivision = (division: number): { code: string; label: string } | null => {
    const code = Object.keys(SECTION_DIVISION_RANGES).find(letter => {
        const [min, max] = SECTION_DIVISION_RANGES[letter];
        return division >= min && division <= max;
    });
    return code ? { code, label: NIC_SECTIONS[code] } : null;
};

// A selected Level-3 activity plus any parent info the API provided.
export interface NicOption {
    code: string;
    label: string;
    level2Code?: string;
    level2Label?: string;
    level1Code?: string;
    level1Label?: string;
}

export interface ActivityLevel {
    level: string;
    tag: string;
    code: string;
    label: string;
    selected: boolean;
}

// Level 3 (selected) + auto-mapped Level 2 and Level 1 rows for one activity.
export const activityLevels = (opt: NicOption): ActivityLevel[] => {
    const level2Code = opt.level2Code || opt.code.slice(0, 2);
    const section = sectionForDivision(Number(level2Code));
    const level1Code = opt.level1Code || section?.code || '';
    const level1Label = opt.level1Label || section?.label || '';
    const withDash = (code: string, label?: string) => (label ? `${code} — ${label}` : code);
    return [
        { level: 'Level 3', tag: 'You selected', code: opt.code, label: opt.label, selected: true },
        { level: 'Level 2', tag: 'Auto', code: level2Code, label: opt.level2Label || '', selected: false },
        { level: 'Level 1', tag: 'Auto', code: level1Code, label: level1Label, selected: false },
    ].map(r => ({ ...r, label: withDash(r.code, r.label) }));
};

// Best-effort mapping of the NIC list response into NicOption[]. The live vendor
// response (v1.1) is { message, data: { "01110": "Growing of..." } } — a
// code -> name map; the array shape is kept as a fallback.
export const normalizeNic = (res: unknown): NicOption[] => {
    const raw = Array.isArray(res) ? res : (res as { data?: unknown } | null)?.data;
    if (raw && !Array.isArray(raw) && typeof raw === 'object') {
        return Object.entries(raw as Record<string, unknown>)
            .filter(([code, label]) => code && typeof label === 'string')
            .map(([code, label]) => ({ code, label: String(label) }))
            .sort((a, b) => a.code.localeCompare(b.code));
    }
    const list = Array.isArray(raw) ? raw : [];
    return list
        .map(item => {
            const a = (item ?? {}) as Record<string, unknown>;
            const str = (...keys: string[]) => {
                const key = keys.find(k => a[k] != null && String(a[k]).trim());
                return key ? String(a[key]).trim() : undefined;
            };
            const code = str('code', 'id', 'value', 'nic_code') ?? '';
            const label = str('name', 'activity', 'label', 'description') ?? code;
            return {
                code,
                label,
                level2Code: str('division_code', 'level2_code', 'division'),
                level2Label: str('division_name', 'level2_name'),
                level1Code: str('section_code', 'level1_code', 'section'),
                level1Label: str('section_name', 'level1_name'),
            };
        })
        .filter(o => o.code);
};
