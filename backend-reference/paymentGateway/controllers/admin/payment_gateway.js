const { default: axios } = require("axios");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const {
  findServiceOperatorByAccessKey,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const asyncHandler = require("../../middlewares/async");
const { findOne } = require("../../models/use-cases/corporateUser");
const { findOneById } = require("../../models/use-cases/serviceOperator");
const {
  createPaymentLink,
  findOne: findOnePaymentLink,
  update,
} = require("../../models/use-cases/paymentLink");
const {
  findOneCredentialByEmail,
} = require("../../models/use-cases/credential");
const { createNotification } = require("../../models/use-cases/notification");
const { formatNumberWithLocalString } = require("../../utils/formatter");

const accessKey = "REDACTED";

async function getAccessToken(details, accessKey) {
  const REALM =
    process.env.NODE_ENV == "staging" ? "ni" : "networkinternational";
  let isTokenData = await getValue(`access_token-${accessKey}`);
  if (isTokenData) {
    return isTokenData;
  } else {
    let config = {
      method: "post",
      url: `${details["apiUrl"]}/identity/auth/access-token`,
      headers: {
        "Content-Type": "application/vnd.ni-identity.v1+json",
        Authorization: `Basic ${process.env.NI_PAYMENT_GATEWAY_KEY}`,
      },
      data: {
        grant_type: "client_credentials",
        realm: REALM,
      },
    };
    let response = await axios(config);
    if (response && response.data && response.data.access_token) {
      let access_token = response.data.access_token;
      let expiry = response.data.expires_in;
      await setValue(`access_token-${accessKey}`, expiry, access_token);
      return access_token;
    } else {
      return false;
    }
  }
}

exports.createInvoice = asyncHandler(async (req, res, next) => {
  try {
    const {
      corporate,
      service,
      transactionType,
      emailSubject,
      message,
      expiryDate,
      paymentAttempts,
      total,
    } = req.body;

    // keep decimal
    let amount = Number(total.value.toString() + "00");

    const corporateDetails = await findOne({ id: corporate });

    const selectedServiceDetails = await findOneById(service);

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 200));
    }

    let vendorUrl = serviceDetails.vendor.apiUrl;

    // get access token
    let accessToken = await getAccessToken(serviceDetails.vendor, accessKey);

    const outletReference = serviceDetails.vendor["optional1"];

    const contactPersonFirstName =
      corporateDetails?.contactPersonName?.split(" ")[0];
    const contactPersonLastName =
      corporateDetails?.contactPersonName?.split(" ")[1] ??
      `- ${corporateDetails?.name}`;

    //create order
    let config = {
      method: "post",
      url: `${vendorUrl}/invoices/outlets/${outletReference}/invoice`,
      headers: {
        "Content-Type": "application/vnd.ni-invoice.v1+json",
        Accept: "application/vnd.ni-invoice.v1+json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        firstName: contactPersonFirstName,
        lastName: contactPersonLastName,
        email: corporateDetails.email,
        transactionType: transactionType,
        emailSubject: emailSubject,
        invoiceExpiryDate: expiryDate,
        items: [
          {
            description: selectedServiceDetails.serviceProvider,
            totalPrice: { ...total, value: amount },
            quantity: 1,
          },
        ],
        total: { ...total, value: amount },
        message: message,
      },
    };

    if (paymentAttempts) {
      config.data["paymentAttempts"] = paymentAttempts;
    }

    console.log(config, "-------------------> REQUEST DATA");

    axios(config)
      .then(async (response) => {
        if (
          response.data.reference &&
          Object.prototype.hasOwnProperty.call(response.data._links, "payment")
        ) {
          console.log(response.data, "-------------------> RESPONSE DATA");
          const result = response?.data;

          const sentPayload = {
            ...config.data,
            corporateId: corporate,
            serviceId: service,
            total: {
              ...config.data.total,
              value: (config.data.total.value / 100).toFixed(2),
            },
          };
          delete sentPayload.redirectUrl;

          const orderDetails = await createPaymentLink({
            sentPayload: sentPayload,
            client_url: result?._links?.payment?.href,
            status: "created",
            invoiceId: result?.reference,
            credentialId: req.user.id,
            type: "ADMIN",
            amount: amount
          });
          return res.status(201).json({
            status: true,
            data: {
              paymentLink: result?._links?.payment?.href,
              createdAt: orderDetails?.createdAt,
              orderId: orderDetails?.invoiceId,
              customerName: `${orderDetails?.sentPayload?.firstName} ${orderDetails?.sentPayload?.lastName}`,
              expiryDate: orderDetails?.sentPayload?.invoiceExpiryDate,
            },
            message: "Payment link generated successfully",
            responseCode: "000",
          });
        } else {
          return res.status(400).json({
            status: false,
            message: "Something went wrong while creating payment link",
            data: {},
            responseCode: "001",
          });
        }
      })
      .catch(async (err) => {
        console.error(err, 1);
        console.log({ x: err?.response?.data?.errors });
        return next(
          new ErrorResponse(
            "Something went wrong while creating payment link",
            400
          )
        );
      });
  } catch (error) {
    console.log(error, 2);
    return next(
      new ErrorResponse("Something went wrong while creating payment link", 400)
    );
  }
});

