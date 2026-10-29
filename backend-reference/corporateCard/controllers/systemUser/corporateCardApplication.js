const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const {
    KYB_STATUS,
    KYB_STATUS_OPTIONS,
    ADMIN_SETTABLE_KYB_STATUSES,
    KYB_REFERENCE_REGEX,
} = require('../../constants/corporateCardApplication')
const { KYB_STATUS_NOTIFICATION } = require('../../constants/kybNotifications')
const { createNotification } = require('../../models/use-cases/notification')
const {
    findByCorporate,
    findOtherByCardSchemeId,
    upsertByCorporate,
    findAndCount,
    searchCorporatesWithoutApplication,
    getApplicationsSummary,
} = require('../../models/use-cases/corporateCardAdminApplication')
const { last4, parsePaging } = require('../../utils/cardHelpers')
const { getCorporatesByIds } = require('../../utils/sharedDirectory')
const { email: sendEmail } = require('../../utils/emailer')
const { customLog } = require('../../utils/loggerHelper')
const {
    kybRejectedTemplate, escapeHtml, inlineDetail,
    fundingAccountSection, sectionLabel, bulletList, PLEASE_ENSURE_ITEMS,
} = require('../../utils/kybStatusEmailTemplate')
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver')
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys')
const { sendCorporateSupportEmail } = require('../../services/supportEmails')
const { applicationUnderReviewTemplate, applicationApprovedTemplate } = require('../../utils/supportEmailTemplates')
const { SUPPORT_EMAIL } = require('../../constants/supportEmails')

const resolveKybApprovedEmail = ({ name, kybReference, fundingAccount, logTraceId }) =>
    resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.KYB_APPROVED,
        service: EMAIL_TEMPLATE_SERVICES.CORPORATECARD_APPLICATION,
        variables: {
            name: escapeHtml(name),
            fundingAccountHtml: fundingAccountSection(fundingAccount),
            referenceClauseHtml: kybReference ? inlineDetail('Reference', escapeHtml(kybReference)) : '',
        },
        fallback: () => applicationApprovedTemplate({ customerName: name, kybReference, fundingAccount }).html,
        fallbackSubject: 'Peko | Application approved',
        logTraceId,
    })

const resolveKybRejectedEmail = ({ name, rejectionReason, logTraceId }) => {
    const reasonItems = (rejectionReason || '').split('\n').map((line) => line.trim()).filter(Boolean)
    const reasonsBlockHtml = reasonItems.length
        ? sectionLabel('Reason(s) for Rejection:') + bulletList(reasonItems)
            + sectionLabel('Please ensure that:') + bulletList(PLEASE_ENSURE_ITEMS)
        : ''

    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.KYB_REJECTED,
        service: EMAIL_TEMPLATE_SERVICES.CORPORATECARD_APPLICATION,
        variables: {
            name: escapeHtml(name),
            reasonsBlockHtml,
        },
        fallback: () => kybRejectedTemplate(name, rejectionReason),
        fallbackSubject: 'Your KYB submission needs attention - Corporate Card application',
        logTraceId,
    })
}
const { dispatchVendorKybReviewEmail } = require('../../services/vendorKybReviewEmail')

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
const SVC_REGEX = /^\d{16}$/
const ACCOUNT_REGEX = /^[A-Z0-9]{9,18}$/
const CARD_SCHEME_ID_MAX = 999999999
const REJECTION_REASON_MIN = 10
const REJECTION_REASON_MAX = 500
const VA_UPPERCASE_KEYS = ['ifsc', 'accountNumber']
const cardSchemeMustBeUnique = () => process.env.NODE_ENV === 'production'
const VA_MAX = {
    beneficiaryName: 120,
    accountNumber: 34,
    ifsc: 11,
    bankName: 120,
    bankAddress: 255,
    paymentReference: 140,
}

