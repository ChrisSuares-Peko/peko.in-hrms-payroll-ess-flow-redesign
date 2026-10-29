exports.busTicketPDFTemplate = (ticketDetails, templateDetails, bookingMeta = {}) => {
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

    function formatBookedOn(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        });
    }

    const doj = ticketDetails.doj || '';
    const departureTime = minutesToTime(ticketDetails.pickupTime);
    const arrivalTime = minutesToTime(ticketDetails.dropTime);
    const departureDate = minutesToDayLabel(doj, ticketDetails.pickupTime);
    const arrivalDate = minutesToDayLabel(doj, ticketDetails.dropTime);

    const pickupMins = parseInt(ticketDetails.pickupTime || 0);
    const dropMins = parseInt(ticketDetails.dropTime || 0);
    let durationMins = dropMins - pickupMins;
    if (durationMins < 0) durationMins += 1440;
    const durationH = Math.floor(durationMins / 60);
    const durationM = durationMins % 60;
    const duration = durationMins > 0 ? `${durationH}h ${durationM > 0 ? durationM + 'm' : ''}`.trim() : 'N/A';

    const boardingPoint = ticketDetails.pickupLocation || ticketDetails.pickUpLocation || '';
    const droppingPoint = ticketDetails.dropLocation || '';

    const companyName = templateDetails?.companyName || templateDetails?.branding || 'Peko';
    const logoHtml = `<span style="font-size:22px;font-weight:800;color:#1a1a1a;font-family:Roboto,sans-serif;letter-spacing:-0.5px;">${companyName}</span>`;

    const tin = ticketDetails.tin || '';
    const operatorName = ticketDetails.travels || 'N/A';
    const busType = ticketDetails.busType || '';
    const source = ticketDetails.sourceCity || 'N/A';
    const destination = ticketDetails.destinationCity || 'N/A';

    const baseFare = items.reduce((sum, i) => sum + parseFloat(i.baseFare || 0), 0);
    const serviceTax = items.reduce((sum, i) => sum + parseFloat(i.serviceTax || 0), 0);
    const platformFee = parseFloat(bookingMeta.platformFee ?? ticketDetails.bookingFee ?? 0);
    const totalFare = items.reduce((sum, i) => sum + parseFloat(i.grandTotalFare || i.fare || 0), 0) + platformFee;

    const passengerRows = items.map((item) => {
        const p = item.passenger || {};
        const gender = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1).toLowerCase() : null;
        const age = p.age && p.age !== '0' && p.age !== 'N/A' ? `${p.age} years` : null;
        const genderAge = [gender, age].filter(Boolean).join(', ');
        return `
        <tr>
            <td style="padding:12px 20px;vertical-align:top;">
                <div style="font-weight:500;font-size:13px;color:#1a1a1a;font-family:Roboto,sans-serif;">${p.title ? p.title + ' ' : ''}${p.name || 'N/A'}</div>
                ${genderAge ? `<div style="font-size:11px;color:#666;margin-top:3px;font-family:Inter,sans-serif;">${genderAge}</div>` : ''}
            </td>
            <td style="padding:12px 20px;vertical-align:top;font-weight:500;font-size:13px;color:#1a1a1a;font-family:Roboto,sans-serif;">
                ${item.seatName || 'N/A'}
            </td>
        </tr>`;
    }).join('');

    const fareItemsHtml = [
        baseFare > 0
            ? `<div style="display:flex;gap:5px;align-items:baseline;white-space:nowrap;">
                <span style="font-size:11px;color:#555;font-family:Roboto,sans-serif;">Base Fare:</span>
                <span style="font-size:11px;font-weight:600;color:#1a1a1a;font-family:Roboto,sans-serif;">&#8377;${baseFare.toFixed(2)}</span>
               </div>` : '',
        platformFee > 0
            ? `<div style="display:flex;gap:5px;align-items:baseline;white-space:nowrap;">
                <span style="font-size:11px;color:#555;font-family:Roboto,sans-serif;">Platform Fee:</span>
                <span style="font-size:11px;font-weight:600;color:#1a1a1a;font-family:Roboto,sans-serif;">&#8377;${platformFee.toFixed(2)}</span>
               </div>` : '',
        serviceTax > 0
            ? `<div style="display:flex;gap:5px;align-items:baseline;white-space:nowrap;">
                <span style="font-size:11px;color:#555;font-family:Roboto,sans-serif;">GST:</span>
                <span style="font-size:11px;font-weight:600;color:#1a1a1a;font-family:Roboto,sans-serif;">&#8377;${serviceTax.toFixed(2)}</span>
               </div>` : '',
        `<div style="display:flex;gap:5px;align-items:baseline;white-space:nowrap;">
            <span style="font-size:11px;color:#555;font-family:Roboto,sans-serif;">Total Fare:</span>
            <span style="font-size:11px;font-weight:700;color:#1a1a1a;font-family:Roboto,sans-serif;">&#8377;${totalFare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
         </div>`,
    ].filter(Boolean);

    const corporateTxnId = bookingMeta.corporateTxnId || '';

    const metaParts = [
        tin ? `Ticket Number - ${tin}` : '',
        corporateTxnId ? `Order ID - ${corporateTxnId}` : '',
    ].filter(Boolean);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bus Ticket - ${tin}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Roboto', Arial, sans-serif; background: #f3f3f3; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style>
