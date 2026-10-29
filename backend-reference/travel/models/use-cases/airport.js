const airport = require("../entities/airport");
const { Sequelize, Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");

module.exports.findAllAirports = asyncHandler(async (query) => {
    // Empty query → return priority-ordered airports set by admin
    if (!query || query.trim() === '') {
        return await airport.findAll({
            where: { priority: { [Op.not]: null } },
            order: [['priority', 'ASC']],
            attributes: { exclude: ['updatedAt', 'createdAt'] },
        });
    }

    const likeQuery = `%${query}%`;
    const prefixQuery = `${query}%`;

    return await airport.findAll({
        where: {
            [Op.or]: [
                { airportName: { [Op.like]: likeQuery } },
                { airportCode: { [Op.like]: likeQuery } },
                { cityName: { [Op.like]: likeQuery } },
            ]
        },
        order: [
            [
                Sequelize.literal(`CASE
            WHEN LOWER(cityName) LIKE LOWER(:prefixQuery) THEN 1
            WHEN LOWER(cityName) = LOWER(:query) THEN 2
            WHEN LOWER(airportCode) = LOWER(:query) THEN 3
            WHEN LOWER(airportName) = LOWER(:query) THEN 4
            WHEN LOWER(airportName) LIKE LOWER(:prefixQuery) THEN 5
            ELSE 5
          END`),
                "ASC"
            ]
        ],
        replacements: { query, prefixQuery },
        attributes: { exclude: ["updatedAt", "createdAt"] }
    });
});

module.exports.findAllAirportsPaginated = asyncHandler(async ({ searchText, page, itemsPerPage, sort, sortField }) => {
    const offset = (page - 1) * itemsPerPage;
    const where = searchText
        ? {
            [Op.or]: [
                { airportCode: { [Op.like]: `%${searchText}%` } },
                { airportName: { [Op.like]: `%${searchText}%` } },
                { cityName: { [Op.like]: `%${searchText}%` } },
                { countryName: { [Op.like]: `%${searchText}%` } },
            ],
        }
        : {};

    const validSortFields = ['airportCode', 'airportName', 'cityName', 'countryName', 'priority', 'id'];
    const orderField = validSortFields.includes(sortField) ? sortField : 'id';
    const orderDir = sort === 'ASC' ? 'ASC' : 'DESC';

    const { rows, count } = await airport.findAndCountAll({
        where,
        order: [[orderField, orderDir]],
        limit: itemsPerPage,
        offset,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return { data: rows, recordsTotal: count };
});

module.exports.findAirportByCode = asyncHandler(async (airportCode) => {
    return await airport.findOne({ where: { airportCode } });
});

module.exports.createAirport = asyncHandler(async ({ airportCode, airportName, cityCode, cityName, countryCode, countryName, priority }) => {
    return await airport.create({
        airportCode,
        airportName,
        cityCode,
        cityName,
        countryCode,
        countryName,
        priority: priority != null && priority !== '' ? Number(priority) : null,
    });
});

module.exports.setAirportPriority = asyncHandler(async (id, priority) => {
    return await airport.update(
        { priority: priority !== null && priority !== '' ? Number(priority) : null },
        { where: { id } }
    );
});
