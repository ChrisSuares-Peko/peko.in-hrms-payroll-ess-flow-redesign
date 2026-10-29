const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { SUPPORT_EMAIL_TRIGGER } = require('../../constants/supportEmails')
const { SUPPORT_EMAIL_TEMPLATES } = require('../../utils/supportEmailTemplates')
const { sendCorporateSupportEmail } = require('../../services/supportEmails')

// Only the dispute outcome takes free text today; anything else a template needs is derived from the
// corporate record, not supplied by the caller.
const ALLOWED_VARS = ['disputeReference', 'resolutionDetails']
const VAR_MAX = 2000

/**
 * What support can send, and what each one will say.
 *
 * The subject comes from the template itself rather than a parallel list, so the picker can never
 * offer a heading the mail does not actually carry.
 */
exports.listSupportEmailTemplates = asyncHandler(async (req, res) => {
    const templates = Object.entries(SUPPORT_EMAIL_TEMPLATES).map(([key, build]) => ({
        key,
        subject: build({}).subject,
        trigger: SUPPORT_EMAIL_TRIGGER[key] || 'MANUAL',
    }))

    return res.status(200).json({
        status: true,
        message: 'Support email templates.',
        data: { templates },
        responseCode: '000',
    })
})

/**
 * POST /support-emails/send  { corporateId, templateKey, vars? }
 *
 * Sends one of the deck's mails to a corporate on support's behalf. The recipient is resolved from
 * the corporate record, not from the request — support picks who it is about, never where it goes.
 *
 * `vars` carries the free text the dispute outcome needs. Allow-listed rather than spread wholesale,
 * so a caller cannot reach a template argument the deck never meant them to set — `customerName`
 * above all, which would let the recipient be greeted as somebody else.
 */
exports.sendSupportEmail = asyncHandler(async (req, res, next) => {
    const corporateId = Number(req.body?.corporateId)
    if (!Number.isInteger(corporateId) || corporateId <= 0) {
        return next(new ErrorResponse('A valid corporate is required.', 400))
    }

    const templateKey = String(req.body?.templateKey || '').trim()
    const template = SUPPORT_EMAIL_TEMPLATES[templateKey]
    if (!template) return next(new ErrorResponse('Unknown email template.', 400))

    const extras = {}
    for (const key of ALLOWED_VARS) {
        const value = req.body?.vars?.[key]
        if (typeof value === 'string' && value.trim()) extras[key] = value.trim().slice(0, VAR_MAX)
    }

    const { sent } = await sendCorporateSupportEmail({ corporateId, template, templateKey, extras, req })
    if (!sent) return next(new ErrorResponse('The email could not be sent — the corporate has no usable email address on file.', 422))

    return res.status(200).json({
        status: true,
        message: 'Email sent.',
        data: { corporateId, templateKey },
        responseCode: '000',
    })
})
