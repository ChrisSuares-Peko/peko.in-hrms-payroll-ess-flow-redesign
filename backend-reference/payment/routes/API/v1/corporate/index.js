const { verifyToken } = require("../../../../utils/jwtToken");
const express = require('express')
const router = express.Router({mergeParams:true});
const { commonBillHandler } = require("../../../../controllers/corporate/commonBillHandler");
const operatorsData = require("../../../../utils/operatorsData.json");
const { enforceOwnCorporate } = require("../../../../utils/enforceOwnCorporate");

router.use(verifyToken)

// for all bulk payments
router.use("/bulk-payment", require("./bulkPayment"));

// prepaid has its own dedicated routes (login, plans, balance, validate etc.)
router.use("/prepaid", require("./telecomePayments/prepaid"));

// Bill payment routes — path to operatorsData key mapping
const BILL_PAYMENT_ROUTES = [
  // telecom
  ['/postpaid',           'postpaid'],
  ['/test',               'otme'],
  // utility
  ['/electricity',        'electricity'],
  ['/lpg',                'lpg'],
  ['/water',              'water'],
  ['/broadband',          'broadband'],
  ['/landline',           'landline'],
  ['/education',          'education'],
  ['/piped-gas',          'pipedGas'],
  ['/cable',              'cable'],
  ['/dth',                'dth'],
  ['/fastag',             'fastag'],
  // financial services
  ['/credit-card',        'creditCard'],
  ['/deposite',           'deposite'],
  ['/donation',           'donations'],
  ['/loan-repayment',     'loanRepayment'],
  ['/municipal-services', 'municipalServices'],
  ['/municipal-taxes',    'municipalTaxes'],
  ['/rental',             'rental'],
  // insurance
  ['/bike',               'bike'],
  ['/car',                'car'],
  ['/insurance',          'health'],
  ['/life',               'life'],
  // other services
  ['/clubs',              'clubs'],
  ['/hospital',           'hospitals'],
  ['/housing-society',    'housingSociety'],
  ['/ncmc',               'ncmc'],
  ['/nps',                'nps'],
  ['/prepaid-meter',      'prepaidMeter'],
  ['/subscription',       'bbps_subscriptions'],
];

BILL_PAYMENT_ROUTES.forEach(([path, key]) => {
  const { accessKey, category, type } = operatorsData[key];
  const handler = commonBillHandler(accessKey, category, type);
  const r = express.Router();
  r.post('/fetchBill', handler.handleFetch);
  r.post('/billValidation', handler.handleBillValidation);
  r.post('/payment', handler.payment);
  router.use(path, r);
});
router.use('/payment-links', require('./financialServices/paymentLinks'));
router.use('/bbps', require('./bbps'))
router.use('/challan', require('./challan'))
// Car Reports moved to the officeAndBusiness service, under garage/car-report — that
// service already owned the catalog and valuation lookups, so the whole feature lives
// there now. Same shared DB, so the carReportOrders table is unchanged.

// payout
router.use('/payout', enforceOwnCorporate, require('./payout'));

// nupay merchant onboarding
router.use('/nupay', enforceOwnCorporate, require('./nupayOnboarding'));

// bank accounts
router.use('/bank-account', require('./bankAccount'));

module.exports = router