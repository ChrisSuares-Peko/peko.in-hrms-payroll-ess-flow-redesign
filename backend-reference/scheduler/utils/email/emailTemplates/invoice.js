const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('../../emailTemplate/sharedLayout');

// Pre-renders a raw multi-line body string into <p>-wrapped HTML paragraphs, so line
// breaks survive being substituted into an admin-edited template's ${bodyData} slot
// (a bare multi-line string collapses in HTML - browsers don't render \n as a break).
// Exported so the resolve* call site can build the identical value for the DYNAMIC
// path that the JS fallback below builds for itself.
const buildInvoiceReminderBodyHtml = (body) => {
  const bodyText = String(body || '').split('\n');
  let bodyData = '';
  bodyText.forEach((element) => {
    bodyData += `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#000000;font-size:16px;">${element}</p>`;
  });
  return bodyData;
};
exports.buildInvoiceReminderBodyHtml = buildInvoiceReminderBodyHtml;

exports.emailTempleteInvoiceRemainder = (body, partnerDetails) => {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = partnerDetails?.logo;
  const socials = socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' });
  const bodyData = buildInvoiceReminderBodyHtml(body);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Invoice Remainder</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Invoice Remainder" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${v2Header({ website, websiteLabel, logo, branding })}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:30px;font-weight:700;line-height:1.3;text-align:left;color:#111827;">Invoice Remainder</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  ${bodyData}
                                </td>
                              </tr>
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

${v2Footer({ socials, branding })}

      </div>
    </body>
  </html>`;
};
