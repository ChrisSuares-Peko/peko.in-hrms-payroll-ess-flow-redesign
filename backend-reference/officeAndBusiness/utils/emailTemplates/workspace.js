const { formatNumberWithLocalString } = require('../formatter')
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver')
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys')
const { normalisePartner } = require('./common')
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout')

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif"
const NOT_AVAILABLE = 'Not Available'

const formatDate = (dateString) => {
	const date = new Date(dateString)
	if (Number.isNaN(date.getTime())) return '-'
	return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTotal = (amount) => {
	const value = Number.parseFloat(amount)
	return Number.isFinite(value) ? `₹ ${value.toFixed(2)}` : '-'
}

const planPriceLabel = (planDetails) => {
	if (planDetails?.price === undefined || planDetails?.price === null || planDetails?.price === '') return NOT_AVAILABLE
	return `₹ ${formatNumberWithLocalString(planDetails.price)}/${planDetails?.billingCycle === 'MONTHLY' ? 'month' : 'yr'}`
}

const workspacePriceLabel = (bookDetails) =>
	bookDetails?.monthlyPrice ? `₹ ${formatNumberWithLocalString(bookDetails.monthlyPrice)}/month` : NOT_AVAILABLE

const detailRow = (label, value, last = false) => {
	const pad = last ? '' : 'padding-bottom:12px;'
	return `<tr>
                                        <td width="180" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:#000000;${pad}">${label}</td>
                                        <td valign="top" style="font-family:${FONT};font-size:15px;color:#000000;${pad}">${value}</td>
                                      </tr>`
}

// Booking + plan rows as one table so the admin template only needs ${orderDetailsHtml}.
const buildOrderDetailsHtml = ({ transactionId, amount, planDetails, bookDetails }) => {
	const rows = [
		detailRow('Transaction ID:', transactionId || '-'),
		detailRow('Total price:', formatTotal(amount)),
		detailRow('Plan:', planDetails?.name || '-'),
		detailRow('Plan price:', planPriceLabel(planDetails)),
		detailRow('Plan details:', planDetails?.description || '-'),
		detailRow('Workspace name:', bookDetails?.name ?? NOT_AVAILABLE),
		detailRow('Workspace price:', workspacePriceLabel(bookDetails)),
		detailRow('Workspace address:', bookDetails?.address ?? NOT_AVAILABLE, true),
	]
	return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      ${rows.join('\n                                      ')}
                                    </tbody>
                                  </table>`
}

const paragraph = (html, paddingBottom = 20) =>
	`<tr>
                                <td align="left" style="font-size:0px;padding-bottom:${paddingBottom}px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>
                                </td>
                              </tr>`

const heading = (text) =>
	`<tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>
                                </td>
                              </tr>`

const v2Document = ({ title, partner, bodyRows }) => {
	const { branding, website, logo, socials } = partner
	const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding })
	const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding })
	return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${title}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${title}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              ${bodyRows}
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

${footer}

      </div>
    </body>
  </html>`
}

// key: WORKSPACE_BOOKING_SUCCESS (service: WORKSPACES)
exports.generatePaymentSuccessEmailWorkspaces = (name, transactionId, amount, orderResponse, partnerDetails) => {
	const partner = normalisePartner(partnerDetails)
	const orderDetailsHtml = buildOrderDetailsHtml({
		transactionId,
		amount,
		planDetails: orderResponse?.planDetails,
		bookDetails: orderResponse?.bookingDetails,
	})
	const bodyRows = `<tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2SuccessBadge()}
                                </td>
                              </tr>
                              ${heading('Booking Successful')}
                              ${paragraph(`Dear ${name},`)}
                              ${paragraph('We are pleased to inform you that your workspace has been booked successfully. Below, please find the details.', 24)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${FONT};font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Booking Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  ${orderDetailsHtml}
                                </td>
                              </tr>
                              ${paragraph(`Thank you for using ${partner.branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.`, 16)}
                              ${paragraph(`Best Regards,<br>Team ${partner.branding}`, 0)}`
	return v2Document({ title: 'Booking Successful', partner, bodyRows })
}

// key: WORKSPACE_RENEWAL_REMINDER (service: WORKSPACES)
exports.workspaceReminder = (url, expireDate, name = 'user', partnerDetails) => {
	const partner = normalisePartner(partnerDetails)
	const bodyRows = `${heading('Reminder: Workspace service renewal')}
                              ${paragraph(`Dear ${name},`)}
                              ${paragraph(`This is a friendly reminder for the monthly renewal of the workspace service provided by us. Your current service expires on ${formatDate(expireDate)}. Kindly renew the service in time to ensure uninterrupted access to the workspace.`, 24)}
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <a href="${url}" target="_blank" style="display:inline-block;background-color:#000000;color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;text-decoration:none;padding:16px 32px;border-radius:10px;">Visit Office Address</a>
                                </td>
                              </tr>
                              ${paragraph(`Thank you for using ${partner.branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.`, 16)}
                              ${paragraph(`Best Regards,<br>Team ${partner.branding}`, 0)}`
	return v2Document({ title: 'Reminder: Workspace service renewal', partner, bodyRows })
}

exports.resolveWorkspaceBookingSuccessEmail = (name, transactionId, amount, orderResponse, partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
	const partner = normalisePartner(partnerDetails)
	const planDetails = orderResponse?.planDetails
	const variables = {
		name: name || 'user',
		transactionId: transactionId || '-',
		amount: formatTotal(amount),
		planName: planDetails?.name || '-',
		orderDetailsHtml: buildOrderDetailsHtml({ transactionId, amount, planDetails, bookDetails: orderResponse?.bookingDetails }),
		branding: partner.branding,
		website: partner.website,
		...v2LayoutVariables(partner),
	}
	return resolveEmailTemplate({
		key: EMAIL_TEMPLATE_KEYS.WORKSPACE_BOOKING_SUCCESS,
		service: EMAIL_TEMPLATE_SERVICES.WORKSPACES,
		variables,
		fallbackSubject: 'Booking Successful',
		fallback: () => exports.generatePaymentSuccessEmailWorkspaces(name, transactionId, amount, orderResponse, partnerDetails),
		partnerId,
		logTraceId,
	})
}

exports.resolveWorkspaceReminderEmail = (url, expireDate, name = 'user', partnerDetails, { partnerId = null, logTraceId = null } = {}) => {
	const partner = normalisePartner(partnerDetails)
	const variables = {
		name: name || 'user',
		url: url || partner.website,
		expiryDate: formatDate(expireDate),
		branding: partner.branding,
		website: partner.website,
		...v2LayoutVariables(partner),
	}
	return resolveEmailTemplate({
		key: EMAIL_TEMPLATE_KEYS.WORKSPACE_RENEWAL_REMINDER,
		service: EMAIL_TEMPLATE_SERVICES.WORKSPACES,
		variables,
		fallbackSubject: 'Reminder: Renew your workspace service',
		fallback: () => exports.workspaceReminder(url, expireDate, name, partnerDetails),
		partnerId,
		logTraceId,
	})
}
