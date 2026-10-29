/* eslint-disable no-irregular-whitespace */
/* eslint-disable no-unused-vars */
const { customLog } = require("../../loggerHelper");
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, v2SuccessBadge } = require("../../emailTemplate/sharedLayout");

// Generate email template for flight booking confirmation, sent on the corporate side.
// v2 design matches AE's own migrated version, but the itinerary/passenger sections are
// wired to IN's real data shape (verified against AE, which doesn't map 1:1 onto IN here):
//   - PNR is read from the top-level `pnr` param (the real flight PNR, `ticketDetails.PNR`),
//     not `passengersDetails[0].pnr` like AE does - IN's passengersDetails[].pnr is actually
//     a per-passenger PaxId (services/flight.js:182), a different value that happens to share
//     the field name. Using AE's field here would mislabel a passenger ID as the flight PNR.
//   - `lcc` (low-cost-carrier flag) still conditionally hides the per-passenger ticket number,
//     matching IN's existing real behaviour - AE's version has no such distinction and always
//     shows the ticket number.
//   - Confirmation number uses IN's already-formatted `bookingIdLabel` ("Confirmation Number:
//     {id}" or '' when unavailable) since IN's ticketData carries no raw bookingReferenceId
//     field to match AE's separate label+value styling.
exports.flightConfirmationTemplate = (
  { userName, passengersDetails, flightDetails, inbountFlightDetails, pnr, inbountPNR, lcc, bookingIdLabel },
  templateDetails
) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });

  let journeyHtml = getJourneyHtml(flightDetails, bookingIdLabel, pnr);
  if (inbountFlightDetails && inbountFlightDetails.length) {
    journeyHtml += getJourneyHtml(inbountFlightDetails, null, inbountPNR || pnr);
  }
  let passengersHtml = getPassengersHtml(passengersDetails, lcc);
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your booking is confirmed.</title>
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
      <div aria-label="Your booking is confirmed." aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
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
                                  <div class="peko-heading" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your booking is confirmed.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">Dear ${userName}, We are pleased to inform you that your flight ticket has been confirmed successfully. We have attached the ticket details. We wish you a successful trip.</div>
                                </td>
                              </tr>

                              <!-- journey -->
                              ${journeyHtml}

                              <!-- TRAVELLERS -->
                              <tr>
                                <td align="left" style="padding-bottom:12px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#6B7280;">Travellers</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="padding-bottom:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>${passengersHtml}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <!-- manage booking -->
                              <tr>
                                <td align="left" style="padding-bottom:24px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#ff3333" style="border-radius:12px;">
                                          <a href="${templateDetails?.baseUrl}/corporate-travel/airline/manage-bookings" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Manage Booking</a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>

                              <tr>
                                <td align="left" class="content-text" style="padding-bottom:16px;padding-top:8px;border-top:1px solid #E5E7EB;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-top:16px;">Thank you for using ${branding}. If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:#FF4F4F;text-decoration:underline;"><font color="#FF4F4F"><u>reach@peko.one</u></font></a>. We assure you of our best services at all times.</div>
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
  function getJourneyHtml(flightDetails, bookingIdLabel, pnr) {
    let journeyHtml = "";
    try {
      flightDetails.forEach((journey, i) => {
        const { stopQuantity, onPoint, offPoint, flightSegments, startDate } = journey;

        let segmentHtml = "";
        flightSegments.forEach((segment, j) => {
          const {
            airlineLogo,
            operatingAirline,
            flightNumber,
            airlineName,
            cabinClass,
            departure,
            duration,
            arrival,
            carryOnBaggage,
            checkedInBaggage,
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

          segmentHtml += `
                              <tr>
                                <td align="left" style="padding-bottom:4px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#ff3333;">${airlineName} ${operatingAirline}${flightNumber} - ${cabinClass} Class</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding-bottom:4px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:22px;color:#000000;">${departureAirportCode} <strong>${departureTime} ✈ ${arrivalTime}</strong> ${arrivalAirportCode}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding-bottom:12px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#000000;">Departure: <strong>${departureDate}</strong> &nbsp; Arrival: <strong>${arrivalDate}</strong></div>
                                </td>
                              </tr>`;
          if (layOver.status === true) {
            segmentHtml += `
                              <tr>
                                <td align="center" style="padding-bottom:12px;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#696969;"><strong>${layOver?.layOver}</strong></div>
                                </td>
                              </tr>`;
          }
        });

        journeyHtml += `
                              <tr>
                                <td align="left" style="padding-bottom:16px;border-top:1px solid #E5E7EB;padding-top:20px;">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tbody>
                                      <tr>
                                        <td align="center" style="padding-bottom:4px;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:17px;color:#000000;">${onPoint} → ${offPoint}</div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td align="center" style="padding-bottom:8px;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#838383;">${startDate}</div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td align="center" style="padding-bottom:4px;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;color:#242424;"><strong>PNR: ${pnr || 'N/A'}</strong></div>
                                        </td>
                                      </tr>
                                      ${bookingIdLabel ? `
                                      <tr>
                                        <td align="center" style="padding-bottom:12px;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#242424;">${bookingIdLabel}</div>
                                        </td>
                                      </tr>` : ''}
                                      ${segmentHtml}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>`;

      });
      return journeyHtml;
    } catch (error) {
      customLog(null, "error", { message: "Error in getJourneyHtml", error: error });
      return journeyHtml;
    }
  }
  function getPassengersHtml(passengersDetails, lcc) {
    try {
      return passengersDetails.length && passengersDetails.map((passenger, i) => {
        return `
                                      <tr>
                                        <td align="left" style="padding:6px 0;">
                                          <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:14px;color:#0f0f0f;"><strong>${passenger.name} ${passenger.ptc}${!lcc ? ` ・ eTicket No: ${passenger.ticket}` : ''}</strong></div>
                                        </td>
                                      </tr>`
      }).join('')
    } catch (error) {
      return ''
    }
  }
};
