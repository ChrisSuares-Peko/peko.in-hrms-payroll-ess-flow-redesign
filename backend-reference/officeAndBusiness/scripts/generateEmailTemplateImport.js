'use strict';
// Generates the bulk-import JSON for the admin panel (Settings → Email Templates → Import)
// from the officeAndBusiness fallback templates, so every OAB key starts with a
// ready-to-edit admin template that renders exactly like the code fallback.
//
// How: each resolve* wrapper is called with sentinel inputs; the resolver is stubbed to
// capture `variables` + the fallback HTML; every variable value is then replaced by its
// ${placeholder} (longest values first) and the result is round-trip verified.
//
// Usage (from officeAndBusiness root):  node scripts/generateEmailTemplateImport.js [outFile]
// Then upload the JSON in the admin panel; templates arrive as DRAFT — review, publish.

const path = require('path');
const fs = require('fs');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const outFile = process.argv[2] || path.join(__dirname, 'emailTemplatesImport.json');
const FIXED_DATE = '08/09/2026, 10:30 AM';

let captured = null;
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (/emailTemplateResolver$/.test(request)) {
    return {
      resolveEmailTemplate: async (opts) => {
        captured = { key: opts.key, service: opts.service, variables: opts.variables || {}, subject: opts.fallbackSubject, html: opts.fallback() };
        return { subject: opts.fallbackSubject, html: captured.html, source: 'FALLBACK' };
      },
    };
  }
  if (/loggerHelper$|\/logger$/.test(request)) return { customLog() {}, logger: { info() {}, error() {}, warn() {} } };
  if (/\/formatter$/.test(request)) {
    const real = origLoad.call(this, request, parent, isMain);
    return { ...real, formatIndiaEmailDateTime: () => FIXED_DATE };
  }
  return origLoad.call(this, request, parent, isMain);
};

const T = (f) => require(path.join(root, 'utils/emailTemplates', f));
const common = T('common.js');
const works = T('works.js');
const workspace = T('workspace.js');
const wa = T('whatsappForBusiness.js');
const connect = T('peko_connect.js');
const bizReg = T('businessRegistration.js');
const esign = require(path.join(root, 'utils/eSignCompletedTemplate.js'));
const carbon = T('carbonFootprint.js');
const dh = T('domainAndHosting.js');
const compliance = T('compliance.js');
const gbs = T('globalBusinessSetup.js');
const invV2 = T('invoicingV2.js');
const quotation = T('documentEmailTemplate.js');
const receipt = T('paymentReceiptTemplate.js');
const invoice = T('invoice.js');
const kyb = T('KYBTemplate.js');
const { EMAIL_TEMPLATE_KEYS: K, EMAIL_TEMPLATE_SERVICES: S } = require(path.join(root, 'utils/emailTemplateKeys.js'));

// Sentinel partner — every value distinctive so it can be swapped for a placeholder.
const P = {
  branding: 'PARTNERBRANDX',
  website: 'https://partner-site.example',
  baseUrl: 'https://partner-site.example',
  logo: 'https://cdn.example/partner-logo.png',
  socials: { twitter: 'https://x.com/partnerx', instagram: 'https://instagram.com/partnerx', linkedIn: 'https://linkedin.com/company/partnerx' },
};
const failed = (key, service, serviceName, fallbackSubject) => () =>
  common.resolvePaymentFailedEmail({ key, service, name: '@@NAME@@', serviceName, url: 'https://url.example/@@URL@@', partnerDetails: P, fallbackSubject });

