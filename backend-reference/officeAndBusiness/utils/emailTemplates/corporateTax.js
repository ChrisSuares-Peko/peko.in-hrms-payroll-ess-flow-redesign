/* eslint-disable no-irregular-whitespace */
exports.corporateTaxRegistrationUpdateEmail = ({ name, status, remarks, host }, templateDetails) => {
  try {
    remarks = remarks.replace(/\n/g, '<br>')
  } catch (error) {
    remarks = ''
  }

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
    <title>Order cancelled</title>
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
          font-size: 16px !important
        }
  
        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 16px !important
        }
  
        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 17px !important
        }
  
        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 17px !important
        }
  
        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important
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
          display: inline-block !important;
          padding: 15px 25px 15px 25px !important
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
  
        .h-auto {
          height: auto !important
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
            <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr style="border-collapse:collapse">
                <td align="center" style="padding:0;Margin:0">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                    role="none"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                    <tr style="border-collapse:collapse">
                      <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c" style="padding:0;Margin:0">
                                    <h1
                                      style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#060606;text-align:left">
                                      Corporate tax registration - Status update</h1>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c h-auto" height="369"
                                    style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      Dear ${name},</p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      There has been a status update to the corporate tax registration process. </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      Status: ${status} <br>
                                      Remarks: ${remarks} <br>
                                      Go to Corporate tax registration: <a target="_blank"
                                        href="${host}/system/corporate/corporate-tax-registration"> Click here</a> <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br><br>Thank you for using ${templateDetails?.branding}.
                                      <br><br>If you have
                                      any queries or need further assistance, please
                                      reach out to us at <a href="mailto:reach@peko.one">reach@peko.one</a>.
                                      We are here to assist you in any way we can.
                                      <br><br>Best Regards,
                                      <br>Team ${templateDetails?.branding}
                                    </p>
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
                                        src="${templateDetails?.logo}"
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
exports.corporateTaxRegistrationDocReuploadEmail = (name = 'user', templateDetails) => {
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
    <title>Reupload the documents</title>
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
          font-size: 16px !important
        }
  
        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 16px !important
        }
  
        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 17px !important
        }
  
        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 17px !important
        }
  
        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important
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
          display: inline-block !important;
          padding: 15px 25px 15px 25px !important
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
  
        .h-auto {
          height: auto !important
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
            <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr style="border-collapse:collapse">
                <td align="center" style="padding:0;Margin:0">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                    role="none"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                    <tr style="border-collapse:collapse">
                      <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c" style="padding:0;Margin:0">
                                    <h1
                                      style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#060606;text-align:left">
                                      Reupload the documents </h1>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c h-auto" height="369"
                                    style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      Dear ${name},</p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      This is to inform you that there has been an issue with the upload of your
                                      documents. Kindly reupload the required documents at your earliest convenience. It
                                      will help us continue the process without any hindrance.
                                      <br><br>
                                      We appreciate your understanding.
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br><br>Thank you for using ${templateDetails?.branding}.
                                      <br><br>If you have
                                      any queries or need further assistance, please
                                      reach out to us at <a href="mailto:reach@peko.one">reach@peko.one</a>.
                                      We are here to assist you in any way we can.
                                      <br><br>Best Regards,
                                      <br>Team ${templateDetails?.branding}
                                    </p>
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
                                        src="${templateDetails?.logo}"
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

exports.corporateTaxRegistrationCompletedEmail = (name = 'user', templateDetails) => {
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
    <title>Reupload the documents</title>
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
          font-size: 16px !important
        }
  
        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 16px !important
        }
  
        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 17px !important
        }
  
        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 17px !important
        }
  
        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important
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
          display: inline-block !important;
          padding: 15px 25px 15px 25px !important
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
  
        .h-auto {
          height: auto !important
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
            <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr style="border-collapse:collapse">
                <td align="center" style="padding:0;Margin:0">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                    role="none"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                    <tr style="border-collapse:collapse">
                      <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c" style="padding:0;Margin:0">
                                    <h1
                                      style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#060606;text-align:left">
                                      Corporate tax registration successful </h1>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c h-auto" height="369"
                                    style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      Dear ${name},</p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      We are pleased to inform you that your corporate tax registration process has been
                                      completed successfully.
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br><br>Thank you for using ${templateDetails?.branding}.
                                      <br><br>If you have
                                      any queries or need further assistance, please
                                      reach out to us at <a href="mailto:reach@peko.one">reach@peko.one</a>.
                                      We assure you of our best services at all times. 
                                      <br><br>Best Regards,
                                      <br>Team ${templateDetails?.branding}
                                    </p>
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
                                        src="${templateDetails?.logo}"
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

exports.corporateTaxRegistrationReSubmissionEmail = (name = 'user', templateDetails) => {
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
    <title>Reupload the documents</title>
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
          font-size: 16px !important
        }
  
        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 16px !important
        }
  
        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 17px !important
        }
  
        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 17px !important
        }
  
        .es-infoblock p,
        .es-infoblock ul li,
        .es-infoblock ol li,
        .es-infoblock a {
          font-size: 12px !important
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
          display: inline-block !important;
          padding: 15px 25px 15px 25px !important
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
  
        .h-auto {
          height: auto !important
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
            <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr style="border-collapse:collapse">
                <td align="center" style="padding:0;Margin:0">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                    role="none"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                    <tr style="border-collapse:collapse">
                      <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c" style="padding:0;Margin:0">
                                    <h1
                                      style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#060606;text-align:left">
                                      Documents resubmitted
                                    </h1>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c h-auto" height="369"
                                    style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      Dear ${name},</p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      We are pleased to inform you that your documents for corporate tax registration have
                                      been resubmitted successfully. Our expert team is diligently working on this, and we
                                      will provide you with timely updates on the registration process.
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <br><br>Thank you for using ${templateDetails?.branding}.
                                      <br><br>If you have
                                      any queries or need further assistance, please
                                      reach out to us at <a href="mailto:reach@peko.one">reach@peko.one</a>.
                                      We assure you of our best services at all times.
                                      <br><br>Best Regards,
                                      <br>Team ${templateDetails?.branding}
                                    </p>
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
                                        src="${templateDetails?.logo}"
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

exports.corporateTaxRegistrationEmail = (name = 'user', templateDetails) => {
  return `<!DOCTYPE html>
  
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
  
              .row-1 .column-1 .block-1.heading_block h1 {
                  font-size: 25px !important;
              }
  
              .row-2 .column-1 .block-1.paragraph_block td.pad>div {
                  font-size: 14px !important;
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
                      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
                          <tbody>
                              <tr>
                                  <td>
                                      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
                                          role="presentation"
                                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;"
                                          width="480">
                                          <tbody>
                                              <tr>
                                                  <td class="column column-1"
                                                      style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                      width="100%">
                                                      <table border="0" cellpadding="25" cellspacing="0" class="heading_block block-1"
                                                          role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                          <tr>
                                                              <td class="pad">
                                                                  <h1
                                                                      style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 36px;">
                                                                      Confirmation of Corporate tax registration</h1>
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
                      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation"
                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                          <tbody>
                              <tr>
                                  <td>
                                      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
                                          role="presentation"
                                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
                                          width="480">
                                          <tbody>
                                              <tr>
                                                  <td class="column column-1"
                                                      style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 25px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                      width="100%">
                                                      <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1"
                                                          role="presentation"
                                                          style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                          <tr>
                                                              <td class="pad">
                                                                  <div
                                                                      style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                      <p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
                                                                      <p style="margin: 0;">We are pleased to inform you that your documents for corporate
                                                                          tax registration have been successfully submitted.<br /><br />Rest assured, we will
                                                                          keep you informed and provide timely updates on the progress of your registration
                                                                          process.<br /><br />Thank you for using ${templateDetails?.branding}.<br /><br />If you have any queries or
                                                                          need further assistance, please reach out to us at <a href="mailto:reach@peko.one"
                                                                              rel="noopener" style="text-decoration: underline; color: #000000;"
                                                                              target="_blank">reach@peko.one</a>. We assure you of our best services at all
                                                                          times.<br /><br />Best Regards,<br />Team ${templateDetails?.branding}</p>
                                                                  </div>
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
                      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation"
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
                                                      style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 25px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                                      width="100%">
                                                      <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1"
                                                          role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                              <tr style="border-collapse: collapse">
                                  <td align="center" style="
                                        padding: 0;
                                        margin: 0;
                                        font-size: 0px;
                                      ">
                                    <a target="_blank" href="https://peko.one/in" style="
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          text-decoration: underline;
                                          color: #666666;
                                          font-size: 12px;
                                        "><img class="adapt-img"
                                        src="${templateDetails?.logo}"
                                        alt style="
                                            display: block;
                                            border: 0;
                                            outline: none;
                                            text-decoration: none;
                                            -ms-interpolation-mode: bicubic;
                                          " height="35" /></a>
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
                      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation"
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
                                                          role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                          <tr>
                                                              <td class="pad" style="text-align:center;width:100%;">
                                                                  <h1
                                                                      style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
                                                                      <span class="tinyMce-placeholder" style="word-break: break-word;">© ${new
      Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</span></h1>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                      <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2"
                                                          role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                          <tr>
                                                              <td class="pad">
                                                                  <h1
                                                                      style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 14.399999999999999px;">
                                                                      <a href="https://peko.one/ae/privacy-policy/" rel="noopener"
                                                                          style="text-decoration: underline; color: #000000;" target="_blank">Privacy
                                                                          Policy</a> | <a href="https://peko.one/ae/cookie-policy/" rel="noopener"
                                                                          style="text-decoration: underline; color: #000000;" target="_blank">Cookie
                                                                          Policy</a> |  <a href="https://peko.one/ae/platform-agreement" rel="noopener"
                                                                          style="text-decoration: underline; color: #000000;" target="_blank">Terms of
                                                                          Use</a> |  <a href="https://peko.one/ae/refund-policy" rel="noopener"
                                                                          style="text-decoration: underline; color: #000000;" target="_blank">Refund &
                                                                          Cancellation Policy</a><a style="text-decoration: underline; color: #000000;"></a>
                                                                  </h1>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                      <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-3"
                                                          role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                          <tr>
                                                              <td class="pad">
                                                                  <h1
                                                                      style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;">
                                                                      <a href="https://peko.one/in" rel="noopener"
                                                                          style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a>
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
  
  </html>`
}

exports.corporateTaxRegistrationEmailNew = (
  name,
  transactionId,
  amount,
  templateDetails
) => {

  return `<!DOCTYPE html
   PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
   style="padding:0;Margin:0">
  
  <head>
   <meta charset="UTF-8">
   <meta content="width=device-width, initial-scale=1" name="viewport">
   <meta name="x-apple-disable-message-reformatting">
   <meta http-equiv="X-UA-Compatible" content="IE=edge">
   <meta content="telephone=no" name="format-detection">
   <title>Order placed successfully</title>
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
         font-size: 16px !important
       }
  
       .es-header-body p,
       .es-header-body ul li,
       .es-header-body ol li,
       .es-header-body a {
         font-size: 16px !important
       }
  
       .es-content-body p,
       .es-content-body ul li,
       .es-content-body ol li,
       .es-content-body a {
         font-size: 17px !important
       }
  
       .es-footer-body p,
       .es-footer-body ul li,
       .es-footer-body ol li,
       .es-footer-body a {
         font-size: 17px !important
       }
  
       .es-infoblock p,
       .es-infoblock ul li,
       .es-infoblock ol li,
       .es-infoblock a {
         font-size: 12px !important
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
         display: inline-block !important;
         padding: 15px 25px 15px 25px !important
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
           <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
             style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
             <tr style="border-collapse:collapse">
               <td align="center" style="padding:0;Margin:0">
                 <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                   role="none"
                   style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  
                   <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px">
                       <table cellpadding="0" cellspacing="0" width="100%" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                             <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="left" class="es-m-txt-c" style="padding:0;Margin:0">
                                   <h1
                                     style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#333333;text-align:left">
                                     Payment for Corporate Tax Registration was successful </h1>
                                 </td>
                               </tr>
                               <tr style="border-collapse:collapse">
                                 <td align="left" class="es-m-txt-c"
                                   style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#555555;font-size:14px">
                                     Dear ${name},</p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#555555;font-size:14px">
                                     We are pleased to inform you that your payment for Corporate Tax registration was successful. To view your registration status or make any changes, please visit the Corporate Tax registration section on ${templateDetails?.branding}.</p>
                                 </td>
                               </tr>
                               <tr style="border-collapse: collapse">
                                 <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                                 
                                 </td>
                               </tr>
                               <tr style="border-collapse:collapse">
                                 <td align="left" class="es-m-txt-c"
                                   style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <strong>ORDER DETAILS</strong>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <br>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <strong>Order ID:</strong>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     ${transactionId}</p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <br>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <strong>Placed on:</strong>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     ${new Date().toLocaleString()}</p>
                                     <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <br>
                                   </p>
                                     <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <strong>Amount Paid:</strong>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     ${amount}</p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                     <br>
                                   </p>
                                 </td>
                               </tr>
                             </table>
                           </td>
                         </tr>
                       </table>
                     </td>
                   </tr>
                  
                      
                     </td>
                   </tr>
                  
                          
                     </td>
                   </tr>
                 
                 
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
                                 <td style="padding:0;Margin:0">
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                     If you have any queries or need further assistance, please call us at 022 489 30373 or write to us at
                                     <a href="mailto:reach@peko.one">reach@peko.one</a>. We are here to assist you in any
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
                                     <br>
                                   </p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                     Best Regards</p>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                     Team ${templateDetails?.branding}</p>
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
                          <tr style="border-collapse: collapse">
                                <td align="center" style="
                                      padding: 0;
                                      margin: 0;
                                      font-size: 0px;
                                    ">
                                  <a target="_blank" href="https://peko.one/in" style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: underline;
                                        color: #666666;
                                        font-size: 12px;
                                      "><img class="adapt-img"
                                      src="${templateDetails.logo}"
                                      alt style="
                                          display: block;
                                          border: 0;
                                          outline: none;
                                          text-decoration: none;
                                          -ms-interpolation-mode: bicubic;
                                        " height="35" /></a>
                                </td>
                              </tr>
                         <tr style="border-collapse:collapse">
                           <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                             <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              
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
                                       href="https://peko.one/ae/refund-policy/"
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
     `;
};

