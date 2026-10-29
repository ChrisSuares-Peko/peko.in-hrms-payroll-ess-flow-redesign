const sequelizeConfig = require("../../configs/database/index");
const serviceApproval = require("../entities/serviceApproval");
const { listTrees, findLiveTrees, loadApprovals, unitKey } = require("./serviceApprovalTree");
const { getApprovalGateSettings } = require("./serviceApprovalGate");
const { loadReadinessContext, computeReadiness, driftOf } = require("./serviceApprovalReadiness");
const { loadAccountingFloor, flooredAfter, dropDashboardCache } = require("./accountingPeriod");
const { parseTree } = require("../../utils/serviceTree");
const { SALE_KEY, postingSelect, factsOfRow, eventPosting } = require("./journalPosting");

const RECENT_ORDERS_LIMIT = 10;

const RECENT_ORDERS_SQL =
    "SELECT id, corporateTxnId, status, transactionDate, amountInINR, " +
    `${postingSelect(SALE_KEY)}, ` +
    "JSON_EXTRACT(journalData, '$.journalAccountIds.isInternalAccount') AS internalFlag " +
    `FROM orders WHERE serviceOperatorId = :operatorId AND ${flooredAfter("DATE(transactionDate)")} ` +
    "ORDER BY transactionDate DESC, id DESC LIMIT :limit";

const unitOf = (tree, node) => ({
    partnerPermissionId: tree.id,
    registeredBy: tree.registeredBy,
    nodeKey: node.nodeKey,
    accessKey: node.accessKey,
});

const partnerOf = (tree, counts) => ({
    partnerPermissionId: tree.id,
    registeredBy: tree.registeredBy,
    partnerName: tree.partnerName,
    treeStatus: tree.treeStatus,
    counts,
});

const rowOf = (tree, node, approval, readiness) => ({
    partnerPermissionId: tree.id,
    partnerName: tree.partnerName,
    nodeKey: node.nodeKey,
    accessKey: node.accessKey,
    label: node.label,
    path: node.path,
    group: node.group,
    order: node.order,
    switchedOn: node.hasAccess,
    status: approval ? approval.status : "PENDING",
    decidedById: approval ? approval.decidedById || null : null,
    decidedByName: approval ? approval.decidedByName || null : null,
    decidedAt: approval ? approval.decidedAt || null : null,
    note: approval ? approval.note || null : null,
    readiness: readiness ? readiness.summary : null,
    drift: driftOf(approval, readiness),
    evidence: readiness ? readiness.evidence : null,
});

const historyOf = approval =>
    (approval && Array.isArray(approval.history) ? approval.history : [])
        .map((event, index) => ({
            id: index + 1,
            action: event.action,
            fromStatus: event.fromStatus || null,
            actorName: event.actorName || null,
            note: event.note || null,
            createdAt: event.at,
        }))
        .reverse();

const isAwaiting = row => row.switchedOn && row.status !== "APPROVED";

const countsOf = rows => ({
    services: rows.length,
    switchedOn: rows.filter(row => row.switchedOn).length,
    awaiting: rows.filter(isAwaiting).length,
    approved: rows.filter(row => row.status === "APPROVED").length,
    rejected: rows.filter(row => row.status === "REJECTED").length,
    pending: rows.filter(row => row.status === "PENDING").length,
    drifted: rows.filter(row => row.drift && row.drift.changed).length,
});

const sumCounts = partners =>
    partners.reduce(
        (totals, partner) => {
            Object.keys(totals).forEach(key => {
                totals[key] += partner.counts[key];
            });
            return totals;
        },
        { services: 0, switchedOn: 0, awaiting: 0, approved: 0, rejected: 0, pending: 0, drifted: 0 }
    );

const readinessFor = async units => computeReadiness(units, await loadReadinessContext(units));

const rowsOfTree = (tree, approvals, readiness) =>
    tree.nodes.map(node =>
        rowOf(
            tree,
            node,
            approvals.get(unitKey(tree.id, node.accessKey)) || null,
            readiness.get(unitKey(tree.id, node.accessKey)) || null
        )
    );

