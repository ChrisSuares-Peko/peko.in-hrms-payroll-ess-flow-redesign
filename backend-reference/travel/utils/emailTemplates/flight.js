/* eslint-disable no-unused-vars */
//Generate email template for Invoice email send on corporate side
exports.confirmationAttachMailTemplate = (data, passengersDetails, bookingDetails) => {
  let bookingHistoryUrl = ''
  if (process.env.NODE_ENV == 'staging') {
    bookingHistoryUrl = 'https://uatae.pekoapp.com/corporate-travel/airline/manage-bookings'
  } else {
    bookingHistoryUrl = 'https://uae.peko.one/corporate-travel/airline/manage-bookings'
  }
  return `<!DOCTYPE html
    PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>New Template 8</title>
    <!--[if (mso 16)]><style type="text/css">     a {text-decoration: none;}     </style><![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--> <!--[if gte mso 9]><xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml>
  <![endif]-->
    <style type="text/css">
      #outlook a {
        padding: 0;
      }
  
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
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
  
      .es-p10l {
        padding-left: 10px;
      }
  
      .es-p10r {
        padding-right: 10px;
      }
  
      .es-p15 {
        padding: 15px;
      }
  
      .es-p15t {
        padding-top: 15px;
      }
  
      .es-p15b {
        padding-bottom: 15px;
      }
  
      .es-p15l {
        padding-left: 15px;
      }
  
      .es-p15r {
        padding-right: 15px;
      }
  
      .es-p25 {
        padding: 25px;
      }
  
      .es-p25t {
        padding-top: 25px;
      }
  
      .es-p25b {
        padding-bottom: 25px;
      }
  
      .es-p25l {
        padding-left: 25px;
      }
  
      .es-p25r {
        padding-right: 25px;
      }
  
      .es-p30 {
        padding: 30px;
      }
  
      .es-p30t {
        padding-top: 30px;
      }
  
      .es-p30l {
        padding-left: 30px;
      }
  
      .es-p30r {
        padding-right: 30px;
      }
  
      .es-p35 {
        padding: 35px;
      }
  
      .es-p35t {
        padding-top: 35px;
      }
  
      .es-p35b {
        padding-bottom: 35px;
      }
  
      .es-p35l {
        padding-left: 35px;
      }
  
      .es-p35r {
        padding-right: 35px;
      }
  
      .es-p40 {
        padding: 40px;
      }
  
      .es-p40t {
        padding-top: 40px;
      }
  
      .es-p40b {
        padding-bottom: 40px;
      }
  
      .es-p40l {
        padding-left: 40px;
      }
  
      .es-p40r {
        padding-right: 40px;
      }
  
      s {
        text-decoration: line-through;
      }
  
      ul li,
      ol li {
        Margin-bottom: 15px;
        margin-left: 0;
      }
  
      .es-header {
        background-color: transparent;
        background-repeat: repeat;
        background-position: center top;
      }
  
      .es-header-body {
        background-color: rgb(255, 255, 255);
      }
  
      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li {
        color: rgb(51, 51, 51);
        font-size: 14px;
      }
  
      .es-header-body a {
        color: rgb(51, 51, 51);
        font-size: 14px;
      }
  
      .es-footer {
        background-color: transparent;
        background-repeat: repeat;
        background-position: center top;
      }
  
      .es-footer-body {
        background-color: rgb(255, 255, 255);
      }
  
      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li {
        color: rgb(51, 51, 51);
        font-size: 14px;
      }
  
      .es-footer-body a {
        color: rgb(170, 170, 170);
        font-size: 14px;
      }
  
      .es-infoblock,
      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li {
        line-height: 120%;
        font-size: 12px;
        color: rgb(204, 204, 204);
      }
  
      .es-infoblock a {
        font-size: 12px;
        color: rgb(204, 204, 204);
      }
  
      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 48px;
      }
  
      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 32px;
      }
  
      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px;
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
          line-height: 120%
        }
  
        h1 {
          font-size: 30px !important;
          text-align: center
        }
  
        h2 {
          font-size: 26px !important;
          text-align: center
        }
  
        h3 {
          font-size: 20px !important;
          text-align: center
        }
  
        .es-header-body h1 a,
        .es-content-body h1 a,
        .es-footer-body h1 a {
          font-size: 30px !important
        }
  
        .es-header-body h2 a,
        .es-content-body h2 a,
        .es-footer-body h2 a {
          font-size: 26px !important
        }
  
        .es-header-body h3 a,
        .es-content-body h3 a,
        .es-footer-body h3 a {
          font-size: 20px !important
        }
  
        .es-menu td a {
          font-size: 14px !important
        }
  
        .es-header-body p,
        .es-header-body ul li,
        .es-header-body ol li,
        .es-header-body a {
          font-size: 12px !important
        }
  
        .es-content-body p,
        .es-content-body ul li,
        .es-content-body ol li,
        .es-content-body a {
          font-size: 16px !important
        }
  
        .es-footer-body p,
        .es-footer-body ul li,
        .es-footer-body ol li,
        .es-footer-body a {
          font-size: 16px !important
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
          font-size: 20px !important;
          display: inline-block !important
        }
  
        .es-adaptive table,
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
  
        .es-desk-hidden {
          display: table-row !important;
          width: auto !important;
          overflow: visible !important;
          max-height: inherit !important
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
    style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F4F9F9">
      <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f4f9f9"></v:fill> </v:background><![endif]-->
      <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F4F9F9">
        <tr>
          <td valign="top" style="padding:0;Margin:0">
            <table class="es-content" cellspacing="0" cellpadding="0" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr>
                <td align="center" bgcolor="#f6f5f4" style="padding:0;Margin:0;background-color:#f6f5f4">
                  <table class="es-content-body"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;border-top:8px solid #f4f9f9;width:600px;border-bottom:8px solid #f4f9f9"
                    cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none">
                    <tr>
                      <td align="left" style="padding:0;Margin:0">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr>
                            <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="#"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:14px"><img
                                        class="adapt-img"
                                        src="https://gxphmw.stripocdn.email/content/guids/CABINET_a8f0d3946e51d08b6d06b885599ffbdf1f78caeb4e65add8f30f98514d8b3dd3/images/bannerflights.jpg"
                                        alt
                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                        width="600" height="231"></a> </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <h2
                                      style="Margin:0;line-height:38px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:32px;font-style:normal;font-weight:bold;color:#333333">
                                      Flight ticket confirmed</h2>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:23px;color:#333333;font-size:15px">
                                      Dear ${data.user}, <br> We are pleased to inform you that your flight ticket has
                                      been confirmed successfully. We have attached the ticket details. We wish you a
                                      successful trip. </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center"
                                    style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;font-size:0">
                                    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                      role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td
                                          style="padding:0;Margin:0;border-bottom:3px dashed #f4f9f9;background:none;height:1px;width:100%;margin:0px">
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
                    <tr>
                      <td align="left"
                        style="Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;padding-bottom:30px">
                        <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:194px" valign="top"><![endif]-->
                        ${bookingDetails.length && bookingDetails.map((segment, i) => {
    return `
                        <table cellspacing="0" cellpadding="0" align="left" class="es-left" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                          <tr>
                            <td class="es-m-p0r es-m-p20b" valign="top" align="center"
                              style="padding:0;Margin:0;width:174px">
                              <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:10px">
                                    <h1
                                      style="Margin:0;line-height:58px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:48px;font-style:normal;font-weight:bold;color:#333333">
                                      <strong>${segment.onPoint}</strong>
                                    </h1>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ff4f4f;font-size:12px">
                                      ${segment.departureAirport}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      Departure: <strong>${segment.departureTime}</strong></p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td>
                          </tr>
                        </table> <!--[if mso]></td><td style="width:173px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                          <tr>
                            <td align="left" class="es-m-p20b" style="padding:0;Margin:0;width:173px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;font-size:0px"><img
                                      src="https://gxphmw.stripocdn.email/content/guids/CABINET_6792cf314a49a363a10168d657e51bc8/images/6031620388720967.gif"
                                      alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      width="173" height="65"></td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      Plane: <b>${segment.plane}</b></p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      Flight duration: <strong>${segment.duration}</strong></p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <!--[if mso]></td><td style="width:20px"></td><td style="width:173px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                          <tr>
                            <td align="left" style="padding:0;Margin:0;width:173px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:10px">
                                    <h1
                                      style="Margin:0;line-height:58px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:48px;font-style:normal;font-weight:bold;color:#333333">
                                      <strong>${segment.offPoint}</strong>
                                    </h1>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#ff4f4f;font-size:12px">
                                      ${segment.arrivalAirport}</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      Arrival: <strong>${segment.arrivalTime}</strong></p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>`
  }).join('')}
                        <!--[if mso]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr>
                <td align="center" bgcolor="#f6f5f4" style="padding:0;Margin:0;background-color:#f6f5f4">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px;border-bottom:10px solid #f4f9f9"
                    role="none">
                    <tr>
                      <td align="left" style="padding:0;Margin:0">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr>
                            <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:27px;color:#666666;font-size:18px">
                                      Details</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:5px;Margin:0;font-size:0">
                                    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                      role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td
                                          style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:unset;height:1px;width:100%;margin:0px">
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="left" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      <strong><span style="font-size:13px">&nbsp;
                                          &nbsp;
                                          &nbsp;PASSENGER&nbsp;&nbsp;NAME</span>&nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp;&nbsp;<span style="font-size:13px">PNR</span>&nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        &nbsp;</strong><b> E-TICKET
                                        NO.</b><strong>&nbsp; &nbsp;&nbsp;</strong>
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:5px;Margin:0;font-size:0">
                                    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                      role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td
                                          style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:unset;height:1px;width:100%;margin:0px">
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
                    ${passengersDetails.length && passengersDetails.map((passenger, i) => {
    return `
                    <tr>
                      <td align="left" style="padding:20px;Margin:0">
                        <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:194px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                          <tr>
                            <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:174px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="left" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      ${i + 1}. ${passenger.name} , ${passenger.ptc}
                                      &nbsp;&nbsp;</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td>
                          </tr>
                        </table> <!--[if mso]></td><td style="width:173px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                          <tr>
                            <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:173px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="left" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#ff4f4f;font-size:14px">
                                      <b>&nbsp;&nbsp;${passenger.pnr}&nbsp;&nbsp;</b>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <!--[if mso]></td><td style="width:20px"></td><td style="width:173px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                          <tr>
                            <td align="center" style="padding:0;Margin:0;width:173px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="left" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      ${passenger.ticket}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table> <!--[if mso]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                    `
  }).join('')}
                    <tr>
                      <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr>
                            <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center"
                                    style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;font-size:0">
                                    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                      role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td
                                          style="padding:0;Margin:0;border-bottom-width:3px;border-bottom-style:dashed;border-bottom-color:#ebeded;background:none;height:1px;width:100%;margin:0px">
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
                    <tr>
                      <td align="left"
                        style="Margin:0;padding-top:10px;padding-left:20px;padding-right:20px;padding-bottom:30px">
                        <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:270px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                          <tr>
                            <td align="left" style="padding:0;Margin:0;width:270px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                    <span class="es-button-border"
                                      style="border-style:solid;border-color:#2CB543;background:#ff4f4f;border-width:0px;display:block;border-radius:4px;width:auto"><a
                                        href=${bookingHistoryUrl} class="es-button" target="_blank"
                                        style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#ffffff;font-size:18px;padding:10px 20px 10px 20px;display:block;background:#ff4f4f;border-radius:4px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #ff4f4f;padding-left:20px;padding-right:20px">Download
                                        ticket</a> </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table> <!--[if mso]></td><td style="width:20px"></td>
  <td style="width:270px" valign="top"><![endif]-->
                        <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                          <tr>
                            <td align="left" style="padding:0;Margin:0;width:270px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                    <span class="es-button-border"
                                      style="border-style:solid;border-color:#2CB543;background:#ff4f4f;border-width:0px;display:block;border-radius:4px;width:auto"><a
                                        href=${bookingHistoryUrl} class="es-button" target="_blank"
                                        style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#ffffff;font-size:18px;padding:10px 20px 10px 20px;display:block;background:#ff4f4f;border-radius:4px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #ff4f4f;padding-left:20px;padding-right:20px">Make
                                        changes</a> </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table> <!--[if mso]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tr>
                <td align="center" bgcolor="#f6f5f4" style="padding:0;Margin:0;background-color:#f6f5f4">
                  <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px;border-bottom:8px solid #f4f9f9"
                    role="none">
                    <tr>
                      <td align="left" style="padding:0;Margin:0;padding-top:20px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr>
                            <td align="center" valign="top" style="padding:0;Margin:0;width:600px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px;padding-bottom:15px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#666666;font-size:16px">
                                      Thank you for using Peko. <br></p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#666666;font-size:16px">
                                      If you have any queries or need further assistance, please reach out to us
                                      at <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best
                                      services at all times. <br><br>
                                      Best Regards, <br>
                                      Team Peko
                                    </p>
                                  </td>
                                </tr>
                                <!-- <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-bottom:5px">
                                    <h3
                                      style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#333333">
                                      <strong>Transaction Details</strong>
                                    </h3>
                                  </td>
                                </tr> -->
                                <tr>
                                  <td align="center"
                                    style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;font-size:0">
                                    <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                      role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td
                                          style="padding:0;Margin:0;border-bottom-width:3px;border-bottom-style:dashed;border-bottom-color:#ebeded;background:none;height:1px;width:100%;margin:0px">
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
                    <!-- <tr>
                      <td class="esdev-adapt-off" align="left" style="padding:20px;Margin:0">
                        <table cellpadding="0" cellspacing="0" class="esdev-mso-table" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:560px">
                          <tr>
                            <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
                              <table cellpadding="0" cellspacing="0" class="es-left" align="left" role="none"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                                <tr>
                                  <td align="left" style="padding:0;Margin:0;width:270px">
                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td align="right" style="padding:0;Margin:0">
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                            Date<br>Transaction ID:</p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                            Service:</p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                            Paid Amount:</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td style="padding:0;Margin:0;width:20px"></td>
                            <td class="esdev-mso-td" valign="top" style="padding:0;Margin:0">
                              <table cellpadding="0" cellspacing="0" class="es-right" align="right" role="none"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                                <tr>
                                  <td align="left" style="padding:0;Margin:0;width:270px">
                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tr>
                                        <td align="left" style="padding:0;Margin:0">
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                            <strong>12-02-${new Date().getUTCFullYear()}<br>223344455555</strong>
                                          </p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                            <strong>Air Ticket</strong>
                                          </p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                            <strong>INR 200</strong>
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
                    </tr> -->
                    <tr>
                      <td align="left" bgcolor="#ffffff" style="padding:10px;Margin:0;background-color:#ffffff">
                        <table width="100%" cellspacing="0" cellpadding="0" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr>
                            <td valign="top" align="center" style="padding:0;Margin:0;width:580px">
                              <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                      src="https://gxphmw.stripocdn.email/content/guids/CABINET_a8f0d3946e51d08b6d06b885599ffbdf1f78caeb4e65add8f30f98514d8b3dd3/images/logo4st5zyzhmin_2.png"
                                      alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      width="130" height="70"></td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      This email was sent to you from company email
                                      address</p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      <a href="https://peko.one/in/privacy-policy/"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:14px">Privacy
                                        Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:14px">Cookie
                                        Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:14px">Terms
                                        of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                        href="https://peko.one/in/refund-policy"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:14px">Refund
                                        & Cancellation Policy</a><a target="_blank" class="unsubscribe" href=""
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:14px"></a>
                                    </p>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
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