exports.checkStatus = async function (orderReference) {
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return new ErrorResponse(serviceDetails["error"]);
  }
  let vendorUrl = serviceDetails.vendor.apiUrl;
  // get access token
  let accessToken = await getAccessToken(serviceDetails.vendor, accessKey);

  const outletReference = serviceDetails.vendor["optional1"];

  //api call for getting order details ( success or failure )
  let config = {
    method: "get",
    url: `${vendorUrl}/transactions/outlets/${outletReference}/orders/${orderReference}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  const response = await axios.request(config);
  return response?.data;
};

exports.paymentLinkCallback = asyncHandler(async (req, res, next) => {
  try {
    const body = req?.body;
    console.log(body, "------------> WEBHOOK BODY");

    let paymentRefId = req?.body?.order?.reference;
    if (!paymentRefId) {
      return next(
        new ErrorResponse("Reference ID is missing in the data", 400)
      );
    }
    const orderDetails = await findOnePaymentLink({ invoiceId: paymentRefId });
    if (!orderDetails) {
      return next(new ErrorResponse("Order not found", 404));
    }
    if (!Array.isArray(orderDetails.updates)) {
      orderDetails.updates = [];
    }
    orderDetails.updates.push(body);

    if (body.eventName == "PURCHASED" || body.eventName == "CAPTURED") {
      orderDetails.status = "paid";
    } else if (
      body.eventName == "PURCHASE_FAILED" ||
      body.eventName == "CAPTURE_FAILED"
    ) {
      orderDetails.status = "paid";
    }
    await update(orderDetails.id, {
      status: orderDetails.status,
      updates: [...orderDetails.updates],
    });
    // here we can add notification / mail if required
    const storedPayload = JSON.parse(orderDetails.sentPayload);
    const { username } = await findOneCredentialByEmail(
      { email: storedPayload.email },
      ["username"]
    );
    const notificationData = {
      notificationTitle: `${
        orderDetails?.sentPayload?.firstName || "A customer"
      } paid ₹ ${formatNumberWithLocalString(
        orderDetails?.sentPayload?.total?.value
      )}`,
      notificationBrief: `${
        orderDetails?.sentPayload?.firstName || "A customer"
      } paid ₹ ${formatNumberWithLocalString(
        orderDetails?.sentPayload?.total?.value
      )} through the payment link.`,
      notificationTo: [username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    createNotification(notificationData);
    res.status(200).json({
      status: true,
      data: {},
      message: "Payment updated successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.log("🚀 ~  error:", error);
    return next(
      new ErrorResponse("Something went wrong while updating transaction", 400)
    );
  }
});

exports.resendInvoice = asyncHandler(async (req, res, next) => {
  try {
    const { email, updatedExpiryDate } = req.body;
    const { paymentRefId } = req.params;

    if (!paymentRefId) {
      return next(
        new ErrorResponse("Reference ID is missing in the data", 400)
      );
    }
    const orderDetails = await findOnePaymentLink({ invoiceId: paymentRefId });
    if (!orderDetails) {
      return next(new ErrorResponse("Order not found", 404));
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse(serviceDetails["error"], 200));
    }

    let vendorUrl = serviceDetails.vendor.apiUrl;
    // get access token
    let accessToken = await getAccessToken(serviceDetails.vendor, accessKey);

    const outletReference = serviceDetails.vendor["optional1"];

    let config = {
      method: "put",
      url: `${vendorUrl}/invoices/outlets/${outletReference}/invoice/${paymentRefId}/resend`,
      headers: {
        "Content-Type": "application/vnd.ni-invoice.v1+json",
        Accept: "application/vnd.ni-invoice.v1+json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        email: email,
      },
    };

    if (updatedExpiryDate) {
      config.data["invoiceExpiryDate"] = updatedExpiryDate;
    }

    axios(config)
      .then(async (response) => {
        if (
          response.data.reference &&
          Object.prototype.hasOwnProperty.call(response.data._links, "payment")
        ) {
          if (updatedExpiryDate) {
            await update(orderDetails.id, {
              sentPayload: {
                ...orderDetails.sentPayload,
                invoiceExpiryDate: updatedExpiryDate,
              },
            });
          }
          return res.status(201).json({
            status: true,
            data: {},
            message: "Payment link resend successfully",
            responseCode: "000",
          });
        } else {
          return res.status(400).json({
            status: false,
            message: "Something went wrong while resending payment link",
            data: {},
            responseCode: "001",
          });
        }
      })
      .catch(async (err) => {
        console.error(err, 1);
        console.log({ x: err?.response?.data?.errors });
        return next(
          new ErrorResponse(
            "Something went wrong while resending payment link",
            400
          )
        );
      });
  } catch (error) {
    console.log(error, 2);
    return next(
      new ErrorResponse(
        "Something went wrong while resending payment link",
        400
      )
    );
  }
});
