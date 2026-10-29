/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const orders = require('./../models/use-cases/order')
const order = require('./../models/entities/order')
const wallet = require('./../models/entities/wallet')
const walletTransaction = require('./../models/entities/transaction')
const sequelizeConfig = require("./../configs/database/index");

const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
let crypto = require("crypto");
exports.createDapiTransaction = async (data) => {
    //first we will check duplicity of order
    // return new Promise(async(resolve,reject)=>{
    try {
        let {
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            accountNo,
            corporateCashback,
            payCashback,
            orderAmount,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            razorPayResponse,
            razorPayAmount,
            transactionCategory,
            surcharge
        } = data
        let totalCashback = 0,
            systemCashback = 0
        const isDuplicate = await orders.findOneOrder({
            corporateTxnId
        })
        if (isDuplicate) {
            return ({
                error: "DUPLICATE TRANSACTION ID"
            })
        }
        //calculate commission
        if (commissionType === 'PERCENTAGE') {
            totalCashback = (parseFloat(orderAmount) * parseFloat(providerCommission / 100)).toFixed(4)
        } else {
            totalCashback = providerCommission
        }
        if (cashbackType === "PERCENTAGE") {
            corporateCashback = (parseFloat(totalCashback) * parseFloat(corporateCashback / 100)).toFixed(4)
        }
        systemCashback = (parseFloat(totalCashback) - parseFloat(corporateCashback)).toFixed(4)

        const result = await sequelizeConfig.transaction(async (t) => {
            const walletDetails = await wallet.findOne({
                where: {
                    credentialId
                },
                lock: t.LOCK.UPDATE,
                attributes: ['balance'],
                transaction: t
            })
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - ((parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(razorPayAmount))) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------Razor Pay---------------')
            console.log("REQ_BODY", data)
            console.log("Corporate Initial Balance", walletDetails['balance'])
            console.log("Amount", orderAmount)
            console.log("Razor Pay Amount", razorPayAmount)
            console.log("Corporate Cashback", corporateCashback)
            console.log("Corporate Final Balance", corporateFinalBalance)
            console.log('----------------Razor Pay--------------')
            if (corporateFinalBalance < 0) {
                throw 'INSUFFICIENT WALLET BALANCE'
            }
            await wallet.update({
                balance: corporateFinalBalance
            }, {
                where: {
                    credentialId
                },
                transaction: t
            })
            let orderDetails = await order.create({
                corporateTxnId: corporateTxnId,
                providerId: providerId,
                operatorId: uuidv4(),
                corporateId: credentialId,
                transactionDate: new Date(),
                amountInINR: (parseFloat(orderAmount) + (parseFloat(surcharge))),
                baseAmount: (parseFloat(orderAmount) + (parseFloat(surcharge))),
                baseCurrency: 'INR',
                exchangeRate: 1,
                status: 'PENDING',
                paymentMode: (parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(razorPayAmount) != 0 ? 'Razor Pay + WALLET' : 'Razor Pay',
                paymentModeResponse: JSON.stringify({
                    ...razorPayResponse,
                    razorPayAmount
                }),
                accountNo,
                surcharge,
                message: '',
                serviceOperatorId,
                credentialId
            }, {
                transaction: t
            });

            await walletTransaction.create({
                corporateTxnId: corporateTxnId,
                transactionDate: new Date(),
                transactionType: 'PAYMENT',
                debitAmount: (parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(razorPayAmount),
                creditAmount: corporateCashback,
                totalCashback: totalCashback,
                corporateCashback,
                systemCashback,
                transactionCategory,
                balance: corporateFinalBalance,
                remarks: 'PENDING',
                providerId: '',
                orderId: orderDetails.id,
                serviceOperatorId,
                credentialId
            }, {
                transaction: t
            });
            return {
                corporateFinalBalance,
                corporateCashback
            };
        });
        return result

    } catch (err) {
        console.log(err.message, err === "INSUFFICIENT WALLET BALANCE")
        if (err === "INSUFFICIENT WALLET BALANCE") {
            return ({
                error: "INSUFFICIENT WALLET BALANCE"
            })
        } else {
            return ({
                error: "Internal server error"
            })
        }
    }
}

exports.createRazorPayTransaction = async (data) => {
    //first we will check duplicity of order
    // return new Promise(async(resolve,reject)=>{
    try {
        let {
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            accountNo,
            corporateCashback,
            payCashback,
            orderAmount,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            razorPayResponse,
            razorPayAmount,
            transactionCategory,
            surcharge
        } = data
        let totalCashback = 0,
            systemCashback = 0
        const isDuplicate = await orders.findOneOrder({
            corporateTxnId
        })
        if (isDuplicate) {
            return ({
                error: "DUPLICATE TRANSACTION ID"
            })
        }
        //calculate commission
        if (commissionType === 'PERCENTAGE') {
            totalCashback = (parseFloat(orderAmount) * parseFloat(providerCommission / 100)).toFixed(4)
        } else {
            totalCashback = providerCommission
        }
        if (cashbackType === "PERCENTAGE") {
            corporateCashback = (parseFloat(totalCashback) * parseFloat(corporateCashback / 100)).toFixed(4)
        }
        systemCashback = (parseFloat(totalCashback) - parseFloat(corporateCashback)).toFixed(4)

        const result = await sequelizeConfig.transaction(async (t) => {
            const walletDetails = await wallet.findOne({
                where: {
                    credentialId
                },
                lock: t.LOCK.UPDATE,
                attributes: ['balance'],
                transaction: t
            })
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - ((parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(razorPayAmount))) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------Razor Pay---------------')
            console.log("REQ_BODY", data)
            console.log("Corporate Initial Balance", walletDetails['balance'])
            console.log("Amount", orderAmount)
            console.log("Razor Pay Amount", razorPayAmount)
            console.log("Corporate Cashback", corporateCashback)
            console.log("Corporate Final Balance", corporateFinalBalance)
            console.log('----------------Razor Pay--------------')
            if (corporateFinalBalance < 0) {
                throw 'INSUFFICIENT WALLET BALANCE'
            }
            await wallet.update({
                balance: corporateFinalBalance
            }, {
                where: {
                    credentialId
                },
                transaction: t
            })
            let orderDetails = await order.create({
                corporateTxnId: corporateTxnId,
                providerId: providerId,
                operatorId: uuidv4(),
                corporateId: credentialId,
                transactionDate: new Date(),
                amountInINR: (parseFloat(orderAmount) + (parseFloat(surcharge))),
                baseAmount: (parseFloat(orderAmount) + (parseFloat(surcharge))),
                baseCurrency: 'INR',
                exchangeRate: 1,
                status: 'PENDING',
                paymentMode: (parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(razorPayAmount) != 0 ? 'Razor Pay + WALLET' : 'Razor Pay',
                paymentModeResponse: JSON.stringify({
                    ...razorPayResponse,
                    razorPayAmount
                }),
                accountNo,
                surcharge,
                message: '',
                serviceOperatorId,
                credentialId
            }, {
                transaction: t
            });

            await walletTransaction.create({
                corporateTxnId: corporateTxnId,
                transactionDate: new Date(),
                transactionType: 'PAYMENT',
                debitAmount: (parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(razorPayAmount),
                creditAmount: corporateCashback,
                totalCashback: totalCashback,
                corporateCashback,
                systemCashback,
                transactionCategory,
                balance: corporateFinalBalance,
                remarks: 'PENDING',
                providerId: '',
                orderId: orderDetails.id,
                serviceOperatorId,
                credentialId
            }, {
                transaction: t
            });
            return {
                corporateFinalBalance,
                corporateCashback
            };
        });
        return result

    } catch (err) {
        console.log(err.message, err === "INSUFFICIENT WALLET BALANCE")
        if (err === "INSUFFICIENT WALLET BALANCE") {
            return ({
                error: "INSUFFICIENT WALLET BALANCE"
            })
        } else {
            return ({
                error: "Internal server error"
            })
        }
    }
}


exports.updateDapiTransaction = async (data) => {
    const {
        corporateTxnId
    } = data
    delete data.corporateTxnId
    try {
        const result = await sequelizeConfig.transaction(async (t) => {
            await order.update({
                message: data.message,
                status: data.status,
                providerId: data.providerId
            }, {
                where: {
                    corporateTxnId
                },
                transaction: t
            });
            await walletTransaction.update({
                remarks: data.status,
            }, {
                where: {
                    corporateTxnId
                },
                transaction: t
            });
            return true;
        });
    } catch (err) {
        console.log(err.message)
    }
}