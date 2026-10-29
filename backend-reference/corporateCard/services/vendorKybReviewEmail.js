const { customLog } = require('../utils/loggerHelper')
const { sendCorporateCardMailResult } = require('../utils/corporateCardEmailer')
const { parseVendorEmail, parseVendorMaxEmailMb } = require('../utils/cardHelpers')
const { getCorporatesByIds } = require('../utils/sharedDirectory')
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails')
const { DEFAULT_ACCESS_KEY } = require('../utils/pinelabsGateway')
const { vendorKybUnderReviewTemplate, detailRows, bullets, heading, VENDOR_REVIEW_ACTIONS } = require('../utils/vendorKybEmailTemplate')
const { escapeHtml, reviewDayLabel } = require('../utils/kybStatusEmailTemplate')
const { checklistFor } = require('../constants/kybDocuments')
const { findByCorporate: findAgreement } = require('../models/use-cases/corporateCardAgreement')
const { buildKybDocumentPack } = require('./kybDocumentPack')
const { getTotalLimitsKb } = require('./documentSizeLimits')
const { updateVendorEmailState } = require('../models/use-cases/corporateCardAdminApplication')
const { resolveEmailTemplate } = require('./emailTemplateResolver')
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../utils/emailTemplateKeys')

const LOG_PREFIX = '[VendorKybReviewEmail]'
const SEND_TIMEOUT_MS = 25000

const JURISDICTION_COUNTRY = 'India'

const mb = (bytes) => `${(Number(bytes || 0) / (1024 * 1024)).toFixed(1)} MB`

const record = async (corporateId, sent, logTraceId) => {
    try {
        await updateVendorEmailState(corporateId, {
            vendorEmailStatus: sent,
            ...(sent ? { vendorEmailSentAt: new Date() } : {}),
        })
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:vendorKybEmail:persistFailed',
            message: `${LOG_PREFIX} could not record the vendor email outcome`,
            corporateId,
            sent,
            error: error?.message,
        }, 'CONSOLE')
    }
}

const resolveVendor = async (req) => {
    const serviceOperator = await findServiceOperatorByAccessKey(DEFAULT_ACCESS_KEY, req)
    const parsed = parseVendorEmail(serviceOperator?.vendor?.vendorEmail)
    const recipients = (Array.isArray(parsed) ? parsed : [parsed])
        .map((address) => String(address || '').trim())
        .filter((address) => address.includes('@'))
    const maxEmailMb = parseVendorMaxEmailMb(serviceOperator?.vendor?.optionals)
    return {
        recipients,
        maxEmailMb,
        maxTotalBytes: Math.round(maxEmailMb * 1024 * 1024),
        vendorName: serviceOperator?.vendor?.vendorName || null,
    }
}

