/* eslint-disable no-irregular-whitespace */
exports.visaStatusUpdateTemplate = (
    { userName, orderNumber, status, stageLabel, destination, productName },
    templateDetails
) => {
    const logoUrl = templateDetails?.logo || 'https://d2fduk7g9mvyjq.cloudfront.net/peko-logo.png';
    const frontendUrl = process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';

    const statusConfig = {
        UNDER_REVIEW:   { label: 'Under Review',        color: '#f59e0b', icon: '🔍' },
        VISA_STAMPED:   { label: 'Visa Stamped',         color: '#10b981', icon: '✅' },
        VISA_DELIVERED: { label: 'Visa Delivered',       color: '#10b981', icon: '📬' },
        DOCS_REJECTED:  { label: 'Documents Rejected',   color: '#ef4444', icon: '❌' },
    };

    const cfg = statusConfig[status] || { label: stageLabel || status, color: '#6b7280', icon: '📋' };

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Visa Application Status Update</title>
  <style type="text/css">
    #outlook a { padding: 0; }
    .ExternalClass { width: 100%; }
    .es-button { mso-style-priority: 100 !important; text-decoration: none !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width:600px) {
      p, ul li, ol li, a { line-height: 150% !important }
      h1, h2, h3 { line-height: 120% !important }
      .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important }
    }
  </style>
</head>
<body style="width:100%;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;">
  <div style="background-color:#F6F6F6;">
    <table width="100%" cellspacing="0" cellpadding="0" role="none"
      style="border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;background-color:#F6F6F6;">
      <tr>
        <td valign="top" style="padding:0;Margin:0">

          <!-- Header -->
          <table cellpadding="0" cellspacing="0" align="center" role="none"
            style="border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" role="none"
                  style="border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  <tr>
                    <td align="left" style="Margin:0;padding:20px 40px;">
                      <a target="_blank" href="${frontendUrl}" style="text-decoration:none;">
                        <img src="${logoUrl}" alt="Peko" style="display:block;border:0;height:auto;max-height:50px;" />
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Content -->
          <table cellpadding="0" cellspacing="0" align="center" role="none"
            style="border-collapse:collapse;border-spacing:0px;width:100%;">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table align="center" cellpadding="0" cellspacing="0" role="none"
                  style="border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px;border-top:4px solid ${cfg.color};">
                  <tr>
                    <td style="padding:40px 40px 20px 40px;">
                      <p style="Margin:0;font-size:16px;color:#333333;">Hi <strong>${userName || 'Traveller'}</strong>,</p>
                      <p style="Margin:16px 0 0 0;font-size:15px;color:#555555;line-height:1.6;">
                        There is an update on your visa application. Please find the details below.
                      </p>
                    </td>
                  </tr>

                  <!-- Status Badge -->
                  <tr>
                    <td style="padding:0 40px 24px 40px;">
                      <table cellpadding="0" cellspacing="0" role="none" style="border-collapse:collapse;">
                        <tr>
                          <td style="background-color:${cfg.color};border-radius:6px;padding:10px 20px;">
                            <p style="Margin:0;font-size:14px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">
                              ${cfg.icon}&nbsp; ${cfg.label.toUpperCase()}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Application Details -->
                  <tr>
                    <td style="padding:0 40px 32px 40px;">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="border-collapse:collapse;border-top:1px solid #eeeeee;">
                        <tr>
                          <td style="padding:20px 0 8px 0;">
                            <p style="Margin:0;font-size:13px;font-weight:bold;color:#888888;text-transform:uppercase;letter-spacing:1px;">
                              APPLICATION DETAILS
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <table cellpadding="0" cellspacing="0" width="100%" role="none" style="border-collapse:collapse;">
                              <tr>
                                <td style="padding:6px 0;font-size:14px;color:#888888;width:50%;">Order Number</td>
                                <td style="padding:6px 0;font-size:14px;color:#333333;font-weight:600;">${orderNumber}</td>
                              </tr>
                              ${destination ? `<tr>
                                <td style="padding:6px 0;font-size:14px;color:#888888;">Destination</td>
                                <td style="padding:6px 0;font-size:14px;color:#333333;font-weight:600;">${destination}</td>
                              </tr>` : ''}
                              ${productName ? `<tr>
                                <td style="padding:6px 0;font-size:14px;color:#888888;">Visa Type</td>
                                <td style="padding:6px 0;font-size:14px;color:#333333;font-weight:600;">${productName}</td>
                              </tr>` : ''}
                              ${stageLabel ? `<tr>
                                <td style="padding:6px 0;font-size:14px;color:#888888;">Current Stage</td>
                                <td style="padding:6px 0;font-size:14px;color:#333333;font-weight:600;">${stageLabel}</td>
                              </tr>` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- CTA -->
                  <!-- <tr>
                    <td align="center" style="padding:0 40px 40px 40px;">
                      <table cellpadding="0" cellspacing="0" role="none" style="border-collapse:collapse;">
                        <tr>
                          <td align="center" bgcolor="#ff3333" style="border-radius:6px;">
                            <a href="${frontendUrl}/travel/visa" target="_blank"
                              style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:helvetica,'helvetica neue',arial,verdana,sans-serif;">
                              Track Application
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr> -->

                  <!-- Policy footer -->
                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid #eeeeee;">
                      <p style="Margin:0;font-size:12px;color:#999999;line-height:1.6;">
                        If you have any questions, please contact our support team. This is an automated email, please do not reply directly to this message.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Black footer with social icons -->
          <table cellpadding="0" cellspacing="0" align="center" role="none"
            style="border-collapse:collapse;border-spacing:0px;width:100%;">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table align="center" cellpadding="0" cellspacing="0" role="none"
                  style="border-collapse:collapse;border-spacing:0px;background-color:#0c0c0c;width:600px;">
                  <tr>
                    <td align="center" style="padding:30px 40px;">
                      <p style="Margin:0 0 16px 0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                        © ${new Date().getFullYear()} Peko Technologies Pvt. Ltd. All rights reserved.<br/>
                        Bengaluru, Karnataka, India
                      </p>
                      <table cellpadding="0" cellspacing="0" role="none" style="border-collapse:collapse;margin:0 auto;">
                        <tr>
                          <td style="padding:0 8px;">
                            <a href="https://www.linkedin.com/company/pekone" target="_blank" style="text-decoration:none;">
                              <img src="https://d2fduk7g9mvyjq.cloudfront.net/email-assets/linkedin.png" alt="LinkedIn" width="24" height="24" style="display:block;border:0;" />
                            </a>
                          </td>
                          <td style="padding:0 8px;">
                            <a href="https://twitter.com/peko_one" target="_blank" style="text-decoration:none;">
                              <img src="https://d2fduk7g9mvyjq.cloudfront.net/email-assets/twitter.png" alt="Twitter" width="24" height="24" style="display:block;border:0;" />
                            </a>
                          </td>
                          <td style="padding:0 8px;">
                            <a href="https://instagram.com/peko.one" target="_blank" style="text-decoration:none;">
                              <img src="https://d2fduk7g9mvyjq.cloudfront.net/email-assets/instagram.png" alt="Instagram" width="24" height="24" style="display:block;border:0;" />
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};
