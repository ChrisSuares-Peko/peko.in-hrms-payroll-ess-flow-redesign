const { sumByDirection } = require('../models/use-cases/corporateCardLedger')
const { getAuthorizedSpendTotal } = require('../models/use-cases/cardTransaction')
const { round2 } = require('../utils/cardHelpers')

const walletBalanceParts = async ({ corporateId, transaction }) => {
    const [ledger, spendTotal] = await Promise.all([
        sumByDirection({ corporateId, transaction }),
        getAuthorizedSpendTotal({ corporateId, transaction }),
    ])
    return { ledger, spendTotal, balance: round2(ledger.in - ledger.out - spendTotal) }
}

const walletBalance = async ({ corporateId, transaction }) =>
    (await walletBalanceParts({ corporateId, transaction })).balance

module.exports = { walletBalance, walletBalanceParts }
