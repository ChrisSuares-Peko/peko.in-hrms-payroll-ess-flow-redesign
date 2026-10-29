const { buildKybStatusEmail, escapeHtml, getServiceUrl } = require('./kybStatusEmailTemplate');

const paragraph = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px">${text}</p>`;

const formatInr = (amount) =>
    `&#8377;${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

exports.walletTopupSuccessTemplate = ({ companyName, totalAmount, credits = [] }) => {
    const name = escapeHtml(companyName) || 'Customer';

    const creditLines = credits.map(({ amount, cardLast4, reference }) => {
        const parts = [formatInr(amount)];
        if (cardLast4) parts.push(`card ending ${escapeHtml(cardLast4)}`);
        if (reference) parts.push(`ref ${escapeHtml(reference)}`);
        return parts.join(' &middot; ');
    });

    const paragraphHtml = [
        paragraph(`Dear ${name},`),
        paragraph(`Your wallet top-up of <b>${formatInr(totalAmount)}</b> was successful. The amount has been credited to your Corporate Cards wallet and is available to use.`),
        credits.length > 1 ? paragraph(creditLines.join('<br>')) : '',
        paragraph('You can view this credit in your wallet transaction history.'),
    ].join('');

    return buildKybStatusEmail({
        title: 'Wallet Top-up Successful',
        iconGlyph: '&#10003;',
        iconColor: '#20C230',
        iconBg: '#E5FFE8',
        headline: 'Your wallet top-up was successful',
        preheader: `${formatInr(totalAmount).replace('&#8377;', 'Rs. ')} credited to your Corporate Cards wallet.`,
        paragraphHtml,
        buttonLabel: 'View Wallet',
        buttonHref: `${getServiceUrl()}/corporate-cards`,
    });
};
