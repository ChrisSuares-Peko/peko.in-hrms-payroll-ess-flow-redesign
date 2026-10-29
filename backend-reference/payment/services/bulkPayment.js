const axios = require('axios')
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require('../utils/checkAndFetchServiceDetails')
const { updateWalletTransaction, createWalletTransaction, refundWalletTransaction } = require('../utils/walletTransaction')
const { createNotification, updateBulkPaymentStatus, getIccidCodes } = require('../models/use-cases/notification')
const { createPGTransaction } = require('../utils/pamentGatewayTransaction')
const { cancelPGTransaction } = require('../utils/pgRefund')
const emailer = require('../utils/emailer')
const { generateOrderInvoiceAttachments } = require('./invoiceAndReceipt')
const { findOne } = require('../models/use-cases/serviceOperator');
const { generateEsimBuyBulkSuccessEmail, buildEsimQrCodeHtml } = require('../utils/emailTemplate/esim');
const { resolveEmailTemplate } = require('./emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/emailTemplate/sharedLayout');
const path = require('path');
const { findOneWallet } = require('../models/use-cases/wallets')
const { fetchPartnerDetails } = require('../models/use-cases/systemUser')
const { customLog } = require('../utils/loggerHelper')
const { trackBatchProgress, trackCounterProgress, setValue, getValue,  getList } = require('../utils/cacheDataMethods')
const ErrorResponse = require('../utils/error-response')
const { uploadFile } = require('../utils/commonUploadFile')
const QRCode = require("qrcode");
const { getPlanByPlanId } = require('../models/use-cases/esimPlans')
const { createEsimProfile } = require('../models/use-cases/esimProfiles')
const esimProfiles = require('../models/entities/esimProfilesTunz')
const operatorsData = require("../utils/operatorsData.json");


