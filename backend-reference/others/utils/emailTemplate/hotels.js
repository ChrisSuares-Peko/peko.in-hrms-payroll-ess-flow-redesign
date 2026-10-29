
const he = require('he');
const { formatNumberWithLocalString } = require("../formatter");
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, PEKO_SOCIAL_LINKS } = require('./sharedLayout');

exports.hotelTicketPDFTemplateNew = (data, templateDetails) => {
    if (!data?.bookingData) {
        return "";
    }

    const {
        HotelName,
        AddressLine1,
        transactionDate,
        CheckInDate,
        CheckOutDate,
        CheckInTime,
        CheckOutTime,
        nights,
        hotelAdultCount,
        hotelChildCount,
        hotelRoomCount,
        RoomTypeName,
        CancellationPolicy,
        HotelPolicyDetail
    } = data.bookingData;
    const formattedPolicy = CancellationPolicy.replace("#^#", "<br><strong>").replace("|#!#", "</strong>").replace(/\s+/g, " ").replace(/,([^ ])/g, ', $1')
    .replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  
    function formatDateToText(dateString) {
        // input format ; 2024-10-25
        return new Date(dateString)
            .toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            })
            .replace(/,/g, ""); // Remove commas , o/p format :  Sat Oct 25 2024
    }

    function formatDatePattern(dateString) {
        // input format: 2024-10-25 , Output: "Nov 4, 2024 - Monday"
        const options = {
            month: "short",
            day: "numeric",
            year: "numeric",
            weekday: "long",
        };

        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString("en-US", options);

        const [weekday, month, day, year] = formattedDate.match(/\w+/g);
        return `${month} ${day}, ${year} - ${weekday}`;
    }
 
    const formattedCheckInDate = formatDateToText(CheckInDate);
    const bookedDate = formatDatePattern(transactionDate);
    //   const ticketId = data?.supplierReferenceId;
    //   const ticketIdLabel = ticketId ? `Ticket ID: ${ticketId}\u00A0\u00A0\u00A0\u00A0`: ""; // \u00A0 for extra space

let HotelPolicyDetailStr = Array.isArray(HotelPolicyDetail)
  ? HotelPolicyDetail.join(" ")
  : "";

