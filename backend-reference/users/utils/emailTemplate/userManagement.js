/* eslint-disable no-irregular-whitespace */
const { v2Header, v2Footer, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

const buildWelcomeServicesHtml = (services) => {
  const list = Array.isArray(services) ? services.filter(Boolean) : [];
  return list.length
    ? list.map((service, index) => `
      <p style="margin: 0; -webkit-text-size-adjust: none; -ms-text-size-adjust: none; mso-line-height-rule: exactly; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; line-height: 23px; color: #0e0d0d; font-size: 15px;">
          <strong>${index + 1}. ${service.label}&nbsp;</strong>
      </p>
  `).join('')
    : '';
};
exports.buildWelcomeServicesHtml = buildWelcomeServicesHtml;

// key: SUBCORPORATE_WELCOME (service: AUTH)
exports.createPassword = (subCorporateUser, resetUrl, partnerData) => {
  const website = partnerData?.baseUrl || 'https://in.peko.one';
  const branding = partnerData?.branding || 'Peko';
  const logo = partnerData?.logo;
  const servicesHtml = buildWelcomeServicesHtml(subCorporateUser?.services);

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
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${subCorporateUser?.name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">We are pleased to inform you that your ${branding} account has been created successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 12px 0;">Please find below the service(s) assigned to you by your admin.</p>
            <div style="margin:0 0 20px 0;">${servicesHtml}</div>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 4px 0;">Your Email ID: <strong>${subCorporateUser?.email}</strong></p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Your username: <strong>${subCorporateUser?.username}</strong></p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Kindly click on the button below or copy and paste the link in your browser to create your password and start using ${branding}:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
              <tr>
                <td>
                  <a href="${resetUrl}" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Create Password</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;margin:0 0 28px 0;"><a href="${resetUrl}" target="_blank" style="color:#FF3A3A;text-decoration:underline;word-break:break-all;">${resetUrl}</a></p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">This link is valid for 72 hours. If you do not create your password in time, please contact your admin at ${subCorporateUser?.corporateEmail} to receive the link again.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

exports.disableAccess = (name, email, partnerData) => {
  const website = partnerData?.baseUrl || 'https://in.peko.one';
  const branding = partnerData?.branding || 'Peko';
  const logo = partnerData?.logo;

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Account access has been disabled</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Account access has been disabled" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Account access has been disabled</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">We&rsquo;d like to inform you that your access to your ${branding} account has been disabled by your company admin. This may be due to account restrictions, security reasons, or administrative changes.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


// Single HTML blob for the numbered assigned-services list. The resolver can't loop, so
// the admin-managed template gets one ${servicesHtml} slot instead of hand-building the
// list itself. Used by both the local fallback below and the admin-template variables
// built at the call site (models/use-cases/subCorporateUser.js).
const buildAccessUpdateServicesHtml = (services) => {
  const list = Array.isArray(services) ? services.filter((service) => service?.label) : [];
  if (!list.length) return '&nbsp;';
  return list.map((service, index) => `<p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 8px 0;"><strong>${index + 1}. ${service.label}</strong></p>`).join('');
};
exports.buildAccessUpdateServicesHtml = buildAccessUpdateServicesHtml;

// key: SUBCORPORATE_ACCESS_UPDATED (service: SUBCORPORATE_USER)
exports.UpdateAccess = (subCorporateUser, email, partnerData) => {
  const website = partnerData?.baseUrl || 'https://in.peko.one';
  const branding = partnerData?.branding || 'Peko';
  const logo = partnerData?.logo;
  const name = subCorporateUser?.name;
  const servicesHtml = buildAccessUpdateServicesHtml(subCorporateUser?.services);

  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Service(s) Updated</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Service(s) Updated" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Service(s) Updated</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 12px 0;">This is to inform you that</p>
            <div style="margin:0 0 12px 0;">${servicesHtml}</div>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">has been updated to your ${branding} account.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">If you have any questions, please contact your admin at ${email}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">For any queries or further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;text-decoration:underline;">reach@peko.one</a>.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
