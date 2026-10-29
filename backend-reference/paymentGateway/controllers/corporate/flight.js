const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const emailer = require("../../utils/emailer");
const moment = require("moment");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
  findServiceOperatorByAccessKey,
} = require("../../utils/checkAndFetchServiceDetails");
const { findOneOrderById } = require("../../models/use-cases/order");
const { accessKey, getSession, callTboWithRetry, isTboTokenExpiredResponse, isTboTraceIdExpiredResponse, createTraceIdExpiredError } = require("../../utils/tboSession");
const { getValue } = require("../../utils/cacheDataMethods");
const ErrorResponse = require("../../utils/error-response");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const wallet = require("../../models/entities/wallet");
const { createNotification } = require("../../models/use-cases/notification");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const {
  airLineTicketTemplate,
//   generateAirlineTicketAndSendToMail,
} = require("../../utils/templatesForEmails");
const { commonFlightbookingFailedTemplate } = require("../../utils/emailTemplate/common");
const { customLog } = require("../../utils/loggerHelper");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { createFlightBooking, updateTicketDataByPNR } = require("../../models/use-cases/flight");
const { markHoldConsumed } = require("../../models/use-cases/flightHeldBooking");
const { holdLegBeforeTicketing } = require("../../services/flightHold");
const flightBooking = require("../../models/entities/flight/flightBooking");
const { flightConfirmationTemplate } = require("../../utils/emailTemplates/flight/flightConfirmationTemplate");
const credential = require("../../models/entities/credential");
const { formatNumberWithLocalString, maskPhone, maskEmail, amountPrecision } = require("../../utils/formatter");
const { serviceCommissionFields } = require("../../utils/applyCommissionMarkup");
const { retrieveCountryName } = require("../../utils/airlineData");
const puppeteer = require("puppeteer");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { findByEmail } = require("../../models/use-cases/setting");
const { BalanceEmailTemplate } = require("../../utils/emailTemplates/flight/AgencyBalanceEmail");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { fetchAsDataUri, FALLBACK_AIRLINE_ICON_DATA_URI } = require("../../utils/imageToDataUri");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