// Replace INR and decode
const decodedContent = he.decode(HotelPolicyDetailStr.replace(/INR/g, "₹"));
   
    // Remove CheckIn Time-End details
    const cleanedContent = decodedContent?.replace(/CheckIn Time-End:[^|]*\|?/i, '').trim();
    console.log("Cleaned Content:", cleanedContent);
    
    // Split the content into manageable sections
    const sections = cleanedContent?.replace(/,\s*(?=\w)/g, '|')?.split('|')
      .map(item => he.decode(item.trim()))?.filter(item => item.length > 0);
    
    // Format each section into HTML
    const formattedContent = sections?.map((section) => {
      const hasHtmlList = section?.includes('<ul>') || section?.includes('<li>');
    
      const cleanedSection = section
        .replace(/,([^ ])/g, ', $1')            // Add space after commas
        .replace(/([a-z])([A-Z])/g, '$1 $2')    // Space between camelCase
        .trim();
    
      return hasHtmlList
        ? `<div style="margin-bottom: 10px;">${cleanedSection}</div>`
        : `<p style="margin-bottom: 10px; font-family: Roboto; font-size: 14px; color: #333;">${cleanedSection}</p>`;
    }).join('');
    
    // Final output block
    const propertyRulesContent = `
      <div class="container" style="padding: 20px 30px;">
        <p style="font-family: Roboto; font-weight: 500; font-size: 16px; color: #000000; margin-bottom: 15px;">
          PROPERTY RULES
        </p>
        ${formattedContent}
      </div>
    `;
    
    console.log("Formatted Property Rules:", propertyRulesContent);
    
    
    // const passengers = data.passengers;
    const allPassengers = data.passengers.flatMap(item => item.passengers);
   
    let tableRow = ``;
    allPassengers.forEach((d, i) => {
        let ptcString = "";
        if (d.PassengerType === "Adult") ptcString = "(Adult)";
        if (d.PassengerType === "Child") ptcString = "(Child)";
    
        const { Email, Phoneno, PassengerName } = d;
    
        tableRow += `
            <tr>
                <td style="padding-left: 19px;">
                    <div class="guest-details">
                        <span>${i + 1}. ${PassengerName} ${ptcString}</span>
                    </div>
                </td>
                <td>
                    <div class="guest-details">
                        <span>${Email || 'N/A'}</span>
                    </div>
                </td>
                <td>
                    <div class="guest-details">
                        <span>${Phoneno ? `+91 ${Phoneno}` : 'N/A'}</span>
                    </div>
                </td>
                <td>
                    <div class="guest-details"></div>
                </td>
            </tr>
        `;
    });
    
    return `
    
    <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <title>Hotel Booking Confirmation</title>
      <style>
          body {
              font-family: Roboto;
              background-color: #f3f3f3;
              margin: 0;
              padding: 0;
          }
  
          .root-container {
              width: 100%;
              max-width: 800px;
              padding-left: 50px;
              padding-right: 50px;
              padding-top: 1px;
              margin: 0 auto;
              background-color: white;
  
          }
  
          .form-title {
              font-family: 'Roboto', sans-serif;
              font-size: 30px;
              font-weight: 800;
  
          }
  
          .container {
              width: 100%;
              max-width: 800px;
              padding: 0px;
              margin: 0 auto;
              background-color: white;
              border-radius: 15px;
              border: 0.5px solid #DEDEDE;
              opacity: 1;
          }
  
          .hotel-address {
              font-size: 14px;
              margin-bottom: 0px;
              padding-left: 30px;
              font-weight: 400;
          }
  
          .hotel-checkout-section {
              display: table;
              width: 100%;
              margin-bottom: 20px;
              margin-top: 0%;
          }
  
          .day-plan {
              display: table-cell;
              text-align: center;
              padding: 10px;
          }
  
          .checkin-details {
              text-align: left;
              padding-left: 30px;
              padding-top: 10px;
              margin-top: 10px;
              font-family: Roboto;
              color: #171717;
          }
  
          .checkin-details p {
              font-size: 24px;
              font-weight: 500;
              margin: 5px 0;
              padding-top: 5px;
              margin-top: 0px;
  
          }
  
          .checkin-details span {
              font-size: 18px;
              font-weight: 400;
          }
  
          .checkin-details small {
              font-size: 14px;
          }
  
          .tag {
              border: 1px solid #c73c3c;
              padding: 5px 10px;
              border-radius: 4px;
              display: inline-block;
              font-size: 14px;
              margin-top: 20px;
          }
  
          .guest-info {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              margin-top: 40px;
          }
  
          .guest-detail {
              flex: 1;
              min-width: 200px;
              text-align: center;
              padding: 10px;
          }
  
          .guest-info div {
              flex: 1 1 calc(25% - 10px);
              text-align: center;
              margin: 0 5px;
          }
  
          .guest-info div p {
              margin: 5px 0;
          }
  
  
          .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 5px;
              margin-bottom: 5px;
          }
  
          .logo {
              margin-left: auto;
          }
  
          .logo img {
              width: 100px;
          }
  
          .id-section {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              
          }
  
          .custom-hr {
              width: 100%;
              height: 0;
              border: 0.1px solid #ddd8d8;
              opacity: 0.20;
              margin: 0;
          }
  
          .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
          }
  
          .date-details {
              padding-top: 15px;
              padding-bottom: 15px;
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
              font-weight: 500;
              line-height: 11.72px;
              text-align: left;
          }
  
          .hotel-name {
              background-color: #FFF7F7;
              padding-left: 30px;
              padding-top: 20px;
              padding-bottom: 20px;
              border-radius: 15px 15px 0px 0px;
          }
  
          .info-section span {
              margin-left: 10px;
          }
  
          .guest-header {
              padding-left: 25px;
              font-family: Inter, sans-serif;
              font-size: 12.88px;
              font-weight: 600;
              line-height: 10.17px;
              text-align: left;
          }
  
          .room-details {
              color: #000000;
              font-family: Inter, sans-serif;
              font-weight: 300;
              line-height: 10.32px;
              text-align: left;
          }
  
  
          .about-title {
              padding-left: 35px;
              padding-top: 25px;
              padding-bottom: 20px;
              font-family: 'Roboto', sans-serif;
              font-weight: 500;
              font-size: 16px;
              color: #000000;
          }
  
          .bullet-list {
              padding-left: 50px;
              padding-right: 10px;
              padding-bottom: 20px;
              font-family: 'Inter', sans-serif;
              font-size: 13px;
              font-weight: 400;
              color: #000000;
              text-align: left;
          }
  
          .bullet-list li {
              margin-bottom: 10px;
              /* Space after each bullet point */
              color: #000000;
              font-family: 'Inter', sans-serif;
              font-weight: 100;
          }
  
          .bullet-list li strong {
              font-weight: 200;
          }
  
          .footer-layout {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              font-family: 'Inter', sans-serif;
              padding-top: 10px;
              padding-bottom: 10px;
  
          }
  
          .table-layout {
              width: 100%;
              margin-top: 10px;
              margin-bottom: 20px;
              border: none;
          }
  
          .table-layout td {
              border: none;
              text-align: left;
          }
  
          table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0px;
          }
  
          table,
          th,
          td {
              border: 1px solid #ddd;
          }
  
          th,
          td {
              padding: 0px;
              text-align: left;
              border: none;
          }
  
          .details-section {
              margin: 20px 0;
          }
  
          .border-table td {
              padding: 10px;
              border: 1px solid #ddd;
          }
  
          .details-table .header {
              background-color: #f7f7f7;
              font-weight: bold;
          }
  
          .fare-breakup-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
          }
  
          .fare-breakup-table div {
              margin-bottom: 8px;
          }
  
          .fare-breakup-table td {
              padding: 10px;
              border: 1px solid #ddd;
          }
  
          .fare-breakup-table .header {
              background-color: #f7f7f7;
              font-weight: bold;
          }
  
  
          .guest-details {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              font-family: Roboto;
              padding: 8px;
  
          }
  
          .fare-items {
              margin: 0;
              padding-left: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              font-family: Roboto;
          }
  
          .inline-header {
              display: inline;
              margin-right: 10px;
              font-size: 20px;
              font-family: Inter, sans-serif;
              font-weight: 400;
              line-height: 10.32px;
              text-align: left;
          }
  
          .inline-text {
              display: inline;
              margin: 0;
              color: #000000;
          }
  
          .farebreakup-layout {
              width: 100%;
              margin-top: 10px;
              margin-bottom: 20px;
              border: none;
          }
  
          .farebreakup-layout td {
              padding: 10px 15px;
          }
  
          .table-layout td {
              padding: 10px 15px;
          }
          .table-layout-guest td {
              padding: 0px;
          }
  
          .guest-details span {
              margin-right: 10px;
          }
  
          .footer {
  
              margin-top: 30px;
              margin-right:30px;
  
              
          }
          .footer div {
           padding-right:5px;
           }
  
          .footer p {
              font-size: 12px;
              color: #777;
              margin: 5px 0;
          }
  
          .footer h4 {
              margin: 10px 0;
          }
  
          .footer ul {
              padding-left: 20px;
              margin: 10px 0;
          }
  
          .footer ul li {
              margin: 5px 0;
              color: #555;
          }
  
  
          .fare-item2 {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 16px;
              padding: 8px;
          }
  
          .fare-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 16px;
  
          }
  
          .fare-item2 span {
              margin-right: 5px;
          }
  
          .fare-item2 strong {
              margin-left: 0;
          }
      </style>
  </head>
  
  <body>
  
      <div class="root-container">
          <div class="header">
              <p class="form-title">${data.pdfName}</p>
              <div class="logo">
                  <img src=${templateDetails?.logo} alt="Logo">
              </div>
          </div>
  
          <div class="id-section">
            
              <span><strong>Booking ID: ${data?.bookingReferenceId.replace(/,([^ ])/g, ', $1')
        }</strong></span>
          </div>
          <hr class="custom-hr">
          <div class="date-details">
              <span>Booked on: ${bookedDate}</span>
          </div>
  
          <div class="container">
              <div class="hotel-name">
                  <span style="font-size: 22px; font-weight: 600; margin-right: 30px;">${HotelName}</span>
                  <strong style="margin-left: 0;"></strong>
              </div>
  
              <hr style="border: none; border-top: 1px solid #ccc; width: 100%; margin: 0;">
  
              <!-- </div> -->
              <p class="hotel-address">${AddressLine1}</p>
  
              <div class="hotel-checkout-section">
                  <div class="checkin-details">
                      <span>Check-In</span>
                      <p>${formattedCheckInDate}</p>
                      ${CheckInTime ? `<small>${CheckInTime}</small>` : ""}
                  </div>

                  <div class="day-plan">
                     <div class="tag">${nights} ${nights === 1 ? "Night" : "Nights"}</div>
                      <p><small>${hotelRoomCount} | ${hotelAdultCount} | ${hotelChildCount}</small></p>
                  </div>

                  <div class="checkin-details">
                      <span>Check-Out</span>
                      <p>${formatDateToText(CheckOutDate)}</p>
                      ${CheckOutTime ? `<small>${CheckOutTime}</small>` : ""}
                  </div>
              </div>
  
  
              <p class="guest-header">
                  GUEST DETAILS
              </p>
  
              <table class="table-layout-guest table-layout ">
                                                    ${tableRow}
      
              </table>
  
  
         <table class="table-layout" style="width: 100%;">
    <thead class="room-details">
        <tr style="background-color: #f2f2f2;">
            <th style="padding-left: 25px; font-weight: 300; font-family: Inter, sans-serif; width: 50%;">ROOM TYPE</th>
            <th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; width: 25%;">GUEST</th>
            <th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; width: 25%;">NO. OF ROOMS</th>
        </tr>
    </thead>
    <tbody>
        <tr>
          <td style="font-weight: 600; font-family: Inter, sans-serif; padding-left: 25px;">
  ${RoomTypeName[0] === RoomTypeName[1]
    ? RoomTypeName[0].replace(/,([^ ])/g, ', $1').replace(/([a-z])([A-Z])/g, '$1 $2') 
    : RoomTypeName.map(name => name.replace(/,([^ ])/g, ', $1').replace(/([a-z])([A-Z])/g, '$1 $2')).join('<br>')}
</td>
            <td style="font-weight: 600; font-family: Inter, sans-serif;">${hotelAdultCount} & ${hotelChildCount}</td>
            <td style="font-weight: 600; font-family: Inter, sans-serif;">${hotelRoomCount}</td>
        </tr>
    </tbody>
</table>
          </div>
  
          <div class="container" style="padding-top: 10px; margin-top: 15px;">
  
              <p style="font-weight:600; font-family: Inter, sans-serif; padding-left: 25px;">
                  FARE BREAKUP
              </p>
  
              <table class="farebreakup-layout ">
                  <tr>
  
                      <td>
                          <div class="fare-items">
                              <span>Total Fare:</span>
                            ₹ ${formatNumberWithLocalString(
            data?.amount
        )}
                          </div>
                      </td>
                      <td>
                          <div class="fare-items">
                              <span>Platform Fee:</span>
                              <strong>₹ ${formatNumberWithLocalString(
            data?.surcharge
        )}</strong>
                          </div>
                      </td>
                      <td>
                          <div class="fare-items">
                              <span>Total Amount:</span>
                              <strong>₹ ${formatNumberWithLocalString(
            data?.totalAmount
        )}</strong>
                          </div>
                      </td>
                  </tr>
              </table>
          </div>
  
          <div class="footer">
              <p class="inline-header" style="color: #EA3639; ">Cancellation Policy </p>
              <br/>
              <p class="inline-text" style="color: #000000;  font-family: Inter, sans-serif; font-weight: 400;">${formattedPolicy}</p>
              <p>&nbsp;</p>
              ${propertyRulesContent}
          </div>
  
          <div class="footer-layout ">
              <p>Peko Helpline: 022 489 30373</p>
              <p>Peko Support Email: reach@peko.one</p>
              <p>
       <a href="https://www.peko.one/in" target="_blank" rel="noopener noreferrer" 
           style="color: black; text-decoration: none;">
            www.peko.one
        </a>
    </p>
          </div>
  
      </div>
  </body>
  
  </html>
    `;
};

