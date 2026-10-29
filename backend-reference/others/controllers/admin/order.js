/* eslint-disable no-unused-vars */
const {  getExcel } = require('../../models/use-cases/order')
const { createOtp, verifyOtp } = require('../../models/use-cases/otp')
const emailer = require('../../utils/emailer');
const { findOne } = require('../../models/use-cases/systemUser');
const ErrorResponse = require('../../utils/error-response');
const { findOneTransaction, updateTransactionById, findAllTransactions, transactionsExcelCSV,findTransactionDiagnosticDetails } = require('../../models/use-cases/transaction');
const { refundWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const asyncHandler = require('../../middlewares/async');
const { commonEmailOtpVerification } = require('../../utils/templatesForEmails');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables, buildOtpBoxesHtml, PEKO_SOCIAL_LINKS } = require('../../utils/emailTemplate/sharedLayout');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const puppeteer = require('puppeteer')
const fs = require('fs')
const { customLog } = require('../../utils/loggerHelper');
const { findOneOrderByTxnId } = require('../../models/use-cases/order');
const { findServiceOperatorById } = require('../../models/use-cases/serviceOperator');
const { findOneCredential } = require('../../models/use-cases/credential');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const {
    hotelAccessKey,
    getHotelServiceDetails,
    getBookingDetails,
    generateAttachmentAndSendEmailAndNotification,
} = require('./hotels');

exports.getExcel = async (req, res) => {
    try {
        const from = req.query.fromDate
        const to = req.query.toDate
        let order = req.query.orderCol,
            column = 'transactionDate'//req.query.column
        let params = {
            from,
            to,
            order,
            column
        }
        let data = await getExcel(params)
        res.send(data)
    } catch (e) {
        res.send(e.message)
    }
}

