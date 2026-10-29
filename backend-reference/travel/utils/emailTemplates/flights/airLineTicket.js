/* eslint-disable no-unused-vars */
exports.airLineTicketTemplate = (data, templateDetails) => {
  const {
    flightDetails,
    inbountFlightDetails,
    totalFare,
    baseFare,
    bookedDate,
    ticketDocument,
    pdfName,
    bookingIdLabel,
    bookingStatusMessage,
    passengers,
    passengersDetails,
    totalAncillaryAmount,
    taxAmount,
    transactionFee,
    surcharge,
    pnr,
    inbountPNR,
    lcc,
    isInternational,
    contactPhone,
    contactEmail,
  } = data;
  const isShowSeat = isSeatDataAvailable(passengersDetails)
  let passengerData = "";
  let inbountPassengerData = "";
  if (data) {
    passengerData = getPassengerDetails(passengersDetails, flightDetails, true);
    inbountPassengerData = getPassengerDetails(passengersDetails, inbountFlightDetails, false)
  }
  let journeyHtml = getJourneyHtml(flightDetails, pnr);
  let inbountJourney;
  if(inbountFlightDetails) {
    inbountJourney = getJourneyHtml(inbountFlightDetails, inbountPNR)
  }
  let breakPage =
    flightDetails.length > 1
      ? '<div style="page-break-before: always;"></div>'
      : "";

  // Important Information is assembled from conditional fragments keyed on route type
  // (domestic vs international) — no single hardcoded list.
  const branding = templateDetails?.branding || "Peko";
  const arrivalGuidance = isInternational
    ? "Please reach the airport at least 3 hours before departure. Check-in counters close 2 hours before departure (times may vary by airline)."
    : "Please reach the airport at least 2.5 hours before departure. Check-in counters close 2 hours before departure (times may vary by airline).";
  const idGuidance = isInternational
    ? "Carry a valid passport with at least 6 months validity, along with the relevant visa and immigration clearance for all travellers."
    : "Carry a valid government-issued photo ID (Aadhaar, PAN, Passport, Voter ID, or Driving Licence) for all travellers.";
  const importantInfoItems = [
    arrivalGuidance,
    "Cabin baggage must not exceed 7 kg; check-in allowance is as shown on this ticket.",
    "Web check-in opens 48 hours before departure on the airline website using the Airline PNR and passenger last name.",
    idGuidance,
    `Cancellation and date-change fees apply as per fare rules. Manage your booking at ${templateDetails?.baseUrl || "https://in.peko.one"} or via the ${branding} app.`,
    `Use your Confirmation Number for all communication with ${branding} about this booking.`,
    `Download your GST tax invoice from ${branding} > My Bookings.`,
  ];
  const importantInfoHtml = importantInfoItems
    .map(
      (item) =>
        `<li style="color: #000000; font-family: Inter, sans-serif; font-weight: 100;">${item}</li>`
    )
    .join("");

  const contactLine =
    contactPhone || contactEmail
      ? `<div class="date-details"><span>Contact: ${[contactPhone, contactEmail]
          .filter(Boolean)
          .join(" · ")}</span></div>`
      : "";
  return `
   <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <title>${pdfName}</title>
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
  
            .checkin-details-left {
             min-width: 210px;
              text-align: left;
              padding-left: 20px;
              font-family: Roboto, sans-serif;
              color: #171717;
          }
  
          .checkin-details-left span {
              font-size: 18px;
              font-weight: 400;
              display: block;
          }
  
          .checkin-details-left p {
              font-size: 22px;
              font-weight: 500;
              margin: 5px 0;
  
          }
  
          .checkin-details-left small {
              font-size: 14px;
              font-family: Roboto, sans-serif;
              color: #000000;
              margin-top: 6px;
              display: block;
              white-space: nowrap;
          }
  
          .checkin-details-right {
              min-width: 210px;
              text-align: right;
              padding-right: 20px;
              font-family: Roboto, sans-serif;
              color: #171717;
          }
  
          .checkin-details-right span {
              font-size: 18px;
              font-weight: 400;
              display: block;
          }
  
          .checkin-details-right p {
              font-size: 22px;
              font-weight: 500;
              margin: 5px 0;
  
          }
  
          .checkin-details-right small {
              font-size: 14px;
              font-family: Roboto, sans-serif;
              color: #000000;
              margin-top: 6px;
              display: block;
              white-space: nowrap;
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
  
  
  
          .flight-card {
              background-color: #ffffff;
              padding-left: 40px;
              padding-right: 20px;
              padding-top: 20px;
              padding-bottom: 10px;
              border-radius: 15px 15px 0 0;
              font-family: Inter, sans-serif;
              max-width: 100%;
              margin: auto;
              color: #333;
          }
  
          .title-card {
              background-color: #FFF7F7;
              padding-left: 40px;
              padding-right: 20px;
              padding-top: 20px;
              padding-bottom: 18px;
              border-radius: 15px 15px 0 0;
              font-family: Inter, sans-serif;
              max-width: 100%;
              margin: auto;
              color: #333;
          }
  
  
          .company-logo {
              float: left;
              width: 60px;
              height: 60px;
          }
  
  
          .class-type {
              font-size: 18px;
              font-weight: bold;
              color: #333;
          }
  
          .date {
              font-size: 14px;
              color: #555;
              font-weight: 600;
          }
  
          /* For alignment */
          .details-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 10px;
          }
  
          .id-section {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              gap: 20px;
          }
  
          .custom-hr {
              width: 100%;
              height: 0;
              border: 0.1px solid #000000;
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
  
          .baggage-details {
  
              padding-left: 30px;
              padding-bottom: 15px;
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              font-weight: 100;
              line-height: 11.72px;
              text-align: left;
              color: #898989;
              font-family: Inter, sans-serif;
          }
            .marketed {
            font-size: 13px;
            font-weight: 100;
            line-height: 11.72px;
            text-align: left;
            color: #898989;
            font-family: Inter, sans-serif;
        }
  
          .flight-name {
              font-size: 18px;
              font-family: Inter, sans-serif;
              font-weight: 200;
              /* background-color: #FFF7F7; */
              color: #000000;
              padding-left: 0px;
              padding-top: 10px;
              padding-bottom: 10px;
              border-radius: 15px 15px 0px 0px;
          }
  
          .economy-class {
              font-size: 13px;
              font-family: Inter, sans-serif;
              font-weight: 200;
  
              padding-top: 2px;
              padding-bottom: 2px;
              padding-left: 5px;
              padding-right: 5px;
  
              color: #000000;
              background-color: #FFF7F7;
              border-radius: 15px;
              white-space: nowrap;
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
              padding-bottom: 18px;
              font-family: 'Inter', sans-serif;
              font-size: 13px;
              font-weight: 400;
              color: #000000;
              text-align: left;
          }
  
          .bullet-list li {
              margin-bottom: 5px !important;
              /* Increase space between each bullet item */
              line-height: 1.8 !important;
              /* Adjust line height for additional spacing within each bullet */
              color: #000000;
              font-family: 'Inter', sans-serif;
              font-weight: 200;
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
              margin-bottom: 0px;
              border: none;
              border-radius: 14px;
              overflow: hidden
          }
  
  
          .table-layout td {
              padding: 10px 15px;
          }
  
          .flight-cardbox {
              width: 100%;
              margin-bottom: 0px;
              border: none;
              border-radius: 14px;
              overflow: hidden
          }
  
  
          .flight-cardbox td {
              padding-top: 0px;
              padding-bottom: 10px;
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
  
  
  
          .guest-details span {
              margin-right: 10px;
          }
  
          .footer {
              margin-top: 30px;
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
  
          .flight-details-container {
              display: flex;
              align-items: center;
              /* gap: 20px; */
  
          }
  
          .flight-details {
              font-family: Inter, sans-serif;
              font-size: 14px;
              font-weight: 400;
              padding-left: 0px;
              color: #898989;
          }
      </style>
  </head>
  
  <body>
      
      <div class="root-container">
          <div class="header">
              <p class="form-title">Ticket Confirmation</p>
              <div class="logo">
                  <img src="${templateDetails?.logo}" alt="Peko">
              </div>
          </div>

          <div class="id-section">
              <span><strong> ${bookingIdLabel}</strong></span>
          </div>
          <hr class="custom-hr">
          <div class="date-details">
              <span>Booking Status : ${bookingStatusMessage}</span>
              <span>Booked on: ${bookedDate}</span>
          </div>
          ${contactLine}
  
          ${journeyHtml} 
          ${breakPage}
          <div class="container" style="margin-top: 20px;">
              <table class="table-layout">
                  <thead class="room-details">
                      <tr style="background-color: #f2f2f2; ">
                          <th
                              style="padding-left: 25px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                              TRAVELLERS
                          </th>
                          ${
                            !lcc ?
                                `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                TICKET NUMBER</th>`
                            : 
                                ""
                          }
                          ${
                            isShowSeat ?
                                `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                SEAT</th>`
                            : 
                                ""
                          }
                          <th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                              Pax ID</th>
                      </tr>
  
                  </thead>
                  <tbody>
                        ${passengerData}
                  </tbody>
              </table>
          </div>

          <div style="margin-top: 20px;"/>
          ${
            inbountJourney ? 
            `
                ${inbountJourney} 
                ${breakPage}
                <div class="container" style="margin-top: 20px;">
                    <table class="table-layout">
                        <thead class="room-details">
                            <tr style="background-color: #f2f2f2; ">
                                <th
                                    style="padding-left: 25px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                    TRAVELLERS
                                </th>
                                ${
                                    !lcc ?
                                        `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                        TICKET NUMBER</th>`
                                    : 
                                        ""
                                }
                                ${
                                    isShowSeat ?
                                        `<th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                        SEAT</th>`
                                    : 
                                        ""
                                }
                                <th style="padding: 15px; font-weight: 300; font-family: Inter, sans-serif; font-size: 14px;">
                                    Pax ID</th>
                            </tr>
        
                        </thead>
                        <tbody>
                                ${inbountPassengerData}
                        </tbody>
                    </table>
                </div>
            ` : ""
          }

  
          <div class="container" style="padding-top: 10px; margin-top: 15px;">
  
              <p style="font-weight:600; font-family: Inter, sans-serif; padding-left: 25px;">
                  FARE BREAKUP
              </p>
  
              <table class="farebreakup-layout ">
                  <tr>
  
                      <td>
                          <div class="fare-items">
                              <span>Base Fare:</span>
                              <strong>₹ ${baseFare}</strong>
                          </div>
                      </td>
                    
                      <td>
                          <div class="fare-items">
                              <span>Taxes and fees</span>
                              <strong>₹ ${taxAmount}</strong>
                          </div>
                      </td>
                       <td>
                          <div class="fare-items">
                              <span>Other Charges:</span>
                              <strong>₹ ${transactionFee}</strong>
                          </div>
                      </td>
                  </tr>
                  <tr>
                      <td>
                          <div class="fare-items">
                              <span>Total Ancillary:</span>
                              <strong>₹ ${totalAncillaryAmount}</strong>
                          </div>
                      </td>
                      <td>
                          <div class="fare-items">
                              <span>Platform Fee:</span>
                              <strong>₹  ${surcharge}</strong>
                          </div>
                      </td>
                     
                      <td>
                          <div class="fare-items">
                              <span> Total Fare:</span>
                              <strong>₹  ${totalFare}</strong>
                          </div>
                      </td>
                  </tr>
              </table>
          </div>
  
          <div class="footer">
  
  
              <div class="container">
                  <p
                      style="padding-left: 35px; padding-top: 25px; padding-bottom: 10px;  font-family: Roboto; font-weight: 500; font-size: 16px; color: #000000;">
                     IMPORTANT INFORMATION</p>
                  <ul class="bullet-list"
                      style="padding-left: 50px; padding-right: 10px; padding-bottom: 20px; font-family: Inter, sans-serif; font-size: 13px; font-weight: 400;color: #000000; text-align: left;">
                      ${importantInfoHtml}
                  </ul>
              </div>
          </div>
  
      </div>
  </body>
  
  </html>
    `;
  function getPassengerDetails(passengers, ticketDocument, isOutbount) {
    let passengersHtml = "";
    passengers.forEach((person, index) => {
        let seatCode; 
        const seats = isOutbount ? person?.seat : person?.inbountSeat;
        if(seats){
            seatCode = seats.map( curr => curr.Code).join(", ")
        }

      passengersHtml += `
      <tr>
      <td>
        <div class="row">
          <div class="col-1">
            <i class="bi bi-person"></i>
          </div>
          <div class="col-11">
            <div style='padding-left:15px; padding-top:0px'>
                ${ person?.name}
            </div>
            ${ isInternational ? `<div style='padding-top: 10px; padding-bottom:0px; padding-left:15px; font-weight:100; font-size: 12px; font-family: Inter, sans-serif;' >Passport No. <span>
                ${person?.passport || "NA"}
            </span> </div>` : '' }
          </div>
        </div>
      </td>
      ${ !lcc ? `<td>${person?.ticket}</td>` : ''}
      ${ isShowSeat ? `<td>${seatCode ? `Seat ${seatCode}`:  "NA" }</td>` : ''}
      <td style='padding-left:18px'>${person?.pnr}</td>
      </tr>
        `;
    });

    return passengersHtml;
  }

  function getJourneyHtml(data, pnr) {
    let journeyHtml = "";
    try {
        data.forEach((journey, i) => {
            const { stopQuantity, onPoint, offPoint, flightSegments, startDate } = journey;
            let segmentHtml = "";
            flightSegments.forEach((segment, j) => {
                const {
                    airlineLogo,
                    operatingAirline,
                    marketingAirlineName,
                    flightNumber,
                    airlineName,
                    cabinClass,
                    departure,
                    duration,
                    arrival,
                    carryOnBaggage,
                    checkedInBaggage,
                    aircraftType,
                    layOver,
                } = segment;
                const {
                    departureAirportCode,
                    departureTime,
                    departureDate,
                    departureCountry,
                    departureCity,
                    departureTerminal,
                    departureAirportName,
                } = departure;
                const {
                    arrivalAirportCode,
                    arrivalTime,
                    arrivalDate,
                    arrivalCountry,
                    arrivalCity,
                    arrivalTerminal,
                    arrivalAirportName,
                } = arrival;
                const checkedInBaggageHtml = `
                    <span style="margin-right: 10px;">Check-in Baggage:
                        <strong style="color: #000000; font-weight: 200;">${checkedInBaggage}</strong>
                    </span>
                    `;

                const carryOnBaggageHtml = `
                    <span style="margin-right: 10px;">Cabin Baggage:
                        <strong style="color: #000000; font-weight: 200;">${carryOnBaggage}</strong>
                    </span>
                    `;

                const nextSegment = flightSegments[j + 1];
                let layoverHTML = '';
                if(nextSegment) {
                    layoverHTML = `
                        <div style="display: flex; justify-content: center; margin-block: 10px">
                            ${nextSegment.groundTime} Layover in ${nextSegment.departure.departureAirportName}, ${nextSegment.departure.departureCountry}
                        </div>
                    `
                }

                segmentHtml += `
                    <div style="font-family: Arial, sans-serif;">
                        <table class="flight-cardbox">
                            <tr>
                                <!-- Logo Section -->
                                <td 
                                    style="min-width: 200px;padding-left: 30px; padding-right: 30px; padding-top: 0px;   text-align: center; border: none; vertical-align: top;">
                                    <div style="display: flex; flex-direction: column; align-items: center;">
                                        <!-- Logo Section -->
                                        <div style="padding-top: 30px; padding-left: 30px; padding-right: 30px;">
                                            <img src="${airlineLogo}"
                                                alt="Logo" class="company-logo" style="max-width: 100%; height: auto;" />
                                        </div>

                                        <!-- Flight Details -->
                                        <div class="flight-details" style="margin-top: 10px; font-size: 11px; color: #333;">
                                            ${operatingAirline}-${flightNumber}${aircraftType ? ` Aircraft: ${aircraftType}` : ""}
                                        </div>

                                        <!-- Flight Name -->
                                        <div class="flight-name" style="font-size: 16px; color: #333;">
                                            ${airlineName}
                                        </div>
                                        <div class="economy-class"
                                            style="font-size: 12px; color: #FF3A3A; background-color: #FFF7F7; ">
                                            ${cabinClass} Class
                                        </div>
                                    </div>
                                </td>
                                <!-- Check-In Details Left -->
                                <td class="checkin-details-left">
                                    <span>${departureDate}</span>
                                    <p>${departureAirportCode} ${departureTime} </p>
                                    <small>${departureCity}, ${departureCountry}</small>
                                    <small>${departureTerminal} &nbsp;</small>
                                </td>

                                <!-- Day Plan Section -->
                                <td
                            style="padding-bottom: 20px; width: 25%; text-align: center; ">
                                    <div style="display: inline-block;">
                                        <svg width="25" height="25" viewBox="0 0 15 15" fill="none"
                                            xmlns="http://www.w3.org/2000/svg"> 
                                            <rect width="15" height="15" rx="7.5" fill="#FF4F4F" />
                                            <path
                                                d="M7.08497 6.65627L4.74684 4.44881L5.24296 4.1594L8.44011 5.95191L8.48715 5.97828L8.53373 5.95111L10.3255 4.9059C10.4398 4.83919 10.5573 4.82311 10.6835 4.85631C10.8097 4.88952 10.9038 4.96127 10.9702 5.07543L10.9702 5.07556C11.037 5.18992 11.053 5.3074 11.0198 5.43359C10.9866 5.55978 10.9149 5.6539 10.8007 5.72025L10.8006 5.72033L9.00882 6.76554L8.96224 6.79271L8.96205 6.84664L8.9487 10.512L8.45258 10.8014L7.6819 7.67955L7.65169 7.55721L7.54285 7.62071L5.75109 8.66592L5.71037 8.68967L5.70494 8.7365L5.60179 9.62628L5.26182 9.82459L4.95336 8.61547L4.9467 8.58937L4.92726 8.57072L4.02657 7.70707L4.36654 7.50875L5.19184 7.85692L5.23528 7.87524L5.276 7.85149L7.06775 6.80628L7.1766 6.74278L7.08497 6.65627Z"
                                                fill="white" stroke="white" stroke-width="0.188575" />
                                        </svg>
                                    </div>
                                    <p
                                        style="font-weight: 600; font-family: Inter, sans-serif; font-size: 14px; color: #333;   white-space: nowrap;">
                                        ${duration}</p>
                                </td>

                                <!-- Check-In Details Right -->
                                <td class="checkin-details-right" style="padding-right: 30px; text-align:right">
                                    <span>${arrivalDate}</span>
                                    <p>${arrivalAirportCode} ${arrivalTime} </p>
                                    <small>${arrivalCity}, ${arrivalCountry}</small>
                                    <small>${arrivalTerminal} &nbsp;</small>

                                </td>


                            </tr>
                        </table>

                    <div  style="justify-content: space-between; display: flex;" >
                        <div  class="baggage-details">
                            ${carryOnBaggageHtml}
                            ${checkedInBaggageHtml}
                        </div>
                        <span style="margin-right: 30px;" class="marketed">Marketed by:
                            <strong style="color: #000000; font-weight: 200;">${
                            marketingAirlineName || "N/A"
                            }</strong>
                        </span>
                    </div>
                    </div>
                    
                    ${layoverHTML}
                    `;
            if (layOver.status === true) {
                segmentHtml += `
                    <div style="display: flex; align-items: center; margin:0 25px ; ">
                        <hr style="flex-grow: 1; border: none; border-top: 1px dashed #ddd; margin: 0;" />
                        <span style="padding: 0 10px; font-weight: 100; font-size: 15px;  color: #898989;"> ${layOver?.layOver}</span>
                        <hr style="flex-grow: 1; border: none; border-top: 1px dashed #ddd; margin: 0;" />
                    </div>`;
            }
        });

        journeyHtml += `
            <div class="container" style="margin-bottom: 10px;">
                  <div class="title-card">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <span
                                style="font-size: 18px; font-weight: 400; font-family: Inter, sans-serif; margin-right: 10px; color: #000000;">
                                ${onPoint} - ${offPoint}
                            </span>
                            <strong style="margin-left: 0; font-family: Inter, sans-serif; font-weight: 300; font-size: 14px">•
                                ${startDate}
                            </strong>
                        </div>
                        <div>
                            <span
                                style="font-size: 18px; font-weight: 400; font-family: Inter, sans-serif; margin-right: 10px; color: #000000;">
                                Airline PNR:
                            </span>
                            <strong style="font-size: 18px; margin-left: 0; font-family: Inter, sans-serif; font-weight: 600; color: #000000;">
                                ${pnr}
                            </strong>

                        </div>
                    </div>
                  </div>
                  <hr style="border: none; border-top: 1px solid #ccc; width: 100%; margin: 0;">
                  <!-- </div> -->
                  ${segmentHtml}
            </div>
          `;
      });
      return journeyHtml;
    } catch (error) {
      console.log("Error in getJourneyHtml", { error });
      return journeyHtml;
    }
  }

  function isSeatDataAvailable(passengers) {
    return passengers.some( (passenger) => passenger.seat)
  }
};
