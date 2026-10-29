const express = require("express");
const router = express.Router();

const {
  companyActivity,
  companySize,
  addressType,
  fetchCountries,
  fetchCityByCountry,
  fetchStates,
  fetchDashboardOptions,
  fetchReportCategory,
  fetchTypeOfBill,
  fetchDisputeType,
  fetchIssueType,
  fetchModules,
  fetchAllFaq,
  fetchCountryCodes,
  fetchPhoneCodes,
  fetchbannerDeviceType,
  fetchKycType,
  fetchIndianStates,
  fetchGstStates,
  fetchConnectCategoryType,
  fetchServiceType,
  fetchReportSubscription,
  fetchCountriesForAttestation,
  fetchAccountType
} = require("../../../controllers/general");

router.get("/companyActivity", companyActivity);
router.get("/companySize", companySize);
router.get("/addressType", addressType);
router.get("/countries", fetchCountries);
router.get("/states", fetchStates);
router.get("/cities/:country", fetchCityByCountry);
router.get("/dashboard/chartOptions", fetchDashboardOptions);
router.get("/indian-states", fetchIndianStates);
router.get("/gst-states", fetchGstStates);
router.get("/report/categories", fetchReportCategory);
router.get('/report/subscription', fetchReportSubscription)
router.get("/support/typeOfBills", fetchTypeOfBill);
router.get("/support/disputeType", fetchDisputeType);
router.get("/support/issueType", fetchIssueType);
router.get("/support/modules", fetchModules);
router.get("/support/faq", fetchAllFaq);
router.get('/bank/accountType', fetchAccountType)
router.get("/banner/deviceTypes", fetchbannerDeviceType);
router.get("/corporateUser/kycStatus", fetchKycType);
router.get("/pekoConnect/category", fetchConnectCategoryType);
router.get("/serviceOperators/serviceType", fetchServiceType);
router.get("/country-codes", fetchCountryCodes);
router.get("/phone-codes", fetchPhoneCodes);
router.get('/attestation/countries',fetchCountriesForAttestation)

module.exports = router;
