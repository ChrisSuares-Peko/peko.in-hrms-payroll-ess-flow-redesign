/* eslint-disable no-irregular-whitespace */
exports.packageUpdateEmail = (username, packageName, oldPackage, newPackage, date, templateDetails) => {
    const priceRows = [
        oldPackage.monthly !== newPackage.monthly
            ? `<tr>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">Monthly Price&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${oldPackage.monthly}/month&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${newPackage.monthly}/month&nbsp;</td>
                                      </tr>`
            : '',
        oldPackage.annually !== newPackage.annually
            ? `<tr>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">Yearly Price&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${oldPackage.annually}/year&nbsp;</td>
                                        <td width="33.333333333333336%" style="padding: 10px; word-break: break-word; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd;">₹ ${newPackage.annually}/year&nbsp;</td>
                                      </tr>`
            : '',
    ].join('');
    return `<!DOCTYPE html>
  <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
  
  <head>
  <title></title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
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
  
    #converted-body .list_block ul,
    #converted-body .list_block ol,
    .body [class~="x_list_block"] ul,
    .body [class~="x_list_block"] ol,
    u+.body .list_block ul,
    u+.body .list_block ol {
      padding-left: 20px;
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
  
      .row-2 .column-1 .block-1.paragraph_block td.pad>div,
      .row-2 .column-1 .block-2.paragraph_block td.pad>div {
        font-size: 14px !important;
      }
    }
  </style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
  </head>
  
  <body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; padding-top: 30px;">
    <tbody>
      <tr>
        <td>
          <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tbody>
              <tr>
                <td>
                  <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                          <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                            <tr>
                              <td class="pad">
                                <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                  <p style="margin: 0; margin-bottom: 16px;">Dear ${username},</p>
                                  <p style="margin: 0; margin-bottom: 16px;">We are reaching out to inform you about an update to the pricing of the ${packageName} plan on the ${templateDetails.branding} platform.&nbsp;</p>
                                  <p style="margin: 0;">&nbsp;</p>
                                </div>
                              </td>
                            </tr>
                          </table>
                          <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                            <tr>
                              <td class="pad">
                                <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
                                  <p style="margin: 0;"><strong>What’s Changing?&nbsp;</strong></p>
                                </div>
                              </td>
                            </tr>
                          </table>
                          <table class="table_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                              <td class="pad">
                                <table style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; width: 100%; table-layout: fixed; direction: ltr; background-color: transparent; font-family: Arial, Helvetica, sans-serif; font-weight: 400; color: #101112; text-align: left; letter-spacing: 0px;" width="100%">
                                  <thead style="vertical-align: top; background-color: #f2f2f2; color: #101112; font-size: 14px; line-height: 120%;">
                                    <tr>
                                      <th width="33.333333333333336%" style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;">&#8203;</th>
                                      <th width="33.333333333333336%" style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;">Current Price&nbsp;</th>
                                      <th width="33.333333333333336%" style="padding: 10px; word-break: break-word; font-weight: 700; border-top: 1px solid #dddddd; border-right: 1px solid #dddddd; border-bottom: 1px solid #dddddd; border-left: 1px solid #dddddd; text-align: center;">Updated Price&nbsp;</th>
                                    </tr>
                                  </thead>
                                  <tbody style="vertical-align: top; font-size: 14px; line-height: 120%;">
                                    ${priceRows}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <table class="list_block block-4" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word; color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left; mso-line-height-alt: 16.8px;">
                            <tr>
                              <td class="pad">
                                <div style="margin-left:-20px">
                                  <ul style="margin-top: 0; margin-bottom: 0; list-style-type: revert;">
                                    <li aria-setsize="-1" style="Margin: 0 0 0 0;">Effective Date: ${date}&nbsp;</li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          </table>
                          <table class="paragraph_block block-5" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                            <tr>
                              <td class="pad">
                                <div style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                  <p style="margin: 0; margin-bottom: 16px;"><strong>Why the Update?</strong>&nbsp;<br>The new pricing reflects the improved features and capabilities we’ve added to the platform, ensuring that you have access to the best tools for managing your business operations.&nbsp;</p>
                                  <p style="margin: 0; margin-bottom: 16px;">Your subscription will automatically update to the new pricing starting from the next billing cycle. No action is required on your part.&nbsp;</p>
                                  <p style="margin: 0; margin-bottom: 16px;">If you have any queries or need further assistance, please write to us at <a href="mailto:reach@peko.one" style="text-decoration: underline; color: #7747FF;">reach@peko.one</a>.&nbsp;</p>
                                  <p style="margin: 0;">Best Regards,&nbsp;<br>Team ${templateDetails.branding}&nbsp;</p>
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
          <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tbody>
              <tr>
                <td>
                  <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 25px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                          <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                              <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                <div class="alignment" align="center" style="line-height:10px">
                                  <div style="max-width: 144px;"><img src="${templateDetails.logo}" style="display: block; height: auto; border: 0; width: 100%;" width="144" alt title height="auto"></div>
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
          <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
            <tbody>
              <tr>
                <td>
                  <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
                    <tbody>
                      <tr>
                        <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                          <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                              <td class="pad" style="text-align:center;width:100%;">
                                <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;"><span class="tinyMce-placeholder" style="word-break: break-word;">© ${new Date().getUTCFullYear()}&nbsp;Peko Platforms Private Limited, All Rights Reserved</span></h1>
                              </td>
                            </tr>
                          </table>
                          <table class="heading_block block-2" width="100%" border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                              <td class="pad">
                                <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;"><a href="https://peko.one/in" target="_blank" style="text-decoration: underline; color: #000000;" rel="noopener">www.peko.one</a></h1>
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