const serializeApplication = (row) => {
    if (!row) return null
    const va = row.virtualAccount || {}
    return {
        corporateId: row.corporateId,
        kybStatus: row.kybStatus || KYB_STATUS.PENDING,
        kybReference: row.kybReference || null,
        rejectionReason: row.metadata?.rejectionReason || null,
        // Whether the corporate has opened the rejection and chosen to start again. REJECTED alone does not
        // say that, so without this a reviewer cannot tell a stalled application from one being fixed.
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
        vendorEmail: {
            status: row.vendorEmailStatus === null || row.vendorEmailStatus === undefined ? null : !!row.vendorEmailStatus,
            sentAt: row.vendorEmailSentAt || null,
        },
        updatedAt: row.updatedAt,
    }
}

const serializeApplicationSummary = (row) => {
    const va = row.virtualAccount || {}
    return {
        corporateId: row.corporateId,
        companyName: row.corporateUser?.companyName || null,
        entityName: row.agreementEntityName || null,
        fullName: row.corporateUser?.contactPersonName || null,
        pekoAccountNumber: row.corporateUser?.credential?.username || null,
        email: row.corporateUser?.email || null,
        kybStatus: row.kybStatus || KYB_STATUS.PENDING,
        kybReference: row.kybReference || null,
        cardSchemeId: row.cardSchemeId ?? null,
        svcCardNumberLast4: row.svcCardNumber ? last4(row.svcCardNumber) : null,
        beneficiaryName: va.beneficiaryName || null,
        virtualAccountNumberLast4: va.accountNumber ? last4(va.accountNumber) : null,
        virtualAccountIfsc: va.ifsc || null,
        bankName: va.bankName || null,
        vendorEmailStatus: row.vendorEmailStatus || null,
        updatedAt: row.updatedAt,
    }
}

const parseCorporateId = (raw) => {
    const id = Number(raw)
    return Number.isInteger(id) && id > 0 ? id : null
}

exports.listApplications = asyncHandler(async (req, res, next) => {
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : ''
    if (rawStatus && !KYB_STATUS_OPTIONS.includes(rawStatus)) return next(new ErrorResponse('Invalid status filter.', 400))
    const searchText = typeof req.query.searchText === 'string' && req.query.searchText.trim() ? req.query.searchText.trim() : undefined
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAndCount({ limit, offset, status: rawStatus || undefined, searchText, req })
    return res.status(200).json({
        status: true,
        message: 'Applications fetched.',
        data: { count, rows: rows.map(serializeApplicationSummary) },
        responseCode: '000',
    })
})

exports.getSummary = asyncHandler(async (req, res) => {
    const summary = await getApplicationsSummary(req)
    return res.status(200).json({
        status: true,
        message: 'Summary fetched.',
        data: { summary },
        responseCode: '000',
    })
})

exports.listCorporates = asyncHandler(async (req, res) => {
    const searchText = typeof req.query.searchText === 'string' && req.query.searchText.trim() ? req.query.searchText.trim() : undefined
    const rows = await searchCorporatesWithoutApplication({ searchText, req })
    return res.status(200).json({
        status: true,
        message: 'Corporates fetched.',
        data: {
            corporates: rows.map((c) => ({
                corporateId: c.id,
                name: c.credential?.name || c.companyName || null,
                username: c.credential?.username || null,
                companyName: c.companyName || null,
                email: c.credential?.email || c.email || null,
            })),
        },
        responseCode: '000',
    })
})

exports.getApplication = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))

    const row = await findByCorporate(corporateId)
    return res.status(200).json({
        status: true,
        message: 'Application fetched.',
        data: { application: serializeApplication(row) },
        responseCode: '000',
    })
})

const buildVirtualAccount = (incoming, existing) => {
    if (incoming === null) return { virtualAccount: null }
    if (typeof incoming !== 'object') return { error: 'virtualAccount must be an object.' }

    const merged = { ...(existing || {}) }
    for (const [key, max] of Object.entries(VA_MAX)) {
        if (incoming[key] === undefined) continue
        const value = incoming[key] === null ? '' : String(incoming[key]).trim()
        if (value.length > max) return { error: `${key} is too long.` }
        if (key === 'ifsc' && value && !IFSC_REGEX.test(value.toUpperCase())) return { error: 'A valid IFSC is required.' }
        if (key === 'accountNumber' && value && !ACCOUNT_REGEX.test(value.toUpperCase())) return { error: 'A valid account number is required.' }
        merged[key] = value ? (VA_UPPERCASE_KEYS.includes(key) ? value.toUpperCase() : value) : null
    }
    return { virtualAccount: merged }
}

