const [{ logo: PEKO_LOGO_URL }] = require('../public/partnerLogos');

const SOCIAL_LINKS = [
    {
        title: 'Twitter',
        alt: 'Tw',
        href: 'https://x.com/PekoIndia',
        icon: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d',
    },
    {
        title: 'Instagram',
        alt: 'Inst',
        href: 'https://www.instagram.com/peko.india',
        icon: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026',
    },
    {
        title: 'Linkedin',
        alt: 'In',
        href: 'https://www.linkedin.com/company/pekoindia/',
        icon: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd',
    },
];

const POLICY_LINKS = [
    { label: 'Privacy Policy', href: 'https://peko.one/in/privacy-policy/' },
    { label: 'Cookie Policy', href: 'https://peko.one/in/cookie-policy/' },
    { label: 'Terms of Use', href: 'https://peko.one/in/platform-agreement' },
    { label: 'Refund & Cancellation Policy', href: 'https://peko.one/in/refund-policy' },
];

const FOOTER_LINK_STYLE =
    '-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px';

const BODY_TEXT_STYLE =
    "Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px";

const FOOTER_TEXT_STYLE =
    "Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px";

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const socialIconsRow = SOCIAL_LINKS.map(({ title, alt, href, icon }, index) => `
                                            <td valign="top" align="center" style="padding:0;Margin:0${index === SOCIAL_LINKS.length - 1 ? '' : ';padding-right:10px'}">
                                                <a target="_blank" href="${href}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;font-size:15px"><img title="${title}" src="${icon}" alt="${alt}" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                            </td>`).join('');

const policyLinksRow = POLICY_LINKS.map(({ label, href }) =>
    `<a target="_blank" href="${href}" style="${FOOTER_LINK_STYLE}">${label}</a>`
).join('&nbsp;|&nbsp;');

exports.eSignInvitationTemplate = (signerName, initiatorEmail, documentName, signingLink, expiryDate) => {
    const dateOfRequest = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const signer = escapeHtml(signerName) || 'Signer';
    const initiator = escapeHtml(initiatorEmail);
    const document = escapeHtml(documentName);
    const expiry = expiryDate ? escapeHtml(expiryDate) : '';

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>eSign</title>
</head>
<body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Your signature is requested on ${document}.</div>
<div style="background-color:#F1F1F1">
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;background-color:#F1F1F1">
        <tr>
            <td valign="top" style="padding:0;Margin:0">

                <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table cellspacing="0" cellpadding="0" bgcolor="#020101" align="center" style="border-collapse:collapse;border-spacing:0px;background-color:#020101;width:600px">
                                <tr>
                                    <td align="left" style="padding:20px;Margin:0;border-radius:5px">
                                        <p style="Margin:0;line-height:1px;font-size:1px">&nbsp;</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                                <tr>
                                    <td align="left" bgcolor="#ffffff" style="padding:30px 40px 10px 40px;Margin:0;background-color:#ffffff">
                                        <p style="${BODY_TEXT_STYLE}">Dear ${signer},</p>
                                        <p style="${BODY_TEXT_STYLE}"><br><strong style="color:#333333">${initiator}</strong> has requested your signature on a document. Please review and sign it using the button below.</p>
                                        <p style="${BODY_TEXT_STYLE}"><br><span style="color:#888888">Document Title:</span> <strong style="color:#333333">${document}</strong></p>
                                        ${expiry ? `<p style="${BODY_TEXT_STYLE}"><span style="color:#888888">Document Expires On:</span> <strong style="color:#333333">${expiry}</strong></p>` : ''}
                                        <p style="${BODY_TEXT_STYLE}"><br></p>
                                        <div style="text-align:center;margin-bottom:15px">
                                            <a style="mso-line-height-rule:exactly;text-decoration:none;display:inline-block;box-sizing:border-box;border-radius:12px;background-color:#ff4f4f;padding:14px 20px 14px 20px;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-weight:500;font-size:16px;line-height:24px;letter-spacing:-0.2px;color:#ffffff;vertical-align:top;text-align:center;-webkit-text-size-adjust:none" target="_blank" href="${signingLink}">
                                                <span style="display:block"><span style="white-space:pre-wrap">Review &amp; Sign</span></span>
                                            </a>
                                        </div>
                                        <p style="${BODY_TEXT_STYLE}"><strong style="color:#333333">Please do not share this email.</strong> The link above is unique to you and allows anyone who opens it to sign on your behalf.</p>
                                        <p style="${BODY_TEXT_STYLE}"><br>If you need changes to the document, or have any questions about its contents, please reply to the sender directly at ${initiator}. For anything else, contact us at reach@peko.one.</p>
                                        <p style="${BODY_TEXT_STYLE}"><br>Best Regards,</p>
                                        <p style="${BODY_TEXT_STYLE}">Peko</p>
                                        <p style="${BODY_TEXT_STYLE}"><br></p>
                                        <p style="${FOOTER_TEXT_STYLE}">Requested by ${initiator} &nbsp;·&nbsp; Date of request: ${dateOfRequest}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table cellpadding="0" cellspacing="0" align="center" style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px">
                                <tr>
                                    <td align="center" bgcolor="#ffffff" style="padding:40px;Margin:0;background-color:#ffffff">
                                        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="border-collapse:collapse;border-spacing:0px">
                                            <tr>
                                                <td align="center" style="padding:0;Margin:0;font-size:0px">
                                                    <a target="_blank" href="https://peko.one/in" style="text-decoration:none">
                                                        <img src="${PEKO_LOGO_URL}" alt="Peko" width="110" height="38" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                    </a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                                    <p style="${FOOTER_TEXT_STYLE}">This email was sent to you by the Peko eSignature Service.</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                                    <p style="${FOOTER_TEXT_STYLE}">${policyLinksRow}</p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding:0;Margin:0">
                                                    <p style="${FOOTER_TEXT_STYLE}">&copy; ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                    <tr>
                        <td align="center" style="padding:0;Margin:0">
                            <table cellspacing="0" cellpadding="0" bgcolor="#0c0c0c" align="center" style="border-collapse:collapse;border-spacing:0px;background-color:#0c0c0c;width:600px">
                                <tr>
                                    <td align="center" bgcolor="#0c0c0c" style="Margin:0;padding:15px 40px 20px 40px;background-color:#0c0c0c">
                                        <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="border-collapse:collapse;border-spacing:0px">
                                            <tr>
                                                <td align="center" style="padding:0;Margin:0">
                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px">
                                                        <a href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:15px" target="_blank">www.peko.one</a>
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding:0;Margin:0;padding-top:14px;font-size:0">
                                                    <table cellspacing="0" cellpadding="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;display:inline-block">
                                                        <tr>${socialIconsRow}
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</div>
</body>
</html>
    `;
};
