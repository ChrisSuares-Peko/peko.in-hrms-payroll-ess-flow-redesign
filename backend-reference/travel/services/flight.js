/* eslint-disable no-unused-vars */
/* eslint-disable no-inner-declarations */
const axios = require("axios");

const moment = require("moment");
const { formatNumberWithLocalString, formattedDateTime, toTitleCase, snakeCaseToSentenceCase, customTitlecase, maskPhone, maskEmail, amountPrecision } = require("../utils/formatter");
const { retrieveCountryName } = require("../utils/airlineData");
const { findOneOrderById } = require("../models/use-cases/order");
const { flightBooking } = require("../models/entities/flight");
const credential = require("../models/entities/credential");
const { customLog } = require("../utils/loggerHelper");
const { fetchAsDataUri, FALLBACK_AIRLINE_ICON_DATA_URI } = require("../utils/imageToDataUri");

// Inline each segment's airline logo as a data URI so it renders in the headless-PDF ticket
// without the browser needing network egress to the logo CDN — the same reason the partner
// logo is inlined. On failure it falls back to a neutral airline icon (NOT the Peko mark — that
// belongs only to the header), so a segment never shows Peko branding or a broken image. Runs
// concurrently; fetchAsDataUri caches by URL, so repeat airlines are free.
const inlineSegmentLogos = async (journeys) => {
  if (!Array.isArray(journeys)) return;
  await Promise.all(
    journeys.flatMap((journey) =>
      (journey?.flightSegments || []).map(async (segment) => {
        segment.airlineLogo = await fetchAsDataUri(
          segment.airlineLogo,
          FALLBACK_AIRLINE_ICON_DATA_URI
        );
      })
    )
  );
};

exports.generateCancelledExportData = async (data) => {
  try {

    let finalData = []
    data.rows.forEach(function (limitData) {
      const payments = [
        {
          orderAmount: limitData.order.amountInINR || 'N/A',
          paymentMode: limitData?.order?.paymentMode || 'N/A',
        },
      ];
      const corporateTxnIds = [limitData?.transaction?.corporateTxnId];
      const status = [limitData?.transaction?.status || 'N/A'];
      const refundedAmounts = []
      if (limitData?.refundedAmount) refundedAmounts.push(limitData?.refundedAmount);

      if (limitData?.flightModifiedBookings.length > 0) {
        limitData.flightModifiedBookings.forEach((booking) => {
          const cancellationFlow =
            booking?.modificationStatus === 'REQUESTED_FOR_CANCELLATION' ||
            booking?.modificationStatus === 'CANCELLED_AND_REFUNDED';
          if (cancellationFlow) {
            corporateTxnIds.push(booking?.transaction?.corporateTxnId);
            payments.push({
              orderAmount: booking?.additionalPayment,
              paymentMode: booking?.order?.paymentMode,
            });
            status.push(booking?.transaction?.status || 'N/A');

            if (booking?.refundedAmount) {
              refundedAmounts.push(booking?.refundedAmount);
            }
          }
        });
      }

      let amounts = payments.map(({ orderAmount, paymentMode }, index) => (
        `₹ ${formatNumberWithLocalString(orderAmount)} - ${toTitleCase(paymentMode)}`
      ))
      let refundedAmount = refundedAmounts.map((amt, index) => (
        `₹ ${formatNumberWithLocalString(amt)}`
      ))


      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
        "Corporate Name": limitData?.credential?.name || 'Not Available',
        "Corporate ID": limitData?.credential?.username || 'Not Available',
        "Transaction ID": corporateTxnIds.join(', '),
        "Amount": amounts.join(', '),
        "Payment Status": status.join(', '),
        "Refunded": refundedAmount.join(', '),
      })

    })
    return finalData
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error: error });
    throw new Error("Something went wrong while generating report");
  }
}
exports.generateModifiedExportData = async (data) => {
  try {
    let finalData = []
    data.rows.forEach(function (limitData) {
      finalData.push({
        Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
        "Corporate Name": limitData?.credential?.name || 'Not Available',
        "Corporate ID": limitData?.credential?.username || 'Not Available',
        "Transaction ID": limitData?.transaction?.corporateTxnId || limitData?.flightBooking?.transaction?.corporateTxnId || 'Not Available',
        "Confirmation Number": limitData?.flightBooking?.bookingReferenceId || 'Not Available',
        "Payment Status": snakeCaseToSentenceCase(limitData?.modificationStatus || 'Not Available'),
      })
    })
    return finalData
  } catch (error) {
    console.log({ error })
    throw new Error('Something went wrong while generating report')
  }
}

