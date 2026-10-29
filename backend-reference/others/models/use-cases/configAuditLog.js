const { Op } = require("sequelize");
const configAuditLog = require("../entities/configAuditLog");
const credential = require("../entities/credential");

const SORT_COLUMNS = {
    createdAt: ["createdAt"],
    actorName: [{ model: credential, as: "actor" }, "name"],
    configType: ["configType"],
    partnerName: ["partnerName"],
};

exports.saveAuditEntries = async entries => configAuditLog.bulkCreate(entries);

exports.listAuditLogs = async ({
    searchText,
    configType,
    source,
    partnerName,
    range,
    sort,
    sortField,
    limit,
    offset,
}) => {
    const where = {};
    if (configType) where.configType = configType;
    if (source) where.source = source;
    if (partnerName) where.partnerName = partnerName;
    if (range) where.createdAt = { [Op.between]: [range.from, range.to] };
    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [{ "$actor.name$": like }, { targetLabel: like }];
    }

    const direction = sort === "ASC" ? "ASC" : "DESC";
    const sortedBy = SORT_COLUMNS[sortField] || SORT_COLUMNS.createdAt;
    const order = [[...sortedBy, direction]];
    if (sortedBy === SORT_COLUMNS.createdAt) order.push(["id", direction]);
    else order.push(["createdAt", "DESC"], ["id", "DESC"]);

    return configAuditLog.findAndCountAll({
        where,
        include: [{ model: credential, as: "actor", attributes: ["id", "name"], required: false }],
        order,
        limit,
        offset,
    });
};

exports.serializeAuditLog = row => {
    const plain = typeof row.toJSON === "function" ? row.toJSON() : row;
    return {
        id: plain.id,
        createdAt: plain.createdAt,
        actorId: plain.actorId,
        actorName: plain.actor ? plain.actor.name : null,
        source: plain.source,
        configType: plain.configType,
        action: plain.action,
        targetTable: plain.targetTable,
        targetId: plain.targetId,
        targetLabel: plain.targetLabel,
        partnerName: plain.partnerName,
        ipAddress: plain.ipAddress || null,
        changes: plain.changes,
    };
};
