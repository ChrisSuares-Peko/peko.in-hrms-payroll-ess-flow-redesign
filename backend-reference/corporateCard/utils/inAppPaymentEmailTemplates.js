const { buildKybStatusEmail, escapeHtml, getServiceUrl } = require('./kybStatusEmailTemplate');

const paragraph = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px">${text}</p>`;

const formatInr = (amount) =>
    `&#8377;${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const plainInr = (amount) => formatInr(amount).replace('&#8377;', 'Rs. ');

const greeting = (name) => paragraph(`Dear ${escapeHtml(name) || 'Cardholder'},`);

const detailsLine = ({ cardLast4, reference }) => {
    const parts = [];
    if (cardLast4) parts.push(`Card ending ${escapeHtml(cardLast4)}`);
    if (reference) parts.push(`Reference ${escapeHtml(String(reference))}`);
    return parts.length ? paragraph(parts.join(' &middot; ')) : '';
};

// Regulatory: the issuer is named on every in-app debit communication.
const issuerLine = () => paragraph('Corporate card: Issued by Pine Labs.');

const transactionsHref = () => `${getServiceUrl()}/corporate-cards`;

exports.inAppDebitSuccessTemplate = ({ name, amount, cardLast4, reference }) =>
    buildKybStatusEmail({
        title: 'Card Payment Successful',
        iconGlyph: '&#10003;',
        iconColor: '#20C230',
        iconBg: '#E5FFE8',
        headline: 'Your corporate card payment was successful',
        preheader: `${plainInr(amount)} paid on your corporate card.`,
        paragraphHtml: [
            greeting(name),
            paragraph(`A payment of <b>${formatInr(amount)}</b> was made on your corporate card for a purchase on Peko.`),
            detailsLine({ cardLast4, reference }),
            issuerLine(),
            paragraph('You can see this payment in your card transaction history.'),
        ].join(''),
        buttonLabel: 'View Transactions',
        buttonHref: transactionsHref(),
    });

exports.inAppDebitFailureTemplate = ({ name, amount, cardLast4, reference, reason }) =>
    buildKybStatusEmail({
        title: 'Card Payment Failed',
        iconGlyph: '&#10007;',
        iconColor: '#DC2626',
        iconBg: '#FEE2E2',
        headline: 'Your corporate card payment did not go through',
        preheader: `${plainInr(amount)} could not be paid on your corporate card.`,
        paragraphHtml: [
            greeting(name),
            paragraph(`A payment of <b>${formatInr(amount)}</b> on your corporate card was not completed${reason ? `: ${escapeHtml(reason)}` : '.'}`),
            detailsLine({ cardLast4, reference }),
            paragraph('No amount has been taken from your card for this attempt. You can try again or choose another payment method.'),
            issuerLine(),
        ].join(''),
        buttonLabel: 'View Transactions',
        buttonHref: transactionsHref(),
    });

exports.inAppDebitRefundTemplate = ({ name, amount, cardLast4, reference }) =>
    buildKybStatusEmail({
        title: 'Card Payment Refunded',
        iconGlyph: '&#8635;',
        iconColor: '#2563EB',
        iconBg: '#DBEAFE',
        headline: 'Your corporate card payment was refunded',
        preheader: `${plainInr(amount)} returned to your corporate card.`,
        paragraphHtml: [
            greeting(name),
            paragraph(`<b>${formatInr(amount)}</b> has been returned to your corporate card for a purchase on Peko that could not be completed.`),
            detailsLine({ cardLast4, reference }),
            issuerLine(),
            paragraph('The refund shows in your card transaction history.'),
        ].join(''),
        buttonLabel: 'View Transactions',
        buttonHref: transactionsHref(),
    });
