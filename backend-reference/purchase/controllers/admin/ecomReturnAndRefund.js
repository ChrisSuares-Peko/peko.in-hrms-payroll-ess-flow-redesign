const {
    findAllOrdersCount,
    // findLatestFiveOrders,
    // findStatusCountEcommerce,
    findOneTransaction,
    ordersExport
} = require("../../models/use-cases/transaction");
const {updateOrder, 
    // findOneOrder
} = require("../../models/use-cases/order");
const puppeteer = require('puppeteer');
const fs = require("fs");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {createOtp, verifyOtp} = require("../../models/use-cases/otp");
const {findAllBankAccount} = require("../../models/use-cases/bankDetails");
const emailer = require('../../utils/emailer');
const {
    // refundWalletTransaction, 
    returnRefundInEcommerce} = require("../../utils/walletTransaction");
// const {refundCardTransaction} = require("../corporate/payment_gateway");
// const {createLeanPayout} = require("../../models/use-cases/payout");
// const {createPayout} = require("../corporate/lean");
const { findOne, fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { emailOrderReturnRejectedTemplate, emailOrderReturnCompletedTemplate, emailOrderReturnInitiatedTemplate } = require("../../utils/emailTemplate/ecommerce");
const { update: ondcUpdate } = require("../../services/ondc");
const { waitForOnUpdate } = require("../../services/ondcUpdateWaiter");
const {
    findOndcOrderByIdAdmin,
    updateOndcOrderReturn,
    updateOndcOrderReturnLifecycle,
    findOndcOrdersForAdminAction,
} = require("../../models/use-cases/ondc_order");
const { assertOndcOrderReturnable } = require("../../utils/ondcReturnEligibility");
const { resolveReturnReason } = require("../../utils/ondcReturnReasons");
const { applyOndcReturnOnUpdate } = require("../../services/ondcReturnLifecycle");
const { sendOndcReturnInitiatedEmail } = require("../../services/ondcRefundCancelNotify");
const { getEasySplitSettings } = require("../../utils/easySplit");
const { refundRequestOTPTemplate } = require("../../utils/templatesForEmails");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
exports.findReturnAndRefunds = asyncHandler(async (req, res, next) => {
    let { from, to, searchText, page, itemsPerPage } = req.query;

    let status = req.query.status || undefined
    
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
     let sortField = req.query.sortField || 'createdAt'
    
    
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let length = itemsPerPage
    
    // Calculate offset based on page and itemsPerPage
    let start;
    if (page && itemsPerPage) {
        start = (page - 1) * itemsPerPage;
    }
    
    let statusAlt = "Return Requested"
    
    let params = {
        start, from, to, length, searchText, sort, sortField, status
      };

    const transactionsData = await findAllOrdersCount(params, statusAlt);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500));
    } else {
        // Active ONDC orders admin can act on directly (no separate
        // customer-request queue yet — see findOndcOrdersForAdminAction).
        // Kept as its own array rather than merged into `data` since the two
        // sources have entirely different shapes.
        const ondcOrders = await findOndcOrdersForAdminAction({ searchText, from, to })
        return res.status(200).json({
            status: true,
            data: {
            recordsTotal: transactionsData.count,
            recordsFiltered: transactionsData.count,
            data: transactionsData.rows,
            ondcOrders },
            message: "Orders fetched successfully",
            responseCode: "000"
          });
    }
});
exports.returnAndRefundsExcelCSV = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const {type} = req.params;
    let status = req.query.status || undefined
    
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    
    let statusAlt = "Return Requested"
    
    let params = {
         from, to, searchText, sort, sortField, status
      };

    const data = await ordersExport(params, statusAlt);
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
    } else {
        const {buffer, fileType} = await generateExcelBufferAndType(data,type)
        return res.status(200).json({
            'status': true,
            'data': {buffer, fileType},
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }
});
exports.returnAndRefundsPDF = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    let status = req.query.status || undefined
    
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    
    let statusAlt = "Return Requested"
    
    let params = {
         from, to, searchText, sort, sortField, status
      };

    const data = await ordersExport(params, statusAlt);
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
    }
    
    const templateDetails = {
        title: 'Return Request'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
    let random = new Date().valueOf();
  
    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
  
    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });
  
    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
        scale: 0.6,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });
  
    const buffer = fs.readFileSync(outputFile);
  
    browser.close();
  
    fs.unlinkSync(outputFile);
  
    return res.status(200).json({
        status: true,
        message: 'report generated successfully.',
        data: {
            buffer,
            fileType: 'application/pdf'
        },
        responseCode: '000'
    });
});

