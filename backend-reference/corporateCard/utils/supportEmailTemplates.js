/**
 * The support team's approved Corporate Cards copy, one builder per scenario.
 *
 * Each returns { subject, html } so a caller never has to pair a template with the right subject line
 * by hand. The shell is buildKybStatusEmail — the same v2Header/v2Footer chrome every other Peko
 * microservice's mail uses — with the deck's own sign-off and the issuer disclaimer.
 */

const {
    buildKybStatusEmail, escapeHtml, getServiceUrl, fundingAccountSection, inlineDetail,
} = require('./kybStatusEmailTemplate')
const { SUPPORT_EMAIL, ISSUER_DISCLAIMER, SUPPORT_SIGN_OFF } = require('../constants/supportEmails')

const paragraph = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px">${text}</p>`

const sectionLabel = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:22px;color:#111827;font-size:15px;font-weight:700;padding-bottom:8px">${text}</p>`

const greeting = (customerName) => paragraph(`Hello ${escapeHtml(customerName) || 'there'},`)

const cardsUrl = () => `${getServiceUrl()}/corporate-cards`

/** The deck's bulleted asks - dots rather than arrows, for things to send back rather than do. */
const bullets = (items) => `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
        ${items.map((item) => `
        <tr>
            <td valign="top" style="width:20px;padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">&bull;</td>
            <td valign="top" style="padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${escapeHtml(item)}</td>
        </tr>`).join('')}
    </table>`

/** The deck's numbered checks. Same table trick as `steps`, with the ordinal in the gutter. */
const numbered = (items) => `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
        ${items.map((item, index) => `
        <tr>
            <td valign="top" style="width:20px;padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${index + 1}.</td>
            <td valign="top" style="padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${escapeHtml(item)}</td>
        </tr>`).join('')}
    </table>`

/** The deck's arrow-prefixed walkthroughs. A table, not a <ul>, so Outlook keeps the indent. */
const steps = (items) => `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
        ${items.map((item) => `
        <tr>
            <td valign="top" style="width:20px;padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">&rarr;</td>
            <td valign="top" style="padding:0 0 8px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${escapeHtml(item)}</td>
        </tr>`).join('')}
    </table>`

/** Every scenario differs only in its copy, so the shared wrapper carries everything else. */
const supportEmail = ({ subject, headline, body, buttonLabel, buttonHref }) => ({
    subject,
    html: buildKybStatusEmail({
        title: headline,
        headline,
        preheader: subject,
        paragraphHtml: body.join(''),
        buttonLabel,
        buttonHref,
        signOff: SUPPORT_SIGN_OFF,
        disclaimerHtml: ISSUER_DISCLAIMER,
    }),
})

/** KYB/KYC — application process delays. Sent when the application moves to UNDER_REVIEW. */
exports.applicationUnderReviewTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Application review in progress',
        headline: 'Application review in progress',
        body: [
            greeting(customerName),
            paragraph('Your corporate card application has been submitted to Pine Labs for review. It is currently under assessment as per the applicable compliance guidelines. The standard turnaround time is 4&ndash;5 working days, subject to all required documentation being completed by Pine Labs.'),
        ],
    })

/** Account status — application submitted but the account is not active yet. Sent on KYB submit. */
exports.applicationNotActiveTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Application status clarification',
        headline: 'Application status clarification',
        body: [
            greeting(customerName),
            paragraph('We wanted to inform you that submitting an application does not mean your corporate card account is active yet. Your application is still under review and the account will be activated once all checks are completed. This usually takes 4&ndash;5 days until the account is activated.'),
        ],
    })

/**
 * Account status — application approved. Sent when KYB is marked VERIFIED.
 *
 * The funding account block and KYB reference are what the previous approval mail carried: the copy
 * deck has no slot for them, but a corporate cannot fund its wallet without those bank details, so
 * they stay below the approved copy rather than being dropped.
 */
