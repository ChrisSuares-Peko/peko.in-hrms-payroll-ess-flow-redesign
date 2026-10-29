const { v2Header, v2Footer, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS, v2SuccessBadge } = require('./sharedLayout');

// key: RESET_PASSWORD (service: PASSWORD)
exports.resetPasswordUrlTemplate = (userData, url, partnerDetails) => {
  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Reset your password</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Reset your password" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Reset your password</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${userData?.name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">You are receiving this email because you have requested a password reset. Please click on the button below to create your password.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
              <tr>
                <td>
                  <a href="${url}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Create new password</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 4px 0;">If the button above does not work, please click on the link given below.</p>
            <p style="font-size:16px;line-height:1.6;margin:0 0 20px 0;"><a href="${url}" target="_blank" style="color:#FF3A3A;text-decoration:underline;word-break:break-all;">${url}</a></p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">If you have not requested this password reset, please ignore this email.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// key: RESET_PASSWORD_SUCCESS (service: PASSWORD)
exports.resetPasswordSuccessTemplate = (userData, passwordSetOrChanged, isChangedOrSet, partnerDetails) => {
  const website = partnerDetails?.baseUrl || 'https://in.peko.one';
  const branding = partnerDetails?.branding || 'Peko';
  const logo = partnerDetails?.logo;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${passwordSetOrChanged}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="${passwordSetOrChanged}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <div style="margin:0 0 24px 0;">${v2SuccessBadge()}</div>
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">${passwordSetOrChanged}</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${userData?.name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">We are pleased to confirm that the password for your ${branding} account <a href="mailto:${userData?.email}" style="color:#000000;text-decoration:underline;">${userData?.email}</a></p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">${userData?.role === 'CORPORATE_SUB_USER' ? '' : `(${branding} account number ${userData?.username}) `}has been ${isChangedOrSet} successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:20px 0 0 0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// key: SET_PASSWORD (service: PASSWORD)
// Self-registered corporate signup (WhatsApp bot today; isAdminCreation exists for a
// possible future admin-created-account path, matching AE's convention) — sent once,
// right after account creation, to set the first password.
exports.setPasswordUrlTemplate = (userData, url, partnerData, isAdminCreation = false) => {
  const website = partnerData?.baseUrl || 'https://in.peko.one';
  const branding = partnerData?.branding || 'Peko';
  const logo = partnerData?.logo;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  const signupIntro = isAdminCreation ? '' : 'Thank you for signing up via WhatsApp. ';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Welcome - Complete your account registration</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Welcome - Complete your account registration" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Welcome to ${branding}! Complete your account registration</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${userData?.name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">${signupIntro}We are excited to have you onboard. To complete your registration, please create a password by clicking on the button below.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
              <tr>
                <td>
                  <a href="${url}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Set Password</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Once you click on the button, you will be directed to our secure Create Password page. After creating the password successfully, you can access your ${branding} account and use the services.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 4px 0;">If the button above does not work, please click on the link given below.</p>
            <p style="font-size:16px;line-height:1.6;margin:0 0 20px 0;"><a href="${url}" target="_blank" style="color:#FF3A3A;text-decoration:underline;word-break:break-all;">${url}</a></p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Leverage our all-in-one platform to manage your payments, expenses, travel, and more!</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
