const asyncHandler = require('../../middlewares/async')
const { customLog } = require('../../utils/loggerHelper')
const { ESIGN_STATUS } = require('../../constants/corporateAgreement')
const { applyTerminalStatus } = require('../../services/agreementEsign')

const FAILURE_REASONS = {
    DECLINED: 'The authorised signatory declined the agreement.',
    EXPIRED: 'The e-signature request expired before it was signed.',
}

const ack = (res, data) =>
    res.status(200).json({ status: true, message: 'Success', data, responseCode: '000' })

exports.updateAgreementEsignStatus = asyncHandler(async (req, res) => {
    const { corporateId, epakId, status, signedPdfBase64, signedAt, reason } = req.body || {}

    customLog(req?.LogTraceId, 'info', {
        message: '[eSign Callback] Agreement status received',
        corporateId,
        epakId,
        status,
        reason,
        hasSignedPdf: Boolean(signedPdfBase64),
    }, 'CONSOLE')

    if (!corporateId || !epakId || !status) {
        return res.status(400).json({
            status: false,
            message: 'corporateId, epakId and status are required.',
            data: {},
            responseCode: '001',
        })
    }

    const normalized = String(status).toUpperCase() === ESIGN_STATUS.SIGNED
        ? ESIGN_STATUS.SIGNED
        : ESIGN_STATUS.FAILED

    const result = await applyTerminalStatus({
        corporateId: Number(corporateId),
        epakId: String(epakId),
        status: normalized,
        signedPdfBase64: signedPdfBase64 || null,
        signedAt: signedAt || null,
        reason: FAILURE_REASONS[reason] || reason || null,
        req,
    })

    return ack(res, result)
})
