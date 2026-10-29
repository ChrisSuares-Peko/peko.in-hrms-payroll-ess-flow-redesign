const { formatNumberWithLocalString } = require("../formatter");
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('./sharedLayout');

// key: WORKSPACE_PAYMENT_SUCCESS (service: WORKSPACE)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/workspaces.js),
// with AE's AED currency localized to IN's real ₹ (matching IN's own pre-v2 design, which
// already used ₹ throughout).
exports.generatePaymentSuccessEmailWorkspaces = (name, transactionId, amount, orderResponse, templateDetails) => {
	let planDetails = orderResponse.planDetails
	let bookDetails = orderResponse.bookingDetails
	const branding = templateDetails?.branding || 'Peko'
	const website = templateDetails?.baseUrl || 'https://peko.one/in'
	const websiteLabel = toWebsiteLabel(website)
	const logo = templateDetails?.logo
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' })

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Booking Successful</title>
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
          .order-label, .order-value { display:block !important; width:100% !important; text-align:left !important; padding-top:2px !important; padding-bottom:2px !important; }
        }
      </style>
      <style type="text/css">
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Booking Successful" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="64" height="64" style="width:64px;height:64px;background-color:#E5FFE8;border-radius:50%;">
                                    <tr>
                                      <td align="center" valign="middle" style="width:64px;height:64px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="32" height="32" style="width:32px;height:32px;background-color:#20C230;border-radius:50%;">
                                          <tr>
                                            <td align="center" valign="middle" style="width:32px;height:32px;">
                                              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxNiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgNkw2IDExTDE1IDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==" width="16" height="12" alt="" style="display:block;border:0;">
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:700;line-height:32px;text-align:left;color:#000000;">Booking Successful</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:24px;text-align:left;color:#000000;">Hi, ${name}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:24px;text-align:left;color:#000000;">Thank you for choosing ${branding}!</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:24px;text-align:left;color:#000000;">We appreciate your booking and will send a confirmation once it is confirmed. To view your booking, please visit 'Workspace' on your corporate panel.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="section-heading" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Booking Summary</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Order:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Placed On:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Total Price:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">₹ ${Number.parseFloat(amount).toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Plan Name:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">${planDetails.name}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Plan Price:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">₹ ${formatNumberWithLocalString(planDetails.price)}/${planDetails?.billingCycle == 'MONTHLY' ? 'month' : 'yr'}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Plan Details:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">${planDetails.description}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#000000;padding:4px 8px 4px 0;">Workspace Name:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#000000;padding:4px 0;">${bookDetails?.name ?? 'Not Available'}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:22px;text-align:left;color:#000000;">Thanks,<br>The ${branding} Team</div>
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

// key: WORKSPACE_REMINDER (service: WORKSPACE)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/workspaces.js).
// No currency involved in this template — no localization needed.
exports.workspaceReminder = (url, expireDate, name = 'user', templateDetails) => {
	const branding = templateDetails?.branding || 'Peko';
	const website = templateDetails?.baseUrl || 'https://peko.one/in';
	const websiteLabel = toWebsiteLabel(website);
	const logo = templateDetails?.logo;
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Renew your office address</title>
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
          .peko-heading { font-size: 26px !important; }
          .peko-card { padding: 24px 16px !important; }
          .peko-btn a { display:block !important; text-align:center !important; }
        }
      </style>
      <style type="text/css">
        .greeting { font-size: 16px; color: #000000; }
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Renew your office address" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Renew your office address</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="greeting" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">This is a friendly reminder for your monthly renewal of your office space. Please ensure timely renewal to continue uninterrupted access to workspace facilities.<br /><br />Your current service expires on ${formatDate(expireDate)}.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for your continued trust in our services.</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Regards<br />Team ${branding}</div>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="peko-btn" style="font-size:0px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#FF4F4F" role="presentation" style="border:none;border-radius:12px;cursor:auto;mso-padding-alt:16px 32px;background:#FF4F4F;" valign="middle">
                                          <a href="${url}" style="display:inline-block;background:#FF4F4F;color:#ffffff;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:100%;margin:0;text-decoration:none;text-transform:none;padding:16px 32px;mso-padding-alt:0px;border-radius:12px;" target="_blank">Visit Office Address</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
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

function formatDate(dateString) {
	let date = new Date(dateString)
	let options = { day: '2-digit', month: 'short', year: 'numeric' }
	return date.toLocaleDateString('en-GB', options)
}
