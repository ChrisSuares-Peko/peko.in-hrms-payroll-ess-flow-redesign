const { Op } = require("sequelize");
const CorporateSoftwareSubscription = require("../entities/corporateSoftwareSubscription");
const orders = require("../entities/order");
const { customLog } = require("../../utils/loggerHelper");
const sequelizeConfig = require("../../configs/database/index");

const createSubscription = async ({ params = {} } = {}) => {
  try {
    return await CorporateSoftwareSubscription.create(params);
  } catch (error) {
    customLog(null, "error", {
      message:
        "An error occurred in : software sevice --> CorporateSoftwareSubscription useCase --> createSubscription",
      error,
    });
    return false;
  }
};

const updateSubscriptionByCorporateTxnId = async (
  corporateTxnId,
  params = {},
) => {
  try {
    if (!corporateTxnId) return null;
    const subscription = await CorporateSoftwareSubscription.findOne({
      include: [
        {
          model: orders,
          where: { corporateTxnId },
          attributes: [],
        },
      ],
    });

    if (!subscription) return null;

    return await subscription.update(params);
  } catch (error) {
    customLog(null, "error", {
      message:
        "An error occurred in : software sevice --> CorporateSoftwareSubscription useCase --> updateSubscriptionByCorporateTxnId",
      error,
    });
    return false;
  }
};

const findOneSubscription = async (params = {}) => {
  try {
    const {
      credentialId,
      corporateTxnId,
      subscriptionAttributes,
      orderAttribute,
    } = params;

    if (!credentialId || !corporateTxnId) return null;

    const subscription = await CorporateSoftwareSubscription.findOne({
      include: [
        {
          model: orders,
          where: { corporateTxnId, credentialId },
          attributes: orderAttribute,
        },
      ],
      attributes: subscriptionAttributes,
      raw: true,
      nest: true,
    });

    if (!subscription) return null;
    return subscription;
  } catch (error) {
    customLog(null, "error", {
      message:
        "An error occurred in : software sevice --> CorporateSoftwareSubscription useCase --> findOneSubscription",
      error,
    });
    return false;
  }
};

const findAllSubscriptionsWithOrders = async (params) => {
  try {
    const {
      from,
      to,
      searchText,
      limit,
      offset,
      corporateId,
    } = params;

    let subscriptionWhere = {};

    if (from) {
      subscriptionWhere.createdAt = {
        [Op.between]: [new Date(from), to ? new Date(to) : new Date()],
      };
    }

    if (searchText) {
      subscriptionWhere[Op.or] = [
        { planName: { [Op.like]: `%${searchText}%` } },
        { productName: { [Op.like]: `%${searchText}%` } },
        { "$order.corporateTxnId$": { [Op.like]: `%${searchText}%` } },
        { "$order.paymentMode$": { [Op.like]: `%${searchText}%` } },
        { "$order.amountInINR$": { [Op.like]: `%${searchText}%` } },
        { "$order.status$": { [Op.like]: `%${searchText}%` } },
      ];
    }

    let orderWhere = {};
  
    if (corporateId) {
      orderWhere.credentialId = corporateId;
    }

    return await CorporateSoftwareSubscription.findAndCountAll({
      include: [
        {
          model: orders,
          where: orderWhere,
          attributes: [
            "id",
            "corporateTxnId",
            "paymentMode",
            "amountInINR",
            "transactionDate",
            "status",
          ],
          required: true,
        },
      ],
      where: subscriptionWhere,
      attributes: ["planName", "productName"],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
      subQuery: false,
    });
  } catch (error) {
    customLog(null, "error", {
      message: "An error occurred in findAllSubscriptionsWithOrders",
      error,
    });
    return false;
  }
};

const findPopularProducts = async () => {
  try {
    const results = await CorporateSoftwareSubscription.findAll({
      attributes: [
        "webUrl",
        [sequelizeConfig.fn("COUNT", sequelizeConfig.col("corporate_software_subscriptions.webUrl")), "count"],
      ],
      group: ["corporate_software_subscriptions.webUrl"],
      order: [[sequelizeConfig.literal("count"), "DESC"]],
      limit: 12,
    });

    return results.map((r) => r.webUrl);
  } catch (error) {
    customLog(null, "error", {
      message: "An error occurred in findPopularProducts",
      error,
    });
    return false;
  }
};

module.exports = {
  createSubscription,
  updateSubscriptionByCorporateTxnId,
  findOneSubscription,
  findAllSubscriptionsWithOrders,
  findPopularProducts,
};