const resolveCorporate = async (corporateId, req, logTraceId) => {
    try {
        const corporates = await getCorporatesByIds([corporateId], req)
        return corporates.get(String(corporateId)) || null
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:vendorKybEmail:corporateLookupFailed',
            message: `${LOG_PREFIX} could not resolve the corporate`,
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

const resolveAgreement = async (corporateId, logTraceId) => {
    try {
        return await findAgreement(corporateId)
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:vendorKybEmail:agreementLookupFailed',
            message: `${LOG_PREFIX} could not read the agreement for the application details`,
            corporateId,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

// Pre-renders the parts of vendorKybUnderReviewTemplate an admin-managed template
// can't express (a filtered details table, a variable-length documents list) into
// HTML fragments, so the resolver's plain ${...} substitution can place them.
const resolveVendorKybUnderReviewEmail = async (args) => {
    const { companyName, kybReference, businessTypeLabel, applicationId, applicationDate, registrationNumber, jurisdiction, recipientName, attached = [], subject, logTraceId } = args
    const details = [
        { label: 'Company name:', value: escapeHtml(companyName) || 'A corporate' },
        { label: 'Application ID:', value: escapeHtml(applicationId) },
        { label: 'Date of application:', value: escapeHtml(reviewDayLabel(applicationDate)) },
        { label: 'Entity Type:', value: escapeHtml(businessTypeLabel) },
        { label: 'Registration number:', value: escapeHtml(registrationNumber) },
        { label: 'Registered country/Jurisdiction:', value: escapeHtml(jurisdiction) },
        { label: 'KYB reference:', value: escapeHtml(kybReference) },
    ].filter(({ value }) => value)

    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.VENDOR_KYB_UNDER_REVIEW,
        service: EMAIL_TEMPLATE_SERVICES.CORPORATECARD_VENDOR,
        variables: {
            recipientName: escapeHtml(recipientName) || 'Partner',
            companyName: escapeHtml(companyName) || 'A corporate',
            detailsHtml: detailRows(details),
            reviewActionsHtml: bullets(VENDOR_REVIEW_ACTIONS),
            documentsHeadingHtml: attached.length ? heading('Documents attached to this email') : '',
            documentsHtml: attached.length ? bullets(attached.map((label) => escapeHtml(label))) : '',
        },
        fallback: () => vendorKybUnderReviewTemplate(args),
        fallbackSubject: subject,
        logTraceId: logTraceId || null,
    })
}

const dispatchVendorKybReviewEmail = async ({ application, req }) => {
    const logTraceId = req?.LogTraceId
    const corporateId = application?.corporateId

    const fail = async (error) => {
        await record(corporateId, false, logTraceId)
        customLog(logTraceId, 'error', {
            action: 'corporateCard:vendorKybEmail:failed',
            message: `${LOG_PREFIX} vendor KYB review email not sent`,
            corporateId,
            reason: error,
        }, 'CONSOLE')
        return { sent: false, error }
    }

    try {
        const corporate = await resolveCorporate(corporateId, req, logTraceId)
        const companyName = corporate?.companyName || null
        if (!companyName && !application?.kybReference) {
            return fail('Neither a company name nor a KYB reference could be resolved for this corporate.')
        }

        let vendor
        try {
            vendor = await resolveVendor(req)
        } catch (lookupError) {
            return fail(`The Corporate Cards vendor could not be looked up: ${lookupError?.message || 'lookup failed'}`)
        }
        const { recipients, maxTotalBytes, vendorName } = vendor
        if (!recipients.length) {
            return fail('No vendor email address is configured for Corporate Cards.')
        }

        const { vendorPackKb } = await getTotalLimitsKb(logTraceId)
        // The pack carries the signed agreement on top of everything the corporate uploaded, so it is
        // bounded separately from the upload total. The vendor's own mail server still has the final say.
        const packLimitBytes = Math.min(vendorPackKb * 1024, maxTotalBytes)

        const pack = await buildKybDocumentPack({
            corporateId,
            logTraceId,
            maxTotalBytes: packLimitBytes,
        })
        if (pack.exceeded) {
            return fail(`The KYB documents come to ${mb(pack.totalBytes)} once compressed, over the ${mb(packLimitBytes)} limit for the vendor pack. Ask the corporate to re-upload smaller scans, or raise the limit in Document Size Limits.`)
        }
        const subjectName = String(companyName || application.kybReference).replace(/\s+/g, ' ').trim()
        const subjectRef = companyName && application.kybReference ? ` (${application.kybReference})` : ''
        const subject = `Peko Corporate Cards - KYB review requested for ${subjectName}${subjectRef}`

        const agreement = await resolveAgreement(corporateId, logTraceId)
        const jurisdiction = [agreement?.regCity, agreement?.regState, JURISDICTION_COUNTRY]
            .map((part) => String(part || '').trim())
            .filter(Boolean)
            .join(', ')

        const templateArgs = {
            companyName: companyName || agreement?.entityName || null,
            kybReference: application.kybReference,
            businessTypeLabel: checklistFor(application.businessType)?.label || null,
            applicationId: corporate?.credential?.username || null,
            applicationDate: new Date(),
            registrationNumber: agreement?.cinLlpNumber || agreement?.gstNumber || null,
            jurisdiction: agreement?.regState ? jurisdiction : null,
            recipientName: vendorName,
            attached: pack.attached,
        }
        const resolved = await resolveVendorKybUnderReviewEmail({ ...templateArgs, subject, logTraceId })

        const settle = sendCorporateCardMailResult(
            logTraceId,
            recipients,
            resolved.subject,
            resolved.html,
            pack.attachments
        ).then(async (outcome) => {
            if (!outcome?.ok) {
                return { sent: false, error: outcome?.error || 'The mail server rejected the message.' }
            }
            await record(corporateId, true, logTraceId)
            customLog(logTraceId, 'info', {
                action: 'corporateCard:vendorKybEmail:sent',
                message: `${LOG_PREFIX} vendor KYB review email accepted by the relay`,
                corporateId,
                recipients: recipients.join(', '),
                attachmentCount: pack.attachments.length,
                omitted: pack.omitted,
            }, 'CONSOLE')
            return { sent: true, recipients, omitted: pack.omitted }
        }).catch((sendError) => ({ sent: false, error: sendError?.message || 'The vendor email could not be sent.' }))

        let timer
        const bounded = new Promise((resolve) => {
            timer = setTimeout(() => resolve({ sent: false, error: 'The mail server did not respond in time.' }), SEND_TIMEOUT_MS)
        })
        const result = await Promise.race([settle, bounded])
        clearTimeout(timer)

        if (!result.sent) return fail(result.error)
        return result
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:vendorKybEmail:unexpected',
            message: `${LOG_PREFIX} vendor KYB review email threw`,
            corporateId,
            error: error?.message,
            stack: error?.stack,
        }, 'CONSOLE')
        return fail('The vendor email could not be prepared. If the issue persists, please contact support at reach@peko.one')
    }
}

module.exports = { dispatchVendorKybReviewEmail, SEND_TIMEOUT_MS }
