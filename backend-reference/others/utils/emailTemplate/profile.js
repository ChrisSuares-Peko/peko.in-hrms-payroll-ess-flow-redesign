const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, buildOtpBoxesHtml, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

exports.commonEmailOtpVerification = ({ username, otp, logo }) => {
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

			.row-2 .column-1 .block-1.paragraph_block td.pad>div {
				font-size: 14px !important;
			}

			.row-1 .column-1 .block-1.heading_block h1 {
				font-size: 25px !important;
			}

			.row-3 .column-1 .block-1.heading_block td.pad {
				padding: 0 !important;
			}

			.row-3 .column-1 .block-1.heading_block h1 {
				font-size: 17px !important;
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
																	Verify your account!</h1>
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
																	style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0; margin-bottom: 16px;">Dear ${username},</p>
																	<p style="margin: 0; margin-bottom: 16px;">Please use the OTP given below to complete
																		the account verification process.</p>
																	<p style="margin: 0;">This OTP is valid for 2 minutes only.</p>
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
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
						<tbody>
							<tr>
								<td>
									<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack"
										role="presentation"
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 1px; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 19.2px;">
																	Your one-time password (OTP)</h1>
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
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f0f2f6; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 38px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 45.6px;">
																	<strong> ${otp}
																	</strong>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 40px; padding-top: 35px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1"
														role="presentation"
														style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
														<tr>
															<td class="pad">
																<div
																	style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0; margin-bottom: 17px;">Your OTP is confidential. Please do not
																		share it with anyone.</p>
																	<p style="margin: 0; margin-bottom: 17px;">Thank you for using Peko.<br />If you have
																		any queries or need further assistance, please reach out to us at <a
																			href="mailto:reach@peko.one" rel="noopener"
																			style="text-decoration: underline; color: #000000;"
																			target="_blank">reach@peko.one</a>. We are here to assist you in any way we can.
																	</p>
																	<p style="margin: 0; margin-bottom: 17px;">Best Regards,</p>
																	<p style="margin: 0;">Team Peko</p>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation"
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
														<tr>
															<td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
																<div align="center" class="alignment" style="line-height:10px">
																	<div style="max-width: 144px;"> <img class="adapt-img"
																			src="${logo}"
																			alt style="
                                        display: block;
                                        border: 0;
                                        outline: none;
                                        text-decoration: none;
                                        -ms-interpolation-mode: bicubic;
                                      " width="136" height="55" /></div>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation"
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
      Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</span>
																</h1>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 14.399999999999999px;">
																	<a href="https://peko.one/in/privacy-policy/" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Privacy
																		Policy</a> | <a href="https://peko.one/in/cookie-policy/" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Cookie
																		Policy</a> | <a href="https://peko.one/in/platform-agreement" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Terms of
																		Use</a> | <a href="https://peko.one/in/refund-policy" rel="noopener"
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
};

//Password reset has been successful
// key: PROFILE_RESET_PASSWORD_SUCCESS (service: PROFILE)
// The account-number clause is omitted for CORPORATE_SUB_USER accounts (they don't
// have their own account number) - kept as a helper so the resolver call site can
// build the identical value for its ${accountNumberClause} variable. '&nbsp;' rather
// than '' for the omitted case: an empty-string variable makes the resolver treat the
// whole template as unresolvable and fall back to this very function.
exports.buildAccountNumberClause = (userData, branding) =>
  userData.role === 'CORPORATE_SUB_USER'
    ? '&nbsp;'
    : `(${branding} account number: ${userData.username})`;

exports.resetPasswordSuccessTemplate = (userData, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  const accountNumberClause = exports.buildAccountNumberClause(userData, branding);
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your password has been changed successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Your password has been changed successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Your password has been changed successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${userData.name},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">We are pleased to confirm that the password for your account ID ${userData.name} ${accountNumberClause} has been changed successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


// key: BANK_ACCOUNT_ADDED_SUCCESS (service: PROFILE)
exports.bankAccountAddedSuccessTemplate = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Bank account added successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Bank account added successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Bank account added successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are pleased to inform you that your bank account has been added successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


// key: BANK_ACCOUNT_UPDATE_SUCCESS (service: PROFILE)
exports.bankAccountUpdateSuccessTemplate = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Bank account updated successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Bank account updated successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Bank account updated successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are pleased to inform you that your bank account details has been updated successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


// key: BANK_ACCOUNT_DELETED_SUCCESS (service: PROFILE)
// No success badge - matches the Figma design (338:1386), unlike Added/Updated above.
exports.bankAccountDeletedSuccessTemplate = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Bank account deleted successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Bank account deleted successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Bank account deleted successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are writing to confirm that your bank account has been deleted.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// key: PROFILE_UPDATE_SUCCESS (service: PROFILE)
exports.updateProfileSuccessful = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your profile updated successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Your profile updated successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Your profile updated successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are pleased to inform you that your profile has been updated successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// key: PROFILE_UPDATE_OTP (service: PROFILE)
// Sentence is merged ("...update your profile. This OTP is valid for 2 minutes
// only.") and there's no "Your one-time password (OTP)" label line before the boxes
// - confirmed distinct from both BANK_ACCOUNT_VERIFICATION_OTP and
// ADDRESS_VERIFICATION_OTP below, which each differ in one of these two respects.
exports.updateProfileDetailsOTP = (username, otp, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Verify your account!</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Verify your account!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Verify your account!</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Please use the OTP given below to complete the account verification process, after which you can update your profile. This OTP is valid for 2 minutes only.</p>
            ${buildOtpBoxesHtml(otp)}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Your OTP is confidential. Please do not share it with anyone.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


// key: ADDRESS_DELETED_SUCCESS (service: PROFILE)
exports.addressDeletedSuccessTemplate = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Address deleted successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Address deleted successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Address deleted successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are writing to confirm that your address has been deleted.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


// key: ADDRESS_ADDED_SUCCESS (service: PROFILE)
exports.addressAddedSuccessTemplate = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Address added successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Address added successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Address added successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are pleased to inform you that your address has been added successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// key: ADDRESS_UPDATE_SUCCESS (service: PROFILE)
exports.addressUpdateSuccessTemplate = (username, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Address updated successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Address updated successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Address updated successfully</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">We are pleased to inform you that your address details has been updated successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};
// key: BANK_ACCOUNT_VERIFICATION_OTP (service: PROFILE)
// Sentence is merged ("...your bank account. This OTP is valid for 2 minutes
// only.") AND there's a "Your one-time password (OTP)" label line before the boxes -
// confirmed distinct from PROFILE_UPDATE_OTP (no label line) and
// ADDRESS_VERIFICATION_OTP (split sentence, no label line) above/below.
exports.updateBankDetailsOTP = (username, otp, operation, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Verify your account!</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Verify your account!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Verify your account!</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Please use the OTP given below to complete the account verification process, after which you can ${operation} your bank account. This OTP is valid for 2 minutes only.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your one-time password (OTP)</p>
            ${buildOtpBoxesHtml(otp)}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Your OTP is confidential. Please do not share it with anyone.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};

// key: ADDRESS_VERIFICATION_OTP (service: PROFILE)
// Sentence is split ("...address details." / "This OTP is valid for 2 minutes
// only." as two separate paragraphs), with a "Your one-time password (OTP)"
// label line before the boxes - confirmed distinct from PROFILE_UPDATE_OTP
// (merged sentence, no label line) above.
exports.addressOTP = (username, otp, operation, templateDetails) => {
  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Verify your account!</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Verify your account!" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Verify your account!</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Dear ${username},</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Please use the OTP given below to complete the account verification process, after which you can ${operation} your address details.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">This OTP is valid for 2 minutes only.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Your one-time password (OTP)</p>
            ${buildOtpBoxesHtml(otp)}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Your OTP is confidential. Please do not share it with anyone.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Thank you for using ${branding}.</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};