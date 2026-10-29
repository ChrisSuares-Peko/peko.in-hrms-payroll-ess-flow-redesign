const { buildKybStatusEmail } = require('./kybStatusEmailTemplate');

const paragraph = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px">${text}</p>`;

// Figma: "Your Peko corporate card has been closed" (node 15474:1009, Peko-Corporate-Cards).
// Icon is a custom red card glyph in Figma — using the plain X-glyph-in-red-circle
// fallback for now (user's call); swap to iconImageUrl once a hosted asset is provided.
exports.terminationCompletedTemplate = (name, cardLast4) => {
    const cardLabel = cardLast4 ? `ending in ${cardLast4}` : 'on your account';
    const paragraphHtml = [
        paragraph(`Dear ${name},`),
        paragraph(`Your Peko corporate card ${cardLabel} has been permanently closed and can no longer be used for transactions.`),
        paragraph('If you have questions or need a new card, please log in using the link below, or contact us for assistance:'),
    ].join('');

    return buildKybStatusEmail({
        title: 'Card Terminated',
        iconGlyph: '&#10005;',
        iconColor: '#F90000',
        iconBg: '#FFE5E5',
        headline: 'Your Peko corporate card has been closed',
        paragraphHtml,
        buttonLabel: 'Login Now',
    });
};
