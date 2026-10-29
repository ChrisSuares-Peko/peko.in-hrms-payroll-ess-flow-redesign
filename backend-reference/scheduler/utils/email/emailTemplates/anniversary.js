const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('../../emailTemplate/sharedLayout');

exports.anniversary1To4ExpTemplate = (employeeName, companyName, experience, companyLogo) => {
  let text;
  if (experience == 1) {
    text = 'year';
  } else {
    text = 'years';
  }

  const branding = companyName || 'Peko';
  const website = 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = companyLogo;
  const socials = socialIconCells(undefined, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Celebrating Your ${experience}-Year Work Anniversary!</title>
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
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 15px; color: #000000; line-height: 24px; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Celebrating Your ${experience}-Year Work Anniversary!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel, logo, branding })}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td>
                                  <img src="https://d2fduk7g9mvyjq.cloudfront.net/common/work_anniversary.jpeg" width="520" height="220" alt="Celebration" style="display:block;border:0;width:100%;height:auto;max-width:520px;border-radius:16px;margin-bottom:24px;">
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;line-height:32px;text-align:left;color:#000000;">Celebrating Your ${experience}-Year Work Anniversary!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${employeeName},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We extend our heartfelt congratulations to you on reaching your ${experience}-year anniversary with ${companyName}. Your dedication and hard work have made a significant impact, and we are grateful for your commitment to our team. We look forward to many more years of working together.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your contributions in the past ${text} have been truly appreciated. Here&rsquo;s to many more successful years together.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:22px;color:#000000;padding-bottom:24px;word-break:break-word;">
                                  Best regards,<br>HR Team
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="border-top:1px solid #E5E7EB;padding-top:20px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF;">Payroll Powered by Peko</div>
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

exports.anniversary4ToAnyExpTemplate = (employeeName, companyName, experience, companyLogo) => {
  const branding = companyName || 'Peko';
  const website = 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = companyLogo;
  const socials = socialIconCells(undefined, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Celebrating Your ${experience}-Year Work Anniversary!</title>
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
      <style type="text/css">
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 24px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 15px; color: #000000; line-height: 24px; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Celebrating Your ${experience}-Year Work Anniversary!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel, logo, branding })}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td>
                                  <img src="https://d2fduk7g9mvyjq.cloudfront.net/common/work_anniversary.jpeg" width="520" height="220" alt="Celebration" style="display:block;border:0;width:100%;height:auto;max-width:520px;border-radius:16px;margin-bottom:24px;">
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;line-height:32px;text-align:left;color:#000000;">Celebrating Your ${experience}-Year Work Anniversary!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${employeeName},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We extend our heartfelt congratulations to you on reaching the remarkable milestone of ${experience} years with ${companyName}. Your hard work and dedication have been invaluable to us and we are grateful for your commitment to our team. Your contribution has played a significant role in our shared success and we look forward to continuing our journey with you.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your contribution has played a significant role in our shared success, and we want to express our heartfelt appreciation for your ongoing efforts.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We look forward to continuing our journey with you.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:22px;color:#000000;padding-bottom:24px;word-break:break-word;">
                                  Best regards,<br>HR Team
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="border-top:1px solid #E5E7EB;padding-top:20px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF;">Payroll Powered by Peko</div>
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
