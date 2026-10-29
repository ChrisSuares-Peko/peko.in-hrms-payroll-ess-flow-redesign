const asyncHandler = require("../../middlewares/async");
const { findAllWorks, findOne, findAllTransactions } = require("../../models/use-cases/works");
const { paymentGateWayRefundFailureEmail, leanRefundFailureEmail } = require("../../utils/emailSender");
const ErrorResponse = require("../../utils/error-response");
const { createLeanTransaction } = require("../../utils/leanTransaction");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
const { createLeanPayoutRequest } = require("./lean");
const { cancelCardTransaction } = require("./payment_gateway");
const emailer = require('../../utils/emailer')
const { createNotification } = require("../../models/use-cases/notification");
const wallet = require("../../models/entities/wallet");
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { findOnePlanDetails } = require("../../models/use-cases/works_plan");
const { findOneOrder, findOneOrderById } = require("../../models/use-cases/order");
const { resolvePaymentFailedEmail } = require("../../utils/emailTemplates/common");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { resolveWorksPurchaseEmail } = require("../../utils/emailTemplates/works");
// const cleverTap = require("../../services/CleverTap");
const { createExpense } = require("./accounting");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const accessKey = 'peko_works'
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { sedEmailToWorksVendor } = require("../../services/works");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
exports.findAllWorks = asyncHandler(async (req, res, next) => {
  try {
      let { page, itemsPerPage } = req.query;
      const credentialId = req.user.registeredBy

      const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
      const filter = "id"

      // Parse page and itemsPerPage to integers (you can also use parseInt)
      page = page ? parseInt(page) : 1;
      itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
      let limit = itemsPerPage

      // Calculate offset based on page and itemsPerPage
      let offset;
      if (page && itemsPerPage) {
          offset = (page - 1) * itemsPerPage;
      }
      let params = {
          limit,
          offset,
          sort,
          filter,
          credentialId
      }
       const result = await findAllWorks(params, ['id', 'name', 'features', 'image']);
      if (!result) {
          return next(new ErrorResponse(`Something went wrong while fetching works`, 500))
      } else {
          return res.status(200).json({
              'status': true,
              'data': { data: result },
              'message': 'Fetched all works successfully',
              'responseCode': '000'
          })
      }
  } catch (error) {
      return res.status(500).json({
          status: false,
          message: "Something went wrong",
          data: {},
          responseCode: '001'
      })
  }
})

exports.findWorkDetails = asyncHandler(async (req, res, next) => {
  try {
      let params = req.params
       const result = await findOne(params, ['id', 'name', 'features', 'description', 'portfolioType', 'portfolio', 'status']);
      if (!result) {
          return next(new ErrorResponse(`Something went wrong while fetching works details`, 500))
      } else {
          return res.status(200).json({
              'status': true,
              'data': result,
              'message': 'Fetched works details successfully',
              'responseCode': '000'
          })
      }
  } catch (error) {
      return res.status(500).json({
          status: false,
          message: "Something went wrong",
          data: {},
          responseCode: '001'
      })
  }
})

