const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR } = require('../../constants/messages')
const { AGREEMENT_SIGN_METHOD, ESIGN_STATUS, labelsFor } = require('../../constants/corporateAgreement')
const { canModifyKybDocuments } = require('../../constants/corporateCardApplication')
const { storeAgreementArtifacts } = require('../../services/agreementArtifacts')
const { dispatch: dispatchForEsign, refreshEsignStatus } = require('../../services/agreementEsign')
const { findByCorporate: findApplication, upsertByCorporate: upsertApplication } = require('../../models/use-cases/corporateCardAdminApplication')
const { findByCorporate: findAgreement, upsertByCorporate: upsertAgreement } = require('../../models/use-cases/corporateCardAgreement')
const {
    DOCX_MIME,
    DOWNLOAD_FILENAME,
    TEMPLATE_PATH,
    templateExists,
} = require('../../services/corporateAgreementDocument')

const AGREEMENT_FIELDS = [
    'entityName',
    'regAddress', 'regCity', 'regState', 'regPinCode', 'regTelephone', 'regEmail',
    'billSameAsRegistered', 'billAddress', 'billCity', 'billState', 'billPinCode',
    'gstNumber', 'panNumber', 'cinLlpNumber', 'tanNumber', 'addressProofSameAsGst',
    'bankName', 'bankBranch', 'bankAccountNumber', 'bankIfsc', 'bankCity',
    'officialContactName', 'officialContactMobile', 'officialContactEmail',
    'salespersonName', 'salespersonMobile', 'salespersonEmail',
    'signatoryName', 'signatoryContact', 'signatoryEmail', 'signatoryIsPep',
]

const BOOLEAN_FIELDS = new Set(['billSameAsRegistered', 'addressProofSameAsGst', 'signatoryIsPep'])

const REQUIRED_FIELDS = [
    'entityName',
    'regAddress', 'regCity', 'regState', 'regPinCode', 'regTelephone', 'regEmail',
    'billAddress', 'billCity', 'billState', 'billPinCode',
    'gstNumber', 'panNumber',
    'bankName', 'bankBranch', 'bankAccountNumber', 'bankIfsc', 'bankCity',
    'officialContactName', 'officialContactMobile', 'officialContactEmail',
    'salespersonName', 'salespersonMobile', 'salespersonEmail',
    'signatoryName', 'signatoryContact', 'signatoryEmail',
]

/**
 * Only the known fields, so a caller cannot set isDraft, generatedDocumentKey or corporateId.
 *
 * Non-strings become empty rather than being stringified: `String(null)` is 'null' and `String({})` is
 * '[object Object]', both truthy, so they satisfied the required check and were rendered verbatim into the
 * agreement a signatory then signed.
 */
const pickAgreementFields = (body = {}) =>
    AGREEMENT_FIELDS.reduce((fields, key) => {
        if (body[key] === undefined) return fields
        if (BOOLEAN_FIELDS.has(key)) return { ...fields, [key]: body[key] === true }
        const value = body[key]
        const text = typeof value === 'string' ? value.trim() : (typeof value === 'number' ? String(value) : '')
        return { ...fields, [key]: text }
    }, {})

const missingRequired = (values) => {
    const sameAsRegistered = values.billSameAsRegistered === true
    return REQUIRED_FIELDS.filter((key) => {
        if (sameAsRegistered && key.startsWith('bill')) return false
        return !values[key]
    })
}

const serializeAgreement = (row) => {
    if (!row) return null
    return AGREEMENT_FIELDS.reduce(
        (out, key) => ({ ...out, [key]: row[key] ?? (BOOLEAN_FIELDS.has(key) ? false : null) }),
        { corporateId: row.corporateId, isDraft: row.isDraft !== false, updatedAt: row.updatedAt }
    )
}

const serializeEsign = (application) => ({
    signMethod: application?.agreementSignMethod || null,
    esignStatus: application?.esignStatus || null,
    esignSigningLink: application?.esignSigningLink || null,
    esignSentAt: application?.esignSentAt || null,
    esignSignedAt: application?.esignSignedAt || null,
    esignFailureReason: application?.esignFailureReason || null,
})

/**
 * GET /corporate/:corporateId/corporate-cards/kyb-status/agreement
 */
exports.getAgreement = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const [agreement, application] = await Promise.all([
        findAgreement(corporateId),
        findApplication(corporateId),
    ])

    const current = await refreshEsignStatus({ application, req })

    return res.status(200).json({
        status: true,
        message: 'Corporate agreement fetched.',
        data: {
            agreement: serializeAgreement(agreement),
            ...serializeEsign(current),
            templateAvailable: templateExists(),
        },
        responseCode: '000',
    })
})

/**
 * GET /corporate/:corporateId/corporate-cards/kyb-status/agreement/template
 *
 * The blank template for the upload-signed-copy route. Streamed through an authenticated route rather
 * than linking the static file, so the browser gets a real filename and the download is attributable.
 */
