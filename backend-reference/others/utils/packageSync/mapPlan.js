const pick = (raw, spec) => (typeof spec === 'function' ? spec(raw) : raw?.[spec]);
const clean = value => (value === undefined || value === null ? '' : String(value).trim());

exports.clean = clean;

exports.mapPlan = (raw, fieldMap) => {
    const { externalId: idSpec, ...rest } = fieldMap;
    const externalId = clean(pick(raw, idSpec));
    if (!externalId) return null;
    const fields = {};
    for (const [field, spec] of Object.entries(rest)) fields[field] = clean(pick(raw, spec));
    return { externalId, fields, raw };
};
