const { socialIconCells, v2Header, v2Footer, websiteLabel, PEKO_SOCIAL_LINKS } = require('../sharedLayout');

const EMPLOYEE_WELCOME_HERO_IMAGE = 'https://d2fduk7g9mvyjq.cloudfront.net/common/new_join.png';

exports.employeeWelcomeEmailTemplate = (employeeName, organizationName, logo, website = 'https://in.peko.one', referralCode, footerBranding) => {
  const branding = organizationName || 'Peko';
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  // footerBranding is the genuine reseller partner's brand (if any) - separate from
  // `branding` above, which is just the employee's own corporate shown in the header.
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding: footerBranding });
  // Matches the real, working referral flow (others MS's referThroughEmail /
  // getOnboardingProgress): baseUrl + /auth/register?referralCode=<referrer's username>.
  // "/system/registration" is not a route anywhere in the codebase.
  const referUrl = `${website}/auth/register${referralCode ? `?referralCode=${referralCode}` : ''}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>New Team Member Announcement</title>
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
      <div aria-label="New Team Member Announcement" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                  <img alt="Welcome new team member" src="${EMPLOYEE_WELCOME_HERO_IMAGE}" style="display:block;width:100%;max-width:100%;height:auto;border-radius:16px;" width="1040" />
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear Team,</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are excited to announce that ${employeeName} has joined our ${branding}. Please join us in extending a warm welcome. With a wealth of talent and enthusiasm, this new team member is sure to make a positive impact on our team.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Let&rsquo;s ensure our new colleague feels at home from day one.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br />HR Team</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;text-align:center;color:#4B5563;">Payroll Powered by Peko</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;text-align:center;padding-top:8px;"><a href="${referUrl}" target="_blank" style="color:#FF4F4F;text-decoration:underline;">Refer a business</a></div>
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

exports.employeeWelcomeEmail =(employeeName, logo, companyName, website = 'https://in.peko.one', referralCode, footerBranding) => {
  const branding = companyName || 'Peko';
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  // footerBranding is the genuine reseller partner's brand (if any) - separate from
  // `branding` above, which is just the employee's own corporate shown in the header.
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding: footerBranding });
  // Matches the real, working referral flow (others MS's referThroughEmail /
  // getOnboardingProgress): baseUrl + /auth/register?referralCode=<referrer's username>.
  // "/system/registration" is not a route anywhere in the codebase.
  const referUrl = `${website}/auth/register${referralCode ? `?referralCode=${referralCode}` : ''}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Welcome to ${branding}</title>
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
      <div aria-label="Welcome to ${branding}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${employeeName},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to inform you that you have been successfully added to ${branding}'s payroll system by the HR team.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any questions or need assistance, feel free to reach out to the HR team.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best regards,<br />HR Team</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;text-align:center;color:#4B5563;">Payroll Powered by Peko</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;text-align:center;padding-top:8px;"><a href="${referUrl}" target="_blank" style="color:#FF4F4F;text-decoration:underline;">Refer a business</a></div>
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
