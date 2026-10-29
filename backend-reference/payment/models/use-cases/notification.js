/* eslint-disable no-undef */
const notification = require('./../entities/notification')
const credentials = require('./../entities/credential')
const transactions = require('./../entities/transaction')
const orders = require('./../entities/order')
// const esim = require("./../entities/esimPlans");
// const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
// const moment = require('moment')

const Pusher = require('pusher');
const { PUSHER_CONFIG } = require('../../utils/pusherConfig');

const pusher = new Pusher({
    ...PUSHER_CONFIG,
    encrypted: true
})

const createNotification = async (data) => {
    try {
        let customerOutletNames;
        if (data.notificationCategory == 'CORPORATE') {
            if (Array.isArray(data.notificationTo)) {
                const bulkObject = data.notificationTo.map(username => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy,
                    notificationTo: username
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                data.notificationTo.forEach(username => {
                    pusher.trigger('push-notification', 'real-time-notification', {
                        body: username
                    });
                });

                return createdData;
            } else if (typeof data.notificationTo === 'string') {

                const createdData = await notification.create(data);

                pusher.trigger('push-notification', 'real-time-notification', {
                    body: data.notificationTo
                });
                return createdData;
            }
        } else {
            if (data.notificationTo == "ALL") {
                customerOutletNames = await credentials.findAll({
                    where: {
                        role: data.notificationCategory
                    },
                    attributes: ["username"]
                });

                const bulkObject = customerOutletNames.map(username => ({
                    notificationTitle: data.notificationTitle,
                    notificationBrief: data.notificationBrief,
                    notificationTo: username.username,
                    notificationCategory: data.notificationCategory,
                    notificationBy: data.notificationBy
                }));

                const createdData = await notification.bulkCreate(bulkObject);

                return createdData;
            } else {
                res.json({
                    responseCode: '100',
                    responseMessage: 'An error occurred while adding the notification'
                })
            }
        }
    } catch (error) {
        console.log("ERROR BLOCK - ", error);
    } finally {
        console.log("NOTIFICATION CREATE ROUTE CALLED")
    }
}




const updateNotification = async (params, data) => {
    try {
        return await notification.update(data, {
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("NOTIFICATION UPDATE ROUTE CALLED")
    }
}


const updateBulkPaymentStatus = async (credentialId, message) => {
    console.table({ x: 'updateBulkPaymentStatus' })
    try {
        await pusher.trigger('update-bulk-payment-status', 'real-time-notification', {
            credentialId, message
        });
    } catch (error) {
        console.log("ERROR BLOCK - ", error);
    } finally {
        console.log("updateBulkPaymentStatus CREATE ROUTE CALLED")
    }
}

const getIccidCodes = async(batchId)=>{
    try {
      const orderIds = await transactions.findAll({ where :{batchId},attributes:["orderId"]})
      const orderIdArray = orderIds.map(order => order.dataValues.orderId);
      const orderResponses = await orders.findAll({
        where: {
          id: orderIdArray  // Sequelize automatically uses `IN` for arrays
        },
        attributes: ["id", "orderResponse"]  // Select the fields you need
      });
      console.log("orderResponses",orderResponses)
      const esimArray = orderResponses.map(order => {
        const orderResponse = JSON.parse(order.dataValues.orderResponse); // Parse the JSON
        // Bondio stores iccid in orderResponse.esim; Tunz stores it in orderResponse.esimProfile.iccid
        if (orderResponse && orderResponse.esim) {
          return orderResponse.esim;
        } else if (orderResponse && orderResponse.esimProfile && orderResponse.esimProfile.iccid) {
          return orderResponse.esimProfile.iccid;
        } else {
          console.log(`No iccid field in orderResponse for order id: ${order.dataValues.id}`);
          return null;
        }
      });
      console.log("Order Responses:", esimArray);    
      return esimArray.filter(esim => esim !== null); 
    } catch (error) {
        console.log("ERROR BLOCK - ", error);
    } finally {
        console.log("updateBulkPaymentStatus CREATE ROUTE CALLED")
    }
}


module.exports = {
    
    createNotification,
    getIccidCodes,
    updateBulkPaymentStatus,
    updateNotification,
    
}