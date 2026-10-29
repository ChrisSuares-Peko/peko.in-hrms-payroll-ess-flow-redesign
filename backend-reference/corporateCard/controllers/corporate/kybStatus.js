const crypto = require('crypto')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { KYB_STATUS, KYB_SUBMISSION_ALERT_EMAILS } = require('../../constants/corporateCardApplication')
const {
    AGREEMENT_DOCUMENT_NAMES,
    ALL_DOCUMENT_NAMES,
    SYSTEM_DOCUMENT_NAMES,
    BUSINESS_TYPES,
    BUSINESS_TYPE_CHECKLISTS,
    REVIEWABLE_DOCUMENT_NAMES,
    checklistFor,
    serializeDocument,
} = require('../../constants/kybDocuments')
const { AGREEMENT_SIGN_METHOD, ESIGN_STATUS } = require('../../constants/corporateAgreement')
const { DOC } = require('../../constants/kybDocuments')
const { getMaxSizeKbMap, getTotalLimitsKb } = require('../../services/documentSizeLimits')
const { findByCorporate, upsertByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const { delectDocfiles, findAllCorporateDocuments, sumSizeBytes } = require('../../models/use-cases/corporateDocuments')
const { last4, actorCredentialId } = require('../../utils/cardHelpers')
const { customLog } = require('../../utils/loggerHelper')
const { getSelfCorporate } = require('../../utils/sharedDirectory')
const { email: sendEmail } = require('../../utils/emailer')
const { kybSubmittedAdminTemplate, reviewDayLabel } = require('../../utils/kybStatusEmailTemplate')

const businessTypeLabelOf = (businessType) =>
    BUSINESS_TYPE_CHECKLISTS.find((entry) => entry.value === businessType)?.label || businessType || null

const alertAdminsOfSubmission = async (req, corporateId, saved) => {
    try {
        const emails = KYB_SUBMISSION_ALERT_EMAILS.filter(Boolean)
        if (!emails.length) return

        let corporate = null
        try {
            corporate = await getSelfCorporate(req)
        } catch (lookupError) {
            customLog(req?.LogTraceId, 'error', {
                action: 'corporateCard:kybSubmitted:corporateLookupFailed',
                message: '[KybStatus] Could not resolve the corporate for the KYB submission alert',
                corporateId,
                error: lookupError?.message,
            }, 'CONSOLE')
        }

        const companyName = corporate?.companyName || corporate?.contactPersonName || `Corporate #${corporateId}`
        const body = kybSubmittedAdminTemplate({
            companyName,
            contactPersonName: corporate?.contactPersonName,
            contactEmail: corporate?.email,
            contactMobile: corporate?.mobileNo,
            kybReference: saved?.kybReference,
            businessTypeLabel: businessTypeLabelOf(saved?.businessType),
            submittedOn: reviewDayLabel(saved?.updatedAt || new Date()),
        })

        sendEmail(
            req?.LogTraceId,
            emails,
            `New KYB application submitted - ${companyName}`,
            body
        )

        customLog(req?.LogTraceId, 'info', {
            action: 'corporateCard:kybSubmitted:alertSent',
            message: '[KybStatus] KYB submission alert dispatched',
            corporateId,
            kybReference: saved?.kybReference || null,
            recipientCount: emails.length,
        }, 'CONSOLE')
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            action: 'corporateCard:kybSubmitted:alertFailed',
            message: '[KybStatus] Could not send the KYB submission alert',
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
    }
}
const { sendCorporateSupportEmail } = require('../../services/supportEmails')
const { applicationNotActiveTemplate } = require('../../utils/supportEmailTemplates')
const { SUPPORT_EMAIL } = require('../../constants/supportEmails')

const canResubmit = (existing) =>
    !existing || existing.kybStatus === KYB_STATUS.REJECTED || (existing.kybStatus === KYB_STATUS.PENDING && !existing.kybReference)

const agreementBlockingSubmission = async (corporateId, existing) => {
    if (existing?.agreementSignMethod === AGREEMENT_SIGN_METHOD.UPLOAD) {
        const uploaded = await findAllCorporateDocuments({
            corporateUserId: corporateId,
            documentNames: [DOC.CORPORATE_AGREEMENT.documentName],
        })
        if (!uploaded?.length) return 'Upload the signed corporate agreement before submitting your KYB.'
        return null
    }

    if (existing?.esignStatus === ESIGN_STATUS.SIGNED) return null

    return 'Complete the e-signature on your corporate agreement before submitting your KYB.'
}

const asMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/**
 * The vendor receives every document as one pack, so the pack has a ceiling the per-document limits
 * cannot enforce on their own. Documents uploaded before sizes were recorded count as unknown rather
 * than zero, so a corporate is never told a total we cannot actually stand behind.
 */
const totalSizeBlockingSubmission = async (corporateId, req) => {
    try {
        const { totalUploadKb } = await getTotalLimitsKb(req?.LogTraceId)
        const limitBytes = totalUploadKb * 1024
        const { totalBytes, unknown } = await sumSizeBytes({
            corporateUserId: corporateId,
            documentNames: REVIEWABLE_DOCUMENT_NAMES,
        })

        if (unknown.length) {
            customLog(req?.LogTraceId, 'info', {
                action: 'corporateCard:kyb:totalSizeIncomplete',
                message: '[KybStatus] Some documents have no recorded size; the total is a lower bound',
                corporateId,
                unknown,
                knownBytes: totalBytes,
            }, 'CONSOLE')
        }

        if (totalBytes <= limitBytes) return null

        customLog(req?.LogTraceId, 'info', {
            action: 'corporateCard:kyb:totalSizeExceeded',
            message: '[KybStatus] Submission blocked because the documents exceed the total limit',
            corporateId,
            totalBytes,
            limitBytes,
        }, 'CONSOLE')

        return `Your documents come to ${asMb(totalBytes)}, over the ${asMb(limitBytes)} total limit. Please replace the largest ones with smaller scans and try again.`
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            action: 'corporateCard:kyb:totalSizeCheckFailed',
            message: '[KybStatus] Could not measure the uploaded documents; allowing the submission',
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

const genKybReference = () => `KYB${crypto.randomBytes(5).toString('hex').toUpperCase()}`

/**
 * Everything identifying a live e-sign envelope. Clearing esignStatus alone leaves the envelope's reference
 * and signing link addressable, so a late vendor callback can re-stamp SIGNED onto an agreement that was
 * already retired.
 */
const RETIRED_ESIGN = {
    esignStatus: null,
    esignReference: null,
    esignSigningLink: null,
    esignSentAt: null,
    esignSignedAt: null,
    esignFailureReason: null,
}

const serializeApplication = (row) => {
    if (!row) return null
    const va = row.virtualAccount || {}
    return {
        corporateId: row.corporateId,
        kybStatus: row.kybStatus || KYB_STATUS.PENDING,
        kybReference: row.kybReference || null,
        businessType: row.businessType || null,
        rejectionReason: row.metadata?.rejectionReason || null,
        // Whether the corporate has already been shown the "KYB Verified" screen. Kept separate from
        // the status so a reviewer marking COMPLETED directly does not skip it.
        verifiedAcknowledged: !!row.metadata?.verifiedAcknowledgedAt,
        // Whether the corporate has read the rejection and asked to start over. The status stays REJECTED
        // until they resubmit, so this is what tells the two apart.
        rejectionAcknowledged: !!row.metadata?.rejectionAcknowledgedAt,
        cardSchemeId: row.cardSchemeId ?? null,
        svcCardNumberLast4: row.svcCardNumber ? last4(row.svcCardNumber) : null,
        virtualAccount: {
            beneficiaryName: va.beneficiaryName || null,
            accountNumber: va.accountNumber || null,
            ifsc: va.ifsc || null,
            bankName: va.bankName || null,
            bankAddress: va.bankAddress || null,
            paymentReference: va.paymentReference || null,
        },
        updatedAt: row.updatedAt,
    }
}

/**
 * GET /corporate/:corporateId/corporate-cards/kyb-status/document-checklist
 *
 * The whole catalogue in one call rather than a lookup per selection, so changing the business type
 * switches the checklist without a round trip. Which documents an issuer will accept for a given
 * constitution is a compliance rule, so it is owned here and never duplicated in the client.
 */
exports.getDocumentChecklist = asyncHandler(async (req, res) => {
    const sizeLimits = await getMaxSizeKbMap(req?.LogTraceId)

    return res.status(200).json({
        status: true,
        message: 'KYB document checklist fetched.',
        data: {
            businessTypes: BUSINESS_TYPE_CHECKLISTS.map((entry) => ({
                value: entry.value,
                label: entry.label,
                documents: entry.documents.map((doc) => {
                    const serialized = serializeDocument(doc)
                    return {
                        ...serialized,
                        maxSizeKb: sizeLimits[doc.documentName] || serialized.maxSizeKb,
                    }
                }),
            })),
        },
        responseCode: '000',
    })
})

exports.getKybStatus = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const row = await findByCorporate(corporateId)
    return res.status(200).json({
        status: true,
        message: 'KYB status fetched.',
        data: { application: serializeApplication(row) },
        responseCode: '000',
    })
})

exports.saveBusinessType = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const businessType = typeof req.body?.businessType === 'string' ? req.body.businessType.trim() : ''
    if (!BUSINESS_TYPES.includes(businessType)) {
        return next(new ErrorResponse('Invalid business type.', 400))
    }

    const existing = await findByCorporate(corporateId)
    if (!canResubmit(existing)) {
        return next(new ErrorResponse('KYB has already been submitted.', 400))
    }

    const changedType = !!existing?.businessType && existing.businessType !== businessType

    const fields = { businessType, kybStatus: existing?.kybStatus || KYB_STATUS.PENDING }
    if (!existing) fields.createdByCredentialId = actorCredentialId(req)
    // A rendered agreement belongs to the constitution it was rendered under, so changing the type
    // retires it rather than leaving a reviewer to judge stale evidence.
    if (changedType) Object.assign(fields, RETIRED_ESIGN)

    const saved = await upsertByCorporate(corporateId, fields)

    if (changedType) {
        const stillNeeded = new Set([
            ...(checklistFor(businessType)?.documents || []).map((document) => document.documentName),
            ...AGREEMENT_DOCUMENT_NAMES,
        ])
        const orphaned = ALL_DOCUMENT_NAMES.filter((documentName) => !stillNeeded.has(documentName))
        await delectDocfiles({
            docNamelist: [...orphaned, ...SYSTEM_DOCUMENT_NAMES],
            corporateUserId: corporateId,
        })
    }
    return res.status(200).json({
        status: true,
        message: 'Business type saved.',
        data: { application: serializeApplication(saved) },
        responseCode: '000',
    })
})

