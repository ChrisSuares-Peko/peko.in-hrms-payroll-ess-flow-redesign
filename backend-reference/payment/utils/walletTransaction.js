/* eslint-disable no-prototype-builtins */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
const orders = require('./../models/use-cases/order')
const order = require('./../models/entities/order')
const { findOneTransaction } = require('./../models/use-cases/transaction')
const wallet = require('./../models/entities/wallet')
const walletTransaction = require('./../models/entities/transaction')
const sequelizeConfig = require("./../configs/database/index");
const asyncHandler = require('../middlewares/async')
const UserCoupons = require("../models/entities/userCoupons");
const { customLog } = require("./loggerHelper");
const { publishJournalEvent } = require("./bull/queue/accountingEventsQueue");
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
const {
    Op
} = require("sequelize");

exports.createWalletTransaction = async (data) => {
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
            paymentMode,
            transactionCategory,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            surcharge,
            batchId,
            reportData,
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
            totalCashback = (parseFloat(amount) * parseFloat(providerCommission / 100)).toFixed(4)
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
            // Ensure amount and surcharge are properly parsed numbers
            const parsedAmount = parseFloat(amount) || 0;
            const parsedSurcharge = parseFloat(surcharge) || 0;
            const totalAmount = parsedAmount + parsedSurcharge;
            amount = totalAmount.toFixed(2);
            
            console.log('---------------AMOUNT CALCULATION---------------');
            console.log("Original amount:", amount, "Type:", typeof amount);
            console.log("Surcharge:", surcharge, "Type:", typeof surcharge);
            console.log("Parsed amount:", parsedAmount);
            console.log("Parsed surcharge:", parsedSurcharge);
            console.log("Total amount:", totalAmount);
            console.log("Final amount:", amount);
            console.log('-----------------------------------------------');
            
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - parseFloat(amount)) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------WALLET---------------')
            console.log("Corporate Initial Balance", walletDetails['balance'])
            console.log("Amount", amount)
            console.log("Corporate Cashback", corporateCashback)
            console.log("Corporate Final Balance", corporateFinalBalance)
            console.log('----------------WALLET--------------')
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
                amountInINR: amount,
                baseAmount: amount,
                baseCurrency: 'INR',
                exchangeRate: 1,
                status: 'PENDING',
                paymentMode: 'WALLET',
                accountNo,
                surcharge,
                message: '',
                serviceOperatorId,
                credentialId,
                ...reportData
            }, {
                transaction: t
            });

          let transactionDetails =  await walletTransaction.create({
                corporateTxnId: corporateTxnId,
                transactionDate: new Date(),
                transactionType: 'PAYMENT',
                debitAmount: amount,
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
                credentialId,
                batchId,
            }, {
                transaction: t
            });
            return {
                corporateFinalBalance,
                corporateCashback,
                orderId: orderDetails.id,
                transactionId: transactionDetails.id,
                paymentMode: orderDetails.paymentMode
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

exports.updateWalletTransaction = async (data) => {
    const {
        corporateTxnId
    } = data
    delete data.corporateTxnId
    try {
        const result = await sequelizeConfig.transaction(async (t) => {
            let orderDetails = {
                message: data.message,
                status: data.status,
                providerId: data.providerId
            }
            if (data.orderResponse) {
                orderDetails.orderResponse = data.orderResponse
            }
            await order.update(orderDetails, {
                where: {
                    corporateTxnId: String(corporateTxnId),
                },
                transaction: t
            });
            await walletTransaction.update({
                providerId: data.providerId,
                remarks: data.message,
                status: data.status
            }, {
                where: {
                    corporateTxnId: String(corporateTxnId),
                },
                transaction: t
            });
            return true;
        });
    } catch (err) {
        console.log(err)
    }
}

exports.refundWalletTransaction = async (meta) => {
    const { corporateTxnId, partialRefund, refundedAmount: metaRefundedAmount } = meta;
    delete meta.corporateTxnId;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        const t = await sequelizeConfig.transaction({ autocommit: false });
        try {
            let tranStatus = 'REFUND', oldTranStatus = 'REFUNDED';
            let newTranData, tranDate = new Date();
            const data = await walletTransaction.findOne({
                where: { corporateTxnId },
                raw: true,
            });
            if (data) {
                if (data.remarks.indexOf('REFUND') === 0) {
                    await t.rollback();
                    resolve('ALREADY REFUNDED');
                } else {
                    // F-PAY-14: atomic claim — only one concurrent refund of this txn may proceed, so a race
                    // can't credit the wallet twice. The loser's UPDATE matches 0 rows (already 'REFUNDED').
                    const [claimed] = await walletTransaction.update(
                        { remarks: 'REFUNDED' },
                        { where: { corporateTxnId, remarks: { [Op.notLike]: 'REFUND%' } }, transaction: t }
                    );
                    if (!claimed) {
                        await t.rollback();
                        return resolve('ALREADY REFUNDED');
                    }
                    const corporateWalletData = await wallet.findOne({
                        where: { credentialId: data.credentialId },
                        lock: t.LOCK.UPDATE,
                        transaction: t,
                    });
                    data.transactionDate = tranDate;
                    if (partialRefund && partialRefund?.status == true) {
                        let { walletRefund } = partialRefund;
                        data.balance = parseFloat(corporateWalletData.balance) + parseFloat(walletRefund) - parseFloat(data.creditAmount);
                        data.debitAmount = -walletRefund;
                    } else {
                        data.balance = parseFloat(corporateWalletData.balance) + parseFloat(data.debitAmount) - parseFloat(data.creditAmount);
                        data.debitAmount *= -1;
                    }
                    data.creditAmount *= -1;
                    data.corporateCashback *= -1;
                    data.systemCashback *= -1;
                    data.remarks = tranStatus;
                    data.refundedAmount = metaRefundedAmount != null
                        ? parseFloat(metaRefundedAmount)
                        : (partialRefund ? parseFloat(partialRefund.refundAmount) : Math.abs(data.debitAmount));

                    newTranData = data;

                    await wallet.update(
                        { balance: newTranData.balance },
                        { where: { credentialId: data.credentialId }, transaction: t }
                    );
                    delete newTranData.id;
                    delete newTranData.orderId;
                    await walletTransaction.create(newTranData, { transaction: t });

                    let updatedOrderData = {};
                    updatedOrderData.status = Object.prototype.hasOwnProperty.call(meta, 'status') ? meta.status : 'REFUNDED';
                    updatedOrderData.message = Object.prototype.hasOwnProperty.call(meta, 'message') ? meta.message : 'REVERSAL';
                    if (Object.prototype.hasOwnProperty.call(meta, 'orderResponse')) {
                        updatedOrderData.orderResponse = meta.orderResponse;
                    }
                    await order.update(updatedOrderData, {
                        where: { corporateTxnId },
                        transaction: t,
                    });
                    await walletTransaction.update(
                        {
                            remarks: oldTranStatus,
                            status: updatedOrderData.status,
                            refundedAmount: metaRefundedAmount != null
                                ? parseFloat(metaRefundedAmount)
                                : (partialRefund ? parseFloat(partialRefund.refundAmount) : Math.abs(data.debitAmount)),
                        },
                        {
                            where: { corporateTxnId, remarks: { [Op.ne]: tranStatus } },
                            transaction: t,
                        }
                    );
                    await t.commit();

                    const cashbackReversalAmount = parseFloat(-newTranData.creditAmount) || 0;
                    if (cashbackReversalAmount > 0) {
                        publishJournalEvent({
                            transactionRef: corporateTxnId,
                            type: "cashbackReversal",
                            contextSnapshot: { credentialId: newTranData.credentialId },
                            amounts: { amount: cashbackReversalAmount },
                        });
                    }

                    resolve({ corporateBalance: newTranData.balance });
                }
            } else {
                await t.rollback();
                resolve('NO TRANSACTIONS FOUND');
            }
        } catch (error) {
            await t.rollback();
            customLog(null, 'error', { message: 'refundWalletTransaction error', error });
            reject({ type: 'ERROR', description: error });
        }
    });
};

