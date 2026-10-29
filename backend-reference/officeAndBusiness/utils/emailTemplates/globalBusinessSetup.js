const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { socialIconCells, websiteLabel, v2Header, v2Footer, v2SuccessBadge, v2RejectBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

const V2_HEAD_STYLE = `
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
      <!--[if mso]>
      <noscript>
      <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
      </xml>
      </noscript>
      <![endif]-->
      <!--[if lte mso 11]>
      <style type="text/css">
        .mj-outlook-group-fix { width:100% !important; }
      </style>
      <![endif]-->
      <style type="text/css">
        @media only screen and (min-width:480px) {
          .mj-column-per-100 { width:100% !important; max-width: 100%; }
        }
      </style>
      <style media="screen and (min-width:480px)">
        .moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
      </style>
      <style type="text/css">
        @media only screen and (max-width:479px) {
          table.mj-full-width-mobile { width: 100% !important; }
          td.mj-full-width-mobile { width: auto !important; }
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>`;

// Small v2 building blocks shared by the five GBS status emails.
const paragraph = (html, paddingBottom = 16) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`;

const bulletList = (items) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <ul style="font-family:${FONT};font-size:16px;line-height:1.6;color:#000000;margin:0;padding-left:20px;">
                                    ${items.map((item) => `<li style="margin-bottom:8px;">${item}</li>`).join('')}
                                  </ul>
                                </td>
                              </tr>`;

const ctaButton = (url, label) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <a href="${url}" target="_blank" rel="noopener" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">${label}</a>
                                </td>
                              </tr>`;

const helpLine = (prefix) => paragraph(`${prefix} <a href="mailto:help@peko.one" style="color:#000000;">help@peko.one</a>.`);

const signOff = (branding) => `
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best Regards,<br>Team ${branding}</div>
                                </td>
                              </tr>`;

const partnerLinks = (partnerDetails, id) => {
  const website = partnerDetails?.website || partnerDetails?.baseUrl || 'https://in.peko.one';
  const baseUrl = partnerDetails?.baseUrl || website;
  return {
    dashboardUrl: `${baseUrl}/dashboard`,
    applicationUrl: `${baseUrl}/more-services/global-business-setup/applications/view-details/${id}`,
  };
};

// v2 page: header, white 680px card with optional badge + heading + body rows, footer.
const gbsLayout = ({ title, badge = '', bodyRows, partnerDetails }) => {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || partnerDetails?.baseUrl || 'https://in.peko.one';
  const logo = partnerDetails?.logo;
  const { socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });

  const badgeRow = badge
    ? `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${badge}
                                </td>
                              </tr>`
    : '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${title}</title>${V2_HEAD_STYLE}
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${title}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:680px;" width="680" bgcolor="#F9FAFB" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:640px;" ><![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>${badgeRow}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${title}</div>
                                </td>
                              </tr>${bodyRows}${signOff(branding)}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

// key: GBS_REJECTED (service: GLOBAL_BUSINESS_SETUP)
exports.globalBusinessSetupRejected = (name, partnerDetails, id) => {
  const { applicationUrl } = partnerLinks(partnerDetails, id);
  const bodyRows = `${paragraph(`Dear ${name},`, 20)}${paragraph('Some of the documents or information you submitted could not be approved. To proceed with your company registration, please log in to your account and review the required corrections.')}${paragraph('<strong>What’s Next?</strong>')}${bulletList([
    'Go to your <strong>Action Required</strong>',
    'View the items marked “<strong>Rejected</strong>” or “<strong>Needs Correction</strong>”',
    'Reupload the required documents or update the requested fields',
  ])}${ctaButton(applicationUrl, 'Go to Action Required')}${helpLine('If you need help resolving the issue, feel free to contact your setup manager or email')}`;

  return gbsLayout({ title: 'Corrections Needed for Your Company Setup', badge: v2RejectBadge(), bodyRows, partnerDetails });
};

// key: GBS_NAME_APPROVED (service: GLOBAL_BUSINESS_SETUP)
exports.globalBusinessSetupCompanyNameApproved = (name, proposedName, partnerDetails) => {
  const { dashboardUrl } = partnerLinks(partnerDetails);
  const bodyRows = `${paragraph(`Dear ${name},`, 20)}${paragraph(`Great news! Your proposed company name, <strong>${proposedName}</strong>, has been approved by the licensing authority.`)}${paragraph('We’re now moving to the next step of your setup.', 24)}${ctaButton(dashboardUrl, 'Go to Dashboard')}${helpLine('For any assistance, feel free to reach us at')}`;

  return gbsLayout({ title: 'Company Name Approved', badge: v2SuccessBadge(), bodyRows, partnerDetails });
};

// key: GBS_SHAREHOLDER_VERIFIED (service: GLOBAL_BUSINESS_SETUP)
exports.globalBusinessSetupShareholderAndUBODetailsVerified = (name, partnerDetails) => {
  const { dashboardUrl } = partnerLinks(partnerDetails);
  const bodyRows = `${paragraph(`Dear ${name},`, 20)}${paragraph('We’ve successfully verified the shareholder and UBO (Ultimate Beneficial Owner) details submitted for your company.')}${paragraph('You’re now one step closer to completing your registration. The next step involves document approvals and license finalization.', 24)}${ctaButton(dashboardUrl, 'Go to Dashboard')}${helpLine('Need help? Reach us at')}`;

  return gbsLayout({ title: 'Shareholder & UBO Details Verified', badge: v2SuccessBadge(), bodyRows, partnerDetails });
};

// key: GBS_COMPLETED (service: GLOBAL_BUSINESS_SETUP)
exports.globalBusinessSetupCompanyRegistrationCompleted = (name, partnerDetails, id) => {
  const { applicationUrl } = partnerLinks(partnerDetails, id);
  const bodyRows = `${paragraph(`Dear ${name},`, 20)}${paragraph(`Congratulations ${name}, your company has been officially registered, and your trade license has been issued.`)}${paragraph('You can now download your company documents.', 24)}${ctaButton(applicationUrl, 'View your Company Documents')}${helpLine('Need help? Reach us at')}`;

  return gbsLayout({ title: 'Company Registration Completed', badge: v2SuccessBadge(), bodyRows, partnerDetails });
};

// key: GBS_DELAYED (service: GLOBAL_BUSINESS_SETUP)
exports.globalBusinessSetupSetupDelayed = (name, partnerDetails, id) => {
  const { applicationUrl } = partnerLinks(partnerDetails, id);
  const bodyRows = `${paragraph(`Dear ${name},`, 20)}${paragraph('We’re currently working on your company setup, but your application has been flagged for additional review by the licensing authority.')}${paragraph('This may lead to a short delay. We’ll keep you informed and notify you as soon as we receive an update.')}${paragraph(`If any action is required from your side, it will appear in your <a href="${applicationUrl}" target="_blank" rel="noopener" style="color:#000000;text-decoration:underline;">Action Required</a>.`, 24)}${ctaButton(applicationUrl, 'Go to Action Required')}${helpLine('For support, reach us at')}`;

  return gbsLayout({ title: 'Update on Your Application', bodyRows, partnerDetails });
};

// ─── Admin-managed template resolvers ────────────────────────────────────────

const baseVariables = (name, url, partnerDetails) => {
  const partner = normalisePartner(partnerDetails);
  return {
    name: name || 'Customer',
    url,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
};

exports.resolveGlobalBusinessSetupCompanyNameApproved = ({ name, proposedName, partnerDetails, partnerId = null, logTraceId = null, fallbackSubject = 'Company Name Approved' }) => {
  const { dashboardUrl } = partnerLinks(partnerDetails);
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.GBS_NAME_APPROVED,
    service: EMAIL_TEMPLATE_SERVICES.GLOBAL_BUSINESS_SETUP,
    variables: { ...baseVariables(name, dashboardUrl, partnerDetails), proposedName: proposedName || 'N/A' },
    fallbackSubject,
    fallback: () => exports.globalBusinessSetupCompanyNameApproved(name, proposedName, partnerDetails),
    partnerId,
    logTraceId,
  });
};

exports.resolveGlobalBusinessSetupShareholderAndUBODetailsVerified = ({ name, partnerDetails, partnerId = null, logTraceId = null, fallbackSubject = 'Shareholder & UBO Details Verified' }) => {
  const { dashboardUrl } = partnerLinks(partnerDetails);
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.GBS_SHAREHOLDER_VERIFIED,
    service: EMAIL_TEMPLATE_SERVICES.GLOBAL_BUSINESS_SETUP,
    variables: baseVariables(name, dashboardUrl, partnerDetails),
    fallbackSubject,
    fallback: () => exports.globalBusinessSetupShareholderAndUBODetailsVerified(name, partnerDetails),
    partnerId,
    logTraceId,
  });
};

exports.resolveGlobalBusinessSetupCompanyRegistrationCompleted = ({ name, partnerDetails, id, partnerId = null, logTraceId = null, fallbackSubject = 'Company Registration Completed' }) => {
  const { applicationUrl } = partnerLinks(partnerDetails, id);
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.GBS_COMPLETED,
    service: EMAIL_TEMPLATE_SERVICES.GLOBAL_BUSINESS_SETUP,
    variables: baseVariables(name, applicationUrl, partnerDetails),
    fallbackSubject,
    fallback: () => exports.globalBusinessSetupCompanyRegistrationCompleted(name, partnerDetails, id),
    partnerId,
    logTraceId,
  });
};

exports.resolveGlobalBusinessSetupSetupDelayed = ({ name, partnerDetails, id, partnerId = null, logTraceId = null, fallbackSubject = 'Update on Your Application' }) => {
  const { applicationUrl } = partnerLinks(partnerDetails, id);
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.GBS_DELAYED,
    service: EMAIL_TEMPLATE_SERVICES.GLOBAL_BUSINESS_SETUP,
    variables: baseVariables(name, applicationUrl, partnerDetails),
    fallbackSubject,
    fallback: () => exports.globalBusinessSetupSetupDelayed(name, partnerDetails, id),
    partnerId,
    logTraceId,
  });
};

exports.resolveGlobalBusinessSetupRejected = ({ name, partnerDetails, id, partnerId = null, logTraceId = null, fallbackSubject = 'Corrections Needed for Your Company Setup' }) => {
  const { applicationUrl } = partnerLinks(partnerDetails, id);
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.GBS_REJECTED,
    service: EMAIL_TEMPLATE_SERVICES.GLOBAL_BUSINESS_SETUP,
    variables: baseVariables(name, applicationUrl, partnerDetails),
    fallbackSubject,
    fallback: () => exports.globalBusinessSetupRejected(name, partnerDetails, id),
    partnerId,
    logTraceId,
  });
};
