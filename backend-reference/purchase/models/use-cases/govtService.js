const govtService = require("../entities/govtService");
const { Op } = require("sequelize");


exports.findOne = async (params) => {
    try {
        return await govtService.findOne({ where: params });
    } catch (error) {
        console.error("Error finding govt service:", error);
        return false;
    }
};

exports.findAll = async (params = {}, searchText) => {
    try {
        const where = { ...params };
        if (searchText) {
            where.name = { [Op.like]: `%${searchText}%` };
        }
        return await govtService.findAll({ where, order: [["sortOrder", "ASC"], ["createdAt", "DESC"]] });
    } catch (error) {
        console.error("Error fetching govt services:", error);
        return false;
    }
};
