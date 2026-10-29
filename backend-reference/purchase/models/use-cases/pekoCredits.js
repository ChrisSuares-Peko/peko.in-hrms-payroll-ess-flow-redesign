const PekoCredits = require("../entities/pekoCredits");
const asyncHandler = require('../../middlewares/async')
const UserCoupons = require("../entities/userCoupons");
const { Op, Sequelize } = require('sequelize');
const Package = require("../entities/package");
const ServiceOperator = require("../entities/serviceOperator");
let sequelizeConfig = require("../../configs/database/index");
const moment = require('moment');
const { customLog } = require("../../utils/loggerHelper");

exports.findOneCouponData = async ({ couponCode, corporateId, partnerId, packageId, serviceOperatorId, accessKey }) => {
  try {
    const whereClause = {
      status: 'ACTIVE',
      code: couponCode,
      partnerId
    }

    const includeConditions = {
      model: PekoCredits,
      as: 'couponData',
      attributes: ['id', 'code', 'discountType', 'discount', 'minimumPurchase', 'maximumDiscount', 'couponType', 'billingType'],
      where: whereClause
    };

    if (accessKey === 'gift_cards_combined') {
      includeConditions.include = [{
        model: ServiceOperator,
        as: 'serviceOperator',
        where: { serviceCategory: 'Gift Cards/Vouchers' }
      }];
    } else if (packageId) {
      whereClause.packageId = packageId;
    } else if (serviceOperatorId) {
      whereClause.serviceOperatorId = serviceOperatorId;
    } else {
      return false;
    }

    const couponDetails = await UserCoupons.findOne({
      include: [includeConditions],
      where: { corporateUserId: corporateId, status: "UNCLAIMED", expiryDate: { [Op.gt]: new Date() } },
      raw: true,
      nest: true
    });

    return couponDetails?.couponData || false;
  } catch (error) {
    customLog(null, "error", { message: "Apply coupon code error", data: error })
    return false;
  }
};


exports.create = async (params) => {
  try {
    return await PekoCredits.create(params);
  } catch (error) {
    customLog(null, "error", { message: "create coupon code error", data: error })
    return false
  }
};

exports.findOne = async (params) => {
  try {
    const partnerId = params.partnerId;
    return await PekoCredits.findOne({
      where: {
        code: params.code,
        partnerId: partnerId
      },
      include: [
        {
          model: Package,

        },
      ],
    });
  } catch (error) {
    customLog(null, "error", { message: "find one coupon code error", data: error })
    return false
  }
}

exports.findOneById = async (id) => {
  try {
    return await PekoCredits.findOne({
      where: { id }
    });
  } catch (error) {
    customLog(null, "error", { message: "find one coupon code error", data: error })
    return false
  }
}

exports.updateAllExpiredCoupon = async () => {

  const today = moment().startOf('day').toDate();
  try {
    const [expiredRows] = await PekoCredits.update(
      { status: "DISABLED" },
      {
        where: {
          validUntil: {
            [Op.lt]: today
          },
          status: "ACTIVE"
        }
      }
    );
    return expiredRows
  } catch (error) {
    customLog(null, "error", { message: "update all expired coupon codes error", data: error })
    return false
  }
}