exports.applicationApprovedTemplate = ({ customerName, kybReference, fundingAccount } = {}) =>
    supportEmail({
        subject: 'Peko | Application approved',
        headline: 'Application approved',
        body: [
            greeting(customerName),
            paragraph('Your KYB application has been approved by Pine Labs. You can now log in to the Peko platform to access your corporate card dashboard.'),
            fundingAccountSection(fundingAccount),
            kybReference ? inlineDetail('Reference', escapeHtml(kybReference)) : '',
        ],
        buttonLabel: 'Login',
        buttonHref: cardsUrl(),
    })

/** Card application — card ordered but not issued. Sent when a card order is placed. */
exports.cardRequestReceivedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Card request received',
        headline: 'Card request received',
        body: [
            greeting(customerName),
            paragraph("We've received your request to issue a corporate card. Once approved, your virtual card will be visible on your Peko dashboard for immediate use."),
        ],
    })

/**
 * Card Delivery — card not delivered / delivery delayed.
 *
 * Support-sent: the courier reports dispatch to us but never delivery, so nothing here can tell a
 * late card from one that already arrived.
 */
exports.cardDeliveryDelayTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Card delivery delay',
        headline: 'Card delivery delay',
        body: [
            greeting(customerName),
            paragraph('We understand your physical card has not yet been delivered. Please note card delivery takes around 3-5 business days depending on the delivery location.'),
            paragraph('You can also track the status of your card anytime from your Peko dashboard.'),
            paragraph("If the delay continues, we'll raise this with Pine Labs and update you on the status."),
        ],
        buttonLabel: 'Track Your Order',
        buttonHref: cardsUrl(),
    })

/**
 * Card application — virtual card in hand, physical one still travelling.
 *
 * Support-sent since 2026-09-28: the dispatch webhook now sends the richer lifecycle mail
 * (utils/physicalCardEmailTemplates.js, with courier, AWB and the OTP steps) in its place.
 */
exports.physicalCardInProgressTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Physical card delivery in progress',
        headline: 'Physical card delivery in progress',
        body: [
            greeting(customerName),
            paragraph('Your virtual card is activated as soon as your application is approved, so you can start using it right away from your dashboard.'),
            paragraph('Your physical card, however, takes a little longer to reach you as it is dispatched and delivered separately. You can track its delivery status anytime from your dashboard.'),
        ],
        buttonLabel: 'Track Your Card',
        buttonHref: cardsUrl(),
    })

/**
 * Card status — delivered but not activated.
 *
 * Support-sent: nothing on the card records whether it was activated. `resetPinLink` is a URL handed
 * to the cardholder, not a state, and there is no delivery confirmation to count forward from either.
 */
exports.cardActivationPendingTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Card activation pending',
        headline: 'Card activation pending',
        body: [
            greeting(customerName),
            paragraph('We understand your physical corporate card has been delivered but is not yet activated. Kindly confirm if you have completed the activation steps.'),
            paragraph("Once confirmed, we'll check the status with Pine Labs and update you shortly."),
        ],
    })

/**
 * Card Termination — request acknowledged. Sent when a corporate raises the request.
 *
 * The deck's copy promises an attached indemnity form. No such file exists in the service, so the
 * sentence only claims an attachment when one is actually going out; otherwise it says how to get it
 * rather than pointing at something that is not there.
 */
exports.cardTerminationRequestedTemplate = ({ customerName, hasIndemnityForm = false } = {}) =>
    supportEmail({
        subject: 'Peko | Card termination request received',
        headline: 'Card termination request received',
        body: [
            greeting(customerName),
            hasIndemnityForm
                ? paragraph("We've received your request to terminate your corporate card. To proceed, please find the indemnity form attached. Kindly read through it and send us a signed copy to complete the process.")
                : paragraph("We've received your request to terminate your corporate card. To proceed, we'll share an indemnity form with you shortly. Kindly read through it and send us a signed copy to complete the process."),
            paragraph('Once your request is approved, the card will be terminated, and any remaining funds will be transferred back to the account that originally funded the card.'),
        ],
    })