const listApprovalPartners = async () => {
    const [trees, approvals, gate] = await Promise.all([
        listTrees({ partnersOnly: true }),
        loadApprovals(),
        getApprovalGateSettings(),
    ]);
    const units = trees.flatMap(tree => tree.nodes.map(node => unitOf(tree, node)));
    const readiness = await readinessFor(units);

    const partners = trees.map(tree => partnerOf(tree, countsOf(rowsOfTree(tree, approvals, readiness))));
    return { partners, totals: sumCounts(partners), gate };
};

const STATUS_FILTERS = {
    awaiting: isAwaiting,
    pending: row => row.status === "PENDING",
    approved: row => row.status === "APPROVED",
    rejected: row => row.status === "REJECTED",
    all: () => true,
};

const matchesSearch = (row, needle) =>
    [row.label, row.group, row.accessKey].some(value => value && String(value).toLowerCase().includes(needle));

const filterRows = (rows, { status = "all", switchedOn, searchText = "" } = {}) => {
    const byStatus = STATUS_FILTERS[status] || STATUS_FILTERS.all;
    const needle = String(searchText || "")
        .trim()
        .toLowerCase();
    return rows.filter(row => {
        if (!byStatus(row)) return false;
        if (switchedOn !== undefined && switchedOn !== null && row.switchedOn !== switchedOn) return false;
        return !needle || matchesSearch(row, needle);
    });
};

const findTree = (trees, partnerPermissionId) =>
    trees.find(tree => Number(tree.id) === Number(partnerPermissionId)) || null;

const listPartnerApprovals = async (partnerPermissionId, filters = {}) => {
    const trees = await listTrees({ partnersOnly: true });
    const tree = findTree(trees, partnerPermissionId);
    if (!tree) return null;

    const [approvals, gate] = await Promise.all([
        loadApprovals({ partnerPermissionId: tree.id }),
        getApprovalGateSettings(),
    ]);
    const readiness = await readinessFor(tree.nodes.map(node => unitOf(tree, node)));
    const rows = rowsOfTree(tree, approvals, readiness);

    return {
        partner: partnerOf(tree, countsOf(rows)),
        rows: filterRows(rows, filters),
        gate,
    };
};

const journalStateOf = row => {
    const facts = factsOfRow(row, SALE_KEY);
    if (facts.verdict === true) return "recorded";
    if (facts.skipped) return "skipped";
    if (facts.verdict === false) return "failed";
    return "notRecorded";
};

const journalPostingOf = row => eventPosting(factsOfRow(row, SALE_KEY), { expected: false });

const loadRecentOrders = async operatorId => {
    const rows = await sequelizeConfig.query(RECENT_ORDERS_SQL, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: {
            operatorId,
            accountingFloor: await loadAccountingFloor(),
            limit: RECENT_ORDERS_LIMIT,
        },
    });
    return (rows || []).map(row => {
        const posting = journalPostingOf(row);
        return {
            id: row.id,
            corporateTxnId: row.corporateTxnId,
            status: row.status,
            transactionDate: row.transactionDate,
            amountInINR:
                row.amountInINR === null || row.amountInINR === undefined ? null : Number(row.amountInINR),
            journalState: journalStateOf(row),
            journalNote: posting.note,
            journalDetail: posting.detail,
            internal: row.internalFlag === true || row.internalFlag === 1 || row.internalFlag === "true",
        };
    });
};

