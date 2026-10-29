exports.generateBusTicketEmail = ({ ticketDetails = {}, passengerName = '', platformFee = 0, couponCode = '', couponDiscount = 0, templateDetails = {} }) => {
    const companyName = templateDetails?.companyName || templateDetails?.branding || 'Peko';
    const logoHtml = templateDetails?.logo
        ? `<img src="${templateDetails.logo}" alt="${companyName}" style="height:32px;max-height:32px;display:block;" />`
        : `<span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${companyName}</span>`;

    const items = Array.isArray(ticketDetails.inventoryItems)
        ? ticketDetails.inventoryItems
        : (ticketDetails.inventoryItems ? [ticketDetails.inventoryItems] : []);

    function minutesToTime(minutes) {
        const total = parseInt(minutes || 0);
        const normalized = total % 1440;
        const h = Math.floor(normalized / 60);
        const m = normalized % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    }

    function minutesToDayLabel(doj, minutes) {
        const total = parseInt(minutes || 0);
        const daysOffset = Math.floor(total / 1440);
        const d = new Date(doj);
        d.setDate(d.getDate() + daysOffset);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }

    const doj = ticketDetails.doj || '';
    const tin = ticketDetails.tin || '';
    const operatorName = ticketDetails.travels || 'N/A';
    const busType = ticketDetails.busType || '';
    const source = ticketDetails.sourceCity || 'N/A';
    const destination = ticketDetails.destinationCity || 'N/A';
    const departureTime = minutesToTime(ticketDetails.pickupTime);
    const arrivalTime = minutesToTime(ticketDetails.dropTime);
    const arrivalDate = doj ? minutesToDayLabel(doj, ticketDetails.dropTime) : '';
    const travelDate = doj ? minutesToDayLabel(doj, ticketDetails.pickupTime) : 'N/A';
    const boardingPoint = ticketDetails.boardingPointDetails?.address || ticketDetails.pickupLocation || ticketDetails.pickUpLocation || '';
    const reportingTime = ticketDetails.boardingPointDetails?.time || '';
    const droppingPoint = ticketDetails.droppingPointDetails?.address || ticketDetails.dropLocation || '';

    const baseFare = items.reduce((sum, i) => sum + parseFloat(i.baseFare || 0), 0);
    const serviceTax = items.reduce((sum, i) => sum + parseFloat(i.serviceTax || 0), 0);
    const pf = parseFloat(platformFee || ticketDetails.bookingFee || 0);
    const discount = parseFloat(couponDiscount || 0);
    const totalFare = items.reduce((sum, i) => sum + parseFloat(i.grandTotalFare || i.fare || 0), 0) + pf - discount;

    const passengerRows = items.map((item) => {
        const p = item.passenger || {};
        const gender = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase() : '';
        const age = p.age && p.age !== '0' && p.age !== 'N/A' ? `${p.age} yrs` : '';
        const meta = [gender, age].filter(Boolean).join(', ');
        return `
        <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;">
                ${p.title ? p.title + ' ' : ''}${p.name || 'N/A'}
                ${meta ? `<div style="font-size:12px;color:#777;margin-top:2px;">${meta}</div>` : ''}
            </td>
            <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;">${item.seatName || 'N/A'}</td>
        </tr>`;
    }).join('');

    const fareRows = [
        baseFare > 0 ? `<tr><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#555;">Base Fare</td><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;text-align:right;">&#8377;${baseFare.toFixed(2)}</td></tr>` : '',
        pf > 0 ? `<tr><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#555;">Platform Fee</td><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;text-align:right;">&#8377;${pf.toFixed(2)}</td></tr>` : '',
        serviceTax > 0 ? `<tr><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#555;">GST</td><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#1a1a1a;text-align:right;">&#8377;${serviceTax.toFixed(2)}</td></tr>` : '',
        (discount > 0 && couponCode) ? `<tr><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#2e7d32;">Coupon Discount <span style="font-size:12px;background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;margin-left:4px;">${couponCode}</span></td><td style="padding:6px 0;font-family:'Cabin',sans-serif;font-size:14px;color:#2e7d32;text-align:right;">-&#8377;${discount.toFixed(2)}</td></tr>` : '',
    ].filter(Boolean).join('');

    return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Bus Ticket Confirmation</title>
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
                                ${logoHtml}
                            </td>
                            <td style="text-align:right;font-family:'Cabin',sans-serif;">
                                <span style="font-size:13px;color:#aaaaaa;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Bus Ticket</span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Greeting -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:32px 32px 16px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:8px;">Booking Confirmation</p>
                    <p style="font-family:'Cabin',sans-serif;font-size:15px;color:#444444;line-height:1.6;">
                        Hi ${passengerName || 'there'},<br>
                        Your bus ticket has been successfully booked. We wish you a safe and pleasant journey!
                    </p>
                </div>

                <!-- Journey Details -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;">Journey Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e8e8;border-radius:8px;">
                        <tr>
                            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;width:40%;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Ticket Number</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${tin || 'N/A'}</div>
                            </td>
                            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;border-left:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Operator</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${operatorName}</div>
                            </td>
                        </tr>
                        ${busType ? `<tr>
                            <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Bus Type</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${busType}</div>
                            </td>
                        </tr>` : ''}
                        <tr>
                            <td colspan="2" style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Route</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${source} &rarr; ${destination}</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Travel Date</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${travelDate}</div>
                            </td>
                            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;border-left:1px solid #f0f0f0;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Departure Time</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${departureTime}</div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding:12px 16px;">
                                <span style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;">Arrival Date &amp; Time</span>
                                <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;margin-top:2px;">${arrivalDate ? arrivalDate + ', ' : ''}${arrivalTime}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Passenger Details -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;">Passenger Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;">
                        <thead>
                            <tr style="background-color:#f8f8f8;">
                                <th style="padding:10px 16px;text-align:left;font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#777777;letter-spacing:0.6px;text-transform:uppercase;">Passenger</th>
                                <th style="padding:10px 16px;text-align:left;font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#777777;letter-spacing:0.6px;text-transform:uppercase;">Seat No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.length ? passengerRows : `<tr><td colspan="2" style="padding:12px 16px;font-family:'Cabin',sans-serif;font-size:13px;color:#999;text-align:center;">No passenger details available</td></tr>`}
                        </tbody>
                    </table>
                </div>

                <!-- Boarding & Dropping -->
                ${(boardingPoint || droppingPoint) ? `
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;">Boarding &amp; Drop Points</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            ${boardingPoint ? `<td style="padding:0 8px 0 0;width:50%;vertical-align:top;">
                                <div style="border:1px solid #e8e8e8;border-radius:8px;padding:14px 16px;">
                                    <div style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;margin-bottom:4px;">Boarding Point</div>
                                    <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;">${boardingPoint}</div>
                                    ${reportingTime ? `<div style="font-family:'Cabin',sans-serif;font-size:12px;color:#555555;margin-top:4px;">Reporting Time: ${reportingTime}</div>` : ''}
                                </div>
                            </td>` : '<td style="padding:0 8px 0 0;width:50%;"></td>'}
                            ${droppingPoint ? `<td style="padding:0 0 0 8px;width:50%;vertical-align:top;">
                                <div style="border:1px solid #e8e8e8;border-radius:8px;padding:14px 16px;">
                                    <div style="font-family:'Cabin',sans-serif;font-size:12px;color:#777777;margin-bottom:4px;">Drop Point</div>
                                    <div style="font-family:'Cabin',sans-serif;font-size:14px;font-weight:600;color:#1a1a1a;">${droppingPoint}</div>
                                </div>
                            </td>` : '<td style="padding:0 0 0 8px;width:50%;"></td>'}
                        </tr>
                    </table>
                </div>` : ''}

                <!-- Fare Details -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;">Fare Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e8e8;border-radius:8px;">
                        <tr style="background-color:#f8f8f8;">
                            <td style="padding:14px 16px;font-family:'Cabin',sans-serif;font-size:15px;font-weight:700;color:#1a1a1a;">Total Fare</td>
                            <td style="padding:14px 16px;font-family:'Cabin',sans-serif;font-size:15px;font-weight:700;color:#1a1a1a;text-align:right;">&#8377;${totalFare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        ${fareRows ? `<tr><td colspan="2" style="padding:0 16px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:10px 0;">
                                ${fareRows}
                            </table>
                        </td></tr>` : ''}
                    </table>
                </div>

                <!-- Important Information -->
                <div style="margin:0 auto;max-width:600px;background-color:#ffffff;padding:16px 32px 24px;">
                    <p style="font-family:'Cabin',sans-serif;font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:12px;">Important Information</p>
                    <ul style="margin:0;padding-left:18px;font-family:'Cabin',sans-serif;font-size:13px;color:#555555;line-height:1.7;">
                        <li>Please carry a valid government-issued photo ID during your journey.</li>
                        <li>Arrive at the boarding point at least 15&ndash;30 minutes before the scheduled departure.</li>
                        <li>Cancellation and refund are subject to the bus operator's cancellation policy.</li>
                    </ul>
                    <p style="font-family:'Cabin',sans-serif;font-size:13px;color:#555555;line-height:1.6;margin-top:16px;">
                        If you have any questions regarding your booking, please contact our support team.
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
