const asyncHandler = require("../../middlewares/async");
const cities = require("../entities/cities");
const { Op } = require("sequelize");

module.exports.findAllCities = asyncHandler(async (query) => {
    return await cities.findAll({
        where: {
            [Op.or]: [
                {
                    cityName: {
                        [Op.like]: '%' + query?.toUpperCase() + '%'
                    }
                },
                {
                    countryName: {
                        [Op.like]: '%' + query?.toUpperCase() + '%'
                    }
                }
            ]
        },
        attributes: [
            'cityName',
            'countryName',
            'id'
        ],
        raw: true // Retrieve raw data instead of Sequelize model instances
    });
});