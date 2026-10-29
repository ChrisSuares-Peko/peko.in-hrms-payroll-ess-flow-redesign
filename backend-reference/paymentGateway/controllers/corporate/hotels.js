const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
  findServiceOperatorByAccessKey,
} = require("../../utils/checkAndFetchServiceDetails");
const { findOneCredential } = require("../../models/use-cases/credential");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require("puppeteer");
const { fetchAsDataUri } = require("../../utils/imageToDataUri");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const operatorsData = require("../../utils/operatorsData.json");
let accessKey = operatorsData["hotel"]["accessKey"];
// let transactionCategory = operatorsData["hotel"]["category"];
const wallet = require("../../models/entities/wallet");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const { createNotification } = require("../../models/use-cases/notification");
const emailer = require("../../utils/emailer");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const emailTemplates = require('../../utils/emailTemplate/hotels');
const { customLog } = require("../../utils/loggerHelper");
const { publishMessagesInBatch } = require("../../utils/pubsubPublisher");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { findByEmail } = require("../../models/use-cases/setting");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { findOneOrderById, findOneOrderByTxnId } = require("../../models/use-cases/order");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

exports.payment = asyncHandler(async (req, res, next) => {
  let transactionCategory = "Travel";
  const credentialId = req.user.id;
  const transactionId = req.body.corporateTxnId || new Date().valueOf();
  let providerId = transactionId;
  const BookingCode = req.body.BookingCode
  const NetAmount = req.body.NetAmount
  const totalFare=req.body.amount
  const payCashback = req.body.payCashback;
  const account = req.body.account;
  const HotelRoomsDetails = req.body.HotelRoomsDetails
  const GuestNationality = req.body.GuestNationality
  const name = req.user.name;
  const emailId = req.user.email
  const packageId = req.user.packageId
  const corporateUserId = req.user.corporateId //will come from userObject
  const subCorporateEmail = req.user.subCorporateEmail;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;
  let templateDetails;
  req.user.registeredBy ?
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    :
    // eslint-disable-next-line no-unused-vars
    templateDetails = await fetchPartnerDetails()
  let serviceDetails = await checkService(req)
  if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    return next(new ErrorResponse(serviceDetails.error, 400))
  }
  const serviceDetail = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  })
  let commissionType = serviceDetail.commissionType;
  let cashbackType = serviceDetail.cashbackType;
  let providerCommission = serviceDetail.providerCommission;
  let corporateCashback = serviceDetail.cashback;
  let serviceOperatorId = serviceDetail.id;


   const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetail.surcharge,
        serviceDetail.surchargeType,
       totalFare,
       credentialId
    );
    const surcharge = surchargeDetails.surcharge;
  const username = serviceDetails.userName;
  const password = serviceDetails.password
  const authHeader = Buffer.from(`${username}:${password}`).toString('base64');
  let subCorporateUserId
        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            subCorporateUserId = req.user.subCorporateId;
        }
        let data = JSON.stringify(
          {
            "BookingCode": BookingCode,
            "IsVoucherBooking": true,
            "GuestNationality": GuestNationality,
            "EndUserIp": serviceDetails.EndUserIp,
            "RequestedBookingMode": 1,
            "NetAmount": NetAmount,
            "HotelRoomsDetails": HotelRoomsDetails
          })
          const corporateTxnId = req.body.corporateTxnId;

          const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
          const reportData = await computeJournalData({
            serviceDetails: serviceDetail,
            pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
            amount: Number(totalFare),
            paymentMethod: pgResponse?.payment_method || {},
            partnerDetails: templateDetails,
            paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
            couponTotalDiscount: req.body.couponTotalDiscount,
            corporateState: req.user.state || '',
            credentialId,
          });

          const commonParams = {
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            corporateCashback,
            accountNo: account,
            transactionCategory,
            orderAmount: totalFare,
            commissionType,
            cashbackType,
            providerCommission,
            payCashback,
            surcharge,
            subCorporateUserId,
            reportData,
          };
          let transactionResponse = {};
          if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            transactionResponse = await createPGTransaction({
              ...commonParams,
              pgAmount: req.body.pgAmount,
              pgResponse: req.body.paymentGatewayResponse,
              couponCode: req.body.couponCode,
              corporateUserId,
              partnerId: req.user.registeredBy
            });
          } else {
            transactionResponse = await createWalletTransaction({
              ...commonParams,
              amount: totalFare,
            });
          }
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
    return next(new ErrorResponse(transactionResponse["error"], 500));
  }

  publishJournalEvent(
    {
      transactionRef: corporateTxnId,
      type: "payment",
      contextSnapshot: {
        credentialId,
        vendor: serviceDetail?.vendor || null,
        registeredBy: req?.user?.registeredBy || null,
      },
      reportData,
    },
    req?.LogTraceId
  );

  let config = {
    method: 'post',
    url: `${serviceDetails.HEALTH_URL}/book`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authHeader}`,
    },
    data: data
  };
 
  customLog(req?.LogTraceId, "info", {config, message: "API Call for tbo hotel book API." });

  let response
  try {
    response = await axios(config);
   
    customLog(req?.LogTraceId, "info", {result:response.data, message: "API response from hotel book API." });

  } catch (e) {
    customLog(req?.LogTraceId, "error", { message: "🚀 ~ exports.payment=asyncHandler ~ err:", e })
  }
  const bookResult = response?.data?.BookResult;
  let updateDetails = {};
  if (
    !bookResult ||
    bookResult.VoucherStatus === false ||
    bookResult.Status === 0 ||
    bookResult.ResponseStatus !== 1 ||
    bookResult?.Error?.ErrorCode !== 0
  ) {
    // Failure case
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: bookResult?.Error?.ErrorMessage || "Booking Failed",
      errorCode: bookResult?.Error?.ErrorCode || "Unknown",
      registeredById: req.user.registeredBy,
      couponId: transactionResponse.couponId
    };

    try{
      if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
              const {status} = await cancelPGTransaction(corporateTxnId);
             if (status) {
               await refundWalletTransaction(updateDetails);
               publishJournalEvent(
                 {
                   transactionRef: corporateTxnId,
                   type: "refund",
                   contextSnapshot: {
                     credentialId,
                     vendor: serviceDetail?.vendor || null,
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
                   vendor: serviceDetail?.vendor || null,
                   registeredBy: req?.user?.registeredBy || null,
                 },
                 reportData,
               },
               req?.LogTraceId
             );
           }
    }catch(error){
      console.log("error",error)
    }
   
       
       
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: bookResult?.ConfirmationNo || "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: {
        hotelBookingDetails : {
          checkInDate: req.body.checkInDate,
          checkOutDate: req.body.checkOutDate,
          checkInTime: req.body.checkInTime,
          checkOutTime: req.body.checkoutTime,
          HotelImage: req.body.HotelImage,
          HotelImages: req.body?.HotelImages,
          LastCancellationDate: req.body.LastCancellationDate,
          CancelPolicies: req.body.CancelPolicies,
          HotelName: req.body.HotelName,
          TotalRooms: req.body.TotalRooms,
          IsRefundable:req.body.IsRefundable,
          HotelRoomsDetails:req.body?.HotelRoomsDetails,
          customerInfo:req.body?.customerInfo,
          TraceId: bookResult?.TraceId,
        }
      }
    }
  }
  
  if (updateDetails.message == "Payment Successful") {

  
               customLog(req?.LogTraceId, "info", { updateDetails, message: "updateDetails from payment function" });
   
               // Ensure orderResponse is always a string
               updateDetails.orderResponse = JSON.stringify({
                   ...(typeof updateDetails.orderResponse === "string"
                       ? JSON.parse(updateDetails.orderResponse)  // Parse if it's a string
                       : updateDetails.orderResponse || {}),     // Use existing object or empty object
               });
                  // Ensure corporateTxnId is always a string
                           if (updateDetails.corporateTxnId) {
                               updateDetails.corporateTxnId = String(updateDetails.corporateTxnId);
                           }
               
                           await updateWalletTransaction(updateDetails);
                        
   

// Calling balance check API

    const TraceId = bookResult.TraceId;
    const redisKey = 'tbo_balanceCheck';
    const cacheTTL = 3 * 24 * 60 * 60;
    let response
    try {
    
        const clientId = serviceDetails.ClientId
        
        const auth = await getSession(serviceDetails)
        if(!auth.tokenId || !auth.memberId || !auth.agencyId) {
            throw new Error("Fetch authentication token failed")
        }

        let data = JSON.stringify({
            "ClientId": clientId,
            "TokenAgencyId": auth.agencyId,
            "TokenMemberId": auth.memberId,
            "EndUserIp": serviceDetails.EndUserIp,
            "TokenId": auth.tokenId,
        });

        let config = {
            method: 'post',
            url: `${serviceDetails.AUTH_URL}/GetAgencyBalance`,
            headers: {
                'Content-Type': 'application/json',
              
            },
            data:data
        };
         customLog(req?.LogTraceId, "info", {config, message: "API Call for balance check." });
                response = await axios(config);
             
                customLog(req?.LogTraceId, "info", { message: "balance successfully fetched", response: response?.data });
            } catch (e) {
                customLog(req?.LogTraceId, "error", { message: "Error fetching Balance.", error: e?.message });
            }

          try {
            if (!response || !response.data) {
              customLog(req?.LogTraceId, "error", { message: "No Results found", response: response?.data });
            } else if (response.data.Status == 2) {
              customLog(req?.LogTraceId, "error", { message: "Balance fetch failed", response: response?.data.Status });
            } else {
              const fieldname = "pekoWebsite";
              const result = await findByEmail({ name: fieldname });
              if (!result?.details?.emails) {
                customLog(req?.LogTraceId, "error", { message: "Balance check: pekoWebsite setting not found or missing emails — skipping balance email" });
              } else {
                let to, cc;
                if (subCorporateEmail) {
                  to = subCorporateEmail;
                  cc = result.details.emails;
                } else {
                  to = result.details.emails;
                  cc = undefined;
                }
                const body = emailTemplates.BalanceEmailTemplate(response.data, templateDetails);
                const subject = "Peko India | Hotels balance reminder";
                emailer.email({ to, cc, subject, body }, function () {
                  customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
                });
              }
              setValue(redisKey, cacheTTL, JSON.stringify(response.data));
            }
          } catch (balanceEmailErr) {
            customLog(req?.LogTraceId, "error", { message: "Error in balance check email — skipping", error: balanceEmailErr});
          }


          updateDetails = {
            corporateTxnId,
            providerId: bookResult?.ConfirmationNo || "Not Available",
            status: "SUCCESS",
            message: "Payment Successful",
            orderResponse: {
              hotelBookingDetails : {
                checkInDate: req.body.checkInDate,
                checkOutDate: req.body.checkOutDate,
                checkInTime: req.body.checkInTime,
                checkOutTime: req.body.checkoutTime,
                HotelImage: req.body.HotelImage,
                HotelImages: req.body?.HotelImages,
                LastCancellationDate: req.body.LastCancellationDate,
                CancelPolicies: req.body.CancelPolicies,
                HotelName: req.body.HotelName,
                TotalRooms: req.body.TotalRooms,
                IsRefundable:req.body.IsRefundable,
                HotelRoomsDetails:req.body?.HotelRoomsDetails,
                customerInfo:req.body?.customerInfo,
                TraceId: bookResult?.TraceId,
              }
            }
          }


          // call BookingDetails immediately after payment if payment is success

          customLog(req?.LogTraceId, "info", { message: "processing processHotelBooking in payment ms", data:updateDetails });
          
                  let bookingDetailsResponse = null;
          
                  try {
                    bookingDetailsResponse = await getBookingDetails(serviceDetails, TraceId, req?.LogTraceId);

                    if (bookingDetailsResponse && typeof bookingDetailsResponse === 'object') {
                      bookingDetailsResponse.totalFare = totalFare;
                    }
                      const transactionId = updateDetails.corporateTxnId
                      customLog(req?.LogTraceId, "info", { updateDetails, message: "updateDetails before modification in payment ms:" });
                      
                    
          
                    // Step 1: Parse the existing orderResponse safely
          let existingOrderResponse = {};
          if (typeof updateDetails.orderResponse === 'string') {
              try {
                  existingOrderResponse = JSON.parse(updateDetails.orderResponse);
              } catch (err) {
                  customLog(req?.LogTraceId, 'error', { message: 'Invalid JSON in orderResponse in payment ms', error: err });
                  existingOrderResponse = {}; // Fallback to empty object
              }
          } else if (typeof updateDetails.orderResponse === 'object' && updateDetails.orderResponse !== null) {
              existingOrderResponse = updateDetails.orderResponse;
          }
          
          // Step 2: Add or merge bookingDetailsResponse to the existing orderResponse
          existingOrderResponse.bookingDetailsResponse = bookingDetailsResponse; // Add the new data
          // Persist the coupon discount applied at payment time so the hotel ticket PDF
          // (createDataForHotelTicket) can net it out of Total Amount later.
          existingOrderResponse.couponDiscount = transactionResponse.couponDiscount ?? 0;

          // Step 3: Stringify and assign the updated orderResponse back to updateDetails
          updateDetails.orderResponse = JSON.stringify(existingOrderResponse);
          
          
                      // Ensure corporateTxnId is always a string
                      if (updateDetails.corporateTxnId) {
                          updateDetails.corporateTxnId = String(updateDetails.corporateTxnId);
                      }
                      customLog(req?.LogTraceId, "info", { data:updateDetails.orderResponse, message: "order response after modification in payment ms:" });
          
          
                      await updateWalletTransaction(updateDetails);
                      customLog(req?.LogTraceId, "info", { transactionId, message: "log for getting transaction id in payment ms" });
          
                      const orderData = await findOneOrderByTxnId(transactionId)
          
                      customLog(req?.LogTraceId, "info", { data: orderData, message: "hotel order fetched in payment ms" });
                      const orderResponse = JSON.parse(orderData.orderResponse);
                      const emailId = orderResponse?.hotelBookingDetails?.customerInfo?.emailAddress
                      let templateDetails;
                      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
                      const data = {
                          email: emailId,
                          corporateEmail: req.user.email,
                          name: req.user.name,
                          orderId: orderData.id,
                          corporateTxnId: transactionId,
                          amount: parseFloat(orderData.amountInINR) + parseFloat(orderData.surcharge),
                          templateDetails,
                          traceId: req?.LogTraceId
                      }
                      console.log("detailss here",data)
                      data.registeredBy = req.user.registeredBy
                      customLog(req?.LogTraceId, "info", { response: data, message: "send email data..." });
                      // eslint-disable-next-line no-unused-vars



                      // send email only if booking is confirmed otherwise will send in 2 minutes

                      customLog(req?.LogTraceId, "info", { HotelBookingStatus: bookResult?.HotelBookingStatus, message: "HotelBookingStatus check before sending email" });
                       if(bookResult.HotelBookingStatus==='Confirmed'){
                        customLog(req?.LogTraceId, "info", { message: "sending mail after successful booking"})

                        const planDetails = [{
                          name: req.body.HotelName ? `Hotel Booking : ${req.body.HotelName}` : "Hotel Booking",
                          amount: Number(totalFare),
                          quantity: 1,
                        }];

                        const invoiceAttachments = await generateOrderInvoiceAttachments({
                          amount: totalFare,
                          surcharge,
                          couponDiscount: transactionResponse.couponDiscount ?? 0,
                          corporateTxnId,
                          orderId: transactionResponse.orderId,
                          paymentType: "Hotel Booking",
                          description: req.body.HotelName,
                          credentialId,
                          pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
                          paymentMethod: pgResponse?.payment_method,
                          vendor: serviceDetails?.vendor,
                          commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
                          planDetails,
                          commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
                          traceId: req?.LogTraceId,
                        });

                        await generateAttachmentAndSendEmailAndNotification(data, (err) => {
                          if (err) {
                              customLog(req?.LogTraceId, "error", {
                                  message: "Hotel booking confirmation mail failed (payment-success path)",
                                  corporateTxnId: transactionId,
                                  errorMessage: err?.message || String(err),
                                  errorCode: err?.code,
                              });
                          } else {
                              customLog(req?.LogTraceId, "info", { data: data, message: "email sent successfully" });
                          }
                      }, invoiceAttachments);

                      }

                    
                      } catch (error) {
                                  customLog(req?.LogTraceId, "error", {
                                      message: "🚀 ~ Error fetching booking details in payment ms:",
                                      error,
                                  });
                                 
                              }


  
   customLog(req?.LogTraceId, "info", { message: "display newUpdateDetails", data:updateDetails })
    // await publishMessagesInBatch([{ accessKey, delay: 120, serviceDetails, updateDetails, TraceId, userDetails:req.user }])


    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(totalFare) + parseFloat(surcharge) - (transactionResponse.couponDiscount ?? 0)).toFixed(2),
    };
    const notificationData = {
      notificationTitle: "Hotel Booking - Payment successful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Hotel Booking was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
   
    createNotification(notificationData);


     //if booking is not confirmed call bookingdetails api after 2 minutes
    if( bookResult?.HotelBookingStatus!=='Confirmed') {
      customLog(req?.LogTraceId, "info", { message: "waiting 2 minutes for getting booking details" })

      await publishMessagesInBatch([{ accessKey, delay: 120, serviceDetails, updateDetails, TraceId, userDetails:req.user }])
  
    }
    // await updateWalletTransaction(updateDetails);

  }

 
 
  if (updateDetails.message !== "Payment Successful") {
   
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(totalFare) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
    };
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    const serviceUrl = templateDetails?.baseUrl;
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
   const subject = "Transaction Failed"; // Set email subject
    const resolvedHotelFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.HOTEL_BOOKING_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.HOTEL,
      variables: {
        name,
        serviceName: "Hotel Booking",
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.baseUrl || 'https://peko.one/in',
        logo: templateDetails?.logo,
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => commonFailedTemplate(name, "Hotel Booking", serviceUrl, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedHotelFailed.html;
    emailer.email({to,cc, subject: resolvedHotelFailed.subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Hotel Booking - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Hotel Booking was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
   
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {
        ...{},
        corporateFinalBalance: walletDetails["balance"],
      },
      responseCode: "001",
    });
  } else {
    return res.status(200).json({
      status: true,
      data: {
        ...bookResult,
        ...transactionResponse,
        corporateTxnId,
      },
      message: "payment successfull",
      responseCode: "000",
    });
  }
})




const getBookingDetails = async (serviceDetails, TraceId, logTraceId) => {
    try {
        customLog(logTraceId, "info", { data:serviceDetails, message: "log for checking service details" });
        let token;
        try {

                   token = await getSession(serviceDetails)
               } catch (sessionError) {
                   customLog(logTraceId, "error", { message: "Failed to retrieve token", error: sessionError });
                   throw new Error("Something went wrong.");
               }
       
               if (!token.tokenId) {
                   customLog(logTraceId, "error", { message: "TokenId is null or undefined, skipping booking detail API call." });
                   throw new Error("Something went wrong.");
               }
        const username = serviceDetails.userName;
        const password = serviceDetails.password;
        const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify({
            "EndUserIp": serviceDetails.EndUserIp,
            "TokenId": token.tokenId,
            "TraceId": TraceId,
        });

        const config = {
            method: 'post',
            url: `${serviceDetails.HEALTH_URL}/GetBookingDetail`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`,
            },
            data: body,
        };

        customLog(logTraceId, "info", { config, message: "API Call for getting tbo bookingDetails config." });


        const response = await axios(config);
        
        customLog(logTraceId, "info", { response: response.data, message: "API Call for getting tbo bookingDetails." });

        // Check if response data exists and is valid
        if (!response?.data?.GetBookingDetailResult) {
            throw new Error("Invalid API response structure.");
        }

        const bookingDetails = response.data.GetBookingDetailResult;

        // Check API-specific errors in the response
        if (!bookingDetails.VoucherStatus || bookingDetails.ResponseStatus !== 1) {
            const errorMessage = bookingDetails?.Error?.ErrorMessage || "Unknown API error.";
            throw new Error(errorMessage);
        }

        return bookingDetails
    } catch (error) {
        customLog(logTraceId, "error", { message: "🚀 ~ Error in getBookingDetails", error });

        if (error.response) {
            // Server returned a response outside of the 2xx range
            throw new Error(error.response?.data?.message || "API Error");
        } else if (error.request) {
            // No response received
            throw new Error("No response from API server");
        } else {
            // Other unexpected errors
            throw new Error(error.message || "Internal Server Error");
        }
    }
};


