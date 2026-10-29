const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge, v2RejectBadge } = require("../emailTemplate/sharedLayout");

const formatINR = (amount) => Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

exports.commonFailedTemplate = (name, serviceName, url, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your payment failed</title>
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
          .peko-btn a { display:block !important; text-align:center !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Your payment failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2RejectBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#ee221c;">Your payment failed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},<br><br>We regret to inform you that your ${serviceName} payment on ${new Date().toLocaleString()} was unsuccessful. If any amount was deducted from your account, please be assured that the refund will be processed within 7 to 10 business days.<br><br>We appreciate your understanding and patience.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="peko-btn" style="padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#181818" role="presentation" style="border:none;border-radius:12px;cursor:auto;mso-padding-alt:16px 32px;background:#181818;" valign="middle">
                                          <a href="${templateDetails?.baseUrl}" style="display:inline-block;background:#181818;color:#ffffff;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:100%;margin:0;text-decoration:none;text-transform:none;padding:16px 32px;mso-padding-alt:0px;border-radius:12px;" target="_blank">Try Again</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:help@peko.one" style="color:#000000;">help@peko.one</a>. We are here to assist you in any way we can.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>Team ${branding}</div>
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

exports.commonFlightbookingFailedTemplate = (name, serviceName, url, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your payment failed</title>
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
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Your payment failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2RejectBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#ee221c;">Your payment failed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We regret to inform you that there was an issue processing your recent flight booking on ${branding}.<br>Unfortunately, the booking was not successful due to a backend issue.<br><br>If any payment was made during the booking process, please rest assured that the full amount will be refunded to your original payment method.<br><br>We apologize for any inconvenience this may have caused. Our team is actively working to resolve the issue.<br><br>In the meantime, please feel free to try booking again. We are happy to help with alternative travel arrangements if needed.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:help@peko.one" style="color:#000000;">help@peko.one</a>. We are here to assist you in any way we can.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>Team ${branding}</div>
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




exports.refundFailure = (params, logo) => {
  return `
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
  style="padding:0;Margin:0">

<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Your payment failed</title>
  <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
  <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml>
<![endif]--> <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"> <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .ExternalClass {
      width: 100%;
    }

    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
      transition: all 100ms ease-in;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-button:hover {
      background: #555555 !important;
      border-color: #555555 !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    @media only screen and (max-width:600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120% !important
      }

      h1 {
        font-size: 30px !important;
        text-align: center
      }

      h2 {
        font-size: 26px !important;
        text-align: left
      }

      h3 {
        font-size: 20px !important;
        text-align: left
      }

      h1 a {
        text-align: center
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important
      }

      h2 a {
        text-align: left
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 20px !important
      }

      h3 a {
        text-align: left
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important
      }

      .es-menu td a {
        font-size: 11px !important
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 13px !important
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 14px !important
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 15px !important
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 10px !important
      }

      *[class="gmail-fix"] {
        display: none !important
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important
      }

      .es-button-border {
        display: inline-block !important
      }

      a.es-button,
      button.es-button {
        font-size: 14px !important;
        display: inline-block !important
      }

      .es-btn-fw {
        border-width: 10px 0px !important;
        text-align: center !important
      }

      .es-adaptive table,
      .es-btn-fw,
      .es-btn-fw-brdr,
      .es-left,
      .es-right {
        width: 100% !important
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important
      }

      .es-m-p0 {
        padding: 0 !important
      }

      .es-m-p0r {
        padding-right: 0 !important
      }

      .es-m-p0l {
        padding-left: 0 !important
      }

      .es-m-p0t {
        padding-top: 0 !important
      }

      .es-m-p0b {
        padding-bottom: 0 !important
      }

      .es-m-p20b {
        padding-bottom: 20px !important
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important
      }

      tr.es-desk-hidden {
        display: table-row !important
      }

      table.es-desk-hidden {
        display: table !important
      }

      td.es-desk-menu-hidden {
        display: table-cell !important
      }

      .es-menu td {
        width: 1% !important
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important
      }

      table.es-social {
        display: inline-block !important
      }

      table.es-social td {
        display: inline-block !important
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important
      }

      .es-m-p5 {
        padding: 5px !important
      }

      .es-m-p5t {
        padding-top: 5px !important
      }

      .es-m-p5b {
        padding-bottom: 5px !important
      }

      .es-m-p5r {
        padding-right: 5px !important
      }

      .es-m-p5l {
        padding-left: 5px !important
      }

      .es-m-p10 {
        padding: 10px !important
      }

      .es-m-p10t {
        padding-top: 10px !important
      }

      .es-m-p10b {
        padding-bottom: 10px !important
      }

      .es-m-p10r {
        padding-right: 10px !important
      }

      .es-m-p10l {
        padding-left: 10px !important
      }

      .es-m-p15 {
        padding: 15px !important
      }

      .es-m-p15t {
        padding-top: 15px !important
      }

      .es-m-p15b {
        padding-bottom: 15px !important
      }

      .es-m-p15r {
        padding-right: 15px !important
      }

      .es-m-p15l {
        padding-left: 15px !important
      }

      .es-m-p20 {
        padding: 20px !important
      }

      .es-m-p20t {
        padding-top: 20px !important
      }

      .es-m-p20r {
        padding-right: 20px !important
      }

      .es-m-p20l {
        padding-left: 20px !important
      }

      .es-m-p25 {
        padding: 25px !important
      }

      .es-m-p25t {
        padding-top: 25px !important
      }

      .es-m-p25b {
        padding-bottom: 25px !important
      }

      .es-m-p25r {
        padding-right: 25px !important
      }

      .es-m-p25l {
        padding-left: 25px !important
      }

      .es-m-p30 {
        padding: 30px !important
      }

      .es-m-p30t {
        padding-top: 30px !important
      }

      .es-m-p30b {
        padding-bottom: 30px !important
      }

      .es-m-p30r {
        padding-right: 30px !important
      }

      .es-m-p30l {
        padding-left: 30px !important
      }

      .es-m-p35 {
        padding: 35px !important
      }

      .es-m-p35t {
        padding-top: 35px !important
      }

      .es-m-p35b {
        padding-bottom: 35px !important
      }

      .es-m-p35r {
        padding-right: 35px !important
      }

      .es-m-p35l {
        padding-left: 35px !important
      }

      .es-m-p40 {
        padding: 40px !important
      }

      .es-m-p40t {
        padding-top: 40px !important
      }

      .es-m-p40b {
        padding-bottom: 40px !important
      }

      .es-m-p40r {
        padding-right: 40px !important
      }

      .es-m-p40l {
        padding-left: 40px !important
      }
    }

    @media screen and (max-width:384px) {
      .mail-message-content {
        width: 414px !important
      }
    }
  </style>
</head>

<body
  style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FEFCFC">
    <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#fefcfc"></v:fill> </v:background><![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FEFCFC">
      <tr style="border-collapse:collapse">
        <td valign="top" style="padding:0;Margin:0">
          <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr style="border-collapse:collapse">
              <td align="center" style="padding:0;Margin:0">
                <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                  role="none"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  <tr style="border-collapse:collapse">
                    <td align="left" bgcolor="#ffffff"
                      style="Margin:0;padding-bottom:5px;padding-top:25px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                      <table width="100%" cellspacing="0" cellpadding="0" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                    src="https://gxphmw.stripocdn.email/content/guids/CABINET_06e02bda2aeab991ad3d993634b67f886b4d0871c74bd68d8f8318c43a6028ac/images/icons8wrong144.png"
                                    alt
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                    width="85" height="85"></td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td class="es-m-txt-c" align="center"
                                  style="padding:0;Margin:0;padding-bottom:15px;padding-top:30px">
                                  <h2
                                    style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:24px;font-style:normal;font-weight:bold;color:#ee221c;text-align:center">
                                    Refund failed</h2>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                    Dear ${params?.name},<br></p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                    We regret to inform you that your refund of ₹${formatINR(params?.amount)} for ${params?.transactionId} has failed due
                                    to technical issues on our end. We apologize for any inconvenience this may cause.
                                    <br>
                                    Please be assured that our team is diligently working on this issue and the refund
                                    will be processed within 7 to 10 business days.
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                    <br>
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                    We appreciate your understanding and patience.
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#010101;font-size:15px;text-align:center">
                                    <br>
                                  </p>
                                </td>
                              </tr>
                              <!-- <tr style="border-collapse:collapse">
                                                              <td align="center" style="padding:0;Margin:0"> <span class="msohide es-button-border"
                                                                      style="border-style:solid;border-color:#26A4D3;background:#ff4f4f;border-width:0px;display:inline-block;border-radius:6px;width:auto;mso-hide:all"><a
                                                                          href="" class="es-button" target="_blank"
                                                                          style="mso-style-priority:100 !important;text-decoration:none;transition:all 100ms ease-in;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#ff4f4f;border-radius:6px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:17px;width:auto;text-align:center;padding:15px 45px;mso-padding-alt:0;mso-border-alt:10px solid #ff4f4f">TRY
                                                                          AGAIN</a></span></td>
                                                          </tr> -->
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
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr style="border-collapse:collapse">
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                  role="none"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    <br>
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Thank you for using Peko. <br>
                                    If you have any queries or need further
                                    assistance, please reach out to us at
                                    <a href="mailto:help@peko.one">help@peko.one</a>.
                                    We are here to assist you in any
                                    way we can.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    .<br>
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Best Regards</p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Team Peko</p>
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
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr style="border-collapse:collapse">
              <td align="center" style="padding:0;Margin:0">
                <table class="es-footer-body"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px"
                  cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                  <tr style="border-collapse:collapse">
                    <td align="left" bgcolor="#ffffff"
                      style="padding:40px;Margin:0;background-color:#ffffff;border-radius:5px">
                      <table width="100%" cellspacing="0" cellpadding="0" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank"
                                    href="https://peko.one/in"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                      class="adapt-img"
                                      src=${logo}
                                      alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      height="35"></a> </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    This email was sent to you from company email
                                    address</p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    <a href="https://peko.one/ae/privacy-policy/"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
                                      Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/ae/cookie-policy/"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                      Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/ae/platform-agreement"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                      of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                      href="https://peko.one/ae/refund-policy"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund
                                      & Cancellation Policy</a><a target="_blank" class="unsubscribe" href=""
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a>
                                  </p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights
                                    Reserved</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" bgcolor="#0c0c0c"
                      style="Margin:0;padding-top:5px;padding-bottom:25px;padding-left:40px;padding-right:40px;background-color:#0c0c0c">
                      <table width="100%" cellspacing="0" cellpadding="0" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                    <br>
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                    <a href="https://peko.one/in"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:12px"
                                      target="_blank">www.peko.one</a>
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                    <br>
                                  </p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0">
                                  <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0"
                                    role="presentation"
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                    <tr style="border-collapse:collapse">
                                      <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                        <a target="_blank" href="https://x.com/PekoIndia"
                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                            title="Twitter"
                                            src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                            alt="Tw" width="24" height="24"
                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                      </td>
                                      <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                        <a target="_blank" href="https://www.instagram.com/peko.india"
                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                            title="Instagram"
                                            src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                            alt="Inst" width="24" height="24"
                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                      </td>
                                      <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank"
                                          href="https://www.linkedin.com/company/pekoindia/"
                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                            title="Linkedin"
                                            src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                            alt="In" width="24" height="24"
                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
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
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>

</html>
`
}


exports.emailOTPTemaplte = (name, otp, templateDetails) => {
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
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">Please use the OTP given below to complete the Hotel booking cancellation process. This OTP is valid for 2 minutes only.</div>
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

// key: none yet (called directly, not resolver-wired) — v2 design ported from
// purchase MS's own refundInitiated (utils/emailTemplate/common.js), which was built
// as a net-new v2 design (no AE reference exists for this flow) and already carries
// the optional Service Provider / Service Type lines this MS's Cashfree refund flow
// needs (travel/utils/cashFreeGateway.js's paymentRefundInitiatedEmailInternal passes
// exactly that params shape). Previously a pre-v2 Stripo template with no header/
// footer/badge chrome, replaced in place per explicit instruction — not a new design,
// reusing the one already established and signed off for this exact scenario.
exports.refundInitiated = (params, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Refund processed successfully</title>
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
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Refund processed successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-top:20px;padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Refund processed successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${params?.name || 'Customer'},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to inform you that your refund has been processed successfully. The refund amount (₹ ${formatINR(params?.amount)}) will be credited to your original payment method within 7 to 10 business days.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">We appreciate your understanding and patience.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Thank you for using ${branding}.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">Best Regards,<br>Team ${branding}</div>
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

exports.vendorInvoiceEmail = (params) => {
    return `
    <!DOCTYPE html>

<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">

<head>
    <title></title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
        }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
        }

        #MessageViewBody a {
            color: inherit;
            text-decoration: none;
        }

        p {
            line-height: inherit
        }

        .desktop_hide,
        .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
        }

        .image_block img+div {
            display: none;
        }

        sup,
        sub {
            font-size: 75%;
            line-height: 0;
        }

        @media (max-width:500px) {
            .mobile_hide {
                display: none;
            }

            .row-content {
                width: 100% !important;
            }

            .stack .column {
                width: 100%;
                display: block;
            }

            .mobile_hide {
                min-height: 0;
                max-height: 0;
                max-width: 0;
                overflow: hidden;
                font-size: 0px;
            }

            .desktop_hide,
            .desktop_hide table {
                display: table !important;
                max-height: none !important;
            }

            .row-2 .column-1 .block-1.heading_block h1 {
                font-size: 25px !important;
            }

            .row-3 .column-1 .block-1.paragraph_block td.pad>div {
                font-size: 14px !important;
            }

            .row-4 .column-1 .block-1.heading_block td.pad,
            .row-5 .column-1 .block-1.heading_block td.pad,
            .row-9 .column-1 .block-1.heading_block td.pad {
                padding: 0 !important;
            }

            .row-4 .column-1 .block-1.heading_block h1,
            .row-9 .column-1 .block-1.heading_block h1 {
                font-size: 17px !important;
            }

            .row-5 .column-1 {
                padding: 0 0 5px !important;
            }
        }
    </style>
    <!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>

<body class="body"
    style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation"
        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
        <tbody>
            <tr>
                <td>


                    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center">
      <table class="content" width="480" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding: 10px 0;">
            <p class="text">
              Dear ${params?.vendorName},
            </p>

            <p class="text">
              Please find attached the <b>tax invoice</b> for the <b>commission charged</b> by
              <b>Peko</b>.
            </p>

            <p class="text">
              This invoice is shared for your accounting and compliance records.
            </p>

            <p class="text">
              For any clarification, you may contact us at
              <a href="mailto:help@peko.one" style="color:#000000; text-decoration:underline;">
                help@peko.one
              </a>.
            </p>

            <p class="text">
              Best regards,<br />
              Finance Team<br />
              Peko
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-14"
                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                                        class="row-content stack" role="presentation"
                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
                                        width="480">
                                        <tbody>
                                            <tr style="border-collapse:collapse">
                                                <td align="center" style="padding:0;Margin:0;font-size:0px">
                                                    <a target="_blank" href="https://peko.one"
                                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                                            class="adapt-img" src="https://ci3.googleusercontent.com/meips/ADKq_NZqgfIWflNTNO0waLQxk4rWczpoWzU3xiz-0NjqdoNfJRc8eh1ZsGFh-RDZW9IOEu514aakXyl3f2K1NGeNyX2JZSGDJlN6G1izYZwOMyKxqucEVdWc2bbLDs2m5QZULZIm42k8Ji70C6Tzq-iI1ulOTia4zNfhThqlFHvvnzOPN4YvjUMdZI9p624NSLph7wu5W1Upj6kUyWKdMg=s0-d-e1-ft#https://gxphmw.stripocdn.email/content/guids/CABINET_8f8e7ee442fbda9a69cf88b98a720f7e0ddcf9093c2b341ffede27ef2b660865/images/peko.png" alt
                                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                            height="35"></a>
                                                </td>
                                            </tr>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-15" role="presentation"
        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
        <tbody>
            <tr>
                <td>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
                        role="presentation"
                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
                        width="480">
                        <tbody>
                            <tr>
                                <td class="column column-1"
                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                    width="100%">
                                    <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
                                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
                                        width="100%">
                                        <tr>
                                            <td class="pad" style="text-align:center;width:100%;">
                                                <h1
                                                    style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
                                                    <span class="tinyMce-placeholder" style="word-break: break-word;">
                                                        ©
                                                        ${new Date().getUTCFullYear()} Peko Platforms Private
                                                        Limited, All Rights Reserved</span>
                                                </h1>
                                            </td>
                                        </tr>
                                    </table>
                                    <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2"
                                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
                                        width="100%">
                                        <tr>
                                            <td class="pad">
                                                <h1
                                                    style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 14.399999999999999px;">
                                                    <a href="https://peko.one/in/privacy-policy" rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Privacy
                                                        Policy</a> | <a href="https://peko.one/in/cookie-policy/"
                                                        rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Cookie
                                                        Policy</a> | <a href="https://peko.one/in/platform-agreement"
                                                        rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Terms of
                                                        Use</a> | <a href="https://peko.one/in/refund-policy/"
                                                        rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Refund &
                                                        Cancellation Policy</a><a
                                                        style="text-decoration: underline; color: #000000;"></a>
                                                </h1>
                                            </td>
                                        </tr>
                                    </table>
                                    <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-3"
                                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
                                        width="100%">
                                        <tr>
                                            <td class="pad">
                                                <h1
                                                    style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;">
                                                    <a href="https://peko.one/" rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">www.peko.one</a>
                                                </h1>
                                            </td>
                                        </tr>
                                    </table>
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
    </table><!-- End -->
</body>

</html>
    `
}
