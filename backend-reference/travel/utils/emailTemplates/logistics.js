const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require("../emailTemplate/sharedLayout");

exports.generatePaymentSuccessEmailLogistics = ({
	name,
	transactionId,
	sender,
	receiver,
	trackingNo,
	amount,
	templateDetails
}) => {
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

			.row-15 .column-1 .block-2.paragraph_block td.pad>div,
			.row-2 .column-1 .block-1.paragraph_block td.pad>div,
			.row-2 .column-1 .block-2.paragraph_block td.pad>div {
				font-size: 14px !important;
			}

			.row-1 .column-1 .block-1.heading_block h1 {
				font-size: 18px !important;
			}

			.row-10 .column-1 .block-1.heading_block td.pad,
			.row-10 .column-1 .block-2.heading_block td.pad,
			.row-10 .column-2 .block-1.heading_block td.pad,
			.row-10 .column-2 .block-2.heading_block td.pad,
			.row-10 .column-3 .block-1.heading_block td.pad,
			.row-10 .column-3 .block-2.heading_block td.pad,
			.row-11 .column-1 .block-1.divider_block td.pad,
			.row-12 .column-1 .block-1.heading_block td.pad,
			.row-12 .column-2 .block-1.heading_block td.pad,
			.row-13 .column-1 .block-1.divider_block td.pad,
			.row-14 .column-1 .block-1.heading_block td.pad,
			.row-14 .column-2 .block-1.heading_block td.pad,
			.row-3 .column-1 .block-1.heading_block td.pad,
			.row-4 .column-1 .block-1.heading_block td.pad,
			.row-5 .column-1 .block-1.heading_block td.pad,
			.row-6 .column-1 .block-1.heading_block td.pad,
			.row-7 .column-1 .block-1.heading_block td.pad,
			.row-8 .column-1 .block-1.heading_block td.pad {
				padding: 0 !important;
			}

			.row-10 .column-1 .block-1.heading_block h1,
			.row-10 .column-1 .block-2.heading_block h1,
			.row-10 .column-2 .block-1.heading_block h1,
			.row-10 .column-2 .block-2.heading_block h1,
			.row-10 .column-3 .block-1.heading_block h1,
			.row-10 .column-3 .block-2.heading_block h1,
			.row-12 .column-2 .block-1.heading_block h1 {
				text-align: left !important;
			}

			.row-11 .column-1 .block-1.divider_block .alignment table,
			.row-13 .column-1 .block-1.divider_block .alignment table {
				display: inline-table;
			}

			.row-12 .column-1 .block-1.heading_block h1,
			.row-14 .column-1 .block-1.heading_block h1 {
				text-align: left !important;
				font-size: 14px !important;
			}

			.row-14 .column-2 .block-1.heading_block h1 {
				text-align: left !important;
				font-size: 16px !important;
			}

			.row-3 .column-1 {
				padding: 20px 0 5px !important;
			}

			.row-4 .column-1,
			.row-5 .column-1,
			.row-6 .column-1,
			.row-7 .column-1,
			.row-8 .column-1 {
				padding: 0 0 5px !important;
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
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 26px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 31.2px;">
																	Shipment booked successfully</h1>
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1"
														role="presentation"
														style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
														<tr>
															<td class="pad">
																<div
																	style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
																	<p style="margin: 0; margin-bottom: 16px;"><br />We are pleased to inform you that
																		your shipment has been booked successfully. To view your order status or make any
																		changes, please visit the Logistics section on ${templateDetails.branding}.</p>
																	<p style="margin: 0;"></p>
																</div>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2"
														role="presentation"
														style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
														<tr>
															<td class="pad">
																<div
																	style="color:#484848;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0;"><strong>Order Detail</strong></p>
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
										style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
										width="480">
										<tbody>
											<tr>
												<td class="column column-1"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Transaction ID:</strong>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	${transactionId}</h1>
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
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Placed on:</strong>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	${new Date().toLocaleString()}</h1>
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
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Service:</strong>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	Shipment Services</h1>
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
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Tracking no:</strong>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	${trackingNo}</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation"
						style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Amount paid:</strong>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-radius: 0px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad" style="text-align:center;width:100%;">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	INR ${(Number(amount)).toFixed(2)}</h1>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<div align="center" class="alignment">
																	<table border="0" cellpadding="0" cellspacing="0" role="presentation"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
																		<tr>
																			<td class="divider_inner"
																				style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span
																					style="word-break: break-word;"></span></td>
																		</tr>
																	</table>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-10" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="25%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Sender</strong>
																</h1>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-2"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	${sender.Line1}

																	${sender.Line2}

																	${sender.Line3}</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="50%">
													<table border="0" cellpadding="5" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<strong>Receiver</strong>
																</h1>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-2"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	${receiver.name}

																	${receiver.Line1}

																	${receiver.Line3}
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-3"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="25%">
													<table border="0" cellpadding="5" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">Price</span>
																</h1>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-2"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">INR
																		${(Number(amount)).toFixed(2)}</span>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-11" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<div align="center" class="alignment">
																	<table border="0" cellpadding="0" cellspacing="0" role="presentation"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
																		<tr>
																			<td class="divider_inner"
																				style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span
																					style="word-break: break-word;"></span></td>
																		</tr>
																	</table>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-12" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="66.66666666666667%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: right; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 19.2px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">Subtotal :</span>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="33.333333333333336%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: right; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 19.2px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">INR ${(Number(amount)).toFixed(2)}</span>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-13" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<div align="center" class="alignment">
																	<table border="0" cellpadding="0" cellspacing="0" role="presentation"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
																		<tr>
																			<td class="divider_inner"
																				style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span
																					style="word-break: break-word;"></span></td>
																		</tr>
																	</table>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-14" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="66.66666666666667%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: right; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 19.2px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">Order Total:</span>
																</h1>
															</td>
														</tr>
													</table>
												</td>
												<td class="column column-2"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="33.333333333333336%">
													<table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<h1
																	style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 19px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: right; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 22.8px;">
																	<span class="tinyMce-placeholder" style="word-break: break-word;">INR ${(Number(amount)).toFixed(2)}</span>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-15" role="presentation"
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
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
													width="100%">
													<table border="0" cellpadding="10" cellspacing="0" class="button_block block-1"
														role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
														<tr>
															<td class="pad">
																<div align="center" class="alignment"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://uae.peko.one/" style="height:42px;width:184px;v-text-anchor:middle;" arcsize="10%" stroke="false" fillcolor="#ff4f4f">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px">
<![endif]--><a href="${templateDetails?.baseUrl}/logistics/order-history/track?trackingNo=${trackingNo}"
																		style="background-color:#ff4f4f;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:4px;border-right:0px solid transparent;border-top:0px solid transparent;color:#ffffff;display:inline-block;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:auto;word-break:keep-all;"
																		target="_blank"><span
																			style="word-break: break-word; padding-left: 20px; padding-right: 20px; font-size: 16px; display: inline-block; letter-spacing: normal;"><span
																				style="word-break: break-word; line-height: 32px;">Track
																				your shipment</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
																</div>
															</td>
														</tr>
													</table>
													<table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2"
														role="presentation"
														style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
														<tr>
															<td class="pad">
																<div
																	style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
																	<p style="margin: 0; margin-bottom: 16px;">Thank you for using ${templateDetails.branding}.<br /><br />If you
																		have any queries or need further assistance, please reach out to us at<a
																			href="mailto:reach@peko.one" rel="noopener"
																			style="text-decoration: underline; color: #000000;"
																			target="_blank"> reach@peko.one.</a> We assure you of our best services at all
																		times.</p>
																	<p style="margin: 0; margin-bottom: 16px;"></p>
																	<p style="margin: 0; margin-bottom: 16px;">Best Regards, ${templateDetails.branding}</p>
																	<p style="margin: 0;"></p>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-16" role="presentation"
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
																	<div style="max-width: 144px;"><img alt="" height="auto"
																			src="${templateDetails?.logo}"
																			style="display: block; height: auto; border: 0; width: 100%;" title=""
																			width="144" /></div>
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
					<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-17" role="presentation"
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
																	<a bis_size='{"x":453,"y":356,"w":74,"h":13,"abs_x":453,"abs_y":418}'
																		href="https://peko.one/in/privacy-policy" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Privacy
																		Policy</a> | <a bis_size='{"x":538,"y":356,"w":72,"h":13,"abs_x":538,"abs_y":418}'
																		href="https://peko.one/in/cookie-policy" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Cookie
																		Policy</a> | <a bis_size='{"x":623,"y":356,"w":70,"h":13,"abs_x":623,"abs_y":418}'
																		href="https://peko.one/in/platform-agreement" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Terms of
																		Use</a> | <a bis_size='{"x":707,"y":356,"w":154,"h":13,"abs_x":707,"abs_y":418}'
																		href="https://peko.one/in/refund-policy" rel="noopener"
																		style="text-decoration: underline; color: #000000;" target="_blank">Refund &
																		Cancellation Policy</a><a
																		bis_size='{"x":862,"y":356,"w":0,"h":13,"abs_x":862,"abs_y":418}'
																		style="text-decoration: underline; color: #000000;"></a>
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

exports.generatePaymentSuccessEmailLogisticsV3 = ({
	name,
	corporateTxnId,
	from,
	to,
	sender,
	receiver,
	totalAmount,
	templateDetails
}
) => {
	const branding = templateDetails?.branding || 'Peko';
	const website = templateDetails?.website || 'https://www.peko.one';
	const websiteLabel = toWebsiteLabel(website);
	const logo = templateDetails?.logo;
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Shipment booked successfully</title>
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
          .peko-btn a { display:block !important; text-align:center !important; }
        }
      </style>
      <style type="text/css">
        .content-text { font-size: 16px; color: #000000; line-height: 1.6; }
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Shipment booked successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Shipment booked successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to inform you that your shipment has been booked successfully. To view your order status or make any changes, please visit the Logistics service on ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Order Detail</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Transaction ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${corporateTxnId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Placed on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${new Date().toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Service:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">Logistics</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Shipping details:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${from} to ${to}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Amount paid:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">INR ${totalAmount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Sender</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${sender?.name}<br>${sender?.addressLine}<br>${sender?.city},${sender?.countryName}<br>${sender?.postCode}<br>${sender?.mobile}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Receiver</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${receiver?.name}<br>${receiver?.addressLine}<br>${receiver?.city},${receiver?.countryName}<br>${receiver?.postCode}<br>${receiver?.mobile}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Subtotal:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">INR ${totalAmount}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Order Total:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">INR ${totalAmount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="peko-btn" style="padding-bottom:28px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#ff4f4f" role="presentation" style="border:none;border-radius:12px;cursor:auto;mso-padding-alt:16px 32px;background:#ff4f4f;" valign="middle">
                                          <a href="${templateDetails?.baseUrl}/logistics/order-history/track-order-details?trackingNo=${corporateTxnId}" style="display:inline-block;background:#ff4f4f;color:#ffffff;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:100%;margin:0;text-decoration:none;text-transform:none;padding:16px 32px;mso-padding-alt:0px;border-radius:12px;" target="_blank">Track your shipment</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}.<br><br>If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>${branding}</div>
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
}

exports.generatePaymentSuccessEmailReturnLogisticsV3 = ({
	name,
	corporateTxnId,
	deliveredTxnId,
	templateDetails,
	requestedOn
}
) => {
	const branding = templateDetails?.branding || 'Peko';
	const website = templateDetails?.website || 'https://www.peko.one';
	const websiteLabel = toWebsiteLabel(website);
	const logo = templateDetails?.logo;
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Return shipment booked successfully</title>
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
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Return shipment booked successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Return shipment booked successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We would like to inform you that the return for Order ID: ${deliveredTxnId} has been initiated. You can review and track the return by visiting the logistics service on ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Return Request Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Transaction ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${corporateTxnId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Requested on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${requestedOn}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Service:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">Logistics</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}.<br><br>If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>${branding}</div>
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
}

exports.generateReturnCompletionSuccessEmailLogisticsV3 = ({
	name,
	corporateTxnId,
	templateDetails,
	requestedOn,
	completionDate,
	returnTransactionId
}
) => {
	const branding = templateDetails?.branding || 'Peko';
	const website = templateDetails?.website || 'https://www.peko.one';
	const websiteLabel = toWebsiteLabel(website);
	const logo = templateDetails?.logo;
	const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Return request completed successfully</title>
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
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Return request completed successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;word-break:break-word;">
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Return request completed successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We would like to inform you that the return for Order ID: ${corporateTxnId} has been completed.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Return Request Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Transaction ID:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${returnTransactionId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Requested on:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${requestedOn}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Service:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">Logistics</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Completion Date:</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${completionDate}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}.<br><br>If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We remain committed to providing you with the best service at all times.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br>${branding}</div>
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
}

exports.shipmentStatus = (name, transactionId, group, from, to, trackingNo, amount, sender, receiver, quantity, serviceType, host, status, templateDetails) => {
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
    <title>Copy of (2) Office Supplies Confirmed</title>
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
    <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F8FEF5">
      <!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f8fef5"></v:fill> </v:background><![endif]-->
      <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F8FEF5">
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
                                      src="https://gxphmw.stripocdn.email/content/guids/CABINET_a4273359ab75059eb2c97dd5eaf1deb34a4ea63f62d13fa4552b12578e043b4d/images/folksexpressdeliveryservice.png"
                                      alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                      width="150" height="171"></td>
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
                                      style="Margin:0;line-height:25px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:21px;font-style:normal;font-weight:bold;color:#333333;text-align:left">
                                      Shipment status update</h1>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="left" class="es-m-txt-c"
                                    style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                      Dear ${name},&nbsp; <br>
                                      We are pleased to inform you that your shipment has been ${status} and is on its way to you.</p>
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
                                  <td align="left" style="padding:0;Margin:0">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:27px;color:#0c0b0b;font-size:18px">
                                      <strong>Order Details</strong>
                                    </p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#0c0b0b;font-size:15px">
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
                        style="Margin:0;padding-bottom:5px;padding-top:10px;padding-left:40px;padding-right:40px">
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
                      <td align="left"
                        style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
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
                                      Service:</p>
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
                                      Shipment Services</p>
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
                        style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
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
                                      Shipping details:</p>
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
                                      ${group} Parcel, ${from} to ${to}</p>
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
                        style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
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
                                      Tracking no:</p>
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
                                      ${trackingNo}</p>
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
                        style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
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
                                      Amount paid:</p>
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
                                      ${amount} AED</p>
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
                        style="Margin:0;padding-top:30px;padding-bottom:40px;padding-left:40px;padding-right:40px">
                        <table cellpadding="0" cellspacing="0" width="100%" role="none"
                          style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                          <tr style="border-collapse:collapse">
                            <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                              <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0"> <!--[if mso]><a href="" target="_blank" hidden> <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="" style="height:45px; v-text-anchor:middle; width:236px" arcsize="13%" stroke="f" fillcolor="#ff4f4f"> <w:anchorlock></w:anchorlock> <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:13px; font-weight:700; line-height:13px; mso-text-raise:1px'>Track your shipment</center> </v:roundrect></a>
    <![endif]--> <!--[if !mso]><!-- --><span class="msohide es-button-border"
                                      style="border-style:solid;border-color:#26A4D3;background:#ff4f4f;border-width:0px;display:inline-block;border-radius:6px;width:auto;mso-hide:all"><a
                                        href="${host}/logistics/order-history/track?trackingNo=${trackingNo}" class="es-button" target="_blank"
                                        style="mso-style-priority:100 !important;text-decoration:none;transition:all 100ms ease-in;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:13px;display:inline-block;background:#ff4f4f;border-radius:6px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:16px;width:auto;text-align:center;padding:15px 45px;mso-padding-alt:0;mso-border-alt:10px solid #ff4f4f">Track
                                        your shipment</a> </span> <!--<![endif]--></td>
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
                                      <strong>Sender</strong></p>
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
                                            <strong>&nbsp; &nbsp; &nbsp;Receiver</strong></p>
                                        </td>
                                        <td style="padding:0;Margin:0;text-align:center;font-size:13px;line-height:15px"
                                          width="15%">
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
                                            <strong>&nbsp; &nbsp;&nbsp;Qty</strong></p>
                                        </td>
                                        <td style="padding:0;Margin:0;text-align:center;font-size:13px;line-height:15px"
                                          width="30%">
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#080707;font-size:15px">
                                            <strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Price</strong></p>
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
                      <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-left:40px;padding-right:40px">
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
                                  <td align="left" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px">
                                    <table
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%"
                                      class="cke_show_border" cellspacing="1" cellpadding="1" border="0"
                                      role="presentation">
                                      <tr style="border-collapse:collapse">
                                        <td style="padding:0;Margin:0"><strong class="p_name"></strong>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${sender.name}</p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${sender.addressLine1}</p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${sender.addressLine2}</p><strong class="p_name"></strong>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table> <!--[if mso]></td><td style="width:20px"></td>
                                <td style="width:352px" valign="top"><![endif]-->
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
                                        <td style="padding:0;Margin:0"><strong class="p_name"></strong>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${receiver.name}</p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${receiver.addressLine1}</p>
                                          <p
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${receiver.addressLine2}</p><strong class="p_name"></strong>
                                        </td>
                                        <td style="padding:0;Margin:0;text-align:center" width="15%">
                                          <p class="p_quantity"
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${quantity}</p>
                                        </td>
                                        <td style="padding:0;Margin:0;text-align:center" width="30%">
                                          <p class="p_price"
                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">
                                            ${amount} AED</p>
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
                                  <td align="center" class="es-m-txt-c"
                                    style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#09090a;font-size:14px">
                                      Thank you for using ${templateDetails.branding}.
                                      <br><br>
                                      If you have any queries or need further assistance, please reach out to us at<a href="mailto:reach@peko.one" target="_blank">reach@peko.one.</a> We assure you of our best services at all times.</p>
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#09090a;font-size:14px">
                                      &nbsp;</p>
                                    <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Best Regards</p>
                                <p
                                  style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#131413;font-size:15px">
                                  Team ${templateDetails.branding}</p>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank"
                                      href="https://peko.one"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                        class="adapt-img"
                                        src=${templateDetails.logo}
                                        alt
                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                        height="35"></a></td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                      This email was sent to you from company email address</p>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-bottom:10px">
                                    <p
                                      style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                      <a href="https://peko.one/ae/privacy-policy//"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy
                                        Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/ae/cookie-policy/"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie
                                        Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/ae/platform-agreement/"
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms
                                        of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                        href="https://peko.one/ae/refund-policy/"
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
                                      © 2024-${new Date().getFullYear()} Peko Platforms Private Limited, All Rights Reserved</p>
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
                                      <a href="https://peko.one"
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
                                        <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                            target="_blank" href="https://x.com/PekoIndia"
                                            style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                              title="Twitter"
                                              src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                              alt="Tw" width="24" height="24"
                                              style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a>
                                        </td>
                                        <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a
                                            target="_blank" href="https://www.instagram.com/peko.india"
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
  
  </html>`
}

exports.generateShipmentCancelAdminInformEmailLogisticsV3 = ({ orderId, requestedOn }) => {
  const branding = 'Peko';
  const website = 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const socials = socialIconCells(undefined, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order Cancellation - Refund Required</title>
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
        .section-heading { font-size: 20px; color: #000000; font-weight: 700; }
        .order-label { font-size: 15px; color: #000000; font-weight: 700; }
        .order-value { font-size: 15px; color: #000000; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order Cancellation - Refund Required" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel, logo: undefined, branding })}
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order Cancellation</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear Admin,</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">We would like to inform you that <strong>Order ID: ${orderId}</strong> has been cancelled. Please review the order and initiate the refund.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;"><strong>Please go to the Admin Portal &gt; Accounts &gt; Refund Transactions</strong></div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="section-heading" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:32px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Order ID</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${orderId}</td>
                                      </tr>
                                      <tr>
                                        <td class="order-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Requested On</td>
                                        <td class="order-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${requestedOn}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Best Regards,<br><strong>Team ${branding}</strong></div>
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