exports.generateBusCancellationEmail = ({ passengerName = '', tin = '', refundAmount = 0, couponCode = '', couponDiscount = 0, tripDetails = {}, fareDetails = {} }) => {
    const source = tripDetails.source || 'N/A';
    const destination = tripDetails.destination || 'N/A';
    const operatorName = tripDetails.operatorName || 'N/A';
    const travelDate = tripDetails.travelDate || 'N/A';

    const baseFare = parseFloat(fareDetails.baseFare || 0);
    const serviceTax = parseFloat(fareDetails.serviceTax || 0);
    const platformFee = parseFloat(fareDetails.platformFee || 0);
    const couponDiscountVal = parseFloat(couponDiscount || 0);
    const refund = parseFloat(refundAmount || 0);
    // cancellation charges = what user effectively paid (after coupon) minus what's being refunded
    const effectivePaid = baseFare + serviceTax - couponDiscountVal;
    const cancellationCharges = effectivePaid > refund ? parseFloat((effectivePaid - refund).toFixed(2)) : 0;

    return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Bus Ticket Cancellation</title>
    <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
    <style type="text/css">
        body { margin: 0; padding: 0; background-color: #f4f4f4; }
        table, tr, td { vertical-align: top; border-collapse: collapse; }
        p { margin: 0; }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;color:#1a1a1a;">
<table style="border-collapse:collapse;table-layout:fixed;border-spacing:0;vertical-align:top;min-width:320px;margin:0 auto;background-color:#f4f4f4;width:100%;" cellpadding="0" cellspacing="0">
    <tbody>
        <tr style="vertical-align:top;">
            <td style="word-break:break-word;border-collapse:collapse;vertical-align:top;">

                <!-- Header -->
                <div style="margin:0 auto;max-width:600px;background-color:#1a1a1a;padding:24px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="font-family:'Cabin',sans-serif;">
                                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Peko</span>
                            </td>
                            <td style="text-align:right;font-family:'Cabin',sans-serif;">
                                <span style="font-size:13px;color:#aaaaaa;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Bus Ticket Cancellation</span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Greeting -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:32px 32px 16px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:15px;color:#444444;line-height:1.6;">
                        Hi ${passengerName || 'there'},<br><br>
                        Your bus ticket has been successfully cancelled.
                    </p>
                </div>

                <!-- Cancellation Details -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;">Cancellation Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e8e8;border-radius:8px;">
                        ${tin ? `<tr>
                            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;width:40%;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Ticket Number</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${tin}</div>
                            </td>
                            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;border-left:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Operator</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${operatorName}</div>
                            </td>
                        </tr>` : ''}
                        <tr>
                            <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Route</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${source} &rarr; ${destination}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding:12px 16px;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Travel Date</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${travelDate}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Refund Details -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;">Refund Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">
                        <thead>
                            <tr style="background-color:#f8f8f8;">
                                <th style="padding:10px 16px;text-align:left;font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#777777;letter-spacing:0.6px;text-transform:uppercase;">Description</th>
                                <th style="padding:10px 16px;text-align:right;font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#777777;letter-spacing:0.6px;text-transform:uppercase;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${baseFare > 0 ? `<tr>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#555555;">Ticket Fare</td>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;text-align:right;">&#8377;${baseFare.toFixed(2)}</td>
                            </tr>` : ''}
                            ${cancellationCharges > 0 ? `<tr>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#555555;">Cancellation Charges</td>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#c0392b;text-align:right;">- &#8377;${cancellationCharges.toFixed(2)}</td>
                            </tr>` : ''}
                            ${platformFee > 0 ? `<tr>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#555555;">Convenience Fee</td>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#888888;text-align:right;font-style:italic;">Non-refundable</td>
                            </tr>` : ''}
                            ${serviceTax > 0 ? `<tr>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#555555;">GST</td>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;text-align:right;">&#8377;${serviceTax.toFixed(2)}</td>
                            </tr>` : ''}
                            ${couponDiscountVal > 0 ? `<tr>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#2e7d32;">Coupon Discount${couponCode ? ` <span style="font-size:12px;background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;margin-left:4px;">${couponCode}</span>` : ''}</td>
                                <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#2e7d32;text-align:right;">-&#8377;${couponDiscountVal.toFixed(2)}</td>
                            </tr>` : ''}
                            <tr style="background-color:#f8f8f8;">
                                <td style="padding:12px 16px;border-top:1px solid #e8e8e8;font-family:'Cabin',sans-serif;font-size:14px;font-weight:700;color:#1a1a1a;">Refund Amount</td>
                                <td style="padding:12px 16px;border-top:1px solid #e8e8e8;font-family:'Cabin',sans-serif;font-size:14px;font-weight:700;color:#27ae60;text-align:right;">&#8377;${refund.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;line-height:1.6;margin-top:12px;">
                        The refund amount has been calculated in accordance with the applicable cancellation policy of the bus operator. The refunded amount will be credited back to your original payment source as per the standard processing timelines.
                    </p>
                </div>

                <!-- Note -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px 28px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:13px;color:#555555;line-height:1.6;">
                        If you did not initiate this cancellation or have any questions regarding your booking, please contact our support team.
                    </p>
                    <p style="font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;margin-top:20px;">
                        Thank you for choosing Peko.<br>
                        <strong>Regards,<br>The Peko Team</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="margin:0 auto;max-width:600px;background-color:#1a1a1a;padding:20px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:12px;color:#aaaaaa;text-align:center;margin:0;">
                        Peko Helpline: 022 489 30373 &nbsp;|&nbsp; reach@peko.one &nbsp;|&nbsp; www.peko.one
                    </p>
                </div>

            </td>
        </tr>
    </tbody>
</table>
</body>
</html>`;
};
