const express = require("express");
const { verifyToken, requireSystemUser } = require("../../../../utils/jwtToken");


const router = express.Router({mergeParams:true});

router.use(verifyToken)
router.use(requireSystemUser)

router.use("/peko-connect", require("./peko_connect"));
router.use("/workspaces",require("./workspace"));
router.use("/edocs", require("./edocs"))
router.use("/plans", require("./plans"))
router.use("/paytmBpos", require("./paytmBpos"));
router.use("/works", require("./works"))
router.use("/worksReport", require("./worksReport"))
router.use("/work_plan", require("./work_plan"))
router.use("/invoice-templete", require("./invoiceTemplete"))
router.use("/email-templates", require("./emailTemplates"))
router.use("/email-layouts", require("./emailLayouts"))
router.use("/email-template-services", require("./emailTemplateServices"))
router.use("/email-template-keys", require("./emailTemplateKeys"))
router.use("/invoice-kyb", require("./invoiceKyb"));

router.use("/attestation", require("./attestation"))
router.use("/ip-whitelist", require("./ip_whitelist"));
router.use("/whatsapp-business", require("./whatsAppForBusiness"))
router.use("/corporate-tax-registration", require("./corporateTaxRegistration"));
router.use("/collector-kyb", require("./collectorKyb"));
router.use("/payrolldocs", require("./payrollDocs"))
router.use("/verification", require("./verificationSuite"));
router.use("/domain-hosting-plans", require("./domainHostingPlans"));
router.use("/car-report-plans", require("./carReportPlans"));
router.use("/domain-and-hosting-orders", require("./domainAndHosting"));
router.use("/company-incorporation", require("./companyIncorporation"));
router.use("/compliance", require("./compliance"));
router.use("/global-business-setup", require("./globalBusinessSetup"));
router.use("/business-registration-catalog", require("./businessRegistrationCatalog"));
router.use("/business-registration", require("./businessRegistration"));
router.use("/legal-templates", require("./legalTemplates"));
router.use("/insurance-quote-requests", require("./garageQuoteRequest"));
router.use("/global-business-setup", require("./globalBusinessSetup"));

module.exports = router