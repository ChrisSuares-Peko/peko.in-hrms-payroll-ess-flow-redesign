const { v2Header, v2Footer, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require('./emailTemplate/sharedLayout');

// key: SET_NEW_PASSWORD (service: PASSWORD)
// Shared by two admin-initiated flows (not self-signup): a brand-new SYSTEM_USER account
// (models/use-cases/systemUser.js) and a resent sub-corporate/ESS invite
// (controllers/userManagement.js). `message` is caller-supplied context text; both current
// callers always pass one.
exports.setNewPasswordTemplate = (details, resetUrl, message, partnerDetails) => {
  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Create new password</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Create new password" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Create new password</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${details?.username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">You are receiving this email because you have requested a new password. Please click on the button below to create your password.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
              <tr>
                <td>
                  <a href="${resetUrl}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Create new password</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">${message}</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
