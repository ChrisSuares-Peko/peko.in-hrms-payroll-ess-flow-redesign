const nodemailer = require('nodemailer')
const { customLog } = require('./loggerHelper')
const { sendGridEnabled, sendViaSendGrid } = require('./sendgridClient')

const trim = (v) => (v || '').trim()

const poolConfig = {
    pool: true,
    host: trim(process.env.EMAILER_HOST_PROD) || 'smtp-mail.outlook.com',
    port: 587,
    secureConnection: false,
    auth: { user: trim(process.env.EMAILER_USER_PROD), pass: trim(process.env.EMAILER_PASS_PROD) },
    tls: { ciphers: 'SSLv3' },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    maxConnections: 5,
    maxMessages: 100,
}

// Staging and local send from EMAILER_USER_DEV, production from EMAILER_USER_PROD — the same split
// every other microservice uses, and what SendGrid verifies as a sender. Falls back to the
// production address when no dev one is configured rather than sending from nothing.
const isProduction = process.env.NODE_ENV === 'production'
const envFromAddress = () =>
    (isProduction ? trim(process.env.EMAILER_USER_PROD) : trim(process.env.EMAILER_USER_DEV))
    || trim(process.env.EMAILER_USER_PROD)
    || 'support@peko.one'

const fromAddress = envFromAddress()
const transporter = nodemailer.createTransport(poolConfig)

const send = (logTraceId, to, subject, body, attachments, func) => {
    const recipients = Array.isArray(to) ? to.filter((r) => r && String(r).trim()) : to
    if (!recipients || (Array.isArray(recipients) && !recipients.length) || !String(recipients).trim()) {
        customLog(logTraceId, 'error', { message: '[Emailer] No valid recipient — skipping send', subject }, 'CONSOLE')
        if (func) func({ ok: false, error: 'No valid recipient address.' })
        return
    }

    const message = { from: `Peko<${fromAddress}>`, to: recipients, subject, html: body }
    if (attachments && attachments.length) message.attachments = attachments

    // SendGrid wherever a key is configured (staging); the SMTP path below stays for everywhere else.
    if (sendGridEnabled) {
        sendViaSendGrid({ from: `Peko<${fromAddress}>`, to: recipients, subject, html: body, attachments })
            .then((result) => {
                if (result.ok) {
                    customLog(logTraceId, 'info', { message: '[Emailer] Email sent', via: 'sendgrid', to: recipients, attachmentCount: attachments?.length || 0, response: result.response }, 'CONSOLE')
                } else {
                    customLog(logTraceId, 'error', { message: '[Emailer] Failed to send email', via: 'sendgrid', to: recipients, subject, attachmentCount: attachments?.length || 0, error: result.error }, 'CONSOLE')
                }
                if (func) func(result)
            })
        return
    }

    transporter.sendMail(message, (error, info) => {
        if (error) {
            customLog(logTraceId, 'error', { message: '[Emailer] Failed to send email', to: recipients, subject, attachmentCount: attachments?.length || 0, error: error.message || String(error) }, 'CONSOLE')
        } else {
            customLog(logTraceId, 'info', { message: '[Emailer] Email sent', to: recipients, attachmentCount: attachments?.length || 0, response: info?.response }, 'CONSOLE')
        }
        if (func) func(error ? { ok: false, error: error.message || String(error) } : { ok: true, response: info?.response || null })
    })
}

const email = (logTraceId, to, subject, body, func) => send(logTraceId, to, subject, body, null, func)

const emailWithAttachments = (logTraceId, to, subject, body, attachments, func) =>
    send(logTraceId, to, subject, body, attachments, func)

const sendMailResult = (logTraceId, to, subject, body, attachments) =>
    new Promise((resolve) => {
        try {
            send(logTraceId, to, subject, body, attachments, resolve)
        } catch (error) {
            customLog(logTraceId, 'error', { message: '[Emailer] Send threw before dispatch', subject, error: error?.message || String(error) }, 'CONSOLE')
            resolve({ ok: false, error: error?.message || String(error) })
        }
    })

module.exports = { email, emailWithAttachments, sendMailResult }
