const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

const textRow = (html, paddingBottom = 24) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`;

const detailRow = (label, value) => `
                                      <tr>
                                        <td class="detail-label" width="200" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">${label}</td>
                                        <td class="detail-value" valign="top" style="font-family:${FONT};font-size:15px;color:#000000;padding-bottom:12px;">${value}</td>
                                      </tr>`;

//template for Peko Connect Email For Service Provider
// key: CONNECTION_REQUEST (service: PEKO_CONNECT)
exports.generateConnectionRequestEmail = (name, data, partnerDetails) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Connection Request</title>
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
      <div aria-label="Connection Request" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Connection request</div>
                                </td>
                              </tr>
${textRow(`Dear ${name},`, 20)}
${textRow(`You have received a connection request through ${branding}. Below, please find the details of the request.`, 32)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Connection Request Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
${detailRow('Corporate name', data?.name || '-')}
${detailRow('Contact number', data?.mobile || '-')}
${detailRow('Email ID', data?.email || '-')}
${detailRow('Requirement', data?.requirement || '-')}
${detailRow('Message', data?.message || '-')}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
${textRow(`Thank you for using ${branding}.`, 16)}
${textRow(`If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.`, 24)}
${textRow(`Best Regards,<br>Team ${branding}`, 0)}
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

// Admin-managed template resolution — prefers a published admin template over the
// local fallback above. The call site awaits this and sends the result itself.
exports.resolveConnectionRequestEmail = (name, data, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const variables = {
    name: name || '-',
    corporateName: data?.name || '-',
    contact: data?.mobile || '-',
    email: data?.email || '-',
    requirement: data?.requirement || '-',
    message: data?.message || '-',
    branding,
    website,
    ...v2LayoutVariables({ website, logo, branding, socials }),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.CONNECTION_REQUEST,
    service: EMAIL_TEMPLATE_SERVICES.PEKO_CONNECT,
    variables,
    fallbackSubject: 'You have received a connection request',
    fallback: () => exports.generateConnectionRequestEmail(name, data, partnerDetails),
    partnerId,
    logTraceId,
  });
};
