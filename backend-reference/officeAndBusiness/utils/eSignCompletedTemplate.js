const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./emailTemplates/sharedLayout');
const { normalisePartner } = require('./emailTemplates/common');
const { resolveEmailTemplate } = require('../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('./emailTemplateKeys');

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

const textRow = (html, paddingBottom = 24) => `
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`;

// Sent to every signer once all signatures on a document are complete.
// key: ESIGN_COMPLETED (service: ESIGN)
exports.eSignCompletedTemplate = (documentName, document_url, partnerDetails) => {
    const { branding, website, logo, socials } = normalisePartner(partnerDetails);
    const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
    const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });

    return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>eSign</title>
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
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Document eSigned" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                  <div class="peko-heading" style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your document has been eSigned</div>
                                </td>
                              </tr>
${textRow('Dear Signer,', 20)}
${textRow(`We are pleased to inform you that the e-signing of <strong>${documentName}</strong> by all the signer(s) is now complete. You can download your signed document by clicking the link below:`, 32)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <a href="${document_url}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">Download Document</a>
                                </td>
                              </tr>
${textRow(`For queries or further assistance, please feel free to contact us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.`, 24)}
${textRow(`Best Regards,<br>${branding}`, 0)}
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
// local fallback above. The call site awaits this once and sends to each signer.
exports.resolveESignCompletedEmail = (documentName, document_url, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
    const { branding, website, logo, socials } = normalisePartner(partnerDetails);
    const variables = {
        documentName: documentName || '-',
        documentUrl: document_url || '-',
        branding,
        website,
        ...v2LayoutVariables({ website, logo, branding, socials }),
    };
    return resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.ESIGN_COMPLETED,
        service: EMAIL_TEMPLATE_SERVICES.ESIGN,
        variables,
        fallbackSubject: 'Your Document Has Been Successfully eSigned',
        fallback: () => exports.eSignCompletedTemplate(documentName, document_url, partnerDetails),
        partnerId,
        logTraceId,
    });
};
