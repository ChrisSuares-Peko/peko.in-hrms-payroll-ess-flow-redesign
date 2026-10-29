const wallet = require("../entities/wallet")
const walletTransaction = require('../../models/entities/transaction')


exports.depositToWallet= async(data, t) =>{
    let {
        credentialId,
        amount,
        remarks,
        corporateTxnId
    } = data
    const corporateWallet = await wallet.findOne({
        where: {
            credentialId
        },
        lock: t.LOCK.UPDATE,
        attributes: ['balance'],
        transaction: t
    })

    let corporateFinalBalance = parseFloat(parseFloat(corporateWallet['balance']) + parseFloat(amount)).toFixed(4)

    await wallet.update({
        balance: corporateFinalBalance
    }, {
        where: {
            credentialId
        },
        transaction: t
    })

    let transactionDate = new Date()
    await walletTransaction.create({
        corporateTxnId,
        transactionDate: transactionDate,
        transactionCategory: 'RECHARGE WALLET',
        transactionType: 'CREDIT',
        creditAmount:  amount ,
        debitAmount:  '0',
        totalCashback: 0,
        corporateCashback: 0,
        systemCashback: 0,
        balance: corporateFinalBalance,
        remarks,
        credentialId,
        status: "SUCCESS"
    }, {
        transaction: t
    });

    return {
        status: true,
        corporateFinalBalance,
    }
}