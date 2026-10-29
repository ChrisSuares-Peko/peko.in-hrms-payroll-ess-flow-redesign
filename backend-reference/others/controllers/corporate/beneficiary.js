/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
const {
  createBeneficiary,
  findAllBeneficiary,
  updateBeneficiary,
  Delete,
  fetchBeneficiaries,
  fetchRecentBeneficiaries,
  fetchLastBeneficiaries,
} = require("../../models/use-cases/beneficiary");
const ErrorResponse = require("./../../utils/error-response");
const asyncHandler = require("./../../middlewares/async");
const { createOtp } = require("../../models/use-cases/otp");
// const { commonEmailOtpVerification } = require("../../utils/emailTemplate/profile");
const emailer = require("../../utils/emailer");
const operatorsData = require("../../utils/operatorsData.json");
const beneficiary = require("../../models/entities/beneficiary");
const { Op } = require("sequelize");
const { beneficiaryOTPTemplate } = require("../../utils/emailTemplate/beneficiary");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables, buildOtpBoxesHtml, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");

exports.createBeneficiary = asyncHandler(async (req, res, next) => {
  let data = req.body;
  data.credentialId = req.user.id;
  // let response;
  // if (data.scope === "email") {
  //   response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: "email" });
  // }
  // if (response.isVerified === false) {
  //   return res.status(401).json({
  //     status: false, message: response.message, data: {}, "responseCode": "001"
  //   });
  // }

  let result = await createBeneficiary(data);
  if (!result) {
    return next(new ErrorResponse("Something went wrong while creating beneficiary", 500));
  }
  if (result.hasOwnProperty("error")) {
    return next(new ErrorResponse(result["error"], 500));
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: "Beneficiary added successfully",
      responseCode: "000",
    });
  }
});

exports.findAllBeneficiary = asyncHandler(async (req, res, next) => {
  const start = parseInt(req.query.start);
  const length = parseInt(req.query.length);
  const draw = parseInt(req.query.draw);
  let searchText = req.query.search.value;
  let order = req.query.orderCol,
    column = req.query.column,
    status = req.query.beneficiaryStatus;
  // never trust the query for identity — this is the corporate's own session
  const credentialId = req.user.id;
  let params = {
    start,
    length,
    draw,
    searchText,
    order,
    column,
    status,
    credentialId,
  };
  const beneficiaryData = await findAllBeneficiary(params);
  if (!beneficiaryData) {
    return next(new ErrorResponse(`Something went wrong while getting all beneficiaries from DB`, 200));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        draw: draw,
        recordsTotal: beneficiaryData ? beneficiaryData.count : 0,
        recordsFiltered: beneficiaryData ? beneficiaryData.count : 0,
        data: beneficiaryData ? beneficiaryData.rows : 0,
      },
      message: "fetched all beneficiary successfully",
      responseCode: "000",
    });
  }
});

exports.updateBeneficiary = asyncHandler(async (req, res, next) => {
  let params = { ...req.params, credentialId: req.user.id };
  let data = req.body;
  // let response;
  // if (data.scope === "email") {
  //   response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: "email" });
  // }
  // if (data.scope === "email") {
  //   if (response.isVerified === false) {
  //     return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
  //   }
  // }

  let updatedDetails = await updateBeneficiary(params, data);
  if (!updatedDetails) {
    return next(new ErrorResponse("Something went wrong while updating beneficiary", 500));
  }
  if (updatedDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse(updatedDetails["error"], 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Beneficiary updated successfully",
      data: [],
      responseCode: "000",
    });
  }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let params = { ...req.params, credentialId: req.user.id };
  let data = req.body;
  let result = await updateBeneficiary(params, data);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating status`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "status updated successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.fetchBeneficiary = asyncHandler(async (req, res, next) => {
  let requestBody = req.query;
  const credentialId = req.user.id;
  let data = await fetchBeneficiaries(requestBody, credentialId);
  if (!data) {
    return next(new ErrorResponse("Something went wrong while fetching beneficiaries", 500));
  }
  if (data.hasOwnProperty("error")) {
    return next(new ErrorResponse(data["error"], 500));
  } else {
    return res.status(200).json({
      status: true,
      data: { beneficiaries: data },
      message: "Fetched beneficiary successfully",
      responseCode: "000",
    });
  }
});

exports.deleteBeneficiary = asyncHandler(async (req, res, next) => {
  let params = { ...req.params, credentialId: req.user.id };
  // let data = req.query;
  // let response;
  // if (data.scope === "email") {
  //   response = await verifyOtp({ contact: req.user.email, otp: data.otp, context: "email" });
  // }
  // if (data.scope === "email") {
  //   if (response.isVerified === false) {
  //     return res.status(401).json({ status: false, message: response.message, data: {}, responseCode: "001" });
  //   }
  // }
  const result = await Delete(params);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while deleting the beneficiary`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Beneficiary deleted successfully",
      data: {},
      responseCode: "000",
    });
  }
});

