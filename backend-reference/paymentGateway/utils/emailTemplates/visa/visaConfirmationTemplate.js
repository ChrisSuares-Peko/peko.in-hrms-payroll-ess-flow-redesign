/* eslint-disable no-irregular-whitespace */
exports.visaConfirmationTemplate = (
    // eslint-disable-next-line no-unused-vars
    { userName, destination, visaType, processingType, productName, travellers, priceBreakdown, orderNumber },
    templateDetails
) => {
    const travellersHtml = getTravellersHtml(travellers);
    const breakdownHtml = getPriceBreakdownHtml(priceBreakdown);

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Your Visa Application Has Been Submitted</title>
  <!--[if (mso 16)]><style type="text/css">a {text-decoration: none;}</style><![endif]-->
  <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
  <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG></o:AllowPNG><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style type="text/css">
    #outlook a { padding: 0; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    .es-button { mso-style-priority: 100 !important; text-decoration: none !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    .es-desk-hidden { display: none; float: left; overflow: hidden; width: 0; max-height: 0; line-height: 0; mso-hide: all; }
    @media only screen and (max-width:600px) {
      p, ul li, ol li, a { line-height: 150% !important }
      h1, h2, h3 { line-height: 120% !important }
      h1 { font-size: 28px !important; text-align: center }
      .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size: 14px !important }
      .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size: 12px !important }
      .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size: 11px !important }
      *[class="gmail-fix"] { display: none !important }
      .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align: center !important }
      .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align: right !important }
      .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align: left !important }
      .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display: inline !important }
      .es-button-border { display: block !important }
      a.es-button, button.es-button { font-size: 16px !important; display: block !important; border-top-width: 15px !important; border-bottom-width: 15px !important }
      .es-adaptive table, .es-left, .es-right { width: 100% !important }
      .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width: 100% !important; max-width: 600px !important }
      .es-adapt-td { display: block !important; width: 100% !important }
      .adapt-img { width: 100% !important; height: auto !important }
      .no-repeat { background-repeat: no-repeat !important }
      .center-row { margin: 0 auto !important }
      .force-full-width > table { width: 100% !important }
      table.es-social { width: auto !important }
      table.es-social td { display: inline-block !important }
      .es-content-body .es-adaptive-left, .es-content-body .es-adaptive-right, .header-in, [class*="es-"] + .es-cols-declared { display: block !important }
    }
  </style>
