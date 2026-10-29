const asyncHandler = require("../../middlewares/async");
const cities = require("../entities/cities");
const { Op } = require("sequelize");

module.exports.findCitiesByCountry = asyncHandler(async (country, city) => {
  let whereClause = {
    countryName: {
      [Op.like]: `%${country?.toUpperCase()}%`,
    },
  };

  if (city) {
    whereClause.cityName = {
      [Op.like]: `%${city?.toUpperCase()}%`,
    };
  }

  return await cities.findAll({
    where: whereClause,
    attributes: ["cityName"],
    raw: true,
  });
});