/** Wallet top-up — how to move money in. Support-sent: a how-to has no event of its own. */
exports.walletTopupHowToTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Topping up your wallet',
        headline: 'Topping up your wallet',
        body: [
            greeting(customerName),
            paragraph('You can top up your wallet directly using NEFT/RTGS/IMPS. Please follow these steps:'),
            steps([
                'Log in to the Peko platform',
                'Navigate to the Wallet Top-Up option',
                'View the account details provided to process your payment',
                'Complete the transfer using NEFT/RTGS/IMPS',
            ]),
            paragraph('Please note, the amount may take some time to reflect on your dashboard depending on the transfer method used.'),
        ],
    })

/**
 * Wallet top-up — money sent, balance not showing. Sent from the reload webhook when Pine Labs
 * reports a non-zero response code: the transfer reached them but never became a ledger credit.
 */
exports.walletTopupPendingTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Wallet top-up pending',
        headline: 'Wallet top-up pending',
        body: [
            greeting(customerName),
            paragraph('We understand your wallet top-up is not yet reflecting on your dashboard. This can happen due to processing timelines on NEFT/RTGS/IMPS transfers.'),
            paragraph("We'll verify the details with Pine Labs, and inform you shortly about the updated timeline."),
        ],
    })

// Shared by the admin and employee decline mails — the deck gives both the identical two checks.
const DECLINE_CHECKS = [
    'whether the merchant has been allowed under your card settings',
    'If the merchant is allowed and the transaction still declined, this may be due to the spending limit set on the card',
]

/** Employee card — how an admin issues one. Support-sent: a how-to has no event of its own. */
exports.employeeCardHowToTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Issuing a card to your employee',
        headline: 'Issuing a card to your employee',
        body: [
            greeting(customerName),
            paragraph('You can issue a corporate card to your employee directly from the Peko platform. Please follow these steps:'),
            steps([
                'Log in to the Peko platform',
                'Navigate to the Cards section',
                'Select the option to assign or issue a card to a specific employee',
                'Fill out the necessary employee details',
                'Select Issue Card',
            ]),
            paragraph('Once submitted, your employee will be required to complete their KYC. The card will be activated once the KYC process is completed.'),
            paragraph("Please note card issuance is on PineLabs' discretion."),
        ],
    })

/**
 * Employee card — issued but the employee has not received it.
 *
 * Support-sent for the same reason as the other delivery scenarios: the courier reports dispatch and
 * never delivery, so nothing here can tell a late card from one already in the employee's hands.
 */
exports.employeeCardNotReceivedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Employee card delivery status',
        headline: 'Employee card delivery status',
        body: [
            greeting(customerName),
            paragraph("We understand your employee has not yet received their assigned card. This can occur if the employee's KYC is still pending, or due to standard card issuance timelines."),
            paragraph('Please note the standard timeline for card delivery is 3-5 business days. You can track the delivery updates through the dashboard.'),
            paragraph("Let us know in case it's been delayed and we'll raise it to PineLabs on your behalf."),
        ],
        buttonLabel: 'View Cards',
        buttonHref: cardsUrl(),
    })

/**
 * Transaction declined — the admin's copy.
 *
 * Support-sent. The JIT webhook does know why a card was declined, and RESTRICTED_MERCHANT_CATEGORY /
 * OVER_PER_TXN_LIMIT / OVER_PERIOD_LIMIT are exactly the two causes this mail asks about — but the copy
 * answers a complaint ("We understand a valid transaction was declined"), which is wrong to send to
 * someone who has not complained, and declines are far too frequent to mail unprompted.
 */
exports.transactionDeclinedAdminTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Transaction decline - next steps',
        headline: 'Transaction decline - next steps',
        body: [
            greeting(customerName),
            paragraph('We understand a valid transaction was declined. Please check the following and confirm:'),
            numbered(DECLINE_CHECKS),
            paragraph("If the issue persists after these checks, please reach out to Peko Support and we'll help you resolve the issue."),
        ],
    })