exports.airLineTicketTemplate = (data, covenienceFee) => {
  function parentCurrencyToAed(amount, parentCurrency) {
    const USDAEDRate = 3.67;
    const EURAEDRate = 3.88;
    if (isNaN(amount)) {
      return false;
    }
    let convertedAmount;
    switch (parentCurrency) {
      case "INR":
        convertedAmount = amount.toFixed(2);
        break;
      case "USD":
        convertedAmount = (amount * USDAEDRate).toFixed(2);
        break;
      case "EUR":
        convertedAmount = (amount * EURAEDRate).toFixed(2);
        break;
      default:
        return false; // Invalid or unsupported currency
    }
    return parseFloat(convertedAmount); // Convert the string back to a number
  }
  let passengerData = "";
  let bookingStatusHtml = "";
  let baseFare =
    parentCurrencyToAed(data?.fare?.totalFare, data?.fare?.currencyCode) -
    parentCurrencyToAed(
      data?.fare?.customerAdditionalFareInfo.markupEarned,
      data?.fare?.currencyCode
    ) -
    parentCurrencyToAed(
      data?.fare?.customerAdditionalFareInfo.transactionFeeEarned,
      data?.fare?.currencyCode
    ) +
    parentCurrencyToAed(
      data?.fare?.customerAdditionalFareInfo.discount,
      data?.fare?.currencyCode
    ) -
    parentCurrencyToAed(data?.totalAncillaryAmount, data?.fare?.currencyCode) -
    parentCurrencyToAed(data?.fare?.totalTax, data?.fare?.currencyCode)

  if (data) {
    const { fare, passengers, ticketDocument, bookingStatus } = data;
    passengerData = getPassengerDetails({
      passengers,
      ticketDocument,
    });

    data.totalAncillaryAmount = 0;
    passengers.forEach((passenger) => {
      if (passenger.ancillaries) {
        passenger?.ancillaries.forEach((ancillary) => {
          data.totalAncillaryAmount += ancillary.fare.sellingAmount;
        });
      }
    });
    if (bookingStatus === "TICKETED") {
      bookingStatusHtml = `Booking Successfully Confirmed`;
    } else if (bookingStatus === "OK TO TICKET") {
      bookingStatusHtml = `Booking Not Yet Confirmed. Please check again later.`;
    } else if (bookingStatus === "BOOKING FAILD") {
      bookingStatusHtml = `Booking Faild. Amount will be refunded`;
    } else if (bookingStatus === "REQUEST REFUND") {
      bookingStatusHtml = `Booking Cancelled`;
    } else {
      bookingStatusHtml =
        "Unknown Status. Please contact support for assistance.";
    }
  }

  return `
    <!DOCTYPE  html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
  
    <title>Ticket</title>
  
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
  
    <style type="text/css">
      @import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");
  
      body {
        font-family: 'Roboto', sans-serif;
      }
  
      hr {
        /* margin: 1.875em 0; */
        border: none;
        border-bottom: solid 1px #000000;
      }
  
      .dashed-2 {
        border: none;
        height: 1px;
        background: #000;
        background: repeating-linear-gradient(90deg, #000, #000 3px, transparent 3px, transparent 6px);
      }
  
      .line {
        width: 40%;
        text-align: center;
        border-bottom: 2px dotted rgb(165, 165, 165);
        line-height: 0.1em;
        margin: auto
      }
  
      .layover {
        background: #fff;
        padding: 0 10px;
      }
  
      /* ul {
        list-style-position: inside;
        padding-left: 0;
      } */
    </style>
  </head>
  
  <body>
    <div class=" mt-4">
      <div class="card">
        <div class="card-body">
          <div class=" mb-5 mt-3">
            <div class="row d-flex align-items-baseline">
              <div class="col-3">
                <p style="font-size: 35px;"> <strong>Your ticket</strong></p>
              </div>
              <div class="col-6">
                <span class="">Ticket ID -  ${data.ticketDocument[0].ticketDocNbr
    } </span>
                <span class="ps-3">Booking Id: ${data.bookingReferenceId}</span>
              </div>
              <div class="col-3 d-flex justify-content-center align-items-center">
                <img src="https://peko.one/wp-content/uploads/2022/03/Untitled-design3.png" height="35" alt="" srcset="">
              </div>
  
            </div>
            Booking status : ${bookingStatusHtml}
            <div>
            ${data?.flightDetails}
            </div>
  
            <!-- table -->
            <div class="container mt-5">
              <table class="table table-bordered lh-lg">
                <thead>
                  <tr>
                    <th>TRAVELLERS</th>
                    <th>AIRLINE PNR</th>
                    <th>TICKET NO.</th>
                  </tr>
                </thead>
                <tbody>
                  ${passengerData}
  
                </tbody>
              </table>
              <p>TIP: The air inside airplanes is dry, so drink nonalcoholic, decaffeinated beverages and water to avoid becoming dehydrated.</p>
  
              <hr>
            </div>
            <!-- ABOUT THIS TRIP -->
            <div>
              <h6>ABOUT THIS TRIP</h6>
              <ul class="lh-lg">
                <li>
                  Note: Except for medical devices, electronic devices which are
                  larger than a cell phone/smart phone cannot be carried in the
                  cabin of the aircraft.
                </li>
                <li>
                  Note: Only cell phones of dimension Length: 16cm x Width: 9.3cm
                  x Depth: 1.5cm are allowed in the cabin baggage. Please carry
                  all other electronic equipment inside check-in baggage.
                </li>
                <li>
                  Use your Trip ID for all communication with Peko about this booking
                </li>
                <li>
                  Please reach the airport 4 hours before the departure time. Check-in counters at the airport close 2
                  hours before departure
                </li>
                <li>
                  Your carry-on baggage shouldn't weigh more than 7kg
                </li>
                <li>
                  Carry photo identification, you will need it as proof of identity while checking-in
                </li>
                <li>
                  Kindly ensure that you have the relevant visa, immigration
                  clearance and travel with a passport, with a validity of at
                  least 6 months.
                </li>
                <li>
                  For hassle free processing, cancel/amend your tickets with Peko
                  instead of doing so directly with Airline
                </li>
              </ul>
            </div>
  
            <!-- FARE BREAKUP -->
  
            <div>
              <h6>FARE BREAKUP</h6>
              <table>
                <tbody class="lh-lg">
                  <tr>
                    <td>
                      Base Fare:
                    </td>
                    <td class="ps-3"> ${baseFare
    } INR</td>
                  </tr>
                  <tr>
                  <td>
                  Transaction Fee:
                  </td>
                  <td class="ps-3"> ${parentCurrencyToAed(
      data?.fare?.customerAdditionalFareInfo.transactionFeeEarned,
      data?.fare?.currencyCode
    )} INR</td>
                  </tr>
                  <tr>
                    <td>
                      Discounts And Cashbacks:
                    </td>
                    <td class="ps-3">${parentCurrencyToAed(
      data?.fare?.customerAdditionalFareInfo.discount,
      data?.fare?.currencyCode
    )} INR</td>
                  </tr>
                  <tr>
                  <td>
                  Total Ancillary :
                  </td>
                  <td class="ps-3"> ${data?.totalAncillaryAmount} INR</td>
                </tr>
                  <tr>
                    <td>
                      Taxes and Fees:
                    </td>
                    <td class="ps-3"> ${parentCurrencyToAed(
      data?.fare?.totalTax,
      data?.fare?.currencyCode
    )} INR</td>
                  </tr>
                   <tr>
                    <td>
                      Convenience Fee:
                    </td>
                    <td class="ps-3"> ${covenienceFee} INR</td>
                  </tr>
                  <tr>
                    <td>
                      Total Fare:
                    </td>
                    <td class="ps-3">${(parentCurrencyToAed(
      data?.fare?.totalFare,
      data?.fare?.currencyCode
    ) + covenienceFee)} INR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <hr>
            <div class="row fs-5">
              <div class="col-4"> Emirates helpline 600 555555</div>
              <div class="col-4 text-center">www.peko.one </div>
              <div class="col-4 text-end">Peko Helpline? <br> Call 022 489 30373 </div>
  
            </div>
  
  
          </div>
        </div>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
  </body>
  
  </html>
    `;

  function getPassengerDetails(data) {
    let { passengers, ticketDocument } = data;
    let datas = [];

    for (let i = 0; i < passengers.length; i++) {
      datas.push({
        // name: `${passengers[i].passengerInfo.nameTitle} ${passengers[i].passengerInfo.givenName} ${passengers[i].passengerInfo.surname}`,
        name: `${passengers[i].passengerInfo.nameTitle} ${passengers[i].passengerInfo.givenName}`,
        passport: passengers[i]?.identityDocuments[0]?.idDocumentNumber,
        pnr: ticketDocument[i]?.airlineLocators[0]?.airlineLocator || "Pending",
        ticket: ticketDocument[i]?.ticketDocNbr || "Pending",
      });
    }
    let passengersHtml = "";
    datas.forEach((person, index) => {
      passengersHtml += `
      <tr>
      <td>
        <div class="row">
          <div class="col-1">
            <i class="bi bi-person"></i>
          </div>
          <div class="col-11">
            <div>${person?.name}</div>
            <div>Passport no. <span>${person?.passport}</span> </div>
          </div>
        </div>
      </td>
      <td>${person?.pnr}</td>
      <td>${person?.ticket}</td>
      </tr>
        `;
      });
  
      return passengersHtml;
    }
  };

