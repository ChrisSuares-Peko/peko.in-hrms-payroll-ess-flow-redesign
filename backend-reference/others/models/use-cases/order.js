const order = require("./../entities/order");
// const sequelize = require('sequelize')
const orders = require("./../entities/order");
const serviceOperator = require("./../entities/serviceOperator");
// const vendor = require('./../entities/vendor')
const credential = require("./../entities/credential");
const { Op } = require("sequelize");
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
      // Both callers only check truthiness (duplicate-transaction guard) — restricted to
      // avoid the orders table's schema drift (pekoInvoiceDetails is modeled but missing
      // from the real table, which breaks an unrestricted SELECT *).
      attributes: ['id'],
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
  }
};

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
    console.log("FIND POPULAR GIFTCARDS ROUTE CALLED");
  }
};

const findOneOrderById = async (id) => {
  try {
    return await order.findOne({
      where: {
        id,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
  }
};

const findOneOrderByTxnId = async (corporateTxnId) => {
  return await order.findOne({ where: { corporateTxnId } });
};

module.exports = {
  createOrder,
  findOneOrder,
  findAllOrder,
  updateOrder,
  deleteOrder,
  findOneByProviderId,
  updateStatusByProviderId,
  findCountAndTotal,
  findPopularGiftCards,
  findPopularProduct,
  findOneOrderById,
  findOneOrderByTxnId,
};