const getApproval = async (partnerPermissionId, nodeKey) => {
    const trees = await listTrees({ partnersOnly: true });
    const tree = findTree(trees, partnerPermissionId);
    if (!tree) return null;
    const node = tree.nodes.find(candidate => candidate.nodeKey === nodeKey);
    if (!node) return null;

    const siblingTrees = trees.filter(candidate => candidate.nodes.some(entry => entry.nodeKey === nodeKey));
    const units = siblingTrees.map(candidate =>
        unitOf(candidate, candidate.nodes.find(entry => entry.nodeKey === nodeKey))
    );
    const [approvals, readiness] = await Promise.all([loadApprovals(), readinessFor(units)]);

    const own = readiness.get(unitKey(tree.id, nodeKey));
    const approval = approvals.get(unitKey(tree.id, nodeKey)) || null;
    const evidence = own.evidence
        ? { ...own.evidence, recentOrders: await loadRecentOrders(own.snapshot.operatorId) }
        : null;

    return {
        row: rowOf(tree, node, approval, own),
        partner: partnerOf(tree, countsOf(rowsOfTree(tree, approvals, readiness))),
        checklist: own.items,
        evidence,
        history: historyOf(approval),
        siblings: siblingTrees.map(candidate =>
            rowOf(
                candidate,
                candidate.nodes.find(entry => entry.nodeKey === nodeKey),
                approvals.get(unitKey(candidate.id, nodeKey)) || null,
                readiness.get(unitKey(candidate.id, nodeKey)) || null
            )
        ),
    };
};

const isUniqueViolation = error => Boolean(error && error.name === "SequelizeUniqueConstraintError");

const decidedEntry = ({ node, existing, decision, fromStatus, note, actor, readiness, at }) => ({
    accessKey: node.accessKey,
    label: node.label,
    path: node.path,
    status: decision,
    decidedById: actor.id,
    decidedByName: actor.name,
    decidedAt: at,
    note: note || null,
    configHash: readiness.hash,
    configSnapshot: readiness.snapshot,
    history: [
        ...((existing && Array.isArray(existing.history) && existing.history) || []),
        {
            action: decision,
            fromStatus,
            actorId: actor.id,
            actorName: actor.name,
            note: note || null,
            at,
        },
    ],
});

