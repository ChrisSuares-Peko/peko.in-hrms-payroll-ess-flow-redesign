const { socialIconCells, v2Header, v2Footer, websiteLabel } = require('./sharedLayout');

exports.generateEsimSuccessEmail = (transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes) => {
  let nameOfOperator
  let packageName = `${esimDetails.dataMBs} MB - ${esimDetails.periodDays} Days`
  let validity = esimDetails?.validity
  let data = esimDetails?.dataMBs
  let heading
  let qrCodeHtml = ''

  if (type == "SIM") {
    nameOfOperator = esimDetails?.name
    heading = "eSIM Order Confirmation"
  } else {
    nameOfOperator = esimDetails?.name
    heading = "eSIM-Topup Order Confirmation"
  }

  if (type == "SIM") {
    for (let i = 0; i < qrCodes.length; i++) {
      const sim = qrCodes[i];
      qrCodeHtml += `
            <tr style="border-collapse:collapse">
            <td align="left" bgcolor="#fbfef8"
              style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#fbfef8">
              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                <tr style="border-collapse:collapse">
                  <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                      <tr style="border-collapse:collapse">
                        <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                            src="${sim?.qrCodeUrl}"
                            alt
                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                            width="100" height="100"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table> <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:250px" valign="top"><![endif]-->
              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                <tr style="border-collapse:collapse">
                  <td align="left" style="padding:0;Margin:0;width:250px">
                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                      <tr style="border-collapse:collapse">
                        <td align="left" style="padding:0;Margin:0">
                          <p
                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#161514;font-size:14px">
                            ICCID Number: ${sim?.iccid}<br></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table> <!--[if mso]></td></tr></table><![endif]-->
            </td>
          </tr>
            `
    }
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
  <title></title>
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
        padding: 0px !important
      }
  
      .es-m-p0r {
        padding-right: 0px !important
      }
  
      .es-m-p0l {
        padding-left: 0px !important
      }
  
      .es-m-p0t {
        padding-top: 0px !important
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
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F8FEF5">
    <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f8fef5" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background><![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F8FEF5">
      <tr style="border-collapse:collapse">
        <td valign="top" style="padding:0;Margin:0">
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr style="border-collapse:collapse">
              <td align="center" bgcolor="#f8fef5" style="padding:0;Margin:0;background-color:#f8fef5">
                <table class="es-footer-body"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px"
                  cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                    src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09"
                                    alt
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                    width="110" height="35"></td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:36px;color:#131313;font-size:24px">
                                    <strong>${heading}</strong>
                                  </p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:20px;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#131313;font-size:14px">
                                    We're pleased to confirm that your payment of ₹ ${amount} for the
                                    eSIM package (${packageName}) has been successfully processed.</p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    <strong>Transaction Details</strong>
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
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
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
  <td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Placed on:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    ${new Date().toLocaleString('en-IN', {    timeZone: 'Asia/Kolkata'})}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Transaction ID:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    ${transactionId}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Service :</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    eSIM</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
  
                  <tr style="border-collapse:collapse">
                    <td align="left"
                      style="Margin:0;padding-top:5px;padding-bottom:25px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Paid Amount:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    ₹ ${amount}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
  
                  ${type == "SIM" ? `
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
  <td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Network:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong>${nameOfOperator}</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Current package plan:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong>${packageName}</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left"
                      style="Margin:0;padding-top:5px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    No of eSIM:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong>${quantity}</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    ICCID:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong>${esimIds}</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
  
                    <tr style="border-collapse:collapse">
                      <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <strong>Your eSIM QR Codes</strong>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                      <strong></strong><br>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ${qrCodeHtml}
  
  
                  `: `
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px"> <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
  <td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Network:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong>${nameOfOperator}</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Validity:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong> ${validity} Days</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left"
                      style="Margin:0;padding-top:5px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                      <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                        <tr style="border-collapse:collapse">
                          <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                    Data:</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                      <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                        <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;width:250px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">
                                    <strong></strong><strong>${data}</strong><strong></strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table> <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                  `}
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr style="border-collapse:collapse">
              <td align="center" bgcolor="#f8fef5" style="padding:0;Margin:0;background-color:#f8fef5">
                <table class="es-footer-body"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px"
                  cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:20px;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#131313;font-size:12px">
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#131313;font-size:12px">
                                    <strong></strong>We hope you have a rewarding experience with our services. If you
                                    have any questions or need assistance, please don't hesitate to contact us at
                                    reach@peko.one<br>
                                  </p><strong></strong>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse:collapse">
                    <td align="left" bgcolor="#ffffff" style="padding:35px;Margin:0;background-color:#ffffff">
                      <table width="100%" cellspacing="0" cellpadding="0" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td valign="top" align="center" style="padding:0;Margin:0;width:530px">
                            <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank"
                                    href="https://peko.one/in"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                      class="adapt-img"
                                      src="https://gxphmw.stripocdn.email/content/guids/CABINET_0c3e226962d6092460427f83432b00f1cae42a8ee3ec2ec8583c8c3df0e80e40/images/peko.png"
                                      alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      width="161" height="58"></a> </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    This email was sent to you from company email address</p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
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

// Pre-rendered blob for the ${qrCodeHtml} slot — exported so the resolve* call site can
// build the identical value for the admin-managed DYNAMIC path, matching the JS fallback
// exactly (a customer must get the same scannable QR code either way). Never returns a
// bare '' - an empty placeholder would make the resolver discard the whole DYNAMIC
// template and fall back here anyway, per emailTemplateResolver.js.
const buildEsimQrCodeHtml = (type, qrCodes) => {
  if (type !== 'SIM' || !Array.isArray(qrCodes) || !qrCodes.length) {
    return '<!-- no eSIM QR codes for this order -->';
  }
  return qrCodes.map((sim, i) => `
                              <tr>
                                <td align="left" style="background-color:#FFFAFA;border-radius:12px;padding:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.6;text-align:left;color:#000000;">eSIM ${i + 1}, Scan this QR Code</div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td align="center" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                          <img alt="QR Code" src="${sim?.qrCodeUrl}" width="145" height="145" style="display:inline-block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />
                                        </td>
                                      </tr>
                                      <tr>
                                        <td align="left" style="font-size:0px;word-break:break-word;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.6;text-align:left;color:#000000;">ICCID Number: ${sim?.iccid}</div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr><td style="font-size:0px;line-height:12px;height:12px;">&nbsp;</td></tr>`).join('');
};
exports.buildEsimQrCodeHtml = buildEsimQrCodeHtml;

exports.generateEsimBuyBulkSuccessEmail = (transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes, partnerDetails, name) => {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const logo = partnerDetails?.logo;
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' }), branding });

  const dataMBs = esimDetails?.dataMBs;
  const periodDays = esimDetails?.periodDays;
  const dataDisplay = dataMBs >= 1024
    ? (dataMBs / 1024).toFixed(1).replace(/\.0$/, '') + ' GB'
    : dataMBs + ' MB';
  const packageName = `${dataDisplay} - ${periodDays} Days`;
  const heading = type === 'SIM' ? 'eSIM Order Confirmation' : 'eSIM-Topup Order Confirmation';
  const nameOfOperator = esimDetails?.name;

  // Never a bare '' - an empty placeholder would make the resolver discard the whole
  // DYNAMIC template and fall back to this local function, per emailTemplateResolver.js.
  const activationNoteHtml = type === 'SIM'
    ? 'The next step is to activate your eSIM using the installation guide attached to this email.'
    : '<!-- topup: no activation step -->';

  const qrCodeHtml = buildEsimQrCodeHtml(type, qrCodes);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${heading}</title>
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
      <div aria-label="${heading}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="background-color:#E5FFE8;border-radius:148.5px;display:inline-block;padding:9px;">
                                    <img alt="Success" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FSuccess.svg?alt=media&token=28e56fab-d9de-48e5-8649-10d84eda5826" width="48" height="48" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;" />
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${heading}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Hi ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:28px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to confirm that your payment of ₹ ${amount} for the eSIM package (${packageName}) has been successfully processed. ${activationNoteHtml}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;padding-top:8px;border-top:1px solid #E5E7EB;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Transaction Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Transaction ID:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Plan Name:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${nameOfOperator}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Paid Amount:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">₹ ${amount}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Current package plan:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${packageName}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">No of eSIM:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${quantity}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
${qrCodeHtml}
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

${footer}

      </div>
    </body>
  </html>`;
}
