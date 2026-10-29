const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('../emailTemplate/sharedLayout');

exports.generateEsimSuccessEmail = (transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes, templateDetails) => {
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
                                    src=${templateDetails?.logo}
                                    alt
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                    height="35"></a> </td>
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

exports.generateEsimBuySingleSuccessEmail = (transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  let nameOfOperator
  let dataMBs = esimDetails.dataMBs;
  let periodDays = esimDetails.periodDays;

  // Format data size based on conditions
  let dataDisplay;
  if (Number(dataMBs) === 0) {
    dataDisplay = 'Unlimited';
  } else if (dataMBs >= 1024) {
    dataDisplay = (dataMBs / 1024).toFixed(1).replace(/\.0$/, '') + ' GB';
  } else {
    dataDisplay = dataMBs + ' MB';
  }

  let packageName = `${dataDisplay} - ${periodDays} Days`;

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
                                        <td align="left" bgcolor="#fef8f8" style="Margin:0;padding-top:30px;padding-bottom:30px;padding-left:40px;padding-right:40px;background-color:#fef8f8">
                                            <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                    <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px"><strong>${qrCodes.length == 1 ? '' : 'eSIM '(i + 1) + ','} Scan this QR Code</strong></p>
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                                                        <br>
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="${sim?.qrCodeUrl}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                    width="145" height="145"></td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                                                        <br>
                                                                    </p>
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#0c0c0c;font-size:20px"><strong>ICCID Number: ${sim?.iccid}</strong></p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

          
          `
    }
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">

<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>DED Lisence</title>
    <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
    <!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
<![endif]-->
    <!--[if !mso]><!-- -->
    <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
    <!--<![endif]-->
    <style type="text/css">
        #outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.es-button { mso-style-priority:100!important; text-decoration:none!important; transition:all 100ms ease-in;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;} .es-button:hover { background:#555555!important; border-color:#555555!important;}.es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}
        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h1 a { text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } h2 a { text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:20px!important } h3 a { text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:17px!important }
         .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:17px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:14px!important; display:inline-block!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important }
         .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important }
         .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
    </style>
</head>

<body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F9FAFB">
        <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#F9FAFB" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background><![endif]-->
        <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F9FAFB">
            <tr style="border-collapse:collapse">
                <td valign="top" style="padding:0;Margin:0">
${v2Header({ website, websiteLabel, logo, branding })}
                    <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                        <tr style="border-collapse:collapse">
                            <td align="center" bgcolor="#F9FAFB" style="padding:0;Margin:0;background-color:#f9fafb">
                                <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:680px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                                role="none">
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                                            <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                    <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0;padding-bottom:16px">
                                                                    <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse:separate;border-spacing:0px">
                                                                        <tr>
                                                                            <td align="center" valign="middle" width="88" height="88" style="width:88px;height:88px;border-radius:50%;background-color:#e6f9e8;">
                                                                                <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse:separate;border-spacing:0px">
                                                                                    <tr>
                                                                                        <td align="center" valign="middle" width="56" height="56" style="width:56px;height:56px;border-radius:50%;background-color:#20C230;color:#ffffff;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;line-height:56px;font-weight:bold;">&#10003;</td>
                                                                                    </tr>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:36px;color:#131313;font-size:24px"><strong>${heading}</strong></p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:20px;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#131313;font-size:14px">We're pleased to confirm that your payment of ₹ ${amount} for the eSIM package (${packageName}) has been successfully processed. The next step is to activate your eSIM.&nbsp;</p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px"><strong>Transaction Details</strong></p>
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
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
                                        <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
<td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Placed on:</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td>
<td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">${new Date().toLocaleString('en-IN', {    timeZone: 'Asia/Kolkata'  })}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Transaction ID:</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">${transactionId}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Service :</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">eSIM</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
<td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Plan Name:</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td>
<td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">${nameOfOperator}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Paid Amount:</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">₹ ${amount}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="Margin:0;padding-top:5px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">No of eSIM:</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px"><strong></strong><strong>${quantity}</strong><strong></strong></p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                    ${qrCodeHtml}
                                </table>
                            </td>
                        </tr>
                    </table>
${v2Footer({ socials, branding })}
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`
}
exports.generateEsimBuyBulkSuccessEmail = (transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  let nameOfOperator
  let dataMBs = esimDetails.dataMBs;
  let periodDays = esimDetails.periodDays;

  let dataDisplay;
  if (Number(dataMBs) === 0) {
    dataDisplay = 'Unlimited';
  } else if (dataMBs >= 1024) {
    dataDisplay = (dataMBs / 1024).toFixed(1).replace(/\.0$/, '') + ' GB';
  } else {
    dataDisplay = dataMBs + ' MB';
  }

  let packageName = `${dataDisplay} - ${periodDays} Days`;
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
                                          <td align="left" bgcolor="#fef8f8" style="Margin:0;padding-top:30px;padding-bottom:30px;padding-left:40px;padding-right:40px;background-color:#fef8f8">
                                              <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px"><strong>eSIM ${i + 1}, Scan this QR Code</strong></p>
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                                                          <br>
                                                                      </p>
                                                                  </td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="${sim?.qrCodeUrl}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                      width="145" height="145"></td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                                                          <br>
                                                                      </p>
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#0c0c0c;font-size:20px"><strong>ICCID Number: ${sim?.iccid}</strong></p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                          </td>
                                      </tr>
  
            
            `
    }
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
  
  <head>
      <meta charset="UTF-8">
      <meta content="width=device-width, initial-scale=1" name="viewport">
      <meta name="x-apple-disable-message-reformatting">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta content="telephone=no" name="format-detection">
      <title>${heading}</title>
      <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
      <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
      <!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
  <![endif]-->
      <!--[if !mso]><!-- -->
      <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
      <!--<![endif]-->
      <style type="text/css">
          #outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.es-button { mso-style-priority:100!important; text-decoration:none!important; transition:all 100ms ease-in;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;} .es-button:hover { background:#555555!important; border-color:#555555!important;}.es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}
          @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h1 a { text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } h2 a { text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:20px!important } h3 a { text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:17px!important }
           .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:17px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:14px!important; display:inline-block!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important }
           .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important }
           .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } .h-auto { height:auto!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
      </style>
  </head>
  
  <body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
      <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F9FAFB">
          <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#F9FAFB" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background><![endif]-->
          <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F9FAFB">
              <tr style="border-collapse:collapse">
                  <td valign="top" style="padding:0;Margin:0">
${v2Header({ website, websiteLabel, logo, branding })}
                      <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                          <tr style="border-collapse:collapse">
                              <td align="center" bgcolor="#F9FAFB" style="padding:0;Margin:0;background-color:#f9fafb">
                                  <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:680px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                                  role="none">
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                                              <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0;padding-bottom:16px">
                                                                      <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse:separate;border-spacing:0px">
                                                                          <tr>
                                                                              <td align="center" valign="middle" width="88" height="88" style="width:88px;height:88px;border-radius:50%;background-color:#e6f9e8;">
                                                                                  <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse:separate;border-spacing:0px">
                                                                                      <tr>
                                                                                          <td align="center" valign="middle" width="56" height="56" style="width:56px;height:56px;border-radius:50%;background-color:#20C230;color:#ffffff;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;line-height:56px;font-weight:bold;">&#10003;</td>
                                                                                      </tr>
                                                                                  </table>
                                                                              </td>
                                                                          </tr>
                                                                      </table>
                                                                  </td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:36px;color:#131313;font-size:24px"><strong>${heading}</strong></p>
                                                                  </td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:20px;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#131313;font-size:14px">We're pleased to confirm that your payment of ₹ ${amount} for the eSIM package (${packageName}) has been successfully processed. The next step is to activate your eSIM.&nbsp;</p>
                                                                  </td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px"><strong>Transaction Details</strong></p>
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
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
                                          <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
  <td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                  <tr style="border-collapse:collapse">
                                                      <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Placed on:</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">${new Date().toLocaleString('en-IN', {    timeZone: 'Asia/Kolkata'})}</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td></tr></table><![endif]-->
                                          </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                  <tr style="border-collapse:collapse">
                                                      <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Transaction ID:</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">${transactionId}</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td></tr></table><![endif]-->
                                          </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                  <tr style="border-collapse:collapse">
                                                      <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Service :</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">eSIM</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td></tr></table><![endif]-->
                                          </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                                              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr>
  <td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                  <tr style="border-collapse:collapse">
                                                      <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Plan Name:</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">${nameOfOperator}</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td></tr></table><![endif]-->
                                          </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
                                              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                  <tr style="border-collapse:collapse">
                                                      <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">Paid Amount:</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px">₹ ${amount}</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td></tr></table><![endif]-->
                                          </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="Margin:0;padding-top:5px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                              <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                  <tr style="border-collapse:collapse">
                                                      <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">No of eSIM:</p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="left" style="padding:0;Margin:0;width:250px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px"><strong></strong><strong>${quantity}</strong><strong></strong></p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                              <!--[if mso]></td></tr></table><![endif]-->
                                          </td>
                                      </tr>
                                      <tr style="border-collapse:collapse">
                                          <td align="left" style="Margin:0;padding-top:30px;padding-bottom:30px;padding-left:40px;padding-right:40px">
                                              <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="left" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://gxphmw.stripocdn.email/content/guids/CABINET_bad18f8fadee286379d5ae3bbd808248926128b93939d8c7a93b4677d8c97bd9/images/group_1820549786_hpd.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                      width="235" height="152"></td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                          </td>
                                      </tr>
                                      ${qrCodeHtml}
                                      <!-- <tr style="border-collapse:collapse">
                                          <td align="left" bgcolor="#fef8f8" style="Margin:0;padding-top:30px;padding-bottom:30px;padding-left:40px;padding-right:40px;background-color:#fef8f8">
                                              <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                  <tr style="border-collapse:collapse">
                                                      <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                                                          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px"><strong>eSIM 1, Scan this QR Code</strong></p>
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px">
                                                                          <br>
                                                                      </p>
                                                                  </td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="https://gxphmw.stripocdn.email/content/guids/CABINET_bad18f8fadee286379d5ae3bbd808248926128b93939d8c7a93b4677d8c97bd9/images/images28.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                      width="145" height="145"></td>
                                                              </tr>
                                                              <tr style="border-collapse:collapse">
                                                                  <td align="center" style="padding:0;Margin:0">
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0c0c0c;font-size:16px">
                                                                          <br>
                                                                      </p>
                                                                      <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#0c0c0c;font-size:20px"><strong>ICCID Number: ${esimIds}</strong></p>
                                                                  </td>
                                                              </tr>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </table>
                                          </td>
                                      </tr> -->
                                  </table>
                              </td>
                          </tr>
                      </table>
${v2Footer({ socials, branding })}
                  </td>
              </tr>
          </table>
      </div>
  </body>
  </html>`
}
exports.generateEsimRecipientSubject = (esimDetails) => {
  // `esimDetails` here is the vendor plan object (see eSimTunz.js), which carries
  // `.name` (already formatted, e.g. "Caribbean, 1 GB, 7 Days") but no `.country`
  // field — using `.country` rendered as "null"/"undefined" in the subject line.
  return `Your eSIM is ready - ${esimDetails.name}`;
};

// Shared by the recipient-email fallback (below) and its admin-template variable
// builder (eSimTunz.js) — kept in one place so the two render paths can't drift.
const RECIPIENT_LABEL_STYLE = `Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#000000;font-size:16px`;

exports.capitalizeEsimName = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// The QR-code block for the recipient email, one per eSIM in `qrCodes`.
exports.buildEsimRecipientQrCodeHtml = (qrCodes) => {
  let qrCodeHtml = '';
  for (let i = 0; i < qrCodes.length; i++) {
    const sim = qrCodes[i];
    qrCodeHtml += `
                                    <tr style="border-collapse:collapse">
                                        <td align="left" bgcolor="#fef8f8" style="Margin:0;padding-top:30px;padding-bottom:30px;padding-left:40px;padding-right:40px;background-color:#fef8f8">
                                            <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                    <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0;padding-bottom:20px">
                                                                    <p style="${RECIPIENT_LABEL_STYLE}"><strong>${qrCodes.length == 1 ? '' : 'eSIM ' + (i + 1) + ', '}Scan this QR Code</strong></p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="${sim?.qrCodeUrl}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                    width="145" height="145"></td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0;padding-top:20px">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#0c0c0c;font-size:20px"><strong>ICCID Number: ${sim?.iccid}</strong></p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;
  }
  return qrCodeHtml;
};

// Email to the person the eSIM was purchased for (employee / someone else); purchaser is CC'd
exports.generateEsimRecipientEmail = (recipientName, purchaserName, transactionId, esimDetails, qrCodes, templateDetails) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  const planName = esimDetails?.name;
  const heading = 'eSIM Ready to Install';
  const greetingName = exports.capitalizeEsimName(recipientName) || 'there';
  const buyerName = exports.capitalizeEsimName(purchaserName) || 'Your organisation';

  const labelStyle = RECIPIENT_LABEL_STYLE;
  const valueStyle = `Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#0e0e0e;font-size:16px`;

  const detailRow = (label, value, tdPadding = 'padding-top:10px') => `
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="Margin:0;${tdPadding};padding-left:40px;padding-right:40px">
                                            <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                                <tr style="border-collapse:collapse">
                                                    <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="${labelStyle}">${label}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]-->
                                            <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                                <tr style="border-collapse:collapse">
                                                    <td align="left" style="padding:0;Margin:0;width:250px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="${valueStyle}">${value}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <!--[if mso]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>`;

  const qrCodeHtml = exports.buildEsimRecipientQrCodeHtml(qrCodes);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">

<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>eSIM Ready to Install</title>
    <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
    <!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
<![endif]-->
    <!--[if !mso]><!-- -->
    <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
    <!--<![endif]-->
    <style type="text/css">
        #outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.es-button { mso-style-priority:100!important; text-decoration:none!important; transition:all 100ms ease-in;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;} .es-button:hover { background:#555555!important; border-color:#555555!important;}.es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}
        @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-adaptive table, .es-left, .es-right { width:100%!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
    </style>
</head>

<body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F9FAFB">
        <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#F9FAFB" origin="0.5, 0" position="0.5, 0"></v:fill> </v:background><![endif]-->
        <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F9FAFB">
            <tr style="border-collapse:collapse">
                <td valign="top" style="padding:0;Margin:0">
${v2Header({ website, websiteLabel, logo, branding })}
                    <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                        <tr style="border-collapse:collapse">
                            <td align="center" bgcolor="#F9FAFB" style="padding:0;Margin:0;background-color:#f9fafb">
                                <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:680px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                                role="none">
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="padding:0;Margin:0;padding-top:40px;padding-left:40px;padding-right:40px">
                                            <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                    <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0">
                                                                    <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse:separate;border-spacing:0px">
                                                                        <tr>
                                                                            <td align="center" valign="middle" width="88" height="88" style="width:88px;height:88px;border-radius:50%;background-color:#e6f9e8;">
                                                                                <table cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse:separate;border-spacing:0px">
                                                                                    <tr>
                                                                                        <td align="center" valign="middle" width="56" height="56" style="width:56px;height:56px;border-radius:50%;background-color:#20C230;color:#ffffff;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;line-height:56px;font-weight:bold;">&#10003;</td>
                                                                                    </tr>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="center" style="padding:0;Margin:0;padding-top:20px">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:36px;color:#131313;font-size:24px"><strong>${heading}</strong></p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0;padding-top:25px">
                                                                    <p style="${labelStyle}">Hi ${greetingName},</p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-bottom:10px">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#131313;font-size:14px">${buyerName} has purchased an eSIM for you (${planName}). Scan the QR code below to install it. The next step after installing is to activate your eSIM.&nbsp;</p>
                                                                </td>
                                                            </tr>
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-bottom:10px">
                                                                    <p style="${labelStyle}"><strong>Order Details</strong></p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    ${detailRow('Placed on:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))}
                                    ${detailRow('Order ID:', transactionId)}
                                    ${detailRow('Service:', 'eSIM')}
                                    ${detailRow('Plan Name:', planName)}
                                    ${detailRow('Purchased by:', buyerName, 'padding-top:10px;padding-bottom:40px')}
                                    ${qrCodeHtml}
                                    <tr style="border-collapse:collapse">
                                        <td align="left" style="Margin:0;padding-top:30px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                                            <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                <tr style="border-collapse:collapse">
                                                    <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                                                        <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                            <tr style="border-collapse:collapse">
                                                                <td align="left" style="padding:0;Margin:0">
                                                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#131313;font-size:14px">Connect to Wi-Fi before scanning. Install now, activate later — your ${esimDetails.periodDays}-day validity starts when the eSIM first connects to a network at your destination, not when you install it. Your device must be eSIM-compatible and carrier-unlocked.</p>
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
${v2Footer({ socials, branding })}
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;
};