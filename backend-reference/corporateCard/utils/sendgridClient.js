/**
 * SendGrid transport, used in place of SMTP wherever a key is configured.
 *
 * The key is the switch. It is set in .env.staging and nowhere else, so staging sends over SendGrid
 * while local and production keep the existing Zoho/SMTP path untouched — no second flag to keep in
 * sync, and completing the migration later is just adding the key to another environment.
 *
 * Ten other microservices already moved to SendGrid; corporateCard was missed, which is why its
 * mailbox was the one Zoho blocked for "unusual sending activity".
 */

const sgMail = require('@sendgrid/mail')

const trim = (v) => (v || '').trim()

const SENDGRID_API_KEY = trim(process.env.SENDGRID_API_KEY)
const sendGridEnabled = Boolean(SENDGRID_API_KEY)

if (sendGridEnabled) sgMail.setApiKey(SENDGRID_API_KEY)

/**
 * Nodemailer attachments carry a Buffer in `content` or a local `path`; SendGrid takes neither and
 * wants base64 inline. Everything this service sends (the KYB document pack) is already a Buffer,
 * so `path` is handled only so a future caller does not silently send an empty attachment.
 */
const toSendGridAttachments = async (attachments) => {
    if (!Array.isArray(attachments) || !attachments.length) return undefined

    const fs = require('fs')
    return Promise.all(attachments.map(async (file) => {
        let content = file?.content
        if (!content && file?.path) content = await fs.promises.readFile(file.path)
        if (Buffer.isBuffer(content)) content = content.toString('base64')

        return {
            content,
            filename: file?.filename,
            type: file?.type || file?.contentType || 'application/octet-stream',
            disposition: file?.disposition || 'attachment',
        }
    }))
}

/**
 * Resolves { ok, response } / { ok, error } — the same shape the SMTP callback produces, so callers
 * cannot tell the two transports apart. SendGrid puts the real reason in `response.body`; reading
 * only `error.message` would report "Bad Request" and lose it.
 */
const sendViaSendGrid = async ({ from, to, subject, html, attachments }) => {
    try {
        const message = { from, to, subject, html }
        const converted = await toSendGridAttachments(attachments)
        if (converted) message.attachments = converted

        const [response] = await sgMail.send(message)
        return { ok: true, response: response?.statusCode ? `SendGrid ${response.statusCode}` : null }
    } catch (error) {
        const detail = error?.response?.body
        return {
            ok: false,
            error: detail ? JSON.stringify(detail) : (error?.message || String(error)),
        }
    }
}

module.exports = { sendGridEnabled, sendViaSendGrid, toSendGridAttachments }