/** Transaction declined — the employee's copy: same checks, but they cannot change either setting. */
exports.transactionDeclinedEmployeeTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Transaction decline - next steps',
        headline: 'Transaction decline - next steps',
        body: [
            greeting(customerName),
            paragraph('We understand a valid transaction was declined. Please check the following and confirm:'),
            numbered(DECLINE_CHECKS),
            paragraph("Please check with your admin if both are configured. If the issue persists after these checks, please reach out to Peko Support and we'll help you resolve the issue."),
        ],
    })

/** Transaction history not refreshing. Support-sent: a bug report starts with the customer. */
exports.transactionHistoryIssueTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Transaction history issue',
        headline: 'Transaction history issue',
        body: [
            greeting(customerName),
            paragraph('We understand your transaction history is not updating correctly or is showing incorrect data. Kindly share the screenshot of the error with us.'),
            paragraph("We'll raise this issue with our tech team and update you on the next steps soon."),
        ],
    })

/** User settings — how to change permissions. Support-sent: a how-to has no event of its own. */
exports.settingsHowToTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Updating your settings',
        headline: 'Updating your settings',
        body: [
            greeting(customerName),
            paragraph('You can update your permission settings directly from the Peko platform. Please follow these steps:'),
            steps([
                'Log in to the Peko platform',
                'Navigate to Settings',
                "Select the permissions you'd like to modify",
                'Save your changes',
            ]),
            paragraph('Once updated, you can confirm the changes have been applied under your Settings page.'),
        ],
    })

/**
 * Approvals — the admin approved, the employee never saw it.
 *
 * Support-sent. Approvals do exist here (CARD_ISSUANCE, LIMIT_INCREASE, TOPUP, TERMINATE, UNFREEZE all
 * raise an in-app notification), but "did not receive it" is a delivery complaint about the other side
 * of that call — nothing this service records tells us the employee failed to see one.
 */
exports.approvalNotReceivedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Approval status issue',
        headline: 'Approval status issue',
        body: [
            greeting(customerName),
            paragraph("We understand your employee has not received the approval that was sent. Please share a screenshot of the request status reflected on the employee's dashboard, so we can verify the issue."),
            paragraph("If an issue is found, we'll raise it with our tech team and update you on the resolution."),
        ],
    })

/** Approvals — the employee raised one, the admin cannot see it. Support-sent, same reason. */
exports.approvalNotReflectingTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Approval status issue',
        headline: 'Approval status issue',
        body: [
            greeting(customerName),
            paragraph('We understand the approval request sent by your employee is not reflecting on the admin dashboard. Please share a screenshot of the request status from both the employee and admin portals, so we can verify the issue.'),
            paragraph("If an issue is found, we'll raise it with our tech team and update you on the resolution."),
        ],
    })

/**
 * Subscriptions — managing recurring ones.
 *
 * Support-sent, and the only mail in the deck whose instructions this service cannot back: corporate
 * cards has no subscriptions feature, so "Settings -> Subscriptions" is a path in some other part of
 * the platform, if it exists at all. Kept verbatim rather than invented; confirm before support uses it.
 */
exports.subscriptionsHowToTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Managing subscriptions',
        headline: 'Managing subscriptions',
        body: [
            greeting(customerName),
            paragraph('You can view and manage your recurring subscriptions directly from the app.'),
            paragraph('<b style="color:#111827">Path:</b><br>Settings &rarr; Subscriptions &rarr; View active subscriptions &rarr; Manage / Cancel.'),
        ],
    })

/** Card Management — freeze / unfreeze. Support-sent: a how-to has no event of its own. */
exports.freezeUnfreezeHowToTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Freezing or unfreezing your card',
        headline: 'Freezing or unfreezing your card',
        body: [
            greeting(customerName),
            paragraph('You can freeze or unfreeze your corporate card directly from the Peko platform. Please follow these steps:'),
            steps([
                'Log in to the Peko platform',
                'Navigate to the Cards section',
                'Select the Freeze / Unfreeze option',
                'Confirm your selection',
            ]),
            paragraph('You can verify the updated status of your card once the action is completed.'),
        ],
        buttonLabel: 'Manage Cards',
        buttonHref: cardsUrl(),
    })