// Shared by 2 call sites in this file (payment-gateway-response path and wallet/scheduler
// path) — reuses travel MS's own FLIGHT_BOOKING_FAILED key/design verbatim, matching its
// exact variable shape (see travel/controllers/corporate/airline.js's sendFlightBookingFailedEmail).
async function resolveFlightBookingFailedEmail(name, templateDetails, subject, logTraceId) {
  const branding = templateDetails?.branding || 'Peko';
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.FLIGHT_BOOKING_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.FLIGHT,
    variables: {
      name,
      branding,
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => commonFlightbookingFailedTemplate(name, "Air Ticket", templateDetails?.baseUrl, templateDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

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
const { scheduleFunction } = require("../../services/scheduler");
const { retrieveBooking } = require("../../services/flight");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const failedTicketStatus = [0, 3, 4, 6, 8, 9]

// TBO's search session (TraceId) is only valid ~15 min. Skip ticketing a leg once the session
// has been alive longer than this, to avoid firing a doomed "incorrect result index / session
// expired" Ticket call (measured from the fare-quote stamp cached by the travel service).
const SESSION_TICKET_GUARD_MS = Number(process.env.TBO_SESSION_GUARD_MS) || 14 * 60 * 1000;


exports.payment = asyncHandler(async (req, res, next) => {

    let serviceDetails = await checkService(req)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const { token } = await getSession(serviceDetails, req?.LogTraceId)
    if(!token) {
        // initiate refund
        // return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    let transactionCategory = 'Travel'
    
    const transactionId = req.body.corporateTxnId ? req.body.corporateTxnId.toString() : new Date().valueOf().toString();
    const providerId = transactionId

    const name = req.user.name
    const corporateUserId = req.user.corporateId
    let { userContactDetails } = req.body.outbount
    const amount = parseFloat(req.body.outbount.amount)
    const credentialId = req.user.id
    // const emailId = req.user.email
    const corporateTxnId = transactionId

    // zoho credentials
    // const customer_id = req.user.zoho_id;
    let templateDetails = await fetchPartnerDetails(req.user.registeredBy)

    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType || 'PERCENTAGE'
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback || 0
    let serviceOperatorId = serviceDetails.id
    const { surcharge } = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );
    
    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
        ? req.body.paymentGatewayResponse[0]
        : req.body?.paymentGatewayResponse;
    // Each flight's fare (marked up, before the add-ons) was saved at fare quote and prebook; what is paid above them is add-ons (seat, meal, baggage), which carry no commission.
    const flightFaresKey = `${accessKey}-${req.body.outbount.TraceId}-flightFares`;
    const { outbound = 0, inbound = 0 } = JSON.parse((await getValue(flightFaresKey)) || "{}");
    const fareCommission = serviceCommissionFields(serviceDetails);
    const addOns = amountPrecision(amount - outbound - inbound);

    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.pgAmount,
        amount: Number(amount),
        planDetails:
            fareCommission && outbound > 0 && addOns >= 0
                ? [
                      { ...fareCommission, amount: outbound },
                      ...(inbound ? [{ ...fareCommission, amount: inbound }] : []),
                      ...(addOns ? [{ amount: addOns }] : []),
                  ]
                : [],
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails: templateDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || "Cashfree",
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || "",
        credentialId,
    });

    //first we will  do transaction
    let transactionResponse = {}
    const commonParams = {
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        transactionCategory,
        orderAmount: amount,
        commissionType,
        cashbackType,
        providerCommission,
        surcharge,
        reportData
    };

    try {
       if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
            accessKey
        });
        } else {
        transactionResponse = await createWalletTransaction({
            ...commonParams,
            amount,
        });
        }

        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
            // refund?
            return next(new ErrorResponse(transactionResponse['error'], 400))
        }

        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type: "payment",
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );

        const outbountData = req.body.outbount; 
        
        const walletDetails = await wallet.findOne({
            where: { credentialId },
            attributes: ['balance']
        })

        let result, bookingStatus;
        let booking, inbountBooking;
        
        let ticketData = {
            name: req.user.name,
            email: userContactDetails?.emailAddress || req.user.email,
            url: `${req.protocol}://${req.get('host')}`,
            orderId: transactionResponse.orderId,
            surcharge: surcharge,
            // invoice_id,
            corporateTxnId,
            paymentDetailAmount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
            registeredBy: req.user.registeredBy,
            passengers: req.body.outbount.passengers,
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: token,
            TraceId: req.body.outbount.TraceId,
        }
        let mockReq = {
            LogTraceId: req.LogTraceId, 
            user: {
                id: req.user.id,
                role: req.user.role, 
                username: req.user.username,
                subCorporateId: req.user.subCorporateId, 
                registeredBy: req.user.registeredBy
            },
            body: {
                outbount: req.body.outbount, 
                customerInfo: {}
            }
        }
        const inbountData = req.body.inbount;
        const inbountResultIndex = inbountData?.ResultIndex;

        try {
            if (process.env.NODE_ENV !== "production" && process.env.FLIGHT_FORCE_BOOKING_FAILURE_DATE === moment().format("YYYY-MM-DD")) {
                throw new Error("Forced flight booking failure (FLIGHT_FORCE_BOOKING_FAILURE_DATE)");
            }
            // Hold both legs first so an inbound failure cannot leave an outbound already ticketed.
            const holdGroupKey = inbountData ? `${req.user.id}-${Date.now()}` : null;
            await holdLegBeforeTicketing({ leg: outbountData, legType: 'OUTBOUND', groupKey: holdGroupKey, serviceDetails, req });
            if (inbountData) {
                await holdLegBeforeTicketing({ leg: inbountData, legType: 'INBOUND', groupKey: holdGroupKey, serviceDetails, req });
            }

            const response = await handleTicketApi(req.LogTraceId, serviceDetails, outbountData.TraceId, outbountData.passengers, outbountData.ResultIndex, outbountData.isLcc, outbountData.PNR, outbountData.BookingId, outbountData.IsPriceChangeAccepted, corporateTxnId);

            if (!response || !response?.result || failedTicketStatus.includes(response?.bookingStatus)) {
                throw new Error("Booking failed from vendor side")
            }
            result = response.result
            bookingStatus = response.bookingStatus

            booking = result?.Response;
            console.log("✅✅booking", result)
            await createFlightBooking({ booking, transactionResponse, req, traceId: result?.TraceId })
            await markHoldConsumed(booking?.BookingId, req?.LogTraceId)

            customLog(req?.LogTraceId, 'info', {
                message: 'Flight ticket vendor response received; deciding mail path',
                corporateTxnId,
                result,
                pnr: booking?.PNR,
                bookingId: booking?.BookingId,
                bookingStatus,
                mailPath: (bookingStatus == 2 || bookingStatus == 5) ? 'deferred-to-scheduler-5min' : 'sync-success-path',
                recipientFromRequest: userContactDetails?.emailAddress || req.user?.email || null
            })

            if (bookingStatus == 2 || bookingStatus == 5) {
                const date = new Date(Date.now() + 5 * 60 * 1000); // after five minutes
                // MARK: Outbount scheduler
                scheduleFunction(() => {
                    handleFetchStatusAndUpdate(
                        booking.PNR, 
                        booking.BookingId, 
                        req.body.outbount.passengers,
                        serviceDetails, 
                        ticketData,
                        amount,
                        transactionResponse,
                        mockReq,
                        // the rest of the parameters are for inbount booking
                        outbountData.TraceId,
                        inbountResultIndex,
                        inbountData?.passengers, 
                        inbountData?.isLcc, 
                        inbountData?.PNR,
                        inbountData?.BookingId,
                        inbountData?.IsPriceChangeAccepted,
                        reportData
                    );
                }, date)
                customLog(req?.LogTraceId, 'info', {
                    message: 'Flight ticket sync mail SKIPPED; in-memory node-schedule queued (lost if process restarts)',
                    corporateTxnId,
                    pnr: booking?.PNR,
                    bookingId: booking?.BookingId,
                    bookingStatus,
                    scheduledFor: date.toISOString(),
                    hasInbount: !!inbountResultIndex
                })
                // call scheduler
                    // to check status after 5 minutes
                    // if status is success
                        // create db doc
                        // if(inbount) create inbount
                    // else 
                        // initiate full refund
                return res.status(200).json({
                    status: false,
                    message: 'Ticket booking is in progress',
                    responseCode: '001',
                    data: {
                        corporateFinalBalance: walletDetails['balance'],
                        pending: true,
                        details: {
                            message: "The booking status is pending, will let you know once confirmed."
                        }
                    }
                })
            }
        } catch (error) {
            // must use this in transaction events
            // ⚠️⚠️
            // cleverTap.uploadEvent({
            //     eventName: "Transactions",
            //     eventData: {
            //         Status: "Payment Failure",
            //     },
            //     email: emailId,
            // }, templateDetails);
            customLog(req.LogTraceId, 'error', { message: "Ticket API failed", error })

            let errorMessage = 'Something went wrong, please try again later.'
            if (error.vendorResponse) {
                errorMessage = error?.vendorResponse?.Response?.Error?.ErrorMessage
            }

            let updateDetails = {
                corporateTxnId,
                providerId: "Not Available",
                status: "FAILURE",
                message: errorMessage,
                registeredById: req.user.registeredBy,
                couponId: transactionResponse.couponId
            }
            if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
                const { status } = await cancelPGTransaction(corporateTxnId);
                if (status) {
                    await refundWalletTransaction(updateDetails);
                    publishJournalEvent(
                        {
                            transactionRef: corporateTxnId,
                            type: "refund",
                            contextSnapshot: {
                                credentialId,
                                vendor: serviceDetails?.vendor || null,
                                registeredBy: req?.user?.registeredBy || null,
                            },
                            reportData,
                        },
                        req?.LogTraceId
                    );
                }
            } else {
                await refundWalletTransaction(updateDetails);
                publishJournalEvent(
                    {
                        transactionRef: corporateTxnId,
                        type: "refund",
                        contextSnapshot: {
                            credentialId,
                            vendor: serviceDetails?.vendor || null,
                            registeredBy: req?.user?.registeredBy || null,
                        },
                        reportData,
                    },
                    req?.LogTraceId
                );
            }

        const couponDiscount = Number(
            transactionResponse?.couponDiscount || req.body?.couponDiscount || 0
        );
        const notificationAmount = (Number(amount) + Number(surcharge) - couponDiscount).toFixed(2);
        const notificationData = {
            notificationTitle: 'Flight Booking - Payment unsuccessful',
            notificationBrief: `Payment of ₹ ${notificationAmount} for Flight Booking was unsuccessful. Transaction ID: ${corporateTxnId}.`,
                notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
                notificationCategory: 'CORPORATE', // Replace with the relevant category
                notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
            };
            createNotification(notificationData);

        const to = userContactDetails?.emailAddress || req.user.email;
        customLog(req?.LogTraceId, "info", {
            message: "Payment failed email recipient resolved",
            fromOutbount: userContactDetails?.emailAddress || null,
            fromUser: req.user?.email || null,
            resolvedTo: to || null
        });
            let subject = 'Payment failed'

            const resolvedFlightFailed1 = await resolveFlightBookingFailedEmail(name, templateDetails, subject, req?.LogTraceId);
            subject = resolvedFlightFailed1.subject;
            const body = resolvedFlightFailed1.html;
        if (to) {
            emailer.email({ to, subject, body }, function () {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            });
        } else {
            customLog(req?.LogTraceId, "error", { message: "Payment failed email skipped: no recipient", userContactDetails, userEmail: req.user?.email })
        }

            // Refund above runs either way; only the code the client sees differs.
            if (error.isTraceIdExpired) {
                return res.status(400).json({
                    status: false,
                    message: "Your search session has expired. Please restart your search and try again.",
                    responseCode: '005',
                    data: {
                        corporateFinalBalance: walletDetails['balance']
                    }
                })
            }

            return res.status(500).json({
                status: false,
                message: 'Ticket booking failed',
                responseCode: '001',
                data: {
                    corporateFinalBalance: walletDetails['balance']
                }
            })
        }

        let inbountResult, inbountBookingStatus;
        if (inbountResultIndex) {
            try {
                const inbountSessionStartedRaw = await getValue(`${accessKey}-${outbountData.TraceId}-sessionStartedAt`);
                if (inbountSessionStartedRaw) {
                    const inbountSessionElapsedMs = Date.now() - Number(inbountSessionStartedRaw);
                    if (Number.isFinite(inbountSessionElapsedMs) && inbountSessionElapsedMs >= SESSION_TICKET_GUARD_MS) {
                        customLog(req?.logTraceId, "info", {message: "inbount cache result from fare quote", data: `TBO session likely expired before inbound ticketing (elapsed ${Math.round(inbountSessionElapsedMs / 1000)}s >= ${SESSION_TICKET_GUARD_MS / 1000}s) — skipping inbound Ticket to avoid a released booking`, })
                    }
                }
                const inbountTicketResult = await handleTicketApi(req.LogTraceId, serviceDetails, outbountData.TraceId, inbountData.passengers, inbountResultIndex, inbountData.isLcc, inbountData.PNR, inbountData.BookingId, inbountData.IsPriceChangeAccepted, corporateTxnId);
                if (!inbountTicketResult || !inbountTicketResult.result || failedTicketStatus.includes(inbountTicketResult?.bookingStatus)) {
                    throw new Error("Booking failed from vendor side")
                }
                inbountResult = inbountTicketResult.result
                inbountBookingStatus = inbountTicketResult.bookingStatus
                inbountBooking = inbountResult?.Response
                console.log("✅✅inbountBooking", inbountBooking)
                await createFlightBooking({ booking: inbountBooking, transactionResponse, req, traceId: inbountResult?.TraceId   })
                await markHoldConsumed(inbountBooking?.BookingId, req?.LogTraceId)

                if (inbountBookingStatus == 2 || inbountBookingStatus == 5) {
                    // MARK: Inbount scheduler
                    const date = new Date(Date.now() + 5 * 60 * 1000); // after five minutes
                    scheduleFunction(() => {
                        handleFetchStatusAndUpdate(
                            inbountBooking.PNR, 
                            inbountBooking.BookingId, 
                            req.body.inbount.passengers, 
                            serviceDetails, 
                            ticketData,
                            amount,
                            transactionResponse,
                            mockReq,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            reportData
                        );
                    }, date)
                    customLog(req?.LogTraceId, 'info', {
                        message: 'Flight inbount sync mail SKIPPED; in-memory node-schedule queued (lost if process restarts)',
                        corporateTxnId,
                        inbountPnr: inbountBooking?.PNR,
                        inbountBookingId: inbountBooking?.BookingId,
                        inbountBookingStatus,
                        scheduledFor: date.toISOString()
                    })
                }
            } catch (error) {
                // handle partial refund
                // let updateDetails = {
                //     corporateTxnId,
                //     providerId: "Not Available",
                //     status: "FAILURE",
                //     message: "Booking failed",
                //     registeredById: req.user.registeredBy
                // }
                // await refundWalletTransaction(updateDetails);
                customLog(req.LogTraceId, 'error', { message: "Return ticket API failed", error })
            }
        }

        // ⚠️⚠️
        // cleverTap.uploadEvent({
        //     eventName: "Transactions",
        //     eventData: {
        //         Status: "Payment Success",
        //     },
        //     email: emailId,
        // }, templateDetails);

        // if inbount booking is failed reduce payment amount in notification and email
        const successCouponDiscount = Number(
            transactionResponse?.couponDiscount || req.body?.couponDiscount || 0
        );
        const successNotificationAmount = (Number(amount) + Number(surcharge) - successCouponDiscount).toFixed(2);
        const notificationData = {
            notificationTitle: 'Flight Booking - Payment successful',
            notificationBrief: `Payment of ₹ ${successNotificationAmount} for Flight Booking was successful. Transaction ID: ${transactionId}.`,
            notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };
        createNotification(notificationData);

        // createExpense({
        //     credentialId,
        //     packageId,
        //     corporateUserId
        // }, {
        //     accounts_id, amount: paymentDetails.amount, credentialId: req.user.id, category: serviceDetails?.serviceCategory,
        //     merchant: serviceDetails?.vendor?.vendorName
        // })

        // ⚠️⚠️
        // await createZohoPaymentRecord({ customer_id, paymentMode: transactionResponse?.paymentMode, reference_number: corporateTxnId, amount: paymentDetails.amount })

        const updateDetails = {
            corporateTxnId,
            providerId: "Not Available",
            status: "SUCCESS",
            orderResponse: JSON.stringify([booking, inbountBooking]),
            message: "Payment Successful"
        }
        await updateWalletTransaction(updateDetails)

        // send agency balance notification
        try {
            const agencyBalance = await findAgencyBalance(serviceDetails, req?.LogTraceId)
            const fieldname = "pekoWebsite"
            const result = await findByEmail({ name: fieldname })
            const to = result.details.emails;
            const body = BalanceEmailTemplate({ CashBalance: agencyBalance }, templateDetails)
            const subject = "Peko India | Airline balance reminder"
            emailer.email({ to, subject, body }, function () {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            });
        } catch (error) {
            customLog(req.LogTraceId, 'error', { message: error.message || "Something went wrong while sending agency balance reminder email", err: error })
        }

        //here need to send the ticket to user email
        ticketData = {
            ...ticketData,
            PNR: booking?.PNR,
            inbountPNR: inbountBooking?.PNR
        }
        customLog(req?.LogTraceId, 'info', {
            message: 'Calling sync flight confirmation mail (success path)',
            corporateTxnId,
            pnr: booking?.PNR,
            inbountPNR: inbountBooking?.PNR,
            recipientFromRequest: userContactDetails?.emailAddress || req.user?.email || null
        })
        const planDetails = [{
            name: booking?.PNR ? `Flight Booking - PNR ${booking.PNR}` : "Flight Booking",
            amount,
            quantity: 1,
        }];
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount: successCouponDiscount,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: "Flight Booking",
            description: booking?.PNR ? `Flight Booking - PNR ${booking.PNR}` : undefined,
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });
        await generateAttachmentAndSendEmailAndNotification(ticketData, req, serviceDetails, (err) => {
            if (err) {
                customLog(req.LogTraceId, 'error', {
                    message: "Flight ticket send confirmation mail failed (sync path)",
                    corporateTxnId,
                    pnr: booking?.PNR,
                    errorMessage: err?.message || String(err),
                    errorCode: err?.code,
                    errorStack: err?.stack
                })
            } else {
                customLog(req.LogTraceId, 'info', { message: "Flight ticket confirmation mail sent to" + userContactDetails.emailAddress, corporateTxnId, pnr: booking?.PNR })
            }
        }, invoiceAttachments);

        return res.status(200).json({
            status: true,
            message: 'Payment Successful',
            responseCode: '000',
            data: {
                ...transactionResponse,
                corporateTxnId
            }
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "Flight ticket wallet payment failed", data: error })
        return next(new ErrorResponse("Something went wrong while purchasing flight ticket", 500))
    }
});

