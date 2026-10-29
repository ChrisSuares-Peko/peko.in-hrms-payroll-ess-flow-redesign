const orders = require('./../models/use-cases/order')
const order = require('./../models/entities/order')
const wallet = require('./../models/entities/wallet')
const walletTransaction = require('./../models/entities/transaction')
const sequelizeConfig = require("./../configs/database/index");
const {
    v4: uuidv4,
} = require('uuid');
exports.createLeanTransaction = async (data) => {
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
            orderAmount,
            commissionType,
            cashbackType,
            providerCommission,
            leanResponse,
            leanAmount,
            transactionCategory,
            surcharge,
            reportData
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
            let corporateFinalBalance = parseFloat((parseFloat(walletDetails['balance']) - ((parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(leanAmount))) + parseFloat(corporateCashback)).toFixed(4)
            console.log('---------------LEAN---------------')
            console.log("REQ_BODY", data)
            console.log("Corporate Initial Balance", walletDetails['balance'])
            console.log("Amount", orderAmount)
            console.log("Lean Amount", leanAmount)
            console.log("Corporate Cashback", corporateCashback)
            console.log("Corporate Final Balance", corporateFinalBalance)
            console.log('----------------LEAN--------------')
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
                paymentMode: (parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(leanAmount) != 0 ? 'BANK + WALLET' : 'BANK',
                paymentModeResponse: JSON.stringify({
                    ...leanResponse,
                    leanAmount
                }),
                accountNo,
                surcharge,
                message: '',
                serviceOperatorId,
                credentialId,
                ...reportData
            }, {
                transaction: t
            });

            await walletTransaction.create({
                corporateTxnId: corporateTxnId,
                transactionDate: new Date(),
                transactionType: 'PAYMENT',
                debitAmount: (parseFloat(orderAmount) + (parseFloat(surcharge))) - parseFloat(leanAmount),
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
                commissionDetails: {
                    providerCommissionType: commissionType,
                    providerCommission,
                    cashbackType,
                    corporateCashback,
                    surcharge
                }
            }, {
                transaction: t
            });
            return {
                corporateFinalBalance,
                corporateCashback,
                orderId: orderDetails.id,
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