/** Card Management - reactivating a dormant card by SMS. Support-sent: a how-to has no event. */
exports.cardReactivationHowToTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Reactivating your card',
        headline: 'Reactivating your card',
        body: [
            greeting(customerName),
            paragraph('You can reactivate your card by sending an SMS from your card-mapped mobile number. Please follow these steps:'),
            steps([
                "Send an SMS with your card reference number's last 4 digits to 56161536",
                'Wait for your card to be activated',
                "You'll receive an SMS confirmation once the reactivation is complete",
            ]),
            paragraph('Please note, there are no reactivation charges. Standard SMS charges may apply as per your network provider.'),
        ],
    })

/**
 * Change phone number - request acknowledged.
 *
 * Support-sent: this service has no mobile-number change flow at all, so the request only ever
 * reaches Peko by the customer asking.
 */
exports.mobileNumberChangeTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Mobile number update request received',
        headline: 'Mobile number update request received',
        body: [
            greeting(customerName),
            paragraph("We've received your request to update your registered mobile number. To proceed, please share the following:"),
            bullets([
                'Confirmation that the new number is not currently in use on any other Peko account',
                "Confirmation of your card's current status (active/dormant), so we can reactivate it first if required",
            ]),
            paragraph("We're raising this request with Pine Labs and will update you once the change is complete."),
        ],
    })

/**
 * Account closure - request acknowledged. Sent when a corporate raises the request.
 *
 * The deck's copy also walks through how to raise one, which a corporate that just did so does not
 * need; kept verbatim rather than edited, since the closing line ("we're raising this with Pine Labs")
 * is what makes it an acknowledgement. Worth a product decision before it ships.
 */
exports.accountClosureRequestedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Account closure request',
        headline: 'Account closure request',
        body: [
            greeting(customerName),
            paragraph('Please note that only the admin can raise a request to close the account.'),
            steps([
                'Log in to the Peko platform',
                'Navigate to Settings',
                'Select the option to raise a request to close the account',
                'Submit your request',
            ]),
            paragraph("We're raising this with Pine Labs and will update you once your request is processed."),
        ],
    })

/**
 * Account Reactivation - request acknowledged.
 *
 * Support-sent: there is no account reactivation flow in this service. The only "reactivation" here
 * is a card coming out of a freeze, which is a different thing entirely.
 */
exports.accountReactivationRequestedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Account reactivation request',
        headline: 'Account reactivation request',
        body: [
            greeting(customerName),
            paragraph('Please note that only the admin can raise a request to reactivate the account.'),
            paragraph("You will not be required to go through the onboarding and document verification process again. We'll raise this request on your behalf and share the next steps with you shortly."),
        ],
    })

/**
 * Refund - request acknowledged.
 *
 * Support-sent: refunds reach this service only as a Pine Labs NOTIFY on one that already happened.
 * A customer asking for one has no route in here to travel down.
 */
exports.refundRequestedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Refund request received',
        headline: 'Refund request received',
        body: [
            greeting(customerName),
            paragraph("We've received your request to raise a refund. To proceed, please share the transaction details along with the reason for requesting the refund."),
            paragraph("We're raising this with Pine Labs on your behalf."),
            paragraph('Please note, the standard timeline for refund processing can vary depending on the case and will be communicated to you once confirmed.'),
        ],
    })

/**
 * Disputes - request acknowledged.
 *
 * Support-sent: nothing in this service records a dispute. Pine Labs owns the chargeback process and
 * the 30-day clock the copy warns about, so the case only exists once support opens it there.
 */
exports.disputeReceivedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Dispute request received',
        headline: 'Dispute request received',
        body: [
            greeting(customerName),
            paragraph("We've received your request to dispute a transaction. To proceed, please share the following details with us:"),
            bullets([
                'Transaction amount',
                'Transaction date',
                'Reference number',
                'Registered mobile number of the cardholder',
            ]),
            paragraph("Please note, chargeback requests must be filed within 30 days from the date of the transaction, so we'd request you to share these details at the earliest."),
            paragraph("Once received, we'll raise this with Pine Labs and update you on the next steps."),
        ],
    })

