const order = require("../entities/order")
const { customLog } = require('../../utils/loggerHelper');
const serviceOperator = require("../entities/serviceOperator")

const findOneOrder = async (params) => {
    try {
        return await order.findOne({
            where: {
                corporateTxnId: params.corporateTxnId,
            },
            include: [{
                model: serviceOperator,
                attributes: ["paymentclientid", "paymentclientsecret"],
            }],
        })
    } catch (error) {
        customLog(null, "error", { error, message: "Error finding order" });
    } finally {
        customLog(null, "info", { message: "Order find one route called" });
    }
}

const updateOneOrder = async (corporateTxnId, params)=>{
    try {
        const [updated] = await order.update(params, {
            where: { corporateTxnId }
        });
        if (updated) {
            return await order.findByPk(corporateTxnId);
        }
    } catch (error) {
        customLog(null, "error", { error, message: "Error updating order" });
        return false;
    } finally {
        customLog(null, "info", { message: "Order update one route called" });
    }
}

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
    updateOneOrder,
    updateOrderInvoiceDetails,
}