exports.updateApplication = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))

    const body = req.body || {}
    const fields = {}

    if (body.cardSchemeId !== undefined && body.cardSchemeId !== null && body.cardSchemeId !== '') {
        const scheme = Number(body.cardSchemeId)
        if (!Number.isInteger(scheme) || scheme <= 0) return next(new ErrorResponse('A valid card scheme id is required.', 400))
        if (scheme > CARD_SCHEME_ID_MAX) return next(new ErrorResponse('Card scheme id must be 4 to 9 digits.', 400))
        fields.cardSchemeId = scheme
    }

    if (body.svcCardNumber !== undefined) {
        const svc = body.svcCardNumber === null ? '' : String(body.svcCardNumber).trim()
        if (svc && !SVC_REGEX.test(svc)) return next(new ErrorResponse('SVC card number must be exactly 16 digits.', 400))
        fields.svcCardNumber = svc || null
    }

    if (body.kybReference !== undefined) {
        const ref = body.kybReference === null ? '' : String(body.kybReference).trim()
        if (ref.length > 100) return next(new ErrorResponse('KYB reference is too long.', 400))
        fields.kybReference = ref || null
    }

    const existing = await findByCorporate(corporateId)

    if (fields.kybReference && fields.kybReference !== existing?.kybReference && !KYB_REFERENCE_REGEX.test(fields.kybReference)) {
        return next(new ErrorResponse('The KYB reference is generated when the corporate submits their KYB and looks like KYB4A9F2C1B0E. It cannot be set to anything else.', 400))
    }

    let targetStatus
    if (body.kybStatus !== undefined || body.status !== undefined) {
        targetStatus = String(body.kybStatus ?? body.status).trim().toUpperCase()
        if (!KYB_STATUS_OPTIONS.includes(targetStatus)) return next(new ErrorResponse('Invalid status.', 400))
        if (!ADMIN_SETTABLE_KYB_STATUSES.includes(targetStatus)) {
            return next(new ErrorResponse('Completed is set by the corporate when they open their dashboard, not from here.', 400))
        }
        if (targetStatus === KYB_STATUS.PENDING && existing && existing.kybStatus !== KYB_STATUS.PENDING) {
            customLog(req?.LogTraceId, 'info', {
                action: 'corporateCardApplication:status:pendingRegressionRefused',
                message: '[CorporateCardApplication] Refused to move an application back to Pending',
                corporateId,
                from: existing.kybStatus,
            }, 'CONSOLE')
            return next(new ErrorResponse('Pending is where a new application starts, so it cannot be set again once the corporate has moved on. Reject the application instead, so the corporate is told what to fix.', 400))
        }
    }

    if (cardSchemeMustBeUnique() && fields.cardSchemeId && fields.cardSchemeId !== existing?.cardSchemeId) {
        const clash = await findOtherByCardSchemeId(fields.cardSchemeId, corporateId)
        if (clash) {
            customLog(req?.LogTraceId, 'info', {
                action: 'corporateCardApplication:cardScheme:duplicate-rejected',
                message: '[CorporateCardApplication] Card scheme id already assigned to another corporate',
                corporateId,
                cardSchemeId: fields.cardSchemeId,
                assignedToCorporateId: clash.corporateId,
            }, 'CONSOLE')
            return next(new ErrorResponse('This card scheme id is already assigned to another corporate.', 400))
        }
    }

    if (body.virtualAccount !== undefined) {
        const built = buildVirtualAccount(body.virtualAccount, existing?.virtualAccount)
        if (built.error) return next(new ErrorResponse(built.error, 400))
        fields.virtualAccount = built.virtualAccount
    }

    if (body.rejectionReason !== undefined) {
        const reason = body.rejectionReason === null ? '' : String(body.rejectionReason).trim()
        if (reason && reason.length < REJECTION_REASON_MIN) {
            return next(new ErrorResponse(`Rejection reason must be at least ${REJECTION_REASON_MIN} characters`, 400))
        }
        if (reason.length > REJECTION_REASON_MAX) {
            return next(new ErrorResponse(`Rejection reason cannot exceed ${REJECTION_REASON_MAX} characters`, 400))
        }
        fields.metadata = { ...(existing?.metadata || {}), rejectionReason: reason || null }
    }

    const finalStatus = targetStatus || existing?.kybStatus || KYB_STATUS.PENDING
    if (finalStatus === KYB_STATUS.COMPLETED || finalStatus === KYB_STATUS.VERIFIED) {
        const scheme = Object.prototype.hasOwnProperty.call(fields, 'cardSchemeId') ? fields.cardSchemeId : existing?.cardSchemeId
        const svc = Object.prototype.hasOwnProperty.call(fields, 'svcCardNumber') ? fields.svcCardNumber : existing?.svcCardNumber
        const va = Object.prototype.hasOwnProperty.call(fields, 'virtualAccount') ? fields.virtualAccount : existing?.virtualAccount
        const missing = []
        if (!scheme) missing.push('card scheme')
        if (!svc) missing.push('SVC card number')
        if (!va?.accountNumber) missing.push('virtual account number')
        if (!va?.ifsc) missing.push('IFSC')
        if (missing.length) {
            const statusLabel = finalStatus === KYB_STATUS.COMPLETED ? 'completed' : 'verified'
            return next(new ErrorResponse(`Cannot mark the application ${statusLabel} until these are set: ${missing.join(', ')}.`, 400))
        }
    }

    if (targetStatus) fields.kybStatus = targetStatus

    // A fresh rejection has to reach the corporate, and the corporate's stage is resolved from
    // rejectionAcknowledgedAt — left set from the previous cycle it would send them straight back to the
    // uploads and they would never see the new reason. Scoped to an explicit reject or a reason edit, so
    // an unrelated write on a rejection someone is already fixing does not yank them backwards.
    const rejectingNow = targetStatus === KYB_STATUS.REJECTED
        || (body.rejectionReason !== undefined && finalStatus === KYB_STATUS.REJECTED)
    if (rejectingNow) {
        fields.metadata = {
            ...(fields.metadata || existing?.metadata || {}),
            rejectionAcknowledgedAt: null,
        }
    }

    if (!existing) fields.createdByCredentialId = req.user?.id

    if (Object.keys(fields).length === 0) return next(new ErrorResponse('Nothing to update.', 400))

    if (!existing) {
        const corporates = await getCorporatesByIds([corporateId], req, { bypassCache: true })
        if (!corporates.get(String(corporateId))) return next(new ErrorResponse('Corporate not found.', 404))
    }

    const previousStatus = existing?.kybStatus

    let saved
    try {
        saved = await upsertByCorporate(corporateId, fields)
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') return next(new ErrorResponse('This SVC card number is already assigned to another corporate.', 409))
        throw err
    }

    let vendorDispatch = null
    if (targetStatus === KYB_STATUS.UNDER_REVIEW && targetStatus !== previousStatus) {
        vendorDispatch = await dispatchVendorKybReviewEmail({ application: saved, req })
        await saved.reload()
        // The vendor is told; the corporate waiting on the outcome should hear it too.
        await sendCorporateSupportEmail({
            corporateId,
            template: applicationUnderReviewTemplate,
            templateKey: SUPPORT_EMAIL.APPLICATION_UNDER_REVIEW,
            req,
        })
    }

    if (targetStatus && targetStatus !== previousStatus && (targetStatus === KYB_STATUS.VERIFIED || targetStatus === KYB_STATUS.REJECTED)) {
        const isVerified = targetStatus === KYB_STATUS.VERIFIED
        const rejectionReason = saved.metadata?.rejectionReason

        let corporate = null
        try {
            const corporates = await getCorporatesByIds([corporateId], req)
            corporate = corporates.get(String(corporateId))
        } catch (lookupErr) {
            customLog(req?.LogTraceId, 'error', { message: '[CorporateCardApplication] Could not resolve the corporate to tell about the KYB decision', corporateId, targetStatus, error: lookupErr?.message }, 'CONSOLE')
        }

        const username = corporate?.credential?.username
        if (username) {
            const copy = isVerified ? KYB_STATUS_NOTIFICATION.VERIFIED : KYB_STATUS_NOTIFICATION.REJECTED
            await createNotification({
                notificationTitle: copy.title,
                notificationBrief: copy.brief({ reason: rejectionReason }),
                notificationCategory: copy.category,
                notificationTo: username,
                notificationBy: 'ADMIN',
            }, req)
        } else if (corporate) {
            customLog(req?.LogTraceId, 'error', { message: '[CorporateCardApplication] Corporate has no username — skipping KYB status notification', corporateId, targetStatus }, 'CONSOLE')
        }

        try {
            const to = corporate?.email
            if (to) {
                const name = corporate.contactPersonName || corporate.companyName || 'there'
                const resolved = isVerified
                    ? await resolveKybApprovedEmail({
                        name,
                        kybReference: saved.kybReference,
                        fundingAccount: {
                            ...(saved.virtualAccount || {}),
                            clientName: corporate.companyName || corporate.contactPersonName || null,
                            telephone: corporate.mobileNo || null,
                        },
                        logTraceId: req?.LogTraceId,
                    })
                    : await resolveKybRejectedEmail({ name, rejectionReason, logTraceId: req?.LogTraceId })
                sendEmail(req?.LogTraceId, to, resolved.subject, resolved.html)
            } else {
                customLog(req?.LogTraceId, 'error', { message: '[CorporateCardApplication] Corporate email not found — skipping KYB status email', corporateId, targetStatus }, 'CONSOLE')
            }
        } catch (mailErr) {
            customLog(req?.LogTraceId, 'error', { message: '[CorporateCardApplication] KYB status email failed', corporateId, targetStatus, error: mailErr?.message }, 'CONSOLE')
        }
    }

    let message = finalStatus === KYB_STATUS.COMPLETED ? 'Application marked completed.' : 'Application updated.'
    if (vendorDispatch?.sent) message = 'Application updated and sent to the vendor.'

    return res.status(200).json({
        status: true,
        message,
        data: {
            application: serializeApplication(saved),
            ...(vendorDispatch && !vendorDispatch.sent ? { vendorEmailError: vendorDispatch.error } : {}),
        },
        responseCode: '000',
    })
})

