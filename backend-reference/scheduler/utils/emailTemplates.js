const moment = require('moment');
const { formatNumberWithLocalString } = require('./formatter');
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2RejectBadge } = require('./emailTemplate/sharedLayout');

// dead code removed: emailTempleteInvoiceRemainder duplicate (never called - real one lives in utils/email/emailTemplates/invoice.js)
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// nextBillingDate is the new subscription's actual computed end date (returned by
// createNewWhatsAppSubscription), not a re-derivation off the old row — the two can
// differ (monthly vs annually, leap days), so the caller passes the real value.
exports.generateSubscriptionSuccessEmail = (name, transactionId, subscription, partnerDetails, nextBillingDate) => {
  const { packageName, billingType, subscriptionPrice } = subscription;
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = partnerDetails?.logo;
  const socials = socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' });
  const formattedNextBillingDate = nextBillingDate ? moment(nextBillingDate).format('MMMM D, YYYY') : '';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Subscription renewed</title>
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
      <div aria-label="Subscription renewed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${v2Header({ website, websiteLabel, logo, branding })}
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
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">We are pleased to inform you that your ${packageName} subscription has been successfully renewed.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#000000;">Details of Your Renewal:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Service:</td>
                                        <td valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${packageName}</td>
                                      </tr>
                                      <tr>
                                        <td width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Duration:</td>
                                        <td valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${capitalizeFirstLetter(billingType)}</td>
                                      </tr>
                                      <tr>
                                        <td width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Amount Paid:</td>
                                        <td valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">₹${parseFloat(subscriptionPrice)}</td>
                                      </tr>
                                      <tr>
                                        <td width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Transaction ID:</td>
                                        <td valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${transactionId}</td>
                                      </tr>
                                      <tr>
                                        <td width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Next Billing Date:</td>
                                        <td valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${formattedNextBillingDate}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for choosing ${branding}. We're committed to always providing the best services.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">Best regards,<br>Team ${branding}</div>
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

// failedReason is a real decline/error message where the call site has one (Cashfree
// charge failures capture the raw API error); call sites with no charge-attempt context
// pass a generic fallback string instead - never left blank, since an empty placeholder
// discards the whole admin-stored template (see resolveEmailTemplate).
exports.generateSubscriptionFailureEmail = (name, subscription, payableAmount, partnerDetails, loginUrl, failedReason) => {
  let { packageName, billingType } = subscription
  billingType = (billingType || '').toLowerCase()
  const formattedDate = moment().format('YYYY-MM-DD');

  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = partnerDetails?.logo;
  const socials = socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' });
  const resolvedLoginUrl = loginUrl || 'https://www.peko.one/auth/login';
  const reason = failedReason || 'Payment could not be processed';

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Subscription renewal failed</title>
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
      <div aria-label="Subscription renewal failed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${v2Header({ website, websiteLabel, logo, branding })}
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
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">We hope this message finds you well. Unfortunately, we were unable to process the automatic renewal of your ${packageName} (${billingType}) subscription due to below reason.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Reason: ${reason}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;color:#000000;">Plan Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Subscription Plan:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">${packageName} (${billingType})</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:12px;">Amount:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;padding-bottom:12px;">₹${payableAmount}</td>
                                      </tr>
                                      <tr>
                                        <td class="detail-label" width="180" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;">Billing Date:</td>
                                        <td class="detail-value" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#000000;">${formattedDate}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">To ensure uninterrupted access to your ${packageName} service, please update your payment details or resolve the issue with your payment method at the earliest.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Go to ${branding} and click re-subscribe.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#000000;">Here's how you can update your payment details:</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <ol style="margin:0;padding-left:20px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#000000;">
                                    <li>Log in to your ${branding} account.</li>
                                    <li>Navigate to the Settings section and select Billing &amp; Saved Cards.</li>
                                    <li>Under the Payment Method section, update your payment information.</li>
                                  </ol>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#ff4f4f" style="border-radius:4px;">
                                          <a href="${resolvedLoginUrl}" target="_blank" style="display:inline-block;padding:10px 24px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;color:#ffffff;text-decoration:none;">LOGIN</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for using ${branding}.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">Best Regards,<br>Team ${branding}</div>
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

exports.preReminderTemplate = (result, partnerDetails, renewalAmountText) => {
  const { packageName, billingType, subscriptionEndDate, name, paymentMode } = result;
  const isActivationCode = paymentMode === 'ACTIVATION_CODE';
  const endDate = new Date(subscriptionEndDate).toLocaleString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const billingLabel = billingType ? billingType.toLowerCase() : '';
  const heading = isActivationCode
    ? `Your ${packageName} subscription expires on ${endDate}`
    : `Your ${packageName} subscription is renewing on ${endDate}`;
  const bodyText = isActivationCode
    ? `We wanted to let you know that your <strong>${packageName} ${billingLabel}</strong> subscription expires on <strong>${endDate}</strong>. To continue enjoying uninterrupted access to premium services, please log in and renew your subscription before it expires.`
    : `We wanted to let you know that your <strong>${packageName} ${billingLabel}</strong> subscription is set to automatically renew on <strong>${endDate}</strong>. Please ensure your payment card is active and has sufficient funds to avoid any service interruptions.`;
  const dateLabel = isActivationCode ? 'Expiry Date' : 'Renewal Date';
  const renewalAmountHtml = renewalAmountText
    ? `<div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-bottom:8px;"><strong>Renewal Amount:</strong> ${renewalAmountText}</div>`
    : '<!-- no renewal amount available -->';

  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = partnerDetails?.logo;
  const socials = socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${heading}</title>
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
      <div aria-label="${heading}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${v2Header({ website, websiteLabel, logo, branding })}
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
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${heading}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name || 'Subscriber'},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">${bodyText}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#000000;">Plan Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-bottom:8px;"><strong>Subscription Plan:</strong> ${packageName} ${billingLabel}</div>
${renewalAmountHtml}
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;"><strong>${dateLabel}:</strong> ${endDate}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you have any questions or need assistance, please contact us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">Best Regards,<br>Team ${branding}</div>
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

// Sent when a cancelled subscription reaches its end date and is transitioned to CANCELLED (the user
// keeps access until then). Design matches the v2 card shell used across this migration (see Figma
// node-id 338-1490's "order cancelled" reference) — red reject badge, headline, body, sign-off — with
// copy adapted for subscription cancellation (access-until-date + re-subscribe), not that design's
// literal "order refund" wording, since a subscription cancellation here carries no refund step.
exports.generateSubscriptionCancelledEmail = ({ corporateName, packageName, endDate, partnerDetails }) => {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.website || 'https://www.peko.one';
  const logo = partnerDetails?.logo;
  const header = v2Header({ website, websiteLabel: toWebsiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(partnerDetails?.socials, { size: 24, padding: '0 16px' }), branding });
  const accessLine = endDate
    ? `Your ${packageName} subscription was active until ${endDate} and has now been cancelled.`
    : `Your ${packageName} subscription has been cancelled.`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Subscription cancelled</title>
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
      <div aria-label="Subscription cancelled" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

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
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  ${v2RejectBadge()}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your ${packageName} subscription has been cancelled</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${corporateName || 'there'},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">${accessLine}</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">You can re-subscribe anytime via ${branding} to continue using the service.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for choosing ${branding}. We value your business and hope to serve you again in the future.</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;padding-top:8px;">Best Regards,<br>Team ${branding}</div>
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

${footer}

      </div>
    </body>
  </html>`;
}

// Old pre-v2 plain-paragraph design preserved as-is — AE has a matching design for this exact
// template but never redesigned it to v2 either (confirmed by reading AE's live
// utils/emailer.js), so there's no v2 reference to build against; matches the project's
// established "don't invent a redesign nothing has approved" rule.
exports.generateTransactionReportEmailBody = ({ type, accountName }) => {
  return `<p>Hello,</p>
  <p>We have attached your ${type} Transaction Report${accountName ? ` for ${accountName}` : ""}.</p><br>
  <br>
  <p>Thank you for using Peko. </p>
   <p>If you have any queries or need further assistance, please reach out to us at
            <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.
          </p>
          <p>Best Regards</p>
          <p>Team Peko</p>`;
};

// Same old-design-preserved rationale as generateTransactionReportEmailBody above. `timePhrase`
// is the only real variable across the 3 real call sites (dailyReportScheduler/
// weeklyReportScheduler/monthlyReportScheduler) — "yesterday"/"last week"/"last month".
exports.generateNoTransactionReportEmailBody = ({ timePhrase }) => {
  return `
          <p>Hello,</p>
          <p>You have not made any transactions ${timePhrase}.</p>
          <br>
          <p>Thank you for using Peko.</p>
          <br>
          <p>If you have any queries or need further assistance, please reach out to us at
            <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.
          </p>
          <p>Best Regards</p>
          <p>Team Peko</p>
        `;
};

exports.generateRenewalScheduledEmail = ({ corporateName, packageName, amount, endDate, partnerDetails }) => {
  const formattedAmount = formatNumberWithLocalString(amount);
  const heading = `Your ${packageName} subscription is scheduled for renewal`;

  return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <title></title>
  <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
    p { line-height: inherit; }
    @media (max-width: 500px) {
      .row-content { width: 100% !important; }
      .stack .column { width: 100%; display: block; }
    }
  </style>
</head>
<body style="margin:0;background-color:#ffffff;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none;">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;" width="100%">
    <tbody>
      <tr>
        <td>
          <!-- Logo row -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;" width="100%">
            <tbody><tr><td>
              <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;color:#000000;width:480px;margin:0 auto;" width="480">
                <tbody><tr>
                  <td style="mso-table-lspace:0pt;mso-table-rspace:0pt;font-weight:400;text-align:left;padding:20px 0 10px;vertical-align:top;" width="100%">
                    <div align="center" style="line-height:10px;">
                      <img alt="${partnerDetails?.branding || 'Peko'}" height="auto"
                        src="${partnerDetails?.logo || ''}"
                        style="display:block;height:auto;border:0;max-width:144px;" />
                    </div>
                  </td>
                </tr></tbody>
              </table>
            </td></tr></tbody>
          </table>
          <!-- Heading row -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;" width="100%">
            <tbody><tr><td>
              <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;color:#000000;width:480px;margin:0 auto;" width="480">
                <tbody><tr>
                  <td style="mso-table-lspace:0pt;mso-table-rspace:0pt;font-weight:400;text-align:left;padding:5px;vertical-align:top;" width="100%">
                    <table border="0" cellpadding="25" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;" width="100%">
                      <tr>
                        <td>
                          <h1 style="margin:0;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;line-height:120%;text-align:center;">
                            ${heading}
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr></tbody>
              </table>
            </td></tr></tbody>
          </table>
          <!-- Body row -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;" width="100%">
            <tbody><tr><td>
              <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#ffffff;color:#000000;width:480px;margin:0 auto;" width="480">
                <tbody><tr>
                  <td style="mso-table-lspace:0pt;mso-table-rspace:0pt;font-weight:400;text-align:left;padding-top:5px;vertical-align:top;" width="100%">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;word-break:break-word;" width="100%">
                      <tr>
                        <td style="padding:10px 25px;">
                          <div style="color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:400;line-height:120%;text-align:left;">
                            <p style="margin:0;margin-bottom:16px;">Hi ${corporateName || 'there'},</p>
                            <p style="margin:0;margin-bottom:16px;">Your <strong>${packageName}</strong> subscription is scheduled for renewal on <strong>${endDate}</strong>.</p>
                            <p style="margin:0;margin-bottom:16px;">To ensure uninterrupted access to Peko's business tools and services, a renewal charge of <strong>₹${formattedAmount}</strong> will be processed using your registered payment method.</p>
                            <p style="margin:0;margin-bottom:8px;"><strong>Renewal Amount:</strong> ₹${formattedAmount}</p>
                            <p style="margin:0;margin-bottom:16px;"><strong>Renewal Date:</strong> ${endDate}</p>
                            <p style="margin:0;margin-bottom:16px;">No action is required from your side. Once the payment is successfully processed, we'll send you a confirmation email.</p>
                            <p style="margin:0;margin-bottom:16px;">
                              If you have any questions or need assistance, please contact us at
                              <a href="mailto:reach@peko.one" style="color:#7747ff;text-decoration:underline;">reach@peko.one</a>.
                            </p>
                            <p style="margin:0;margin-bottom:16px;">Thank you for choosing Peko.</p>
                            <p style="margin:0;">Best regards,<br/>Team ${partnerDetails?.branding || 'Peko'}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr></tbody>
              </table>
            </td></tr></tbody>
          </table>
          <!-- Footer -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;" width="100%">
            <tbody><tr><td>
              <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:#f7f7f7;color:#000000;width:480px;margin:0 auto;" width="480">
                <tbody><tr>
                  <td style="mso-table-lspace:0pt;mso-table-rspace:0pt;font-weight:400;text-align:center;padding:20px 0 30px;vertical-align:top;" width="100%">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;">
                      © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved
                    </p>
                    <p style="margin:8px 0 0;">
                      <a href="https://peko.one/in" rel="noopener" style="color:#000000;text-decoration:underline;font-family:Arial,Helvetica,sans-serif;font-size:15px;" target="_blank">www.peko.one</a>
                    </p>
                  </td>
                </tr></tbody>
              </table>
            </td></tr></tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

exports.vendorInvoiceEmail = (params) => {
    return `
    <!DOCTYPE html>

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

            .row-2 .column-1 .block-1.heading_block h1 {
                font-size: 25px !important;
            }

            .row-3 .column-1 .block-1.paragraph_block td.pad>div {
                font-size: 14px !important;
            }

            .row-4 .column-1 .block-1.heading_block td.pad,
            .row-5 .column-1 .block-1.heading_block td.pad,
            .row-9 .column-1 .block-1.heading_block td.pad {
                padding: 0 !important;
            }

            .row-4 .column-1 .block-1.heading_block h1,
            .row-9 .column-1 .block-1.heading_block h1 {
                font-size: 17px !important;
            }

            .row-5 .column-1 {
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


                    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center">
      <table class="content" width="480" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding: 10px 0;">
            <p class="text">
              Dear ${params?.vendorName},
            </p>

            <p class="text">
              Please find attached the <b>tax invoice</b> for the <b>commission charged</b> by
              <b>Peko</b>.
            </p>

            <p class="text">
              This invoice is shared for your accounting and compliance records.
            </p>

            <p class="text">
              For any clarification, you may contact us at
              <a href="mailto:help@peko.one" style="color:#000000; text-decoration:underline;">
                help@peko.one
              </a>.
            </p>

            <p class="text">
              Best regards,<br />
              Finance Team<br />
              Peko
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-14"
                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <table align="center" border="0" cellpadding="0" cellspacing="0"
                                        class="row-content stack" role="presentation"
                                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
                                        width="480">
                                        <tbody>
                                            <tr style="border-collapse:collapse">
                                                <td align="center" style="padding:0;Margin:0;font-size:0px">
                                                    <a target="_blank" href="https://peko.one"
                                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img
                                                            class="adapt-img" src="https://ci3.googleusercontent.com/meips/ADKq_NZqgfIWflNTNO0waLQxk4rWczpoWzU3xiz-0NjqdoNfJRc8eh1ZsGFh-RDZW9IOEu514aakXyl3f2K1NGeNyX2JZSGDJlN6G1izYZwOMyKxqucEVdWc2bbLDs2m5QZULZIm42k8Ji70C6Tzq-iI1ulOTia4zNfhThqlFHvvnzOPN4YvjUMdZI9p624NSLph7wu5W1Upj6kUyWKdMg=s0-d-e1-ft#https://gxphmw.stripocdn.email/content/guids/CABINET_8f8e7ee442fbda9a69cf88b98a720f7e0ddcf9093c2b341ffede27ef2b660865/images/peko.png" alt
                                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                            height="35"></a>
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
                        style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;"
                        width="480">
                        <tbody>
                            <tr>
                                <td class="column column-1"
                                    style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;"
                                    width="100%">
                                    <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1"
                                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
                                        width="100%">
                                        <tr>
                                            <td class="pad" style="text-align:center;width:100%;">
                                                <h1
                                                    style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;">
                                                    <span class="tinyMce-placeholder" style="word-break: break-word;">
                                                        ©
                                                        ${new Date().getUTCFullYear()} Peko Platforms Private
                                                        Limited, All Rights Reserved</span>
                                                </h1>
                                            </td>
                                        </tr>
                                    </table>
                                    <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2"
                                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
                                        width="100%">
                                        <tr>
                                            <td class="pad">
                                                <h1
                                                    style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 14.399999999999999px;">
                                                    <a href="https://peko.one/in/privacy-policy" rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Privacy
                                                        Policy</a> | <a href="https://peko.one/in/cookie-policy/"
                                                        rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Cookie
                                                        Policy</a> | <a href="https://peko.one/in/platform-agreement"
                                                        rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Terms of
                                                        Use</a> | <a href="https://peko.one/in/refund-policy/"
                                                        rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">Refund &
                                                        Cancellation Policy</a><a
                                                        style="text-decoration: underline; color: #000000;"></a>
                                                </h1>
                                            </td>
                                        </tr>
                                    </table>
                                    <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-3"
                                        role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
                                        width="100%">
                                        <tr>
                                            <td class="pad">
                                                <h1
                                                    style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;">
                                                    <a href="https://peko.one/" rel="noopener"
                                                        style="text-decoration: underline; color: #000000;"
                                                        target="_blank">www.peko.one</a>
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

</html>
    `
}