</head>
<body>
<div style="max-width:720px;margin:30px auto;background:#fff;padding:40px 48px;">

    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
        <div>
            <div style="font-size:24px;font-weight:700;color:#1a1a1a;font-family:Roboto,sans-serif;margin-bottom:12px;">Ticket Confirmation</div>
            <div style="display:flex;gap:18px;font-size:11px;font-weight:600;font-family:Roboto,sans-serif;color:#1a1a1a;flex-wrap:wrap;">
                ${metaParts.map(p => `<span>${p}</span>`).join('')}
            </div>
        </div>
        <div style="flex-shrink:0;padding-left:16px;padding-top:4px;">
            ${logoHtml}
        </div>
    </div>

    <hr style="border:none;border-top:1px solid #e0e0e0;margin:12px 0 10px;">

    <div style="font-size:11px;color:#555;font-family:Roboto,sans-serif;margin-bottom:20px;text-align:right;">
        Booked on ${formatBookedOn(ticketDetails.dateOfIssue)}
    </div>

    <!-- Trip Card -->
    <div style="border:1px solid #dedede;border-radius:14px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 12px 1px rgba(0,0,0,0.06);">

        <!-- Card Header -->
        <div style="background:#f8fafc;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div>
                <div style="font-size:14px;font-weight:500;color:#1e293b;font-family:Roboto,sans-serif;">${operatorName}</div>
                ${busType ? `<div style="font-size:11px;color:#475569;font-family:Roboto,sans-serif;margin-top:2px;">${busType}</div>` : ''}
            </div>
            ${tin ? `<div style="font-size:11px;color:#475569;font-family:Inter,sans-serif;text-align:center;">
                Ticket Number (TIN): <strong style="color:#1e293b;">${tin}</strong>
            </div>` : ''}
        </div>

        <!-- Card Body -->
        <div style="padding:20px 20px 16px;background:#fff;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">

                <!-- Departure -->
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:140px;text-align:center;">
                    <div style="font-size:14px;color:#475569;font-family:Roboto,sans-serif;">${source}</div>
                    <div style="font-size:22px;font-weight:600;color:#1e293b;font-family:Roboto,sans-serif;line-height:1.3;">${departureTime}</div>
                    <div style="font-size:11px;color:#475569;font-family:Roboto,sans-serif;">${departureDate}</div>
                    ${boardingPoint ? `<div style="font-size:11px;font-weight:700;color:#475569;font-family:Roboto,sans-serif;margin-top:2px;text-align:center;">${boardingPoint}</div>` : ''}
                </div>

                <!-- Duration -->
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <div style="width:100%;display:flex;align-items:center;gap:4px;">
                        <div style="width:10px;height:10px;border-radius:50%;border:2px solid #c4b5d6;flex-shrink:0;"></div>
                        <div style="flex:1;height:1px;border-top:1.5px dashed #c4b5d6;"></div>
                        <div style="width:10px;height:10px;border-radius:50%;border:2px solid #c4b5d6;flex-shrink:0;"></div>
                    </div>
                    <div style="background:#f6eefb;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;color:#4a3a56;font-family:Roboto,sans-serif;white-space:nowrap;">
                        ${duration}
                    </div>
                </div>

                <!-- Arrival -->
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:140px;text-align:center;">
                    <div style="font-size:14px;color:#475569;font-family:Roboto,sans-serif;">${destination}</div>
                    <div style="font-size:22px;font-weight:600;color:#1e293b;font-family:Roboto,sans-serif;line-height:1.3;">${arrivalTime}</div>
                    <div style="font-size:11px;color:#475569;font-family:Roboto,sans-serif;">${arrivalDate}</div>
                    ${droppingPoint ? `<div style="font-size:11px;font-weight:700;color:#475569;font-family:Roboto,sans-serif;margin-top:2px;text-align:center;">${droppingPoint}</div>` : ''}
                </div>

            </div>
        </div>
    </div>

    <!-- Travellers -->
    <div style="border:1px solid #dedede;border-radius:10px;overflow:hidden;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="background:#f5f5f5;">
                    <th style="padding:10px 20px;text-align:left;font-size:10px;font-weight:500;color:#1a1a1a;letter-spacing:0.6px;text-transform:uppercase;font-family:Inter,sans-serif;">TRAVELLERS</th>
                    <th style="padding:10px 20px;text-align:left;font-size:10px;font-weight:500;color:#1a1a1a;letter-spacing:0.6px;text-transform:uppercase;font-family:Inter,sans-serif;">SEAT NO.</th>
                </tr>
            </thead>
            <tbody>
                ${items.length
                    ? passengerRows
                    : `<tr><td colspan="2" style="padding:12px 20px;text-align:center;font-size:12px;color:#888;">No passenger details available</td></tr>`}
            </tbody>
        </table>
    </div>

    <!-- Fare Breakup -->
    <div style="border:1px solid #dedede;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:14px;font-family:Roboto,sans-serif;">FARE BREAKUP</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:baseline;">
            ${fareItemsHtml.join('')}
        </div>
    </div>

    <!-- Important Information -->
    <div style="border:1px solid #dedede;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#1a1a1a;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:12px;font-family:Roboto,sans-serif;">IMPORTANT INFORMATION</div>
        <ul style="list-style:disc;padding-left:16px;font-size:10px;color:#575757;font-family:Roboto,sans-serif;line-height:1.6;">
            <li style="margin-bottom:6px;">Please arrive at the boarding point at least 15 minutes before departure.</li>
            <li style="margin-bottom:6px;">Carry a valid government-issued photo ID for verification at the time of boarding.</li>
            <li style="margin-bottom:6px;">The bus operator is not obligated to wait beyond the scheduled departure time.</li>
            <li style="margin-bottom:6px;">Excess baggage over 10 kgs per passenger will be chargeable.</li>
            <li style="margin-bottom:6px;">Cancellation charges apply as per the bus operator's policy.</li>
            <li style="margin-bottom:6px;">Use your Order ID for all communication with Peko about this booking.</li>
        </ul>
    </div>

    <!-- Footer -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="font-size:10px;color:#666;font-family:Roboto,sans-serif;">
            Peko Helpline: <strong>Call 02248930373</strong>
        </div>
        <div style="font-size:10px;color:#666;font-family:Roboto,sans-serif;">
            Peko support email: <strong>help@peko.one</strong>
        </div>
        <div style="font-size:10px;color:#666;font-family:Roboto,sans-serif;font-weight:500;">www.peko.one</div>
    </div>

</div>
</body>
</html>`;
};