exports.getOtp = asyncHandler(async (req, res) => {
    let { scope } = req.query

    let otp
    let email = ''
    if (scope === "email") {
        email = req.user.email
        if (!req.user.email) {
            //get email from system user 
            const result = await findOne(req.user)
            email = result.email
        }

        //it will create a bycrypted otp in db and return the created otp to send via email
        otp = await createOtp({ contact: email })
        if (!otp) {
            return res.status(500).json({ success: false, message: 'Failed to create OTP.' });
        }
        //Sending Email with otp
        const partnerData = await fetchPartnerDetails(req.user?.registeredBy)
        const { subject, html, sender } = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.OTP_VERIFICATION_COMMON,
            service: EMAIL_TEMPLATE_SERVICES.ORDERS,
            partnerId: req.user?.registeredBy || null,
            variables: {
                otpBoxesHtml: buildOtpBoxesHtml(otp),
                ...v2LayoutVariables({
                    website: partnerData?.baseUrl || 'https://in.peko.one',
                    logo: partnerData?.logo,
                    branding: partnerData?.branding || 'Peko',
                    socials: PEKO_SOCIAL_LINKS,
                }),
            },
            fallbackSubject: "Order refund request",
            fallback: () => commonEmailOtpVerification({ otp, partnerDetails: partnerData }),
        });
        await emailer.email(email, subject, html, undefined, sender)
    } else {
        // F-OTH-25: previously fell through to a fake "OTP sent successfully" response
        // without ever creating or sending anything when scope wasn't "email".
        return res.status(400).json({ status: false, message: 'Unsupported OTP scope.', data: {}, responseCode: '001' });
    }

    //ADD OTP RESPONSE
    return res.status(200).json({
        status: true,
        message: "OTP sent successfully via email.",
        data: process.env.NODE_ENV !== "production" ? { otp,email } : {email},
        responseCode : '000'
    });
})
exports.refundAndUpdateOrder = asyncHandler(async (req, res, next) => {
    let data = req.body



    if (data.scope === 'email') {
        let email = req.user.email
        if (!req.user.email) {
            const result = await findOne(req.user)//get email from system user 
            email = result.email
        }

        let response = await verifyOtp({ contact: email, otp: data.otp, context: 'email' })
        if (response.isVerified === false) {
            return next(new ErrorResponse(response?.message || 'Something went wrong', 200))
        }
    } else {
        return next(new ErrorResponse('otp is required', 400))
    }
    //otp  verification completed , next refund process
    console.log({ d: 'otp otp verification completed , next refund process' })
    let corporateTxnId = req.body.corporateTxnId
    let params = { id: data.orderId };
    const transaction = await findOneTransaction({ corporateTxnId })
       let transactionId = transaction.id

    let updateDetails = {
        corporateTxnId,
        status: "REFUNDED",
        providerId: "Not Available",
        message: "Refund initiated!!!",
        registeredById: req.user.registeredBy
    }

    let paymentData
    if (transaction) {
        paymentData = JSON.parse(transaction?.order?.paymentModeResponse)
    }
    let serviceAccessKey = transaction.serviceOperator.accessKey

    // if (transaction.order.paymentMode == "BANK" || transaction.order.paymentMode == "BANK + WALLET") {
    //     //cancel with  bank refund 
    //     let leanAmount = paymentData.leanAmount
    //     //need to refund in default bank account selected by the user credentialId
    //     let defaultBankAccount = await findDefaultBankAccount({ id: transaction.credentialId })
    //     if (!defaultBankAccount) {
    //         return next(new ErrorResponse(`Refund faild, No default bank added for this user.`, 500));
    //     }


    //     let destinationIdLean = defaultBankAccount.destinationIdLean
    //     //>>>>>>>>>>>>>LEAN REFUND CODE STARTS<<<<<<<<<<<<<<<<
    //     // let payoutResponse = await createPayout({ destinationIdLean: destinationIdLean, amount: leanAmount, description: "REFUND INITIATED" }, req.user.id)
    //     // if (!payoutResponse) {
    //     //     return next(new ErrorResponse(`Something went wrong while returning lean transaction`, 500));
    //     // }
    //     const paymentRefId = payoutResponse.payouts_payment_details[0].payment_intent_id
    //     const stringifiedResponse = JSON.stringify(payoutResponse)
    //     let createLeanPayoutRes = await createLeanPayout({ orderId: params.id, paymentRefId, payoutResponse: stringifiedResponse, status: "INITIATED" }) //for creating data for payout
    //     //>>>>>>>>>>>>>LEAN REFUND CODE STARTS<<<<<<<<<<<<<<<<
    //     if (createLeanPayoutRes && createLeanPayoutRes?.status == 'INITIATED') {
    //         await refundWalletTransaction(updateDetails)
    //     } else {
    //         return next(new ErrorResponse(`Something went wrong while returning bank transaction`, 500));
    //     }

    // } else

     if (transaction.order.paymentMode == "WALLET") {
        //cancel with  wallet refund 
        await refundWalletTransaction(updateDetails)

    }
    //  else if (transaction.order.paymentMode == "PAYMENT GATEWAY" || transaction.order.paymentMode == "PAYMENT GATEWAY + WALLET") {
    //     //cancel with  payment gateway refund 
    //     let refundPGResponse = await refundCardTransaction(req, paymentData, false, serviceAccessKey)
    //     if (refundPGResponse?.state == 'REVERSED' || refundPGResponse?.state == 'REFUNDED') {
    //         await refundWalletTransaction(updateDetails)
    //     } else {
    //         return next(new ErrorResponse(`Something went wrong while returning card transaction`, 500));
    //     }
    // } 
    else {
        return next(new ErrorResponse(`Something went wrong while returning.`, 500));
    }

    //update transaction remarks by admin remarks
    let result = await updateTransactionById(transactionId, { remarks: data?.remarks || 'refunded' })
    if (!result || result[0] === 0) {
        return next(new ErrorResponse(`Error while updating transaction remarks`, 500));
    }

    //let supportEmailDetails = emailOrderCancelTemplate(transaction.credential.name)
    //await emailer.email(transaction.credential.email, 'Your order has been cancelled', supportEmailDetails)

    return res.status(200).json({
        status: true,
        message: "Refund process is completed",
        data : {},
        responseCode : '000'
    });

})


exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {
    let { from, to, searchText, page, itemsPerPage } = req.query;
    let corporateId = req.query.corporateId || undefined
    let sortField = req.query.sortField || "corporateTxnId"
    let registeredBy = req.user.registeredBy
    const subPartnerId = req.user.subPartnerId

    let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    const filter = req.query.filter || undefined;

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    let serviceAttribute = ['id', 'serviceProvider']
    let credentialAttribute = ['name', 'email','username']
    let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback', 'remarks']
    let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status']

    let params = {
        from,
        to,
        categoryName,
        searchText,
        sort,
        filter,
        limit,
        offset,
        corporateId,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        registeredBy,
        subPartnerId
    }

    const transactionsData = await findAllTransactions(params);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                result: transactionsData.rows,
                totalData: transactionsData.count
            },
            'message': 'fetched transactions successfully!!',
            'responseCode': '000'
        })
    }
})

exports.generateTransactionExcelCSV = asyncHandler(async (req, res, next) => {
     let { from, to, searchText } = req.query
     const { type } = req.params
     let corporateId = req.query.corporateId || undefined
     let registeredBy = req.user.registeredBy
     const subPartnerId = req.user.subPartnerId

     let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined
     const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC'
     let sortField = req.query.sortField || 'corporateTxnId'
     const filter = req.query.filter || undefined

     let serviceAttribute = ['id', 'serviceProvider']
     let credentialAttribute = ['name', 'email', 'username']
     let transactionAttribute = [
          'id',
          'transactionDate',
          'corporateTxnId',
          'transactionCategory',
          'corporateCashback',
          'remarks',
     ]
     let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status']

     let params = {
          from,
          to,
          categoryName,
          searchText,
          sort,
          filter,
          corporateId,
          serviceAttribute,
          credentialAttribute,
          transactionAttribute,
          orderAttribute,
          sortField,
          registeredBy,
          subPartnerId
     }

     const data = await transactionsExcelCSV(params, 'order')
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     } else {
          const { buffer, fileType } = await generateExcelBufferAndType(data, type)
          return res.status(200).json({
               status: true,
               data: { buffer, fileType },
               message: 'Fetched excel/csv datas successfully',
               responseCode: '000',
          })
     }
})

