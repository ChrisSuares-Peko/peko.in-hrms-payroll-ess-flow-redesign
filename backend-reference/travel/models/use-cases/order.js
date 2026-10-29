const { customLog } = require('../../utils/loggerHelper')
const order = require('../entities/order')
const serviceOperators = require("../entities/serviceOperator");
const credential = require("../entities/credential");

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

const updateOrder = async (params, data) => {
     try {
          return await order.update(data, {
               where: {
                    id: params.id,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('Update route called')
     }
}

const findOneByProviderId = async (params) => {
     try {
          return await order.findOne({
               where: {
                    providerId: params.providerId,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('ORDER FIND BY PROVIDER ID ONE ROUTE CALLED')
     }
}

const findOneOrderById = async (id) => {
     try {
          return await order.findOne({
               where: {
                    id,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('ORDER FIND ONE ROUTE CALLED')
     }
}

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


const findOrderById = async ({ credentialId, orderId }) => {
     try {
          return await order.findOne({
               where: {
                    id: orderId,
                    credentialId: credentialId,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('ORDER FIND ONE ROUTE CALLED')
     }
}


const findOneOrderByProviderId = async ({ credentialId, providerId }) => {
     try {
          return await order.findOne({
               where: {
                    providerId: providerId,
                    credentialId: credentialId,
               },
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('ORDER FIND ONE ROUTE CALLED')
     }
}

const findOrdersByServiceOperatorId = async (id) => {
     try {
         const orders = await order.findAll({
             where: {
                 serviceOperatorId: id,
             },
         });
         return orders; 
     } catch (error) {
         console.error('Error fetching orders:', error);
         throw error; 
     } finally {
         console.log('ORDER FIND ALL ROUTE CALLED');
     }
 };
 
const updateOneOrder = async (corporateTxnId, params)=>{
     try {
       const [updated] = await order.update(params, {
         where: { corporateTxnId }
       });
       if (updated) {
         return await order.findByPk(corporateTxnId);
       }
     } catch (error) {
       console.log(error);
       return false;
     } finally {
       console.log("ORDER UPDATE ONE ROUTE CALLED");
     }
   }

const { Op, Sequelize } = require('sequelize');

const fetchBusBookings = async ({ credentialId, serviceOperatorId, limit, page, subCorporateUserId, type }) => {
    try {
        const busBooking = require('../entities/busBooking');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const baseWhere = {
            credentialId,
            serviceOperatorId,
            orderResponse: { [Op.ne]: null },
        };
        if (subCorporateUserId) baseWhere.subCorporateUserId = subCorporateUserId;

        let whereCondition;
        let includeOptions;

        if (type === 'past') {
            // CANCELLED orders OR SUCCESS orders where journey date is in the past
            whereCondition = {
                ...baseWhere,
                [Op.and]: Sequelize.literal(
                    `(\`orders\`.\`status\` = 'CANCELLED' OR (\`orders\`.\`status\` = 'SUCCESS' AND JSON_UNQUOTE(JSON_EXTRACT(\`busBooking\`.\`tripDetails\`, '$.doj')) < '${todayStr}'))`
                ),
            };
            includeOptions = [{ model: busBooking, required: false, attributes: [] }];
        } else {
            // Upcoming: SUCCESS orders where journey date is today or future
            whereCondition = {
                ...baseWhere,
                status: 'SUCCESS',
                [Op.and]: Sequelize.literal(
                    `JSON_UNQUOTE(JSON_EXTRACT(\`busBooking\`.\`tripDetails\`, '$.doj')) >= '${todayStr}'`
                ),
            };
            includeOptions = [{ model: busBooking, required: true, attributes: [] }];
        }

        return await order.findAndCountAll({
            where: whereCondition,
            include: includeOptions,
            order: [['transactionDate', 'DESC']],
            limit,
            offset: (page - 1) * limit,
            attributes: ['id', 'corporateTxnId', 'providerId', 'orderResponse', 'amountInINR', 'status', 'transactionDate', 'paymentMode', 'createdAt'],
            subQuery: false,
        });
    } catch (error) {
        console.error('Error fetching bus bookings:', error);
        throw error;
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
     updateOrder,
     findOneByProviderId,
     findOneOrderById,
     findOrderById,
     findOneOrderByProviderId,
     updateOneOrder,
     findOrdersByServiceOperatorId,
     findOneOrderByTxnId,
     fetchBusBookings,
     updateOrderInvoiceDetails
}