function paymentRatioToTotal(totalPay, cashPay, bankCardPay, refundAmount) {
    const cashRatio = totalPay > 0 ? (cashPay / totalPay) * 100 : 0;
    const cardRatio = totalPay > 0 ? (bankCardPay / totalPay) * 100 : 0;
    const returnRatio = totalPay > 0 ? (refundAmount / totalPay) * 100 : 0;
    return { cashRatio, cardRatio, returnRatio };
}

exports.getPartialRefundDetails = async (params) => {
    let { corporateTxnId, refundAmount } = params;

    if (!refundAmount) return null;

    const transaction = await findOneTransaction({ corporateTxnId });
    const { order: txnOrder, debitAmount } = transaction;
    let { amountInINR } = txnOrder;

    const totalPay = parseFloat(amountInINR);
    const cashPay = parseFloat(debitAmount);
    const bankCardPay = parseFloat(totalPay - cashPay);

    if (refundAmount <= 0) {
        return {
            status: true,
            paymentData: { totalPay, cashPay, bankCardPay },
            refundAmount,
            walletRefund: 0,
            bankCardRefund: 0,
            refundPercentage: 0,
        };
    }

    const { cashRatio, cardRatio, returnRatio } = paymentRatioToTotal(totalPay, cashPay, bankCardPay, refundAmount);

    let cashRefund = parseFloat(((refundAmount * cashRatio) / 100).toFixed(2));
    let bankCardRefund = parseFloat(((refundAmount * cardRatio) / 100).toFixed(2));
    if (refundAmount > totalPay) {
        cashRefund = cashPay;
        bankCardRefund = bankCardPay;
    }

    console.table({ totalPay, cashPay, bankCardPay, cashRatio, cardRatio, refundAmount, returnRatio });
    return {
        status: true,
        paymentData: { totalPay, cashPay, bankCardPay },
        refundAmount,
        walletRefund: cashRefund,
        bankCardRefund: bankCardRefund,
        refundPercentage: returnRatio,
    };
};


