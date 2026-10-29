const express = require('express')
const router = express.Router()
const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
const {
  FetchAllPlans,
  AddCompanyInfo,
  AddShareholders,
  FetchSingleApplications,
  getDocument,
  FetchAllActivities,
  getVendorCountries,
  getVendorProviders,
  getVendorForms,
  getAllVendorApplications,
  getOngoingVendorApplications,
  getRenewalApplications,
  getRenewalApplicationById,
  getVendorApplicationDetails,
  getDraftVendorApplications,
  getProviderDetails,
  submitCompanyApplication,
  checkWalletBalanceAndSendOtp,
  getFormById,
  deleteVendorApplication,
  checkGlobalBusinessSetupStatus,
  getVendorFormTableById,
  getPlanPricing,
  searchRenewalCompanies,
  getRenewalFormConfig,
  createRenewalRequest,
  requestRenewalRevision,
  getFileDownloadUrl,
  sendConsentRequest,
  sendConsentDocusign,
  refreshConsentStatus,
  downloadConsentDocument,
} = require('../../../../controllers/corporate/globalBusinessSetup');
const { FetchCombinedGlobalBusinessSetupTransactions } = require('../../../../controllers/admin/globalBusinessSetup');
const upload = require('../../../../middlewares/multer');

router.use(verifyUser('Global Business Setup'));
router.get('/', FetchAllPlans)
router.get("/transactions", FetchCombinedGlobalBusinessSetupTransactions);
router.get("/transactionById", FetchSingleApplications);

router.post("/companyInfo", AddCompanyInfo);
router.post("/shareHolders", AddShareholders);
router.get('/document', getDocument)
router.get('/getAllActivities', FetchAllActivities)

// Global Business Setup - Base93
router.get('/countries', getVendorCountries)
router.get('/providers', getVendorProviders)
router.get('/providers/:providerId', getProviderDetails)
router.get('/forms', getVendorForms)
router.get('/forms/table/:tableId', getVendorFormTableById)
router.get('/forms/:id', getFormById)
router.get('/files/:fileId/download-url', getFileDownloadUrl)
router.get("/applications/drafts", getDraftVendorApplications);
router.get("/applications/ongoing", getOngoingVendorApplications);
router.get("/renewals/companies/search", searchRenewalCompanies);
router.get("/renewals/form-config", getRenewalFormConfig);
router.get("/renewals", getRenewalApplications);
router.post("/renewals", upload.any(), createRenewalRequest);
router.get("/renewals/:id", getRenewalApplicationById);
router.post("/renewals/:id/request-revision", requestRenewalRevision);
router.post("/applications/:id/consent/send", sendConsentRequest)
router.post("/applications/:id/consent/docusign", sendConsentDocusign)
router.get("/applications/:id/consent/refresh", refreshConsentStatus)
router.get("/applications/:id/consent/document/:kind", downloadConsentDocument)
router.get("/applications/:id", getVendorApplicationDetails)
router.delete("/applications/:id", deleteVendorApplication)
router.get("/applications", getAllVendorApplications);
router.get("/status", checkGlobalBusinessSetupStatus);
router.get("/pricing", getPlanPricing);
router.post(
  "/application",
  upload.any(),
  submitCompanyApplication
);
router.post(
  "/check-balance",
  checkWalletBalanceAndSendOtp
);

module.exports = router