exports.createDataForFlightTicket = async (data, serviceDetails) => {
    const { orderId, passengers, EndUserIp, TokenId, TraceId, PNR, inbountPNR} = data
    const order = await findOneOrderById(orderId);
    const leadPax = passengers.filter( (passenger)=>{
      return passenger.IsLeadPax
    })[0]

    if(!leadPax) {
      throw new Error("Unable to find lead passenger"); 
    }

    const firstName = leadPax.FirstName; 
    const lastName = leadPax.LastName
    
    const outbountResult = await exports.retrieveBooking({token: TokenId, BookingId: null, PNR, firstName, lastName, serviceDetails})
    if(!outbountResult || !outbountResult.status) {
        throw new Error("Unable to fetch ticket details (outbount)")
    }

    let inbountResult; 
    if(inbountPNR) {
        inbountResult = await exports.retrieveBooking({token: TokenId, BookingId: null, PNR: inbountPNR, firstName, lastName, serviceDetails})
        if(!inbountResult || !inbountResult.status) {
            throw new Error("Unable to fetch ticket details (inbount)")
        }
    }

    let surcharge = order.surcharge;
    let convenienceFee = order.surcharge
    // const { passengers } = order.Response.Response.FlightItinerary.Passenger
    const flightBookingData = await flightBooking.findOne(
      {
        where: { orderId: orderId },
        include: [
          {
            model: credential,
          },
        ],
      }
    );

    let {
      BookingId: bookingReferenceId,
      fare,
      journey,
      bookingStatus,
    } = flightBookingData;
    const flightDetails = forTicketFlightDetail(journey)

    let inbountFlightDetails = null;
    if(inbountPNR) {
        inbountFlightDetails = forTicketFlightDetail(inbountResult.booking.Segments)
    }

    // Inline airline logos as data URIs so they render in the PDF (see helper above).
    await inlineSegmentLogos(flightDetails);
    await inlineSegmentLogos(inbountFlightDetails);


    const ticketDetails = outbountResult.booking; 
    const inbountTicketDetails = inbountResult?.booking; 

    // formatting passenger details
    let passengersDetails = ticketDetails.Passenger.map((passenger, i) => {
      return {
        ptc: passenger.PaxType === 1 ? "Adult" : passenger.PaxType === 2 ? "Child" : "Infant",
        name: `${passenger.Title}. ${passenger.FirstName} ${passenger.LastName}`,
        passport: passenger.PassportNo,
        pnr: passenger.PaxId,
        ticket: passenger?.Ticket?.TicketNumber || "Pending",
        nameWithoutTitle: `${passenger.FirstName} ${passenger.LastName}`,
        seat: passenger.SeatDynamic
      };
    });

    // adding inbount ticket number and seat details to passenger details
    if(inbountResult) {
        passengersDetails = passengersDetails.map( passenger => {
            const outbountPassenger = inbountTicketDetails.Passenger.filter( curr => {
                return `${curr.Title}. ${curr.FirstName} ${curr.LastName}` === passenger.name
            })[0]
            return {
                inbountTicketNumber: outbountPassenger?.Ticket?.TicketNumber || "Pending",
                inbountSeat: outbountPassenger?.SeatDynamic,
                ...passenger
            }
        })
    }

    const firstPassenger = `${leadPax.FirstName} ${leadPax.LastName}`;
    const onPoint = ticketDetails.Origin;
    const offPoint = ticketDetails.Destination;
    const pdfName = `Flight Ticket – ${firstPassenger} (${onPoint}-${offPoint})`;

    let bookingStatusMessage = "";
    if (ticketDetails.Status === 5) {
      bookingStatusMessage = `Confirmed`;
    } else if (ticketDetails.Status === 4) {
      bookingStatusMessage = `Not Yet Confirmed. Please check again later.`;
    } else if ([2, 3, 4, 8, 6, 9].includes(ticketDetails.Status)) {
      bookingStatusMessage = `Failed. Amount will be refunded`;
    } else {
      bookingStatusMessage = "Pending";
    }

    const fareData = ticketDetails.Fare;
    let totalAncillaryAmount = fareData.TotalBaggageCharges + fareData.TotalMealCharges + fareData.TotalSeatCharges;
    const inbountFare = inbountTicketDetails?.Fare;
    if(inbountFare) {
        totalAncillaryAmount += inbountFare.TotalBaggageCharges + inbountFare.TotalMealCharges + inbountFare.TotalSeatCharges;
    }

    function formatDateToDDMMYYYY(dateString) {
      // input format: "2024-11-01" output: "01-11-2024"
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    }

    const tempTotalFare = fareData.PublishedFare + (inbountFare?.PublishedFare || 0);
    // What was paid for the trip (before coupon, without the platform fee) over TBO's fare is our markup; a part-refunded order keeps TBO's fare.
    const markup = order.status === "REFUNDED" ? 0 : Math.max(0, amountPrecision(Number(order.amountInINR) - (Number(surcharge) || 0) - tempTotalFare));
    let baseFare = fareData.BaseFare + (inbountFare?.BaseFare || 0) + markup;
    let taxAmount = fareData.Tax + (inbountFare?.Tax || 0);
    let transactionFee = fareData.OtherCharges + (inbountFare?.OtherCharges || 0);
    let discountsAndCashbacks = fareData.Discount + (inbountFare?.Discount || 0);
    const totalFareWithSurcharge = Number(tempTotalFare) + markup + (Number(surcharge) || 0);
    const bookedDate = moment(ticketDetails.Passenger[0].Ticket?.IssueDate).format("ddd MMM D YYYY")
    const bookingIdLabel = bookingReferenceId ? `Confirmation Number: ${bookingReferenceId}` : '';

    const isInternational = isInternationalJourney([
      ...(flightDetails || []),
      ...(inbountFlightDetails || []),
    ]);
    const contactDetails = flightBookingData?.userContactDetails || {};

    const ticketData = {
      userName: flightBookingData.credential.name || 'User',
      ticketReceiverEmailId: flightBookingData?.userContactDetails?.email || flightBookingData?.credential?.email || '',
      isInternational,
      contactPhone: maskPhone(contactDetails.phone, contactDetails.phoneCode),
      contactEmail: maskEmail(contactDetails.email),
      flightDetails: flightDetails,
      inbountFlightDetails: inbountFlightDetails,
      surcharge: formatNumberWithLocalString(surcharge),
      transactionFee: formatNumberWithLocalString(transactionFee),
      passengersDetails,
      bookingStatus,
      fare,
      discountsAndCashbacks: formatNumberWithLocalString(discountsAndCashbacks),
      totalFare: formatNumberWithLocalString(totalFareWithSurcharge),
      baseFare: formatNumberWithLocalString(baseFare),
      convenienceFee: formatNumberWithLocalString(convenienceFee),
      bookedDate,
      ticketDocument: {},
      pdfName,
      pnr: ticketDetails.PNR,
      inbountPNR: inbountTicketDetails?.PNR,
      lcc: ticketDetails.IsLCC,
      inbountLCC: inbountTicketDetails?.IsLcc,
      bookingIdLabel,
      bookingStatusMessage,
      passengers,
      totalAncillaryAmount: formatNumberWithLocalString(totalAncillaryAmount),
      taxAmount: formatNumberWithLocalString(taxAmount),
    };
    return ticketData
};

