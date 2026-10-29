const { socialIconCells, v2Header, v2Footer, websiteLabel, PEKO_SOCIAL_LINKS } = require('../sharedLayout');

// Email sent to the corporate/HR admin when they approve a payroll cycle.
exports.salaryApproved = ({
  adminName,
  period,
  viewUrl,
}, { logo, website, branding } = {}) => {
  const brandName = branding || 'Peko';
  const ctaUrl = viewUrl || website || '';
  const forPeriod = period ? ` for ${period}` : '';
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding: brandName });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding: brandName });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your Payroll Has Been Approved</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 26px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Your Payroll Has Been Approved" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your Payroll Has Been Approved</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${adminName || "Team"},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Your organization's payroll${forPeriod} on ${brandName} has been approved and is ready for processing.</div>
                                </td>
                              </tr>
                              ${ctaUrl ? `<tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tr>
                                      <td align="center" bgcolor="#FF4F4F" role="presentation" style="border:none;border-radius:10px;cursor:auto;mso-padding-alt:15px 30px;background:#FF4F4F;" valign="middle">
                                        <a href="${ctaUrl}" style="display:inline-block;background:#FF4F4F;color:#ffffff;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:100%;margin:0;text-decoration:none;text-transform:none;padding:15px 30px;mso-padding-alt:0px;border-radius:10px;" target="_blank">View Salary</a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>` : ''}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br />Team ${adminName}</div>
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

${footer}

      </div>
    </body>
  </html>`;
};
