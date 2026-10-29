const order = require("./../entities/order");
// const sequelize = require('sequelize')
const moment = require("moment");
const transaction = require("./../entities/transaction");
const orders = require("./../entities/order");
const serviceOperator = require("./../entities/serviceOperator");
// const vendor = require('./../entities/vendor')
const credential = require("./../entities/credential");
const { Op } = require("sequelize");
const { customLog } = require("../../utils/loggerHelper");
// const asyncHandler = require('./../../middlewares/async')
// const ErrorResponse = require('./../../utils/error-response')

const createOrder = async (params) => {
  try {
    return await order.create(params);
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("ORDER CREATE ROUTE CALLED");
  }
};

const findOneOrder = async (params) => {
  try {
    return await order.findOne({
      where: {
        corporateTxnId: params.corporateTxnId,
      },
      include: [{
        model: credential,
        attributes: ["username", "name", "email"],
      }, {
        model: serviceOperator,
        attributes: ["serviceProvider", "serviceCategory", "paymentclientid", "paymentclientsecret"],
      }],
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
  }
};
const updateOneOrder = async (corporateTxnId, params)=>{
  try {
    const [updated] = await order.update(params, {
      where: { corporateTxnId: String(corporateTxnId) }
    });
    if (updated) {
      return await order.findByPk(corporateTxnId);
    }
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    customLog(null, "info",{message: "ORDER UPDATE ONE ROUTE CALLED"});
  }
}

const findAllOrder = async (params) => {
  try {
    return await order.findAll({
      where: {
        orderId: params.orderId,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ALL ROUTE CALLED");
  }
};

const updateOrder = async (params, data) => {
  try {
    return await order.update(data, {
      where: {
        id: params.id,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("Update route called");
  }
};

const deleteOrder = async (params) => {
  try {
    return await order.destroy({
      where: {
        orderId: params.orderId,
      },
    });
  } catch (error) {
    console.log(error.message.message);
  } finally {
    console.log("ORDER DELETE ROUTE CALLED");
  }
};

const getExcel = async (params) => {
  let { from, to, order, column } = params;

  let data = await transaction.findAndCountAll({
    include: [
      {
        model: serviceOperator,
      },
      {
        model: credential,
      },
      {
        model: orders,
      },
    ],
    where: {
      transactionDate: {
        [Op.between]: [from, to],
      },
    },
    order: [[column, order]],
    raw: true,
    nest: true,
  });
  let finalData = [];
  console.log("data", data);
  data.rows.forEach(function (limitData) {
    finalData.push({
      Date: limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
      "Corporate Name": limitData.credential.name ? limitData.credential.name : "Not Available",
      "Order Id": limitData.providerId ? limitData.providerId : "Not Available",
      "Transaction Id": limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
      Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
      Operator: limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : "Not Available",
      Amount: limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + " INR" : "0.00",
      "Payment Mode": limitData.order.paymentMode ? limitData.order.paymentMode : "Not Available",
      Status: limitData.order.status ? limitData.order.status : "Not Available",
    });
  });
  return finalData;
};

const findOneByProviderId = async (params) => {
  try {
    return await order.findOne({
      where: {
        providerId: params.providerId,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND BY PROVIDER ID ONE ROUTE CALLED");
  }
};

const updateStatusByProviderId = async (params) => {
  try {
    const result = await order.findOne({
      where: {
        providerId: params.Key,
      },
      include: [
        {
          model: credential,
          attributes: ["username", "name", "email"],
        },
      ],
    });

    if (result) {
      let existingUpdates = result.getDataValue("shipmentStatus") || [];

      existingUpdates.push({
        UpdateCode: params.Value.UpdateCode,
        UpdateDateTime: params.Value.UpdateDateTime,
        UpdateLocation: params.Value,
        Comments: params.Value.Comments,
      });

      result.setDataValue("shipmentStatus", existingUpdates);
      await result.save();
      return result;
    }

    return null;
  } catch (error) {
    console.log("Error:", error.message);
    return null;
  } finally {
    console.log("ORDER UPDATE BY PROVIDER ID ONE ROUTE CALLED");
  }
};

const findCountAndTotal = async (params) => {
  try {
    const ordersData = await orders.findAndCountAll({
      include: [
        {
          model: serviceOperator,
          where: {
            accessKey: "carbon_footprint", // Set the condition for serviceOperator name
          },
        },
      ],
      where: {
        credentialId: {
          [Op.like]: "%" + params + "%",
        },
        status: {
          [Op.like]: "%SUCCESS%",
        },
      },
      raw: true,
      nest: true,
    });
    return ordersData;
  } catch (error) {
    console.log(error);
  }
};

const findPopularGiftCards = async (params) => {
  try {
    const ordersData = await order.findAll({
      include: [
        {
          model: serviceOperator,
          attributes: ["accessKey"],
          where: {
            accessKey: {
              [Op.in]: params,
            },
          },
        },
      ],
      attributes: ["status", "orderResponse"],
      where: {
        status: "SUCCESS",
        orderResponse: {
          [Op.not]: null,
        },
      },
    });
    const giftCardCount = {};

    ordersData.forEach((order) => {
      const orderResponse = JSON.parse(order.orderResponse);
      const giftCardId = orderResponse.body.giftCardId;
      giftCardCount[giftCardId] = (giftCardCount[giftCardId] || 0) + 1;
    });

    const topEightGiftCardIds = Object.keys(giftCardCount)
      .sort((a, b) => giftCardCount[b] - giftCardCount[a])
      .slice(0, 9);

    return topEightGiftCardIds;
  } catch (error) {
    console.log(error);
  } finally {
    console.log("FIND POPULAR GIFTCARDS ROUTE CALLED");
  }
};

const findPopularProduct = async (params) => {
  try {
    console.log(params)
    //params = [params];
    const ordersData = await order.findAll({
      include: [
        {
          model: serviceOperator,
          attributes: ["accessKey"],
          where: {
            accessKey: params,
          },
        },
      ],
      attributes: ["status", "orderResponse"],
      where: {
        status: "SUCCESS",
        orderResponse: {
          [Op.not]: null,
        },
      },
    });
    const productQuantities = {}; // Object to store total quantities per productId

    ordersData.forEach((order) => {
      const orderResponse = JSON.parse(order.orderResponse);
      const products = orderResponse.products;

      products.forEach((product) => {
        const { productId, productQuantity } = product;

        if (productQuantities[productId]) {
          productQuantities[productId] += productQuantity;
        } else {
          productQuantities[productId] = productQuantity;
        }
      });
    });

    const topEightProductIds = Object.keys(productQuantities)
      .sort((a, b) => productQuantities[b] - productQuantities[a])
      .slice(0, 8);

    return topEightProductIds

  } catch (error) {
    console.log(error);
  } finally {
    console.log("FIND POPULAR PRODUCTS ROUTE CALLED");
  }
};

const findOneOrderByTxnId = async (corporateTxnId) => {
  try {
    return await order.findOne({
      where: {
        corporateTxnId,
      },
    });
  } catch (error) {
    console.log(error);
    return null;
  }
};

const updateOrderInvoiceDetails = async ({ id, data }) => {
  try {
    return await order.update(data, {
      where: {
        id,
      },
    });
  } catch (error) {
    customLog(null, "error", {
      message: "updateOrderInvoiceDetails failed",
      data: error?.message,
    });
    return null;
  }
};

// Pass credentialId from user-facing routes so a user can only load their own order.
const findOneOrderById = async (id, credentialId) => {
  try {
    return await order.findOne({
      where: {
        id,
        ...(credentialId && { credentialId }),
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
  }
};
const countOrdersByCouponCode = async ({ couponCodeId, credentialId }) => {
  try {
    return await order.count({
      where: { couponCodeId, credentialId }
    });
  } catch (error) {
    customLog(null, 'error', { message: 'countOrdersByCouponCode error', error });
    return 0;
  }
};

const countOrdersUsingCoupon = async (couponCodeId) => {
  try {
    return await order.count({ where: { couponCodeId } });
  } catch (error) {
    customLog(null, 'error', { message: 'countOrdersUsingCoupon error', error });
    return 0;
  }
};

module.exports = {
  createOrder,
  findOneOrder,
  updateOneOrder,
  findAllOrder,
  updateOrder,
  deleteOrder,
  getExcel,
  findOneByProviderId,
  updateStatusByProviderId,
  findCountAndTotal,
  findPopularGiftCards,
  findPopularProduct,
  findOneOrderById,
  countOrdersByCouponCode,
  findOneOrderByTxnId,
  updateOrderInvoiceDetails,
  countOrdersUsingCoupon
};