const FONT_HOST_DENYLIST = ["fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net"];

const generateHotelTicketPdf = async (html, traceId) => {
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
                preferCSSPageSize: true,
                timeout: PAGE_TIMEOUT_MS,
            });
            buffer = Buffer.from(pdfBytes);

            const pdfHeader = buffer.subarray(0, 4).toString();
            isValidPdf = buffer.length > 1024 && pdfHeader === "%PDF";
            if (isValidPdf) break;

            customLog(traceId, "error", {
                message: "Hotel ticket PDF attempt produced invalid output, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                reason: `Invalid PDF buffer (${buffer.length} bytes, header: ${pdfHeader || "empty"})`,
                htmlLength: html?.length || 0,
            });
        } catch (err) {
            customLog(traceId, "error", {
                message: "Hotel ticket PDF attempt threw, will retry",
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

const TICKET_DELIVERY_TIMEOUT_MS = 120000;

async function generateAttachmentAndSendEmailAndNotification(params, callback, invoiceAttachments = []) {
    const logTraceId = params?.traceId ?? null;
    try {
        let data = await createDataForHotelTicket(params.orderId)

        customLog(logTraceId, "info", { response: data, message: "created data for hotelTicket" });

        let to = params.email;
        let user = params.name;

        if (!to) {
            customLog(logTraceId, "error", {
                message: "Hotel ticket email skipped: no recipient email on booking",
                corporateTxnId: params?.corporateTxnId,
                orderId: params?.orderId,
            });
            return callback(null, true);
        }

        const partnerDetails = params?.templateDetails;
        // Inline the logo as a data URI so it renders in the PDF without the headless browser
        // needing network egress to the logo CDN. Kept separate from partnerDetails (used below
        // for the actual email) since an email client just needs the real logo URL, not a data URI.
        const pdfPartnerDetails = { ...params?.templateDetails, logo: await fetchAsDataUri(params?.templateDetails?.logo) };

        const html = emailTemplates.hotelTicketPDFTemplateNew(data, pdfPartnerDetails);
        customLog(logTraceId, "info", { message: "HTML created, create pdf buffer", corporateTxnId: params?.corporateTxnId });

        const pdfBaseName = (data?.pdfName || "Hotel Ticket").replace(/\.pdf$/i, "");
        const { isValidPdf, buffer } = await generateHotelTicketPdf(html, logTraceId);

        let files = [];
        if (!isValidPdf) {
            customLog(logTraceId, "error", {
                message: "Hotel ticket PDF generation failed after all retries; sending confirmation email without attachment",
                corporateTxnId: params?.corporateTxnId,
                htmlLength: html?.length || 0,
                bufferSize: buffer?.length || 0,
            });
        } else {
            files = [{ filename: `${pdfBaseName}.pdf`, content: buffer, contentType: "application/pdf" }];
            customLog(logTraceId, "info", { message: "PDF buffer created", bufferSize: buffer.length, corporateTxnId: params?.corporateTxnId });
        }

        const subject = "Your hotel booking confirmed";
        const bd = data.bookingData || {};
        const mainGuest = data.passengers?.[0]?.passengers?.[0];
        const convertDateToDDMMYYYY = (dateStr) => {
            if (!dateStr) return "N/A";
            return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
        };
        const convertTimeTo12HR = (dateStr) => {
            if (!dateStr) return "N/A";
            return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).replace(/am|pm/i, (m) => m.toUpperCase());
        };
        const nights = bd.nights;
        const bookingDataWithRef = { ...bd, bookingReferenceId: data?.bookingReferenceId };

        // Staging always uses Peko's own staging URL (one shared domain for testing).
        // Production uses the partner's own baseUrl, since white-label partners have
        // their own frontend domain there.
        const manageBookingBaseUrl = partnerDetails?.baseUrl;

        const resolvedHotelConfirmation = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.HOTEL_BOOKING_CONFIRMATION,
            service: EMAIL_TEMPLATE_SERVICES.HOTEL,
            variables: {
                user,
                hotelName: bd.HotelName,
                address: bd.AddressLine1,
                bookingReferenceId: data?.bookingReferenceId,
                checkInDate: convertDateToDDMMYYYY(bd.CheckInDate),
                checkInTime: convertTimeTo12HR(bd.CheckInDate),
                checkOutDate: convertDateToDDMMYYYY(bd.CheckOutDate),
                checkOutTime: convertTimeTo12HR(bd.CheckOutDate),
                hotelAdultCount: bd.hotelAdultCount,
                hotelChildCount: bd.hotelChildCount,
                nightsText: `${nights} ${nights === 1 ? 'Night' : 'Nights'}`,
                hotelRoomCount: bd.hotelRoomCount,
                mainGuestLabel: mainGuest ? `${mainGuest.PassengerName} (${mainGuest.PassengerType})` : "",
                hotelImageUrl: bd.HotelImage ? bd.HotelImage.replace(/ /g, "%20") : "https://peko-storage.s3.me-central-1.amazonaws.com/staging/common/templates/fogg-welcome-by-man.png",
                manageBookingUrl: `${manageBookingBaseUrl}/corporate-travel/hotels/manage-bookings`,
                branding: partnerDetails?.branding || 'Peko',
                ...v2LayoutVariables(partnerDetails),
            },
            fallback: () => emailTemplates.generateHotelTicketAndSendToMailNew({ user }, bookingDataWithRef, mainGuest, { ...partnerDetails, baseUrl: manageBookingBaseUrl }),
            fallbackSubject: subject,
            logTraceId,
        });
        const resolvedSubject = resolvedHotelConfirmation.subject;
        const body = resolvedHotelConfirmation.html;

        customLog(logTraceId, "info", {
            message: "Hotel ticket — handing off to emailer.emailWithMultipleAttachment",
            corporateTxnId: params?.corporateTxnId,
            ticketReceiverEmailId: to,
            hasPdfAttachment: files.length > 0,
            pdfAttachmentBytes: files[0]?.content?.length || 0,
        });

        await new Promise((resolveMail) => {
            let mailSettled = false;
            const settleMail = (settleErr, settleResult) => {
                if (mailSettled) return;
                mailSettled = true;
                try {
                    callback(settleErr, settleResult);
                } catch (cbErr) {
                    customLog(logTraceId, "error", {
                        message: "Hotel ticket delivery callback threw; releasing awaiter anyway",
                        corporateTxnId: params?.corporateTxnId,
                        errorMessage: cbErr?.message || String(cbErr),
                    });
                } finally {
                    resolveMail();
                }
            };
            const mailTimer = setTimeout(() => {
                customLog(logTraceId, "error", {
                    message: "Hotel ticket emailer did not respond within timeout",
                    corporateTxnId: params?.corporateTxnId,
                    ticketReceiverEmailId: to,
                    timeoutMs: TICKET_DELIVERY_TIMEOUT_MS,
                });
                settleMail(new Error("Hotel ticket emailer timed out"), null);
            }, TICKET_DELIVERY_TIMEOUT_MS);
            emailer.emailWithMultipleAttachment(to, resolvedSubject, body, files, undefined, (emailErr) => {
                clearTimeout(mailTimer);
                if (emailErr) {
                    customLog(logTraceId, "error", {
                        message: "Hotel ticket emailer REJECTED (SMTP/transport error)",
                        corporateTxnId: params?.corporateTxnId,
                        ticketReceiverEmailId: to,
                        errorMessage: emailErr?.message || String(emailErr),
                        errorCode: emailErr?.code,
                        errorResponseCode: emailErr?.responseCode,
                        errorStack: emailErr?.stack,
                    });
                    settleMail(emailErr, null);
                } else {
                    customLog(logTraceId, "info", {
                        message: "Hotel ticket emailer ACCEPTED — confirmation sent",
                        corporateTxnId: params?.corporateTxnId,
                        ticketReceiverEmailId: to,
                    });
                    settleMail(null, true);
                }
            });
        });

        if (params.corporateEmail && invoiceAttachments.length > 0) {
            await new Promise((resolveInvoiceMail) => {
                emailer.emailWithMultipleAttachment(
                    params.corporateEmail,
                    subject,
                    body,
                    invoiceAttachments,
                    undefined,
                    (invoiceErr) => {
                        if (invoiceErr) {
                            customLog(logTraceId, "error", {
                                message: "Hotel invoice email to corporate was rejected",
                                corporateTxnId: params?.corporateTxnId,
                                corporateEmail: params.corporateEmail,
                                errorMessage: invoiceErr?.message || String(invoiceErr),
                            });
                        } else {
                            customLog(logTraceId, "info", {
                                message: "Hotel invoice email sent to corporate",
                                corporateTxnId: params?.corporateTxnId,
                                corporateEmail: params.corporateEmail,
                                invoiceAttachmentCount: invoiceAttachments.length,
                            });
                        }
                        resolveInvoiceMail();
                    }
                );
            });
        }
    } catch (err) {
        customLog(logTraceId, "error", {
            message: "Hotel booking confirmation mail failed (exception in generateAttachmentAndSendEmailAndNotification)",
            corporateTxnId: params?.corporateTxnId,
            errorMessage: err?.message || String(err),
            errorCode: err?.code,
            errorStack: err?.stack,
        });
        callback(err, null);
    }
}