// key: HOTEL_BOOKING_CONFIRMATION_EMAIL (service: HOTEL)
// Rebuilt to match the Figma design (node 406:4367, "Your hotel booking confirmed")
// - image slot, details row, guest table, "Manage Booking" button - using this
// function's REAL field names (bookingData.HotelName, guestDetailsData?.PassengerName,
// etc.), not the placeholder field names shown in the Figma mockup text itself
// (which don't match this codebase - e.g. no bookingReferenceId field exists here,
// so no booking-number row is shown, unlike the mockup).
// Exported so the resolver call site (controllers/admin/hotels.js) can build the
// same formatted strings as ${} variables for the admin-managed template - the
// resolver can't run these conversions itself, it only substitutes pre-computed
// values.
exports.convertDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "N/A";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(dateStr).toLocaleDateString("en-US", options).toUpperCase();
};
exports.convertTimeTo12HR = (timeStr) => {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dateObj = new Date();
  dateObj.setHours(hours, minutes);
  return dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};
exports.fixHotelImageUrl = (url) => url.replace(/ /g, "%20");

// Shared by both this file's fallback and the resolver call site
// (controllers/admin/hotels.js), which needs the identical strings as
// pre-computed ${} variables for the admin-managed template.
exports.toIndiaTimeString = (dateStr) => new Date(dateStr).toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});
exports.nightsLabelFor = (nights) => (nights == 1 ? 'Night' : 'Nights');

