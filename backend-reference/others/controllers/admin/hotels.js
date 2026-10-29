const axios = require("axios");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");
const puppeteer = require("puppeteer");
const fs = require("fs");
const emailTemplates = require("../../utils/emailTemplate/hotels");
const emailer = require("../../utils/emailer");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");
const { findOneOrderById } = require("../../models/use-cases/order");
const operatorsData = require("../../utils/operatorsData.json");

const hotelAccessKey = operatorsData["hotel"]["accessKey"];

async function getSession(serviceDetails, logTraceId) {
    try {
        let tokenId = await getValue(`tokenId-${hotelAccessKey}`);
        const memberId = await getValue(`memberId-${hotelAccessKey}`);
        const agencyId = await getValue(`agencyId-${hotelAccessKey}`);
        if (tokenId && tokenId !== "null") {
            return {
                tokenId,
                memberId: memberId !== "null" ? memberId : null,
                agencyId: agencyId !== "null" ? agencyId : null,
            };
        }
        const data = JSON.stringify({
            ClientId: serviceDetails.ClientId,
            UserName: serviceDetails.userName,
            Password: serviceDetails.password,
            EndUserIp: serviceDetails.EndUserIp,
        });
        const config = {
            method: "post",
            url: `${serviceDetails.AUTH_URL}/Authenticate`,
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            data,
        };
        let response;
        try {
            response = await axios(config);
        } catch (axiosError) {
            customLog(logTraceId, "error", { message: "Error in getSession axios call", error: axiosError });
            throw new Error("Authentication failed");
        }
        if (!response) throw new Error("Authentication failed");

        const now = Math.floor(Date.now() / 1000);
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 0);
        const expirySeconds = Math.floor(midnight.getTime() / 1000) - now;

        await setValue(`tokenId-${hotelAccessKey}`, expirySeconds, response.data?.TokenId);
        await setValue(`memberId-${hotelAccessKey}`, expirySeconds, response.data?.Member?.MemberId);
        await setValue(`agencyId-${hotelAccessKey}`, expirySeconds, response.data?.Member?.AgencyId);

        return {
            tokenId: response.data?.TokenId,
            memberId: response.data?.Member?.MemberId,
            agencyId: response.data?.Member?.AgencyId,
        };
    } catch (error) {
        customLog(logTraceId, "error", { message: "Error in getSession", error });
        return { tokenId: "", memberId: "", agencyId: "" };
    }
}

async function getBookingDetails(serviceDetails, TraceId, logTraceId) {
    try {
        let token;
        try {
            token = await getSession(serviceDetails, logTraceId);
        } catch (sessionError) {
            customLog(logTraceId, "error", { message: "Failed to retrieve token", error: sessionError });
            throw new Error("Something went wrong.");
        }
        if (!token.tokenId) {
            customLog(logTraceId, "error", { message: "TokenId is null or undefined, skipping booking detail API call." });
            throw new Error("Something went wrong.");
        }

        const authHeader = Buffer.from(`${serviceDetails.userName}:${serviceDetails.password}`).toString("base64");
        const body = JSON.stringify({
            EndUserIp: serviceDetails.EndUserIp,
            TokenId: token.tokenId,
            TraceId,
        });
        const config = {
            method: "post",
            url: `${serviceDetails.HEALTH_URL}/GetBookingDetail`,
            headers: { "Content-Type": "application/json", Authorization: `Basic ${authHeader}` },
            data: body,
        };
        customLog(logTraceId, "info", { config, message: "getBookingDetails API config" });
        let response;
        try {
            response = await axios(config);
        } catch (axiosError) {
            customLog(logTraceId, "error", { message: "Error in getBookingDetails axios call", error: axiosError });
            throw axiosError;
        }
        customLog(logTraceId, "info", { response: response.data, message: "getBookingDetails API response" });

        if (!response?.data?.GetBookingDetailResult) throw new Error("Invalid API response structure.");
        const bookingDetails = response.data.GetBookingDetailResult;
        if (!bookingDetails.VoucherStatus || bookingDetails.ResponseStatus !== 1) {
            throw new Error(bookingDetails?.Error?.ErrorMessage || "Unknown API error.");
        }
        return bookingDetails;
    } catch (error) {
        customLog(logTraceId, "error", { message: "Error in getBookingDetails", error });
        if (error.response) throw new Error(error.response?.data?.message || "API Error");
        if (error.request) throw new Error("No response from API server");
        throw new Error(error.message || "Internal Server Error");
    }
}

