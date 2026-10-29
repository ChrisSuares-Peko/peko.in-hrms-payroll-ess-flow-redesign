const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR } = require('../../constants/messages')
const { LEDGER_DIRECTION, ENTRY_TYPE_META, TOPUP_HISTORY_TYPES } = require('../../constants/ledger')
const { findAndCountByCorporate } = require('../../models/use-cases/corporateCardLedger')
const { sumCardLimits } = require('../../models/use-cases/cardIssuance')
const { findByCorporate: findCorporateApplication } = require('../../models/use-cases/corporateCardAdminApplication')
const { walletBalance } = require('../../services/walletBalance')
const { parsePaging, round2, last4 } = require('../../utils/cardHelpers')

const buildFundingAccount = (application) => {
    const va = application?.virtualAccount
    if (!va || !va.accountNumber) return null
    return {
        maskedAccountNumber: last4(va.accountNumber),
        ifsc: va.ifsc || null,
    }
}

exports.getWallet = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    try {
        const [balance, limits, application] = await Promise.all([
            walletBalance({ corporateId }),
            sumCardLimits({ corporateId }),
            findCorporateApplication(corporateId),
        ])

        return res.status(200).json({
            status: true,
            message: 'Wallet fetched.',
            data: {
                balance,
                totalCardLimits: round2(limits.total),
                cardCount: limits.count,
                fundingAccount: buildFundingAccount(application),
            },
            responseCode: '000',
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardWallet] Failed to fetch wallet', error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }
})

exports.getFundingAccount = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    try {
        const application = await findCorporateApplication(corporateId)
        const va = application?.virtualAccount
        const fundingAccount =
            va && va.accountNumber && va.ifsc
                ? {
                      beneficiaryName: va.beneficiaryName || null,
                      accountNumber: va.accountNumber,
                      ifsc: va.ifsc,
                      bankName: va.bankName || null,
                      bankAddress: va.bankAddress || null,
                      paymentReference: va.paymentReference || null,
                  }
                : null

        return res.status(200).json({
            status: true,
            message: 'Funding account fetched.',
            data: { fundingAccount },
            responseCode: '000',
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardWallet] Failed to fetch funding account', error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }
})

exports.listWalletTopUps = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const requestedType = typeof req.query.type === 'string' ? req.query.type.trim().toUpperCase() : ''
    if (requestedType && !TOPUP_HISTORY_TYPES.includes(requestedType)) {
        return next(new ErrorResponse('Invalid top-up type filter.', 400))
    }
    const { limit, offset } = parsePaging(req)

    try {
        const { count, rows } = await findAndCountByCorporate({
            corporateId,
            direction: LEDGER_DIRECTION.IN,
            entryTypes: requestedType ? [requestedType] : TOPUP_HISTORY_TYPES,
            limit,
            offset,
        })
        const data = rows.map((r) => ({
            id: r.id,
            date: r.occurredAt,
            reference: r.reference || '',
            method: ENTRY_TYPE_META[r.entryType]?.label || r.entryType,
            status: 'Completed',
            amount: Number(r.amount),
        }))
        return res.status(200).json({
            status: true,
            message: 'Wallet top-ups fetched.',
            data: { count, rows: data },
            responseCode: '000',
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: '[CardWallet] Failed to list wallet top-ups', error: err?.message }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }
})
