const { formatNumberWithLocalString } = require('../formatter');
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('../emailTemplate/sharedLayout');

// key: WORKS_PURCHASE_SUCCESS (service: WORKS)
// v2 design matches AE's own migrated version (Peko-AE/gateway/utils/emailTemplates/works/worksPurchaseEmail.js),
// with AE's AED currency localized to IN's real ₹ (matching IN's own pre-v2 design, which
// already used ₹ throughout).
exports.worksPurchaseEmail = (name, amount, planData, transactionId, templateDetails) => {
	const branding = templateDetails?.branding || 'Peko';
	const website = templateDetails?.baseUrl || 'https://peko.one/in';
	const websiteLabel = toWebsiteLabel(website);
	const logo = templateDetails?.logo;
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your purchase from ${planData.work.name}</title>
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
          .peko-heading { font-size: 20px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 15px; color: #000000; line-height: 24px; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Your purchase from ${planData.work.name}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                <td align="left" style="padding-bottom:24px;">
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
                                <td align="left" class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:24px;line-height:32px;font-weight:700;color:#000000;padding-bottom:20px;word-break:break-word;">
                                  Your purchase from ${planData.work.name}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Hi ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We are delighted to inform you that your recent payment of ₹ ${formatNumberWithLocalString(amount)} for your ${planData.work.name} - ${planData.name} plan has been successfully processed. Your plan ${planData.work.name} - ${planData.name} is now active.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:22px;color:#000000;word-break:break-word;">
                                  Best Regards,<br>${branding}
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