const handleTicketApi = async (loggerTraceId, serviceDetails, TraceId, passengers, resultIndex, isLcc, PNR, BookingId, IsPriceChangeAccepted, corporateTxnId) => {
    // Decide the Ticket request shape by the ACTUAL hold state, not the client isLcc flag. A leg
    // that was Hold-booked (has its own PNR + BookingId from /rest/Book) MUST be ticketed by those
    // hold identifiers and must NOT carry ResultIndex — TBO rejects ResultIndex in a hold-Ticket.
    // Only a direct-ticket LCC leg (no hold) uses ResultIndex. This is immune to a wrong/mismatched
    // isLcc (e.g. a non-LCC inbound whose search result was tagged IsLCC=true).
    const isHeldLeg = Boolean(PNR && BookingId);
    if (isLcc && isHeldLeg) {
        // Upstream data disagreement — keep it observable; we ticket by hold state regardless.
        customLog(loggerTraceId, "info", {
            message: "[airline:Ticket] isLcc=true but leg is held (PNR+BookingId present) — ticketing by hold identifiers",
            pnr: PNR,
            bookingId: BookingId,
        }, "VENDOR");
    }
    let preparedPassengers = passengers;

    if (!isHeldLeg) {
        // remove ssr properties if they are empty
        preparedPassengers = passengers.map(passenger => {
            if (passenger.SeatDynamic.length === 0) {
                delete passenger.SeatDynamic;
            }
            if (passenger.MealDynamic.length === 0) {
                delete passenger.MealDynamic;
            }
            if (passenger.Baggage.length === 0) {
                delete passenger.Baggage;
            }
            return passenger
        })
    }

    const buildTicketConfig = (tokenId) => {
        const data = isHeldLeg
            ? {
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                TraceId: TraceId,
                "PNR": PNR,
                "BookingId": BookingId,
                ...(IsPriceChangeAccepted ? { IsPriceChangeAccepted: true } : {})
            }
            : {
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                TraceId: TraceId,
                ResultIndex: resultIndex,
                PreferredCurrency: null,
                AgentReferenceNo: corporateTxnId,
                Passengers: preparedPassengers
            };

        return {
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/Ticket`,
            headers: {
                'Content-Type': 'application/json',
            },
            data,
            timeout: 300000, // 5 minute
        };
    };

    try {
        const result = await callTboWithRetry({
            buildConfig: buildTicketConfig,
            serviceDetails,
            loggerTraceId,
            endpoint: 'Ticket',
            logRequest: (config, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:Ticket] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "Ticket",
                vendorTraceId: TraceId,
                pnr: PNR,
                bookingId: BookingId,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...config.data, TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:Ticket] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "Ticket",
                statusCode: response?.status,
                bookingId: response?.data?.Response?.Response?.BookingId,
                pnr: response?.data?.Response?.Response?.PNR,
                ticketStatus: response?.data?.Response?.Response?.TicketStatus,
                flightStatus: response?.data?.Response?.Response?.FlightStatus,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: JSON.stringify(response?.data),
            }, "VENDOR"),
        });

        if (result && result?.data?.Response?.Error?.ErrorCode !== 0) {
            if (isTboTraceIdExpiredResponse(result)) {
                customLog(loggerTraceId, "error", {
                    message: "[airline:Ticket] TraceId expired",
                    endpoint: "Ticket",
                    vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                    vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
                }, "VENDOR")
                throw createTraceIdExpiredError();
            }
            throw new Error("Booking failed from vendor side")
        }

        return {
            result: result.data.Response,
            bookingStatus: result?.data?.Response?.Response?.TicketStatus
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED' && isHeldLeg) {
            customLog(loggerTraceId, "info", {
                message: "[airline:Ticket] timeout — returning synthetic in-progress result",
                endpoint: "Ticket",
                bookingId: BookingId,
                pnr: PNR,
                errorCode: error?.code,
            }, "VENDOR")
            // incase of time out (non lcc), return a result with booking, pnr and inprogress ticket status
            return {
                result: {
                    Response: {
                        BookingId,
                        PNR,
                        TicketStatus: 2,
                    }
                },
                bookingStatus: 2
            }
        }

        customLog(loggerTraceId, "error", {
            message: "[airline:Ticket] error",
            endpoint: "Ticket",
            bookingId: BookingId,
            pnr: PNR,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        const err = new Error("Booking failed from vendor side");
        err.vendorResponse = error.response?.data;
        err.statusCode = error.response?.status || 500;
        throw err;

    }
}

const handleFetchStatusAndUpdate = async function(pnr, bookingId, passengers, serviceDetails, ticketData, amount, transactionResponse, req, TraceId, inbountResultIndex, inbountPassengers, inbountDataIsLcc, inbountDataPNR, inbountDataBookingId, inbountDataIsPriceChangeAccepted, reportData) {

    customLog(req?.LogTraceId, 'info', {
        message: 'Flight ticket async scheduler FIRED',
        corporateTxnId: transactionResponse?.corporateTxnId,
        pnr,
        bookingId,
        hasInbount: !!inbountResultIndex
    })

    const { token } = await getSession(serviceDetails, req?.LogTraceId)
    if (!token) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Flight ticket scheduler ABANDONED: getSession returned no token — mail NOT sent',
            corporateTxnId: transactionResponse?.corporateTxnId,
            pnr,
            bookingId
        })
        return;
        // return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const leadPax = passengers.filter((passenger) => {
        return passenger.IsLeadPax
    })[0]

    const payload = {
        token,
        BookingId: bookingId,
        PNR: pnr,
        firstName: leadPax.FirstName,
        lastName: leadPax.LastName,
        serviceDetails,
        LogTraceId: null
    }

    let { status, booking } = await retrieveBooking(payload)
    if (!status) {
        // do we need to schedule again
        customLog(req?.LogTraceId, 'error', {
            message: 'Flight ticket scheduler ABANDONED: retrieveBooking returned !status — mail NOT sent, no retry queued',
            corporateTxnId: transactionResponse?.corporateTxnId,
            pnr,
            bookingId
        })
        return;
    }

    const ticketStatus = booking.Status;
    customLog(req?.LogTraceId, 'info', {
        message: 'Flight ticket scheduler retrieveBooking OK',
        corporateTxnId: transactionResponse?.corporateTxnId,
        pnr,
        bookingId,
        vendorTicketStatus: ticketStatus
    })
    let inbountBooking; 
    if(ticketStatus === 5) {
        await updateTicketDataByPNR(
            pnr, 
            {
                bookingStatus: "Successful", 
                journey: booking.Segments,
                passengers: booking.Passenger,
                fare: booking.Fare,
            }
        )

        if(inbountResultIndex) {
            try {
                const inbountTicketResult = await handleTicketApi(null, serviceDetails, TraceId, inbountPassengers, inbountResultIndex, inbountDataIsLcc, inbountDataPNR, inbountDataBookingId, inbountDataIsPriceChangeAccepted, transactionResponse.corporateTxnId);
                if (!inbountTicketResult || !inbountTicketResult.result || failedTicketStatus.includes(inbountTicketResult?.bookingStatus)) {
                    throw new Error("Booking failed from vendor side")
                }
                let inbountResult = inbountTicketResult.result
                let inbountBookingStatus = inbountTicketResult.bookingStatus
                inbountBooking = inbountResult?.Response

                await createFlightBooking({ booking: inbountBooking, transactionResponse, req, traceId: inbountResult?.TraceId   })
                await markHoldConsumed(inbountBooking?.BookingId, req?.LogTraceId)

                if (inbountBookingStatus == 2 || inbountBookingStatus == 5) {
                    const date = new Date(Date.now() + 5 * 60 * 1000); // after five minutes
                    scheduleFunction(() => {
                        handleFetchStatusAndUpdate(inbountBooking.PNR, inbountBooking.BookingId, inbountBooking.FlightItinerary.Passenger, serviceDetails, ticketData);
                    }, date)
                }
            } catch (error) {
                // The first flight costs the customer its marked-up fare (saved at fare quote and prebook) plus its add-ons; the rest is refunded. Without the saved fare, TBO's total for it.
                const { outbound = 0 } = JSON.parse((await getValue(`${accessKey}-${TraceId}-flightFares`)) || "{}");
                const outboundAddOns = ["TotalBaggageCharges", "TotalMealCharges", "TotalSeatCharges"].reduce((sum, field) => sum + (Number(booking.Fare?.[field]) || 0), 0);
                const totalOutbountAmount = outbound ? outbound + outboundAddOns : Number(booking.Fare?.PublishedFare);
                const totalInbountAmount = Math.max(0, amountPrecision(amount - totalOutbountAmount));
                // handle partial refund
                // let updateDetails = {
                //     corporateTxnId,
                //     providerId: "Not Available",
                //     status: "FAILURE",
                //     message: "Booking failed",
                //     registeredById: req.user.registeredBy
                // }
                // await refundWalletTransaction(updateDetails);
                const updateDetails = {
                    corporateTxnId: transactionResponse.corporateTxnId, 
                    registeredById: req.user.registeredBy, 
                    partialRefund: {
                        status: true, 
                        walletRefund: totalInbountAmount
                    }
                }
                // if (ticket.order.paymentMode === 'PAYMENT GATEWAY') {
                //     const { status } = await cancelPGTransaction(ticket.order.corporateTxnId, ticket.refundedAmount);
                //     if (status) {
                //         await refundWalletTransaction(updateDetails);
                //     }
                // } else {
                    await refundWalletTransaction(updateDetails);
                    publishJournalEvent(
                        {
                            transactionRef: transactionResponse.corporateTxnId,
                            type: "refund",
                            contextSnapshot: {
                                credentialId: req?.user?.id || null,
                                vendor: serviceDetails?.vendor || null,
                                registeredBy: req?.user?.registeredBy || null,
                            },
                            reportData,
                        },
                        req?.LogTraceId
                    );
                // }
                customLog(req.LogTraceId, 'error', { message: "Return ticket API failed", error })
            }
        }

        ticketData = {
            ...ticketData,
            PNR: booking?.PNR,
            inbountPNR: inbountBooking?.PNR,
        }
        customLog(req?.LogTraceId, 'info', {
            message: 'Calling async flight confirmation mail (scheduler path)',
            corporateTxnId: transactionResponse?.corporateTxnId,
            pnr: booking?.PNR,
            inbountPNR: inbountBooking?.PNR,
            recipientFromRequest: req?.body?.outbount?.userContactDetails?.emailAddress || null
        })
        await generateAttachmentAndSendEmailAndNotification(ticketData, req, serviceDetails, (err) => {
            if (err) {
                customLog(req.LogTraceId, 'error', {
                    message: "Flight ticket send confirmation mail failed (scheduler path)",
                    corporateTxnId: transactionResponse?.corporateTxnId,
                    pnr: booking?.PNR,
                    errorMessage: err?.message || String(err),
                    errorCode: err?.code,
                    errorStack: err?.stack
                })
            } else {
                customLog(req.LogTraceId, 'info', { message: "Flight ticket confirmation mail sent to" + req.body.outbount.userContactDetails.emailAddress, corporateTxnId: transactionResponse?.corporateTxnId, pnr: booking?.PNR })
            }
        });
    }
    else if(ticketStatus === 4) {
        // still in progress
        // do we need to put another scheduler
        customLog(req?.LogTraceId, 'error', {
            message: "Flight ticket TERMINAL: vendor still in progress (status 4) after scheduler retry — mail NOT sent, no further retry queued",
            corporateTxnId: transactionResponse?.corporateTxnId,
            pnr,
            bookingId,
            vendorTicketStatus: ticketStatus
        })
    }
    else {
        let updateDetails = {
            corporateTxnId: transactionResponse.corporateTxnId,
            providerId: "Not Available",
            status: "FAILURE",
            message: "Something went wrong while booking ticket.",
            registeredById: req.user.registeredBy,
            couponId: transactionResponse.couponId
        }
        // if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        //     const { status } = await cancelPGTransaction(transactionResponse.corporateTxnId);
        //     if (status) {
        //         await refundWalletTransaction(updateDetails);
        //     }
        // } else {
            await refundWalletTransaction(updateDetails);
            publishJournalEvent(
                {
                    transactionRef: transactionResponse.corporateTxnId,
                    type: "refund",
                    contextSnapshot: {
                        credentialId: req?.user?.id || null,
                        vendor: serviceDetails?.vendor || null,
                        registeredBy: req?.user?.registeredBy || null,
                    },
                    reportData,
                },
                req?.LogTraceId
            );
        // }

        const notificationData = {
            notificationTitle: 'Flight Booking - Payment unsuccessful',
            notificationBrief: `Payment of ₹ ${amount} for Flight Booking was unsuccessful. Transaction ID: ${transactionResponse.corporateTxnId}.`,
            notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };
        createNotification(notificationData);

        let templateDetails = req.user.registeredBy ? await fetchPartnerDetails(req.user.registeredBy) : await partnerLogos()
        const to = req.body.outbount?.userContactDetails?.emailAddress || req.user.email;
        let subject = 'Payment failed'

        const resolvedFlightFailed2 = await resolveFlightBookingFailedEmail(name, templateDetails, subject, req?.LogTraceId);
        subject = resolvedFlightFailed2.subject;
        const body = resolvedFlightFailed2.html;
        if (to) {
            emailer.email({ to, subject, body }, function () {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            });
        } else {
            customLog(req?.LogTraceId, "error", {
                message: "Payment failed email skipped: no recipient",
                fromOutbount: req.body.outbount?.userContactDetails?.emailAddress || null,
                fromUser: req.user?.email || null
            })
        }
    }
}

async function checkService(req) {
    const credentialId = req.user.id; //will come from userObject
    const corporateUserId = req.user.corporateId
    const packageId = req.user.packageId; //will come from userObject
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    });
   
    return serviceDetails; 
}

// async function recursiveFetch(result, serviceDetails, config) {
//   if (
//     result.data.meta.success &&
//     (result.data.meta.statusCode === 2 || result.data.meta.statusCode === 3)
//   ) {
//     if (result.data.asyncFetch) {
//       const apiUrl = `${serviceDetails["API_URL"]}${result.data.asyncFetch.fetchUrl}`;
//       result = await fetchData(apiUrl, config.headers);
     
//       // Recursively call the function with the new result
//       result = await recursiveFetch(result, serviceDetails, config);
//     }
//   }

//   return result;
// }

// async function fetchData(url, headers) {
//   // Return the response data
//   const response = await axios.get(url, {
//     headers: {
//       "X-API-KEY": headers["X-API-KEY"],
//       conversationId: headers["conversationId"],
//       sessionId: headers["sessionId"],
//       "Content-Type": "application/json",
//     },
//   });
//   return response;
// }

const FONT_HOST_DENYLIST = ["fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net"];

// Repeating page footer for the ticket PDF: Peko contact + "Page X of Y" on every page (via
// Puppeteer displayHeaderFooter), so a multi-page ticket is clearly a set and a partial print is
// obviously incomplete. pageNumber/totalPages are substituted by Puppeteer.
const TICKET_PDF_FOOTER = `<div style="width:100%; font-family:Arial,Helvetica,sans-serif; font-size:8px; color:#666; padding:0 12mm; box-sizing:border-box;"><table style="width:100%; border-collapse:collapse;"><tr><td style="text-align:left;">Peko Helpline: 022 489 30373 &nbsp;&middot;&nbsp; reach@peko.one</td><td style="text-align:right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> &nbsp;&middot;&nbsp; www.peko.one</td></tr></table></div>`;

const generateFlightTicketPdf = async (html, traceId) => {
    const MAX_PDF_ATTEMPTS = 3;
    const PAGE_TIMEOUT_MS = 60000;
    const IMAGE_WAIT_MS = 8000;
    let buffer = null;
    let isValidPdf = false;

    for (let attempt = 1; attempt <= MAX_PDF_ATTEMPTS; attempt += 1) {
        let browser = null;
        try {
            // eslint-disable-next-line no-await-in-loop
            browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
            // eslint-disable-next-line no-await-in-loop
            const page = await browser.newPage();

            // The logo is already inlined as a data URI, so web fonts are the only remaining external
            // resource that can block the print — abort them (data: URIs and images pass through).
            // eslint-disable-next-line no-await-in-loop
            await page.setRequestInterception(true);
            page.on("request", (request) => {
                try {
                    const url = request.url();
                    if (url.startsWith("data:")) {
                        request.continue();
                        return;
                    }
                    if (request.resourceType() === "font" || FONT_HOST_DENYLIST.some((host) => url.includes(host))) {
                        request.abort();
                        return;
                    }
                    request.continue();
                } catch (_) {
                    try { request.continue(); } catch (__) { /* request already handled */ }
                }
            });

            // eslint-disable-next-line no-await-in-loop
            await page.setContent(html, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });

            // eslint-disable-next-line no-await-in-loop
            await Promise.race([
                page.evaluate(
                    () => Promise.all(
                        Array.from(document.images || []).map((img) => (img.complete
                            ? Promise.resolve()
                            : new Promise((resolve) => {
                                const t = setTimeout(resolve, 5000);
                                img.addEventListener("load", () => { clearTimeout(t); resolve(); });
                                img.addEventListener("error", () => { clearTimeout(t); resolve(); });
                            })))
                    )
                ),
                new Promise((resolve) => { setTimeout(resolve, IMAGE_WAIT_MS); }),
            ]);

            // eslint-disable-next-line no-await-in-loop
            const pdfBytes = await page.pdf({
                format: "A4",
                preferCSSPageSize: false,
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: TICKET_PDF_FOOTER,
                margin: { top: '6mm', bottom: '16mm', left: '0mm', right: '6mm' },
                timeout: PAGE_TIMEOUT_MS,
            });
            buffer = Buffer.from(pdfBytes);

            const pdfHeader = buffer.subarray(0, 4).toString();
            isValidPdf = buffer.length > 1024 && pdfHeader === "%PDF";
            if (isValidPdf) break;

            customLog(traceId, "error", {
                message: "Flight ticket PDF attempt produced invalid output, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                reason: `Invalid PDF buffer (${buffer.length} bytes, header: ${pdfHeader || "empty"})`,
                htmlLength: html?.length || 0,
            });
        } catch (err) {
            customLog(traceId, "error", {
                message: "Flight ticket PDF attempt threw, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                errorMessage: err?.message || String(err),
                errorStack: err?.stack,
                htmlLength: html?.length || 0,
            });
        } finally {
            if (browser) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await browser.close();
                } catch (_) { /* browser already gone */ }
            }
        }
        if (attempt < MAX_PDF_ATTEMPTS) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => { setTimeout(resolve, 1500 * attempt); });
        }
    }

    return { isValidPdf, buffer };
};

