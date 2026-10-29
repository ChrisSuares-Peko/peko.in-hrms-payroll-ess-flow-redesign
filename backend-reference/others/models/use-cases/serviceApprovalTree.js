const { Op } = require("sequelize");
const partnerPermission = require("../entities/partnerPermission");
const credential = require("../entities/credential");
const serviceApproval = require("../entities/serviceApproval");
const systemUser = require("../entities/systemUser");
const roleAndPermissions = require("../entities/roleAndPermissions");
const { getServicesTypeConfig } = require("./accountingServices");
const { collectServiceNodes, listedKeysOf, parseTree } = require("../../utils/serviceTree");

const isDefaultTree = registeredBy =>
    registeredBy === null || registeredBy === undefined || registeredBy === "";

const partnerIdOf = registeredBy => {
    const id = Number(registeredBy);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const partnerLabelOf = tree => tree.partnerName || "Default";

const unitKey = (partnerPermissionId, accessKey) => `${partnerPermissionId}:${accessKey}`;

const compareTrees = (a, b) => {
    const aDefault = isDefaultTree(a.registeredBy);
    const bDefault = isDefaultTree(b.registeredBy);
    if (aDefault !== bDefault) return aDefault ? -1 : 1;
    const byName = partnerLabelOf(a).localeCompare(partnerLabelOf(b), undefined, {
        sensitivity: "base",
    });
    return byName || a.id - b.id;
};

// A partner portal is a systemUsers row with the partner role, the same rule the Whitelabel
// Partners page and the Partners ledger list by. A permission tree whose registeredBy is any
// other credential (test logins, roles tried out by hand) is not a partner the accounts team
// should see.
const findPartnerCredentialIds = async credentialIds => {
    if (!credentialIds.length) return new Set();
    const rows =
        (await systemUser.findAll({
            attributes: ["credentialId"],
            where: { credentialId: { [Op.in]: credentialIds } },
            include: [{ model: roleAndPermissions, attributes: [], where: { roleName: "partner" } }],
            raw: true,
        })) || [];
    return new Set(rows.map(row => String(row.credentialId)));
};

// partnersOnly keeps the Default tree and the trees of partner portals only; the gate and the
// grandfathering keep reading every tree, so a test login's corporates are left exactly as
// they were.
const listTrees = async ({ keys, partnersOnly = false } = {}) => {
    const [rows, config] = await Promise.all([
        partnerPermission.findAll({
            attributes: ["id", "registeredBy", "permissions", "status"],
            raw: true,
        }),
        keys ? null : getServicesTypeConfig(),
    ]);
    const listedKeys = keys ? new Set(keys) : listedKeysOf(config);

    const allTrees = rows || [];
    const allPartnerIds = [
        ...new Set(allTrees.map(row => partnerIdOf(row.registeredBy)).filter(Boolean)),
    ];
    const partnerPortalIds = partnersOnly ? await findPartnerCredentialIds(allPartnerIds) : null;
    const trees = partnerPortalIds
        ? allTrees.filter(
              row => isDefaultTree(row.registeredBy) || partnerPortalIds.has(String(row.registeredBy))
          )
        : allTrees;
    const partnerIds = [...new Set(trees.map(row => partnerIdOf(row.registeredBy)).filter(Boolean))];
    const partners = partnerIds.length
        ? (await credential.findAll({
              where: { id: { [Op.in]: partnerIds } },
              attributes: ["id", "name"],
              raw: true,
          })) || []
        : [];
    const nameOf = new Map(partners.map(partner => [String(partner.id), partner.name]));

    return trees
        .map(row => {
            const isDefault = isDefaultTree(row.registeredBy);
            return {
                id: row.id,
                registeredBy: isDefault ? null : String(row.registeredBy),
                partnerName: isDefault
                    ? null
                    : nameOf.get(String(row.registeredBy)) || String(row.registeredBy),
                treeStatus: row.status !== false && row.status !== 0,
                nodes: collectServiceNodes(row.permissions, listedKeys),
            };
        })
        .sort(compareTrees);
};

const findLiveTrees = (trees, accessKey) =>
    trees.filter(
        tree => tree.treeStatus && tree.nodes.some(node => node.accessKey === accessKey && node.hasAccess)
    );

const flattenApprovals = rows => {
    const entries = new Map();
    (rows || []).forEach(row => {
        parseTree(row.approvals).forEach(entry => {
            if (!entry || typeof entry !== "object" || !entry.accessKey) return;
            entries.set(unitKey(row.partnerPermissionId, entry.accessKey), {
                ...entry,
                partnerPermissionId: row.partnerPermissionId,
            });
        });
    });
    return entries;
};

const loadApprovals = async (where = {}) =>
    flattenApprovals(
        await serviceApproval.findAll({
            where,
            attributes: ["id", "partnerPermissionId", "registeredBy", "approvals"],
            raw: true,
        })
    );

const findAwaitingApprovals = async () => {
    const [trees, approvals] = await Promise.all([listTrees({ partnersOnly: true }), loadApprovals()]);

    const items = [];
    const partners = new Set();
    let undecided = 0;
    let rejected = 0;

    trees
        .filter(tree => tree.treeStatus)
        .forEach(tree => {
            tree.nodes
                .filter(node => node.hasAccess)
                .forEach(node => {
                    const entry = approvals.get(unitKey(tree.id, node.accessKey));
                    const status = entry ? entry.status : "PENDING";
                    if (status === "APPROVED") return;
                    if (status === "REJECTED") rejected += 1;
                    else undecided += 1;
                    partners.add(tree.id);
                    items.push({
                        label: `${partnerLabelOf(tree)} · ${node.label}`,
                        partnerPermissionId: tree.id,
                        partnerName: tree.partnerName || null,
                        accessKey: node.accessKey,
                        serviceLabel: node.label,
                        status,
                    });
                });
        });

    return { count: items.length, items, undecided, rejected, partners: partners.size };
};

module.exports = {
    isDefaultTree,
    partnerIdOf,
    partnerLabelOf,
    unitKey,
    listTrees,
    findLiveTrees,
    flattenApprovals,
    loadApprovals,
    findAwaitingApprovals,
};