exports.downloadAgreementTemplate = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    if (!templateExists()) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Template file is missing',
            path: TEMPLATE_PATH,
        })
        return next(new ErrorResponse('The agreement template is not available right now.', 503))
    }

    res.setHeader('Content-Type', DOCX_MIME)
    res.setHeader('Content-Disposition', `attachment; filename="${DOWNLOAD_FILENAME}"`)
    return res.sendFile(TEMPLATE_PATH)
})


const refuseIfSubmitted = async (corporateId, next) => {
    const application = await findApplication(corporateId)
    if (canModifyKybDocuments(application)) return null
    next(
        new ErrorResponse(
            'Your KYB application has already been submitted, so the agreement can no longer be changed.',
            400
        )
    )
    return application
}

/**
 * PUT /corporate/:corporateId/corporate-cards/kyb-status/agreement
 *
 * Saves the agreement details as a draft on every call, so the "your progress is saved" promise holds
 * without the corporate having completed the form.
 */
exports.saveAgreement = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    if (await refuseIfSubmitted(corporateId, next)) return undefined

    const fields = pickAgreementFields(req.body)
    const saved = await upsertAgreement(corporateId, { ...fields, isDraft: true })

    return res.status(200).json({
        status: true,
        message: 'Agreement details saved.',
        data: { agreement: serializeAgreement(saved) },
        responseCode: '000',
    })
})

/**
 * POST /corporate/:corporateId/corporate-cards/kyb-status/agreement/sign-method
 */
exports.setSignMethod = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const method = typeof req.body?.signMethod === 'string' ? req.body.signMethod.trim().toUpperCase() : ''
    if (!Object.values(AGREEMENT_SIGN_METHOD).includes(method)) {
        return next(new ErrorResponse('Invalid signing method.', 400))
    }

    await upsertApplication(corporateId, { agreementSignMethod: method })

    return res.status(200).json({
        status: true,
        message: 'Signing method saved.',
        data: { signMethod: method },
        responseCode: '000',
    })
})

/**
 * POST /corporate/:corporateId/corporate-cards/kyb-status/agreement/send-for-esign
 *
 * Completes the agreement, renders the filled .docx from the committed template, and records that the
 * document is waiting to go out for signature.
 *
 * The provider call itself is deliberately not wired yet: nothing is claimed to have been sent. The
 * status lands on PENDING_DISPATCH so the pending work is visible in the data rather than implied by a
 * screen, and so wiring the provider later is a send plus a status change, not a re-model.
 */
exports.sendAgreementForEsign = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    if (await refuseIfSubmitted(corporateId, next)) return undefined

    const fields = pickAgreementFields(req.body)
    const existing = await findAgreement(corporateId)
    const merged = { ...(existing?.dataValues || existing || {}), ...fields }

    const missing = missingRequired(merged)
    if (missing.length) {
        return next(new ErrorResponse(`Please complete the agreement details: ${labelsFor(missing)}.`, 400))
    }

    if (!templateExists()) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Cannot render — template file is missing',
            path: TEMPLATE_PATH,
        })
        return next(new ErrorResponse('The agreement template is not available right now.', 503))
    }

    const application = await findApplication(corporateId)

    let artifacts
    try {
        artifacts = await storeAgreementArtifacts({
            corporateId,
            folder: req.user?.username,
            agreement: merged,
            extra: {
                businessType: application?.businessType,
                kybReference: application?.kybReference,
                agreementDate: new Date().toISOString().slice(0, 10),
            },
            previous: existing || {},
            req,
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Could not produce the agreement for signature',
            error: error?.message,
        })
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const saved = await upsertAgreement(corporateId, { ...fields, isDraft: false, generatedDocumentKey: artifacts.generatedDocumentKey, generatedPdfKey: artifacts.generatedPdfKey })
    await upsertApplication(corporateId, {
        agreementSignMethod: AGREEMENT_SIGN_METHOD.E_SIGN,
        esignStatus: ESIGN_STATUS.PENDING_DISPATCH,
    })

    await artifacts.discardSuperseded()

    customLog(req?.LogTraceId, 'info', {
        message: '[CorporateAgreement] Agreement rendered and stored, dispatching for e-signature',
        corporateId,
    })

    let dispatched
    try {
        dispatched = await dispatchForEsign({
            corporateId,
            application: await findApplication(corporateId),
            agreement: saved,
            req,
        })
    } catch (error) {
        return next(error)
    }

    return res.status(200).json({
        status: true,
        message: `Your agreement has been sent to ${saved.signatoryEmail} for e-signature.`,
        data: {
            agreement: serializeAgreement(saved),
            esignStatus: ESIGN_STATUS.SENT,
            esignSigningLink: dispatched.signingLink,
        },
        responseCode: '000',
    })
})

exports.AGREEMENT_FIELDS = AGREEMENT_FIELDS
exports.REQUIRED_FIELDS = REQUIRED_FIELDS
exports.pickAgreementFields = pickAgreementFields
exports.missingRequired = missingRequired