// [key, human name, call]
const CASES = [
  // WORKS
  [K.WORKS_PURCHASE_SUCCESS, 'Works – Purchase successful', () => works.resolveWorksPurchaseEmail('@@NAME@@', 1234.5, { name: '@@PLAN@@', price: 999.25, work: { name: '@@WORK@@' } }, '@@TXN@@', P, { fallbackSubject: 'Your Works order has been successfully processed' })],
  [K.WORKS_PAYMENT_FAILED, 'Works – Payment failed', failed(K.WORKS_PAYMENT_FAILED, S.WORKS, '@@SERVICENAME@@')],
  // WORKSPACES
  [K.WORKSPACE_BOOKING_SUCCESS, 'Office Address – Booking successful', () => workspace.resolveWorkspaceBookingSuccessEmail('@@NAME@@', '@@TXN@@', 2345.67, { planDetails: { name: '@@PLAN@@', price: 111.5, description: '@@PLANDESC@@', duration: 'MONTHLY' }, bookingDetails: { workspaceName: '@@WSNAME@@', price: 222.5, address: '@@WSADDRESS@@' } }, P)],
  [K.WORKSPACE_RENEWAL_REMINDER, 'Office Address – Renewal reminder', () => workspace.resolveWorkspaceReminderEmail('https://url.example/@@URL@@', '2027-03-15', '@@NAME@@', P)],
  [K.WORKSPACE_PAYMENT_FAILED, 'Office Address – Transaction failed', failed(K.WORKSPACE_PAYMENT_FAILED, S.WORKSPACES, '@@SERVICENAME@@', 'Transaction Failed')],
  // WHATSAPP
  [K.WHATSAPP_PAYMENT_SUCCESS, 'WhatsApp for Business – Payment successful', () => wa.resolveWhatsappForBusiness('@@NAME@@', '@@TXN@@', '@@SERVICENAME@@', 3456.78, 12.5, P)],
  [K.WHATSAPP_PAYMENT_FAILED, 'WhatsApp for Business – Payment failed', failed(K.WHATSAPP_PAYMENT_FAILED, S.WHATSAPP, '@@SERVICENAME@@')],
  [K.WABA_PROFILE_UPDATED, 'WhatsApp for Business – WABA profile updated', () => wa.resolveEmailForWabaUpdated('body', '@@NAME@@', '@@ACTIVATEDON@@', P)],
  [K.BOT_BUILDER_ADDON_ADMIN_NOTICE, 'WhatsApp for Business – Bot Builder add-on (admin notice)', () => wa.resolveEmailForBotActivated('@@CORPORATE@@')],
  [K.SHOPIFY_INTEGRATION_ADDON_ADMIN_NOTICE, 'WhatsApp for Business – Shopify Integration add-on (admin notice)', () => wa.resolveEmailForShopifyIntegrationActivated('@@CORPORATE@@')],
  // PEKO_CONNECT / BUSINESS_REGISTRATION / ESIGN
  [K.CONNECTION_REQUEST, 'Peko Connect – Connection request', () => connect.resolveConnectionRequestEmail('@@NAME@@', { name: '@@CORPORATE@@', mobile: '@@MOBILE@@', email: '@@EMAIL@@', requirement: '@@REQUIREMENT@@', message: '@@MESSAGE@@' }, P)],
  [K.BUSINESS_REGISTRATION_APPLICATION_SUBMITTED, 'Business Registration – Application submitted', () => bizReg.resolveApplicationSubmittedEmail('@@NAME@@', { applicationId: '@@APPID@@', entityLabel: '@@ENTITY@@', proposedName: '@@PROPOSED@@' }, P)],
  [K.ESIGN_COMPLETED, 'eSign – Document eSigned', () => esign.resolveESignCompletedEmail('@@DOCNAME@@', 'https://url.example/@@DOCURL@@', P)],
  // CARBON_FOOTPRINT
  [K.CARBON_CREDIT_PURCHASE_SUCCESS, 'Zero Carbon – Credit purchase successful', () => carbon.resolveCarbonCreditPurchaseEmail('@@NAME@@', '@@TXN@@', 4567.89, P)],
  [K.CARBON_FOOTPRINT_PAYMENT_FAILED, 'Zero Carbon – Payment failed', failed(K.CARBON_FOOTPRINT_PAYMENT_FAILED, S.CARBON_FOOTPRINT, '@@SERVICENAME@@', 'Payment Failed')],
  // DOMAIN_HOSTING
  [K.DOMAIN_HOSTING_PURCHASE_SUCCESS, 'Domain & Hosting – Purchase successful', () => dh.resolveDomainHostingSuccessEmail('@@NAME@@', '@@TXN@@', 5678.9, [{ itemType: 'DOMAIN', domainName: '@@DOMAIN1@@' }, { itemType: 'HOSTING', productName: '@@HOSTING1@@' }], P)],
  [K.DOMAIN_HOSTING_PAYMENT_FAILED, 'Domain & Hosting – Payment failed', failed(K.DOMAIN_HOSTING_PAYMENT_FAILED, S.DOMAIN_HOSTING, '@@SERVICENAME@@')],
  [K.DOMAIN_HOSTING_REFUND_INITIATED, 'Domain & Hosting – Refund initiated', () => dh.resolveDomainHostingRefundInitiatedEmail({ name: '@@NAME@@', amount: 6789, transactionId: '@@TXN@@', typeOfService: '@@SERVICETYPE@@', serviceProvider: '@@PROVIDER@@' }, P)],
  // COMPLIANCE
  [K.COMPLIANCE_APPLICATION_RECEIVED, 'Compliance – Application received', () => compliance.resolveComplianceApplicationCreatedEmail({ name: '@@NAME@@', complianceId: '@@CID@@', complianceType: '@@CTYPE@@', title: '@@TITLE@@', partnerDetails: P, fallbackSubject: 'Compliance Application Received - @@CTYPE@@' })],
  [K.COMPLIANCE_DOCUMENTS_SUBMITTED, 'Compliance – Documents submitted', () => compliance.resolveComplianceDocumentsSubmittedEmail({ name: '@@NAME@@', complianceId: '@@CID@@', complianceType: '@@CTYPE@@', title: '@@TITLE@@', partnerDetails: P, fallbackSubject: 'Compliance Documents Submitted - @@CTYPE@@' })],
  [K.COMPLIANCE_STATUS_UPDATE, 'Compliance – Status update', () => compliance.resolveComplianceStatusUpdateEmail({ name: '@@NAME@@', complianceId: '@@CID@@', complianceType: '@@CTYPE@@', title: '@@TITLE@@', status: 'reopened', remarks: '@@REMARKS@@', partnerDetails: P, fallbackSubject: 'Compliance Application Update - @@CTYPE@@' })],
  // GLOBAL_BUSINESS_SETUP
  [K.GBS_NAME_APPROVED, 'Global Business Setup – Company name approved', () => gbs.resolveGlobalBusinessSetupCompanyNameApproved({ name: '@@NAME@@', proposedName: '@@PROPOSED@@', partnerDetails: P })],
  [K.GBS_SHAREHOLDER_VERIFIED, 'Global Business Setup – Shareholder & UBO verified', () => gbs.resolveGlobalBusinessSetupShareholderAndUBODetailsVerified({ name: '@@NAME@@', partnerDetails: P })],
  [K.GBS_COMPLETED, 'Global Business Setup – Registration completed', () => gbs.resolveGlobalBusinessSetupCompanyRegistrationCompleted({ name: '@@NAME@@', partnerDetails: P, id: '@@APPID@@' })],
  [K.GBS_DELAYED, 'Global Business Setup – Application delayed', () => gbs.resolveGlobalBusinessSetupSetupDelayed({ name: '@@NAME@@', partnerDetails: P, id: '@@APPID@@' })],
  [K.GBS_REJECTED, 'Global Business Setup – Corrections needed', () => gbs.resolveGlobalBusinessSetupRejected({ name: '@@NAME@@', partnerDetails: P, id: '@@APPID@@' })],
  // INVOICING
  [K.INVOICE_GENERATED, 'Invoicing – Invoice sent', () => invV2.resolveInvoiceEmailTemplate({ customerName: '@@CUSTOMER@@', invoiceNumber: '@@INVNO@@', invoiceDate: '@@IDATE@@', dueDate: '@@DUEDATE@@', amountDue: '9,012.34', corporateName: '@@CORPORATE@@', corporateEmail: '@@CEMAIL@@', corporatePhone: '@@CPHONE@@', invoiceType: 'DOMESTIC', docLabel: '@@DOCLABEL@@' }, '@@DOCLABEL@@ from @@CORPORATE@@')],
  [K.QUOTATION_SHARE, 'Invoicing – Quotation sent', () => quotation.resolveQuotationEmailTemplate({ quotationNumber: '@@QNO@@', customerName: '@@CUSTOMER@@', totalAmount: 7890.12, currency: '₹', invoiceDate: '@@QDATE@@', dueDate: '@@VALIDUNTIL@@', companyName: '@@COMPANY@@', acceptUrl: 'https://url.example/@@ACCEPT@@', rejectUrl: 'https://url.example/@@REJECT@@' }, 'Quotation from @@COMPANY@@', null, null, P)],
  [K.PAYMENT_RECEIPT, 'Invoicing – Payment receipt', () => receipt.resolvePaymentReceiptEmailTemplate({ receiptNo: '@@RCPT@@', paymentDate: '@@PDATE@@', amount: '8,901.23', invoiceNumber: '@@INVNO@@', customerName: '@@CUSTOMER@@', billerName: '@@BILLER@@' }, 'Payment Receipt @@RCPT@@ from @@BILLER@@', null, null, P)],
  [K.RECURRING_SCHEDULE_CREATED, 'Invoicing – Recurring schedule created', () => invV2.resolveRecurringScheduleCreatedEmail({ startDate: '@@STARTDATE@@', frequency: '@@FREQUENCY@@', endCondition: { type: 'AFTER', runs: 7 } }, P, { fallbackSubject: 'Recurring Invoice Schedule Created – Peko' })],
  [K.INVOICE_GUIDELINE_REMINDER, 'Invoicing – Payment reminder (guideline)', () => invV2.resolveInvoiceReminderEmail('@@BODYLINE1@@\n@@BODYLINE2@@', P, { fallbackSubject: 'Invoice payment reminder' })],
  [K.INVOICE_PAYMENT_LINK_CREATED, 'Invoicing – Payment link sent', () => invoice.resolvePaymentLinkCreatedEmail({ amount: 1011.12, link: 'https://url.example/@@LINK@@', corporateName: '@@CORPORATE@@', invoiceId: '@@REF@@', expiryDate: 46620 }, P, { fallbackSubject: 'Payment Link Generated by @@CORPORATE@@, Reference ID @@REF@@' })],
  [K.INVOICE_PAYMENT_LINK_PAID, 'Invoicing – Payment link paid', () => invoice.resolvePaymentLinkPaidEmail({ username: '@@NAME@@', amount: '1213.14', date: '@@DATE@@', referenceId: '@@REF@@', customerName: '@@CUSTOMER@@', customerMobile: '9876543210', customerEmail: '@@CEMAIL@@' }, P, { fallbackSubject: 'Payment Received: ₹ 1213.14 from @@NAME@@' })],
  [K.COLLECTOR_KYB_APPROVED, 'Invoicing – Collector KYB approved', () => kyb.resolveCollectorKybApprovedEmail('@@NAME@@', 'https://url.example/@@LOGIN@@', P, {})],
  [K.COLLECTOR_KYB_REJECTED, 'Invoicing – Collector KYB rejected', () => kyb.resolveCollectorKybRejectedEmail('@@NAME@@', '@@REASON@@', P, {})],
];