// Upper bound on how long the ticket mailer may run before an awaiting caller is released. The
// mailer is callback-based, so this guards against a transport that never invokes its callback and
// would otherwise hang any caller awaiting delivery.
const TICKET_DELIVERY_TIMEOUT_MS = 120000;

async function generateAttachmentAndSendEmailAndNotification(data, req, serviceDetails, callback, invoiceAttachments = []) {
    try {
        const ticketData = await createDataForFlightTicket(data, serviceDetails)
        
        const { ticketReceiverEmailId } = ticketData
        customLog(req?.LogTraceId, "info", {
            message: "Ticket email recipient resolved",
            ticketReceiverEmailId: ticketReceiverEmailId || null
        });
        let templateDetails = await fetchPartnerDetails(data?.registeredBy)
        // Inline the partner logo as a data URI for the PDF only — Puppeteer has no egress.
        // Email clients block data: URIs, so the email keeps the hosted logo URL.
        const pdfTemplateDetails = { ...templateDetails, logo: await fetchAsDataUri(templateDetails?.logo) };

        const html = airLineTicketTemplate({ ...ticketData, ...data }, pdfTemplateDetails);
        customLog(req?.LogTraceId, "info", { message: "HTML created, create pdf buffer"})
        const pdfBaseName = (ticketData?.pdfName || "Flight Ticket").replace(/\.pdf$/i, "");
        const { isValidPdf, buffer } = await generateFlightTicketPdf(html, req?.LogTraceId);

        let files = [];
        if (!isValidPdf) {
            customLog(req?.LogTraceId, "error", {
                message: "Flight ticket PDF generation failed after all retries; sending confirmation email without attachment",
                htmlLength: html?.length || 0,
                bufferSize: buffer?.length || 0,
            });
        } else {
            files = [{ filename: `${pdfBaseName}.pdf`, content: buffer, contentType: "application/pdf" }];
            customLog(req?.LogTraceId, "info", { message: "PDF buffer created", bufferSize: buffer.length })
        }

        const fallbackSubject = "Your flight ticket confirmed";
        const resolvedFlightConfirmation = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.FLIGHT_CONFIRMATION,
            service: EMAIL_TEMPLATE_SERVICES.FLIGHT,
            variables: {
                userName: ticketData?.userName,
                branding: templateDetails?.branding || 'Peko',
                website: templateDetails?.baseUrl || 'https://peko.one/in',
                baseUrl: templateDetails?.baseUrl,
                ...v2LayoutVariables(templateDetails),
            },
            fallback: () => flightConfirmationTemplate(ticketData, templateDetails),
            fallbackSubject,
            partnerId: data?.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });
        const subject = resolvedFlightConfirmation.subject;
        const body = resolvedFlightConfirmation.html;

        // Corporate (the payer) gets a copy of everything — ticket + invoice + receipt.
        // Sent separately from the traveller's email so the traveller only ever gets the
        // ticket, never the billing documents. Fire-and-forget: a failure here must not
        // block ticket delivery to the traveller.
        const corporateEmail = req?.user?.email;
        const corporateAttachments = [...files, ...invoiceAttachments];
        if (corporateAttachments.length > 0) {
            if (corporateEmail) {
                emailer.emailWithMultipleAttachment(
                    corporateEmail,
                    "Your flight ticket, invoice & receipt",
                    body,
                    corporateAttachments,
                    null,
                    (corporateEmailErr) => {
                        if (corporateEmailErr) {
                            customLog(req?.LogTraceId, 'error', {
                                message: 'Flight ticket/invoice/receipt email to corporate failed',
                                corporateTxnId: data?.corporateTxnId,
                                pnr: data?.PNR,
                                errorMessage: corporateEmailErr?.message || String(corporateEmailErr)
                            });
                        } else {
                            customLog(req?.LogTraceId, 'info', {
                                message: 'Flight ticket/invoice/receipt emailed to corporate',
                                corporateTxnId: data?.corporateTxnId,
                                pnr: data?.PNR,
                                corporateEmail
                            });
                        }
                    }
                );
            } else {
                customLog(req?.LogTraceId, "error", {
                    message: "Flight ticket/invoice/receipt email skipped: no corporate email on request",
                    corporateTxnId: data?.corporateTxnId,
                    pnr: data?.PNR,
                });
            }
        }

        if (!ticketReceiverEmailId) {
            customLog(req?.LogTraceId, "error", {
                message: "Ticket email skipped: no recipient (both userContactDetails.emailAddress and credential.email empty)",
                corporateTxnId: data?.corporateTxnId,
                pnr: data?.PNR,
                inbountPNR: data?.inbountPNR,
                ticketReceiverEmailId
            })
            return callback(null, true);
        }

        customLog(req?.LogTraceId, 'info', {
            message: 'Flight ticket — handing off to emailer.emailWithMultipleAttachment',
            corporateTxnId: data?.corporateTxnId,
            pnr: data?.PNR,
            inbountPNR: data?.inbountPNR,
            ticketReceiverEmailId,
            hasPdfAttachment: files.length > 0,
            pdfAttachmentBytes: files[0]?.content?.length || 0
        })
        // The mailer is callback-based; await it so this function resolves only after the email is
        // sent (or a bounded timeout elapses), and any caller awaiting this function waits for full
        // delivery instead of just the kickoff. `callback(err, result)` is still invoked exactly
        // once for the caller's logging/error handling; a late mailer response after the timeout is
        // ignored.
        await new Promise((resolveMail) => {
            let mailSettled = false;
            const settleMail = (settleErr, settleResult) => {
                if (mailSettled) return;
                mailSettled = true;
                // Always release the awaiter even if the caller's callback throws (e.g. a log line
                // dereferences a missing field), so ticket delivery can never hang the request or
                // escape as an unhandled rejection in a timer/async context.
                try {
                    callback(settleErr, settleResult);
                } catch (cbErr) {
                    customLog(req?.LogTraceId, 'error', {
                        message: 'Ticket delivery callback threw; releasing awaiter anyway',
                        corporateTxnId: data?.corporateTxnId,
                        pnr: data?.PNR,
                        errorMessage: cbErr?.message || String(cbErr)
                    });
                } finally {
                    resolveMail();
                }
            };
            const mailTimer = setTimeout(() => {
                customLog(req?.LogTraceId, 'error', {
                    message: 'Flight ticket emailer did not respond within timeout',
                    corporateTxnId: data?.corporateTxnId,
                    pnr: data?.PNR,
                    inbountPNR: data?.inbountPNR,
                    ticketReceiverEmailId,
                    timeoutMs: TICKET_DELIVERY_TIMEOUT_MS
                });
                settleMail(new Error('Flight ticket emailer timed out'), null);
            }, TICKET_DELIVERY_TIMEOUT_MS);
            // Call email function to send email with payment details in the body
            emailer.emailWithMultipleAttachment(ticketReceiverEmailId, subject, body, files, null, async (emailErr) => {
                clearTimeout(mailTimer);
                if (emailErr) {
                    customLog(req?.LogTraceId, 'error', {
                        message: 'Flight ticket emailer REJECTED (SMTP/transport error)',
                        corporateTxnId: data?.corporateTxnId,
                        pnr: data?.PNR,
                        inbountPNR: data?.inbountPNR,
                        ticketReceiverEmailId,
                        errorMessage: emailErr?.message || String(emailErr),
                        errorCode: emailErr?.code,
                        errorCommand: emailErr?.command,
                        errorResponseCode: emailErr?.responseCode,
                        errorResponse: emailErr?.response,
                        errorStack: emailErr?.stack
                    })
                    settleMail(emailErr, null);
                } else {
                    customLog(req?.LogTraceId, 'info', {
                        message: 'Flight ticket emailer ACCEPTED — confirmation sent',
                        corporateTxnId: data?.corporateTxnId,
                        pnr: data?.PNR,
                        inbountPNR: data?.inbountPNR,
                        ticketReceiverEmailId
                    })
                    settleMail(null, true);
                }
            });
        });
    } catch (err) {
        customLog(req?.LogTraceId, "error", {
            message: "Flight details confirmation mail failed (exception in generateAttachmentAndSendEmailAndNotification)",
            corporateTxnId: data?.corporateTxnId,
            pnr: data?.PNR,
            inbountPNR: data?.inbountPNR,
            errorMessage: err?.message || String(err),
            errorCode: err?.code,
            errorStack: err?.stack
        })
        callback(err, null);
    }
}