async function createDataForHotelTicket(orderId) {
    try {
        const order = await findOneOrderById(orderId)
        let orderResponse = JSON.parse(order.orderResponse)
       
        let {

            HotelImage,

            HotelName,
             checkInDate,
            checkOutDate,
            checkInTime,
            checkOutTime,

            // eslint-disable-next-line no-unsafe-optional-chaining
        } = orderResponse?.hotelBookingDetails
        // let {
        //     CheckInDate,
        //     CheckOutDate,

        // } = orderResponse?.bookingDetailsResponse


        let { BookingRefNo, BookingDate, } = orderResponse.bookingDetailsResponse

        let transactionDate = BookingDate
        const TotalRooms = orderResponse.bookingDetailsResponse.NoOfRooms
        // const BookingRefNo = orderResponse.BookingRefNo


        let passengersDetails = orderResponse.bookingDetailsResponse.Rooms || []
      
        const simplifiedPassengerTypes = passengersDetails.map((room) => ({
           
            passengers: room.HotelPassenger.map((passenger) => ({
                PassengerType: passenger.Age > 12 ? "Adult" : "Child",
                PassengerName: `${passenger.FirstName} ${passenger.LastName}`, // Added space between names
                Email: passenger.Email,
                Phoneno: passenger.Phoneno,
            })),
        }));
       
        orderResponse.bookingDetailsResponse.PassengerTypes = simplifiedPassengerTypes;
        const checkInDate1 = new Date(checkInDate);
        const checkOutDate1 = new Date(checkOutDate);
        const timeDiff = checkOutDate1.getTime() - checkInDate1.getTime();
        const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const RoomTypeName = orderResponse.bookingDetailsResponse.Rooms?.map(room => room.RoomTypeName);
       
        const CancellationPolicy = orderResponse.bookingDetailsResponse.Rooms?.[0]?.CancellationPolicy

        let adultCount = 0;
        let childCount = 0;
        let passengers = orderResponse?.bookingDetailsResponse.PassengerTypes || []

        passengers?.forEach((passenger) => {

            passenger?.passengers?.forEach((item) => {
                if (item.PassengerType === "Adult") {
                    adultCount++;
                } else if (item.PassengerType === "Child") {
                    childCount++;
                }
            });
        });



        let AddressLine1 = orderResponse.bookingDetailsResponse.AddressLine1
        let HotelPolicyDetail = orderResponse.bookingDetailsResponse?.RateConditions
        // HotelPolicyDetail = HotelPolicyDetail?.replace(/INR/g, "₹");

        const bookingData = {
            HotelName,
            AddressLine1,
            transactionDate,
            CheckInDate:checkInDate,
            CheckOutDate:checkOutDate,
            CheckInTime:checkInTime,
            CheckOutTime:checkOutTime,
            HotelImage,
            nights: nightDifference,
            hotelAdultCount: adultCount == 1 ? adultCount + ' Adult' : adultCount + ' Adults',
            hotelChildCount: (childCount == 1 || childCount == 0) ? childCount + ' Child' : childCount + ' Children',
            hotelRoomCount: TotalRooms == 1 ? TotalRooms + ' Room' : TotalRooms + ' Rooms',
            CancellationPolicy,
            RoomTypeName,
            HotelPolicyDetail,

        };
        const netAmount = orderResponse?.bookingDetailsResponse?.totalFare

        const data = {
            bookingReferenceId: order?.providerId || BookingRefNo,
            amount: parseFloat(netAmount).toFixed(2),
            hotelTicketHTML: '',
            bookingData,
            passengers: passengers,
            surcharge: parseFloat(order?.surcharge || 0).toFixed(2),
            // couponDiscount is persisted onto orderResponse by exports.payment (the only
            // point where transactionResponse.couponDiscount is known) since orders has no
            // dedicated discount column.
            totalAmount: (parseFloat(order.baseAmount) - parseFloat(orderResponse?.couponDiscount || 0)).toFixed(2),
            pdfName: `${bookingData?.HotelName} – Booking Confirmation`,
        }

        return data
    } catch (error) {
        return error
    }

}

