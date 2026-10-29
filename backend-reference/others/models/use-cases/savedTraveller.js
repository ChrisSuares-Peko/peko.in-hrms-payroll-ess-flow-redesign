const { Op } = require('sequelize');
const savedTraveller = require('../entities/savedTraveller');
const Setting = require('../entities/setting');

const UNLIMITED_LIMIT_TOKEN = '1';
const FALLBACK_SAVED_TRAVELLERS_LIMIT = 500;
const toLimit = (raw) => {
    if (raw === undefined || raw === null || String(raw).trim() === '') return null;
    if (String(raw).trim() === UNLIMITED_LIMIT_TOKEN) return Infinity;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? n : null;
};

const envLimit = toLimit(process.env.SAVED_TRAVELLERS_LIMIT);
const DEFAULT_SAVED_TRAVELLERS_LIMIT =
    envLimit === null ? FALLBACK_SAVED_TRAVELLERS_LIMIT : envLimit;

const DEFAULT_SERVICE_GROUPS = { travel: ['tbo_airline', 'hotels_api'] };

const groupTypesFor = (groups, type) => {
    const members = Object.values(groups).find((g) => Array.isArray(g) && g.includes(type));
    return members && members.length ? members : [type];
};
const groupKeyFor = (groups, type) => {
    const entry = Object.entries(groups).find(([, g]) => Array.isArray(g) && g.includes(type));
    return entry ? entry[0] : type;
};

const norm = (v) => String(v ?? '').trim().toLowerCase();
const travellerKey = (r = {}) =>
    [
        norm(r.firstName),
        norm(r.lastName),
        norm(r.dateOfBirth),
        String(r.passportNo ?? '').trim().toUpperCase(),
        norm(r.contactNo),
        norm(r.email),
    ].join('|');

const scopeWhere = ({ credentialId, type, groups, subCorporateUserId }) => ({
    credentialId,
    type: { [Op.in]: groupTypesFor(groups, type) },
    status: 'ACTIVE',
    subCorporateUserId: subCorporateUserId ?? null,
});

const resolveConfig = async () => {
    try {
        const rows = await Setting.findAll({
            where: { name: { [Op.in]: ['savedTravellerGroups', 'savedTravellersLimit'] } },
        });
        let groups = DEFAULT_SERVICE_GROUPS;
        let limitDetails;
        rows.forEach((r) => {
            if (r.name === 'savedTravellerGroups') {
                const d = r.details;
                if (d && typeof d === 'object' && !Array.isArray(d)) groups = d;
            } else if (r.name === 'savedTravellersLimit') {
                limitDetails = r.details;
            }
        });
        return { groups, limitDetails };
    } catch (err) {
        return { groups: DEFAULT_SERVICE_GROUPS, limitDetails: undefined };
    }
};

const limitFor = (config, type) => {
    const groups = (config && config.groups) || DEFAULT_SERVICE_GROUPS;
    const limitDetails = config && config.limitDetails;
    if (limitDetails === null || limitDetails === undefined) return DEFAULT_SAVED_TRAVELLERS_LIMIT;
    if (typeof limitDetails === 'object') {
        const byType = limitDetails.byType || {};
        const configured = toLimit(
            byType[groupKeyFor(groups, type)] ?? byType[type] ?? limitDetails.default
        );
        return configured === null ? DEFAULT_SAVED_TRAVELLERS_LIMIT : configured;
    }
    const configured = toLimit(limitDetails);
    return configured === null ? DEFAULT_SAVED_TRAVELLERS_LIMIT : configured;
};

exports.resolveConfig = resolveConfig;
exports.limitFor = limitFor;

exports.create = (data) => savedTraveller.create(data);

exports.findAll = async ({ credentialId, type, searchText, subCorporateUserId }, config) => {
    const cfg = config || (await resolveConfig());
    const where = scopeWhere({ credentialId, type, groups: cfg.groups, subCorporateUserId });
    if (searchText) {
        where[Op.or] = [
            { firstName: { [Op.like]: `%${searchText}%` } },
            { lastName: { [Op.like]: `%${searchText}%` } },
            { email: { [Op.like]: `%${searchText}%` } },
            { contactNo: { [Op.like]: `%${searchText}%` } },
        ];
    }
    return savedTraveller.findAll({ where, order: [['createdAt', 'DESC']] });
};

exports.findOne = (id, credentialId, subCorporateUserId) =>
    savedTraveller.findOne({
        where: { id, credentialId, status: 'ACTIVE', subCorporateUserId: subCorporateUserId ?? null },
    });

exports.findDuplicateWithCount = async (
    { credentialId, type, subCorporateUserId, ...fields },
    config
) => {
    const cfg = config || (await resolveConfig());
    const rows = await savedTraveller.findAll({
        where: scopeWhere({ credentialId, type, groups: cfg.groups, subCorporateUserId }),
    });
    const key = travellerKey(fields);
    return { match: rows.find((r) => travellerKey(r) === key) || null, count: rows.length };
};

exports.update = async (id, credentialId, subCorporateUserId, data) => {
    const [updated] = await savedTraveller.update(data, {
        where: { id, credentialId, subCorporateUserId: subCorporateUserId ?? null },
    });
    return updated > 0;
};

exports.softDelete = async (id, credentialId, subCorporateUserId) => {
    const [updated] = await savedTraveller.update(
        { status: 'INACTIVE' },
        { where: { id, credentialId, subCorporateUserId: subCorporateUserId ?? null } }
    );
    return updated > 0;
};

exports.__test = { toLimit, groupTypesFor, groupKeyFor, travellerKey, limitFor };
