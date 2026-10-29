const orders = require('../models/entities/order');
const { create } = require('../models/use-cases/businessEmail');
const sequelize = require('./../configs/database/index');
const { v4: uuidv4 } = require('uuid');
const { customLog } = require("./loggerHelper");

exports.createBusinessEmailSubscription = async ({ updatedData, corporateTxnId, credentialId, pgAmount, paymentGatewayResponse, surcharge, reportData, planData,serviceOperatorId }) => {
    let transaction = await sequelize.transaction();
    try {
        const { noOfEmails, billingType } = updatedData; 
        let expectedAmount = parseFloat(surcharge); 
        if(billingType === "MONTHLY") {
            expectedAmount += parseFloat(planData.monthlyPrice) * parseFloat(noOfEmails)
        }
        else if (billingType === "ANNUALLY") {
            expectedAmount += parseFloat(planData.yearlyPrice) * parseFloat(noOfEmails)
        }
        
        if (expectedAmount != pgAmount) {
            return {
                error: true,
                message: "Invalid group package price"
            };
        }

        
        const newOrder = await orders.create({
            corporateTxnId: corporateTxnId,
            operatorId: uuidv4(),
            corporateId: credentialId,
            transactionDate: new Date(),
            amountInINR: parseFloat(pgAmount),
            baseAmount: parseFloat(pgAmount),
            baseCurrency: 'AED',
            exchangeRate: 1,
            status: 'SUCCESS',
            paymentMode: 'PAYMENT GATEWAY',
            paymentModeResponse: JSON.stringify([{ ...paymentGatewayResponse, pgAmount: parseFloat(pgAmount) }]),
            accountNo: null,
            surcharge,
            serviceOperatorId:serviceOperatorId,
            credentialId,
            subCorporateUserId: null,
            orderResponse: JSON.stringify({...updatedData, serviceName: planData.softwares_subscription.name}),
            message: 'Payment Successful',
            optional: 'BUSINESS-EMAIL-SUBSCRIPTION',
            ...reportData
        }, {
            transaction: transaction
        });
        
        updatedData.orderId = newOrder.id;
        
        let subscription = await create(updatedData, transaction);
        await transaction.commit(); 
        return { subscription };
    } catch (error) {
        await transaction.rollback();
        customLog(null, "error", { message: "[createBusinessEmailSubscription] caught error", error: error?.message, stack: error?.stack });
        return ({
            error: "Something went wrong"
        })
    }
}