/**
 * Disputes - the outcome.
 *
 * The only mail in the deck carrying free text: the reference goes in the subject and the outcome in
 * the body, both written by whoever closed the case. Falls back to the bare subject when no reference
 * is supplied rather than printing an empty "Ref# ".
 */
exports.disputeResolvedTemplate = ({ customerName, disputeReference, resolutionDetails } = {}) => {
    const reference = String(disputeReference || '').trim()
    const outcome = String(resolutionDetails || '').trim()

    return supportEmail({
        subject: reference ? `Peko | Dispute resolved - Ref# ${reference}` : 'Peko | Dispute resolved',
        headline: 'Dispute resolved',
        body: [
            greeting(customerName),
            reference ? inlineDetail('Reference Number', escapeHtml(reference)) : '',
            paragraph('Your dispute has been reviewed and resolved. Please find the outcome below:'),
            outcome ? paragraph(escapeHtml(outcome)) : '',
            paragraph('If you have any further questions regarding this resolution, please reach out to Peko Support.'),
        ],
    })
}

/**
 * Fraudulent Transactions - report acknowledged.
 *
 * Support-sent: no fraud-reporting route exists here. The freeze the copy asks for IS available in the
 * product, so the mail links straight to it rather than only describing it.
 */
exports.fraudReportedTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Fraud report received - urgent action required',
        headline: 'Fraud report received - urgent action required',
        body: [
            greeting(customerName),
            paragraph('Thank you for reporting this transaction. We take such matters seriously and have prioritized your case.'),
            paragraph('As an immediate step, please freeze the affected card from your dashboard to prevent any further misuse.'),
            sectionLabel("Here's what happens next:"),
            steps([
                'We log your case with Pine Labs, including the transaction details and your statement',
                'Pine Labs escalates the case to the scheme holder for a formal fraud investigation',
                'We may reach out if any additional information is needed during the investigation',
                "Once the investigation is complete, we'll share the outcome with you",
                'If the fraud claim is confirmed, the refund will be processed as per scheme rules and credited to the main corporate account',
            ]),
            sectionLabel('To help us log your case, please share the following:'),
            bullets([
                'Transaction details (amount, date, reference number)',
                'A brief statement describing the incident',
                'Any supporting evidence (screenshots, communication, etc.), if available',
            ]),
        ],
        buttonLabel: 'Freeze Card',
        buttonHref: cardsUrl(),
    })

/**
 * Pine Labs outage.
 *
 * Support-sent, and unlike everything else in the deck this one goes to every affected corporate at
 * once. The send endpoint takes a single corporate, so a real outage needs a broadcast route before
 * this is usable at scale.
 */
exports.outagePinelabsTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Service disruption update',
        headline: 'Service disruption update',
        body: [
            greeting(customerName),
            paragraph("We're currently experiencing a service disruption on the Pine Labs network, which may cause some transactions to fail."),
            paragraph("Our team is actively working with Pine Labs to resolve this at the earliest. We'll keep you updated on the status until the issue is fully resolved."),
            paragraph('We apologize for the inconvenience and appreciate your patience.'),
        ],
    })

/** Issuer bank outage. Same broadcast shape as the Pine Labs one, different cause. */
exports.outageIssuerBankTemplate = ({ customerName } = {}) =>
    supportEmail({
        subject: 'Peko | Service disruption update',
        headline: 'Service disruption update',
        body: [
            greeting(customerName),
            paragraph("We're currently experiencing a service disruption due to an issuer bank outage, which may cause your card to not work across merchants."),
            paragraph("Our team has escalated this with Pine Labs and is actively monitoring the situation until services are fully restored. We'll keep you updated on the status."),
            paragraph('We apologize for the inconvenience and appreciate your patience.'),
        ],
    })

/**
 * Key -> builder, for the scenarios support sends by hand and for re-sending an automatic one.
 * Later batches register themselves here; nothing else needs to change to expose them.
 */