exports.getOtpOnReturn = asyncHandler(async (req, res) => {
    let {scope} = req.query
    let otp
    let email
    if (scope === "email") {
        email = req.user.email
        if (!req.user.email) {
            //get email from system user 
            const result = await findOne(req.user)
            email = result.email
        }
        //it will create a bycrypted otp in db and return the created otp to send via email
        otp = await createOtp({contact: email})
        if (!otp) {
            return res.status(500).json({success: false, message: 'Failed to create OTP.'});
        }
        //Sending Email with otp
        const resolvedReturnRefundOtp = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.ECOM_RETURN_REFUND_OTP,
            service: EMAIL_TEMPLATE_SERVICES.ECOM,
            variables: { name: req.user.name, otp },
            fallback: () => refundRequestOTPTemplate(req.user.name, otp, 'Verify your account!'),
            fallbackSubject: 'Account verification OTP for refund request - Office supplies order',
            logTraceId: req?.LogTraceId,
        });
        let supportEmailDetails = resolvedReturnRefundOtp.html;
        await emailer.email(email, resolvedReturnRefundOtp.subject, supportEmailDetails)
    }

    console.log("-------------------------")
    console.log("-------------------------")
    console.log("EMAIL:", otp, "------")
    console.log("-------------------------")
    console.log("-------------------------")
    //ADD OTP RESPONSE
    return res.status(200).json({
        status: true,
        message: "OTP sent successfully via email.",
        data: process.env.NODE_ENV !== "production" ? { otp } : {},
        responseCode: '000'
    });

})

exports.getBankOnReturn = async (req, res) => {
    const params = req.query
    const result = await findAllBankAccount(params);
    if (!result) {
        // Bank account details are not available
        const bankDetails = {
            accountHolderName: "Not available",
            accountNumber: "Not available",
            iban: "Not available",
            bankName: "Not available",
            // Set other properties if needed
        };
        return res.status(200).json({
            status: true,
            data: bankDetails,
            message : 'Back details fetched successfully',
            responseCode : '002'
        });
    } else {
        return res.status(200).json({
            status: true,
            data: result,
            message : 'Back details fetched successfully',
            responseCode : '000'
        });
    }
}

function formatISODate(isoDateString) {
    const dateObj = new Date(isoDateString);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
}


async function fetchRefundAmountDetails(transaction, amount) {

    let {providerCommission, corporateCashback, commissionType, cashbackType} = transaction.commissionDetails
    let totalCashback = 0, systemCashback = 0;
    // below code is to calculate the particular item cashback details
    //start
    if (commissionType === 'PERCENTAGE') {
        totalCashback = (parseFloat(amount) * parseFloat(providerCommission / 100)).toFixed(4)
    } else {
        totalCashback = providerCommission
    }
    if (cashbackType === "PERCENTAGE") {
        corporateCashback = (parseFloat(totalCashback) * parseFloat(corporateCashback / 100)).toFixed(4)
    }
    systemCashback = (parseFloat(totalCashback) - parseFloat(corporateCashback)).toFixed(4)
    return {
        amount,
        corporateCashback,
        systemCashback
    }
    //ends
    //now according to the above calculations refund need to be processed
    // create a refund functionality in which u need to fetch the order of same and check the following steps
    // first check the item returned is already refunded or not, by checking the key eg. "status": "Return Completed",
    //if it  "status": "Return Initiated" then do a transaction(generate the new trasactionId) of the above amount to the wallet and subtract the
    // above commissions and update the corporate wallet, and one more thing update the status to "status": "Return Completed" and store the
    // transactionId of the returned transaction

}