exports.processEsimPayment = async (body, next) => {
    try {
        console.table({ x: 'message received in processBillPayment' })
        console.log({ body })
        const req = { body: body }

        req.user = req.body.user

        let accessKey = req.body.accessKey
        const isTunz = accessKey === operatorsData.eSIMTunz.accessKey
        let transactionCategory = 'Travel'
        const { transactionId, account, amount, } = req.body;
        let partnerDetails;
        partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
        const credentialId = req.user.id
        const packageId = req.user.packageId
        const corporateUserId = req.user.corporateId
        const emailId = req.user.email
        let corporateTxnId = req.body.corporateTxnId;
        let providerId = transactionId
        let vendorUrl;
        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId
        })
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            console.log({ x: 'error in serviceDetails', serviceDetails })
            customLog(req?.LogTraceId, 'error', {
                message: '[BONDIO BULK] fetchServiceDetails failed',
                corporateTxnId,
                accessKey,
                error: serviceDetails.error
            });
            customLog(req?.LogTraceId, 'error', {
                message: '[BONDIO BULK] fetchServiceDetails failed',
                corporateTxnId,
                accessKey,
                error: serviceDetails.error
            });
            await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);
            return false
        }
        accessKey = accessKey === 'etisalat_bill' ? 'etisalat_direct' : accessKey // payoll 
        let token;
        let URL = serviceDetails.vendor.apiUrl

        if (isTunz) {
            token = await getToken(serviceDetails.vendor, accessKey);


            const plan = req.body.plan || await getPlanByPlanId(req.body.planId);
    
            const vendorBalance = await getVendorWalletBalance(URL, token);
    
            if (vendorBalance === null) {
              console.log("Unable to fetch vendor wallet balance");
    
              const userBalance = await findOneWallet(credentialId);
    
              updateBulkPaymentStatus(credentialId, {
                corporateTxnId,
                status: 'FAILURE',
                walletBalance: userBalance ? userBalance.balance : 0
              });
              await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);
              return false;
            }
    
            const requiredAmount = Number(plan?.vendorWholesalePriceUSD || 0);
    
            if (vendorBalance < requiredAmount) {
    
              console.log("Vendor wallet insufficient", {
                vendorBalance,
                requiredAmount
              });
    
              const updateDetails = {
                corporateTxnId,
                status: "FAILURE",
                providerId: "Not Available",
                message: "Vendor wallet balance insufficient",
                registeredById: req?.user?.registeredBy,
                orderResponse: JSON.stringify({
                  error: "Vendor wallet balance insufficient"
                })
              };
    
              const userBalance = await findOneWallet(credentialId);
    
              updateBulkPaymentStatus(credentialId, {
                corporateTxnId,
                status: 'FAILURE',
                walletBalance: userBalance ? userBalance.balance : 0
              });
    
              await updateWalletTransaction(updateDetails);
              await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);
              return false;
            }
        } else {
            token = serviceDetails.vendor.optional1;
        }        
     
        let commissionType = serviceDetails.commissionType
        let cashbackType = serviceDetails.cashbackType
        let serviceOperatorId = serviceDetails.id

        //----set 0 when bulk upload enabled for this service ------
        // let surcharge = calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount)
        const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
        const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
        // const surcharge = serviceDetails.surcharge
        let providerCommission = serviceDetails.providerCommission
        let corporateCashback = serviceDetails.cashback
        // let surcharge = 0;
        // let providerCommission = 0
        // let corporateCashback = 0


        // first we will  do transaction
        let transactionResponse = {}
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
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
                pgResponse: req.body.paymentGatewayResponse,
                surcharge,
                batchId: req.body.batchId,
                subCorporateUserId:req.body.subCorporateId
            })
        } else {
            transactionResponse = await createWalletTransaction({
                providerId,
                corporateTxnId,
                credentialId,
                serviceOperatorId,
                corporateCashback,
                accountNo: account,
                transactionCategory,
                surcharge,
                amount,
                commissionType,
                cashbackType,
                providerCommission,
                batchId: req.body.batchId
            })
        }
        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
            console.log({ x: 'error in transactionResponse' })
            customLog(req?.LogTraceId, 'error', {
                message: '[BONDIO BULK] createWalletTransaction failed',
                corporateTxnId,
                accessKey,
                error: transactionResponse.error
            });
            await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);
            return false
        }
        // const invoice_id = await createZohoInvoice(customer_id, serviceDetails.zoho_item_id, corporateTxnId, surcharge, parseFloat(amount).toFixed(2))
 
      let eSIMBody;

      if (isTunz) {

        eSIMBody = {
          inventoryItemId: req.body.planId,
          metatag: String(corporateTxnId),
          userIp: req.body.userIp,
          // Regional orders carry a 3-letter region code (EUR/ASA/...) which is not a valid userCountry
          userCountry: req.body.countryCode?.length === 2 ? req.body.countryCode : "NP",
          activationMode: "FIRST_USE"
        };
        

        vendorUrl = `${URL}/gigastore/activations/register`;

      } else {

        // Bondio
        eSIMBody = {
          planParams: {
            planId: req.body.planId,
            activationType: "NOW",
            activationAt: 0
          }
        };

        vendorUrl = `${URL}/v2/subscriptions`;

      }
      let config = {
        method: "post",
        url: vendorUrl,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: eSIMBody,
      };

        let result;
        try {
            customLog(req?.LogTraceId, "info", { config: config }, "VENDOR")
            if (process.env.NODE_ENV === 'production') {
                // Add 30 second timeout to prevent exceeding ackDeadline (120s)
                result = await Promise.race([
                    axios(config),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Vendor API timeout after 30 seconds')), 30000)
                    )
                ]);
                customLog(req?.LogTraceId, "info", { response: result?.data }, "VENDOR")
                if (!result || (result.data && (result.data.errorcode || result.data.errorCode))) {
                    throw new Error("Payment provider returned an error");
                }
            }
            else {
                result = isTunz
                ? { data: mockActivationResponseTunz }
                : mockResEsim            }
        } catch (error) {
            let updateDetails = {}
            console.log({ error: error.message });

            // Determine vendor and create specific error messages for easy searching
            const vendorName = isTunz ? 'TUNZ.IO' : 'BONDIO';
            let errorType = 'UNKNOWN_ERROR';
            let searchMessage = `[${vendorName} BULK] Vendor API Error`;

            if (error?.message?.includes('timeout')) {
                errorType = 'TIMEOUT_ERROR';
                searchMessage = `[${vendorName} BULK] VENDOR_API_TIMEOUT - Request exceeded 30 seconds`;
            } else if (error?.code === 'ECONNREFUSED') {
                errorType = 'CONNECTION_REFUSED';
                searchMessage = `[${vendorName} BULK] VENDOR_CONNECTION_REFUSED - Cannot reach vendor server`;
            } else if (error?.code === 'ENOTFOUND') {
                errorType = 'DNS_RESOLUTION_ERROR';
                searchMessage = `[${vendorName} BULK] VENDOR_DNS_ERROR - Cannot resolve vendor hostname`;
            } else if (error?.response?.status) {
                errorType = `HTTP_${error?.response?.status}`;
                searchMessage = `[${vendorName} BULK] VENDOR_HTTP_ERROR_${error?.response?.status} - ${error?.response?.statusText}`;
            } else {
                searchMessage = `[${vendorName} BULK] VENDOR_REQUEST_FAILED - Network or parsing error`;
            }

            customLog(req?.LogTraceId, 'error', {
                message: searchMessage,
                errorType,
                vendor: vendorName,
                corporateTxnId,
                accessKey,
                batchId: req.body.batchId,
                batchTotal: req.body.batchTotal ?? req.body.quantity,
                errorMessage: error?.message,
                errorCode: error?.code,
                errorStatus: error?.response?.status,
                errorStatusText: error?.response?.statusText,
                vendorUrl,
                vendorResponse: result?.data,
                vendorResponseError: error?.response?.data,
                isTimeout: error?.message?.includes('timeout'),
                isNetworkError: error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND'
            });
            updateDetails = {
                corporateTxnId,  // Use the defined corporateTxnId here
                status: "FAILURE",
                providerId: "Not Available",
                message: "Payment Failed",
                registeredById: req?.user?.registeredBy,
                orderResponse: JSON.stringify(result?.data || { error: error.message })
            };

            // Trigger failure event in production
            if (process.env.NODE_ENV === 'production') {
                // cleverTap.uploadEvent({
                //     eventName: "Transactions",
                //     eventData: { Status: "Payment Failure" },
                //     email: emailId,
                // });
            }
            if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
                await cancelPGTransaction(corporateTxnId);
            }
            await refundWalletTransaction(updateDetails);
            const userBalance = await findOneWallet(credentialId)
            updateBulkPaymentStatus(credentialId, { corporateTxnId, status: 'FAILURE', walletBalance: userBalance ? userBalance.balance : 0 })
            await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);
            return false;
        }

        let serviceName = "eSIM"
        // let result = await axios(config)
        let updateDetails = {}
      if (
        !result ||
        (
          result?.data &&
          (
            result.data.errorcode ||
            result.data.errorCode ||
            result.status >= 400
          )
        )
      ) {
            console.log({ data: result?.data })
            customLog(req?.LogTraceId, 'error', {
                message: '[BONDIO BULK] Vendor returned error response',
                corporateTxnId,
                accessKey,
                resultStatus: result?.status,
                resultData: result?.data,
                hasErrorCode: !!result?.data?.errorCode,
                hasErrorcode: !!result?.data?.errorcode
            });
            updateDetails = {
                corporateTxnId,
                status: "FAILURE",
                providerId: "Not Available",
                message: "Payment Failed",
                registeredById: req?.user?.registeredBy,
                orderResponse: JSON.stringify(result?.data || {})
            }
            // must use this in transaction events
            // cleverTap.uploadEvent({
            //     eventName: "Transactions",
            //     eventData: {
            //     Status: "Payment Failure",
            //     },
            //     email: emailId,
            // },partnerDetails);
            if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
                await cancelPGTransaction(corporateTxnId);
            }
            await refundWalletTransaction(updateDetails);
            const userBalance = await findOneWallet(credentialId)
            updateBulkPaymentStatus(credentialId, { corporateTxnId, status: 'FAILURE', walletBalance: userBalance ? userBalance.balance : 0 })
            await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);
        } else {
            updateDetails = {
                corporateTxnId,
                providerId: isTunz
                ? result.data.activatedItem?.uid || "Not Available"
                : result.data.orderId || "Not Available",
                status: "SUCCESS",
                message: "Payment Successful",
                // orderResponse: JSON.stringify(result?.data || {})
                orderResponse: JSON.stringify({
                    ...result?.data, // Spread existing data
                    planId: req.body.planId, // Add the planid field
                    ...(isTunz && { customerUid: result?.data?.customer?.uid })
                })
            }
            // must use this in transaction events
            // cleverTap.uploadEvent({
            //     eventName: "Transactions",
            //     eventData: {
            //     Status: "Payment Success",
            //     },
            //     email: emailId,
            // },partnerDetails);
            const userBalance = await findOneWallet(credentialId)
            updateBulkPaymentStatus(credentialId, { corporateTxnId, status: 'SUCCESS', walletBalance: userBalance ? userBalance.balance : 0 })
            await updateWalletTransaction(updateDetails)
            if (isTunz) {
              try {
            
                const esimProfile = result.data.esimProfile;
            
                const vendorCustomerUid =
                  result?.data?.customer?.uid;
            
                const existing = await esimProfiles.findOne({
                  where: { iccid: esimProfile.iccid }
                });
            
                if (!existing) {
                  await createEsimProfile({
                    credentialId,
                    corporateUserId,
                    customerUid: vendorCustomerUid,
                    esimUid: esimProfile.uid,
                    iccid: esimProfile.iccid,
                    activationCode: esimProfile.activationCode,
                    planId: req.body.planId,
                    country: req.body.country,
                    corporateTxnId,
                    state: esimProfile.state,
                    installationUrl: esimProfile.installationUrl,
                  });
                }
            
              } catch (err) {
                console.log("Failed saving esim profile:", err.message);
              }
            }
        }
        const batchCompleted = await trackBatchProgress(req.body.batchId, req.body.batchTotal ?? req.body.quantity);

        // For mixed-vendor orders, gate the email until ALL vendor batches are done.
        // parentBatchId and totalVendorGroups are injected by processPaymentInternal.
        const msgParentBatchId = req.body.parentBatchId || null;
        const totalVendorGroups = req.body.totalVendorGroups || 1;

        let shouldSendEmail = false;
        if (batchCompleted) {
            if (msgParentBatchId) {
                shouldSendEmail = await trackCounterProgress(
                    `mixed:email:gate:${msgParentBatchId}`,
                    totalVendorGroups
                );
            } else {
                shouldSendEmail = true;
            }
        }

        if (shouldSendEmail) {
            const plan = req.body.plan;

            // Collect iccids and compute the correct total amount.
            // For mixed orders: read all child batches registered under parentBatchId.
            // For single-vendor: use this batch only.
            let allEsimIDs = [];
            let emailTotalAmount;

            if (msgParentBatchId) {
                const childEntries = await getList(`mixed:batches:${msgParentBatchId}`);
                let runningTotal = 0;
                for (const entry of childEntries) {
                    try {
                        const { batchId: childBatchId, totalAmount } = JSON.parse(entry);
                        const ids = await getIccidCodes(Number(childBatchId));
                        if (Array.isArray(ids)) allEsimIDs.push(...ids);
                        runningTotal += Number(totalAmount);
                    } catch (parseErr) {
                        console.log('Error parsing child batch entry:', parseErr.message);
                    }
                }
                emailTotalAmount = runningTotal.toFixed(2);
            } else {
                allEsimIDs = await getIccidCodes(req.body.batchId);
                const batchTotal = req.body.batchTotal ?? req.body.quantity;
                // Use batch surcharge from gateway if available, otherwise use calculated surcharge
                const batchSurcharge = req.body.batchSurcharge !== undefined ? Number(req.body.batchSurcharge) : surcharge;
                emailTotalAmount = (Number(amount) * Number(batchTotal) + batchSurcharge).toFixed(2);
            }

            // Send push notification
            createNotification({
                notificationTitle: `${serviceName} - Bulk eSIM purchase`,
                notificationBrief: `Bulk purchase for ${serviceName} processed successfully.`,
                notificationTo: [req.user.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });

            // Generate QR codes. For each iccid, check esimProfiles to determine vendor:
            // Tunz profiles have an activationCode in the DB; Bondio does not.
            const qrCodes = [];
            for (const iccid of allEsimIDs) {
                const tunzProfile = await esimProfiles.findOne({
                    where: { iccid },
                    attributes: ['iccid', 'activationCode'],
                });
                if (tunzProfile) {
                    try {
                        const qrData = await generateTunzQRCode([{
                            iccid: tunzProfile.iccid,
                            activationCode: tunzProfile.activationCode,
                        }]);
                        qrCodes.push({ iccid: qrData.iccid, qrCodeUrl: qrData.qrCodeUrl });
                    } catch (qrError) {
                        customLog(req?.LogTraceId, "error", { message: "Bulk QR generation failed (Tunz)", error: qrError?.message, iccid });
                        qrCodes.push({ iccid, qrCodeUrl: null });
                    }
                } else {
                    try {
                        const bondioQr = await handleQRCode([iccid], URL, next);
                        qrCodes.push(...bondioQr);
                    } catch (qrError) {
                        customLog(req?.LogTraceId, "error", { message: "Bulk QR generation failed (Bondio)", error: qrError?.message, iccid });
                        qrCodes.push({ iccid, qrCodeUrl: null });
                    }
                }
            }

            const esimIds = allEsimIDs.join(', ');
            const totalQty = allEsimIDs.length;

            let type = req.body.type || "SIM";
            const emailSubject = type === 'SIM'
                ? "Your eSIM Order Confirmation"
                : "Your eSIM-Topup Order Confirmation";

            const dataMBs = plan?.dataMBs;
            const periodDays = plan?.periodDays;
            const dataDisplay = dataMBs >= 1024
                ? (dataMBs / 1024).toFixed(1).replace(/\.0$/, '') + ' GB'
                : dataMBs + ' MB';
            const resolvedEsimBulkBuy = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.ESIM_BULK_BUY_SUCCESS,
                service: EMAIL_TEMPLATE_SERVICES.ESIM,
                variables: {
                    transactionId: corporateTxnId,
                    amount: emailTotalAmount,
                    quantity: totalQty,
                    packageName: `${dataDisplay} - ${periodDays} Days`,
                    heading: type === 'SIM' ? 'eSIM Order Confirmation' : 'eSIM-Topup Order Confirmation',
                    nameOfOperator: plan?.name,
                    name: req.user.name,
                    branding: partnerDetails?.branding || 'Peko',
                    website: partnerDetails?.website || 'https://www.peko.one',
                    activationNoteHtml: type === 'SIM'
                        ? 'The next step is to activate your eSIM using the installation guide attached to this email.'
                        : '<!-- topup: no activation step -->',
                    qrCodeHtml: buildEsimQrCodeHtml(type, qrCodes),
                    ...v2LayoutVariables(partnerDetails),
                },
                fallback: () => generateEsimBuyBulkSuccessEmail(corporateTxnId, emailTotalAmount, plan, type, totalQty, esimIds, qrCodes, partnerDetails, req.user.name),
                fallbackSubject: emailSubject,
                partnerId: req.user.registeredBy || null,
                logTraceId: req?.LogTraceId,
            });
            const filePath = path.resolve(__dirname, "../public/assets/pdf/eSIM Installation guideline.pdf");
            const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse');
            const invoiceAttachments = await generateOrderInvoiceAttachments({
                amount,
                surcharge,
                couponDiscount: transactionResponse?.couponDiscount || 0,
                corporateTxnId,
                orderId: transactionResponse?.orderId,
                paymentType: type === 'SIM' ? 'eSIM' : 'eSIM Top-up',
                credentialId,
                pgAmount: isPgFunded ? (req.body.pgAmount ?? (Number(amount) + Number(surcharge))) : null,
                paymentMethod: req.body?.paymentGatewayResponse?.paymentMethod,
                traceId: req?.LogTraceId,
            });
            emailer.emailWithMultipleAttachment(emailId, resolvedEsimBulkBuy.subject, resolvedEsimBulkBuy.html, [{ filename: "eSIM Installation guideline.pdf", path: filePath }, ...invoiceAttachments], undefined, function () {
                console.log("Email sent to -----------------------------------------------------" + emailId);
            });
        }
        return true
    } catch (error) {
        console.log({ error: error.message });
        customLog(null, 'error', {
            message: '[BONDIO BULK] Unexpected error in processEsimPayment',
            corporateTxnId: body?.corporateTxnId,
            accessKey: body?.accessKey,
            errorMessage: error?.message,
            errorStack: error?.stack
        });
        return false;
    }
}

