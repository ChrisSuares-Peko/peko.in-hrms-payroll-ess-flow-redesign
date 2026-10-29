/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-async-promise-executor */
const orders = require('./../models/use-cases/order')
const order = require('./../models/entities/order')
const wallet = require('./../models/entities/wallet')
const walletTransaction = require('./../models/entities/transaction')
const sequelizeConfig = require("./../configs/database/index");
const asyncHandler = require('../middlewares/async')
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
const {
    Op
} = require("sequelize");
const { dispatchJournalRetry } = require('./bull/queue/accountingQueues');
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
            payCashback,
            paymentMode,
            transactionCategory,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            surcharge
        } = data
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

        const result = await sequelizeConfig.transaction(async (t) => {
            const walletDetails = await wallet.findOne({
                where: {
                    credentialId
                },
                lock: t.LOCK.UPDATE,
                attributes: ['balance'],
                transaction: t
            })
            amount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - parseFloat(amount)) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------WALLET---------------')
            console.log("REQ_BODY", data)
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
                credentialId
            }, {
                transaction: t
            });

            await walletTransaction.create({
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
                    corporateTxnId
                },
                transaction: t
            });
            await walletTransaction.update({
                providerId: data.providerId,
                remarks: data.message,
                status: data.status
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

exports.refundWalletTransaction = async (meta) => {
    const {
        corporateTxnId,
        registeredById
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
            // F-OTH-17: the guard against a double refund used to be an unlocked read of
            // transaction.remarks (a free-text field) checking for a 'REFUND' prefix — a plain
            // admin note added after a refund (order.js's updateTransactionById) could overwrite
            // that marker, silently reopening the order to a second refund, and the unlocked read
            // let two parallel requests both pass the check before either wrote back. The order's
            // own status column, read under a row lock in this same transaction, is the real,
            // tamper-resistant guard: a concurrent request now blocks until this one commits or
            // rolls back, and by then sees the updated status.
            const orderRow = await order.findOne({
                where: {
                    corporateTxnId
                },
                // Restricted to just what this check needs: the orders table has columns the
                // model no longer matches (e.g. pekoInvoiceDetails), which breaks an unrestricted
                // SELECT * against the real schema.
                attributes: ['status'],
                lock: t.LOCK.UPDATE,
                transaction: t
            })
            if (orderRow && orderRow.status === 'REFUNDED') {
                let response = 'ALREADY REFUNDED'
                await t.rollback();
                resolve(response)
            } else {
            const data = await walletTransaction.findOne({
                where: {
                    corporateTxnId
                },
                raw: true
            })
            if (data) {
                {
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
                    data.balance = parseFloat(corporateWalletData.balance) + parseFloat(data.debitAmount) - parseFloat(data.creditAmount)
                    data.debitAmount *= -1
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
                    updatedOrderData.orderResponse = meta.hasOwnProperty('orderResponse') ? meta.orderResponse : ''
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
                    console.log('::: refund Transaction End:::')
                    resolve(walletDetails)
                }
            } else {
                await t.rollback()
                resolve('NO TRANSACTIONS FOUND')
            }
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

    void dispatchJournalRetry({
        type: "walletTransfer",
        corporateTxnId: result.corporateTxnId,
        credentialId: data.credentialId,
        amount: data.amount,
        direction: data.type === "Credit" ? "credit" : "debit",
        occurredAt: result.transactionDate,
    }).catch((error) => {
        // The fund transfer has committed. The report exposes this as Not recorded and
        // lets an admin retry it once the accounting queue is available again.
        customLog(null, "error", {
            message: "Could not queue wallet transfer journal",
            corporateTxnId: result.corporateTxnId,
            error: error?.message,
        });
    });
    return result;
})


async function transferFund(data, t) {
    let {
        credentialId,
        amount,
        remarks,
        type,
        registeredById
    } = data
    // F-OTH-18: credentialId === registeredById used to silently mint funds — both wallet
    // updates below target the same row, and the second (crediting the destination)
    // overwrites the first (debiting the source) with no real debit ever persisting.
    if (String(credentialId) === String(registeredById)) {
        throw 'CANNOT TRANSFER TO THE SAME WALLET'
    }
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
    // F-OTH-18: these checks used to run AFTER both wallet.update() calls below, and only
    // checked corporateFinalBalance — the admin's own wallet (the actual money source in a
    // Credit transfer) was never checked at all, so it could go arbitrarily negative.
    if (corporateFinalBalance < 0) {
        throw 'INSUFFICIENT WALLET BALANCE'
    }
    if (adminFinalBalance < 0) {
        throw 'INSUFFICIENT ADMIN WALLET BALANCE'
    }
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
    let transactionDate = new Date()
    const corporateTransaction = await walletTransaction.create({
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
        credentialId,
        status: "SUCCESS"
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
        credentialId: registeredById,
        status: "SUCCESS"
    }, {
        transaction: t
    });
    return {
        corporateFinalBalance,
        adminFinalBalance,
        corporateTxnId: String(corporateTransaction.corporateTxnId),
        transactionDate,
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
            // F-OTH-19: this checked lowercase 'debit'/'credit' while the balance math above
            // (modifiedAmount) checks capitalized 'Debit' — real callers always send
            // 'Debit'/'Credit' (see Peko-IN-Frontend's transferTypes), so this ledger entry
            // recorded the opposite of what actually happened to the wallet on every call.
            transactionType: type === "Debit" ? 'DEBIT' : "CREDIT",
            creditAmount: type === "Debit" ? 0 : amount,
            debitAmount: type === "Debit" ? amount : 0,
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

exports.createManualWalletTransaction = async (data) => {
    try {
        let {
            credentialId,
            amount,
            surcharge,
            account,
            // service , 
            serviceOperatorId,
            merchantCommission,
            adminCommission,
            transactionId,
            // orderId ,
            providerId,
            adminCredentialId,
            categoryName,
            remarks
        } = data

        const isDuplicate = await orders.findOneOrder({
            corporateTxnId: transactionId
        })
        if (isDuplicate) {
            return ({
                error: "DUPLICATE TRANSACTION ID"
            })
        }

        const debitAmount = amount

        const corporateCashback = merchantCommission

        let adminCashback = adminCommission

        const totalCashback = parseFloat(adminCommission) + parseFloat(merchantCommission)

        const result = await sequelizeConfig.transaction(async (t) => {
            // corporate wallet updation //
            const walletDetails = await wallet.findOne({
                where: {
                    credentialId: credentialId
                },
                lock: t.LOCK.UPDATE,
                attributes: ['balance'],
                transaction: t
            })
            // F-OTH-19: defensive floor even with validation upstream — Math.abs guarantees a
            // negative debitAmount can never flip this subtraction into a credit.
            let Amount = Math.abs(parseFloat(debitAmount)).toFixed(2)
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - parseFloat(Amount)) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------WALLET---------------')
            console.log("REQ_BODY", data)
            console.log("Corporate Initial Balance", walletDetails['balance'])
            console.log("Amount", Amount)
            console.log("Corporate Cashback", corporateCashback)
            console.log("Corporate Final Balance", corporateFinalBalance)
            console.log('----------------WALLET--------------')
            if (corporateFinalBalance < 0) {
                return ({
                    error: "INSUFFICIENT WALLET BALANCE"
                })
            }
            await wallet.update({
                balance: corporateFinalBalance
            }, {
                where: {
                    credentialId: credentialId
                },
                transaction: t
            })

            //admin wallet updation//
            const adminWallet = await wallet.findOne({
                where: {
                    credentialId: adminCredentialId
                },
                lock: t.LOCK.UPDATE,
                attributes: ['balance'],
                transaction: t
            })
            adminCashback = (parseFloat(adminCashback)).toFixed(2)
            let adminFinalBalance = parseFloat((parseFloat(adminWallet['balance'])) + parseFloat(adminCashback)).toFixed(4)

            await wallet.update({
                balance: adminFinalBalance
            }, {
                where: {
                    credentialId: adminCredentialId
                },
                transaction: t
            })

            let orderDetails = await order.create({
                corporateTxnId: transactionId,
                providerId: providerId,
                operatorId: uuidv4(),
                corporateId: credentialId,
                transactionDate: new Date(),
                amountInINR: debitAmount,
                baseAmount: debitAmount,
                baseCurrency: 'INR',
                exchangeRate: 1,
                status: "SUCCESS",
                paymentMode: 'WALLET',
                accountNo: account,
                surcharge: surcharge,
                message: remarks,
                serviceOperatorId,
                credentialId
            }, {
                transaction: t,
                // the orders model defines pekoInvoiceDetails, which doesn't exist on the real
                // table (pre-existing schema drift, unrelated to this function) — restricting
                // the insert to the columns actually set here avoids writing that column.
                fields: [
                    'corporateTxnId', 'providerId', 'operatorId', 'corporateId', 'transactionDate',
                    'amountInINR', 'baseAmount', 'baseCurrency', 'exchangeRate', 'status',
                    'paymentMode', 'accountNo', 'surcharge', 'message', 'serviceOperatorId', 'credentialId',
                ],
            });

            await walletTransaction.create({
                corporateTxnId: transactionId,
                transactionDate: new Date(),
                transactionType: 'PAYMENT',
                debitAmount: debitAmount,
                creditAmount: corporateCashback,
                totalCashback: totalCashback,
                corporateCashback,
                systemCashback: adminCashback,
                transactionCategory: categoryName,
                balance: corporateFinalBalance,
                remarks: remarks,
                status: "SUCCESS",
                providerId: providerId,
                orderId: orderDetails.id,
                serviceOperatorId,
                credentialId
            }, {
                transaction: t
            });
            return {
                corporateFinalBalance,
                corporateCashback,
                adminFinalBalance
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