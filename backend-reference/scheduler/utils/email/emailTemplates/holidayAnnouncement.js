const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('../../emailTemplate/sharedLayout');

exports.holidayTemplate = (params, hrSettings) => {
  const { corporateUser, officialDocuments } = hrSettings || {};
  const branding = corporateUser?.companyName || 'Peko';
  const website = 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = corporateUser?.logo
    || "https://gxphmw.stripocdn.email/content/guids/CABINET_f84dc6ab013f7158cf3699430f1e5626dd618cf5435cc748770ab45156a3fc3e/images/logohere.png";
  const socials = socialIconCells(undefined, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Reminder: Upcoming Holiday Schedule</title>
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
      <div aria-label="Reminder: Upcoming Holiday Schedule" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Reminder: Upcoming Holiday Schedule</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear Employee,</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:16px;">We are writing to remind you about the upcoming holiday schedule. As per the company's calendar, ${params?.title} is approaching ${params?.start}. Please make sure to plan your work and schedules accordingly. We hope you enjoy the upcoming holiday and have a wonderful time.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:16px;">If you have any questions or concerns, feel free to reach out to the HR team.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:16px;">Best regards,<br>${officialDocuments?.hrManagerName}</div>
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

${v2Footer({ socials })}

      </div>
    </body>
  </html>`;
};
