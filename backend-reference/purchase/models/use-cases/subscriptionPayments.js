const { Op } = require("sequelize");
const products = require('../entities/products')
const asyncHandler = require('../../middlewares/async')
const categories = require('../entities/categories');
const plans = require('../entities/subscription_plans');
let sequelizeConfig = require('../../configs/database/index');

exports.findProducts = asyncHandler(async (params, categoryAttributes = undefined, productAttributes = undefined) => {
  const { searchText, start = 1, length = 10, sort } = params;

  const pageSize = Math.min(length, 50); // max page size
  const pageNumber = Math.max(start, 1); // ensure page number is at least 1

  const offset = (pageNumber - 1) * pageSize;

  let orderCriteria;
  if (sort === 'latest') {
    orderCriteria = [['createdAt', 'DESC']];
  } else if (sort === 'oldest') {
    orderCriteria = [['createdAt', 'ASC']];
  } else {
    orderCriteria = [['createdAt', 'DESC']];
  }

  const queryOptions = {
    include: [
      {
        model: categories,
        where: {
          categoryName: "Subscriptions",
        },
        attributes: categoryAttributes
      },
    ],
    where: {
      status: true,
    },
    attributes: productAttributes,
    offset,
    limit: pageSize,
    order: orderCriteria,
  };
  if (searchText) {
    queryOptions.where.name = {
      [Op.like]: `%${searchText}%`,
    };
  }
  const result = await products.findAndCountAll(queryOptions);
  return {
    data: result.rows,
    recordsTotal: result.count,
    recordsFiltered: result.count,
  };
});

exports.findAllPlans = async (product, planAttribute = undefined, productAttribute = undefined) => {
  try {
    // const queryOptions = {
    //     include: {
    //         model: product,
    //         attributes: ['id', 'productName'],
    //         where: {
    //             id: product
    //         }
    //     },
    //     where: {
    //         status: true
    //     }
    // };

    return await plans.findAll({
      include: {
        model: products,
        where: {
          id: product,
        },
        attributes: productAttribute
      },
      where: {
        status: true,
      },
      attributes: planAttribute
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("PLANS FIND ALL ROUTE CALLED");
  }
};

exports.findAllAssignedSubscriptions = asyncHandler(async (params) => {
  const { userId, start, length, searchText, order = "DESC", column = "createdAt" } = params;

  let query = `
          SELECT *
          FROM orders
          WHERE credentialId = :userId
            AND serviceOperatorId = 34
            AND status != 'PENDING'
            AND status != 'FAILURE'
      `;

  if (searchText) {
    query += `
              AND (
                  LOWER(JSON_EXTRACT(orderResponse, '$.subscriptionDetails.name')) LIKE :searchText
                  OR LOWER(JSON_EXTRACT(orderResponse, '$.subscriptionDetails.product.name')) LIKE :searchText
                  OR CAST(JSON_EXTRACT(orderResponse, '$.subscriptionDetails.price') AS CHAR) LIKE :searchText
                  OR CAST(amountInINR AS CHAR) LIKE :searchText
              )
          `;
  }

  query += `
          ORDER BY ${column} ${order}
          LIMIT :length OFFSET :start
      `;

  const replacements = {
    userId,
    searchText: `%${searchText}%`,
    length,
    start,
  };

  const results = await sequelizeConfig.query(query, {
    type: sequelizeConfig.QueryTypes.SELECT,
    replacements,
  });

  return results;
});