exports.payment = asyncHandler(async (req, res, next) => {
    const planData = await findOnePlanDetails({ id: req.body?.planId, credentialId: req.user.id })
    if (Number(planData?.price || 0) !== Number(req.body?.amount)) {
        return next(new ErrorResponse("Amount mismatch", 400))
    }
    //check disableService?
    let transactionCategory = 'Other'
    const transactionId = new Date().valueOf();
    let providerId = transactionId
    const account = req.body.account
    const amount = req.body.amount
    const payCashback = req.body.payCashback
    const credentialId = req.user.id //will come from userObject
    const packageId = req.user.packageId //will come from userObject
    const corporateUserId = req.user.corporateId
    const name = req.user.name
    const emailId = req.user.email;
    const accounts_id = req.user.accounts_id;
      const subCorporateEmail = req.body.subCorporateEmail;
      const { pocName, email, requirement } = req.body;

    let subCorporateUserId;
    if (req.body.role === 'CORPORATE_SUB_USER') {
        subCorporateUserId = req.body.subCorporateId;
    }

  let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  
//   const planData = await findOnePlanDetails({ id: planId });
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax)

    const journalPlanDetails = [{
        name: planData?.name ? `Works : ${planData.name}` : 'Works',
        commissionMode: planData?.commissionMode,
        commissionType: planData?.commissionType,
        commission: planData?.commission,
        fixedCommissionPerTransaction: planData?.fixedCommissionPerTransaction,
        isCommissionInclGST: planData?.isCommissionInclGST,
        amount: Number(planData?.price),
        quantity: 1,
    }];
    const reportData = await computeJournalData({
        serviceDetails,
        amount: Number(amount),
        paymentMethod: 'WALLET',
        partnerDetails,
        paymentGatewayName: 'WALLET',
        couponTotalDiscount: req.body.couponTotalDiscount,
        planDetails: journalPlanDetails,
        corporateState: req.user.state || '',
        credentialId,
    });

    let corporateTxnId = new Date().valueOf()
    const publishJournal = (type) =>
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type,
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
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
            subCorporateUserId,
            surcharge,
            reportData
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
            subCorporateUserId,
            surcharge,
            reportData
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
            subCorporateUserId,
            reportData
        })
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
    customLog(req?.LogTraceId, "error", { message: "Error in transaction response" , error: transactionResponse["error"]})

            customLog(req?.LogTraceId, "error", { message: "Error in transaction response" , error: transactionResponse["error"]})
        
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 500))
    }

    publishJournal('payment');

    const { status: worksResponse } = await sedEmailToWorksVendor({
        serviceDetails,
        user: req.user,
        body: req.body,
        corporateTxnId,
        templateDetails: partnerDetails
    })

    let updateDetails = {}
    if (!worksResponse) {
        updateDetails = {
            corporateTxnId,
            status: "FAILURE",
            providerId: "Not Available",
            message: 'No Activation Keys Available',
            registeredById: req.user.registeredBy
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse)
            if (refundPGResponse?.state == 'REVERSED') {
                await refundWalletTransaction(updateDetails)
                publishJournal('refund');
            } else {
                await paymentGateWayRefundFailureEmail(req)
            }
        } else if (Object.prototype.hasOwnProperty.call(req.body, 'leanResponse')) {
            const { status, message } = await createLeanPayoutRequest(req.body.leanAmount, req.user.id, transactionResponse.orderId, updateDetails);
            if (!status) {
                await leanRefundFailureEmail(req, message)
            }
            /**
             * in true case the refundWalletTransaction is needed to be called after the lean authorization.
             * this called after the webhook from lean. 
             */

        } else {
            await refundWalletTransaction(updateDetails)
            publishJournal('refund');
        }
    } else {
        updateDetails = {
            corporateTxnId,
            providerId: "Not Available",
            status: "SUCCESS",
            message: "Payment Successful",
            orderResponse: JSON.stringify({
                planDetails: planData,
                pocName,
                email,
                requirement
            })
        }
    }

    if (updateDetails.message == "Payment Successful") {
        // must use this in transaction events
        // cleverTap.uploadEvent(
        //     {
        //         eventName: "transactions_payment",
        //         eventData: {
        //             status: "Payment Success",
        //             amount: Number(amount) + Number(surcharge),
        //         },
        //         email: emailId,
        //     },
        //     partnerDetails
        // );
        const orderResponse = JSON.parse(updateDetails.orderResponse);
        // Create a payment details object with the relevant details
        transactionResponse.datetime = new Date()
        transactionResponse.amount = amount
        const paymentDetails = {
            products: JSON.stringify(orderResponse.planDetails),
            transactionId: corporateTxnId,
            account: account,
            amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
        };
        createExpense({
            credentialId,
            packageId,
            corporateUserId
        }, {
            accounts_id, amount: paymentDetails.amount, credentialId, category: serviceDetails?.serviceCategory,
            merchant: serviceDetails?.vendor?.vendorName
        })
        // Send push notification with payment details
        const notificationData = {
            notificationTitle: `Works - Payment successful`,
            notificationBrief: `Payment of AED ${paymentDetails?.amount} for Works was successful. Transaction ID: ${paymentDetails?.transactionId}.`,
            notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN', // Replace with the user or system that triggered the notification
            accessKey,
            action: '1'
        };
        if (req.body.role === 'CORPORATE_SUB_USER' && req.body.subCorporateId) {
            const subcorporateUsername = req.body.subCorporateUsername
            if (subcorporateUsername) {
                notificationData.notificationTo.push(subcorporateUsername);
            }
        }
        createNotification(notificationData, credentialId);
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: parseFloat(amount) || 0,
            surcharge: surcharge || 0,
            couponDiscount: 0,
            corporateTxnId,
            orderId: transactionResponse?.orderId ?? (await findOneOrder({ corporateTxnId }))?.id,
            paymentType: "Works",
            credentialId,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails: journalPlanDetails,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });

        const to = [email, subCorporateEmail]; // Set recipient email address
        const name = pocName
        const { subject, html, sender } = await resolveWorksPurchaseEmail(name, paymentDetails.amount, planData, corporateTxnId, partnerDetails, {
            fallbackSubject: "Your Works order has been successfully processed ",
            partnerId: req?.user?.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });

        emailer.emailWithMultipleAttachment(to, subject, html, invoiceAttachments, async (emailErr) => {
            if (emailErr) {
                customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
            } else {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            }
        }, sender);
    }
    await updateWalletTransaction(updateDetails)

    if (updateDetails.message !== "Payment Successful") {
        // must use this in transaction events
        // cleverTap.uploadEvent(
        //     {
        //         eventName: "transactions_payment",
        //         eventData: {
        //             status: "Payment Failure",
        //             amount: Number(amount) + Number(surcharge),
        //         },
        //         email: emailId,
        //     },
        //     partnerDetails
        // );
        const paymentDetails = {
            transactionId: corporateTxnId,
            account: account,
            amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
        };
        const notificationData = {
            notificationTitle: `Works - Payment unsuccessful`,
            notificationBrief: `Payment of AED ${paymentDetails?.amount} for Works was unsuccessful. Transaction ID: ${paymentDetails?.transactionId}.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
            accessKey,
            action: '1'
        };
        if (req.body.role === 'CORPORATE_SUB_USER' && req.body.subCorporateId) {
            const subcorporateUsername = req.body.subCorporateUsername
            if (subcorporateUsername) {
                notificationData.notificationTo.push(subcorporateUsername);
            }
        }
        createNotification(notificationData, credentialId);
        const serviceUrl = partnerDetails?.baseUrl ||
            (process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL);
        const to = [emailId, subCorporateEmail];
        const { subject, html, sender } = await resolvePaymentFailedEmail({
            key: EMAIL_TEMPLATE_KEYS.WORKS_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.WORKS,
            name,
            serviceName: "Works",
            url: serviceUrl,
            partnerDetails,
            partnerId: req?.user?.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });

        emailer.email(to, subject, html, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
        }, sender);
        //return next(new ErrorResponse([updateDetails.message], 200))
        const walletDetails = await wallet.findOne({
            where: {
                credentialId
            },
            attributes: ['balance']
        })
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            res.redirect(`${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`)
        } else
            return res.status(500).json({
                'status': false,
                "message": "Something went wrong",
                'data': {
                    ...{},
                    corporateFinalBalance: walletDetails['balance']
                },
                'responseCode': '001'
            })
    } else {
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            res.redirect(`${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`)
        } else
            return res.status(200).json({
                'status': true,
                'data': {
                    ...{},
                    ...transactionResponse,
                    corporateTxnId
                },
                'message': 'payment successfull',
                'responseCode': '000'
            })
    }

})

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
  }

  let sortField = 'transactionDate'

  let serviceAttribute = []
  let credentialAttribute = []
  let transactionAttribute = []
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'ecomOrderStatus', "transactionDate", 'corporateTxnId', 'workspaceOrderStatus']

  let params = {
      from,
      to,
      accessKey,
      searchText,
      sort,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField

  }

  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
  }

  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': {
              result: transactionsData.rows,
              totalData: transactionsData.count
          },
          'message': 'fetched orders successfully!!',
          'responseCode': '000'
      })
  }
})

exports.orderDetails = asyncHandler(async (req, res, next) => {
    try {
        const credentialId = req.user.id //will come from userObject
        const packageId = req.user.packageId //will come from userObject
        const corporateUserId = req.user.corporateId
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId
        })
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400))
        }
        const { id } = req.params
        const result = await findOneOrderById(id, ['id', 'orderResponse']);
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while fetching order details`, 500))
        }
        const parsedResult = JSON.parse(JSON.stringify(result))
        const orderResponse = JSON.parse(parsedResult.orderResponse)
        const { workId, work } = orderResponse.planDetails
        let workDetails = work

        const selectedWork = await findOne({ id: workId })
        if (selectedWork) {
            workDetails = selectedWork
        }

        let crmContactDetails = {}
        if (workDetails.showCRMDetails === 'ADMIN') {
            crmContactDetails = {
                showCRMDetails: workDetails.showCRMDetails,
                name: serviceDetails?.vendor?.optional5 || 'Admin',
                emails: serviceDetails?.vendor?.vendorEmail || [],
                mobile: serviceDetails?.vendor?.optional6 || ''
            }
        } else {
            crmContactDetails = {
                showCRMDetails: workDetails.showCRMDetails,
                name: workDetails.name,
                emails: [workDetails.contactEmail],
                mobile: workDetails.contactMobile
            }
        }

        const response = {
            ...JSON.parse(JSON.stringify(result)),
            crmContactDetails
        }
        return res.status(200).json({
            'status': true,
            'data': response,
            'message': 'Fetched order details successfully',
            'responseCode': '000'
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            data: {},
            responseCode: '001'
        })
    }
})
