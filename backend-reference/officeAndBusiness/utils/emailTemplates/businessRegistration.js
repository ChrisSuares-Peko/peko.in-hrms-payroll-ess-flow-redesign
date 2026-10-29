const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const pekoPartnerLogos = require('../../public/partnerLogos');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
// Default Peko identity for emails sent without a partner context (webhooks).
const PEKO_PARTNER_DETAILS = pekoPartnerLogos[0];

const getServiceUrl = () => {
    if (process.env.NODE_ENV === 'staging') {
        return process.env.FRONTEND_STAGING_URL || 'https://uatin.pekoapp.com';
    }
    return process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';
};

const trackApplicationUrl = () => `${getServiceUrl()}/more-services/business-registration/applications`;

const textRow = (html, paddingBottom = 24) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`;

const detailRow = (label, value, valueStyle = '') =>
    value
        ? `
                                      <tr>
                                        <td class="detail-label" width="200" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">${label}</td>
                                        <td class="detail-value" valign="top" style="font-family:${FONT};font-size:15px;color:#000000;padding-bottom:12px;${valueStyle}">${value}</td>
                                      </tr>`
        : '';

// Application detail rows; Status is always present so the block is never empty.
const buildDetailsHtml = ({ applicationId, entityLabel, proposedName } = {}) =>
    detailRow('Application ID', applicationId) +
    detailRow('Entity Type', entityLabel) +
    detailRow('Proposed Name', proposedName) +
    detailRow('Status', 'Submitted', 'font-weight:700;color:#22c55e;');

// Sent to the corporate, the primary contact (lead) and every director once a
// business-registration application is submitted. details = { applicationId,
// entityLabel, proposedName }.
// key: BUSINESS_REGISTRATION_APPLICATION_SUBMITTED (service: BUSINESS_REGISTRATION)
// Shared v2 page shell (header, white card, footer). bodyRows = the card's <tr>…</tr> rows.
const renderPage = ({ title, ariaLabel, partnerDetails, bodyRows }) => {
    const { branding, website, logo, socials } = normalisePartner(partnerDetails);
    const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
    const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });
    return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${title}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
        @media only screen and (max-width:479px) {
          .peko-heading { font-size:24px !important; }
          .peko-card { padding:24px 16px !important; }
          .detail-label, .detail-value { display:block !important;width:100% !important;padding-top:2px !important;padding-bottom:2px !important; }
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${ariaLabel}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
${bodyRows}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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

const headingRow = (text) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>
                                </td>
                              </tr>`;

const buttonRow = (href, label) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <a href="${href}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">${label}</a>
                                </td>
                              </tr>`;

exports.applicationSubmittedEmail = (name, details, partnerDetails) => {
    const { proposedName } = details || {};
    const { branding } = normalisePartner(partnerDetails);
    const bodyRows = `                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Application Submitted</div>
                                </td>
                              </tr>
${textRow(`Dear ${name || 'there'},`, 20)}
${textRow(`Your business registration application${proposedName ? ` for <strong>${proposedName}</strong>` : ''} has been submitted successfully. Our team is now taking it through the MCA filing and will keep you updated on the progress.`, 32)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
${buildDetailsHtml(details)}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
${textRow('You can follow the status any time from your applications.', 24)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <a href="${trackApplicationUrl()}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">Track Application</a>
                                </td>
                              </tr>
${textRow(`Thank you for choosing ${branding}. If you have any queries, reach us at <a href="mailto:help@peko.one" style="color:#000000;">help@peko.one</a>.`, 24)}
${textRow(`Best Regards,<br>Team ${branding}`, 0)}`;
    return renderPage({ title: 'Business Registration - Application Submitted', ariaLabel: 'Application Submitted', partnerDetails, bodyRows });
};

// Admin-managed template resolution — prefers a published admin template over the
// local fallback above. The call site awaits this and sends the result itself.
exports.resolveApplicationSubmittedEmail = (name, details, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
    const { applicationId, entityLabel, proposedName } = details || {};
    const { branding, website, logo, socials } = normalisePartner(partnerDetails);
    const variables = {
        name: name || 'there',
        applicationId: applicationId || '-',
        entityLabel: entityLabel || '-',
        proposedName: proposedName || '-',
        trackUrl: trackApplicationUrl(),
        detailsHtml: buildDetailsHtml(details),
        branding,
        website,
        ...v2LayoutVariables({ website, logo, branding, socials }),
    };
    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BUSINESS_REGISTRATION_APPLICATION_SUBMITTED,
        service: EMAIL_TEMPLATE_SERVICES.BUSINESS_REGISTRATION,
        variables,
        fallbackSubject: 'Business Registration - Application Submitted',
        fallback: () => exports.applicationSubmittedEmail(name, details, partnerDetails),
        partnerId,
        logTraceId,
    });
};

// Status update from IndiaFilings webhook (notificationType: EMAIL). Peko-branded:
// the webhook has no partner context.
exports.statusUpdateEmail = (message, applicationId) => {
    const trackUrl = applicationId
        ? `${getServiceUrl()}/more-services/business-registration/tracking?applicationId=${encodeURIComponent(applicationId)}`
        : trackApplicationUrl();
    const bodyRows = [
        headingRow('Business Registration Update'),
        textRow('Dear Customer,', 20),
        textRow(message || 'There is an update on your business registration application.', 24),
        applicationId ? textRow(`<strong>Application ID:</strong> ${applicationId}`, 24) : '',
        buttonRow(trackUrl, 'Track Application'),
        textRow('If you have any queries, reach us at <a href="mailto:help@peko.one" style="color:#000000;">help@peko.one</a>.', 24),
        textRow('Best Regards,<br>Team Peko', 0),
    ].join('');
    return renderPage({ title: 'Business Registration Update', ariaLabel: 'Business Registration Update', partnerDetails: PEKO_PARTNER_DETAILS, bodyRows });
};
