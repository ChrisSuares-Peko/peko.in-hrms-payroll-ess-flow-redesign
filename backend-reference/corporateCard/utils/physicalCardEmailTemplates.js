/**
 * The two physical-card lifecycle mails: order confirmed by the issuer, and card handed to the courier.
 *
 * Each returns { subject, html } so a caller never pairs a body with the wrong subject line. Copy is the
 * product deck's, verbatim; the only substitutions are the four placeholders it defines.
 */

const { buildKybStatusEmail, escapeHtml, inlineDetail } = require('./kybStatusEmailTemplate')

const SUPPORT_MAILBOX = 'reach@peko.one'

const ISSUER_DISCLAIMER =
    'Corporate Cards are issued by Pine Labs Limited and distributed through Peko Platforms Private Limited.'

const paragraph = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px">${text}</p>`

const supportLink = () =>
    `<a href="mailto:${SUPPORT_MAILBOX}" style="color:#FF4F4F;text-decoration:underline">${SUPPORT_MAILBOX}</a>`

/** The deck's numbered "what to expect" list. A table, not an <ol>, so Outlook keeps the indent. */
const numbered = (items) => `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
        ${items.map((item, index) => `
        <tr>
            <td valign="top" style="width:20px;padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${index + 1}.</td>
            <td valign="top" style="padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${item}</td>
        </tr>`).join('')}
    </table>`

const greeting = (firstName) => paragraph(`Hi ${escapeHtml(firstName) || 'there'},`)

const detail = (label, value) => (value ? inlineDetail(label, escapeHtml(value)) : '')

const lifecycleEmail = ({ subject, body }) => ({
    subject,
    html: buildKybStatusEmail({
        title: subject.replace(/^Peko \| /, ''),
        headline: subject.replace(/^Peko \| /, ''),
        preheader: subject,
        paragraphHtml: body.join(''),
        signOff: 'Thanks,<br>Team Peko',
        disclaimerHtml: ISSUER_DISCLAIMER,
    }),
})

/** Physical card request confirmed — the issuer accepted the order and is preparing the card. */
exports.physicalCardConfirmedTemplate = ({ firstName, cardReferenceNumber, deliveryAddress } = {}) =>
    lifecycleEmail({
        subject: 'Peko | Your physical corporate card is approved',
        body: [
            greeting(firstName),
            paragraph('Your request for a physical corporate card has been confirmed and your card is now being prepared for dispatch.'),
            detail('Card reference number', cardReferenceNumber),
            detail('Delivery address', deliveryAddress),
            paragraph("We'll email you again with tracking details as soon as your card is dispatched. Your virtual card remains active in the meantime, so you can continue to spend as usual."),
            paragraph(`If the delivery address above is incorrect, please contact us at ${supportLink()} before dispatch.`),
        ],
    })

/** Physical card dispatched — handed to the courier, with what the cardholder should expect. */
exports.physicalCardDispatchedTemplate = ({ firstName, courierPartner, awbNumber, deliveryAddress } = {}) =>
    lifecycleEmail({
        subject: 'Peko | Your physical corporate card has been dispatched',
        body: [
            greeting(firstName),
            paragraph('Your physical corporate card has been dispatched and is on its way.'),
            detail('Courier partner', courierPartner),
            detail('Tracking / AWB number', awbNumber),
            detail('Delivery address', deliveryAddress),
            paragraph('<b style="color:#111827">What to expect on delivery:</b>'),
            numbered([
                "Delivery is OTP-verified. You'll receive an SMS with a one-time password on your registered mobile number, which you'll need to share with the delivery agent to receive the card.",
                "Up to three delivery attempts will be made. If the card can't be delivered, it will be returned and we'll get in touch to arrange redelivery.",
                'Once you receive your card, activate it from your Peko account before first use.',
            ]),
            paragraph(`If you still have questions - please feel free to write to us at ${supportLink()}.`),
        ],
    })
