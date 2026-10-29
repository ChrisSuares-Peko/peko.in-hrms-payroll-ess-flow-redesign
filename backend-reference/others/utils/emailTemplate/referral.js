const { v2Header, v2Footer, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

// key: REFERRAL_INVITE (service: REFERRAL)
// Adapted from the "Welcome to the Peko Partner Referral Program" Figma design
// (node 338:1617), which assumes the recipient already has an account and a
// password-reset link - this flow doesn't create an account at all, it just sends a
// referral-code signup link (see referThroughEmail, corporateUser.js), so the
// account/role/reset-token-specific copy was dropped in favor of wording that fits
// a plain referral link. Confirmed with the user before adapting rather than
// building the account-creation flow the original design assumes.
exports.referralThrougnEmailTemplate = (referralLink, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Welcome to the Peko Partner Referral Program</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Welcome to the Peko Partner Referral Program" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Welcome to the Peko Partner Referral Program</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear User,</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">You've been invited to join the Peko Partner Referral Program.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">The Peko Referral Program lets you earn rewards by referring businesses to ${branding}'s expense management, corporate card, and business banking solutions.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">To get started, simply click the button below to sign up and start referring businesses right away.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
              <tr>
                <td>
                  <a href="${referralLink}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Try ${branding}</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Once you're set up, you'll have everything you need to start referring and earning. If you have any questions along the way, email our support team at <a href="mailto:help@peko.one" style="color:#000000;text-decoration:underline;">help@peko.one</a>.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We're glad to have you with us.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
