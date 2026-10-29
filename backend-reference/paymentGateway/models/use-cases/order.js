const order = require("../entities/order");
const credential = require("../entities/credential");
const { customLog } = require("../../utils/loggerHelper");
const serviceOperators = require("../entities/serviceOperator");
const { CORPORATE_CARD_PAYMENT_MODE } = require("../../constants/corporateCardPayment");
const {
  Op
} = require("sequelize");

const findOneOrder = async (params) => {
  try {
    return await order.findOne({
      where: {        
        corporateTxnId: params.corporateTxnId
      },
      include: [{
        model: credential,
        attributes: ["username", "name", "email", "registeredBy"],
      },{
        model: serviceOperators,
        attributes: ["serviceProvider", "serviceCategory", "paymentclientid", "paymentclientsecret"]
      }],
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
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

const findOneOrderByTxnId = async (id) => {
     try {
          customLog(null, "info", { data:id,message: "transaction id for pdf generate" });
          return await order.findOne({
               where: {
                   corporateTxnId:id,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('ORDER FIND ONE ROUTE CALLED')
     }
}




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

const getUserPaymentUsage = async ({ credentialId }) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const baseCondition = {
      credentialId,
      status: 'SUCCESS'
    };

    const [walletToday, walletMonth, gatewayToday, gatewayMonth, cardToday, cardMonth] = await Promise.all([
      order.sum('amountInINR', {
        where: {
          ...baseCondition,
          paymentMode: 'WALLET',
          transactionDate: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      order.sum('amountInINR', {
        where: {
          ...baseCondition,
          paymentMode: 'WALLET',
          transactionDate: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      }),
      order.sum('amountInINR', {
        where: {
          ...baseCondition,
          paymentMode: 'PAYMENT GATEWAY',
          transactionDate: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      order.sum('amountInINR', {
        where: {
          ...baseCondition,
          paymentMode: 'PAYMENT GATEWAY',
          transactionDate: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      }),
      order.sum('amountInINR', {
        where: {
          ...baseCondition,
          paymentMode: CORPORATE_CARD_PAYMENT_MODE,
          transactionDate: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      order.sum('amountInINR', {
        where: {
          ...baseCondition,
          paymentMode: CORPORATE_CARD_PAYMENT_MODE,
          transactionDate: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      }),
    ]);
 
    return {
      wallet: {
        today: Number(walletToday || 0),
        month: Number(walletMonth || 0),
      },
      gateway: {
        today: Number(gatewayToday || 0),
        month: Number(gatewayMonth || 0),
      },
      corporateCard: {
        today: Number(cardToday || 0),
        month: Number(cardMonth || 0),
      }
    };
  } catch (error) {
    customLog(null, "error", { message: "Error while calculating payment usage", error });
    return {
      wallet: { today: 0, month: 0 },
      gateway: { today: 0, month: 0 },
      corporateCard: { today: 0, month: 0 }
    };
  } finally {
    customLog(null, "info", { message: "PAYMENT USAGE FETCH CALLED" });
  }
};

const updateOrderInvoiceDetails = async ({ id, data }) => {
  try {
    return await order.update(data, {
      where: { id },
    });
  } catch (error) {
    customLog(null, "error", { message: "Error while updating order invoice details", error });
    return null;
  } finally {
    customLog(null, "info", { message: "ORDER INVOICE DETAILS UPDATE CALLED" });
  }
};

module.exports = {
  findOneOrder,
  findOneOrderById,
  updateOneOrder,
  getUserPaymentUsage,
  findOneOrderByTxnId,
  updateOrderInvoiceDetails
};