// const getBookingDetails = async (serviceDetails, TraceId) => {
//   try {
//     const tokenId = await getSession(serviceDetails);
//     console.log("tokenId", tokenId);

//     const username = serviceDetails.userName;
//     const password = serviceDetails.password;
//     const authHeader = Buffer.from(`${username}:${password}`).toString('base64');

//     const body = JSON.stringify({
//       "EndUserIp": "49.47.194.253",
//       "TokenId": tokenId,
//       "TraceId": TraceId,
//     });

//     console.log(body, "BODY");
//     console.log(`http://HotelBE.tektravels.com/internalhotelservice.svc/rest/GetBookingDetail`);

//     const config = {
//       method: 'post',
//       url: `http://HotelBE.tektravels.com/internalhotelservice.svc/rest/GetBookingDetail`,
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Basic ${authHeader}`,
//       },
//       data: body,
//     };

//     const response = await axios(config);

//     // Check if response data exists and is valid
//     if (!response?.data?.GetBookingDetailResult) {
//       throw new Error("Invalid API response structure.");
//     }

//     const bookingDetails = response.data.GetBookingDetailResult;

//     // Check API-specific errors in the response
//     if (!bookingDetails.VoucherStatus || bookingDetails.ResponseStatus !== 1) {
//       const errorMessage = bookingDetails?.Error?.ErrorMessage || "Unknown API error.";
//       throw new Error(errorMessage);
//     }

//     return bookingDetails
//   } catch (error) {
//     customLog("LogTraceId", "error", { message: "🚀 ~ Error in getBookingDetails", error });

//     if (error.response) {
//       // Server returned a response outside of the 2xx range
//       throw new Error(error.response?.data?.message || "API Error");
//     } else if (error.request) {
//       // No response received
//       throw new Error("No response from API server");
//     } else {
//       // Other unexpected errors
//       throw new Error(error.message || "Internal Server Error");
//     }
//   }
// };

// Builds the hotel vendor serviceDetails (creds + endpoints) for a resend,
// mirroring checkService()'s mapping but without a request/cashback context —
// only needed for the booking-detail re-fetch fallback.
const getHotelServiceDetailsForResend = async () => {
    const operator = await findServiceOperatorByAccessKey(accessKey);
    if (!operator || operator.error || !operator.vendor) return null;
    const vendor = operator.vendor;
    const optionals = vendor.optionals || {};
    return {
        userName: vendor.optional1,
        password: vendor.optional2,
        ClientId: vendor.optional3,
        EndUserIp: optionals.endUserIp,
        AUTH_URL: optionals.hotelsAuth,
        HEALTH_URL: vendor.healthUrl,
    };
};

// Resends the hotel booking confirmation email for a SUCCESS hotel order, reusing
// the payment-success delivery path. Works from the booking details cached in
// order.orderResponse; re-fetches them from the vendor (and persists) only when
// they were never stored. Resolves once the mail is handed to the mailer; throws
// (ErrorResponse) on a recoverable validation issue.
exports.resendHotelTicketEmail = async (order, logTraceId) => {
    let orderResponse = {};
    try {
        orderResponse = JSON.parse(order.orderResponse);
    } catch (_) {
        orderResponse = {};
    }

    if (!orderResponse.bookingDetailsResponse) {
        const traceId = orderResponse?.hotelBookingDetails?.TraceId;
        if (!traceId) {
            throw new ErrorResponse("Booking trace id not found; cannot regenerate ticket", 400);
        }
        const serviceDetails = await getHotelServiceDetailsForResend();
        if (!serviceDetails) {
            throw new ErrorResponse("Hotel service is currently unavailable", 500);
        }
        const bookingDetailsResponse = await getBookingDetails(serviceDetails, traceId, logTraceId);
        orderResponse.bookingDetailsResponse = bookingDetailsResponse;
        await order.update({ orderResponse: JSON.stringify(orderResponse) });
    }

    const credential = await findOneCredential({ id: order.credentialId });
    const templateDetails = await fetchPartnerDetails(credential.registeredBy);

    const params = {
        email: orderResponse?.hotelBookingDetails?.customerInfo?.emailAddress,
        name: credential?.name || "",
        orderId: order.id,
        corporateTxnId: String(order.corporateTxnId),
        templateDetails,
        registeredBy: credential?.registeredBy,
        traceId: logTraceId,
    };

    customLog(logTraceId, "info", {
        corporateTxnId: params.corporateTxnId,
        message: "resendHotelTicketEmail: sending hotel booking confirmation email",
    });

    await new Promise((resolve, reject) => {
        generateAttachmentAndSendEmailAndNotification(params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

async function checkService(req) {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId;
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
 
  const authUrlObj = serviceDetails.vendor.optionals
  const authUrl = authUrlObj ? authUrlObj.hotelsAuth : null;

  const bookObj = serviceDetails.vendor.optionals
  // const bookUrl = bookObj ? bookObj.hotelBook : null;
  const endUserIp= bookObj.endUserIp
     
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return serviceDetails;
  }
  return {
    userName: serviceDetails.vendor.optional1,
    password: serviceDetails.vendor.optional2,
    companyCode: serviceDetails.vendor.optional3,
    ClientId: serviceDetails.vendor.optional3,
    X_API_KEY: serviceDetails.vendor.optional4,
    API_URL: serviceDetails.vendor.apiUrl,
    HEALTH_URL: serviceDetails.vendor.healthUrl,
    AUTH_URL: authUrl,
    // BOOK_URL:bookUrl,
    EndUserIp: endUserIp,
    vendor: serviceDetails.vendor,
  };
}

async function getSession(serviceDetails) {
   try {
      
    let tokenId = await getValue(`tokenId-${accessKey}`);
    const memberId = await getValue(`memberId-${accessKey}`);
    const agencyId = await getValue(`agencyId-${accessKey}`);
     if (tokenId && tokenId !== "null") {
        return {
            tokenId: tokenId,
            memberId: memberId !== "null" ? memberId : null,
            agencyId: agencyId !== "null" ? agencyId : null
        };
    } else {
        try {
            let data = JSON.stringify({
                 "ClientId": serviceDetails.ClientId,
                    "UserName": serviceDetails.userName,
                    "Password": serviceDetails.password,
                    "EndUserIp": serviceDetails.EndUserIp,
            });
        
            let config = {
                method: "post",
                url: `${serviceDetails.AUTH_URL}/Authenticate`,
                headers: {
                "Content-Type": "application/json",
                // "X-API-KEY": serviceDetails.X_API_KEY,
                Accept: "*/*",
                },
                data: data,
            };
        
            const response = await axios(config);
        
            if (!response) {
                throw new Error("Authentication failed")
            } else {
                const now = Math.floor(Date.now() / 1000);
                const midnight = new Date();
                midnight.setHours(23, 59, 59, 0); 
                const expirySeconds = Math.floor(midnight.getTime() / 1000) - now;     

                await setValue(`tokenId-${accessKey}`, expirySeconds, response.data?.TokenId);
                await setValue(`memberId-${accessKey}`, expirySeconds, response.data?.Member?.MemberId);
                await setValue(`agencyId-${accessKey}`, expirySeconds, response.data?.Member?.AgencyId);

                return { 
                    tokenId: response.data?.TokenId, 
                    memberId: response.data?.Member?.MemberId, 
                    agencyId: response.data?.Member?.AgencyId
                };
            }
        } catch (error) {
            customLog(null, 'error', { message: "Error fetching authentication token", error})
            return { 
                tokenId: "", 
                memberId: "", 
                agencyId: ""
            };
        }
    } 
  } catch (error) {
            customLog(null, 'error', { message: "Unexpected error in getSession", error });
            return { tokenId: "", memberId: "", agencyId: "" };
        }
}

// async function createDataForHotelTicket(orderId) {
//   try {
//     console.log("orderrrr idddd",order)
//     const order = await findOneOrderById(orderId);
//     console.log("orderrrr",order)
//     let orderResponse = JSON.parse(order.orderResponse);
//     console.log("orderResponse testingg",orderResponse?.hotelContact)
//     let {
//       email,
//       phoneNumber,
//       checkInTime,
//       checkOutTime,
    
//       address,
     
//       // eslint-disable-next-line no-unsafe-optional-chaining
//     } = orderResponse?.hotelContact;

//     let hotelName = orderResponse?.data[0].hotel.name;
//     let checkInDate = orderResponse?.data[0].hotel.checkInDate;
//     let checkOutDate = orderResponse?.data[0].hotel.checkOutDate;
//     let passengers = orderResponse?.data[0].passengers;

//     if (phoneNumber.startsWith("++")) phoneNumber = phoneNumber.slice(1);
//     const checkInDate1 = new Date(checkInDate);
//     const checkOutDate1 = new Date(checkOutDate);
//     const timeDiff = checkOutDate1.getTime() - checkInDate1.getTime();
//     const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

//     let adultCount = 0;
//     let childCount = 0;
//     let rooms = 0;
//     passengers.forEach((passenger) => {
//       rooms = passenger.roomIndex;
//       if (passenger.ptc === "ADT") {
//         adultCount++;
//       } else if (passenger.ptc === "CHD") {
//         childCount++;
//       }
//     });
//     const bookingData = {
//       hotelName,
//       address,
//       checkInDate,
//       checkOutDate,
//       checkInTime,
//       checkOutTime,
//       nights: nightDifference,
//       hotelAdultCount: adultCount + " Adult",
//       hotelChildCount: childCount + " Child",
//       hotelRoomCount: rooms == 1 ? rooms + " Room" : rooms + " Rooms",
//       hotelbedName: "",
//       hotelContact: {
//         phoneNumber,
//         email,
//       },
//     };
//     const data = {
//       supplierReferenceId: orderResponse?.data[0].supplierReferenceId,
//       bookingReferenceId: orderResponse?.data[0].bookingReferenceId,
//       amount: parseFloat(order.baseAmount).toFixed(1),
//       hotelTicketHTML: hotelTicketDetails(passengers, bookingData),
//     };
//     return data;
//   } catch (error) {
//     return error;
//   }
// }

// async function generateAttachmentAndSendEmailAndNotification(params, callback) {
//   try {
//     console.log("createDataForHotelTicket testinggg",params.orderId)
//     const data = await createDataForHotelTicket(params.orderId);
//     const partnerDetails = params?.partnerDetails
//     const to = params.email;
//     const user = params.name;
//     const id = data.bookingReferenceId;

//     const html = hotelTicketPDFTemplate(data, partnerDetails);

//     fs.writeFile(`${id}.html`, html, async (err) => {
//       if (err) {
//         console.error(err);
//         return callback(err, null);
//       }

//       const inputFile = `${id}.html`;
//       const outputFile = `${id}.pdf`;

//       const pdfOptions = {
//         output: outputFile,
//         pageSize: "A4",
//       };

//       wkhtmltopdf(html, pdfOptions, async (pdfErr) => {
//         if (pdfErr) {
//           console.error(`Error generating PDF: ${pdfErr}`);
//           return callback(pdfErr, null);
//         }

//         console.log(`PDF file written to ${outputFile}`);
//         const subject = "Payment Successful";
//         const body = generateHotelTicketAndSendToMail({ user });

//         emailer.emailWithAttachment(
//           to,
//           subject,
//           body,
//           outputFile,
//           outputFile,
//           async (emailErr) => {
//             if (emailErr) {
//               console.error(`Error sending email: ${emailErr}`);
//               return callback(emailErr, null);
//             }

//             customLog(null, "info", { message: "Email sent to " + to })

//             const filesToDelete = [inputFile, outputFile];
//             let filesDeletedCount = 0;

//             filesToDelete.forEach((file) => {
//               fs.unlink(file, (unlinkErr) => {
//                 if (unlinkErr) {
//                   console.error(`Error deleting file ${file}: ${unlinkErr}`);
//                 } else {
//                   console.log(`File ${file} deleted`);
//                 }

//                 filesDeletedCount++;

//                 if (filesDeletedCount === filesToDelete.length) {
//                   callback(null, true);
//                 }
//               });
//             });
//           }
//         );
//       });
//     });
//   } catch (err) {
//     console.error(
//       `Error in generateAttachmentAndSendEmailAndNotification: ${err}`
//     );
//     callback(err, null);
//   }
// }