const decideOne = async ({ tree, node, readiness, decision, note, actor }) => {
    const partnerPermissionId = tree.id;
    if (decision === "APPROVED" && readiness.summary.blocking.length) {
        return {
            partnerPermissionId,
            ok: false,
            code: "BLOCKED",
            blocking: readiness.items
                .filter(entry => entry.required && entry.status === "fail")
                .map(({ key, label, detail }) => ({ key, label, detail })),
        };
    }

    const transaction = await sequelizeConfig.transaction();
    try {
        const row = await serviceApproval.findOne({
            where: { partnerPermissionId },
            transaction,
            lock: true,
            raw: true,
        });
        const approvals = row ? parseTree(row.approvals) : [];
        const existing = approvals.find(entry => entry && entry.accessKey === node.accessKey) || null;
        const fromStatus = existing ? existing.status : "PENDING";
        const refreshing =
            decision === "APPROVED" && fromStatus === "APPROVED" && existing.configHash !== readiness.hash;
        if (fromStatus === decision && !refreshing) {
            await transaction.rollback();
            return { partnerPermissionId, ok: false, code: "UNCHANGED", status: fromStatus };
        }

        const entry = decidedEntry({
            node,
            existing,
            decision,
            fromStatus,
            note,
            actor,
            readiness,
            at: new Date().toISOString(),
        });
        const next = existing
            ? approvals.map(candidate => (candidate.accessKey === node.accessKey ? entry : candidate))
            : [...approvals, entry];

        if (row) {
            await serviceApproval.update(
                { approvals: next, registeredBy: tree.registeredBy },
                { where: { id: row.id }, transaction }
            );
        } else {
            try {
                await serviceApproval.create(
                    { partnerPermissionId, registeredBy: tree.registeredBy, approvals: next },
                    { transaction }
                );
            } catch (error) {
                if (!isUniqueViolation(error)) throw error;
                await transaction.rollback();
                return { partnerPermissionId, ok: false, code: "STALE" };
            }
        }

        await transaction.commit();
        return { partnerPermissionId, ok: true, status: decision };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const decideServiceApprovals = async ({ nodeKey, partnerPermissionIds, decision, note, actor }) => {
    const trees = await listTrees({ partnersOnly: true });
    const targets = partnerPermissionIds.map(partnerPermissionId => {
        const tree = findTree(trees, partnerPermissionId);
        const node = tree ? tree.nodes.find(entry => entry.nodeKey === nodeKey) || null : null;
        return { partnerPermissionId: Number(partnerPermissionId), tree, node };
    });
    const units = targets.filter(target => target.node).map(target => unitOf(target.tree, target.node));
    const readiness = units.length ? await readinessFor(units) : new Map();

    const results = [];
    for (const target of targets) {
        if (!target.node) {
            results.push({ partnerPermissionId: target.partnerPermissionId, ok: false, code: "NOT_FOUND" });
        } else {
            results.push(
                await decideOne({
                    tree: target.tree,
                    node: target.node,
                    readiness: readiness.get(unitKey(target.tree.id, nodeKey)),
                    decision,
                    note,
                    actor,
                })
            );
        }
    }

    await dropDashboardCache();
    return {
        results,
        decided: results.filter(result => result.ok).length,
        skipped: results.filter(result => !result.ok).length,
    };
};

const CLASSIFIED_LIVE_NOTE = "Live when classified";

const classifiedLiveEntry = ({ node, actor, at }) => ({
    accessKey: node.accessKey,
    label: node.label,
    path: node.path,
    status: "APPROVED",
    decidedById: actor.id,
    decidedByName: actor.name,
    decidedAt: at,
    note: CLASSIFIED_LIVE_NOTE,
    configHash: null,
    configSnapshot: null,
    history: [
        {
            action: "GRANDFATHERED",
            fromStatus: null,
            actorId: actor.id,
            actorName: actor.name,
            note: CLASSIFIED_LIVE_NOTE,
            at,
        },
    ],
});

const grandfatherOne = async ({ tree, node, actor, at }) => {
    const partnerPermissionId = tree.id;
    const transaction = await sequelizeConfig.transaction();
    try {
        const row = await serviceApproval.findOne({
            where: { partnerPermissionId },
            transaction,
            lock: true,
            raw: true,
        });
        const approvals = row ? parseTree(row.approvals) : [];
        const existing = approvals.find(entry => entry && entry.accessKey === node.accessKey) || null;
        if (existing) {
            await transaction.rollback();
            return { partnerPermissionId, ok: false, code: "EXISTS", status: existing.status };
        }

        const next = [...approvals, classifiedLiveEntry({ node, actor, at })];
        if (row) {
            await serviceApproval.update(
                { approvals: next, registeredBy: tree.registeredBy },
                { where: { id: row.id }, transaction }
            );
        } else {
            try {
                await serviceApproval.create(
                    { partnerPermissionId, registeredBy: tree.registeredBy, approvals: next },
                    { transaction }
                );
            } catch (error) {
                if (!isUniqueViolation(error)) throw error;
                await transaction.rollback();
                return { partnerPermissionId, ok: false, code: "STALE" };
            }
        }

        await transaction.commit();
        return { partnerPermissionId, ok: true };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const grandfatherLiveTrees = async ({ accessKey, actor }) => {
    const trees = findLiveTrees(await listTrees({ keys: [accessKey] }), accessKey);
    const at = new Date().toISOString();
    const autoApproved = [];
    const skipped = [];
    for (const tree of trees) {
        const node = tree.nodes.find(entry => entry.accessKey === accessKey);
        const result = await grandfatherOne({ tree, node, actor, at });
        const partner = { partnerPermissionId: tree.id, partnerName: tree.partnerName };
        if (result.ok) autoApproved.push(partner);
        else skipped.push({ ...partner, code: result.code, status: result.status || null });
    }
    return { autoApproved, skipped };
};

module.exports = {
    RECENT_ORDERS_SQL,
    CLASSIFIED_LIVE_NOTE,
    rowOf,
    historyOf,
    countsOf,
    filterRows,
    journalStateOf,
    decidedEntry,
    classifiedLiveEntry,
    grandfatherOne,
    grandfatherLiveTrees,
    listApprovalPartners,
    listPartnerApprovals,
    getApproval,
    decideServiceApprovals,
};
