const { escapeHtml } = require("./htmlEscape");
const { formatNumberWithLocalString } = require('./formatter');

const PEKO_COMPANY_DETAILS = {
    name: 'PEKO PLATFORMS PRIVATE LIMITED',
    logo: 'https://d2fduk7g9mvyjq.cloudfront.net/common/image.png',
    addressLine1: '2nd Floor, 55, Lane-2, Westend Marg',
    addressLine2: 'New Delhi, Delhi - 110030, India',
    gstin: '07AAOCP9213H1Z4',
    phone: '022 489 30373',
    email: 'reach@peko.one',
    website: 'www.peko.one',
};

/**
 * Payment Receipt Template
 * @param {Object} paymentData - Dynamic payment/customer data
 * @param {string} paymentData.receiptNo - Receipt number
 * @param {string} paymentData.customerName - Customer name
 * @param {string} paymentData.customerNumber - Customer number/ID
 * @param {string} paymentData.orderNumber - Order number
 * @param {string} paymentData.lineOfBusiness - Line of business (e.g., "Portal")
 * @param {string} paymentData.paymentType - Payment type (e.g., "Bill Payment")
 * @param {string} paymentData.paymentDateTime - Payment date and time
 * @param {string} paymentData.paymentMode - Payment mode (e.g., "PAYMENT GATEWAY")
 * @param {string} paymentData.paidAmount - Paid amount
 * @param {string} [paymentData.thankYouMessage] - Optional custom thank you message
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Company name
 * @param {string} templateData.logo - Company logo URL
 * @param {string} templateData.address - Full company address
 * @param {string} templateData.phone - Company phone number
 * @param {string} templateData.email - Company email
 * @param {string} templateData.website - Company website
 */
