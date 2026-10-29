const { socialIconCells, v2Header, v2Footer, websiteLabel, PEKO_SOCIAL_LINKS } = require('../sharedLayout');

const BIRTHDAY_HERO_IMAGE = 'https://d2fduk7g9mvyjq.cloudfront.net/common/birthday.jpeg';

// hrSettings' sign-off stays static ("Team Peko"), matching AE's design.
// eslint-disable-next-line no-unused-vars
exports.birthdayTemplate = (params, hrSettings) => {
  const logo = hrSettings?.companyProfile?.companyLogo || hrSettings?.corporateUser?.logo;
  const website = hrSettings?.corporateUser?.website;
  const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding: companyName || 'Peko' });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }) });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Happy Birthday</title>
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
      <div aria-label="Happy Birthday" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="center" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <img alt="Birthday celebration" src="${BIRTHDAY_HERO_IMAGE}" style="display:block;width:100%;max-width:100%;height:auto;border-radius:16px;" width="1040" />
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Happy Birthday!!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${params?.name || ''},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Wishing you a fantastic birthday filled with joy, laughter, and unforgettable moments. Your dedication and hard work are truly appreciated, and we hope this year brings you everything you desire. Have a wonderful celebration!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br />Team Peko</div>
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
