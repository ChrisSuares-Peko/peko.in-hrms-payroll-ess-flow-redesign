const couponCode = require("../entities/couponCode");
const asyncHandler = require("../../middlewares/async");
const { Op, QueryTypes } = require("sequelize");
const { handleSortFields } = require("../../utils/sortHandle");
const sequelizeConfig = require("../../configs/database/index");

exports.create = async (params, options = {}) => {
  try {
    return await couponCode.create(params, options);
  } catch (error) {
    return false;
  }
};

exports.bulkCreateForServiceOperators = async ({ baseData, serviceOperatorIds }) => {
  return await sequelizeConfig.transaction(async (transaction) => {
    const rows = [];
    for (const serviceOperatorId of serviceOperatorIds) {
      const row = await couponCode.create({ ...baseData, serviceOperatorId }, { transaction });
      rows.push(row);
    }
    return rows;
  });
};

exports.findConflictingServiceOperators = async ({ couponCode: code, partnerId, serviceOperatorIds }) => {
  try {
    return await couponCode.findAll({
      where: {
        couponCode: code,
        partnerId: partnerId || null,
        serviceOperatorId: { [Op.in]: serviceOperatorIds },
      },
      attributes: ["serviceOperatorId"],
      raw: true,
    });
  } catch (error) {
    return false;
  }
};

exports.findOne = asyncHandler(async (params) => {
  return await couponCode.findOne({
    where: params,
  });
});

exports.findAll = asyncHandler(async (params) => {
  try {
    let { limit, offset, searchText, sort, sortField } = params;
    const orderClause = sortField ? `cc.${sortField} ${sort}` : 'cc.createdAt DESC';

    const whereClause = `
      WHERE (
        cc.id LIKE :searchText OR
        cc.couponCode LIKE :searchText OR
        cc.discountType LIKE :searchText OR
        cc.discount LIKE :searchText OR
        cc.validFrom LIKE :searchText OR
        cc.validTo LIKE :searchText OR
        c.name LIKE :searchText OR
         rc.referralCode LIKE :searchText OR
          p.packageName LIKE :searchText OR
        so.serviceProvider LIKE :searchText
      )
    `;

    const query = `
      SELECT
        cc.*,
        c.name AS partnerName,
        rc.referralCode AS referralCode,
        p.packageName AS packageName,
        so.id AS serviceOperatorId,
        so.serviceProvider AS serviceOperatorName
      FROM
        couponCodes cc
      LEFT JOIN credentials c ON cc.partnerId = c.id
      LEFT JOIN referral_codes rc ON cc.referralCodeId = rc.id
      LEFT JOIN packages p ON cc.packageId = p.id
       LEFT JOIN serviceOperators so ON cc.serviceOperatorId = so.id
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT :limit
      OFFSET :offset;
    `;

    const replacements = {
      searchText: `%${searchText}%`,
      limit,
      offset,
    };

    const data = await sequelizeConfig.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM couponCodes cc
      LEFT JOIN credentials c ON cc.partnerId = c.id
      LEFT JOIN referral_codes rc ON cc.referralCodeId = rc.id
       LEFT JOIN packages p ON cc.packageId = p.id
        LEFT JOIN serviceOperators so ON cc.serviceOperatorId = so.id
      ${whereClause};
    `;

    const totalCountResult = await sequelizeConfig.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return { rows: data, count: totalCountResult[0].totalCount };
  } catch (error) {
    throw { message: "Something went wrong" };
  }
});


exports.update = asyncHandler(async (id, updates) => {
  const [updated] = await couponCode.update(updates, {
    where: { id }
  });
  if (updated) {
    return await couponCode.findByPk(id);
  }
  return false;
});

exports.delete = asyncHandler(async (id) => {
  const deleted = await couponCode.destroy({
    where: { id },
  });
  return deleted;
});

exports.CouponCodeExport = asyncHandler(async (params) => {
  try {

   let {  searchText, sort, sortField, attributes=undefined } = params;
    let order = handleSortFields(sortField, sort);

    let result= await couponCode.findAndCountAll({
      where: {
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            couponCode: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            discountType: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            discount: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            validFrom: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            validTo: {
              [Op.like]: "%" + searchText + "%",
            },
          },
        ],
      },
      order: order,
      attributes,
       raw: true,
      nest: true,
    });
    let finalData = [];
    result.rows.forEach(function (limitData) {
      finalData.push({
        "Date": limitData.createdAt|| "Not Available",
        "Coupon Code": limitData.couponCode|| "Not Available",
        "Discount Type": limitData.discountType || "Not Available",
        "Discount": limitData.discount || "Not Available",
        "Valid From": limitData.validFrom || "Not Available",
        "Valid To": limitData.validTo || "Not Available",
      });
    });
   
    return finalData;
  } catch (error) {
    console.error(error)
    throw { message: "Something went wrong" };
  }
});