exports.submitKyb = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const existing = await findByCorporate(corporateId)
    if (!canResubmit(existing)) {
        return next(new ErrorResponse('KYB has already been submitted.', 400))
    }

    const businessType = typeof req.body?.businessType === 'string' ? req.body.businessType.trim() : ''
    // An application saved before Private/Public Limited were split still submits its stored value.
    if (businessType && !BUSINESS_TYPES.includes(businessType) && !checklistFor(businessType)) {
        return next(new ErrorResponse('Invalid business type.', 400))
    }

    const agreementError = await agreementBlockingSubmission(corporateId, existing)
    if (agreementError) return next(new ErrorResponse(agreementError, 400))

    const totalError = await totalSizeBlockingSubmission(corporateId, req)
    if (totalError) return next(new ErrorResponse(totalError, 400))

    const fields = { kybStatus: KYB_STATUS.SUBMITTED }
    if (!existing) fields.createdByCredentialId = actorCredentialId(req)
    if (!existing?.kybReference) fields.kybReference = genKybReference()
    if (businessType) fields.businessType = businessType
    // A resubmission is a fresh review; the previous decision must not survive onto it, and the next
    // approval has to show the corporate its verified screen again.
    if (existing?.kybStatus === KYB_STATUS.REJECTED) {
        fields.metadata = {
            ...(existing.metadata || {}),
            rejectionReason: null,
            verifiedAcknowledgedAt: null,
            rejectionAcknowledgedAt: null,
        }
    }

    const saved = await upsertByCorporate(corporateId, fields)

    // Submitting is not activation, and corporates read it as though it were. Says so while the
    // submission is fresh rather than waiting for them to ask support.
    await sendCorporateSupportEmail({
        corporateId,
        template: applicationNotActiveTemplate,
        templateKey: SUPPORT_EMAIL.APPLICATION_NOT_ACTIVE,
        req,
    })

    await alertAdminsOfSubmission(req, corporateId, saved)

    return res.status(200).json({
        status: true,
        message: 'KYB submitted.',
        data: { application: serializeApplication(saved) },
        responseCode: '000',
    })
})

