/* eslint-disable no-prototype-builtins */
const {
  findAllPaymentLinks,
  createPaymentLink,
} = require("../../models/use-cases/quickLinks");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const axios = require("axios");
const {
  fetchServiceDetails,
} = require("./../../utils/checkAndFetchServiceDetails");
const accessKey = "quick_links";
const serviceType = "3";
const emailer = require("../../utils/emailer");
const sms = require("../../utils/sms");
const { findOneInvoice } = require("../../models/use-cases/invoices");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { generatePaymentLinkTemplate } = require("../../utils/emailTemplates/invoice");

exports.createLink = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    serviceType,
    packageId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 500));
  }
  let data = JSON.stringify({
    QuickLinkRequest: {
      StoreID: "28165",
      AuthKey: "REDACTED",
      Details: {
        Desc: req.body.note,
        Cart: req.user.id,
        Currency: "INR",
        Amount: req.body.amount,
        MinQuantity: "1",
        MaxQuantity: "1",
        FullName: req.body.purpose,
        Addr1: "SXR",
        City: "SRINAGAR",
        Country: "IN",
        Email: req.body.customer_email,
        Phone: req.body.customer_phone,
      },
      VariableValueMode: {
        Status: "",
        SectionTitle: "",
      },
      RepeatBilling: {
        Status: "",
        Amount: "",
        Period: "",
        Interval: "",
        Start: "",
        Term: "",
        Final: "",
      },
      Availability: {
        NotValidBefore: {
          Day: "",
          Month: "",
          Year: "",
        },
        NotValidAfter: {
          Day: "",
          Month: "",
          Year: "",
        },
        StockControl: "1",
        StockCount: "5",
      },
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://secure.telr.com/gateway/api_quicklink.json",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios
    .request(config)
    .then(async (response) => {
      if (response.data.QuickLinkResponse.Code == 200) {
        let details = {
          sentPayload: data,
          response: JSON.stringify(response.data),
          credentialId: req.user.id,
          invoiceId: req.body.invoiceId,
        };
        await createPaymentLink(details);
        return res.status(201).json({
          status: true,
          message: "Link Generated Successfully",
          data: {
            link: response.data.QuickLinkResponse.URL,
            ...req.body,
            dateCreated: new Date(),
            expiry: new Date(),
          },
          responseCode: "000",
        });
      } else {
        return res.status(400).json({
          status: false,
          message: "Something went wrong",
          data: response.data,
          responseCode: "001",
        });
      }
    })
    .catch((error) => {
      console.log("Error from Create Link: ", error);
      return next(
        new ErrorResponse("Something went wrong while creating link", 500)
      );
    });
});

exports.send = asyncHandler(async (req, res) => {
  let type = req.body.type;
  let requestData = req.body.requestData;
  let amount = req.body.amount;
  let link = req.body.link;
  let companyName = req.user.name
  if (type == "EMAIL") {
    const to = requestData; // Set recipient email address
    const subject = "Payment Link"; // Set email subject
    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    const body = generatePaymentLinkTemplate({amount, link, companyName},partnerDetails);
    // Call email function to send email with payment details in the body
    emailer.email(to, subject, body, function () { });
    return res.status(200).json({
      status: true,
      message: "Email sent successfully",
      data: {},
      responseCode: "000",
    });
  } else {
    sms.sendSMS(
      requestData,
      `Dear User, Please use the below link to make the payment of ₹ ${amount}. Link: ${link}`
    );
    return res.status(200).json({
      status: true,
      message: "SMS sent successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.findAllLinksAndCount = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate;
  const to = req.query.toDate;
  const corporateId =
    parseInt(req.params.corporateId) || parseInt(req.query.corporateId);
  const start = parseInt(req.query.start);
  const details = req.query.details || false;
  const length = parseInt(req.query.length);
  const draw = parseInt(req.query.draw);
  // let searchText = req.query.search.value
  let order = req.query.orderCol,
    column = "createdAt"; //req.query.column
  let params = {
    corporateId,
    from,
    to,
    start,
    length,
    draw,
    // searchText,
    order,
    details,
    column,
  };
  const quickLinksData = await findAllPaymentLinks(params);
  if (!quickLinksData) {
    return next(
      new ErrorResponse(
        `Something went wrong while fetching payment links from the database`,
        200
      )
    );
  } else {
    return res.status(200).json({
      status: true,
      draw: draw,
      recordsTotal: quickLinksData.count,
      recordsFiltered: quickLinksData.count,
      data: quickLinksData.rows,
      message: "Fetched all links successfully",
    });
  }
});

exports.createLinkWithInvoiceId = asyncHandler(async (req, res, next) => {
  let invoiceId = req.body.invoiceId;
  let invoiceDetails = await findOneInvoice({ id: invoiceId, credentialId: req.user.id });
  if (!invoiceDetails) {
    return next(new ErrorResponse("Invoice details not found", 404));
  }
  let paymentMode = invoiceDetails.paymentMode;
 
  if (paymentMode === "payment link") {
    // const credentialId = req.user.id //will come from userObject
    // const packageId = req.user.packageId //will come from userObject
    // const corporateUserId = req.user.corporateId
    // const serviceDetails = await fetchServiceDetails({
    //     credentialId,
    //     accessKey,
    //     serviceType,
    //     packageId,
    //     corporateUserId
    // })
    // if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    //     return next(new ErrorResponse(serviceDetails['error'], 500))
    // }
    // let data = JSON.stringify({
    //     "QuickLinkRequest": {
    //         "StoreID": "28165",
    //         "AuthKey": "REDACTED",
    //         "Details": {
    //             "Desc": 'Invoicing',
    //             "Cart": req.user.id,
    //             "Currency": "INR",
    //             "Amount": amountDue,
    //             "MinQuantity": "1",
    //             "MaxQuantity": "1",
    //             "FullName": customerName,
    //             "Addr1": "SXR",
    //             "City": "SRINAGAR",
    //             "Country": "IN",
    //             "Email": customerEmail,
    //             "Phone": customerPhone,
    //         },
    //         "VariableValueMode": {
    //             "Status": "",
    //             "SectionTitle": ""
    //         },
    //         "RepeatBilling": {
    //             "Status": "",
    //             "Amount": "",
    //             "Period": "",
    //             "Interval": "",
    //             "Start": "",
    //             "Term": "",
    //             "Final": ""
    //         },
    //         "Availability": {
    //             "NotValidBefore": {
    //                 "Day": "",
    //                 "Month": "",
    //                 "Year": ""
    //             },
    //             "NotValidAfter": {
    //                 "Day": "",
    //                 "Month": "",
    //                 "Year": ""
    //             },
    //             "StockControl": "1",
    //             "StockCount": "5"
    //         }
    //     }
    // });

    // let config = {
    //     method: 'post',
    //     maxBodyLength: Infinity,
    //     url: 'https://secure.telr.com/gateway/api_quicklink.json',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     data: data
    // };

    // axios.request(config)
    //     .then(async (response) => {
    //         if (response.data.QuickLinkResponse.Code == 200) {
    //             let details = {
    //                 sentPayload: data,
    //                 response: JSON.stringify(response.data),
    //                 credentialId: req.user.id,
    //                 invoiceId
    //             }
    //             let link = response.data.QuickLinkResponse.URL
    //             await createPaymentLink(details)
    //             await updateInvoice({id:invoiceId}, {paymentLink:link})
    //             return res.status(201).json({
    //                 status: true,
    //                 message: 'Link Generated Successfully',
    //                 data: {
    //                     link: response.data.QuickLinkResponse.URL,
    //                     ...req.body, dateCreated: new Date(), expiry: new Date()
    //                 },
    //                 'responseCode' : '000'
    //             });
    //         } else {
    //             return res.status(400).json({
    //                 status: false,
    //                 message: 'Something went wrong',
    //                 data: response.data,
    //                 'responseCode' : '001'
    //             });
    //         }
    //     })
    //     .catch((error) => {
    //         console.log("Error from Create Link: ",error);
    //         return next(new ErrorResponse("Something went wrong while creating link", 500))
    //     });

    return res.status(201).json({
      status: true,
      message: "Link Generated Successfully",
      data: {
        link: "sample_link",
        ...req.body,
        dateCreated: new Date(),
        expiry: new Date(),
      },
      responseCode: "000",
    });
  } else {
    return res.status(200).json({
      status: true,
      message: "Guideline added successfully.",
      data: {},
      responseCode: "000",
    });
  }
});
