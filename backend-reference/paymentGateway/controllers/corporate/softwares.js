const { findOnePlan } = require("../../models/use-cases/software_plan");
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const {
    fetchServiceDetails,
    calculateSurchargeWithTax
} = require("../../utils/checkAndFetchServiceDetails");
const {
    createNotification
} = require('../../models/use-cases/notification')
const { update: updateSoftwareProduct } = require('../../models/use-cases/softwares');
const {
    createWalletTransaction,
    updateWalletTransaction,
    refundWalletTransaction
} = require("../../utils/walletTransaction");
const wallet = require("../../models/entities/wallet");
const emailer = require('../../utils/emailer')
const { generateSubscriptionSuccessEmail, generateSubscriptionSuccessEmailToVendor, generateSubscriptionSuccessEmailToInternals } = require("../../utils/emailTemplates/softwares");
const { createLeanTransaction } = require('../../utils/leanTransaction');
const { commonFailedTemplate } = require("../../utils/emailTemplates/officeSupplies");
const axios = require('axios')
let accessKey = "subscription_payments"
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { customLog } = require("../../utils/loggerHelper");
const cleverTap = require("../../services/CleverTap");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { cancelPGTransaction } = require("../../utils/pgRefund");
exports.payment = asyncHandler(async (req, res, next) => {

    let isMobile = false;
    const platform = req.headers['platform']
    if (req.headers['platform'] && platform === 'mobile') {
        isMobile = true;
    }

    //check disableService?
    let transactionCategory = 'Softwares'
    const transactionId = req.body.corporateTxnId || `${new Date().valueOf()}${Math.floor(Math.random() * 90000 + 10000)}`
    let providerId = transactionId
    const account = req.body.account
    const amount = req.body.amount
    const formDetails = req.body.formDetails
    const payCashback = req.body.payCashback
    const credentialId = req.user.id //will come from userObject
    const packageId = req.user.packageId
    const corporateUserId = req.user.corporateId //will come from userObject
    const planId = req.body.planId
    const planData = await findOnePlan({ id: planId })
    const name = req.user.name
    const contactNo = req.user.mobileNo
    const vendorEmail = planData.software.vendor.vendorEmail;
    const emailToVendor = planData.software.sendVendorMail;
    const internalEmails = planData.software.pekoEmail;
    const emailToPekoInternal = planData.software.sendMail;
    const emailId = req.user.email
    const typeOfOrder = planData.software.typeOfOrder;
    const subCorporateEmail = req.user.subCorporateEmail;
    const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    })
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails['error'], 400))
    }
    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback
    let serviceOperatorId = serviceDetails.id
    const { surcharge } = calculateSurchargeWithTax(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  
    // first we will  do transaction

    let subCorporateUserId;
    if (req.user.role === 'CORPORATE_SUB_USER') {
        subCorporateUserId = req.user.subCorporateId;
    }

    const corporateTxnId = req.body.corporateTxnId
    
    serviceDetails.transactionReportRule = "SERVICE_WITH_DATA_IN_ITEMS_LIST" // ONLY TEMP
    const reportData = {};
    let transactionResponse = {}
    if (Object.prototype.hasOwnProperty.call(req.body, 'leanResponse')) {
        transactionResponse = await createLeanTransaction({
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            corporateCashback,
            accountNo: account,
            leanAmount: req.body.leanAmount,
            transactionCategory,
            orderAmount: amount,
            commissionType,
            cashbackType,
            providerCommission,
            payCashback,
            leanResponse: req.body.leanResponse,
            surcharge,
            subCorporateUserId
        })
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            corporateCashback,
            accountNo: account,
            pgAmount: req.body.pgAmount,
            transactionCategory,
            orderAmount: amount,
            commissionType,
            cashbackType,
            providerCommission,
            payCashback,
            pgResponse: req.body.paymentGatewayResponse,
            surcharge,
            subCorporateUserId,
            reportData,
            partnerId: req.user.registeredBy,
            couponCode: req.body.couponCode,
            corporateUserId,
        })
    } else {
        transactionResponse = await createWalletTransaction({
            providerId,
            corporateTxnId,
            credentialId,
            serviceOperatorId,
            corporateCashback,
            transactionCategory,
            surcharge,
            accountNo: account,
            amount,
            commissionType,
            cashbackType,
            providerCommission,
            payCashback,
            subCorporateUserId
        })
    }
    customLog(req?.LogTraceId, "info", { message: "🚀 ~ exports.payment=asyncHandler ~ transactionResponse: ", transactionResponse })
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse['error'], 500))
    }


    let result = {
        data: {}
    }; //for now if payment success and typeOfOrder is MANUAL , it is successfull order
    if (typeOfOrder === "API") {
        try {
            result = {
                data: {
                    errorcode: true
                }
            };
            let token = planData.software.vendor.optional1;
            let URL = planData.software.vendor.apiUrl;
            let data = JSON.stringify({
                token,
                accessKey: planData.software.productId,
                typeKey: planData.software.vendor.optional2,
                planId: planData.planId,
                transId: transactionId,
                amount: Number(planData.vendorPrice).toFixed(2),
                account: transactionId,
            });
            let config = {
                method: "post",
                url: `${URL}/makePayment`, //we will fetch it from service details
                headers: {
                    "Content-Type": "application/json",
                },
                data: data,
            };
            result = await axios(config);
          

        } catch (err) {
            customLog(req?.LogTraceId, "error", {isMobile, message: "🚀 ~ exports.payment=asyncHandler ~ err:", err })
        }
    }
    let updateDetails = {};
    if (!result || (Object.prototype.hasOwnProperty.call(result, "data") && Object.prototype.hasOwnProperty.call(result.data, "errorcode")) || Object.prototype.hasOwnProperty.call(result.data, "errorCode")) {
        updateDetails = {
            corporateTxnId,
            status: "FAILURE",
            providerId: "Not Available",
            message: 'No Activation Keys Available',
            registeredById: req.user.registeredBy,
            couponId: transactionResponse.couponId

        }
        if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
            await cancelPGTransaction(corporateTxnId);
            await refundWalletTransaction(updateDetails);
        } else {
            await refundWalletTransaction(updateDetails);
        }
    } else {
        updateDetails = {
            corporateTxnId,
            providerId: "Not Available",
            status: "SUCCESS",
            message: "Payment Successful",
            orderResponse: JSON.stringify({
                subscriptionDetails: planData,
                formDetails
            })
        }
    }

    if (updateDetails.message == "Payment Successful") {
        // only need to trigger in prod
        if (process.env.NODE_ENV === 'production') {
            cleverTap.uploadEvent({
                eventName: "Transactions",
                eventData: {
                    Status: "Payment Success",
                },
                email: emailId,
            });
        }
        const orderResponse = JSON.parse(updateDetails.orderResponse);
        // Create a payment details object with the relevant details
        transactionResponse.datetime = new Date()
        transactionResponse.amount = (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2)
        const paymentDetails = {
            products: JSON.stringify(orderResponse.subscriptionDetails),
            transactionId: corporateTxnId,
            account: account,
            amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
        };

        let to, cc;
        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        let subject = "Software purchase successful"; // Set email subject
        const resolvedSoftwareSuccess = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.SOFTWARE_PURCHASE_SUCCESS,
            service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
            variables: {
                name,
                transactionId: paymentDetails.transactionId,
                amount: paymentDetails.amount,
                softwareName: planData?.software?.name,
                planName: planData?.name,
                branding: partnerDetails?.branding || 'Peko',
                website: partnerDetails?.baseUrl || 'https://peko.one/in',
                ...v2LayoutVariables(partnerDetails),
            },
            fallback: () => generateSubscriptionSuccessEmail(name, paymentDetails.transactionId, paymentDetails.amount, planData, partnerDetails),
            fallbackSubject: subject,
            logTraceId: req?.LogTraceId,
        });
        subject = resolvedSoftwareSuccess.subject;
        const body = resolvedSoftwareSuccess.html;
        // Call email function to send email with payment details in the body
        if (emailToVendor) {
            const toVendor = vendorEmail;
            const resolvedVendor = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.SOFTWARE_ORDER_VENDOR,
                service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
                variables: {
                    name: planData.software.vendor.vendorName,
                    orderId: transactionResponse.orderId,
                    customerName: name,
                    emailId,
                    contactNo: contactNo || '',
                    branding: partnerDetails?.branding || 'Peko',
                    website: partnerDetails?.baseUrl || 'https://peko.one/in',
                    ...v2LayoutVariables(partnerDetails),
                },
                fallback: () => generateSubscriptionSuccessEmailToVendor(
                    planData.software.vendor.vendorName,
                    planData,
                    transactionResponse.orderId,
                    name,
                    emailId,
                    contactNo,
                    partnerDetails
                ),
                fallbackSubject: `Order placed for ${planData.software.name}. Order ID: ${transactionResponse.orderId}`,
                logTraceId: req?.LogTraceId,
            });
            emailer.email({to:toVendor, subject:resolvedVendor.subject, body:resolvedVendor.html}, function () { });
        }
        if (emailToPekoInternal) {
            const toInternal = internalEmails;
            const resolvedInternal = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.SOFTWARE_ORDER_INTERNAL,
                service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
                variables: {
                    name: "Admin",
                    transactionId: paymentDetails.transactionId,
                    amount: paymentDetails.amount,
                    branding: partnerDetails?.branding || 'Peko',
                    website: partnerDetails?.baseUrl || 'https://peko.one/in',
                    ...v2LayoutVariables(partnerDetails),
                },
                fallback: () => generateSubscriptionSuccessEmailToInternals(
                    "Admin",
                    paymentDetails.transactionId,
                    paymentDetails.amount,
                    planData,
                    partnerDetails
                ),
                fallbackSubject: `Order placed for ${planData.software.name}. Order ID: ${transactionResponse.orderId}`,
                logTraceId: req?.LogTraceId,
            });
            emailer.email({to:toInternal, subject:resolvedInternal.subject, body:resolvedInternal.html}, function () { });
        }
        // Send push notification with payment details
        const notificationData = {
            notificationTitle: "Software Purchase - Payment Successful",
            notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Software Purchase was successful. Transaction ID: ${paymentDetails.transactionId}.`,
            notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };

        const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount || 0,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: "Software Purchase",
            description: planData?.software?.name,
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            traceId: req?.LogTraceId,
        })
        emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments,cc, async (emailErr) => {
            if (emailErr) {
                customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
            } else {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            }
        });
        createNotification(notificationData);
        updateSoftwareProduct({ id: planData.softwareId }, { sold_quantity: 1 }, req.user)
    }
    await updateWalletTransaction(updateDetails)
    if (updateDetails.message !== "Payment Successful") {
        // only need to trigger in prod
        if (process.env.NODE_ENV === 'production') {
            cleverTap.uploadEvent({
                eventName: "Transactions",
                eventData: {
                    Status: "Payment Failure",
                },
                email: emailId,
            });
        }
        const paymentDetails = {
            transactionId: corporateTxnId,
            account: account,
            amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
        };
        const notificationData = {
            notificationTitle: "Software Purchase - Payment unsuccessful",
            notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Software Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
            notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN'
        };

        createNotification(notificationData);
        //return next(new ErrorResponse([updateDetails.message], 200))
        let to, cc;
        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        const subject = 'Payment failed'
        const serviceUrl = partnerDetails?.baseUrl ||
            (process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL);
        const resolvedSoftwareFailed = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.SOFTWARE_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
            variables: {
                name,
                serviceName: "Software",
                retryUrl: serviceUrl || `${partnerDetails?.baseUrl}/payments`,
                branding: partnerDetails?.branding || 'Peko',
                website: partnerDetails?.baseUrl || 'https://peko.one/in',
                ...v2LayoutVariables(partnerDetails),
            },
            fallback: () => commonFailedTemplate(name, "Software purchase", serviceUrl, partnerDetails),
            fallbackSubject: subject,
            logTraceId: req?.LogTraceId,
        });
        const body = resolvedSoftwareFailed.html;

        emailer.email({to,cc, subject: resolvedSoftwareFailed.subject, body}, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        });
        const walletDetails = await wallet.findOne({
            where: {
                credentialId
            },
            attributes: ['balance']
        })
            return res.status(500).json({
                'status': false,
                "message": "Something went wrong",
                'data': {
                    ...{},
                    corporateFinalBalance: walletDetails['balance']
                },
                'responseCode': '003'
            })
    } else {
            return res.status(200).json({
                'status': true,
                'data': {
                    ...{},
                    ...transactionResponse,
                    corporateTxnId
                },
                'message': 'payment successful',
                'responseCode': '000'
            })
    }

})