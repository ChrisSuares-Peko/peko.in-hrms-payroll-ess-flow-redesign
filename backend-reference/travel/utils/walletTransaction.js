/* eslint-disable no-prototype-builtins */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-unused-vars */
const orders = require('../models/use-cases/order')
const order = require('../models/entities/order')
const wallet = require('../models/entities/wallet')
const walletTransaction = require('../models/entities/transaction')
const UserCoupons = require('../models/entities/userCoupons')
const sequelizeConfig = require("../configs/database/index");
const asyncHandler = require('../middlewares/async')
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
const {
    Op
} = require("sequelize");
const { findOneTransaction } = require('../models/use-cases/transaction');
const { findOneCoupon } = require('../models/use-cases/pekoCredits');
const { calculateDiscountResponse } = require('./calculateDiscount');
const { customLog } = require('./loggerHelper');

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
            transactionCategory,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            surcharge,
            reportData,
            subCorporateUserId,
            batchId,
            couponCode,
            corporateUserId,
            partnerId
        } = data
        const debitAmount = Number(amount)
        const debitSurcharge = Number(surcharge ?? 0)
        if (!Number.isFinite(debitAmount) || debitAmount <= 0 || !Number.isFinite(debitSurcharge) || debitSurcharge < 0) {
            customLog(null, 'error', { action: 'wallet:invalidDebitAmount', corporateTxnId, credentialId, serviceOperatorId, amount, surcharge })
            return ({
                error: 'INVALID AMOUNT'
            })
        }
        console.log(data)
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

        const grossAmount = parseFloat((debitAmount + debitSurcharge).toFixed(2))
        let coupon = null
        if (couponCode) {
            const couponDetails = await findOneCoupon({ couponCode, corporateUserId, serviceId: serviceOperatorId, partnerId })
            const couponData = couponDetails?.couponData
            if (!couponData) {
                customLog(null, 'info', { action: 'wallet:couponRejected', reason: 'not found', corporateTxnId, couponCode })
                return ({
                    error: 'INVALID COUPON CODE'
                })
            }
            if (grossAmount < Number(couponData.minimumPurchase || 0)) {
                customLog(null, 'info', { action: 'wallet:couponRejected', reason: 'minimum purchase', corporateTxnId, couponCode, grossAmount })
                return ({
                    error: 'COUPON MINIMUM PURCHASE NOT MET'
                })
            }
            const discount = Number(calculateDiscountResponse(couponData, grossAmount).data.discountAmount)
            if (!(discount > 0) || discount >= grossAmount) {
                customLog(null, 'info', { action: 'wallet:couponRejected', reason: 'discount out of range', corporateTxnId, couponCode, grossAmount, discount })
                return ({
                    error: 'INVALID COUPON CODE'
                })
            }
            coupon = {
                userCouponId: couponDetails.id || null,
                couponCodeId: couponDetails.id ? null : couponData.id,
                usageCount: couponData.usageCount,
                couponData,
                discount
            }
        }
        const netDebit = coupon ? parseFloat((grossAmount - coupon.discount).toFixed(2)) : grossAmount

        const result = await sequelizeConfig.transaction(async (t) => {
            const walletDetails = await wallet.findOne({
                where: {
                    credentialId
                },
                lock: t.LOCK.UPDATE,
                attributes: ['balance'],
                transaction: t
            })
            if (coupon?.couponCodeId) {
                const usedCount = await order.count({
                    where: { couponCodeId: coupon.couponCodeId, credentialId },
                    transaction: t
                })
                if (usedCount >= coupon.usageCount) {
                    throw 'COUPON_USAGE_LIMIT_EXCEEDED'
                }
            }
            if (coupon?.userCouponId) {
                const [claimedCount] = await UserCoupons.update(
                    { status: 'CLAIMED', claimedAt: new Date(), usedCouponData: { ...coupon.couponData, discountAmount: coupon.discount } },
                    {
                        where: { id: coupon.userCouponId, status: 'UNCLAIMED' },
                        transaction: t
                    }
                )
                if (!claimedCount) {
                    throw 'COUPON ALREADY CLAIMED'
                }
            }
            amount = grossAmount.toFixed(2)
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - netDebit) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------WALLET---------------')
            console.log("REQ_BODY", data)
            console.log("Corporate Initial Balance", walletDetails['balance'])
            console.log("Amount", amount)
            console.log("Corporate Cashback", corporateCashback)
            console.log("Corporate Final Balance", corporateFinalBalance)
            console.log('----------------WALLET--------------')
            if (!Number.isFinite(Number(corporateFinalBalance))) {
                throw 'INVALID AMOUNT'
            }
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
                subCorporateUserId,
                batchId,
                userCouponId: coupon?.userCouponId ?? null,
                couponCodeId: coupon?.couponCodeId ?? null,
                ...reportData
            }, {
                transaction: t
            });

            let transactionDetails = await walletTransaction.create({
                corporateTxnId: corporateTxnId,
                transactionDate: new Date(),
                transactionType: 'PAYMENT',
                debitAmount: netDebit.toFixed(2),
                creditAmount: corporateCashback,
                totalCashback: totalCashback,
                corporateCashback,
                systemCashback,
                transactionCategory,
                balance: corporateFinalBalance,
                remarks: 'PENDING',
                providerId: '',
                orderId: orderDetails.id,
                serviceOperatorId: serviceOperatorId,
                credentialId
            }, {
                transaction: t
            });
            return {
                corporateFinalBalance,
                corporateCashback,
                orderId: orderDetails.id,
                transactionId: transactionDetails.id,
                paymentMode: orderDetails.paymentMode,
                couponId: coupon?.userCouponId ?? null,
                couponDiscount: coupon?.discount ?? 0
            };
        });
        return result

    } catch (err) {
        console.log(err.message, err === "INSUFFICIENT WALLET BALANCE")
        if (['INSUFFICIENT WALLET BALANCE', 'INVALID AMOUNT', 'COUPON ALREADY CLAIMED', 'COUPON_USAGE_LIMIT_EXCEEDED'].includes(err)) {
            return ({
                error: err
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
            // Only set when caller passes it (e.g. bus bookings with coupon store pgAmount + couponCode here
            // so downloadTicket, getBookingDetails and cancellation refund can retrieve it later)
            if (data.paymentModeResponse) {
                orderDetails.paymentModeResponse = data.paymentModeResponse
            }
            customLog(null, "info", { message:"updated order response", data: orderDetails })
            await order.update(orderDetails, {
                where: {
                    corporateTxnId: { [Op.eq]: corporateTxnId }
                },
                transaction: t
            });
            await walletTransaction.update({
                providerId: data.providerId,
                remarks: data.message,
                status: data.status
            }, {
                where: {
                    corporateTxnId: { [Op.eq]: corporateTxnId },
                    remarks: { [Op.notLike]: 'REFUND%' }
                },
                transaction: t
            });
            return true;
        });
    } catch (err) {
        customLog(null, "error", { message:"error from update wallet transaction", data: err })
    }
}

