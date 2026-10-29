exports.generateHikePurchaseSuccessEmail = (
  name,
  transactionId,
  amount,
  surcharge,
  selectedHikes,
  templateDetails
) => {
  let hikesUrl = "";
  if (process.env.NODE_ENV == "staging") {
    hikesUrl = "https://uatin.pekoapp.com/more-services/hike";
  } else {
    hikesUrl = "https://uae.peko.one/more-services/hike";
    console.log("🚀 ~ hikesUrl:", hikesUrl)
  }

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
                     <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                       <table cellpadding="0" cellspacing="0" width="100%" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                             <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="left" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                     src="https://gxphmw.stripocdn.email/content/guids/CABINET_9318e19bb2e04d1ad5295d27578bffd7480e5dcf04f567078f9eaf90922426b2/images/sammyordercompletedbyadeliverygirl_DpF.png"
                                     alt
                                     style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                     width="200" height="200"></td>
                               </tr>
                             </table>
                           </td>
                         </tr>
                       </table>
                     </td>
                   </tr>
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
                                     Hike purchased successfully</h1>
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
                                     We are pleased to inform you that your hikes 
                                     order has been placed successfully. To
                                     view your order,
                                     please visit the Hikes section on
                                     ${templateDetails?.branding}.</p>
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
                                         <span class="msohide es-button-border" style="
                                                       border-style: solid;
                                                       border-color: #26a4d3;
                                                       background: #181818;
                                                       border-width: 0px;
                                                       display: inline-block;
                                                       border-radius: 53px;
                                                       width: auto;
                                                       mso-hide: all;
                                                     "><a href="${templateDetails?.baseUrl}/more-services/hike"
                                             class="es-button es-button-1695643055948" target="_blank" style="
                                                         mso-style-priority: 100 !important;
                                                         text-decoration: none;
                                                         transition: all 100ms ease-in;
                                                         -webkit-text-size-adjust: none;
                                                         -ms-text-size-adjust: none;
                                                         mso-line-height-rule: exactly;
                                                         color: #ffffff;
                                                         font-size: 14px;
                                                         display: inline-block;
                                                         background: #181818;
                                                         border-radius: 53px;
                                                         font-family: arial, 'helvetica neue',
                                                           helvetica, sans-serif;
                                                         font-weight: bold;
                                                         font-style: normal;
                                                         line-height: 17px;
                                                         width: auto;
                                                         text-align: center;
                                                         padding: 15px 40px;
                                                         mso-padding-alt: 0;
                                                         mso-border-alt: 10px solid #181818;
                                                       ">Visit Hike</a>
                                         </span>
                                         <!--<![endif]-->
                                       </td>
                                     </tr>
                                   </table>
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
                                     ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }).replace(" am", " AM").replace(" pm", " PM")}</p>
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
                   <tr style="border-collapse:collapse">
                     <td align="left"
                       style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px;background-position:center center">
                       <!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:158px" valign="top"><![endif]-->
                       <table class="es-left" cellspacing="0" cellpadding="0" align="left" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                         <tr style="border-collapse:collapse">
                           <td class="es-m-p0r es-m-p20b" valign="top" align="center"
                             style="padding:0;Margin:0;width:158px">
                             <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr class="es-mobile-hidden" style="border-collapse:collapse">
                                 <td align="left" style="padding:0;Margin:0">
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#191818;font-size:15px">
                                     <strong>ITEM</strong>
                                   </p>
                                 </td>
                               </tr>
                             </table>
                           </td>
                         </tr>
                       </table>
                       <!--[if mso]></td><td style="width:20px"></td><td style="width:342px" valign="top"><![endif]-->
                       <table cellspacing="0" cellpadding="0" align="right" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="left" style="padding:0;Margin:0;width:342px">
                             <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="left" style="padding:0;Margin:0">
                                   <table
                                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%"
                                     class="cke_show_border" cellspacing="1" cellpadding="1" border="0"
                                     role="presentation">
                                     <tr style="border-collapse:collapse">
                                       <td style="padding:0;Margin:0;font-size:13px">
                                         <p
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
                                           <strong>&nbsp; &nbsp;
                                             &nbsp;NAME</strong>
                                         </p>
                                       </td>
                                       <td style="padding:0;Margin:0;text-align:center;font-size:13px;line-height:15px"
                                         width="15%">
                                         <p
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
                                           <strong>&nbsp;
                                             &nbsp;&nbsp;QTY</strong>
                                         </p>
                                       </td>
                                       <td
                                         style="padding-right:10px;Margin:0;text-align:center;font-size:13px;line-height:15px"
                                         width="30%">
                                         <p
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
                                           <strong>&nbsp; &nbsp; &nbsp; &nbsp;
                                             &nbsp;PRICE</strong>
                                         </p>
                                       </td>
                                     </tr>
                                   </table>
                                 </td>
                               </tr>
                             </table>
                           </td>
                         </tr>
                       </table> <!--[if mso]></td></tr></table><![endif]-->
                     </td>
                   </tr>
                   <tr style="border-collapse:collapse">
                     ${selectedHikes.length &&
    selectedHikes
      .map((hike) => {
        return `
                   <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:20px;padding-right:40px">
                       <table cellpadding="0" cellspacing="0" width="100%" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                             <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="center"
                                   style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;padding-left:20px;font-size:0px">
                                   <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                     role="presentation"
                                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                     <tr style="border-collapse:collapse">
                                       <td
                                         style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px">
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
                   <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-right:10px;padding-left:40px">
                       <!--[if mso]><table style="width:550px" cellpadding="0" cellspacing="0"><tr><td style="width:178px" valign="top"><![endif]-->
                       <table class="es-left" cellspacing="0" cellpadding="0" align="left" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                         <tr style="border-collapse:collapse">
                           <td class="es-m-p0r es-m-p20b" valign="top" align="center"
                             style="padding:0;Margin:0;width:178px">
                             <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="center" style="padding:0;Margin:0;font-size:0px">
                                   <img class="adapt-img"
                                     src="https://gxphmw.stripocdn.email/content/guids/CABINET_9318e19bb2e04d1ad5295d27578bffd7480e5dcf04f567078f9eaf90922426b2/images/5285281154_newproducticonhdpngdownload.png"
                                     alt
                                     style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                     width="100" height="105">
                                 </td>
                               </tr>
                             </table>
                           </td>
                         </tr>
                       </table>
                       <!--[if mso]></td><td style="width:20px"></td><td style="width:352px" valign="top"><![endif]-->
                       <table cellspacing="0" cellpadding="0" align="right" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="left" style="padding:0;Margin:0;width:352px">
                             <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px">
                                   <table
                                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%"
                                     class="cke_show_border" cellspacing="1" cellpadding="1" border="0"
                                     role="presentation">
                                     <tr style="border-collapse:collapse">
                                       <td style="padding:0;Margin:0">
                                         <p
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                           <strong class="p_name">${hike.hikeName}</strong>
                                         </p>
                                       </td>
                                       <td style="padding:0;Margin:0;text-align:center" width="15%">
                                         <p class="p_quantity"
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                           ${hike.quantity}</p>
                                       </td>
                                       <td style="padding:0;Margin:0;text-align:center" width="30%">
                                         <p class="p_price"
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ₹ ${hike.totalPrice}</p>
                                       </td>
                                     </tr>
                                   </table>
                                 </td>
                               </tr>
  
                             </table>
                           </td>
                         </tr>
                       </table>
                       <!--[if mso]></td></tr></table><![endif]-->
                     </td>
                   </tr>`;
      })
      .join("")
    }
  
                   <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                       <table cellpadding="0" cellspacing="0" width="100%" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                             <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="center"
                                   style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;padding-left:0;font-size:0px">
                                   <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                     role="presentation"
                                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                     <tr style="border-collapse:collapse">
                                       <td
                                         style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px">
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
                   <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
                       <table width="100%" cellspacing="0" cellpadding="0" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                             <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="right" class="es-m-txt-c" style="padding:0;Margin:0">
                                   <table
                                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:500px"
                                     class="cke_show_border" cellspacing="1" cellpadding="1" border="0" align="right"
                                     role="presentation">
                                     <tr style="border-collapse:collapse">
                                       <td style="padding:0;Margin:0;text-align:right;line-height:23px">
                                         <p
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                           Subtotal (${selectedHikes.length} ${selectedHikes.length > 1 ? "items" : "item"
    }):</p>
                                       </td>
                                       <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
                                         <p class="p_subtotal"
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                           ₹ ${Number(amount).toFixed(2)} </p>
                                       </td>
                                     </tr>
                                     <tr style="border-collapse:collapse">
                                     </tr>
                                     <tr style="border-collapse:collapse">
                                       <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
                                         <p
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                           Platform Fee:</p>
                                       </td>
                                       <td style="padding:0;Margin:0;text-align:right;font-size:18px;line-height:27px">
                                         <p class="p_tax"
                                           style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                           ₹ ${surcharge}</p>
                                       </td>
                                     </tr>
                                   </table>
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#38761d;font-size:15px">
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
                       <table cellpadding="0" cellspacing="0" width="100%" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                             <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="center"
                                   style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;font-size:0px">
                                   <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0"
                                     role="presentation"
                                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                     <tr style="border-collapse:collapse">
                                       <td
                                         style="padding:0;Margin:0;border-bottom:1px solid #cccccc;background:none;height:1px;width:100%;margin:0px">
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
                   <tr style="border-collapse:collapse">
                     <td align="left"
                       style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px;background-position:center top">
                       <table cellpadding="0" cellspacing="0" width="100%" role="none"
                         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr style="border-collapse:collapse">
                           <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                             <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                               style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                               <tr style="border-collapse:collapse">
                                 <td align="right" class="es-m-txt-r" style="padding:0;Margin:0;padding-left:20px">
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:33px;color:#414040;font-size:22px">
                                     <strong>Order Total:  ₹ <span class="p_order_total">${(
      Number(amount) + Number(surcharge)
    ).toFixed(2)}</span></strong>
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
                                     Thank you for using ${templateDetails?.branding}.
                                     If you have any queries or need further
                                     assistance, please reach out to us at
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
                         <tr style="border-collapse:collapse">
                           <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
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
                                     This email was sent to you from company email
                                     address</p>
                                 </td>
                               </tr>
                               <tr style="border-collapse:collapse">
                                 <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                   <p
                                     style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                     <a href="https://peko.one/in/privacy-policy"
                                       style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
                                       Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                       style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                       Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement"
                                       style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                       of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                       href="https://peko.one/in/refund-policy/"
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