exports.generateHotelTicketAndSendToMailNew = (
  data,
  bookingData,
  guestDetailsData,
  templateDetails
) => {
  const checkInTime = exports.toIndiaTimeString(bookingData.CheckInDate);
  const checkOutTime = exports.toIndiaTimeString(bookingData.CheckOutDate);

  const convertDateToDDMMYYYY = exports.convertDateToDDMMYYYY;
  const convertTimeTo12HR = exports.convertTimeTo12HR;
  const fixUrl = exports.fixHotelImageUrl;

  const website = templateDetails?.baseUrl || 'https://in.peko.one';
  const branding = templateDetails?.branding || 'Peko';
  const headerHtml = v2Header({ website, websiteLabel: websiteLabel(website), logo: templateDetails?.logo, branding });
  const footerHtml = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: '0 16px' }), branding });
  const hotelImageUrl = bookingData.HotelImage
    ? fixUrl(bookingData.HotelImage)
    : "https://peko-storage.s3.me-central-1.amazonaws.com/staging/common/templates/fogg-welcome-by-man.png";
  const nightsLabel = exports.nightsLabelFor(bookingData.nights);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Hotel booking confirmed</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="Hotel booking confirmed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${headerHtml}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            ${v2SuccessBadge()}
            <h2 style="margin:24px 0 24px 0;font-size:28px;font-weight:700;color:#000000;">Hotel booking confirmed</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 28px 0;">Dear ${data.user}, We are pleased to inform you that your hotel booking has been confirmed. We have attached the details.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
              <tr>
                <td valign="top">
                  <p style="font-size:18px;line-height:1.4;color:#000000;margin:0 0 4px 0;font-weight:700;">${bookingData.HotelName}</p>
                  <p style="font-size:13px;line-height:1.4;color:#666666;margin:0;">${bookingData.AddressLine1}</p>
                </td>
                <td width="80" style="padding-left:16px;">
                  <img src="${hotelImageUrl}" alt="" width="80" height="80" style="display:block;width:80px;height:80px;border-radius:8px;object-fit:cover;" />
                </td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px 0;" />
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
              <tr>
                <td align="center" style="font-size:22px;font-weight:700;color:#333333;">${convertDateToDDMMYYYY(bookingData.CheckInDate)}<br/>
                  <span style="font-size:14px;font-weight:400;color:#333333;">Checkin: <strong>${convertTimeTo12HR(checkInTime)}</strong></span>
                </td>
                <td align="center" style="font-size:14px;color:#333333;">
                  ${bookingData.hotelAdultCount} ${bookingData.hotelChildCount}<br/>
                  ${bookingData.nights} ${nightsLabel} ${bookingData.hotelRoomCount}
                </td>
                <td align="center" style="font-size:22px;font-weight:700;color:#333333;">${convertDateToDDMMYYYY(bookingData.CheckOutDate)}<br/>
                  <span style="font-size:14px;font-weight:400;color:#333333;">Checkout: <strong>${convertTimeTo12HR(checkOutTime)}</strong></span>
                </td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 20px 0;" />
            <p style="font-size:17px;font-weight:700;color:#000000;margin:0 0 16px 0;">Details</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
              <tr>
                <td style="font-size:12px;font-weight:700;color:#666666;padding-bottom:8px;">MAIN GUEST</td>
                <td style="font-size:12px;font-weight:700;color:#666666;padding-bottom:8px;">TOTAL NO. OF GUEST</td>
                <td style="font-size:12px;font-weight:700;color:#666666;padding-bottom:8px;">YOUR RESERVATION</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#333333;">${guestDetailsData?.PassengerName} (${guestDetailsData?.PassengerType})</td>
                <td style="font-size:14px;color:#333333;">${bookingData.hotelAdultCount}, ${bookingData.hotelChildCount}</td>
                <td style="font-size:14px;color:#333333;">${bookingData.nights} ${nightsLabel}, ${bookingData.hotelRoomCount}</td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
              <tr>
                <td>
                  <a href="${templateDetails?.baseUrl}corporate-travel/hotels/manage-bookings" target="_blank" style="display:inline-block;background-color:#FF3A3A;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Manage Booking</a>
                </td>
              </tr>
            </table>
            <p style="font-size:16px;line-height:1.6;color:#666666;margin:0;">Thank you for using ${branding}.<br/>If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#666666;">reach@peko.one</a>. We assure you of our best services at all times.<br/><br/>Best Regards,<br/>Team ${branding}</p>
          </div>
        </div>
${footerHtml}
      </div>
    </body>
  </html>`;
};


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
                                                                        <p style="margin: 0 0 16px 0;">We would like to inform you about your current wallet balance with TBO vendor:</p>
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
                                                   <a href="https://peko.one/in/privacy-policy/"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a
                                                     href="https://peko.one/in/refund-policy"
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href=""
                                                     style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a>
                                                 </p>
                                               </td>
                                             </tr>
                                             <tr style="border-collapse:collapse">
                                               <td align="center" style="padding:0;Margin:0">
                                                 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                                   © ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights
                                      Reserved</p>
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


  