/* eslint-disable no-irregular-whitespace */
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer } = require('./sharedLayout');

exports.generateCancellationMail = ({ serviceName, corporateName, cancelledDate, endDate, failureReason = undefined, templateDetails }) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your ${serviceName} Subscription Has Been Cancelled</title>
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
        .detail-label { font-size: 15px; color: #000000; font-weight: 700; }
        .detail-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Your ${serviceName} Subscription Has Been Cancelled" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your ${serviceName} Subscription Has Been Cancelled</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${corporateName},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We're sorry to see you go! Your subscription for ${serviceName} has been successfully cancelled as per your request.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:12px;">
                                  <div class="content-text" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;">Subscription Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">Service:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:8px;">${serviceName}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;${failureReason ? 'padding-bottom:8px;' : ''}">Cancellation Date:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;${failureReason ? 'padding-bottom:8px;' : ''}">${cancelledDate}</td>
                                      </tr>
                                      ${failureReason ? `<tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Failure Reason:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">${failureReason}</td>
                                      </tr>` : ''}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">You will continue to have access to ${serviceName} until ${endDate}. After this date, you will no longer have access to this service.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">If you ever decide to return, we'd be happy to welcome you back! You can re-subscribe anytime through your ${branding} account.</div>
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
};


exports.generateRenewalFailedMail = ({ serviceName, corporateName, endDate }) => {
    return `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
	<title></title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		* { box-sizing: border-box; }
		body { margin: 0; padding: 0; }
		a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
		#MessageViewBody a { color: inherit; text-decoration: none; }
		p { line-height: inherit }
		@media (max-width:500px) {
			.row-content { width: 100% !important; }
			.stack .column { width: 100%; display: block; }
		}
	</style>
</head>

<body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 15px; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center" style="line-height:10px">
																	<div style="max-width: 115.2px;"><img src="https://d15k2d11r6t6rl.cloudfront.net/pub/bfra/rg8zwxuw/15z/ydg/o3z/unnamed-6.png" style="display: block; height: auto; border: 0; width: 100%;" width="115.2" alt title height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
													<table class="heading_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0;">Your ${serviceName} Subscription Renewal Failed</h1>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad">
																<div style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;">
																	<p style="margin: 0; margin-bottom: 16px;">Dear ${corporateName},</p>
																	<p style="margin: 0; margin-bottom: 16px;">We were unable to process the automatic renewal payment for your ${serviceName} subscription.</p>
																	<p style="margin: 0;"><strong>Renewal Details:</strong></p>
																</div>
															</td>
														</tr>
													</table>
													<table class="list_block block-4" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word; color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left;">
														<tr>
															<td class="pad">
																<div style="margin-left:-20px">
																	<ul style="margin-top: 0; margin-bottom: 0; list-style-type: revert;">
																		<li style="Margin: 0 0 0 0;">Service: ${serviceName}</li>
																		<li style="Margin: 0 0 0 0;">Access valid until: ${endDate}</li>
																	</ul>
																</div>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-5" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad">
																<div style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;">
																	<p style="margin: 0; margin-bottom: 16px;">You can continue to access ${serviceName} until <strong>${endDate}</strong>. After this date, your subscription will expire.</p>
																	<p style="margin: 0; margin-bottom: 16px;">To ensure uninterrupted access, please re-subscribe through your Peko account before ${endDate}.</p>
																	<p style="margin: 0; margin-bottom: 16px;">If you have any queries or need assistance, please call us at 022 489 30373 or write to us at <a href="mailto:reach@peko.one" style="text-decoration: underline;">reach@peko.one</a>.</p>
																	<p style="margin: 0;">Best Regards,<br>Team Peko</p>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
										<tbody>
											<tr>
												<td style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top;" width="100%">
													<table border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td style="text-align:center;width:100%;">
																<p style="margin: 0; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-align: center;">© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
																<p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; text-align: center;">
																	<a href="https://peko.one/in/privacy-policy/" style="text-decoration: underline; color: #000000;">Privacy Policy</a> |
																	<a href="https://peko.one/in/cookie-policy/" style="text-decoration: underline; color: #000000;">Cookie Policy</a> |
																	<a href="https://peko.one/in/platform-agreement" style="text-decoration: underline; color: #000000;">Terms of Use</a> |
																	<a href="https://peko.one/in/refund-policy" style="text-decoration: underline; color: #000000;">Refund &amp; Cancellation Policy</a>
																</p>
																<p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; text-align: center;"><a href="https://peko.one/in" style="text-decoration: underline; color: #000000;">www.peko.one</a></p>
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
	</table>
</body>

</html>
    `
}