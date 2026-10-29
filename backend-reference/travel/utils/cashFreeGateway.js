const { findOneOrder,  updateOneOrder} = require("../models/use-cases/order");
const { findOneServiceOperator } = require("../models/use-cases/serviceOperator");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");
const { default: axios } = require("axios");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];
const hotelsKey = operatorsData["hotel"]["accessKey"];
const busKey = operatorsData["bus"]["accessKey"];

const emailer = require("./emailer");
const { isMswipePayment, requestMswipeManualRefund } = require("./mswipeManualRefund");
const { findByName } = require("../models/use-cases/setting");
const { refundFailure } = require("./emailTemplates/common");
const { refundInitiated } = require("../utils/emailTemplates/common");
const { partnerLogos } = require("./partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");

exports.cancelPGTransaction = async (corporateTxnId, refundAmount) => {
  let serviceProvider, serviceCategory;

  try {
    const orderDetails = await findOneOrder({ corporateTxnId });
    
    if (!orderDetails) {
      return { status: false, message: "Order details not found" };
    }
   
    serviceProvider = orderDetails.serviceOperator?.serviceProvider;
    serviceCategory = orderDetails.serviceOperator?.serviceCategory;
    const paymentBodyData = JSON.parse(orderDetails?.paymentModeResponse);

    const order_id = paymentBodyData?.order_id;
    const originalPaymentAmount = parseFloat(paymentBodyData?.payment_amount) || 0;

    if (refundAmount !== undefined && refundAmount !== null) {
      refundAmount = parseFloat(refundAmount);
      
      if (isNaN(refundAmount) || refundAmount <= 0) {
        return { status: false, message: "Invalid refund amount provided" };
      }
      
      if (refundAmount > originalPaymentAmount) {
        return { 
          status: false, 
          message: `Refund amount (${refundAmount}) cannot be greater than original payment amount (${originalPaymentAmount})` 
        };
      }
    } else {
      refundAmount = originalPaymentAmount;
    }

   
   const serviceOperatorDetails = await findOneServiceOperator({ serviceOperatorId:orderDetails.serviceOperatorId });
   const isHotels = serviceOperatorDetails?.accessKey === hotelsKey;
   const isBus = serviceOperatorDetails?.accessKey === busKey;

   if (
     (isHotels || isBus)
       ? (orderDetails.status !== 'SUCCESS' && orderDetails.status !== 'REFUND_REQUESTED')
       : orderDetails.status !== 'SUCCESS'
   ) {
     return { status: false, message: 'Order status is not success' };
   }

    if (isMswipePayment(paymentBodyData)) {
      const customer = orderDetails?.credential;
      return await requestMswipeManualRefund({
        corporateTxnId,
        paymentBodyData,
        refundAmount,
        saveOrder: (fields) => updateOneOrder(corporateTxnId, fields),
        sendMail: ({ to, subject, html }) => emailer.email(to, subject, html),
        notifyCustomer: customer?.email
          ? () => paymentRefundInitiatedEmailInternal({
            name: customer.name || customer.username || "Corporate",
            email: customer.email,
            amount: refundAmount,
            transactionId: corporateTxnId,
            serviceProvider,
            typeOfService: serviceCategory,
            registeredBy: customer.registeredBy,
          })
          : undefined,
      });
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    customLog(null, "info", { serviceDetails: serviceDetails, message: "from cancel pgt transaction" });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return { status: false, message: serviceDetails.error };
    }
 

    const clientId = orderDetails.serviceOperator?.paymentclientid ?? serviceDetails.vendor.optional1;
    const clientSecret = orderDetails.serviceOperator?.paymentclientsecret ?? serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;

    const refundBody = {
      refund_id: `refund_${corporateTxnId}`,
      refund_amount: refundAmount,
      refund_note: corporateTxnId.toString(),
      // refund_speed, //STANDARD, INSTANT
    };

    const config = {
      method: "POST",
      url: `${baseUrl}/pg/orders/${order_id}/refunds`,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: refundBody,
    };

    customLog(null, "info", { message: "Initiating Cashfree refund", orderId: order_id, refundAmount, corporateTxnId }, "VENDOR");

    const response = await axios(config);

    customLog(null, "info", {
      message: "Cashfree refund response",
      response: response?.data,
    }, "VENDOR");

    const vendorRefundStatus = response?.data?.refund_status;
    const refundStatus = vendorRefundStatus === "SUCCESS" ? "INITIATED" : vendorRefundStatus;
    paymentBodyData.refundStatus = refundStatus;
    paymentBodyData.refundResults = [response?.data];

    await updateOneOrder(corporateTxnId, {
      paymentModeResponse: JSON.stringify(paymentBodyData),
    });

    try {
      const corporateEmail = orderDetails?.credential?.email;
      const corporateName = orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate";
      const registeredBy = orderDetails?.credential?.registeredBy;

      if (corporateEmail) {
        await paymentRefundInitiatedEmailInternal({
          name: corporateName,
          email: corporateEmail,
          amount: refundAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
          registeredBy,
        });
      } else {
        customLog(null, "info", {
          message: "Corporate email not found in orderDetails, skipping refund initiated email",
          corporateTxnId,
        });
      }
    } catch (emailError) {
      customLog(null, "error", {
        message: "Error while sending refund initiated email",
        error: emailError,
      });
    }

    return {
      status: true,
      refundStatus: response?.data?.refund_status,
      message: "Refund successfull",
    };
  } catch (error) {
    customLog(null, "error", {
      message: "Cashfree refund failed",
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
      corporateTxnId,
    }, "VENDOR");

    // Update order with refund failure details if possible
    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        const paymentBodyData = JSON.parse(orderDetails.paymentModeResponse);
        paymentBodyData.refundResults = [error?.response?.data];
        paymentBodyData.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, {
          paymentModeResponse: JSON.stringify(paymentBodyData),
        });
      }
    } catch (updateError) {
      customLog(null, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    paymentRefundFailureEmailInternal({ amount: refundAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory });

    return {
      status: false,
      message: "Something went wrong",
      error: error?.response?.data,
    };
  }
};

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {
  
  const resp = await findByName({name: "pekoWebsite"})
  const email = resp.emails;
  let emailContent = refundFailure({
    name:"Admin",
    amount,
    transactionId: transactionId,
    serviceProvider,
    typeOfService,
  });
  await emailer.email(email, "Refund Failed", emailContent);
  
}

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService, registeredBy }) {
  const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
  const emailContent = refundInitiated({
    name: name || "Corporate",
    amount,
    transactionId,
    serviceProvider,
    typeOfService,
  }, partnerData);
  await emailer.email(email, "Refund Initiated", emailContent);
}