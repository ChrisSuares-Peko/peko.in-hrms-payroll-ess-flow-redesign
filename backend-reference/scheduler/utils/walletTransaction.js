/* eslint-disable no-prototype-builtins */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
const order = require('../models/entities/order')
const wallet = require('../models/entities/wallet')
const walletTransaction = require('../models/entities/transaction')
const sequelizeConfig = require("../configs/database/index");
const {
    Op
} = require("sequelize");
const { customLog } = require('./loggerHelper');


exports.updateWalletTransaction = async (data) => {
    const { corporateTxnId } = data;
    delete data.corporateTxnId;
    try {
        await sequelizeConfig.transaction(async (t) => {
            let orderDetails = { message: data.message, status: data.status, providerId: data.providerId };
            if (data.orderResponse) orderDetails.orderResponse = data.orderResponse;
            await order.update(orderDetails, { where: { corporateTxnId: String(corporateTxnId) }, transaction: t });
            await walletTransaction.update(
                { providerId: data.providerId, remarks: data.message, status: data.status },
                { where: { corporateTxnId: String(corporateTxnId) }, transaction: t }
            );
        });
    } catch (err) {
        console.log(err);
    }
};

exports.refundWalletTransaction = async (meta) => {
    const {
        corporateTxnId,
        registeredById, 
        partialRefund
    } = meta
    delete meta.corporateTxnId
    return new Promise(async (resolve, reject) => {
        const t = await sequelizeConfig.transaction({
            autocommit: false
        })
        try {
            customLog(null, "info", { message: "Refund transaction start" });
            let tranStatus = 'REFUND',
                oldTranStatus = 'REFUNDED'
            let newTranData, tranDate = new Date()
            const data = await walletTransaction.findOne({
                where: {
                    corporateTxnId
                },
                raw: true
            })
            if (data) {
                if (data.remarks.indexOf('REFUND') === 0) {
                    let response = 'ALREADY REFUNDED'
                    resolve(response)
                } else {
                    const corporateWalletData = await wallet.findOne({
                        where: {
                            credentialId: data.credentialId
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                    })
                    /*
                      Initializing Corporate Transaction
                    */
                    data.transactionDate = tranDate

                    if(partialRefund && partialRefund?.status === true) {
                        let { walletRefund } = partialRefund
                        data.balance = parseFloat(corporateWalletData.balance) + parseFloat(walletRefund) - parseFloat(data.creditAmount); 
                        data.debitAmount = walletRefund * -1;
                    }
                    else {
                        data.balance = parseFloat(corporateWalletData.balance) + parseFloat(data.debitAmount) - parseFloat(data.creditAmount)
                        data.debitAmount *= -1
                    }
                    data.creditAmount *= -1
                    data.corporateCashback *= -1
                    data.systemCashback *= -1
                    data.remarks = tranStatus

                    newTranData = data

                    await wallet.update({
                        balance: newTranData.balance
                    }, {
                        where: {
                            credentialId: data.credentialId
                        },
                        transaction: t
                    })
                    delete newTranData.id
                    delete newTranData.orderId
                    const originalCreatedAt = new Date(newTranData.createdAt);
                    newTranData.createdAt = new Date(originalCreatedAt.getTime() + 1000);
                    newTranData.updatedAt = new Date(originalCreatedAt.getTime() + 1000);
                    await walletTransaction.create(newTranData, {
                        transaction: t
                    })
                    let updatedOrderData = {}
                    updatedOrderData.status = meta.hasOwnProperty('status') ? meta.status : 'REFUNDED'
                    updatedOrderData.message = meta.hasOwnProperty('message') ? meta.message : 'REVERSAL'
                    
                    // To solve the issue of getting a null value as order response
                    // updatedOrderData.orderResponse = meta.hasOwnProperty('orderResponse') ? meta.orderResponse : ''

                    await order.update(updatedOrderData, {
                        where: {
                            corporateTxnId
                        },
                        transaction: t
                    })
                    await walletTransaction.update({
                        remarks: oldTranStatus,
                        status: updatedOrderData.status
                    }, {
                        where: {
                            corporateTxnId,
                            remarks: {
                                [Op.ne]: tranStatus
                            }
                        },
                        transaction: t
                    })
                    let paymentModeResponseDetails = await order.findOne({
                        where: {
                            corporateTxnId
                        },
                        attributes: ['paymentModeResponse']
                    })
                    if (paymentModeResponseDetails) {
                        let dapiDetails = JSON.parse(paymentModeResponseDetails.paymentModeResponse)
                        if (dapiDetails && dapiDetails['dapiAmount'] && dapiDetails['dapiAmount'] > 0)
                            await transferFund({
                                credentialId: data.credentialId,
                                amount: dapiDetails['dapiAmount'],
                                remarks: "DAPI REFUND " + corporateTxnId,
                                type: "Credit",
                                registeredById
                            }, t)
                        if (dapiDetails && dapiDetails['pgAmount'] && dapiDetails['pgAmount'] > 0)
                            await transferFund({
                                credentialId: data.credentialId,
                                amount: dapiDetails['pgAmount'],
                                remarks: "PG REFUND " + corporateTxnId,
                                type: "Credit",
                                registeredById
                            }, t)
                    }
                    await t.commit()
                    let walletDetails = {
                        corporateBalance: newTranData.balance,
                    }
                    customLog(null, "info", { message: "Refund transaction end" });
                    resolve(walletDetails)
                }
            } else {
                resolve('NO TRANSACTIONS FOUND')
            }
        } catch (error) {
            await t.rollback()
            customLog(null, "error", { error, message: "Refund transaction error" });
            reject({
                type: 'ERROR',
                description: error
            })
        }
    })
}


async function transferFund(data, t) {
    let {
        credentialId,
        amount,
        remarks,
        type,
        registeredById
    } = data
    const corporateWallet = await wallet.findOne({
        where: {
            credentialId
        },
        lock: t.LOCK.UPDATE,
        attributes: ['balance'],
        transaction: t
    })
    const adminWallet = await wallet.findOne({
        where: {
            credentialId: data['registeredById']
        },
        lock: t.LOCK.UPDATE,
        attributes: ['balance'],
        transaction: t
    })
    let modifiedAmount = type === "Credit" ? amount : amount * -1
    let corporateFinalBalance = parseFloat(parseFloat(corporateWallet['balance']) + parseFloat(modifiedAmount)).toFixed(4)
    let adminFinalBalance = parseFloat(parseFloat(adminWallet['balance']) - parseFloat(modifiedAmount)).toFixed(4)
    await wallet.update({
        balance: adminFinalBalance
    }, {
        where: {
            credentialId: registeredById
        },
        transaction: t
    })
    await wallet.update({
        balance: corporateFinalBalance
    }, {
        where: {
            credentialId
        },
        transaction: t
    })
    if (corporateFinalBalance < 0) {
        throw 'INSUFFICIENT WALLET BALANCE'
    }
    let transactionDate = new Date()
    await walletTransaction.create({
        corporateTxnId: transactionDate.valueOf(),
        transactionDate: transactionDate,
        transactionCategory: type === "Credit" ? 'FUND TRANSFER' : "FUND REVERSAL",
        transactionType: type === "Credit" ? 'CREDIT' : "DEBIT",
        creditAmount: type === "Credit" ? amount : 0,
        debitAmount: type === "Credit" ? '0' : amount,
        totalCashback: 0,
        corporateCashback: 0,
        systemCashback: 0,
        balance: corporateFinalBalance,
        remarks,
        providerId: data['registeredByname'],
        credentialId
    }, {
        transaction: t
    });
    await walletTransaction.create({
        corporateTxnId: transactionDate.valueOf(),
        transactionDate: transactionDate,
        transactionCategory: 'FUND TRANSFER',
        transactionType: type === "Debit" ? 'CREDIT' : "DEBIT",
        creditAmount: type === "Credit" ? '0' : amount,
        debitAmount: type === "Credit" ? amount : 0,
        totalCashback: 0,
        corporateCashback: 0,
        systemCashback: 0,
        balance: adminFinalBalance,
        remarks,
        credentialId: registeredById
    }, {
        transaction: t
    });
    return {
        corporateFinalBalance,
        adminFinalBalance
    }
}