exports.returnUpdateOrder = async (req, res, next) => {
    try{
    let data = req.body
    let {corporateTxnId, ondcOrderId} = req.query

    // verifying otp (shared by both the legacy and the ONDC branch below)
    let response;
    let email
    if (data.scope === 'email') {
        email = req.user.email
    if (!req.user.email) {
        //get email from system user
        const result = await findOne(req.user)
        email = result.email
    }
        response = await verifyOtp({contact: email, otp: data.otp, context: 'email'})
        if (response.isVerified === false) {
            return res.status(401).json({status: false, message: response.message, data:{}, responseCode: '001'});
        }
    } else {
        return res.status(401).json({status: false, message: 'otp is required',data:{}, responseCode: '001'});
    }

    // ============================================================
    // ONDC branch — DigiDukaan /update return_request + lifecycle/refund.
    // ============================================================
    if (ondcOrderId) {
        if (data.returnStatus === 'Return Rejected') {
            // Nothing was ever sent to the seller — just acknowledge the rejection.
            return res.status(200).json({
                status: true,
                message: "Return request rejected",
                data: {},
                responseCode: "000"
            });
        }

        const ondcOrder = await findOndcOrderByIdAdmin(ondcOrderId)
        if (!ondcOrder) {
            return next(new ErrorResponse(`ONDC order not found`, 400));
        }

        let settings = {};
        try {
            settings = await getEasySplitSettings(req?.LogTraceId);
        } catch (_) {
            settings = { defaultReturnWindow: "P2D" };
        }

        const quoteItems = (ondcOrder.quote?.rows || []).filter((r) => r.titleType === "item");
        const returnItems = quoteItems.map((r) => ({
            itemId: String(r.itemId),
            quantity: Number(r.quantity) || 1,
        })).filter((i) => i.itemId && i.itemId !== "null");

        const eligibility = assertOndcOrderReturnable(ondcOrder, {
            items: returnItems.length ? returnItems : null,
            settings,
        });
        if (!eligibility.ok) {
            return next(new ErrorResponse(eligibility.message, eligibility.statusCode));
        }

        const { reasonId, reasonDesc } = resolveReturnReason(
            data.reasonId,
            data.reason || data.reasonDesc
        );
        const replace = data.replace === true || data.replace === "yes" || data.replace === "true";
        const returnRequestId = `${replace ? "RP" : "R"}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        const returnRequests = (returnItems.length ? returnItems : [{ itemId: "unknown", quantity: 1 }]).map(
            (item, idx) => ({
                id: idx === 0 ? returnRequestId : `${returnRequestId}_${idx + 1}`,
                itemId: item.itemId,
                itemQuantity: item.quantity,
                reasonId,
                reasonDesc,
                images: [],
                replace,
            })
        );

        await updateOndcOrderReturnLifecycle({
            id: ondcOrder.id,
            returnStatus: "Return_Requested",
            returnRequestId,
            returnReason: reasonDesc,
            returnMeta: {
                items: returnItems,
                reasonId,
                reasonDesc,
                replace,
                source: "admin",
                requestedAt: new Date().toISOString(),
            },
        });

        const waiterPromise = waitForOnUpdate(ondcOrder.transactionId)
        try {
            await ondcUpdate({
                bppId: ondcOrder.bppId,
                bppUri: ondcOrder.bppUri,
                orderId: ondcOrder.orderId,
                transactionId: ondcOrder.transactionId,
                returnRequests,
            })
        } catch (ondcErr) {
            return next(new ErrorResponse(ondcErr.message || `Failed to send the return request to the seller`, 502));
        }

        const result = await waiterPromise
        if (!result.received || result.error) {
            return next(new ErrorResponse(result.error?.message || `Seller did not confirm the return`, 502));
        }

        let applied = null;
        try {
            applied = await applyOndcReturnOnUpdate({
                transactionId: ondcOrder.transactionId,
                order: result.order,
                logTraceId: req?.LogTraceId,
                userId: req.user?.id || null,
            });
        } catch (_) {
            await updateOndcOrderReturn({ id: ondcOrder.id, returnReason: reasonDesc || null })
        }

        // Tell the buyer, exactly as the buyer-raised path does (returnOndcOrder).
        // This branch used to send nothing at all, so a return an admin raised on
        // the buyer's behalf was invisible to them — while the legacy non-ONDC
        // branch below has always mailed. Fire-and-forget: the admin's response
        // must not wait on SMTP.
        sendOndcReturnInitiatedEmail({
            row: ondcOrder,
            returnRequestId,
            items: quoteItems.map((r) => `${r.productName || r.title}${r.quantity ? ` × ${r.quantity}` : ""}`),
            reason: reasonDesc,
            logTraceId: req?.LogTraceId,
        }).catch(() => {});

        return res.status(200).json({
            status: true,
            message: replace
                ? "Replacement request submitted successfully"
                : "Order return submitted successfully",
            data: {
                returnStatus: applied?.returnStatus || "Return_Initiated",
                replace,
                refund: applied?.refund
                    ? {
                        status: Boolean(applied.refund.status),
                        amount: applied.refund.amount ?? 0,
                        alreadyRefunded: Boolean(applied.refund.alreadyRefunded),
                    }
                    : null,
            },
            responseCode: "000"
        });
    }

    // ============================================================
    // Legacy branch (unchanged) — non-ONDC orders on the old order/transaction
    // tables.
    // ============================================================
    const transaction = await findOneTransaction({corporateTxnId})
    if(!transaction){
        return next(new ErrorResponse(`Transaction not found`, 400));
      }
    let params = {
        id: transaction.order.id
      }
    // let orderResponse = transaction.order.orderResponse
    let orderResponse = JSON.parse(transaction.order.orderResponse)
    let productId = data.productId
    let selectedProduct = orderResponse.products.find((obj) => obj.productId == productId)
    let credentialId = transaction?.credentialId
    let emailBody = {
        name: transaction?.credential?.name,
        orderId: transaction?.corporateTxnId,
        placedOn: formatISODate(transaction.transactionDate),
        productName: selectedProduct?.productName,
        unitPrice: parseFloat(selectedProduct?.totalPrice) / parseFloat(selectedProduct?.productQuantity),
        quantity: parseFloat(selectedProduct?.productQuantity),
        totalPrice: parseFloat(selectedProduct?.totalPrice),
        shipping: 0,
        grandTotal: parseFloat(selectedProduct?.totalPrice),
        address: orderResponse?.address?.address,
        mobile: orderResponse?.address?.phone,
        returnPickUpDate: selectedProduct?.returnPickUpDate,
        remarks: selectedProduct?.reason
    }

    let templateDetails;
    templateDetails = await fetchPartnerDetails(transaction?.credential?.registeredBy)
    //handle cancel request has been rejected
    if (data.returnStatus == "Return Rejected") {

        orderResponse.products.forEach((product) => {
            if (product.productId == productId) {
              product.status = data.returnStatus;
            }
          })
          const reqOrderDataString = JSON.stringify(orderResponse);

          const obj = {
              orderResponse: reqOrderDataString
          }
        let result = await updateOrder(params, obj);
        if (!result) return next(new ErrorResponse(`Something went wrong while updating the order`, 500));

        const resolvedReturnRejected = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.ECOM_RETURN_REJECTED,
            service: EMAIL_TEMPLATE_SERVICES.ECOM,
            variables: { ...emailBody, ...v2LayoutVariables(templateDetails) },
            fallback: () => emailOrderReturnRejectedTemplate(emailBody, templateDetails),
            fallbackSubject: 'Your order return has been rejected',
            logTraceId: req?.LogTraceId,
        });
        let supportEmailDetails = resolvedReturnRejected.html;
        await emailer.email(transaction.credential.email, resolvedReturnRejected.subject, supportEmailDetails)

        return res.status(200).json({
            status: true,
            message: "Order updated successfully",
            data: {},
            responseCode: '000'
        });

    }

    
    let reqOrderData = JSON.parse(transaction.order.orderResponse)
    //code for refund and amount to wallet and bank
    if (data.returnStatus == 'Return Completed') {

        reqOrderData.products.forEach((product) => {
            if (product.productId == productId) {
              product.status = data.returnStatus;
            }
          })

       if(req.body?.paymentStatus == "REFUND") {
            //return with refund
            let refundAmountDetails = await fetchRefundAmountDetails(transaction, selectedProduct?.totalPrice)

            let { amount,corporateCashback,systemCashback} = refundAmountDetails
    
              let details = await returnRefundInEcommerce({amount,corporateCashback,systemCashback,transaction,productId,credentialId})
            
              // adding transactionId in order response-product
              const transactionId = details.transactionId
        
              reqOrderData.products.forEach((product) => {
                if (product.productId == productId) {
                  product.transactionId = transactionId;
                }
              })

        }
    }

    if(data.returnStatus == 'Return Initiated'){
        reqOrderData.products.forEach((product) => {
            if (product.productId == productId) {
              product.status = data.returnStatus;
              product.returnPickUpDate = data?.returnPickUpDate;
              product.returnInitiatedDate = new Date()
            }
          })
    }

    const reqOrderDataString = JSON.stringify(reqOrderData);

    const obj = {
        orderResponse: reqOrderDataString
    }
    let result = await updateOrder(params, obj);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the order`, 400));
    }

    if (data.returnStatus == 'Return Completed') {
        const resolvedReturnCompleted = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.ECOM_RETURN_COMPLETED,
            service: EMAIL_TEMPLATE_SERVICES.ECOM,
            variables: { ...emailBody, ...v2LayoutVariables(templateDetails) },
            fallback: () => emailOrderReturnCompletedTemplate(emailBody, templateDetails),
            fallbackSubject: 'Your order return has been returned successfully',
            logTraceId: req?.LogTraceId,
        });
        let supportEmailDetails = resolvedReturnCompleted.html;
        await emailer.email(transaction.credential.email, resolvedReturnCompleted.subject, supportEmailDetails)

    } else if (data.returnStatus == 'Return Initiated') {
        const resolvedReturnInitiated = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.ECOM_RETURN_INITIATED,
            service: EMAIL_TEMPLATE_SERVICES.ECOM,
            variables: { ...emailBody, ...v2LayoutVariables(templateDetails) },
            fallback: () => emailOrderReturnInitiatedTemplate(emailBody, templateDetails),
            fallbackSubject: 'Your order return has been initiated',
            logTraceId: req?.LogTraceId,
        });
        let supportEmailDetails = resolvedReturnInitiated.html;
        await emailer.email(transaction.credential.email, resolvedReturnInitiated.subject, supportEmailDetails)
    }
    return res.status(200).json({
        status: true,
        message: "Order updated successfully",
        data: {},
        responseCode: '000'
    });
}catch(err){
    return next(new ErrorResponse(`Something went wrong`, 500));
  }
};