exports.findAll = asyncHandler(async (params) => {
  try {
    let { limit, offset, searchText, sort, sortField, partnerId } = params;
    // let order = handleSortFields(sortField, sort);
    const orderClause = sortField ? `${sortField} ${sort}` : 'packages.id ASC';

    let whereClause = `
            WHERE 
                (pc.id LIKE :searchText OR 
                pc.couponType LIKE :searchText OR
                pc.code LIKE :searchText OR
                pc.discountType LIKE :searchText OR
                pc.discount LIKE :searchText OR
                pc.expiryDays LIKE :searchText OR
                p.packageName LIKE :searchText OR
                so.serviceProvider LIKE :searchText OR
                c.name LIKE :searchText OR
                rc.referralCode LIKE :searchText)
        `;

    if (partnerId === "default") {
      whereClause += ` AND pc.partnerId IS NULL`;
    } else if (partnerId) {
      whereClause += ` AND pc.partnerId = :partnerId`;
    }

    const query = `
            SELECT 
                pc.*,
                c.name AS partnerName,
                so.serviceProvider AS serviceProvider, 
                p.packageName AS packageName,
                rc.referralCode AS referralCode
            FROM 
                peko_credits pc
            LEFT JOIN packages p ON pc.packageId = p.id
            LEFT JOIN serviceOperators so ON pc.serviceOperatorId = so.id
            LEFT JOIN credentials c ON pc.partnerId = c.id
            LEFT JOIN referral_codes rc ON pc.referralCodeId = rc.id
            ${whereClause}
            ORDER BY 
                ${orderClause}
            LIMIT 
                :limit
            OFFSET 
                :offset;
        `;

    const replacements = {
      searchText: `%${searchText}%`,
      limit: limit,
      offset: offset,
      // type:type
    };

    if (partnerId && partnerId !== "default") {
      replacements.partnerId = partnerId;
    }

    const data = await sequelizeConfig.query(query, {
      replacements: replacements,
      type: Sequelize.QueryTypes.SELECT,
    });

    const countQuery = `
            SELECT 
                COUNT(*) AS totalCount
            FROM 
                peko_credits pc
            LEFT JOIN packages p ON pc.packageId = p.id
            LEFT JOIN serviceOperators so ON pc.serviceOperatorId = so.id
            LEFT JOIN credentials c ON pc.partnerId = c.id
            LEFT JOIN referral_codes rc ON pc.referralCodeId = rc.id
            ${whereClause};
        `;
    const totalCountResult = await sequelizeConfig.query(countQuery, {
      replacements: replacements,
      type: Sequelize.QueryTypes.SELECT,
    });

    return { rows: data, count: totalCountResult[0].totalCount };
  } catch (error) {
    customLog(null, "error", { message: "find all coupon code error", data: error })
    throw new Error("Something went wrong");
  }
});

exports.pekoCreditsExport = asyncHandler(async (params) => {
  try {
    const { searchText, partnerId } = params;

    let whereClause = `
            WHERE
                (pc.id LIKE :searchText OR
                pc.couponType LIKE :searchText OR
                pc.code LIKE :searchText OR
                pc.discountType LIKE :searchText OR
                pc.discount LIKE :searchText OR
                pc.expiryDays LIKE :searchText OR
                p.packageName LIKE :searchText OR
                so.serviceProvider LIKE :searchText OR
                c.name LIKE :searchText OR
                rc.referralCode LIKE :searchText)
        `;

    if (partnerId === "default") {
      whereClause += ` AND pc.partnerId IS NULL`;
    } else if (partnerId) {
      whereClause += ` AND pc.partnerId = :partnerId`;
    }

    const query = `
            SELECT
                pc.*,
                c.name AS partnerName,
                so.serviceProvider AS serviceProvider,
                p.packageName AS packageName,
                rc.referralCode AS referralCode
            FROM
                peko_credits pc
            LEFT JOIN packages p ON pc.packageId = p.id
            LEFT JOIN serviceOperators so ON pc.serviceOperatorId = so.id
            LEFT JOIN credentials c ON pc.partnerId = c.id
            LEFT JOIN referral_codes rc ON pc.referralCodeId = rc.id
            ${whereClause}
            ORDER BY
                pc.createdAt DESC;
        `;

    const replacements = { searchText: `%${searchText}%` };

    if (partnerId && partnerId !== "default") {
      replacements.partnerId = partnerId;
    }

    const data = await sequelizeConfig.query(query, {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
      nest: true,
    });

    return data.map((row) => ({
      "Created At": row.createdAt ?? "Not Available",
      "Coupon Code": row.code ?? "Not Available",
      "Coupon Type": row.couponType ?? "Not Available",
      "Partner": row.partnerName ?? "Not Available",
      "Package Name": row.packageName ?? "Not Available",
      "Service": row.serviceProvider ?? "Not Available",
      "Discount": row.discount ?? "Not Available",
      "Package Billing Type": row.billingType ?? "Not Available",
      "Expiry Days": row.expiryDays ?? "Not Available",
      "Valid Untill": row.validUntil ?? "Not Available",
      "Minimum Purhcase": row.minimumPurchase ?? "Not Available",
      "Status": row.status ?? "Not Available",
      "Maximum Discount": row.maximumDiscount ?? "Not Available",
    }));
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error });
    throw { message: "Something went wrong" };
  }
});