</head>
<body style="width:100%;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;">
  <div class="es-wrapper-color" style="background-color:#F6F6F6;">
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6;">
      <tr style="border-collapse:collapse">
        <td valign="top" style="padding:0;Margin:0">

          <!-- Header with logo -->
          <table cellpadding="0" cellspacing="0" class="es-header" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr style="border-collapse:collapse">
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0" cellspacing="0"
                  role="none"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  <tr style="border-collapse:collapse">
                    <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0px">
                                  <a target="_blank" href="https://peko.one/in"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:14px">
                                    <img class="adapt-img" src=${templateDetails?.logo} alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      width="110" height="35">
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

          <!-- Main content -->
          <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr style="border-collapse:collapse">
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                  role="none"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">

                  <!-- Heading -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:30px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                  <h1
                                    style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:30px;font-style:normal;font-weight:bold;color:#131413;text-align:center">
                                    Your visa application has been submitted.</h1>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Intro paragraph -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:15px">
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Dear ${userName},
                                  </p>
                                  <br>
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    We are pleased to inform you that your visa application has been submitted successfully through ${templateDetails?.branding || 'Peko'}, and your application is currently being processed. Below are the details of your submission.
                                  </p>
                                </td>
                              </tr>
                              <!-- Divider -->
                              <tr style="border-collapse:collapse">
                                <td style="padding:0;Margin:0;border-top:1px dashed #dddddd;font-size:0;line-height:0">&nbsp;</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- VISA DETAILS -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="left" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:8px">
                                  <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:12px;color:#909090;letter-spacing:1px;font-weight:bold;text-transform:uppercase">
                                    VISA DETAILS
                                  </p>
                                </td>
                              </tr>
                              ${productName ? `
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:12px">
                                  <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:16px;color:#131413;font-weight:bold;line-height:22px">
                                    ${productName}
                                  </p>
                                </td>
                              </tr>` : ''}
                              <tr style="border-collapse:collapse">
                                <td style="padding:0;Margin:0">
                                  <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                    ${destination ? `
                                    <tr style="border-collapse:collapse">
                                      <td style="padding:4px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#666666;width:40%">Destination</td>
                                      <td style="padding:4px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#131413;font-weight:600">${destination}</td>
                                    </tr>` : ''}
                                    ${visaType ? `
                                    <tr style="border-collapse:collapse">
                                      <td style="padding:4px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#666666;width:40%">Visa Type</td>
                                      <td style="padding:4px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#131413;font-weight:600">${visaType}</td>
                                    </tr>` : ''}
                                    ${processingType ? `
                                    <tr style="border-collapse:collapse">
                                      <td style="padding:4px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#666666;width:40%">Processing Type</td>
                                      <td style="padding:4px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#131413;font-weight:600">${processingType}</td>
                                    </tr>` : ''}
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td style="padding:0;Margin:0;border-top:1px solid #eeeeee;font-size:0;line-height:0">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- TRAVELLERS -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="left" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:12px;color:#909090;letter-spacing:1px;font-weight:bold;text-transform:uppercase">
                                    TRAVELLERS
                                  </p>
                                </td>
                              </tr>
                              ${travellersHtml}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td style="padding:0;Margin:0;border-top:1px solid #eeeeee;font-size:0;line-height:0">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- PRICE BREAKDOWN -->
                  <tr style="border-collapse:collapse">
                    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:40px;padding-right:40px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="left" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:12px;color:#909090;letter-spacing:1px;font-weight:bold;text-transform:uppercase">
                                    PRICE BREAKDOWN
                                  </p>
                                </td>
                              </tr>
                              ${breakdownHtml}
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

          <!-- Thank you + Best Regards -->
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
                                <td align="center" style="padding:0;Margin:0">
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    <br>
                                  </p>
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Thank you for choosing ${templateDetails?.branding || 'Peko'}.
                                    If you have any queries or need further assistance, please reach out to us at
                                    <a href="mailto:reach@peko.one" style="color:#131413">reach@peko.one</a>.
                                    We assure you of our best services at all times.
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
                    <td align="left" style="padding:0;Margin:0;padding-left:40px;padding-right:40px;padding-bottom:30px">
                      <table cellpadding="0" cellspacing="0" width="100%" role="none"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr style="border-collapse:collapse">
                          <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    <br>
                                  </p>
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Best Regards,</p>
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                    Team ${templateDetails?.branding || 'Peko'}</p>
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

          <!-- Footer -->
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
                                <td align="center" style="padding:0;Margin:0;font-size:0px">
                                  <a target="_blank" href="https://peko.one/in"
                                    style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                    <img class="adapt-img" src=${templateDetails?.logo} alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      width="110" height="35">
                                  </a>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    This email was sent to you from company email address</p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    <a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;
                                    <a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;
                                    <a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;
                                    <a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund &amp; Cancellation Policy</a>
                                  </p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0">
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    &copy; ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Black social footer -->
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
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px"><br></p>
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                    <a href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:12px" target="_blank">www.peko.one</a>
                                  </p>
                                  <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px"><br></p>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;font-size:0">
                                  <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0"
                                    role="presentation"
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                    <tr style="border-collapse:collapse">
                                      <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                        <a target="_blank" href="https://twitter.com/pekoit"
                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                          <img title="Twitter"
                                            src="https://gxphmw.stripocdn.email/content/assets/img/social-icons/circle-white/twitter-circle-white.png"
                                            alt="Tw" width="24" height="24"
                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                        </a>
                                      </td>
                                      <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px">
                                        <a target="_blank" href="https://www.instagram.com/pekoit/"
                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                          <img title="Instagram"
                                            src="https://gxphmw.stripocdn.email/content/assets/img/social-icons/circle-white/instagram-circle-white.png"
                                            alt="Inst" width="24" height="24"
                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                        </a>
                                      </td>
                                      <td valign="top" align="center" style="padding:0;Margin:0">
                                        <a target="_blank" href="https://ae.linkedin.com/company/pekoit"
                                          style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                          <img title="Linkedin"
                                            src="https://gxphmw.stripocdn.email/content/assets/img/social-icons/circle-white/linkedin-circle-white.png"
                                            alt="In" width="24" height="24"
                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
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
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    function getTravellersHtml(list) {
        try {
            if (!Array.isArray(list) || !list.length) return '';
            return list.map(t => `
              <tr style="border-collapse:collapse">
                <td align="left" style="padding:4px 0;Margin:0">
                  <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#131413;font-weight:600;line-height:20px">
                    ${t.name}
                  </p>
                </td>
              </tr>`).join('');
        } catch {
            return '';
        }
    }

    function getPriceBreakdownHtml(breakdown) {
        try {
            if (!breakdown) return '';
            const fmt = (v) => (v !== undefined && v !== null && v !== 0) ? `INR ${parseFloat(v).toFixed(2)}` : null;
            const rows = [
                { label: 'Visa Charges',   value: fmt(breakdown.visaCharges) },
                { label: 'Addon(s)',        value: fmt(breakdown.addon) },
                { label: 'Processing Fee',  value: fmt(breakdown.processingFee) },
                { label: 'Service Fee',     value: fmt(breakdown.serviceFee) },
                { label: 'Taxes & VAT',     value: fmt(breakdown.taxes) },
            ].filter(r => r.value !== null);

            const totalValue = breakdown.total !== undefined ? `INR ${parseFloat(breakdown.total).toFixed(2)}` : null;

            const rowsHtml = rows.map(r => `
              <tr style="border-collapse:collapse">
                <td style="padding:5px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#666666;width:60%">${r.label}</td>
                <td style="padding:5px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:14px;color:#131413;text-align:right">${r.value}</td>
              </tr>`).join('');

            const dividerHtml = rows.length > 0 ? `
              <tr style="border-collapse:collapse">
                <td colspan="2" style="padding:4px 0;border-top:1px solid #eeeeee;font-size:0;line-height:0">&nbsp;</td>
              </tr>` : '';

            const totalHtml = totalValue ? `
              <tr style="border-collapse:collapse">
                <td style="padding:6px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:15px;color:#131413;font-weight:700;width:60%">Order Total</td>
                <td style="padding:6px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:15px;color:#ff3333;font-weight:700;text-align:right">${totalValue}</td>
              </tr>` : '';

            return `
              <tr style="border-collapse:collapse">
                <td style="padding:0;Margin:0">
                  <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                    ${rowsHtml}
                    ${dividerHtml}
                    ${totalHtml}
                  </table>
                </td>
              </tr>`;
        } catch {
            return '';
        }
    }
};