const placeholderize = (text, variables) => {
  let out = String(text ?? '');
  const counts = {};
  const entries = Object.entries(variables)
    .map(([k, v]) => [k, String(v)])
    .filter(([, v]) => v.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
  for (const [name, value] of entries) {
    const n = out.split(value).length - 1;
    counts[name] = n;
    if (n) out = out.split(value).join(`\${${name}}`);
  }
  return { out, counts };
};
const render = (tpl, variables) => tpl.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (raw, n) => (n in variables ? String(variables[n]) : raw));

(async () => {
  const templates = [];
  let problems = 0;
  for (const [key, name, call] of CASES) {
    captured = null;
    try { await call(); } catch (e) { console.log(`CALL FAIL ${key}: ${e.message}`); problems++; continue; }
    if (!captured || captured.key !== key) { console.log(`CAPTURE MISMATCH ${key} -> ${captured && captured.key}`); problems++; continue; }
    const service = captured.service || S.INVOICING;
    let { out: html, counts } = placeholderize(captured.html, captured.variables);
    const { out: subject } = placeholderize(captured.subject, captured.variables);
    const issues = [];
    const approx = [];
    // A fallback that transforms a value (e.g. docLabel.toLowerCase()) leaves a
    // case-shifted sentinel behind — map it to the plain placeholder and say so.
    html = html.replace(/@@([a-z0-9]+)@@/g, (raw, low) => {
      const hit = Object.entries(captured.variables).find(([, v]) => String(v) === `@@${low.toUpperCase()}@@`);
      if (!hit) return raw;
      approx.push(hit[0]);
      return `\${${hit[0]}}`;
    });
    if (/@@/.test(html) || /@@/.test(subject)) issues.push('sentinel leaked (a value could not be mapped to its variable)');
    if (!approx.length && render(html, captured.variables) !== captured.html) issues.push('round-trip mismatch');
    if (approx.length) console.log(`NOTE ${key}: ${[...new Set(approx)].join(',')} used un-transformed in place of a computed value`);
    if (render(subject, captured.variables) !== captured.subject) issues.push('subject round-trip mismatch');
    const unknown = [...html.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1]).filter((n) => !(n in captured.variables));
    if (unknown.length) issues.push(`unknown placeholders: ${[...new Set(unknown)].join(',')}`);
    const unused = Object.keys(captured.variables).filter((v) => !counts[v]);
    const noisy = Object.entries(counts).filter(([, n]) => n > 4).map(([v, n]) => `${v}×${n}`);
    console.log(`${issues.length ? 'PROBLEM' : 'ok'}  ${service}/${key}${unused.length ? `  (not in body: ${unused.join(',')})` : ''}${noisy.length ? `  (many: ${noisy.join(' ')})` : ''}${issues.length ? '\n     ' + issues.join('; ') : ''}`);
    if (issues.length) problems++;
    // Stored ASCII-only: staging/prod adminEmailTemplates inherits the DB default charset
    // (not utf8mb4 — see migrations/20260530000001-alter-userPersonalTemplates-html-utf8mb4.js),
    // so ₹ / – / curly quotes in the row make the INSERT fail with "Incorrect string value".
    // HTML gets numeric entities (renders identically); name/subject are plain text so they
    // get ASCII substitutes.
    const asciiHtml = html.replace(/[\u0080-\u{10FFFF}]/gu, (c) => `&#${c.codePointAt(0)};`);
    const asciiText = (s) => s.replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/₹/g, 'INR').replace(/[\u0080-\u{10FFFF}]/gu, '');
    // isActive omitted on purpose: the server defaults it to true and an older deployed schema may reject the field.
    templates.push({ service, key, name: asciiText(name), subject: asciiText(subject), draftHtmlBody: asciiHtml });
  }
  const registered = Object.keys(K);
  const missing = registered.filter((k) => !templates.some((t) => t.key === k));
  if (missing.length) { console.log('MISSING KEYS:', missing.join(',')); problems++; }
  fs.writeFileSync(outFile, JSON.stringify(templates, null, 2) + '\n');
  console.log(`\n${templates.length} templates written to ${outFile} (${problems} problems)`);
  process.exit(problems ? 1 : 0);
})();
