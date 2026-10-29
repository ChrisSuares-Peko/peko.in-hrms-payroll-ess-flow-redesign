exports.busTicketPDFTemplate = (ticketDetails) => {
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
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    function formatDoj(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        });
    }

    function formatBookedOn(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    }

    const pickupMins = parseInt(ticketDetails.pickupTime || 0);
    const dropMins = parseInt(ticketDetails.dropTime || 0);
    let durationMins = dropMins - pickupMins;
    if (durationMins < 0) durationMins += 1440;
    const durationH = Math.floor(durationMins / 60);
    const durationM = durationMins % 60;
    const duration = `${durationH}h ${durationM}m`;

    const doj = ticketDetails.doj || '';
    const departureDate = minutesToDayLabel(doj, ticketDetails.pickupTime);
    const arrivalDate = minutesToDayLabel(doj, ticketDetails.dropTime);
    const departureTime = minutesToTime(ticketDetails.pickupTime);
    const arrivalTime = minutesToTime(ticketDetails.dropTime);

    const totalFare = items.reduce((sum, i) => sum + parseFloat(i.grandTotalFare || i.fare || 0), 0);
    const baseFare = items.reduce((sum, i) => sum + parseFloat(i.baseFare || 0), 0);
    const serviceTax = items.reduce((sum, i) => sum + parseFloat(i.serviceTax || 0), 0);
    const operatorServiceCharge = items.reduce((sum, i) => sum + parseFloat(i.operatorServiceCharge || 0), 0);
    const bookingFee = parseFloat(ticketDetails.bookingFee || 0);
    const serviceCharge = parseFloat(ticketDetails.serviceCharge || 0);

    const passengerRows = items.map(item => {
        const p = item.passenger || {};
        const gender = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase() : '';
        return `
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">${p.title || ''} ${p.name || ''}</div>
                    <div style="font-size: 12px; color: #777; margin-top: 3px;">${gender}${p.age && p.age !== '0' ? `, ${p.age} years` : ''}</div>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 700; font-size: 14px; color: #1a1a1a;">
                    ${item.seatName || ''}
                </td>
            </tr>`;
    }).join('');

    const fareItems = [
        baseFare > 0 ? `<td style="padding: 0 12px 0 0;"><div style="font-size: 12px; color: #888; margin-bottom: 4px;">Base Fare</div><div style="font-size: 14px; font-weight: 600;">&#8377;${baseFare.toFixed(2)}</div></td>` : '',
        bookingFee > 0 ? `<td style="padding: 0 12px;"><div style="font-size: 12px; color: #888; margin-bottom: 4px;">Platform Fee</div><div style="font-size: 14px; font-weight: 600;">&#8377;${bookingFee.toFixed(2)}</div></td>` : '',
        serviceCharge > 0 ? `<td style="padding: 0 12px;"><div style="font-size: 12px; color: #888; margin-bottom: 4px;">Service Charge</div><div style="font-size: 14px; font-weight: 600;">&#8377;${serviceCharge.toFixed(2)}</div></td>` : '',
        operatorServiceCharge > 0 ? `<td style="padding: 0 12px;"><div style="font-size: 12px; color: #888; margin-bottom: 4px;">Operator Charge</div><div style="font-size: 14px; font-weight: 600;">&#8377;${operatorServiceCharge.toFixed(2)}</div></td>` : '',
        serviceTax > 0 ? `<td style="padding: 0 12px;"><div style="font-size: 12px; color: #888; margin-bottom: 4px;">GST</div><div style="font-size: 14px; font-weight: 600;">&#8377;${serviceTax.toFixed(2)}</div></td>` : '',
    ].filter(Boolean).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bus Ticket Confirmation</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Roboto', Arial, sans-serif; background: #f3f3f3; color: #1a1a1a; -webkit-print-color-adjust: exact; }
        .root { width: 100%; max-width: 720px; margin: 30px auto; background: #fff; padding: 36px 48px; border-radius: 4px; }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        .title { font-size: 26px; font-weight: 800; color: #1a1a1a; }
.meta-row { font-size: 12px; color: #555; margin-bottom: 5px; }
        .meta-sep { margin: 0 20px; color: #ccc; }
        .booked-on { font-size: 12px; color: #999; margin-bottom: 24px; }
        .trip-card { border: 1px solid #e8e8e8; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px; }
        .route-line { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .route-text { font-size: 17px; font-weight: 700; }
        .route-date { font-size: 13px; color: #666; text-align: right; }
        .bus-info-text { font-size: 13px; color: #555; margin-bottom: 14px; }
        .journey-table { width: 100%; border-collapse: collapse; }
        .dep-cell, .arr-cell { width: 38%; vertical-align: top; }
        .mid-cell { width: 24%; vertical-align: middle; text-align: center; }
        .j-date { font-size: 12px; color: #999; margin-bottom: 4px; }
        .j-time { font-size: 22px; font-weight: 700; color: #1a1a1a; }
        .j-loc { font-size: 12px; color: #666; margin-top: 4px; line-height: 1.5; }
        .duration-text { font-size: 12px; color: #888; margin-bottom: 6px; }
        .arrow { font-size: 20px; color: #0057ff; }
        .seat-info { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0f0f0; font-size: 13px; color: #555; }
        .section-label { font-size: 11px; font-weight: 700; color: #aaa; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; }
        .travellers-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
        .th-left { font-size: 11px; font-weight: 700; color: #aaa; letter-spacing: 1.2px; text-transform: uppercase; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; text-align: left; }
        .th-right { font-size: 11px; font-weight: 700; color: #aaa; letter-spacing: 1.2px; text-transform: uppercase; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; text-align: right; }
        .fare-section { margin-bottom: 28px; }
        .fare-items-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .total-row { border-top: 2px solid #e8e8e8; padding-top: 12px; }
        .total-label { font-size: 15px; font-weight: 700; }
        .total-value { font-size: 17px; font-weight: 800; color: #0057ff; text-align: right; }
        .info-box { background: #f7f9ff; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; }
        .info-title { font-size: 11px; font-weight: 700; color: #aaa; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; }
        .info-list { list-style: none; }
        .info-list li { font-size: 12px; color: #555; padding: 4px 0 4px 18px; position: relative; line-height: 1.5; }
        .info-list li::before { content: "•"; position: absolute; left: 0; color: #0057ff; font-weight: 700; }
        .boarding-section { border: 1px solid #e8e8e8; border-radius: 10px; margin-bottom: 28px; overflow: hidden; }
        .boarding-header { background: #f7f7f7; padding: 10px 20px; font-size: 11px; font-weight: 700; color: #aaa; letter-spacing: 1.2px; text-transform: uppercase; }
        .boarding-body { display: flex; }
        .boarding-cell { flex: 1; padding: 16px 20px; }
        .boarding-cell + .boarding-cell { border-left: 1px solid #e8e8e8; }
        .boarding-label { font-size: 11px; color: #888; margin-bottom: 6px; }
        .boarding-value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
        .footer-table { width: 100%; border-collapse: collapse; border-top: 1px solid #eee; padding-top: 16px; }
        .footer-left { font-size: 11px; color: #999; padding-top: 14px; }
        .footer-right { font-size: 11px; color: #999; text-align: right; padding-top: 14px; }
    </style>
</head>
<body>
<div class="root">
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td><div class="title">Ticket Confirmation</div></td>
        </tr>
    </table>

    <!-- Meta -->
    <div class="booked-on">Booked on ${formatBookedOn(ticketDetails.dateOfIssue)}</div>

    <!-- Trip Card -->
    <div class="trip-card">
        <table class="route-line">
            <tr>
                <td><span class="route-text">${ticketDetails.sourceCity || ''} &rarr; ${ticketDetails.destinationCity || ''}</span></td>
                <td class="route-date">&#8226; ${formatDoj(doj)}</td>
            </tr>
        </table>
        <div class="bus-info-text">
            <strong>${ticketDetails.travels || ''}</strong> &nbsp;&nbsp; ${ticketDetails.busType || ''}
        </div>
        <table class="journey-table">
            <tr>
                <td class="dep-cell">
                    <div class="j-date">${departureDate}</div>
                    <div class="j-time">${departureTime}</div>
                    <div class="j-loc">${ticketDetails.sourceCity || ''}</div>
                </td>
                <td class="mid-cell">
                    <div class="duration-text">${duration}</div>
                    <div class="arrow">&#8594;</div>
                </td>
                <td class="arr-cell" style="text-align: right;">
                    <div class="j-date">${arrivalDate}</div>
                    <div class="j-time">${arrivalTime}</div>
                    <div class="j-loc">${ticketDetails.destinationCity || ''}</div>
                </td>
            </tr>
        </table>
        ${items.length > 0 ? `<div class="seat-info">Seat Number: <strong>${items.map(i => i.seatName).join(', ')}</strong></div>` : ''}
    </div>

    <!-- Boarding & Drop Points -->
    <div class="boarding-section">
        <div class="boarding-header">Boarding &amp; Drop Points</div>
        <div class="boarding-body">
            <div class="boarding-cell">
                <div class="boarding-label">Boarding Point</div>
                <div class="boarding-value">${ticketDetails.boardingPointDetails?.address || ticketDetails.pickupLocation || ticketDetails.pickUpLocation || 'N/A'}</div>
            </div>
            <div class="boarding-cell">
                <div class="boarding-label">Drop Point</div>
                <div class="boarding-value">${ticketDetails.droppingPointDetails?.address || ticketDetails.dropLocation || 'N/A'}</div>
            </div>
        </div>
    </div>

    <!-- Travellers -->
    <table class="travellers-table">
        <thead>
            <tr>
                <th class="th-left">Travellers</th>
                <th class="th-right">Seat No.</th>
            </tr>
        </thead>
        <tbody>${passengerRows}</tbody>
    </table>

    <!-- Fare Breakup -->
    <div class="fare-section">
        <div class="section-label">Fare Breakup</div>
        <table class="fare-items-table">
            <tr>${fareItems}</tr>
        </table>
        <table class="fare-items-table total-row">
            <tr>
                <td class="total-label">Total Fare</td>
                <td class="total-value">&#8377;${totalFare.toFixed(2)}</td>
            </tr>
        </table>
    </div>

    <!-- Important Information -->
    <div class="info-box">
        <div class="info-title">Important Information</div>
        <ul class="info-list">
            <li>Please arrive at the boarding point at least 15 minutes before departure.</li>
            <li>Carry a valid government-issued photo ID for verification at the time of boarding.</li>
            <li>The bus operator is not obligated to wait beyond the scheduled departure time.</li>
            <li>Excess baggage over 10 kgs per passenger will be chargeable.</li>
            <li>Cancellation charges apply as per the bus operator's policy.</li>
            <li>Use your Order ID for all communication with Peko about this booking.</li>
        </ul>
    </div>

    <!-- Footer -->
    <table class="footer-table">
        <tr>
            <td class="footer-left">Peko Helpline: Call 02248930373 &nbsp;|&nbsp; Peko support email: help@peko.one</td>
            <td class="footer-right">www.peko.one</td>
        </tr>
    </table>
</div>
</body>
</html>`;
};
