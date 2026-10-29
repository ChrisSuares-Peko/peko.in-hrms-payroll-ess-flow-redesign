const ANNUALLY = 'ANNUALLY';
const MONTHLY = 'MONTHLY';

const journalBillingType = (value) =>
  String(value || '').trim().toUpperCase() === ANNUALLY ? ANNUALLY : MONTHLY;

const billingCycleLabel = (value) => (journalBillingType(value) === ANNUALLY ? 'Annually' : 'Monthly');

const ecommerceStoreInvoiceDescription = (packageName, value) =>
  `${packageName ? `Peko Commerce - ${packageName}` : 'Peko Commerce'} (${billingCycleLabel(value)})`;

module.exports = { ANNUALLY, MONTHLY, journalBillingType, billingCycleLabel, ecommerceStoreInvoiceDescription };
