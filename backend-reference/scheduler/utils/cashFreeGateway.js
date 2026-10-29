const { default: axios } = require("axios");

const { findOneOrder, updateOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");
const emailer = require("./emailer");
const { isMswipePayment, requestMswipeManualRefund } = require("./mswipeManualRefund");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];

exports.cancelPGTransaction = async (req, corporateTxnId, refundAmount) => {
  try {
    const orderDetails = await findOneOrder({ corporateTxnId });

    if (!orderDetails) {
      return { status: false, message: "Order details not found" };
    }

    const paymentBodyData = JSON.parse(orderDetails?.paymentModeResponse);
    const order_id = paymentBodyData?.order_id;

    if (orderDetails.status !== "SUCCESS") {
      return { status: false, message: "Order status is not success" };
    }

    if (isMswipePayment(paymentBodyData)) {
      return await requestMswipeManualRefund({
        corporateTxnId,
        paymentBodyData,
        refundAmount,
        saveOrder: (fields) => updateOneOrder(corporateTxnId, fields),
        sendMail: ({ to, subject, html }) => emailer.email(to, subject, html),
        logTraceId: req?.LogTraceId,
      });
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

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

    customLog(req?.LogTraceId, "info", { message: "Initiating Cashfree refund", orderId: order_id, refundAmount, corporateTxnId }, "VENDOR");

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
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

    return {
      status: true,
      refundStatus: response?.data?.refund_status,
      message: "Refund successfull",
    };
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Cashfree refund failed",
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
      corporateTxnId,
    }, "VENDOR");

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
      customLog(req?.LogTraceId, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    return {
      status: false,
      message: "Something went wrong",
      error: error?.response?.data,
    };
  }
};