const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require("../../emailTemplate/sharedLayout");

// Internal notification sent to Peko's own vendor-support team (not the customer) when
// a customer requests a flight booking cancellation. v2 design matches AE's own migrated
// version exactly - this template has no dynamic loops, every field is a simple scalar.
exports.cancellationMailTemplate = (params, templateDetails) => {
    const branding = templateDetails?.branding || 'Peko';
    const website = templateDetails?.website || 'https://www.peko.one';
    const websiteLabel = toWebsiteLabel(website);
    const logo = templateDetails?.logo;
    const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

    return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${branding}</title>
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
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; font-weight: 400; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${branding}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Flight Cancellation Request</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear Team,</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We would like to inform you that a customer has requested the cancellation of their flight booking through the ${branding} platform. Below are the details of the requested cancellation:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:8px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Customer Name:</td>
                                        <td class="detail-value" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${params?.customerName}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Request Date:</td>
                                        <td class="detail-value" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">${params?.requestDate}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Reason for Cancellation:</td>
                                        <td class="detail-value" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">${params?.reasonForCancellation}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:12px;padding-top:8px;border-top:1px solid #E5E7EB;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;color:#000000;padding-top:16px;">Flight Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Confirmation Number:</td>
                                        <td class="detail-value" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">${params?.flightBookingId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Airline PNR:</td>
                                        <td class="detail-value" style="padding:6px 0;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">${params?.airlineLocator}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;padding-top:8px;border-top:1px solid #E5E7EB;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Please review the request and proceed with the necessary actions as per the cancellation policy. Kindly revert with the confirmation and payment details required for cancellation.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for your attention.</div>
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
