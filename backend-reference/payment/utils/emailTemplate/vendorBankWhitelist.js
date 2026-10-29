// Generate email asking a vendor to whitelist a bank account for a virtual account (VA)
exports.generateVendorBankWhitelistTemplate = ({
  vendorName = "Partner",
  virtualAccountNumber,
  accountNumber,
  ifsc,
  accountHolderName,
  bankName,
} = {}) => {
  const detailRow = (label, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "";
    }
    return `
                                  <tr style="border-collapse:collapse">
                                    <td align="left" style="padding:6px 0;Margin:0;width:45%">
                                      <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#888888;font-size:14px">${label}</p>
                                    </td>
                                    <td align="left" style="padding:6px 0;Margin:0">
                                      <p style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#333333;font-size:14px;font-weight:bold">${value}</p>
                                    </td>
                                  </tr>`;
  };

  const rows = [
    detailRow("Virtual Account Number", virtualAccountNumber),
    detailRow("Account Holder Name", accountHolderName),
    detailRow("Account Number", accountNumber),
    detailRow("IFSC", ifsc),
    detailRow("Bank Name", bankName),
  ].join("");

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
    <title>Bank account whitelisting request</title>
    <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
    <style type="text/css">
      #outlook a { padding: 0; }
      .ExternalClass { width: 100%; }
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
      @media only screen and (max-width:600px) {
        .es-content table, .es-footer table, .es-content, .es-footer { width: 100% !important; max-width: 600px !important }
        .es-adapt-td { display: block !important; width: 100% !important }
        .adapt-img { width: 100% !important; height: auto !important }
      }
    </style>
  </head>

  <body
    style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FFFFFF">
      <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FFFFFF">
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
                        style="Margin:0;padding-top:10px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#ffffff">
                        <table width="100%" cellspacing="0" cellpadding="0" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                              <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td class="es-m-txt-c" align="center"
                                    style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px">
                                    <h2
                                      style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#333333">
                                      <b>Bank Account Whitelisting Request</b>
                                    </h2>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                      Dear ${vendorName},
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                      <br>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                      Please whitelist the following bank account for the virtual account below.
                                    </p>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                    <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#f7f7f7;border-radius:6px;padding:10px 20px">
                                      ${rows}
                                    </table>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0;padding-top:10px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                      Kindly confirm once the account has been whitelisted.
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                      <br>
                                      Best Regards, <br>
                                      Team Peko
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
                                        src="https://gxphmw.stripocdn.email/content/guids/CABINET_674b0d0a49570ab72e7f6bd66180cf3d1d634b107ad71e4b66e3d678ba50cd6e/images/peko.png"
                                        alt
                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                        width="110" height="35"></a> </td>
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