async function createDataForHotelTicket(orderId) {
    const orderRecord = await findOneOrderById(orderId);
    let orderResponse = JSON.parse(orderRecord.orderResponse);

    const { HotelImage, HotelName, checkInDate, checkOutDate, checkInTime, checkOutTime } = orderResponse.hotelBookingDetails;
    const { BookingRefNo, BookingDate } = orderResponse.bookingDetailsResponse;

    const TotalRooms = orderResponse.bookingDetailsResponse.NoOfRooms;
    const passengersDetails = orderResponse.bookingDetailsResponse.Rooms || [];

    const simplifiedPassengerTypes = passengersDetails.map((room) => ({
        passengers: room.HotelPassenger.map((passenger) => ({
            PassengerType: passenger.Age > 12 ? "Adult" : "Child",
            PassengerName: `${passenger.FirstName} ${passenger.LastName}`,
            Email: passenger.Email,
            Phoneno: passenger.Phoneno,
        })),
    }));

    orderResponse.bookingDetailsResponse.PassengerTypes = simplifiedPassengerTypes;

    const checkInDate1 = new Date(checkInDate);
    const checkOutDate1 = new Date(checkOutDate);
    const timeDiff = checkOutDate1.getTime() - checkInDate1.getTime();
    const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const RoomTypeName = orderResponse.bookingDetailsResponse.Rooms?.map((room) => room.RoomTypeName);
    const CancellationPolicy = orderResponse.bookingDetailsResponse.Rooms?.[0]?.CancellationPolicy;

    let adultCount = 0;
    let childCount = 0;
    const passengers = orderResponse.bookingDetailsResponse.PassengerTypes || [];
    passengers.forEach((passenger) => {
        passenger?.passengers?.forEach((item) => {
            if (item.PassengerType === "Adult") adultCount++;
            else if (item.PassengerType === "Child") childCount++;
        });
    });

    const AddressLine1 = orderResponse.bookingDetailsResponse.AddressLine1;
    const HotelPolicyDetail = orderResponse.bookingDetailsResponse?.RateConditions;

    const bookingData = {
        HotelName,
        AddressLine1,
        transactionDate: BookingDate,
        CheckInDate: checkInDate,
        CheckOutDate: checkOutDate,
        CheckInTime: checkInTime,
        CheckOutTime: checkOutTime,
        HotelImage,
        nights: nightDifference,
        hotelAdultCount: adultCount === 1 ? adultCount + " Adult" : adultCount + " Adults",
        hotelChildCount: childCount <= 1 ? childCount + " Child" : childCount + " Children",
        hotelRoomCount: TotalRooms === 1 ? TotalRooms + " Room" : TotalRooms + " Rooms",
        CancellationPolicy,
        RoomTypeName,
        HotelPolicyDetail,
    };

    return {
        bookingReferenceId: orderRecord.providerId || BookingRefNo,
        amount: parseFloat(orderResponse.bookingDetailsResponse.totalFare).toFixed(2),
        hotelTicketHTML: "",
        bookingData,
        passengers,
        surcharge: parseFloat(orderRecord?.surcharge || 0).toFixed(2),
        totalAmount: (parseFloat(orderRecord.baseAmount) - parseFloat(orderResponse?.couponDiscount || 0)).toFixed(2),
        pdfName: `${bookingData.HotelName} – Booking Confirmation`,
    };
}

