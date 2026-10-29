const ExcelJS = require("exceljs");

// Fixed MIQ header row (exact strings NuPay expects — trailing space on "Billing Name " is intentional).
const MIQ_HEADERS = [
  "Merchant Name",
  "Billing Name ",
  "Company Website",
  "About Us Page Link",
  "Website Terms and conditions",
  "Contact Us Page Link",
  "Website Privacy Policy Link",
  "Product Pricing Page Link",
  "Refund Policy Link",
  "Cancellation Policy Link",
  "Shipping & Delivery Policy Link",
  "Contact Person Name",
  "Contact Email ID",
  "Transactions Report Email-id",
  "Business Address",
  "City",
  "PIN Code",
  "State",
  "Contact Number",
  "Business Type (Proprietorship/Partnership/Pvt Ltd)",
  "CIN",
  "Business PAN",
  "Legal Business Name",
  "Authorised Signatory PAN",
  "PAN Owner name",
  "Business Category",
  "Sub Category",
  "GSTIN",
  "Business Description",
  "Business Establishment Date",
  "Bank Account Number",
  "Beneficiary Name",
  "Branch IFSC Code",
  "Redirection URL",
];

const BUSINESS_TYPE = {
  individual: "Individual",
  sole_proprietorship: "Proprietorship",
  partnership: "Partnership",
  private_limited: "Pvt Ltd",
};

// Builds the NuPay MIQ workbook for one merchant: row 1 = fixed headers, row 2 = this merchant's
// data. Column order below MUST stay aligned with MIQ_HEADERS. Returns a Buffer.
exports.buildMiqBuffer = async (d = {}) => {
  const v = (x) => (x === undefined || x === null ? "" : String(x));
  const row = [
    v(d.merchant_name),
    v(d.billing_name || d.merchant_name),
    v(d.website_url),
    v(d.about_us_link),
    v(d.terms_link),
    v(d.contact_us_link),
    v(d.privacy_link),
    v(d.pricing_link),
    v(d.refund_link),
    v(d.cancellation_link),
    v(d.shipping_link),
    v(d.contact_person_name || d.merchant_name),
    v(d.official_email),
    v(d.transactions_report_email || d.official_email),
    v(d.business_address),
    v(d.city),
    v(d.pincode),
    v(d.state),
    v(d.contact_number),
    v(BUSINESS_TYPE[d.entity_type] || ""),
    v(d.cin),
    v(d.business_pan),
    v(d.legal_business_name || d.merchant_name),
    v(d.authorised_signatory_pan_number),
    v(d.pan_owner_name),
    v(d.business_category),
    v(d.sub_category),
    v(d.gstin),
    v(d.business_description),
    v(d.establishment_date),
    v(d.bank_account_number),
    v(d.beneficiary_name || d.account_holder_name),
    v(d.ifsc_code),
    "", // Redirection URL — marked N/A by NuPay
  ];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.addRow(MIQ_HEADERS);
  sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

exports.MIQ_HEADERS = MIQ_HEADERS;
