
const he = require('he');
const { formatNumberWithLocalString } = require("../formatter");
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require("./sharedLayout");

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

exports.generateHotelTicketAndSendToMailNew = (
  data,
  bookingData,
  guestDetailsData,
  templateDetails
) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.baseUrl || 'https://peko.one/in';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  function convertDateToDDMMYYYY(dateStr) {
    if (!dateStr) return "N/A";
    const dateObj = new Date(dateStr);
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return dateObj.toLocaleDateString("en-US", options).toUpperCase();
  }
  function convertTimeTo12HR(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).replace(/am|pm/i, (m) => m.toUpperCase());
  }
  function fixUrl(url) {
    return url.replace(/ /g, "%20");
  }

  const hotelImage = bookingData.HotelImage
    ? fixUrl(bookingData.HotelImage)
    : "https://peko-storage.s3.me-central-1.amazonaws.com/staging/common/templates/fogg-welcome-by-man.png";
  const nightsText = `${bookingData.nights} ${bookingData.nights === 1 ? 'Night' : 'Nights'}`;

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Hotel booking confirmed</title>
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
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Hotel booking confirmed" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Hotel booking confirmed</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${data.user},</div>
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:8px;">We are pleased to inform you that your hotel booking has been confirmed. We have attached the details.</div>
                                </td>
                              </tr>

                              <!-- Hotel card -->
                              <tr>
                                <td style="padding-bottom:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;">
                                    <tbody>
                                      <tr>
                                        <td style="padding:20px 24px;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                            <tbody>
                                              <tr>
                                                <td valign="top" style="padding-right:12px;">
                                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#000000;padding-bottom:6px;">${bookingData.HotelName}</div>
                                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4B5563;padding-bottom:4px;">${bookingData.AddressLine1}</div>
                                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4B5563;padding-bottom:14px;">Booking number: ${bookingData?.bookingReferenceId || 'N/A'}</div>
                                                </td>
                                                <td valign="top" align="right">
                                                  <img src="${hotelImage}" alt="${bookingData.HotelName}" width="120" style="display:block;max-width:120px;width:100%;height:auto;border-radius:8px;object-fit:contain;" />
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colspan="2">
                                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                                    <tbody>
                                                      <tr>
                                                        <td width="50%" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF;">Check-in: ${convertDateToDDMMYYYY(bookingData.CheckInDate)} ${convertTimeTo12HR(bookingData.CheckInDate)}</td>
                                                        <td width="50%" valign="top" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:18px;color:#9CA3AF;">Check-out: ${convertDateToDDMMYYYY(bookingData.CheckOutDate)} ${convertTimeTo12HR(bookingData.CheckOutDate)}</td>
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
                                </td>
                              </tr>

                              <!-- Details -->
                              <tr>
                                <td align="left" style="padding-bottom:16px;padding-top:4px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;color:#000000;">Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <thead>
                                      <tr style="background-color:#F3F4F6;">
                                        <th align="left" style="padding:10px 8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;border-bottom:1px solid #E5E7EB;">Main Guest</th>
                                        <th align="left" style="padding:10px 8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;border-bottom:1px solid #E5E7EB;">Total No. of Guest</th>
                                        <th align="left" style="padding:10px 8px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#374151;border-bottom:1px solid #E5E7EB;">Reservation Details</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td valign="top" align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${guestDetailsData.PassengerName} (${guestDetailsData.PassengerType})</td>
                                        <td valign="top" align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${bookingData.hotelAdultCount}, ${bookingData.hotelChildCount}</td>
                                        <td valign="top" align="left" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#000000;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${nightsText}, ${bookingData.hotelRoomCount}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- Manage booking -->
                              <tr>
                                <td align="left" style="padding-bottom:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#ff4f4f" style="border-radius:12px;">
                                          <a href="${templateDetails?.baseUrl}/corporate-travel/hotels/manage-bookings" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Manage Booking</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;border-top:1px solid #E5E7EB;padding-top:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>. We assure you of our best services at all times.</div>
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


  