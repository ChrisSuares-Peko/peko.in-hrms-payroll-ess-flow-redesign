/* eslint-disable no-irregular-whitespace */
/* eslint-disable no-unused-vars */
const { socialIconCells, websiteLabel: toWebsiteLabel, v2Header, v2Footer, buildOtpBoxesHtml } = require("./emailTemplate/sharedLayout");

// key: OTP_MFA_LOGIN (service: AUTH) - matches others MS's already-shipped OTP_MFA_LOGIN
// design exactly (same purpose: corporate-user MFA login code, same subject "MFA-Auth Code"),
// reused here rather than a new Figma design since it's the same email for a different
// microservice's own local-auth flow.
exports.commonEmailOtpVerification = ({ otp, username, templateDetails }) => {
  const branding = templateDetails?.branding || 'Peko';
  const website = templateDetails?.website || 'https://www.peko.one';
  const websiteLabel = toWebsiteLabel(website);
  const logo = templateDetails?.logo;
  const socials = socialIconCells(templateDetails?.socials, { size: 24, padding: '0 16px' });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>MFA Code</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;margin:0;padding:0;">
      <div aria-label="MFA Code" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${v2Header({ website, websiteLabel, logo, branding })}
        <div style="background:#F9FAFB;margin:0 auto;max-width:680px;padding:0 20px;">
          <div style="background-color:#ffffff;border-radius:16px;padding:48px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
            <h2 style="margin:0 0 24px 0;font-size:28px;font-weight:700;color:#000000;">MFA Code</h2>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Hi, ${username}</p>
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0 0 20px 0;">Below is your Multi-Factor Authentication Code for Login. It's Valid for 2 minutes only.</p>
            ${buildOtpBoxesHtml(otp)}
            <p style="font-size:16px;line-height:1.6;color:#000000;margin:0;">Thanks,<br/>The Peko Team</p>
          </div>
        </div>
${v2Footer({ socials, branding })}
      </div>
    </body>
  </html>`;
};

exports.airLineTicketTemplate = (data,templateDetails) => {
  let passengerData = "";
  let bookingStatusHtml = "";

  if (data) {
    const { passengers, ticketDocument, bookingStatus } = data;
    passengerData = getPassengerDetails({
      passengers,
      ticketDocument,
    });

    data.totalAncillaryAmount = 0;
    passengers.forEach((passenger) => {
      if (passenger.ancillaries) {
        passenger?.ancillaries.forEach((ancillary) => {
          data.totalAncillaryAmount += ancillary.fare.sellingAmount;
        });
      }
    });
    if (bookingStatus === "TICKETED") {
      bookingStatusHtml = `Booking Successfully Confirmed`;
    } else if (bookingStatus === "OK TO TICKET") {
      bookingStatusHtml = `Booking Not Yet Confirmed. Please check again later.`;
    } else if (bookingStatus === "BOOKING FAILD") {
      bookingStatusHtml = `Booking Faild. Amount will be refunded`;
    } else if (bookingStatus === "REQUEST REFUND") {
      bookingStatusHtml = `Booking Cancelled`;
    } else {
      bookingStatusHtml =
        "Unknown Status. Please contact support for assistance.";
    }
  }

  return `
    <!DOCTYPE  html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
  
    <title>Ticket</title>
  
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
  
    <style type="text/css">
      @import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css");
  
      body {
        font-family: 'Roboto', sans-serif;
      }
  
      hr {
        /* margin: 1.875em 0; */
        border: none;
        border-bottom: solid 1px #000000;
      }
  
      .dashed-2 {
        border: none;
        height: 1px;
        background: #000;
        background: repeating-linear-gradient(90deg, #000, #000 3px, transparent 3px, transparent 6px);
      }
  
      .line {
        width: 40%;
        text-align: center;
        border-bottom: 2px dotted rgb(165, 165, 165);
        line-height: 0.1em;
        margin: auto
      }
  
      .layover {
        background: #fff;
        padding: 0 10px;
      }
  
      /* ul {
        list-style-position: inside;
        padding-left: 0;
      } */
    </style>
  </head>
  
  <body>
    <div class=" mt-4">
      <div class="card">
        <div class="card-body">
          <div class=" mb-5 mt-3">
            <div class="row d-flex align-items-baseline">
              <div class="col-3">
                <p style="font-size: 35px;"> <strong>Your ticket</strong></p>
              </div>
              <div class="col-6">
                <span class="">Ticket ID -  ${data.ticketDocument[0].ticketDocNbr
    } </span>
                <span class="ps-3">Booking Id: ${data.bookingReferenceId}</span>
              </div>
              <div class="col-3 d-flex justify-content-center align-items-center">
                <img src="https://peko.one/wp-content/uploads/2022/03/Untitled-design3.png" height="35" alt="" srcset="">
              </div>
  
            </div>
            Booking status : ${bookingStatusHtml}
            <div>
            ${data?.flightDetails}
            </div>
  
            <!-- table -->
            <div class="container mt-5">
              <table class="table table-bordered lh-lg">
                <thead>
                  <tr>
                    <th>TRAVELLERS</th>
                    <th>AIRLINE PNR</th>
                    <th>TICKET NO.</th>
                  </tr>
                </thead>
                <tbody>
                  ${passengerData}
  
                </tbody>
              </table>
              <p>TIP: The air inside airplanes is dry, so drink nonalcoholic, decaffeinated beverages and water to avoid becoming dehydrated.</p>
  
              <hr>
            </div>
            <!-- ABOUT THIS TRIP -->
            <div>
              <h6>ABOUT THIS TRIP</h6>
              <ul class="lh-lg">
                <li>
                  Note: Except for medical devices, electronic devices which are
                  larger than a cell phone/smart phone cannot be carried in the
                  cabin of the aircraft.
                </li>
                <li>
                  Note: Only cell phones of dimension Length: 16cm x Width: 9.3cm
                  x Depth: 1.5cm are allowed in the cabin baggage. Please carry
                  all other electronic equipment inside check-in baggage.
                </li>
                <li>
                  Use your Trip ID for all communication with ${templateDetails?.branding} about this booking
                </li>
                <li>
                  Please reach the airport 4 hours before the departure time. Check-in counters at the airport close 2
                  hours before departure
                </li>
                <li>
                  Your carry-on baggage shouldn't weigh more than 7kg
                </li>
                <li>
                  Carry photo identification, you will need it as proof of identity while checking-in
                </li>
                <li>
                  Kindly ensure that you have the relevant visa, immigration
                  clearance and travel with a passport, with a validity of at
                  least 6 months.
                </li>
                <li>
                  For hassle free processing, cancel/amend your tickets with ${templateDetails?.branding}
                  instead of doing so directly with Airline
                </li>
              </ul>
            </div>
  
            <!-- FARE BREAKUP -->
  
            <div>
              <h6>FARE BREAKUP</h6>
              <table>
                <tbody class="lh-lg">
                  <tr>
                    <td>
                      Base Fare:
                    </td>
                    <td class="ps-3"> ${data.fare.baseFare
    } INR</td>
                  </tr>
                  
                 
                  <tr>
                  <td>
                  Total Ancillary :
                  </td>
                  <td class="ps-3"> ${data?.totalAncillaryAmount} INR</td>
                </tr>
                  <tr>
                    <td>
                      Taxes and Fees:
                    </td>
                    <td class="ps-3"> ${(
      data?.fare?.totalTax
    )} INR</td>
                  </tr>
                  <tr>
                    <td>
                      Total Fare:
                    </td>
                    <td class="ps-3">${(data?.fare?.totalFare)} INR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <hr>
            <div class="row fs-5">
              <div class="col-4"> Emirates helpline 600 555555</div>
              <div class="col-4 text-center">www.peko.one </div>
              <div class="col-4 text-end">Peko Helpline? <br> Call 022 489 30373 </div>
  
            </div>
  
  
          </div>
        </div>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
  </body>
  
  </html>
    `;

  function getPassengerDetails(data) {
    let { passengers, ticketDocument } = data;
    let datas = [];

    for (let i = 0; i < passengers.length; i++) {
      datas.push({
        // name: `${passengers[i].passengerInfo.nameTitle} ${passengers[i].passengerInfo.givenName} ${passengers[i].passengerInfo.surname}`,
        name: `${passengers[i].passengerInfo.nameTitle} ${passengers[i].passengerInfo.givenName}`,
        passport: passengers[i]?.identityDocuments[0]?.idDocumentNumber,
        pnr: ticketDocument[i]?.airlineLocators[0]?.airlineLocator || "Pending",
        ticket: ticketDocument[i]?.ticketDocNbr || "Pending",
      });
    }
    let passengersHtml = "";
    datas.forEach((person,) => {
      passengersHtml += `
      <tr>
      <td>
        <div class="row">
          <div class="col-1">
            <i class="bi bi-person"></i>
          </div>
          <div class="col-11">
            <div>${person?.name}</div>
            <div>Passport no. <span>${person?.passport}</span> </div>
          </div>
        </div>
      </td>
      <td>${person?.pnr}</td>
      <td>${person?.ticket}</td>
      </tr>
        `;
    });

    return passengersHtml;
  }
};


//Generate email template for Invoice email send on corporate side
exports.generateAirlineTicketAndSendToMail = (data) => {
  return `
    
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    
    <head>
      <!--[if gte mso 9]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <title></title>
    
      <style type="text/css">
        @media only screen and (min-width: 620px) {
          .u-row {
            width: 600px !important;
          }
          .u-row .u-col {
            vertical-align: top;
          }
          .u-row .u-col-100 {
            width: 600px !important;
          }
        }
        
        @media (max-width: 620px) {
          .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
          }
          .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
          }
          .u-row {
            width: calc(100% - 40px) !important;
          }
          .u-col {
            width: 100% !important;
          }
          .u-col>div {
            margin: 0 auto;
          }
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        a[x-apple-data-detectors='true'] {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        table,
        td {
          color: #000000;
        }
      </style>
    
    
    
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
      <!--<![endif]-->
    
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding-right: 0px;padding-left: 0px;" align="center">
    
                                        <img align="center" border="0" src="https://assets.unlayer.com/projects/110176/1666981836761-Peko%20230x400-01.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                          width="179.2" />
    
                                      </td>
                                    </tr>
                                  </table>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding-right: 0px;padding-left: 0px;" align="center">
    
                                        <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                          width="150.8" />
                                      </td>
                                    </tr>
                                  </table>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 140%;"><strong>AIRLINE&nbsp; &nbsp;TICKET&nbsp;</strong></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Hi, ${data.user} </span></p>
                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">Thank you for choosing Peko.</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">We are pleased to provide you with your confirmed airline ticket. Attached to this email, you will find all the necessary details and information regarding your flight reservation.</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Peko Team</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #1e1e20; line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 16px; line-height: 25.6px; color: #ecf0f1;">This is an autogenerated mail, please don't reply</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyright ${new Date().getUTCFullYear()} Peko Platforms Private Limited,. All Rights Reserved</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      <!--[if mso]></div><![endif]-->
      <!--[if IE]></div><![endif]-->
    </body>
    
    </html>
  
    `;
};


exports.hotelTicketDetails = (guestDetailsData, bookingData) => {
  const {
    hotelName,
    address,
    checkInDate,
    checkOutDate,
    checkInTime,
    checkOutTime,
    nights,
    hotelAdultCount,
    hotelChildCount,
    hotelRoomCount,
    hotelContact,
  } = bookingData;
  let tableRow = ``;
  guestDetailsData.forEach((data) => {
    tableRow += `
                  <tr class="fs-5">
                    <td> ${data?.passengerInfo.nameTitle} ${data.passengerInfo.givenName} ${data.passengerInfo.surname}</td>
                    ${Array.isArray(data?.contact?.contactProvided) ? `<td>${data.contact.contactProvided[0]?.emailAddress[0]}</td>` : ""}
                    ${Array.isArray(data?.contact?.contactProvided)
        ? `<td>${data.contact.contactProvided[0]?.phone[0].phoneNumber}</td>`
        : ""
      }
                  </tr>
          `;
  });

  return `
              <div> <!-- hotel name --> <div class="my-4 px-3"> <hr style="border-top: dotted 1px;" /> <div class="py-2"> <span class="fs-5 fw-bolder"> ${hotelName}</span> <span class="fs-5 ps-4"> <i class="bi bi-calendar"></i>${checkInDate}</span> </div> <hr style="border-top: dotted 1px;" /> </div> <!-- booking details --> <div class="p-3"> <div class="row mt-2 mb-4 "> <div class="col-3 mt-1 d-flex align-items-center justify-content-center flex-column"> <div class="fs-4 ">${address}</div> </div> <div class="col-3 mt-1 d-flex align-items-center justify-content-center flex-column"> <div> <div class="fs-3">Check In</div> <div class="fs-5 fw-bolder">${checkInDate}</div> <div class="fs-3">${checkInTime}</div> </div> </div> <div class="col-3 mt-1 text-center d-flex align-items-center justify-content-center flex-column"> <button style="background-color: transparent; border: 1px solid lightgray; border-radius: 5px;" class="fw-bolder px-3 py-2">${nights}</button> <span class="text-secondary pt-3">${hotelRoomCount} | ${hotelAdultCount} | ${hotelChildCount} </span> </div> <div class="col-3 mt-1 d-flex align-items-center justify-content-center flex-column"> <div> <div class="fs-3">Check Out</div> <div class="fs-5 fw-bolder">${checkOutDate}</div> <div class="fs-3">${checkOutTime}</div> </div> </div> </div> </div> <div class="p-3 lh-lg" style="background-color: rgb(248, 248, 248);"> <div> <div class="fw-bold fs-5 py-1">Property Contact </div> <span class="fs-5">Email: ${hotelContact?.email || "Not available"}</span> <span class="ps-3 fs-5">Phone Number: ${hotelContact?.phoneNumber || "Not available"}</span> </div> <div class="bg-body-secondary"> <div class="fw-bold fs-5 py-1">Guest Details </div> <table class="table table-borderless "> <tbody id='tableBody'> ${tableRow} </tbody> </table> </div> </div> <!-- table --> <div class="container mt-3"> <div class="fw-bold fs-5 ">Room Type </div> <table class="table table-bordered"> <thead> <tr> <th>ROOM TYPE</th> <th>GUEST</th> <th>NO OF ROOM</th> <th>ADD ONS</th> </tr> </thead> <tbody> <tr> <td>Deluxe Room - Room Only </td> <td>${hotelAdultCount} & ${hotelChildCount}</td> <td>${hotelRoomCount}</td> <td></td> </tr> </tbody> </table> <p class="py-3"> <span class="text-danger">Cancellation Policy:</span> Any cancellation received will incur a charge of 84% of the booking value.Failure to arrive at your hotel or property will be treated as a NoShow and will incur a charge of 84% of the booking value (Hotel policy). </p> <hr> </div> </div>
      `;
};



exports.hotelTicketPDFTemplate = (data,templateDetails) => {
  return `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Ticket</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />

  <style type="text/css">
    body {
      font-family: 'Roboto', sans-serif;
    }
    hr {
      /* margin: 1.875em 0; */
      border: none;
      border-bottom: solid 1px #000000;
    }
    .dashed-2 {
      border: none;
      height: 1px;
      background: #000;
      background: repeating-linear-gradient(90deg, #000, #000 3px, transparent 3px, transparent 6px);
    }
    .line {
      width: 40%;
      text-align: center;
      border-bottom: 2px dotted rgb(165, 165, 165);
      line-height: 0.1em;
      margin: auto
    }

  </style>
</head>

<body>
  <div class="container mt-4 ">
    <div class="card ">
      <div class="card-body">
        <div class=" mb-5 mt-3">
          <div class="row d-flex align-items-baseline px-3">
            <div class="col-6">
              <p style="font-size: 40px;"><strong>Booking Confirmation</strong></p>
            </div>
            <div class="col-6 d-flex justify-content-end align-items-baseline">
              <img src="https://peko.one/wp-content/uploads/2022/03/Untitled-design3.png" height="35" alt="" srcset="">
            </div>
          </div>
          <div class="row d-flex align-items-baseline px-3">
            <span class="col-6 fs-3 fw-light">Supplier Id: <span class="fw-bold">${data?.supplierReferenceId}</span> </span>
            <span class="col-6 fs-3 fw-light">Booking Id: <span class="fw-bold">${data?.bookingReferenceId}</span> </span>
          </div>

          <!-- data hotel booking detail -->
          <div id="bookingDetails">${data?.hotelTicketHTML}</div>

         
          <!-- ABOUT THIS TRIP -->
          <div class="p-3">
            <h6>NOTES</h6>
            <ul class="">
              <li>
                IMPORTANT: At check in, you must present a valid photo ID with your address confirming the same name as
                the lead guest on the
                booking. For bookings paid with a credit card, you may also need to present the card used to make the
                payment. Failure to do so may
                result in the hotel requesting additional payment or your reservation not being honored©
              </li>
              <li>
                All rooms are guaranteed on the day of arrival. In the case of a no show, your room(s) will be released
                and you will be subject to the
                terms and conditions of the Cancellation/No-Show Policy specified at the time you made the booking as
                well as noted in the
                Confirmation Email©
              </li>
              <li>
                The total price for this booking does not include mini bar items, telephone usage, laundry service, etc.
                The property will bill you directly©
              </li>
              <li>
                In cases where Breakfast is included with the room rate, please note that certain properties may charge
                extra for children travelling with
                their parents. If applicable, the property will bill you directly. Upon arrival, if you have any
                questions, please verify with the property
              </li>

            </ul>
          </div>

          <!-- FARE BREAKUP -->

          <div class="p-3">
            <h6>FARE BREAKUP</h6>
            <table>
              <tbody class="lh-lg">
                <tr>
                  <td>
                    Base Fare:
                  </td>
                  <td class="ps-3"> ${data?.amount} INR</td>
                </tr>
                <tr>
                  <td>
                    Discounts And Cashbacks:
                  </td>
                  <td class="ps-3"> 0.00 INR</td>
                </tr>
                <tr>
                  <td>
                    Taxes and Fees:
                  </td>
                  <td class="ps-3"> 0.00 INR</td>
                </tr>
                <tr>
                  <td>
                    Total Fare:
                  </td>
                  <td class="ps-3"> ${data?.amount} INR</td>
                </tr>
              </tbody>
            </table>
          </div>
          <hr>
          <div class="row fs-5">
            <div class="col-4"> Emirates helpline 600 555555</div>
            <div class="col-4 text-center">www.peko.one </div>
            <div class="col-4 text-end">Peko Helpline? <br> Call 022 489 30373 </div>

          </div>


        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
  `;
};

exports.generateHotelTicketAndSendToMail = (data) => {
  return `
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    
    <head>
      <!--[if gte mso 9]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <!--<![endif]-->
      <title></title>
    
      <style type="text/css">
        @media only screen and (min-width: 620px) {
          .u-row {
            width: 600px !important;
          }
          .u-row .u-col {
            vertical-align: top;
          }
          .u-row .u-col-100 {
            width: 600px !important;
          }
        }
        
        @media (max-width: 620px) {
          .u-row-container {
            max-width: 100% !important;
            padding-left: 0px !important;
            padding-right: 0px !important;
          }
          .u-row .u-col {
            min-width: 320px !important;
            max-width: 100% !important;
            display: block !important;
          }
          .u-row {
            width: calc(100% - 40px) !important;
          }
          .u-col {
            width: 100% !important;
          }
          .u-col>div {
            margin: 0 auto;
          }
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        table,
        tr,
        td {
          vertical-align: top;
          border-collapse: collapse;
        }
        
        p {
          margin: 0;
        }
        
        .ie-container table,
        .mso-container table {
          table-layout: fixed;
        }
        
        * {
          line-height: inherit;
        }
        
        a[x-apple-data-detectors='true'] {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        table,
        td {
          color: #000000;
        }
      </style>
    
    
    
      <!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css?family=Cabin:400,700" rel="stylesheet" type="text/css">
      <!--<![endif]-->
    
    </head>
    
    <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #f9f9f9;color: #000000">
      <!--[if IE]><div class="ie-container"><![endif]-->
      <!--[if mso]><div class="mso-container"><![endif]-->
      <table style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #f9f9f9;width:100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr style="vertical-align: top">
            <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f9f9f9;"><![endif]-->
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:20px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding-right: 0px;padding-left: 0px;" align="center">
    
                                        <img align="center" border="0" src="https://assets.unlayer.com/projects/110176/1666981836761-Peko%20230x400-01.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 32%;max-width: 179.2px;"
                                          width="179.2" />
    
                                      </td>
                                    </tr>
                                  </table>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:40px 10px 10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="padding-right: 0px;padding-left: 0px;" align="center">
    
                                        <img align="center" border="0" src="https://cdn.templates.unlayer.com/assets/1597218650916-xxxxc.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 26%;max-width: 150.8px;"
                                          width="150.8" />
                                      </td>
                                    </tr>
                                  </table>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #e5eaf5; line-height: 140%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 140%;"><strong>HOTEL&nbsp; &nbsp;TICKET&nbsp;</strong></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #ffffff;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #ffffff;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 22px; line-height: 35.2px;">Hi, ${data.user} </span></p>
                                    <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">Thank you for choosing Peko.</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px;font-family:'Cabin',sans-serif;" align="left">
  
                                <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                  <p style="font-size: 14px; line-height: 160%;"><span style="font-size: 20px; line-height: 32px;">We are delighted to provide you with your confirmed hotel booking. Attached to this email, you will find all the necessary details and information regarding your reservation.</span></p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:33px 55px 60px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">Thanks,</span></p>
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 18px; line-height: 28.8px;">The Peko Team</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #e5eaf5;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #e5eaf5;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:41px 55px 18px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #1e1e20; line-height: 160%; text-align: center; word-wrap: break-word;">
                                    <p style="line-height: 160%; font-size: 14px;"><span style="font-size: 16px; line-height: 25.6px; color: #ecf0f1;">This is an autogenerated mail, please don't reply</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
    
              <div class="u-row-container" style="padding: 0px;background-color: transparent">
                <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: #003399;">
                  <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                    <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: #003399;"><![endif]-->
    
                    <!--[if (mso)|(IE)]><td align="center" width="600" style="background-color: #242222;width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;" valign="top"><![endif]-->
                    <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                      <div style="background-color: #242222;height: 100%;width: 100% !important;">
                        <!--[if (!mso)&(!IE)]><!-->
                        <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;">
                          <!--<![endif]-->
    
                          <table style="font-family:'Cabin',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Cabin',sans-serif;" align="left">
    
                                  <div style="color: #fafafa; line-height: 180%; text-align: center; word-wrap: break-word;">
                                    <p style="font-size: 14px; line-height: 180%;"><span style="font-size: 16px; line-height: 28.8px;">Copyright ${new Date().getUTCFullYear()} Peko Platforms Private Limited,. All Rights Reserved</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
    
                          <!--[if (!mso)&(!IE)]><!-->
                        </div>
                        <!--<![endif]-->
                      </div>
                    </div>
                    <!--[if (mso)|(IE)]></td><![endif]-->
                    <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                  </div>
                </div>
              </div>
    
    
              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
            </td>
          </tr>
        </tbody>
      </table>
      <!--[if mso]></div><![endif]-->
      <!--[if IE]></div><![endif]-->
    </body>
    
    </html>
  `;
};


exports.generatePaymentSuccessEmailLogistics = ({
  name,
  transactionId,
  speedOrNormal,
  sender,
  receiver,
  trackingNo,
  amount,
  qunatity,
  host,
}) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="padding:0;Margin:0"> <head> <meta charset="UTF-8"> <meta content="width=device-width, initial-scale=1" name="viewport"> <meta name="x-apple-disable-message-reformatting"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta content="telephone=no" name="format-detection"> <title>Shipment Service</title><!--[if (mso 16)]> <style type="text/css"> a {text-decoration: none;} </style> <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--><!--[if !mso]><!-- --> <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet"><!--<![endif]--> <style type="text/css"> #outlook a { padding:0; } .ExternalClass { width:100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height:100%; } .es-button { mso-style-priority:100!important; text-decoration:none!important; transition:all 100ms ease-in; } a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important; } .es-button:hover { background:#555555!important; border-color:#555555!important; } .es-desk-hidden { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all; } @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:left } h3 { font-size:20px!important; text-align:left } h1 a { text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:30px!important } h2 a { text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:20px!important } h3 a { text-align:left } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:16px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:16px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:17px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:17px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:inline-block!important } a.es-button, button.es-button { font-size:14px!important; display:inline-block!important; padding:15px 25px 15px 25px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } } </style> </head> <body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"> <div class="es-wrapper-color" style="background-color:#F1F1F1"><!--[if gte mso 9]> <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f1f1f1"></v:fill> </v:background> <![endif]--> <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F1F1F1"> <tr style="border-collapse:collapse"> <td valign="top" style="padding:0;Margin:0"> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#333333;width:600px" cellspacing="0" cellpadding="0" bgcolor="#333333" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#020101" style="padding:0;Margin:0;padding-left:20px;padding-right:35px;background-color:#020101;border-radius:5px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:545px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#fef7f7;font-size:20px"><br></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:0;Margin:0;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td class="es-m-txt-c" align="center" style="padding:0;Margin:0;padding-bottom:15px;padding-top:20px"><h2 style="Margin:0;line-height:26px;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:22px;font-style:normal;font-weight:bold;color:#0a9f43">Your shipment is booked</h2></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Hi ${name},</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><br>Thank you for your order. Your estimated delivery date is indicated below.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">If you would like to view the status of your order or make any changes to it, please visit logistics on peko.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><br></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-bottom:5px;padding-top:10px;padding-left:40px;padding-right:40px;background-color:#efefef"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:30px;color:#181818;font-size:20px"><strong>Order Summary</strong></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Placed on:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${new Date().toLocaleString()}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#666666;font-size:15px">Transaction ID:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${transactionId}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Service :</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">Shipment services</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Shipping Details:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${speedOrNormal} Parcel, ${sender.City
    } to ${receiver.City
    }</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Tracking No:</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">${trackingNo}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:5px;padding-bottom:20px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Paid Amount :</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#181818;font-size:15px">₹ ${amount}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:25px;padding-bottom:25px;padding-left:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><!--[if mso]><a href="" target="_blank" hidden> <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="" style="height:47px; v-text-anchor:middle; width:217px" arcsize="50%" stroke="f" fillcolor="#09090a"> <w:anchorlock></w:anchorlock> <center style='color:#ffffff; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:14px; font-weight:700; line-height:14px; mso-text-raise:1px'>Track your shipment</center> </v:roundrect></a> <![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-style:solid;border-color:#26A4D3;background:#09090a;border-width:0px;display:inline-block;border-radius:50px;width:auto;mso-hide:all"><a href="${host}/logistics/track?trackingNo=${trackingNo}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;transition:all 100ms ease-in;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#09090a;border-radius:50px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:17px;width:auto;text-align:center;padding:15px 30px 15px 30px;mso-padding-alt:0;mso-border-alt:10px solid #09090a">Track your shipment</a></span><!--<![endif]--></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px"> <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" valign="top" style="padding:0;Margin:0;width:520px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#000000;font-size:15px"><strong>Parcel Details</strong></p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-bottom:10px;padding-top:15px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><strong>Shipper</strong></p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><strong>Receiver</strong></p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><b>Weight</b></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#1e1b1b;font-size:14px"><b>Total Amount (INR)</b></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:40px;padding-right:40px"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p0r es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${sender.Line1
    }</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${sender.Line2
    }</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${sender.PostCode
    }</p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:135px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${receiver.Line1
    }</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${receiver.Line2
    }<br>${receiver.PostCode
    }<br></p></td> </tr> </table></td> <td class="es-hidden" style="padding:0;Margin:0;width:20px"></td> </tr> </table><!--[if mso]></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">${qunatity} Grams</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:115px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;width:115px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">₹ ${amount}</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Service Type</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px"><strong>${speedOrNormal} Parcel</strong></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">Additional Services</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#555555;font-size:15px">N/A</p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#efefef" style="Margin:0;padding-top:10px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#efefef"><!--[if mso]><table style="width:520px" cellpadding="0" cellspacing="0"><tr><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-left" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> <tr style="border-collapse:collapse"> <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#1e1b1b;font-size:15px"><strong>Total:</strong></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td><td style="width:20px"></td><td style="width:250px" valign="top"><![endif]--> <table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right"> <tr style="border-collapse:collapse"> <td align="left" style="padding:0;Margin:0;width:250px"> <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="right" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#333333;font-size:15px"><strong>₹ ${amount}</strong></p></td> </tr> </table></td> </tr> </table><!--[if mso]></td></tr></table><![endif]--></td> </tr> </table></td> </tr> </table> <table cellpadding="0" cellspacing="0" class="es-footer" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-footer-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#ffffff" style="padding:40px;Margin:0;background-color:#ffffff"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"><img class="adapt-img" src="" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="110" height="45"></a></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">This email was sent to you from company email address</p></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;padding-bottom:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px"><a href="https://peko.one/in/privacy-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Privacy Policy</a>&nbsp;|&nbsp;<a href="https://peko.one/in/cookie-policy/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Cookie Policy</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/platform-agreement" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Terms of Use</a>&nbsp;|&nbsp;&nbsp;<a href="https://peko.one/in/refund-policy" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px">Refund & Cancellation Policy</a><a target="_blank" class="unsubscribe" href="" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#666666;font-size:12px"></a></p></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</p></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"> <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#292828;width:600px" cellspacing="0" cellpadding="0" bgcolor="#292828" align="center"> <tr style="border-collapse:collapse"> <td align="left" bgcolor="#0c0c0c" style="Margin:0;padding-top:15px;padding-bottom:20px;padding-left:40px;padding-right:40px;background-color:#0c0c0c"> <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;width:520px"> <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px"><a href="https://peko.one/in" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#ffffff;font-size:15px" target="_blank">www.peko.one</a></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:23px;color:#ffffff;font-size:15px"><br></p></td> </tr> <tr style="border-collapse:collapse"> <td align="center" style="padding:0;Margin:0;font-size:0"> <table class="es-table-not-adapt es-social" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> <tr style="border-collapse:collapse"> <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://x.com/PekoIndia" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Twitter" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d" alt="Tw" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td> <td valign="top" align="center" style="padding:0;Margin:0;padding-right:10px"><a target="_blank" href="https://www.instagram.com/peko.india" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Instagram" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026" alt="Inst" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td> <td valign="top" align="center" style="padding:0;Margin:0"><a target="_blank" href="https://www.linkedin.com/company/pekoindia/" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#26A4D3;font-size:15px"><img title="Linkedin" src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd" alt="In" width="24" height="24" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"></a></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table></td> </tr> </table> </div> </body> </html>`;
};