async function handleQRCode(data, apiUrl, next) {
    const qrCodeUrls = [];
    for (const esimData of data) {
        const iccid = esimData;
        const logoUrl = await getQRCode(iccid, apiUrl, next);
        qrCodeUrls.push({
            // id: esimData.id,
            iccid,
            qrCodeUrl: logoUrl
        })
    }
    return qrCodeUrls
}

async function getQRCode(iccid, apiUrl, next) {
    const vendorUrl = `${apiUrl}/v1/esims/${iccid}/qrcode`;
    let serviceDetails = await findOne({ accessKey: "esim" })
    const token = serviceDetails.vendor.optional1

    // Make the API call to fetch the QR code
    const config = {
        method: 'GET',
        url: vendorUrl,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`,
        },
        responseType: 'arraybuffer'
    }
    let response = await axios(config);

    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64Image = imageBuffer.toString('base64');
    const filePath = `esims`;
    const logoUrl = await uploadFile(base64Image, filePath, 'png');
    if (!logoUrl) {
        return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
    }
    console.log('QR code saved as qrcode.png');
    return logoUrl;
}

const mockResEsim = {
    status: 201,
    statusText: 'Created',
    data: {
        id: 'sub2_aemorih9',
        createdAt: 1728302326,
        esim: '8937204017177720078',
        metadata: null
    }
}

async function getToken(details, accessKey) {
    try {
      const cacheKey = `tunz-io-${accessKey}`;
      const cachedToken = await getValue(cacheKey);
  
      if (cachedToken) {
        return cachedToken;
      }
      const response = await axios.post(
        `${details.apiUrl}/reseller/authenticate`,
        {},
        {
          auth: {
            username: details.optional1,
            password: details.optional2,
          },
          headers: {
            Accept: "application/json",
          },
        }
      );
  
      if (response.status === 200 && response.data.accessToken) {
        const token = response.data.accessToken;
        const expiresIn = response.data.expiresIn; // seconds
  
        // Store token in cache (subtract 60 sec buffer)
        await setValue(cacheKey, expiresIn - 60, token);
  
        return token;
      }
  
      return false;
  
    } catch (err) {
      console.log(err)
      customLog(null, "error", {
        message: err?.message,
        data: err?.response?.data,
      });
      return false;
    }
  }
  
  async function generateTunzQRCode(esimProfile) {
    try {
      if (!Array.isArray(esimProfile) || esimProfile.length === 0) {
        throw new Error("Invalid esim profile");
      }
  
      const { iccid, activationCode } = esimProfile[0];
  
      const qrBase64 = await QRCode.toDataURL(activationCode);
  
      const base64Image = qrBase64.replace(/^data:image\/png;base64,/, "");
  
      const qrCodeUrl = await uploadFile(base64Image, "esims", "png");
  
      return {
        iccid,
        activationCode,
        qrCodeUrl
      };
    } catch (error) {
      console.error("Error generating Tunz QR Code:", error);
  
      throw new Error("Failed to generate Tunz QR Code");
    }
  }
  
  const mockActivationResponseTunz = {
    status: "success",
    activatedItem: {
      balance: {
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        activationMode: "NOW",
        name: "Worldwide 10MB Test",
        size: {
          sizeValue: 10,
          sizeUnit: "MB"
        },
        availableBalance: {
          sizeValue: 10,
          sizeUnit: "MB"
        },
        validitySize: 30,
        validityUnit: "days"
      },
      uid: `test-item-${Date.now()}`,
      metatag: "Mock activation",
      salesChannel: "API",
      salesChannelTypeCode: "API",
      activationType: "DATA_PLAN",
      purchasePrice: {
        sortIndex: 1,
        priceValue: 0.01,
        currencyCode: "USD"
      },
      retailPrice: {
        sortIndex: 1,
        priceValue: 0.01,
        currencyCode: "USD"
      }
    },
    customer: {
      email: "test@test.com",
      uid: `customer-${Date.now()}`,
      profileUrl: "mock-profile"
    },
    esimProfile: {
      iccid: `890000000000${Math.floor(Math.random() * 100000)}`,
      uid: `esim-${Date.now()}`,
      imsi: `00101${Math.floor(Math.random() * 100000000)}`,
      activationCode: `LPA:1$mock.server$${Math.random().toString(36).substring(2, 10)}`,
      appleUniversalLink: "https://mock-install-link.apple",
      installationUrl: "https://mock-install-link",
      lastSeen: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      state: "RELEASED"
    }
  };

  async function getVendorWalletBalance(URL, token) {
    try {
      const response = await axios.get(
        `${URL}/gigastore/users/current/credit`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      return Number(response?.data?.balance?.value || 0);
    } catch (err) {
      return null;
    }
  }