exports.paymentReceiptTemplate = (paymentData, templateData) => {
    let {
        name: companyName = PEKO_COMPANY_DETAILS.name,
        logo: companyLogo = PEKO_COMPANY_DETAILS.logo,
        address: companyAddress = [PEKO_COMPANY_DETAILS.addressLine1, PEKO_COMPANY_DETAILS.addressLine2]
            .filter(Boolean)
            .join(' '),
        phone: companyPhone = PEKO_COMPANY_DETAILS.phone,
        email: companyEmail = PEKO_COMPANY_DETAILS.email,
        website: companyWebsite = PEKO_COMPANY_DETAILS.website
    } = templateData || {};

    let {
        thankYouMessage = `Thank you for choosing ${companyName.split(' ')[0]}. Here is the payment receipt`,
        paymentDateTime = 'N/A',
        receiptNo = 'N/A',
        paymentMode = 'N/A',
        customerName = 'N/A',
        paymentType = 'N/A',
        itemServicePrice = 'N/A',
        platformFee = 'N/A',
        paidAmount = 'N/A',
        // customerNumber = '',
        // orderNumber = '',
        // lineOfBusiness = '',
    } = paymentData || {};

    // F-PAY-19: escape user fields before interpolation.
    companyName = escapeHtml(companyName);
    companyAddress = escapeHtml(companyAddress);
    companyPhone = escapeHtml(companyPhone);
    companyEmail = escapeHtml(companyEmail);
    companyWebsite = escapeHtml(companyWebsite);
    companyLogo = escapeHtml(companyLogo);
    thankYouMessage = escapeHtml(thankYouMessage);
    paymentDateTime = escapeHtml(paymentDateTime);
    receiptNo = escapeHtml(receiptNo);
    paymentMode = escapeHtml(paymentMode);
    customerName = escapeHtml(customerName);
    paymentType = escapeHtml(paymentType);
    itemServicePrice = escapeHtml(itemServicePrice);
    platformFee = escapeHtml(platformFee);
    paidAmount = escapeHtml(paidAmount);

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Receipt</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
      rel="stylesheet"
    />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html,
      body {
        background: #ffffff;
        font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      @page {
        size: A4;
        margin: 0;
      }

      .page {
        width: 794px;
        height: 1123px;
        position: relative;
        background: #ffffff;
        overflow: hidden;
        margin: 0 auto;
      }

      /* Watermark logo (placed before other absolute children = behind in z-order) */
      .watermark {
        width: 100px;
        right: 70px;
        top: 30px;
        z-index: 999;
        position: absolute;
      }

      /* Registered mark glyph */
      .reg-mark {
        width: 32px;
        height: 46px;
        left: 627px;
        top: 280px;
        position: absolute;
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: #000000;
        font-size: 43px;
        font-family: 'Helvetica Neue', sans-serif;
        font-weight: 300;
        line-height: 69px;
        letter-spacing: 0.57px;
        word-wrap: break-word;
      }

      /* Header block */
      .header {
        width: 264px;
        left: 53px;
        top: 37px;
        position: absolute;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
        display: inline-flex;
      }

      .header .company-name {
        width: 330px;
        align-self: stretch;
        color: #000000;
        font-size: 19px;
        font-family: 'Roboto', sans-serif;
        font-weight: 600;
        line-height: 22.55px;
        word-wrap: break-word;
      }

      .header .doc-title {
        align-self: stretch;
        color: #000000;
        font-size: 19px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        line-height: 22.55px;
        word-wrap: break-word;
      }

      /* Main column (greeting + table) */
      .main {
        width: 668px;
        left: 60px;
        top: 130px;
        position: absolute;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 27px;
        display: inline-flex;
      }

      .greeting {
        align-self: stretch;
        color: #1a1c21;
        font-size: 13px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        line-height: 15.47px;
        word-wrap: break-word;
      }

      .table-wrap {
        align-self: stretch;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 43px;
        display: flex;
      }

      .table-outer {
        align-self: stretch;
        border-radius: 42px;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        display: flex;
      }

      .table {
        align-self: stretch;
        background: #ffffff;
        overflow: hidden;
        border-radius: 8.5px;
        outline: 1.1px #e6e6e6 solid;
        outline-offset: -1.1px;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        display: flex;
      }

      .row {
        align-self: stretch;
        height: 40px;
        position: relative;
        background: rgba(255, 255, 255, 0);
        overflow: hidden;
      }

      .cell {
        width: 334px;
        height: 40px;
        top: 0;
        position: absolute;
        background: rgba(255, 255, 255, 0);
        border-left: 1.1px #e6e6e6 solid;
        border-top: 1.1px #e6e6e6 solid;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        display: inline-flex;
      }

      .cell.left {
        left: 0;
      }

      .cell.right {
        left: 334px;
      }

      .cell-inner {
        align-self: stretch;
        padding-left: 13px;
        padding-right: 13px;
        padding-top: 11px;
        padding-bottom: 11px;
        overflow: hidden;
        justify-content: flex-start;
        align-items: flex-start;
        display: inline-flex;
      }

      .cell-text {
        text-align: center;
        color: #000000;
        font-size: 13px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        word-wrap: break-word;
      }

      .cell-value {
        flex: 1 1 0;
        color: #000000;
        font-size: 13px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        word-wrap: break-word;
      }

      .cell-spacer {
        flex: 1 1 0;
      }

      /* Amount cell with INR rupee symbol */
      .amount-wrap {
        width: 305px;
        justify-content: flex-start;
        align-items: center;
        gap: 2.5px;
        display: flex;
      }

      .amount-wrap .rupee {
        font-size: 13px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }

      .amount-wrap .amount-value {
        width: 292px;
        height: 16px;
        color: #000000;
        font-size: 13px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        word-wrap: break-word;
      }

      /* Amount-paid cell uses an inner relative wrapper (matches Figma export) */
      .amount-paid-inner {
        align-self: stretch;
        height: 40px;
        position: relative;
        overflow: hidden;
      }

      .amount-paid-inner .underline-spacer {
        width: 288px;
        left: 13px;
        top: 11px;
        position: absolute;
      }

      .amount-paid-inner .amount-wrap {
        left: 13px;
        top: 12px;
        position: absolute;
        align-items: center;
      }

      /* Disclaimer */
      .disclaimer {
        width: 702px;
        left: 42px;
        top: 628px;
        position: absolute;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 16px;
        display: inline-flex;
        padding-top: 16px;
        padding-bottom: 16px;
        border-top: 1.1px solid #e6e6e6;
        border-bottom: 1.1px solid #e6e6e6;
      }

      .disclaimer-text {
        width: 648px;
        text-align: center;
        color: #000000;
        font-size: 12px;
        font-family: 'Roboto', sans-serif;
        font-style: italic;
        font-weight: 400;
        line-height: 21px;
        word-wrap: break-word;
      }

      /* Discrepancy / support box */
      .support-box {
        width: 702px;
        height: 77px;
        padding-left: 32px;
        padding-right: 32px;
        padding-top: 11px;
        padding-bottom: 11px;
        left: 42px;
        top: 523px;
        position: absolute;
        background: #fff7f7;
        border-radius: 17px;
        justify-content: center;
        align-items: center;
        gap: 13px;
        display: inline-flex;
      }

      .support-box .support-text-block {
        text-align: center;
      }

      .support-box .support-line-1 {
        color: #000000;
        font-size: 12px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        line-height: 19.91px;
        word-wrap: break-word;
      }

      .support-box .support-line-2 {
        color: #ff4f4f;
        font-size: 12px;
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
        line-height: 19.91px;
        word-wrap: break-word;
      }

      /* Footer */
      .footer {
        width: 681px;
        left: 63px;
        top: 752px;
        position: absolute;
        justify-content: flex-start;
        align-items: center;
        gap: 21px;
        display: inline-flex;
      }

      .footer-text {
        flex: 1 1 0;
        text-align: center;
        color: #474747;
        font-size: 12px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
        line-height: 17px;
        word-wrap: break-word;
      }
    </style>
  </head>

  <body>
    <div class="page">
      <!-- Watermark logo (uses companyLogo from templateData) -->
      <img class="watermark" src="${companyLogo}" alt="${companyName} Logo" />

      <!-- Registered trademark glyph -->
      <div class="reg-mark">®</div>

      <!-- Header -->
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="doc-title">Payment Receipt</div>
      </div>

      <!-- Main: greeting + table -->
      <div class="main">
        <div class="greeting">${thankYouMessage}</div>

        <div class="table-wrap">
          <div class="table-outer">
            <div class="table">
              <!-- Row 1: Payment Date -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Payment Date</div>
                    <div class="cell-spacer"></div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-text">${paymentDateTime}</div>
                    <div class="cell-spacer"></div>
                  </div>
                </div>
              </div>

              <!-- Row 2: Receipt No. -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Receipt No. </div>
                    <div class="cell-spacer"></div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-value">${receiptNo}</div>
                  </div>
                </div>
              </div>

              <!-- Row 3: Payment Mode -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Payment Mode</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-value">${paymentMode}</div>
                    <div class="cell-spacer"></div>
                  </div>
                </div>
              </div>

              <!-- Row 4: Customer Name -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Customer Name</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-value">${customerName}</div>
                    <div class="cell-spacer"></div>
                  </div>
                </div>
              </div>

              <!-- Row 5: Item/Service -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Item/Service</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-value">${paymentType} </div>
                    <div class="cell-spacer"></div>
                  </div>
                </div>
              </div>

              <!-- Row 6: Item/Service Price -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Item/Service Price</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-spacer"></div>
                    ${itemServicePrice !== "N/A"
                      ? `<div class="amount-wrap">
                            <span class="rupee">₹</span>
                            <div class="amount-value">${formatNumberWithLocalString(itemServicePrice)}</div>
                         </div>`
                      : `<div class="amount-wrap">
                            <div class="amount-value">N/A</div>
                         </div>`
                    }
                  </div>
                </div>
              </div>

              <!-- Row 7: Platform Fee -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Platform Fee</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-spacer"></div>
                    ${platformFee !== "N/A"
                      ? `<div class="amount-wrap">
                            <span class="rupee">₹</span>
                            <div class="amount-value">${formatNumberWithLocalString(platformFee)}</div>
                         </div>`
                      : `<div class="amount-wrap">
                            <div class="amount-value">N/A</div>
                         </div>`
                    }
                  </div>
                </div>
              </div>

              <!-- Row 8: Amount Paid -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Amount Paid</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="amount-paid-inner">
                    <div class="underline-spacer"></div>
                    ${paidAmount !== "N/A"
                      ? `<div class="amount-wrap">
                            <span class="rupee">₹</span>
                            <div class="amount-value">${formatNumberWithLocalString(paidAmount)}</div>
                         </div>`
                      : `<div class="amount-wrap">
                            <div class="amount-value">N/A</div>
                         </div>`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Discrepancy / support box -->
      <div class="support-box">
        <div class="support-text-block">
          <span class="support-line-1"
            >If you found any discrepancy, please reach out to us through:<br
          /></span>
          <span class="support-line-2"
            >Peko Portal &gt; Support &gt; Billing &amp;
            Payments related issue &gt; Payments related &gt; Payment not
            posted</span
          >
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <div class="disclaimer-text">
          This is a system-generated receipt and does not require signature. Any
          unauthorized use, disclosure, dissemination or copying of this receipt
          is strictly prohibited and may be unlawful.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-text">
          ${companyName}, ${companyAddress}<br />
          ${companyPhone} | ${companyEmail} | ${companyWebsite}
        </div>
      </div>
    </div>
  </body>
</html>
`;
};

/**
 * Tax Invoice Template (India GST)
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Company name
 * @param {string} templateData.logo - Company logo URL
 * @param {string} templateData.addressLine1 - Address line 1
 * @param {string} templateData.addressLine2 - Address line 2 (City, State)
 * @param {string} templateData.taxId - Company GSTIN
 * @param {string} templateData.phone - Company phone number
 * @param {string} templateData.email - Company email
 * @param {string} templateData.website - Company website
 * @param {Object} invoiceData - Dynamic invoice/customer data
 * @param {string} invoiceData.invoiceNumber - Invoice number
 * @param {string} invoiceData.issuedDate - Issue date
 * @param {string} invoiceData.placeOfSupply - Place of supply (e.g., "Maharashtra (27)")
 * @param {Object} invoiceData.billedTo - Customer billing information
 * @param {string} invoiceData.billedTo.companyName - Customer company name
 * @param {string} invoiceData.billedTo.address - Customer address
 * @param {string} invoiceData.billedTo.cityCountry - Customer city and country
 * @param {string} invoiceData.billedTo.gstin - Customer GSTIN
 * @param {Array} invoiceData.items - Array of line items
 * @param {string} invoiceData.items[].description - Item description
 * @param {string} invoiceData.items[].quantity - Quantity
 * @param {string} invoiceData.items[].price - Unit price
 * @param {string} invoiceData.items[].taxableAmount - Taxable amount
 * @param {string} invoiceData.items[].vat - GST amount for the line
 * @param {string} invoiceData.items[].lineTotal - Line total
 * @param {string} invoiceData.subtotal - Subtotal amount
 * @param {Array} invoiceData.taxLines - GST breakup rows [{label, amount}]
 *   (CGST + SGST for intra-state, IGST for inter-state)
 * @param {string} invoiceData.taxLabel - Legacy single tax label (fallback)
 * @param {string} invoiceData.taxAmount - Legacy single tax amount (fallback)
 * @param {string} invoiceData.total - Total amount
 * @param {string} [invoiceData.note] - Optional note
 */
exports.taxInvoiceTemplate = (invoiceData, templateData) => {
  let {
    name: companyName = PEKO_COMPANY_DETAILS.name,
    logo: companyLogo = PEKO_COMPANY_DETAILS.logo,
    addressLine1 = PEKO_COMPANY_DETAILS.addressLine1,
    addressLine2 = PEKO_COMPANY_DETAILS.addressLine2,
    taxId = PEKO_COMPANY_DETAILS.gstin,
    phone: companyPhone = PEKO_COMPANY_DETAILS.phone,
    email: companyEmail = PEKO_COMPANY_DETAILS.email,
    website: companyWebsite = PEKO_COMPANY_DETAILS.website
  } = templateData || {};

  let {
    invoiceNumber = '',
    issuedDate = '',
    placeOfSupply = '',
    billedTo = {},
    items = [],
    subtotal = '',
    taxLines = [],
    taxLabel = '',
    taxAmount = '',
    total = '',
  } = invoiceData || {};

  let {
    companyName: billedCompanyName = '',
    address: billedAddress = '',
    cityCountry: billedCityCountry = '',
    gstin: billedGstin = ''
  } = billedTo;

  // F-PAY-19: escape user fields before interpolation.
  companyName = escapeHtml(companyName);
  companyLogo = escapeHtml(companyLogo);
  addressLine1 = escapeHtml(addressLine1);
  addressLine2 = escapeHtml(addressLine2);
  taxId = escapeHtml(taxId);
  companyPhone = escapeHtml(companyPhone);
  companyEmail = escapeHtml(companyEmail);
  companyWebsite = escapeHtml(companyWebsite);
  invoiceNumber = escapeHtml(invoiceNumber);
  issuedDate = escapeHtml(issuedDate);
  placeOfSupply = escapeHtml(placeOfSupply);
  subtotal = escapeHtml(subtotal);
  taxLabel = escapeHtml(taxLabel);
  taxAmount = escapeHtml(taxAmount);
  total = escapeHtml(total);
  billedCompanyName = escapeHtml(billedCompanyName);
  billedAddress = escapeHtml(billedAddress);
  billedCityCountry = escapeHtml(billedCityCountry);
  billedGstin = escapeHtml(billedGstin);

  // Generate items rows
  const itemsRows = items.map(item => `
            <tr>
              <td>${escapeHtml(item.description || '')}</td>
              <td>${escapeHtml(item.quantity || '')}</td>
              <td>${escapeHtml(item.price ? formatNumberWithLocalString(item.price) : '')}</td>
              <td>${escapeHtml(item.taxableAmount ? formatNumberWithLocalString(item.taxableAmount) : '')}</td>
              <td>${escapeHtml(item.vat ? formatNumberWithLocalString(item.vat) : '')}</td>
              <td>${escapeHtml(item.lineTotal ? formatNumberWithLocalString(item.lineTotal) : '')}</td>
            </tr>`).join('');

  // GST breakup rows — CGST+SGST (intra-state) or IGST (inter-state).
  // Falls back to the legacy single taxLabel/taxAmount pair for old stored data.
  const effectiveTaxLines =
    taxLines && taxLines.length > 0
      ? taxLines
      : taxLabel
        ? [{ label: taxLabel, amount: taxAmount }]
        : [];
  const taxRows = effectiveTaxLines.map(line => `
            <div class="totals-row">
              <span class="label">${escapeHtml(line.label || '')}</span>
              <span class="value">₹ ${escapeHtml(formatNumberWithLocalString(line.amount))}</span>
            </div>`).join('');

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Tax Invoice</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #F9FAFC;
          line-height: 1.4;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .container {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #F9FAFC;
          padding: 40px 40px 30px 40px;
          position: relative;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .header-left h1 {
          font-size: 34px;
          font-weight: 600;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .company-info {
          font-size: 13px;
          line-height: 1.5;
        }

        .company-info .company-name {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .company-info .tax-id {
          margin-top: 4px;
          font-weight: 600;
        }

        .footer-logo img {
          height: 40px;
          width: auto;
        }

        /* Invoice Number */
        .invoice-number-section {
          margin-bottom: 24px;
        }

        .invoice-number-section .label {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .invoice-number-section .value {
          font-size: 13px;
          font-weight: 700;
        }

        /* Dates and Billing Section */
        .dates-billing-section {
          display: flex;
          margin-bottom: 32px;
          border: 1px solid #E5E7EB;
        }

        .dates-column {
          width: 50%;
          padding: 20px 24px;
        }

        .billing-column {
          width: 50%;
          padding: 20px 24px;
          border-left: 1px solid #E5E7EB;
        }

        .date-group {
          margin-bottom: 20px;
        }

        .date-group:last-child {
          margin-bottom: 0;
        }

        .date-group .label {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .date-group .value {
          font-size: 13px;
          color: #5E6470;
        }

        .billing-column .label {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .billing-info {
          font-size: 13px;
          line-height: 1.5;
          color: #5E6470;
        }

        .billing-info .billing-company-name {
          font-weight: 700;
          margin-bottom: 2px;
        }

        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
        }

        .items-table th {
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 12px 8px;
          border-bottom: 1px solid #D7DAE0;
        }

        .items-table td {
          font-size: 12px;
          padding: 16px 8px;
          vertical-align: middle;
          border-bottom: 1px solid #D7DAE0;
        }

        .items-table th:first-child,
        .items-table td:first-child {
          padding-left: 0;
          font-weight: 700;
        }

        .items-table th:last-child,
        .items-table td:last-child {
          text-align: right;
          padding-right: 0;
        }

        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:nth-child(5),
        .items-table td:nth-child(2),
        .items-table td:nth-child(3),
        .items-table td:nth-child(4),
        .items-table td:nth-child(5)
        {
          text-align: center;
        }

        /* Totals Section */
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
          margin-bottom: 0;
        }

        .totals-table {
          width: 220px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          font-size: 12px;
          border-bottom: 1px solid #D7DAE0;
        }

        .totals-row:last-child {
          border-bottom: none;
        }

        .totals-row.total {
          font-weight: 700;
        }

        .totals-row .label {
          text-align: left;
          font-weight: 700;
        }

        .totals-row .value {
          text-align: right;
        }

        /* Note Section */
        .note-section {
          position: absolute;
          bottom: 80px;
          left: 40px;
        }

        .note-section .label {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .note-section .value {
          font-size: 12px;
          color: #6B7280;
        }

        /* Footer */
        .footer {
          border-top: 1px solid #D7DAE0;
          padding-top: 6px;
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <h1>Tax Invoice</h1>
            <div class="company-info">
              <div class="company-name">${companyName}</div>
              <div>${addressLine1}</div>
              <div>${addressLine2}</div>
              ${taxId ? `<div class="tax-id">GSTIN ${taxId}</div>` : 'GSTIN: (Not Applicable)'}
            </div>
          </div>
          <div class="footer-logo">
            <img src="${companyLogo}" alt="${companyName} Logo" />
          </div>
        </div>

        <!-- Invoice Number -->
        <div class="invoice-number-section">
          <div class="label">Invoice Number: ${invoiceNumber}</div>
        </div>

        <!-- Dates and Billing Section -->
        <div class="dates-billing-section">
          <div class="dates-column">
            <div class="date-group">
              <div class="label">Issue Date</div>
              <div class="value">${issuedDate}</div>
            </div>
            ${placeOfSupply ? `<div class="date-group">
              <div class="label">Place of Supply</div>
              <div class="value">${placeOfSupply}</div>
            </div>` : ''}
          </div>
          <div class="billing-column">
            <div class="label">Billed to</div>
            <div class="billing-info">
              <div class="billing-company-name">${billedCompanyName}</div>
              <div>${billedAddress}</div>
              <div>${billedCityCountry}</div>
              ${billedGstin ? `<div>GSTIN ${billedGstin}</div>` : '<div>GSTIN: (Not Applicable)</div>'}
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Item/Description</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Taxable amount</th>
              <th>GST</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
          <div class="totals-table">
            <div class="totals-row">
              <span class="label">Subtotal</span>
              <span class="value">₹ ${formatNumberWithLocalString(subtotal)}</span>
            </div>${taxRows}
            <div class="totals-row total">
              <span class="label">Total</span>
              <span class="value">₹ ${formatNumberWithLocalString(total)}</span>
            </div>
          </div>
        </div>


        <!-- Footer -->
        <div class="footer">
          ${companyPhone} | ${companyEmail} | ${companyWebsite}
        </div>
      </div>
    </body>
  </html>`;
};

exports.PEKO_COMPANY_DETAILS = PEKO_COMPANY_DETAILS;
