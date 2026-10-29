const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR } = require('../../constants/messages')
const {
    AGREEMENT_SIGN_METHOD,
    AGREEMENT_FIELD_LABELS,
    ESIGN_STATUS,
    labelsFor,
} = require('../../constants/corporateAgreement')
const {
    findByCorporate: findApplication,
    upsertByCorporate: upsertApplication,
} = require('../../models/use-cases/corporateCardAdminApplication')
const {
    findByCorporate: findAgreement,
    upsertByCorporate: upsertAgreement,
} = require('../../models/use-cases/corporateCardAgreement')
const { templateExists, TEMPLATE_PATH } = require('../../services/corporateAgreementDocument')
const { storeAgreementArtifacts } = require('../../services/agreementArtifacts')
const { dispatch: dispatchForEsign, refreshEsignStatus } = require('../../services/agreementEsign')
const sharedDirectory = require('../../utils/sharedDirectory')
const { AGREEMENT_FIELDS, REQUIRED_FIELDS, missingRequired } = require('../corporate/corporateAgreement')

const corporateFolder = async (corporateId, req) => {
    try {
        const corporates = await sharedDirectory.getCorporatesByIds([corporateId], req)
        const username = corporates.get(String(corporateId))?.credential?.username
        if (username) return username
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Could not resolve the corporate username for the document path',
            corporateId,
            error: error?.message,
        })
    }
    return corporateId
}

const GROUPS = [
    { key: 'entity', label: 'Entity Details', fields: ['entityName'] },
    {
        key: 'registered',
        label: 'Registered Address',
        fields: ['regAddress', 'regCity', 'regState', 'regPinCode', 'regTelephone', 'regEmail'],
    },
    {
        key: 'billing',
        label: 'Billing Address',
        fields: ['billSameAsRegistered', 'billAddress', 'billCity', 'billState', 'billPinCode'],
    },
    {
        key: 'registration',
        label: 'Registration Details',
        fields: ['gstNumber', 'panNumber', 'cinLlpNumber', 'tanNumber', 'addressProofSameAsGst'],
    },
    {
        key: 'bank',
        label: 'Bank Details',
        fields: ['bankName', 'bankBranch', 'bankAccountNumber', 'bankIfsc', 'bankCity'],
    },
    {
        key: 'official',
        label: 'Contact for Official Communication',
        fields: ['officialContactName', 'officialContactMobile', 'officialContactEmail'],
    },
    {
        key: 'salesperson',
        label: 'Salesperson Contact',
        fields: ['salespersonName', 'salespersonMobile', 'salespersonEmail'],
    },
    {
        key: 'signatory',
        label: 'Authorised Signatory',
        fields: ['signatoryName', 'signatoryContact', 'signatoryEmail', 'signatoryIsPep'],
    },
]


const BOOLEAN_FIELDS = new Set(['billSameAsRegistered', 'addressProofSameAsGst', 'signatoryIsPep'])
const REQUIRED = new Set(REQUIRED_FIELDS)

const presentValue = (row, field) => {
    if (BOOLEAN_FIELDS.has(field)) return row[field] === true ? 'Yes' : 'No'
    const value = row[field]
    return value === null || value === undefined || value === '' ? null : String(value)
}

/**
 * Grouped as the corporate filled it in, so a reviewer can read the declared bank account and signatory
 * against the uploaded cheque and PAN instead of opening the .docx and reading it by eye.
 */
const serializeForReview = (row) => {
    if (!row) return null
    return GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        fields: group.fields
            .filter((field) => AGREEMENT_FIELDS.includes(field))
            .map((field) => ({
                key: field,
                label: AGREEMENT_FIELD_LABELS[field] || field,
                value: presentValue(row, field),
                required: REQUIRED.has(field),
            })),
    }))
}

exports.getCorporateAgreementForAdmin = asyncHandler(async (req, res, next) => {
    const { corporateId } = req.params
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))

    const [agreement, application] = await Promise.all([
        findAgreement(corporateId),
        findApplication(corporateId),
    ])

    const current = await refreshEsignStatus({ application, req })
    const signedAgreement = current === application ? agreement : await findAgreement(corporateId)

    return res.status(200).json({
        status: true,
        message: 'Corporate agreement fetched.',
        data: {
            groups: serializeForReview(agreement),
            isDraft: agreement ? agreement.isDraft !== false : null,
            missingFields: agreement ? missingRequired(agreement) : null,
            signMethod: current?.agreementSignMethod || null,
            esignStatus: current?.esignStatus || null,
            esignReference: current?.esignReference || null,
            esignSentAt: current?.esignSentAt || null,
            esignSignedAt: current?.esignSignedAt || null,
            esignFailureReason: current?.esignFailureReason || null,
            generatedDocumentKey: agreement?.generatedDocumentKey || null,
            generatedPdfKey: agreement?.generatedPdfKey || null,
            signedPdfKey: signedAgreement?.signedPdfKey || null,
            canResend: !!agreement && !missingRequired(agreement).length,
            updatedAt: agreement?.updatedAt || null,
        },
        responseCode: '000',
    })
})

/**
 * POST /system_user/:id/corporate-cards/corporate-agreement/:corporateId/regenerate
 *
 * Re-renders the agreement from the details on file and sends it out again, for when the previous attempt
 * failed or the stored copy is wrong. The previous envelope is voided by the reference moving on: a status
 * arriving for it no longer matches esignReference and is ignored.
 */
exports.regenerateCorporateAgreement = asyncHandler(async (req, res, next) => {
    const { corporateId } = req.params
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))

    const agreement = await findAgreement(corporateId)
    if (!agreement) {
        return next(new ErrorResponse('This corporate has not filled in its agreement details yet.', 400))
    }

    const missing = missingRequired(agreement)
    if (missing.length) {
        return next(
            new ErrorResponse(`The agreement details are incomplete: ${labelsFor(missing)}.`, 400)
        )
    }

    if (!templateExists()) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Admin regenerate failed — template file is missing',
            path: TEMPLATE_PATH,
        })
        return next(new ErrorResponse('The agreement template is not available right now.', 503))
    }

    const application = await findApplication(corporateId)
    const folder = await corporateFolder(corporateId, req)

    let artifacts
    try {
        artifacts = await storeAgreementArtifacts({
            corporateId,
            folder,
            agreement,
            extra: {
                businessType: application?.businessType,
                kybReference: application?.kybReference,
                agreementDate: new Date().toISOString().slice(0, 10),
            },
            previous: agreement,
            req,
        })
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateAgreement] Admin regenerate could not produce the agreement',
            error: error?.message,
        })
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const saved = await upsertAgreement(corporateId, { isDraft: false, generatedDocumentKey: artifacts.generatedDocumentKey, generatedPdfKey: artifacts.generatedPdfKey })
    await upsertApplication(corporateId, {
        agreementSignMethod: AGREEMENT_SIGN_METHOD.E_SIGN,
        esignStatus: ESIGN_STATUS.PENDING_DISPATCH,
        esignReference: null,
        esignSigningLink: null,
        esignSignedAt: null,
    })

    await artifacts.discardSuperseded()

    customLog(req?.LogTraceId, 'info', {
        message: '[CorporateAgreement] Agreement re-rendered by a system user, dispatching again',
        corporateId,
        actor: req.user?.username || req.user?.id || null,
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
        message: 'The agreement has been regenerated and sent for e-signature.',
        data: { esignStatus: ESIGN_STATUS.SENT, esignSigningLink: dispatched.signingLink },
        responseCode: '000',
    })
})

exports.serializeForReview = serializeForReview