exports.update = asyncHandler(async (id, updates) => {
  const transaction = await sequelizeConfig.transaction();

  try {
    const existingCoupon = await PekoCredits.findByPk(id, { transaction });

    if (!existingCoupon) {
      await transaction.rollback();
      return false;
    }

    if (updates.validUntil) {
      const today = moment().startOf('day');
      const validUntil = moment(updates.validUntil).startOf('day');
      updates.status = validUntil.isSameOrAfter(today)
        ? "ACTIVE"
        : "DISABLED";
    }

    // Update PekoCredits
    const [updatedRows] = await PekoCredits.update(updates, {
      where: { id }, transaction
    });

    if (updatedRows === 0) {
      await transaction.rollback();
      return false;
    }

    // Update expiryDate in UserCoupons if expiryDays has changed
    const newExpiryDays = parseInt(updates.expiryDays);
    const oldExpiryDays = parseInt(existingCoupon.expiryDays);

    if (!isNaN(newExpiryDays) && newExpiryDays !== oldExpiryDays) {
      await UserCoupons.update(
        {
          expiryDate: sequelizeConfig.literal(`DATE_ADD(CURDATE(), INTERVAL ${newExpiryDays} DAY)`),
        },
        {
          where: {
            couponId: id,
            status: "UNCLAIMED",
          },
          transaction,
        }
      );
    }

    // Commit the transaction
    await transaction.commit();

    // Refetch updated object (optional but recommended)
    const updatedCoupon = await PekoCredits.findByPk(id);

    return updatedCoupon;
  } catch (error) {
    customLog(null, "error", { message: "update one coupon code error", data: error })
    await transaction.rollback();
    return false
  }
});

exports.updateCreditStatus = async (id, updates) => {
  const transaction = await sequelizeConfig.transaction();

  try {
    const coupon = await PekoCredits.findOne({ where: { id } });

    if (!coupon) {
      await transaction.rollback();
      throw new Error('Coupon not found');
    }

    // Check if admin is trying to ENABLE an expired coupon
    const now = moment().toDate(); // current date-time in local timezone
    const isExpired = coupon.validUntil && moment(coupon.validUntil).isBefore(now);

    if (updates.status === "ACTIVE" && isExpired) {
      await transaction.rollback();
      throw new Error('Cannot enable an expired coupon');
    }

    // Proceed with the update
    const result = await coupon.update(updates, { transaction });
    await transaction.commit();
    return result;
  } catch (error) {
    customLog(null, "error", { message: "update coupon code status error", data: error })
    if (!transaction.finished) {  // rollback only if not already rolled back
      await transaction.rollback();
    }
    return false;
  }
}

/**
 * Flips every peko credit to ACTIVE or DISABLED in one statement. Staging-only
 * test switch, so callers can take credits out of the picture for a payment run
 * without toggling each coupon by hand.
 *
 * Returns the number of rows changed (0 is a valid result when everything is
 * already on the requested status) or `false` when the update itself failed —
 * callers must check for `false` explicitly, not for falsiness.
 */
exports.bulkUpdateCreditStatus = async (status) => {
  const transaction = await sequelizeConfig.transaction();

  try {
    const whereClause = {
      status: { [Op.ne]: status }
    };

    // Enabling must not resurrect an expired coupon — same rule updateCreditStatus
    // enforces per row. validUntil is NOT NULL, so a plain comparison covers it.
    if (status === "ACTIVE") {
      whereClause.validUntil = { [Op.gte]: moment().toDate() };
    }

    const [updatedCount] = await PekoCredits.update(
      { status },
      { where: whereClause, transaction }
    );
    await transaction.commit();
    return updatedCount;
  } catch (error) {
    customLog(null, "error", { message: "bulk update coupon code status error", data: error })
    if (!transaction.finished) {  // rollback only if not already rolled back
      await transaction.rollback();
    }
    return false;
  }
}


exports.deleteSubscriptionCoupon = asyncHandler(async (id) => {
  let transaction;
  try {
    transaction = await sequelizeConfig.transaction();

    // First, delete the UNCLAIMED UserCoupons related to the SubscriptionCoupon
    await UserCoupons.destroy({
      where: {
        couponId: id,
        status: "UNCLAIMED"
      },
      transaction
    });

    // Now, delete the SubscriptionCoupon
    const deleted = await PekoCredits.destroy({
      where: { id },
      transaction
    });

    // If no SubscriptionCoupon was deleted, rollback and return false
    if (!deleted) {
      await transaction.rollback();
      return false;
    }

    // Commit the transaction if everything is successful
    await transaction.commit();
    return true;
  } catch (error) {
    customLog(null, "error", { message: "delete coupon code error", data: error })
    if (transaction) await transaction.rollback();
    return false;
  }
});