exports.retryVendorEmail = asyncHandler(async (req, res, next) => {
    const corporateId = parseCorporateId(req.params.corporateId)
    if (!corporateId) return next(new ErrorResponse('A valid corporate is required.', 400))

    const application = await findByCorporate(corporateId)
    if (!application) return next(new ErrorResponse('Application not found.', 404))

    if (application.kybStatus !== KYB_STATUS.UNDER_REVIEW) {
        return next(new ErrorResponse('The vendor review email is only sent while the application is under review.', 400))
    }

    customLog(req?.LogTraceId, 'info', {
        action: 'corporateCard:vendorKybEmail:retryRequested',
        message: '[CorporateCardApplication] Admin retried the vendor KYB review email',
        corporateId,
        previouslySent: application.vendorEmailStatus,
        retriedByCredentialId: req.user?.id,
    }, 'CONSOLE')

    const dispatch = await dispatchVendorKybReviewEmail({ application, req })
    await application.reload()

    return res.status(200).json({
        status: true,
        message: dispatch?.sent ? 'Sent to the vendor.' : 'The vendor email could not be sent.',
        data: {
            application: serializeApplication(application),
            ...(dispatch?.sent ? {} : { vendorEmailError: dispatch?.error }),
        },
        responseCode: '000',
    })
})
