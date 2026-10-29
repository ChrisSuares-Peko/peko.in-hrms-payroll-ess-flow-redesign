const { Op } = require("sequelize");
const InvoiceCatalog = require("../entities/invoiceCatalog");
const { customLog } = require("../../utils/loggerHelper");

exports.getAllCatalog = async ({
    corporateUserId,
    subCorporateUserId,
    searchText,
    sortField,
    sort,
    from,
    to,
    limit,
    offset,
}) => {
    try {
        const allowedSortFields = ["createdAt", "name", "unitPrice"];
        const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
        const orderDir = sort === "ASC" ? "ASC" : "DESC";

        const where = { corporateUserId };

        if (subCorporateUserId) where.subCorporateUserId = subCorporateUserId;

        if (searchText) {
            where[Op.or] = [
                { name: { [Op.like]: `%${searchText}%` } },
                { description: { [Op.like]: `%${searchText}%` } },
                { hsnCode: { [Op.like]: `%${searchText}%` } },
            ];
        }

        if (from && to) {
            const endOfDay = new Date(to);
            endOfDay.setDate(endOfDay.getDate() + 1);
            endOfDay.setHours(0, 0, 0, 0);
            where.createdAt = { [Op.between]: [from, endOfDay] };
        }

        return await InvoiceCatalog.findAndCountAll({
            where,
            order: [[orderField, orderDir]],
            limit: limit || null,
            offset: offset || 0,
            raw: true,
        });
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while fetching catalog");
    }
};

exports.createCatalogItem = async (data) => {
    try {
        return await InvoiceCatalog.create(data);
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while creating catalog item");
    }
};

exports.updateCatalogItem = async (id, corporateUserId, data) => {
    try {
        const item = await InvoiceCatalog.findOne({ where: { id, corporateUserId } });
        if (!item) return null;
        await item.update(data);
        return item;
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while updating catalog item");
    }
};

exports.deleteCatalogItem = async (id, corporateUserId) => {
    try {
        const item = await InvoiceCatalog.findOne({ where: { id, corporateUserId } });
        if (!item) return null;
        await item.destroy();
        return true;
    } catch (error) {
        customLog(null, "error", { error: error.message });
        throw new Error("Database error while deleting catalog item");
    }
};