/**
 * POST /corporate/:corporateId/corporate-cards/kyb-status/reopen
 *
 * The corporate has read why it was rejected and wants to fix it. Records that, so the next page load
 * returns them to the upload step they were working in rather than the rejection screen they already
 * acted on. kybStatus stays REJECTED until submitKyb: it is the last decision a reviewer made, the two
 * predicates that let a rejected application be edited both key off it, and the admin progress view
 * reports "resubmission in progress" from it.
 *
 * The e-signature is retired at the same time. The agreement form is hidden for as long as esignStatus is
 * set, so a corporate rejected FOR something on its agreement could otherwise never reach the fields and
 * would resubmit the identical document every time. The cost is a re-signature even when the rejection was
 * about a document; a dead end is worse.
 */
exports.reopenKyb = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const existing = await findByCorporate(corporateId)
    if (existing?.kybStatus !== KYB_STATUS.REJECTED) {
        return next(new ErrorResponse('Only a rejected KYB can be reopened.', 400))
    }

    if (existing.metadata?.rejectionAcknowledgedAt) {
        return res.status(200).json({
            status: true,
            message: 'KYB already reopened.',
            data: { application: serializeApplication(existing) },
            responseCode: '000',
        })
    }

    const saved = await upsertByCorporate(corporateId, {
        ...RETIRED_ESIGN,
        metadata: {
            ...(existing.metadata || {}),
            rejectionAcknowledgedAt: new Date().toISOString(),
        },
    })
    return res.status(200).json({
        status: true,
        message: 'KYB reopened for resubmission.',
        data: { application: serializeApplication(saved) },
        responseCode: '000',
    })
})

exports.completeKyb = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const existing = await findByCorporate(corporateId)
    // COMPLETED is accepted as well as VERIFIED: a reviewer can set it directly, and the corporate still
    // has to be able to acknowledge the screen — refusing here would strand it there forever.
    const acknowledgeable =
        existing?.kybStatus === KYB_STATUS.VERIFIED || existing?.kybStatus === KYB_STATUS.COMPLETED
    if (!acknowledgeable) {
        return next(new ErrorResponse('KYB must be verified before it can be marked complete.', 400))
    }

    const saved = await upsertByCorporate(corporateId, {
        kybStatus: KYB_STATUS.COMPLETED,
        metadata: {
            ...(existing.metadata || {}),
            verifiedAcknowledgedAt: new Date().toISOString(),
        },
    })
    return res.status(200).json({
        status: true,
        message: 'KYB marked complete.',
        data: { application: serializeApplication(saved) },
        responseCode: '000',
    })
})