// Resends the flight ticket confirmation email for a SUCCESS airline order,
// reusing the exact payment-success delivery path
// (generateAttachmentAndSendEmailAndNotification + a live TBO retrieve) so the
// resent mail is identical to the original. Called by the unified resend-booking
// dispatcher; receives the already-fetched order. Resolves once the mail is
// handed to the mailer, throws (ErrorResponse) on a recoverable validation issue.
exports.resendFlightTicketEmail = async (order, logTraceId) => {
    // Resolve airline vendor credentials (TBO endpoints + creds) for the live
    // retrieve + session.
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceDetails || serviceDetails.error) {
        throw new ErrorResponse("Airline service is currently unavailable", 500);
    }

    // flightBooking rows exist only for airline bookings; the outbound row is
    // created first, the inbound row (round trip) second.
    const bookings = await flightBooking.findAll({
        where: { orderId: order.id },
        include: [{ model: credential }],
        order: [["id", "ASC"]],
    });
    if (!bookings.length) {
        throw new ErrorResponse("Flight booking details not found for this order", 404);
    }

    const outbound = bookings[0];
    const inbound = bookings[1];
    if (!outbound.PNR) {
        throw new ErrorResponse("Booking PNR not available; cannot regenerate ticket", 400);
    }

    const { token } = await getSession(serviceDetails, logTraceId);
    if (!token) {
        throw new ErrorResponse("Airline service is currently unavailable", 500);
    }

    const ticketData = {
        orderId: order.id,
        corporateTxnId: String(order.corporateTxnId),
        passengers: outbound.passengers,
        TokenId: token,
        PNR: outbound.PNR,
        inbountPNR: inbound?.PNR,
        registeredBy: outbound.credential?.registeredBy,
        surcharge: order.surcharge,
    };

    customLog(logTraceId, "info", {
        message: "resendFlightTicketEmail: triggering flight confirmation email resend",
        corporateTxnId: ticketData.corporateTxnId,
        pnr: ticketData.PNR,
        inbountPNR: ticketData.inbountPNR || null,
    });

    const mockReq = { LogTraceId: logTraceId };
    await new Promise((resolve, reject) => {
        generateAttachmentAndSendEmailAndNotification(ticketData, mockReq, serviceDetails, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

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

const createDataForFlightTicket = async (data, serviceDetails) => {
    const { orderId, passengers, TokenId, PNR, inbountPNR} = data
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
    let passengersDetails = ticketDetails.Passenger.map((passenger) => {
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
        let { BookingId, PNR, firstName, lastName, serviceDetails } = params

        const buildRetrieveBookingConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/GetBookingDetails`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                BookingId,
                PNR,
                "FirstName": firstName,
                "LastName": lastName
            })
        });

        const result = await callTboWithRetry({
            buildConfig: buildRetrieveBookingConfig,
            serviceDetails,
            loggerTraceId: params?.LogTraceId,
            endpoint: 'GetBookingDetails',
            logRequest: (config, isRetry) => customLog(params?.LogTraceId, "info", {
                message: `[airline:GetBookingDetails] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetBookingDetails",
                bookingId: BookingId,
                pnr: PNR,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(params?.LogTraceId, "info", {
                message: `[airline:GetBookingDetails] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetBookingDetails",
                statusCode: response?.status,
                bookingId: response?.data?.Response?.FlightItinerary?.BookingId,
                pnr: response?.data?.Response?.FlightItinerary?.PNR,
                status: response?.data?.Response?.FlightItinerary?.Status,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

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
            responseData: error?.response?.data,
            errorStack: error?.stack,
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
      console.log("segments", segments)
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

    //   const paxTypeDetails = { ADT: "Adult", CHD: "Child", INF: "Infant" };
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
          carryOnBaggage: [flight.CabinBaggage || "- KG"],
          checkedInBaggage: [flight.Baggage],
          // Aircraft/equipment type from the GDS; rendered only when present (else omitted).
          aircraftType: flight.Craft || "",
          layOver: `Layover: ${formatMinutesToHour(flight.GroundTime)}`,
        }
      })
      console.log("🚀 ~ forTicketFlightDetail ~ updated:", updated)
      updatedJourney.push(updated)
    }

    return updatedJourney;
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

function formatMinutesToHour(time) {
  if(!time && time != 0) return "NA"; 
  return `${parseInt(time / 60)} hrs ${time % 60} mins`  
}

// fetch agency balance from vendor
async function findAgencyBalance(serviceDetails, LogTraceId) {
    try {
        const buildAgencyBalanceConfig = (auth) => ({
            method: 'post',
            url: `${serviceDetails.vendor.healthUrl}/rest/GetAgencyBalance`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                ClientId: serviceDetails.vendor.optional3,
                TokenAgencyId: auth.agencyId,
                TokenMemberId: auth.memberId,
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": auth.token,
            })
        });

        const logRequest = (config, isRetry) => customLog(LogTraceId, "info", {
            message: `[airline:GetAgencyBalance] request${isRetry ? ' (retry)' : ''}`,
            endpoint: "GetAgencyBalance",
            requestUrl: config.url,
            requestMethod: config.method,
            requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
        }, "VENDOR");

        const logResponse = (resp, isRetry) => customLog(LogTraceId, "info", {
            message: `[airline:GetAgencyBalance] response${isRetry ? ' (retry)' : ''}`,
            endpoint: "GetAgencyBalance",
            statusCode: resp?.status,
            agencyBalance: resp?.data?.CashBalance,
            vendorErrorCode: resp?.data?.Error?.ErrorCode,
            vendorErrorMessage: resp?.data?.Error?.ErrorMessage,
            responseData: resp?.data,
        }, "VENDOR");

        let auth = await getSession(serviceDetails, { loggerTraceId: LogTraceId });
        if (!auth.token || !auth.memberId || !auth.agencyId) {
            throw new Error("Fetch authentication token failed");
        }
        let config = buildAgencyBalanceConfig(auth);
        logRequest(config, false);
        let response = await axios(config);
        logResponse(response, false);

        if (isTboTokenExpiredResponse(response)) {
            customLog(LogTraceId, 'info', {
                message: '[airline:GetAgencyBalance] retrying after Invalid/Expired Token',
                endpoint: 'GetAgencyBalance',
                vendorErrorCode: response?.data?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Error?.ErrorMessage,
            }, 'VENDOR');
            auth = await getSession(serviceDetails, { forceRefresh: true, loggerTraceId: LogTraceId });
            if (!auth.token || !auth.memberId || !auth.agencyId) {
                throw new Error("Failed to refresh authentication token");
            }
            config = buildAgencyBalanceConfig(auth);
            logRequest(config, true);
            response = await axios(config);
            logResponse(response, true);
        }

        if(!response || response.data?.Error?.ErrorCode) {
            customLog(LogTraceId, "error", {
                message: "[airline:GetAgencyBalance] failed",
                endpoint: "GetAgencyBalance",
                vendorErrorCode: response?.data?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR")
            throw new Error("Agency balance fetch api failed")
        }

        return response.data.CashBalance
    } catch (error) {
        customLog(LogTraceId, "error", {
            message: "[airline:GetAgencyBalance] error",
            endpoint: "GetAgencyBalance",
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        throw new Error("Agency balance fetch api failed")
    }
}