exports.SUPPORT_EMAIL_TEMPLATES = {
    [SUPPORT_EMAIL.APPLICATION_UNDER_REVIEW]: exports.applicationUnderReviewTemplate,
    [SUPPORT_EMAIL.APPLICATION_NOT_ACTIVE]: exports.applicationNotActiveTemplate,
    [SUPPORT_EMAIL.APPLICATION_APPROVED]: exports.applicationApprovedTemplate,
    [SUPPORT_EMAIL.CARD_REQUEST_RECEIVED]: exports.cardRequestReceivedTemplate,
    [SUPPORT_EMAIL.CARD_DELIVERY_DELAY]: exports.cardDeliveryDelayTemplate,
    [SUPPORT_EMAIL.PHYSICAL_CARD_IN_PROGRESS]: exports.physicalCardInProgressTemplate,
    [SUPPORT_EMAIL.CARD_ACTIVATION_PENDING]: exports.cardActivationPendingTemplate,
    [SUPPORT_EMAIL.CARD_TERMINATION_REQUESTED]: exports.cardTerminationRequestedTemplate,
    [SUPPORT_EMAIL.WALLET_TOPUP_HOW_TO]: exports.walletTopupHowToTemplate,
    [SUPPORT_EMAIL.WALLET_TOPUP_PENDING]: exports.walletTopupPendingTemplate,
    [SUPPORT_EMAIL.EMPLOYEE_CARD_HOW_TO]: exports.employeeCardHowToTemplate,
    [SUPPORT_EMAIL.EMPLOYEE_CARD_NOT_RECEIVED]: exports.employeeCardNotReceivedTemplate,
    [SUPPORT_EMAIL.TRANSACTION_DECLINED_ADMIN]: exports.transactionDeclinedAdminTemplate,
    [SUPPORT_EMAIL.TRANSACTION_DECLINED_EMPLOYEE]: exports.transactionDeclinedEmployeeTemplate,
    [SUPPORT_EMAIL.TRANSACTION_HISTORY_ISSUE]: exports.transactionHistoryIssueTemplate,
    [SUPPORT_EMAIL.SETTINGS_HOW_TO]: exports.settingsHowToTemplate,
    [SUPPORT_EMAIL.APPROVAL_NOT_RECEIVED]: exports.approvalNotReceivedTemplate,
    [SUPPORT_EMAIL.APPROVAL_NOT_REFLECTING]: exports.approvalNotReflectingTemplate,
    [SUPPORT_EMAIL.SUBSCRIPTIONS_HOW_TO]: exports.subscriptionsHowToTemplate,
    [SUPPORT_EMAIL.FREEZE_UNFREEZE_HOW_TO]: exports.freezeUnfreezeHowToTemplate,
    [SUPPORT_EMAIL.CARD_REACTIVATION_HOW_TO]: exports.cardReactivationHowToTemplate,
    [SUPPORT_EMAIL.MOBILE_NUMBER_CHANGE]: exports.mobileNumberChangeTemplate,
    [SUPPORT_EMAIL.ACCOUNT_CLOSURE_REQUESTED]: exports.accountClosureRequestedTemplate,
    [SUPPORT_EMAIL.ACCOUNT_REACTIVATION_REQUESTED]: exports.accountReactivationRequestedTemplate,
    [SUPPORT_EMAIL.REFUND_REQUESTED]: exports.refundRequestedTemplate,
    [SUPPORT_EMAIL.DISPUTE_RECEIVED]: exports.disputeReceivedTemplate,
    [SUPPORT_EMAIL.DISPUTE_RESOLVED]: exports.disputeResolvedTemplate,
    [SUPPORT_EMAIL.FRAUD_REPORTED]: exports.fraudReportedTemplate,
    [SUPPORT_EMAIL.OUTAGE_PINELABS]: exports.outagePinelabsTemplate,
    [SUPPORT_EMAIL.OUTAGE_ISSUER_BANK]: exports.outageIssuerBankTemplate,
}
