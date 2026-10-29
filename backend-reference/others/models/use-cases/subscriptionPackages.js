const sequelizeConfig = require("../../configs/database/index");

const SORT_COLUMNS = {
    createdAt: "packages.createdAt",
    packageName: "packages.packageName",
    status: "packages.status",
    partnerName: "credentials.name",
    priorityLevel: "packages.priorityLevel",
};

const SERVICE_NAME =
    "CASE WHEN packages.type = '2' THEN (SELECT CONVERT(serviceOperators.serviceProvider USING utf8mb4) " +
    "FROM serviceOperators WHERE serviceOperators.accessKey = packages.accessCode " +
    "ORDER BY serviceOperators.id ASC LIMIT 1) END";

const FROM = "FROM packages LEFT JOIN credentials ON packages.partnerId = credentials.id";

const scopeOf = serviceAccessCodes =>
    serviceAccessCodes.length
        ? "(packages.type = '1' OR (packages.type = '2' AND packages.accessCode IN (:serviceAccessCodes)))"
        : "packages.type = '1'";

const whereOf = ({ serviceAccessCodes, searchText, partnerId }) => {
    const clauses = [scopeOf(serviceAccessCodes)];
    if (searchText) {
        clauses.push(
            "(packages.packageName LIKE :searchText OR packages.accessCode LIKE :searchText " +
                `OR credentials.name LIKE :searchText OR ${SERVICE_NAME} LIKE :searchText)`
        );
    }
    if (partnerId === "default") clauses.push("packages.partnerId IS NULL");
    else if (partnerId) clauses.push("packages.partnerId = :partnerId");
    return `WHERE ${clauses.join(" AND ")}`;
};

const replacementsOf = ({ serviceAccessCodes, searchText, partnerId }) => {
    const replacements = {};
    if (serviceAccessCodes.length) replacements.serviceAccessCodes = serviceAccessCodes;
    if (searchText) replacements.searchText = `%${searchText}%`;
    if (partnerId && partnerId !== "default") replacements.partnerId = partnerId;
    return replacements;
};

const select = (sql, replacements) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const listSubscriptionPackages = async ({
    serviceAccessCodes = [],
    searchText,
    partnerId,
    sort,
    sortField,
    limit,
    offset,
}) => {
    const filters = { serviceAccessCodes, searchText, partnerId };
    const where = whereOf(filters);
    const replacements = replacementsOf(filters);
    const order = `${SORT_COLUMNS[sortField] || SORT_COLUMNS.createdAt} ${sort === "ASC" ? "ASC" : "DESC"}`;

    const [rows, counts] = await Promise.all([
        select(
            `SELECT packages.*, CONVERT(credentials.name USING utf8mb4) AS partnerName, ${SERVICE_NAME} AS serviceName ` +
                `${FROM} ${where} ORDER BY ${order}, packages.id DESC LIMIT :limit OFFSET :offset`,
            { ...replacements, limit: Number(limit) || 10, offset: Number(offset) || 0 }
        ),
        select(`SELECT COUNT(*) AS totalCount ${FROM} ${where}`, replacements),
    ]);

    return { rows, count: Number(counts[0] && counts[0].totalCount) || 0 };
};

module.exports = { SORT_COLUMNS, listSubscriptionPackages };
