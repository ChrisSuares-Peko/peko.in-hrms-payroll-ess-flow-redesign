const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require("../../emailTemplate/sharedLayout");

// v2 design matches AE's own migrated version, including the per-digit OTP box UI.
// That digit-box rendering only happens in this JS fallback (a loop over otp's
// characters) - the admin-editable template only ever receives the raw `otp` value
// as plain text, same scope-limitation precedent as FLIGHT_CONFIRMATION's itinerary.
exports.flightCancellationOTPTemplate = (name, otp, templateDetails) => {
    const branding = templateDetails?.branding || 'Peko';
    const website = templateDetails?.website || 'https://www.peko.one';
    const websiteLabel = toWebsiteLabel(website);
    const logo = templateDetails?.logo;
    const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
    const otpDigits = String(otp ?? '').padEnd(6, ' ').split('').slice(0, 6);

    return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Complete Your Booking Cancellation!</title>
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
          .otp-box { width: 36px !important; height: 44px !important; font-size: 18px !important; }
          .otp-cell { padding: 0 3px 0 0 !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Complete Your Booking Cancellation!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Complete Your Booking Cancellation!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">Please use the OTP given below to complete the Flight booking cancellation process. This OTP is valid for 2 minutes only.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-weight:700;">Your one-time password (OTP)</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        ${otpDigits.map((d, i) => `<td class="otp-cell" style="padding:0 ${i < 5 ? '8px' : '0'} 0 0;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="otp-box" style="width:44px;height:52px;background-color:#ffffff;border:1px solid #D1D5DB;border-radius:10px;">
                                            <tbody><tr><td align="center" valign="middle" style="width:44px;height:52px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:700;color:#000000;">${d}</td></tr></tbody>
                                          </table>
                                        </td>`).join('')}
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Your OTP is confidential. Please do not share it with anyone.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:12px;">Best Regards,<br>Team ${branding}</div>
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
}
