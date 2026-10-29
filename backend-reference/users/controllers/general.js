const asyncHandler = require("../middlewares/async");
const {
  companyActivity,
  companySize,
  addressType,
  months,
  years,
  paymentMode,
  typeOfBill,
  disputeReasons,
  issueTypes,
  supportModules,
  circleList,
  deviceType,
  kycType,
  reportCategory,
  indianStates,
  gstStates,
  connectCategory,
  serviceType,
  reportSubscription,
  AttestationCountryData,
  bankAccountType
} = require("../public/data");
const countryCodes = require("../public/countryCode.json");
const phoneCodes = require("../public/Phone-code.json");
const countries = require("../public/countries.json");
const ErrorResponse = require("../utils/error-response");
const { findCitiesByCountry } = require("../models/use-cases/cities");
const faq = require("../public/FAQ.json");

exports.companyActivity = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Company activity options retrieved successfully.",
    data: { companyActivity },
    responseCode: "000",
  });
});

exports.fetchKycType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "KYC type retrieved successfully.",
    data: { kycType },
    responseCode: "000",
  });
});

exports.companySize = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Company size options retrieved successfully.",
    data: { companySize },
    responseCode: "000",
  });
});

exports.addressType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Address type options retrieved successfully.",
    data: { addressType },
    responseCode: "000",
  });
});

exports.fetchCountries = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Countires retrieved successfully.",
    data: { countries },
    responseCode: "000",
  });
});

exports.fetchbannerDeviceType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Device type retrieved successfully.",
    data: { deviceType },
    responseCode: "000",
  });
});

exports.fetchCityByCountry = asyncHandler(async (req, res, next) => {
  let searchText = req.query.q;
  const country = req.params.country;
  let data = await findCitiesByCountry(country, searchText);
  if (!data) {
    return next(new ErrorResponse(`City not found`, 404));
  } else {
    return res.status(200).json({
      status: true,
      data: { data },
      message: "Fetched cities successful",
      responseCode: "000",
    });
  }
});

exports.fetchDashboardOptions = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Options retrieved successfully.",
    data: { months, years, paymentMode },
    responseCode: "000",
  });
});

exports.fetchStates = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "States retrieved successfully.",
    data: { states: circleList },
    responseCode: "000",
  });
});

exports.fetchIndianStates = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "States retrieved successfully.",
    data: { states: indianStates },
    responseCode: "000",
  });
});

exports.fetchGstStates = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "GST states retrieved successfully.",
    data: { states: gstStates },
    responseCode: "000",
  });
});

exports.fetchAccountType = asyncHandler(async (req, res) => { 
  res.status(200).json({
     status: true,
     message: 'Account type retrieved successfully.',
     data: { accountType:bankAccountType },
     responseCode: '000'
 });
})

exports.fetchReportCategory = asyncHandler(async (req, res) => { 
  res.status(200).json({
     status: true,
     message: 'Categories retrieved successfully.',
     data: {category:reportCategory},
     responseCode: '000'

 });
})

exports.fetchTypeOfBill = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Type of bills retrieved successfully.",
    data: { typeOfBill },
    responseCode: "000",
  });
});

exports.fetchDisputeType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Type of dispute retrieved successfully.",
    data: { disputeReasons },
    responseCode: "000",
  });
});

exports.fetchIssueType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Type of issues retrieved successfully.",
    data: { issueTypes },
    responseCode: "000",
  });
});

exports.fetchModules = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Modules retrieved successfully.",
    data: { modules: supportModules },
    responseCode: "000",
  });
});

exports.fetchAllFaq = asyncHandler(async (req, res) => {
  const {category} = req.query;
  
  res.status(200).json({
     status: true,
     message: 'FAQ retrieved successfully.',
     data: faq[category] || [],
     responseCode: '000'
 });
})

exports.fetchCountryCodes = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Country codes retrieved successfully.",
    data: { countryCodes },
    responseCode: "000",
  });
});

exports.fetchPhoneCodes = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Phone codes retrieved successfully.",
    data: { phoneCodes },
    responseCode: "000",
  });
});

exports.fetchConnectCategoryType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Categories retrieved successfully.",
    data: { connectCategory },
    responseCode: "000",
  });
});

exports.fetchServiceType = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: true,
    message: "Service type retrieved successfully.",
    data: { serviceType },
    responseCode: "000",
  });
});

exports.fetchReportSubscription = asyncHandler(async (req, res) => { 
  res.status(200).json({
     status: true,
     message: 'Subscription retrieved successfully.',
     data: {subscription:reportSubscription},
     responseCode: '000'

 });
})
exports.fetchCountriesForAttestation = asyncHandler(async (req, res) => {
  const query = req.query.searchText;
  if (query) {
    const filteredCountries = AttestationCountryData.filter((country) =>
      country.label.toLowerCase().includes(query.toLowerCase())
    );
    res.send({
      status: true,
      data: { data: filteredCountries },
      message: "Countries fetched successfully",
      responseCode: "000",
    });
  } else {
    res.send({
      status: true,
      data: { data: AttestationCountryData },
      message: "Countries fetched successfully",
      responseCode: "000",
    });
  }
});