exports.refundWalletTransaction = async (meta) => {
    const {
        corporateTxnId,
        partialRefund,
        couponId
    } = meta
    delete meta.corporateTxnId
    return new Promise(async (resolve, reject) => {
        const t = await sequelizeConfig.transaction({
            autocommit: false
        })
        try {
            console.log('::: refund Transaction Start:::')
            let tranStatus = 'REFUND',
                oldTranStatus = 'REFUNDED'
            let newTranData, tranDate = new Date()
            const data = await walletTransaction.findOne({
                where: {
                    corporateTxnId: String(corporateTxnId)
                },
                raw: true
            })
            if (data) {
                if (String(data.remarks || '').indexOf('REFUND') === 0) {
                    let response = 'ALREADY REFUNDED'
                    await t.rollback()
                    resolve(response)
                } else {
                    const corporateWalletData = await wallet.findOne({
                        where: {
                            credentialId: data.credentialId
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                    })
                    const lockedPayment = await walletTransaction.findOne({
                        where: {
                            id: data.id
                        },
                        attributes: ['remarks'],
                        lock: t.LOCK.UPDATE,
                        transaction: t,
                        raw: true
                    })
                    if (!lockedPayment || String(lockedPayment.remarks || '').indexOf('REFUND') === 0) {
                        await t.rollback()
                        customLog(null, 'info', { action: 'wallet:refundRaceSkipped', corporateTxnId })
                        return resolve('ALREADY REFUNDED')
                    }
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

                    if (couponId) {
                        await UserCoupons.update(
                            { status: 'UNCLAIMED', claimedAt: null, usedCouponData: null },
                            {
                                where: { id: couponId },
                                transaction: t
                            }
                        )
                    }

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
                    if (meta.hasOwnProperty('orderResponse')) {
                        updatedOrderData.orderResponse = meta.orderResponse
                    }

                    await order.update(updatedOrderData, {
                        where: {
                            corporateTxnId: String(corporateTxnId)
                        },
                        transaction: t
                    })
                    await walletTransaction.update({
                        remarks: oldTranStatus,
                        status: updatedOrderData.status
                    }, {
                        where: {
                            corporateTxnId: String(corporateTxnId),
                            remarks: {
                                [Op.ne]: tranStatus
                            }
                        },
                        transaction: t
                    })
                    await t.commit()
                    let walletDetails = {
                        corporateBalance: newTranData.balance,
                    }
                    console.log('::: refund Transaction End:::')
                    resolve(walletDetails)
                }
            } else {
                await t.rollback()
                resolve('NO TRANSACTIONS FOUND')
            }
        } catch (error) {
            await t.rollback()
            console.log('::: refund Transaction End:::')
            console.log(error)
            console.log('::: refund Transaction End:::')
            reject({
                type: 'ERROR',
                description: error
            })
        }
    })
}


const paymentRatioToTotal = (totalPay, cashPay, bankCardPay, refundAmount) => {
    if (!(totalPay > 0)) {
        return { cashRatio: 0, cardRatio: 0, returnRatio: 0 }; //avoid errors
    }
    const cashRatio = (cashPay / totalPay) * 100;
    const cardRatio = (bankCardPay / totalPay) * 100;
    let returnRatio = (refundAmount / totalPay) * 100
    if (returnRatio > 100) {
        returnRatio = 100
    }
    return { cashRatio, cardRatio, returnRatio };
};

exports.getPartialRefundDetails = async (params) => {
    // let walletAmount = 0, bankAmount = 0, cardAmount = 0, cashbackReturn = 0
    let { corporateTxnId, refundAmount } = params
    if (refundAmount <= 0) {
        return {
            status: true,
            walletRefund: 0,
            bankCardRefund: 0,
            refundPercentage: 0
        }
    }
    const transaction = await findOneTransaction({ corporateTxnId })
    const { order, debitAmount } = transaction
    let { amountInINR } = order

    //Find the ratio b/w cash and card/bank transactions
    let totalPay = parseFloat(amountInINR)
    let cashPay = parseFloat(debitAmount)
    let bankCardPay = parseFloat(totalPay - cashPay)
    const { cashRatio, cardRatio, returnRatio } = paymentRatioToTotal(totalPay, cashPay, bankCardPay, refundAmount)

    let cashRefund = parseFloat(((refundAmount * cashRatio) / 100).toFixed(2))
    let bankCardRefund = parseFloat(((refundAmount * cardRatio) / 100).toFixed(2))
    if (refundAmount > totalPay) {
        cashRefund = cashPay
        bankCardRefund = bankCardPay
    }

    console.table({ totalPay, cashPay, bankCardPay, cashRatio, cardRatio, refundAmount, returnRatio })
    return {
        status: true,
        refundAmount,
        walletRefund: cashRefund,
        bankCardRefund: bankCardRefund,
        refundPercentage: returnRatio
    }
}