exports.getOtp = asyncHandler(async (req, res) => {
  let credentialId;
  let email;

  if (req?.user?.role == "CORPORATE_SUB_USER") {
    credentialId = req?.user?.subCorporateCredential;
    email = req.user.subCorporateEmail;
  } else {
    credentialId = req?.user?.id;
    email = req.user.email;
  }
  
  const username = req.user.name;
  let { scope, type, billerId, accessKey, customerParams } = req.body;
  let otp, subject, action;

  async function checkIsBeneficiaryExist(accessKey, billerId, type, beneficiaryId) {
    const whereClause = {
      accessKey,
      credentialId: req.params.corporateId,
    };

    if (type === "EDIT") {
      whereClause.id = { [Op.not]: beneficiaryId };
    }

    return await beneficiary.findOne({ where: whereClause });
  }

  function areCustomerParamsEqual(params1 = [], params2 = []) {
    if (!params1.length || !params2.length) return false; // Ensures both exist

    params1.sort((a, b) => (a.name > b.name ? 1 : -1));
    params2.sort((a, b) => (a.name > b.name ? 1 : -1));

    return params1.every((p, i) => p.name === params2[i].name && p.value === params2[i].value);
  }

  if (type === "ADD") {
    subject = "OTP for adding a beneficiary";
    action = "add";

    if (billerId) {
      const isExists = await checkIsBeneficiaryExist(accessKey, billerId, type);
      if (isExists && accessKey !== operatorsData.prepaid.accessKey && areCustomerParamsEqual(customerParams, isExists.customerParams)) {
        return res.status(409).json({
          status: false,
          message: "This beneficiary is already added. Please add another beneficiary.",
          data: {},
          responseCode: "001",
        });
      }
    }
  } else if (type === "EDIT") {
    subject = "OTP for updating a beneficiary";
    action = "update";
    const { beneficiaryId } = req.body;
    const isExists = await checkIsBeneficiaryExist(accessKey, billerId, type, beneficiaryId);

    if (isExists && accessKey !== operatorsData.prepaid.accessKey && areCustomerParamsEqual(customerParams, isExists.customerParams)) {
      return res.status(409).json({
        status: false,
        message: "This beneficiary is already added. Please add another beneficiary.",
        data: {},
        responseCode: "001",
      });
    }
  } else if (type === "DELETE") {
    subject = "OTP for deleting a beneficiary";
    action = "delete";
  } else {
    return res.status(400).json({
      status: false,
      message: "Specify Request Type.",
      data: {},
      responseCode: "001",
    });
  }

  if (scope === "email") {
    otp = await createOtp({ contact: req.user.email });

    if (!otp) {
      return res.status(500).json({
        status: false,
        message: "Failed to create OTP.",
        data: {},
        responseCode: "001",
      });
    }

    const templateDetails = await fetchPartnerDetails(req.user.registeredBy);

    const resolved = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.BENEFICIARY_OTP,
      service: EMAIL_TEMPLATE_SERVICES.BENEFICIARY,
      partnerId: req.user.registeredBy || null,
      variables: {
        username,
        action,
        otpBoxesHtml: buildOtpBoxesHtml(otp),
        branding: templateDetails?.branding || 'Peko',
        ...v2LayoutVariables({
          website: templateDetails?.baseUrl || 'https://in.peko.one',
          logo: templateDetails?.logo,
          branding: templateDetails?.branding || 'Peko',
          socials: PEKO_SOCIAL_LINKS,
        }),
      },
      fallbackSubject: subject,
      fallback: () => beneficiaryOTPTemplate(username, otp, action, templateDetails),
      logTraceId: req?.LogTraceId,
    });
    await emailer.email(req.user.email, resolved.subject, resolved.html);
  }

  console.log("-------------------------");
  console.log("EMAIL OTP:", otp);
  console.log("-------------------------");
  //ADD OTP RESPONSE
  return res.status(200).json({
    status: true,
    message: "OTP sent successfully via email.",
    data: process.env.NODE_ENV !== "production" ? { otp } : {},
    responseCode: "000",
  });
});

exports.fetchBeneficiaryTelecom = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  let category = "Telecom Payments";
  let includedAccessKeys = getAccessKeysByCategory(operatorsData, category);

  let data = await fetchRecentBeneficiaries(credentialId, includedAccessKeys);
  if (!data) {
    return next(new ErrorResponse("Something went wrong while fetching beneficiaries", 500));
  }
  if (data.hasOwnProperty("error")) {
    return next(new ErrorResponse(data["error"], 500));
  } else {
    return res.status(200).json({
      status: true,
      data: { beneficiaries: data },
      message: "Fetched beneficiary successfully",
      responseCode: "000",
    });
  }
});

exports.fetchBeneficiaryUtility = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  let category = "Utility Payments";
  let includedAccessKeys = getAccessKeysByCategory(operatorsData, category);

  let data = await fetchRecentBeneficiaries(credentialId, includedAccessKeys);
  if (!data) {
    return next(new ErrorResponse("Something went wrong while fetching beneficiaries", 500));
  }
  if (data.hasOwnProperty("error")) {
    return next(new ErrorResponse(data["error"], 500));
  } else {
    return res.status(200).json({
      status: true,
      data: { beneficiaries: data },
      message: "Fetched beneficiary successfully",
      responseCode: "000",
    });
  }
});

function getAccessKeysByCategory(data, category) {
  const accessKeys = [];

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const entry = data[key];

      if (entry.category === category) {
        accessKeys.push(entry.accessKey);
      }
    }
  }

  return accessKeys;
}

exports.FetchLastBeneficiaries = asyncHandler(async (req, res, next) => {
  let credentialId = req.params.corporateId;
  let data = await fetchLastBeneficiaries(credentialId);
  if (!data) {
    return next(new ErrorResponse("Something went wrong while fetching beneficiaries", 500));
  }
  if (Object.prototype.hasOwnProperty.call(data, "error")) {
    return next(new ErrorResponse(data["error"], 400));
  } else {
    return res.status(200).json({
      status: true,
      data: { data },
      message: "fetched Last five beneficiares successfully",
      responseCode: "000",
    });
  }
});
