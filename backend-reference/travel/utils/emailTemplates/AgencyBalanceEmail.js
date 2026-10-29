exports.BalanceEmailTemplate = (walletData, partnerDetails) => {
    return `<!DOCTYPE html>
    <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
    <head>
        <title></title>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <!--[if mso]><xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
                <o:AllowPNG/>
            </o:OfficeDocumentSettings>
        </xml><![endif]-->
        <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
            #MessageViewBody a { color: inherit; text-decoration: none; }
            p { line-height: inherit; }
            .desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
            .image_block img+div { display: none; }
            sup, sub { font-size: 75%; line-height: 0; }
            @media (max-width:500px) {
                .mobile_hide { display: none; }
                .row-content { width: 100% !important; }
                .stack .column { width: 100%; display: block; }
                .mobile_hide { min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0px; }
                .desktop_hide, .desktop_hide table { display: table !important; max-height: none !important; }
                .row-1 .column-1 .block-1.heading_block h1 { font-size: 25px !important; }
                .row-2 .column-1 .block-1.paragraph_block td.pad>div { font-size: 14px !important; }
            }
        </style>
        <!--[if mso]>
            <style>
                sup, sub { font-size: 100% !important; }
                sup { mso-text-raise:10% }
                sub { mso-text-raise:-10% }
            </style>
        <![endif]-->
    </head>
    <body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
            <tbody>
                <tr>
                    <td>
                        <!-- Row 1: Heading -->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
                            <tbody>
                                <tr>
                                    <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-top: 5px; padding-bottom: 5px; vertical-align: top;" width="100%">
                                                        <table border="0" cellpadding="25" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                            <tr>
                                                                <td class="pad">
                                                                    <h1 style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center;">
                                                                        <strong>Wallet Balance Notification</strong>
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
                        <!-- Row 2: Contact Form Details -->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                            <tbody>
                                <tr>
                                    <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 15px; padding-bottom: 25px; vertical-align: top;" width="100%">
                                                        <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                            <tr>
                                                                <td class="pad">
                                                                    <div style="color:#000000; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:400; line-height:120%; text-align:left;">
                                                                        <p style="margin: 0 0 16px 0;">Dear Team,</p>
                                                                        <p style="margin: 0 0 16px 0;">We would like to inform you about your current wallet balance with ${walletData.vendorName ?? "TBO"} vendor:</p>
                                                                        <ul style="margin: 0 0 16px 20px; padding: 0;">
                                                                            <li><strong>Cash Balance:</strong> ₹${walletData.CashBalance.toFixed(2)}</li>
                                                                          
                                                                        </ul>
                                                                        <p style="margin: 0 0 16px 0;">Please ensure your balance is sufficient for any upcoming transactions.</strong>
                                                                        <br><br>
                                                                           Best Regards, <br>
                                      Team ${partnerDetails?.branding}</p>
                                                                      
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
                      
                        <!-- Row 4: Footer (Changed to match setPasswordUrlTemplate footer) -->
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
                                                 <a target="_blank" href="https://peko.one"
                                                   style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                                   <img class="adapt-img" src="${partnerDetails?.logo}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="110" height="35">
                                                 </a>
                                               </td>
                                             </tr>
                                             <tr style="border-collapse:collapse">
                                               <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                                 </p>
                                               </td>
                                             </tr>
                                             <tr style="border-collapse:collapse">
                                               <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                                   <a href="https://peko.one/ae/privacy-policy/"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/ae/cookie-policy/"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/ae/platform-agreement"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                                     href="https://peko.one/ae/refund-policy"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href=""
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a>
                                                 </p>
                                               </td>
                                             </tr>
                                             <tr style="border-collapse:collapse">
                                               <td align="center" style="padding:0;Margin:0">
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                                   © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved
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
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                                   <br>
                                                 </p>
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
                                                   <a href="https://peko.one"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:12px"
                                                     target="_blank">www.peko.one</a>
                                                 </p>
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#ffffff;font-size:12px">
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
                                                     <td valign="top" align="center" style="padding:0;Margin:0;padding-right:20px">
                                                       <a target="_blank" href="https://x.com/PekoIndia"
                                                         style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                                         <img title="Twitter" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d" alt="Tw" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                       </a>
                                                     </td>
                                                     <td valign="top" align="center" style="padding:0;Margin:0;padding-right:20px">
                                                       <a target="_blank" href="https://www.instagram.com/peko.india"
                                                         style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                                         <img title="Instagram" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026" alt="Inst" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                       </a>
                                                     </td>
                                                     <td valign="top" align="center" style="padding:0;Margin:0">
                                                       <a target="_blank" href="https://www.linkedin.com/company/pekoindia/"
                                                         style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">
                                                         <img title="Linkedin" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd" alt="In" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
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
                 </td>
               </tr>
             </table>
           </td>
         </tr>
       </table>
    </div>
    </body>
    
    </html>`;
  }