async function generateAttachmentAndSendEmailAndNotification(params, callback) {
    const logTraceId = params.logTraceId;
    try {
        const data = await createDataForHotelTicket(params.orderId);
        customLog(logTraceId, "info", { response: data, message: "createDataForHotelTicket result" });

        const partnerDetails = params.templateDetails;
        const to = params.email;
        const user = params.name;

        const html = emailTemplates.hotelTicketPDFTemplateNew(data, partnerDetails);
        customLog(logTraceId, "info", { message: "generating PDF for hotel ticket" });

        const outputFile = `${new Date().valueOf()}-hotel-ticket.pdf`;
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.pdf({ path: outputFile, format: "A4", preferCSSPageSize: true, timeout: 60000 });
        await page.close();
        await browser.close();
        customLog(logTraceId, "info", { message: "PDF created: " + outputFile });

        const files = [{ filename: `${data.pdfName}.pdf`, path: outputFile, contentType: "application/pdf" }];
        const bookingData = data.bookingData;
        const guestDetailsData = data?.passengers?.[0]?.passengers?.[0];
        const nightsLabel = emailTemplates.nightsLabelFor(bookingData.nights);
        const hotelImageUrl = bookingData.HotelImage
            ? emailTemplates.fixHotelImageUrl(bookingData.HotelImage)
            : "https://peko-storage.s3.me-central-1.amazonaws.com/staging/common/templates/fogg-welcome-by-man.png";
        const { subject, html: body, sender } = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.HOTEL_BOOKING_CONFIRMATION_EMAIL,
            service: EMAIL_TEMPLATE_SERVICES.HOTEL,
            variables: {
                name: user,
                hotelName: bookingData.HotelName,
                hotelAddress: bookingData.AddressLine1,
                hotelImageUrl,
                checkInDateFormatted: emailTemplates.convertDateToDDMMYYYY(bookingData.CheckInDate),
                checkInTimeFormatted: emailTemplates.convertTimeTo12HR(emailTemplates.toIndiaTimeString(bookingData.CheckInDate)),
                checkOutDateFormatted: emailTemplates.convertDateToDDMMYYYY(bookingData.CheckOutDate),
                checkOutTimeFormatted: emailTemplates.convertTimeTo12HR(emailTemplates.toIndiaTimeString(bookingData.CheckOutDate)),
                hotelAdultCount: bookingData.hotelAdultCount,
                hotelChildCount: bookingData.hotelChildCount,
                nights: bookingData.nights,
                nightsLabel,
                hotelRoomCount: bookingData.hotelRoomCount,
                guestName: guestDetailsData?.PassengerName,
                guestType: guestDetailsData?.PassengerType,
                manageBookingUrl: `${partnerDetails?.baseUrl}corporate-travel/hotels/manage-bookings`,
                branding: partnerDetails?.branding || 'Peko',
                ...v2LayoutVariables({
                    website: partnerDetails?.baseUrl || 'https://in.peko.one',
                    logo: partnerDetails?.logo,
                    branding: partnerDetails?.branding || 'Peko',
                    socials: PEKO_SOCIAL_LINKS,
                }),
            },
            fallbackSubject: "Your hotel booking confirmed",
            fallback: () => emailTemplates.generateHotelTicketAndSendToMailNew(
                { user },
                bookingData,
                guestDetailsData,
                partnerDetails
            ),
        });
        customLog(logTraceId, "info", { to, message: "sending hotel booking confirmation email to" });

        emailer.emailWithMultipleAttachment(to, subject, body, files, undefined, (emailErr) => {
            try { fs.unlinkSync(outputFile); } catch (_) { /* ignore cleanup errors */ }
            if (emailErr) {
                customLog(logTraceId, "error", { emailErr, message: "Error sending hotel booking email" });
                callback(emailErr, null);
            } else {
                customLog(logTraceId, "info", { message: "Hotel booking email sent", data: to });
                callback(null, true);
            }
        }, sender);
    } catch (err) {
        customLog(logTraceId, "error", { error: err, message: "Error in generateAttachmentAndSendEmailAndNotification" });
        callback(err, null);
    }
}

exports.getHotelServiceDetails = (vendor) => ({
    userName: vendor.optional1,
    password: vendor.optional2,
    ClientId: vendor.optional3,
    HEALTH_URL: vendor.healthUrl,
    AUTH_URL: vendor.optionals?.hotelsAuth || null,
    EndUserIp: vendor.optionals?.endUserIp,
});

exports.hotelAccessKey = hotelAccessKey;
exports.getBookingDetails = getBookingDetails;
exports.generateAttachmentAndSendEmailAndNotification = generateAttachmentAndSendEmailAndNotification;