exports.retrieveBooking = async function(params) {
    try {
        let { token, BookingId, PNR, firstName, lastName, serviceDetails } = params
        let data = JSON.stringify({
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: token, 
            BookingId, 
            PNR, 
            "FirstName": firstName, 
            "LastName": lastName
        });
        let config = {
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/GetBookingDetails`,
            headers: {
                'Content-Type': 'application/json',
                // 'X-API-KEY': serviceDetails.X_API_KEY,
                // 'conversationId': conversationId,
                // 'sessionId': await getSession({ serviceDetails, userId })
            },
            data: data
        };

        customLog(params?.LogTraceId, "info", {
            message: "[airline:GetBookingDetails] request",
            endpoint: "GetBookingDetails",
            bookingId: BookingId,
            pnr: PNR,
        }, "VENDOR")
        let result = await axios(config)
        customLog(params?.LogTraceId, "info", {
            message: "[airline:GetBookingDetails] response",
            endpoint: "GetBookingDetails",
            statusCode: result?.status,
            bookingId: result?.data?.Response?.FlightItinerary?.BookingId,
            pnr: result?.data?.Response?.FlightItinerary?.PNR,
            status: result?.data?.Response?.FlightItinerary?.Status,
            vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
        }, "VENDOR")
        if (!result && !result?.data || result.data.Response.Error.ErrorCode) throw new Error('Failed to retrieve booking data!');

        return {
            status: true,
            message: 'Success',
            booking: {
                ...result.data.Response.FlightItinerary
            }
        }
    } catch (error) {
        customLog(params?.LogTraceId, "error", {
            message: "[airline:GetBookingDetails] error",
            endpoint: "GetBookingDetails",
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
        }, "VENDOR")
        let errorData = error?.response?.data
        return {
            status: false,
            message: 'Something went wrong while retrieve booking!',
            errorData
        }

    }
}

function forTicketFlightDetail(journey) {
    let updatedJourney = [];
    for(let i = 1; i<=2 ; i++) {
      const segments = journey.filter( (j => {
        return j.TripIndicator === i;
      }))

      if(segments.length === 0) break;
      const firstFlight = segments[0]
      const lastFlight = segments[segments.length - 1]
      let updated = {};
      const onPoint = firstFlight.Origin.Airport.CityName;
      const offPoint = lastFlight.Destination.Airport.CityName;
      updated = { 
        onPoint, 
        offPoint,  
        startDate: moment(firstFlight.Origin.DepTime).format("ddd MMM D YYYY")
      };

      const paxTypeDetails = { ADT: "Adult", CHD: "Child", INF: "Infant" };
      updated.flightSegments = segments.map( (flight) => {
        return {
          airlineLogo: `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${flight.Airline.AirlineCode}.gif?alt=media`,
          operatingAirline: flight.Airline.AirlineName, 
          airlineName: flight.Airline.AirlineName,
          marketingAirline: flight.Airline.AirlineName,
          marketingAirlineName: flight.Airline.AirlineName,
          flightNumber: flight.Airline.FlightNumber, 
          cabinClass: getCabinClass(flight.CabinClass),
          departure: {
            departureAirportCode: flight.Origin.Airport.AirportCode,
            departureTime: moment(flight.Origin.DepTime).format("HH:mm"),
            departureDate: moment(flight.Origin.DepTime).format("ddd MMM D YYYY"),
            departureCountry: flight.Origin.Airport.CountryName,
            departureCity: flight.Origin.Airport.CityName,
            departureTerminal: flight.Origin.Airport.Terminal
              ? `Terminal ${flight.Origin.Airport.Terminal}`
              : `N/A`,
            departureAirportName: flight.Origin.Airport.AirportName,
          },
          arrival: {
            arrivalAirportCode: flight.Destination.Airport.AirportCode,
            arrivalTime: moment(flight.Destination.ArrTime).format("HH:mm"),
            arrivalDate: moment(flight.Destination.ArrTime).format("ddd MMM D YYYY"),
            arrivalCountry: flight.Destination.Airport.CountryName,
            arrivalCity: flight.Destination.Airport.CityName,
            arrivalTerminal: flight.Destination.Airport.Terminal
              ? `Terminal ${flight.Destination.Airport.Terminal}`
              : `N/A`,
            arrivalAirportName: flight.Destination.Airport.AirportName,
          },
          duration: formatMinutesToHour(flight.Duration),
          groundTime: formatMinutesToHour(flight.GroundTime),
          // Fall back to the standard Indian-carrier cabin allowance when the fare has no value.
          carryOnBaggage: [flight.CabinBaggage || "7 KG"],
          checkedInBaggage: [flight.Baggage],
          // Aircraft/equipment type from the GDS; rendered only when present (else omitted).
          aircraftType: flight.Craft || "",
          layOver: `Layover: ${formatMinutesToHour(flight.GroundTime)}`,
        }
      })
      updatedJourney.push(updated)
    }

    return updatedJourney;
}

// Determine whether a set of journeys (outbound + inbound) crosses a country border. Uses the
// country names already mapped onto each segment, falling back to an airport-code lookup.
function isInternationalJourney(journeys = []) {
  const countries = new Set();
  journeys.forEach((journey) => {
    (journey?.flightSegments || []).forEach((seg) => {
      const dep = seg?.departure?.departureCountry || retrieveCountryName(seg?.departure?.departureAirportCode);
      const arr = seg?.arrival?.arrivalCountry || retrieveCountryName(seg?.arrival?.arrivalAirportCode);
      if (dep) countries.add(String(dep).trim().toLowerCase());
      if (arr) countries.add(String(arr).trim().toLowerCase());
    });
  });
  return countries.size > 1;
}

function getCabinClass(code) {
  const cabinClass = {
    1: "All", 
    2: "Economy", 
    3: "PremiumEconomy", 
    4: "Business", 
    5: "PremiumBusiness", 
  }

  return cabinClass[code] || "NA"
}

exports.generateBookingExportData = async (data) => {
  try {
    let finalData = [];

    data?.rows?.forEach((limitData) => {

      finalData.push({
        Date: limitData.createdAt
          ? formattedDateTime(limitData.createdAt)
          : "Not Available",

        "Corporate Name": limitData?.credential?.name || "Not Available",
        "Corporate ID": limitData?.credential?.username || "Not Available",
        "Partner Name": limitData?.credential?.registeredByCredential?.name || "Not Available",
        "Transaction ID":
          limitData?.transaction?.corporateTxnId ||
          limitData?.transaction?.corporateTxnId ||
          "Not Available",

        "Confirmation Number": limitData?.BookingId || "Not Available",

        "Amount": limitData?.order?.amountInINR
          ? `AED ${formatNumberWithLocalString(limitData.order.amountInINR)}`
          : "Not Available",

        "Payment Mode": toTitleCase(limitData?.order?.paymentMode) || "Not Available",
        "PNR": limitData?.PNR, // ⬅ inserted correctly

        "Status": customTitlecase(
          limitData?.bookingStatus || "Not Available"
        ),
      });
    });

    return finalData;
  } catch (error) {
    customLog(null, "error", { message: "An error occurred", error });
    throw new Error("Something went wrong while generating report");
  }
};

function formatMinutesToHour(time) {
  if(!time && time != 0) return "NA"; 
  return `${parseInt(time / 60)} hrs ${time % 60} mins`  
}