exports.transferFunds = asyncHandler(async (data) => {
    let {
        credentialId,
        amount,
        remarks,
        type
    } = data
    const result = await sequelizeConfig.transaction(async (t) => {
        return await transferFund(data, t)
    });
    return result
})


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

exports.selfTransfer = async (data) => {
    let {
        credentialId,
        amount,
        remarks,
        type
    } = data
    const result = await sequelizeConfig.transaction(async (t) => {
        const walletDetails = await wallet.findOne({
            where: {
                credentialId,
            },
            lock: t.LOCK.UPDATE,
            attributes: ['balance'],
            transaction: t
        })
        let modifiedAmount = type === "Debit" ? amount : amount * -1
        let finalBalance = parseFloat(parseFloat(walletDetails['balance']) - parseFloat(modifiedAmount)).toFixed(4)
        await wallet.update({
            balance: finalBalance
        }, {
            where: {
                credentialId
            },
            transaction: t
        })
        await walletTransaction.create({
            transactionDate: new Date(),
            transactionType: type === "debit" ? 'CREDIT' : "DEBIT",
            creditAmount: type === "credit" ? '0' : amount,
            debitAmount: type === "credit" ? amount : 0,
            totalCashback: 0,
            corporateCashback: 0,
            systemCashback: 0,
            balance: finalBalance,
            remarks,
            credentialId: credentialId
        }, {
            transaction: t
        });
        return finalBalance
    });
    return result
}

exports.returnRefundInEcommerce = async (meta) => {
    let {
        amount,
        corporateCashback,
        systemCashback,
        transaction,
        productId,
        credentialId
    } = meta
    let corporateTxnId = transaction?.corporateTxnId


    return new Promise(async (resolve, reject) => {
        const t = await sequelizeConfig.transaction({
            autocommit: false
        })
        try {
            console.log('::: return-refund Transaction Start:::')
            let tranStatus = 'REFUND',
                message = 'REVERSAL'
            let newTranData, tranDate = new Date()
            const data = await walletTransaction.findOne({
                where: {
                    corporateTxnId
                },
                raw: true
            })
            if (data) {
                let orderDetails = await order.findOne({
                    where: {
                        corporateTxnId
                    },
                    attributes: ['orderResponse']
                })
                let orderResponse = JSON.parse(orderDetails.orderResponse)
                let selectedProduct = orderResponse.products.find((obj) => obj.productId == productId);
                let productStatus = selectedProduct?.status

                if (productStatus == 'Return Initiated') {
                    const corporateWalletData = await wallet.findOne({
                        where: {
                            credentialId: credentialId
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                    })
                    /*
                      Initializing Corporate Transaction
                    */
                    data.transactionDate = tranDate
                    data.balance = parseFloat(corporateWalletData.balance) + parseFloat(amount) - parseFloat(corporateCashback)
                    data.debitAmount = parseFloat(amount) * -1
                    data.creditAmount = parseFloat(amount)
                    data.corporateCashback = parseFloat(corporateCashback) * -1
                    data.systemCashback = parseFloat(systemCashback) * -1
                    data.remarks = tranStatus
                    data.message = message

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

                    const transactionDetails = await walletTransaction.create(newTranData, {
                        transaction: t
                    })

                    await t.commit()
                    let details = {
                        corporateBalance: newTranData.balance,
                        transactionId: transactionDetails.id
                    }
                    console.log('::: return-refund Transaction End:::')
                    resolve(details)
                } else {
                    resolve('RETURN NOT INITIATED')
                }
            } else {
                resolve('NO TRANSACTIONS FOUND')
            }
        } catch (error) {
            await t.rollback()
            console.log('::: return-refund Transaction End:::')
            console.log(error)
            console.log('::: return-refund Transaction End:::')
            reject({
                type: 'ERROR',
                description: error
            })
        }
    })


}