exports.commonFlightbookingFailedTemplate = (name, serviceName, url) => {
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
                                    Your payment failed</h2>
                                </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="left" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                    Dear ${name},<br></p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#010101;font-size:16px;text-align:center">
                                    We regret to inform you that there was an issue processing your recent flight booking on Peko.<br>
                                    Unfortunately, the booking was not successful due to a backend issue.<br><br>
                                    If any payment was made during the booking process, please rest assured that the full amount will be refunded to your original payment method.<br><br>
                                    We apologize for any inconvenience this may have caused. Our team is actively working to resolve the issue.<br><br>
                                    In the meantime, please feel free to try booking again. We are happy to help with alternative travel arrangements if needed.
                                  </p>
                                  
                                </td>
                              </tr>
                              <tr style="border-collapse: collapse">
                                <td align="center" valign="top" style="padding: 0; margin: 0; width: 520px">
                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="
                                                mso-table-lspace: 0pt;
                                                mso-table-rspace: 0pt;
                                                border-collapse: collapse;
                                                border-spacing: 0px;
                                              ">
                                    <tr style="border-collapse: collapse">
                                      <td align="center" style="padding: 0; margin: 0">
                                        
                                        <!--<![endif]-->
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
                                    Thank you for using Peko.
                                    If you have any queries or need further
                                    assistance, please reach out to us at
                                    <a href="mailto:reach@peko.one">reach@peko.one</a>.
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
                                    <br>
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
                                      src=${""}
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