exports.generateTransactionPDF = asyncHandler(async (req, res, next) => {
     let { from, to, searchText } = req.query
     let corporateId = req.query.corporateId || undefined
     let registeredBy = req.user.registeredBy
     const subPartnerId = req.user.subPartnerId

     let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined
     const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC'
     let sortField = req.query.sortField || 'corporateTxnId'
     const filter = req.query.filter || undefined

     let serviceAttribute = ['id', 'serviceProvider']
     let credentialAttribute = ['name', 'email', 'username']
     let transactionAttribute = [
          'id',
          'transactionDate',
          'corporateTxnId',
          'transactionCategory',
          'corporateCashback',
          'remarks',
     ]
     let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status']

     let params = {
          from,
          to,
          categoryName,
          searchText,
          sort,
          filter,
          corporateId,
          serviceAttribute,
          credentialAttribute,
          transactionAttribute,
          orderAttribute,
          sortField,
          registeredBy,
          subPartnerId
     }

     const data = await transactionsExcelCSV(params, 'order')
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }

     const templateDetails = {
          title: 'Orders Report',
     }
     const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails)
     let random = new Date().valueOf()

     // Create a browser instance with Puppeteer
     const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
     })
     const page = await browser.newPage()

     // Set content to the page
     await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })

     // Generate PDF using Puppeteer
     const outputFile = `report-${random}.pdf`
     await page.pdf({
          scale: 0.7,
          path: outputFile,
          format: 'A4',
          preferCSSPageSize: true,
     })

     console.log('PDF generated successfully!')

     const buffer = fs.readFileSync(outputFile)

     browser.close()

     fs.unlinkSync(outputFile)

     return res.status(200).json({
          status: true,
          message: 'report generated successfully.',
          data: {
               buffer,
               fileType: 'application/pdf',
          },
          responseCode: '000',
     })
})
exports.resendEmail = asyncHandler(async (req, res, next) => {
    const { corporateTxnId } = req.body;
    if (!corporateTxnId) return next(new ErrorResponse("corporateTxnId is required", 400));

    const orderRecord = await findOneOrderByTxnId(String(corporateTxnId));
    if (!orderRecord) return next(new ErrorResponse("Order not found", 404));
    if (orderRecord.status !== "SUCCESS") return next(new ErrorResponse("Order is not successful", 400));

    const serviceOperatorRecord = await findServiceOperatorById(orderRecord.serviceOperatorId);
    if (!serviceOperatorRecord) return next(new ErrorResponse("Service operator not found", 500));

    const { accessKey } = serviceOperatorRecord;

    if (accessKey !== hotelAccessKey) {
        return res.status(400).json({
            status: false,
            message: `Resend email is not configured for this service (${accessKey})`,
            responseCode: "001",
        });
    }

    const serviceDetails = getHotelServiceDetails(serviceOperatorRecord.vendor);

    let orderResponse = {};
    try {
        orderResponse = JSON.parse(orderRecord.orderResponse);
    } catch (_) { /* invalid JSON — keep default empty object */ }

    console.log("here is the orderResponse",orderResponse)

    if (!orderResponse.bookingDetailsResponse) {
        const traceId = orderResponse?.hotelBookingDetails?.TraceId;
  

        if (!traceId) {
            return next(new ErrorResponse("TraceId not found in order.", 400));
        }
        const bookingDetailsResponse = await getBookingDetails(serviceDetails, traceId, req.LogTraceId);
        orderResponse.bookingDetailsResponse = bookingDetailsResponse;
        await updateWalletTransaction({
            corporateTxnId: String(corporateTxnId),
            providerId: orderRecord.providerId,
            status: orderRecord.status,
            message: orderRecord.message,
            orderResponse: JSON.stringify(orderResponse),
        });
    }

    const credential = await findOneCredential({ id: orderRecord.credentialId });
    let templateDetails;
    templateDetails = await fetchPartnerDetails(credential.registeredBy);

    const updatedOrder = await findOneOrderByTxnId(String(corporateTxnId));
    const emailId = orderResponse?.hotelBookingDetails?.customerInfo?.emailAddress;

    const params = {
        email: emailId,
        name: credential?.name || "",
        orderId: updatedOrder.id,
        corporateTxnId: String(corporateTxnId),
        templateDetails,
        registeredBy: credential?.registeredBy,
        logTraceId: req.LogTraceId,
    };

    customLog(req.LogTraceId, "info", { params, message: "resendEmail: triggering hotel email send" });

    await new Promise((resolve, reject) => {
        generateAttachmentAndSendEmailAndNotification(params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    return res.status(200).json({
        status: true,
        message: "Booking confirmation email resent successfully",
        responseCode: "000",
    });
});

exports.getTransactionDiagnosticDetails = asyncHandler(async (req, res, next) => {
    const { transactionId } = req.params;
    const id = parseInt(transactionId, 10);

    if (!id || isNaN(id)) {
        return next(new ErrorResponse('Invalid transaction ID', 400));
    }

    const details = await findTransactionDiagnosticDetails(id);
    if (!details) {
        return next(new ErrorResponse('Transaction not found', 404));
    }

    return res.status(200).json({
        status: true,
        message: 'Transaction details fetched successfully',
        data: details,
        responseCode: '000',
    });
});