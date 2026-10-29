const { formatNumberWithLocalString } = require('./formatter');

const escapeHtml = value =>
    String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

exports.reportInvoiceTemplete = (data, addressDetails, userData) => {
  let addressLine1 = ''
  let addressLine2 = ''
  let addressLine3 = ''
  let city = ''
  let country = ''
  if (addressDetails) {
    addressLine1 = addressDetails.addressLine1
    addressLine2 = addressDetails.addressLine2 || ''
    city = addressDetails.city || ''
    country = addressDetails.country
  }
  if (userData.city != '' && userData.city != null) {
    city = userData.city
  }
  if (userData.country != '' && userData.country != null) {
    country = userData.country
  }
  if (city != '' && country != '') {
    addressLine3 = city + ', ' + country + '.'
  }
  return `
  <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice</title>
  <style>
    @page {
        margin: 2.5rem 0;
    }
</style>
</head>

<style>
::before,
::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

::before,
::after {
  --tw-content: '';
}


html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: 'Roboto', Arial, sans-serif;
  font-feature-settings: normal;
  font-variation-settings: normal;
}



body {
  margin: 0;
  line-height: inherit;
}

hr {
  height: 0;
  color: inherit;
  border-top-width: 1px;
}


abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
          text-decoration: underline dotted;
}


h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}



a {
  color: inherit;
  text-decoration: inherit;
}



b,
strong {
  font-weight: bolder;
}



code,
kbd,
samp,
pre {
  font-family: 'Roboto', Arial, sans-serif;
  font-size: 1em;
}


small {
  font-size: 80%;
}



sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}


table {
  text-indent: 0;
  border-color: inherit;
  border-collapse: collapse;
}


button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}

button,
select {
  text-transform: none;
}


button,
[type='button'],
[type='reset'],
[type='submit'] {
  -webkit-appearance: button;
  background-color: transparent;
  background-image: none;
}



:-moz-focusring {
  outline: auto;
}



:-moz-ui-invalid {
  box-shadow: none;
}



progress {
  vertical-align: baseline;
}



::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}



[type='search'] {
  -webkit-appearance: textfield;
  /* 1 */
  outline-offset: -2px;
  /* 2 */
}



::-webkit-search-decoration {
  -webkit-appearance: none;
}



::-webkit-file-upload-button {
  -webkit-appearance: button;
  /* 1 */
  font: inherit;
  /* 2 */
}



summary {
  display: list-item;
}



blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}



dialog {
  padding: 0;
}



textarea {
  resize: vertical;
}



input::placeholder,
textarea::placeholder {
  opacity: 1;
  color: #9ca3af;
}



button,
[role="button"] {
  cursor: pointer;
}



:disabled {
  cursor: default;
}

/*
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block;
  /* 1 */
  vertical-align: middle;
  /* 2 */
}

/*
Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/* Make elements with the HTML hidden attribute stay hidden by default */

[hidden] {
  display: none;
}

*, ::before, ::after{
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
}

::backdrop{
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x:  ;
  --tw-pan-y:  ;
  --tw-pinch-zoom:  ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position:  ;
  --tw-gradient-via-position:  ;
  --tw-gradient-to-position:  ;
  --tw-ordinal:  ;
  --tw-slashed-zero:  ;
  --tw-numeric-figure:  ;
  --tw-numeric-spacing:  ;
  --tw-numeric-fraction:  ;
  --tw-ring-inset:  ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(59 130 246 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur:  ;
  --tw-brightness:  ;
  --tw-contrast:  ;
  --tw-grayscale:  ;
  --tw-hue-rotate:  ;
  --tw-invert:  ;
  --tw-saturate:  ;
  --tw-sepia:  ;
  --tw-drop-shadow:  ;
  --tw-backdrop-blur:  ;
  --tw-backdrop-brightness:  ;
  --tw-backdrop-contrast:  ;
  --tw-backdrop-grayscale:  ;
  --tw-backdrop-hue-rotate:  ;
  --tw-backdrop-invert:  ;
  --tw-backdrop-opacity:  ;
  --tw-backdrop-saturate:  ;
  --tw-backdrop-sepia:  ;
}

.fixed{
  position: fixed;
}

.bottom-0{
  bottom: 0px;
}

.left-0{
  left: 0px;
}

.table{
  display: table;
}

.h-12{
  height: 2rem;
}

.w-1/2{
  width: 50%;
}

.w-full{
  width: 100%;
}

.border-collapse{
  border-collapse: collapse;
}

.border-spacing-0{
  --tw-border-spacing-x: 0px;
  --tw-border-spacing-y: 0px;
  border-spacing: var(--tw-border-spacing-x) var(--tw-border-spacing-y);
}

.whitespace-nowrap{
  white-space: nowrap;
}

.border-b{
  border-bottom-width: 1px;
}

.border-b-2{
  border-bottom-width: 2px;
}

.border-r{
  border-right-width: 1px;
}

.border-main{
  border-color: black;
}

.bg-main{
  background-color: black;
}
.bg-main1{
  background-color: #454444;
}
.bg-main2{
  background-color: #F7F7F7;

}
.bg-slate-100{
  background-color: #f1f5f9;
}

.p-3{
  padding: 0.4rem;
}

.px-14{
  padding-left: 2.5rem;
  padding-right: 2.5rem;
}

.px-2{
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.py-10{
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

.py-3{
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.py-4{
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.py-6{
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.pb-3{
  padding-bottom: 0.75rem;
}

.pl-2{
  padding-left: 0.5rem;
}

.pl-3{
  padding-left: 0.75rem;
}

.pl-4{
  padding-left: 1rem;
}

.pr-3{
  padding-right: 0.75rem;
}

.pr-4{
  padding-right: 1rem;
}

.text-center{
  text-align: center;
}

.text-right{
  text-align: right;
}

.align-top{
  vertical-align: top;
}

.text-sm{
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs{
  font-size: 0.75rem;
  line-height: 1rem;
}

.font-bold{
  font-weight: 700;
}

.italic{
  font-style: italic;
}

.text-main{
  color: black;
}

.text-neutral-600{
  color: #333333;
}

.text-neutral-700{
  color: #333333;
}

.text-slate-300{
  color: #cbd5e1;
}

.text-slate-400{
  color: #94a3b8;
}

.text-white{
  color: #fff;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
  }
}
</style>

<body>
  <div>
    <div class="py-3">
      <div class="px-14">
        <table class="w-full border-collapse border-spacing-0">
          <tbody>
            <tr>
              <td class="w-full align-top">
                <div>
                  <img src="data:image/png;base64,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" class="h-12" />
                </div>
              </td>

              <td class="align-top">
                <div class="text-sm">
                  <table class="border-collapse border-spacing-0">
                    <tbody>
                      <tr>
                        <td class="border-r pr-4">
                        </td>
                        <td class="pl-4">
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-14 py-6 text-sm">
        <table class="w-full border-collapse border-spacing-0">
          <tbody>
            <tr>
              <td class=" align-top" style="width: 50%;">
                <div class="text-sm text-neutral-600">
                  <p class="font-bold">Billed To</p>
                  <p class="font-bold" style="margin-top: 10px;">${userData.companyName}</p>
                  <p class="font-bold">${userData.email}</p>
                  ${addressLine1 ? `<p>${addressLine1}</p>` : ``}
                  ${addressLine2 ? `<p>${addressLine2}</p>` : ``}
                  ${addressLine3 ? `<p>${addressLine3}</p>` : ``}
                  <p>${userData.mobile}</p>
                </div>
              </td>
            
              <td class=" align-top " style="width: 50%;">
                <div class="text-sm text-neutral-600">
                  <p class="font-bold text-right" style="font-size: 35px;margin-bottom: 25px;">Invoice</p>
                  <table class=" border-collapse border-spacing-0" style="float: right;">
                <tbody>
                  <tr>
                    <td class=" align-top">
                        <div style="margin-top: 10px;">
                            <p class="text-left">Invoice No:</p>
                            <p class="text-left">Invoice Date:</p>
                            <p class="text-left">Transaction ID:</p>
                        </div>
                    </td>
      
                    <td class="align-top">
                        <div style="margin-top: 10px;padding-left: 10px;">
                            <p class="font-bold text-right">${data.id}</p>
                        <p class="font-bold text-right">${new Date(data.transactionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} </p>
                        <p class="font-bold text-right">${data.corporateTxnId}</p>
                         </div>
                    </td>
                  </tr>
                </tbody>
              </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-14 py-6 text-sm text-neutral-700">
        <table class="w-full border-collapse border-spacing-0">
          <thead>
            <tr>
              <td class="border-b-2 border-main p-3 pl-2 font-bold text-white bg-main1 ">Description</td>
              <td class="border-b-2 border-main p-3 pl-2 text-center font-bold text-white bg-main1 ">Price</td>
              <td class="border-b-2 border-main p-3 pl-2 pr-3 text-right font-bold text-white bg-main1 ">Amount</td>
            </tr>
          </thead>
          <tbody>
          
                                  <tr style="border-bottom: 1px solid #E7EBF4;">
                                      <td class="border-b py-3 pl-2 font-bold text-main">${data?.serviceOperator?.serviceProvider}</td>
                                      <td class="border-b py-3 pl-2 text-center font-bold text-main">₹ ${parseFloat(data.order.baseAmount).toFixed(2)}</td>
                                      <td class="border-b py-3 pl-2 pr-3 text-right font-bold text-main">₹ ${parseFloat(data.order.baseAmount).toFixed(2)}</td>
                                  </tr>       
            <tr>
              <td colspan="7">
                <table class="w-full border-collapse border-spacing-0">
                  <tbody>
                    <tr>
                      <td class="" style="width: 70%;"></td>
                      <td>
                        <table class="w-full border-collapse border-spacing-0">
                          <tbody>
                          ${data.serviceOperator?.serviceCategory === 'Office Supplies' ? `
                             <tr>
                              <td class="border-b p-3">
                                <div class="whitespace-nowrap text-main">Total Price:</div>
                              </td>
                              <td class="border-b p-3 text-right">
                                <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.totalPrice).toFixed(2)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td class="border-b p-3">
                                <div class="whitespace-nowrap text-main">Total Vat:</div>
                              </td>
                              <td class="border-b p-3 text-right">
                                <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.totalVat).toFixed(2)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td class="border-b p-3">
                                <div class="whitespace-nowrap text-main">Shipping Amount:</div>
                              </td>
                              <td class="border-b p-3 text-right">
                                <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.shippingAmount).toFixed(2)}</div>
                              </td>
                            </tr>
                              <tr>
                              <td class="border-b p-3">
                                <div class="whitespace-nowrap text-main">Surcharge:</div>
                              </td>
                              <td class="border-b p-3 text-right">
                                <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.surcharge).toFixed(2)}</div>
                              </td>
                            </tr>
                              <tr>
                              <td class="bg-main2 p-3">
                                <div class="whitespace-nowrap font-bold text-main">Total:</div>
                              </td>
                              <td class="bg-main2 p-3 text-right">
                                <div class="whitespace-nowrap font-bold text-main">₹ ${parseFloat(data.order.baseAmount).toFixed(2)}</div>
                              </td>
                            </tr>
                            ` :  `<tr>
                            <td class="border-b p-3">
                              <div class="whitespace-nowrap text-main">Sub Total:</div>
                            </td>
                            <td class="border-b p-3 text-right">
                              <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.order.baseAmount).toFixed(2)}</div>
                            </td>
                          </tr>
                          <tr>
                            <td class="bg-main2 p-3">
                              <div class="whitespace-nowrap font-bold text-main">Total:</div>
                            </td>
                            <td class="bg-main2 p-3 text-right">
                              <div class="whitespace-nowrap font-bold text-main">₹ ${parseFloat(data.order.baseAmount).toFixed(2)}</div>
                            </td>
                          </tr>`}
                           
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-14 py-3 text-sm text-neutral-700" style="margin-top: 30px;">
        <p class="text-main font-bold">Contact</p>
        <p>www.peko.one</p>
        <p>reach@peko.one</p>
      </div>
    </div>
</body>

</html>
  `
}

const PEKO_COMPANY_DETAILS = {
    name: 'PEKO PLATFORMS PRIVATE LIMITED',
    logo: 'https://d2fduk7g9mvyjq.cloudfront.net/common/image.png',
    addressLine1: '2nd Floor, 55, Lane-2, Westend Marg',
    addressLine2: 'New Delhi, Delhi - 110030, India',
    gstin: '07AAOCP9213H1Z4',
    phone: '02248930373',
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
    const {
        name: companyName = PEKO_COMPANY_DETAILS.name,
        logo: companyLogo = PEKO_COMPANY_DETAILS.logo,
        address: companyAddress = [PEKO_COMPANY_DETAILS.addressLine1, PEKO_COMPANY_DETAILS.addressLine2]
            .filter(Boolean)
            .join(' '),
        phone: companyPhone = PEKO_COMPANY_DETAILS.phone,
        email: companyEmail = PEKO_COMPANY_DETAILS.email,
        website: companyWebsite = PEKO_COMPANY_DETAILS.website
    } = templateData || {};

    const companyFirstWord = companyName.split(' ')[0];
    const companyShortName = companyFirstWord.charAt(0).toUpperCase() + companyFirstWord.slice(1).toLowerCase();

    const {
        thankYouMessage = `Thank you for choosing ${companyShortName}. Here is the payment receipt`,
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
        width: 420px;
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
        width: 420px;
        align-self: stretch;
        color: #000000;
        font-size: 19px;
        font-family: 'Roboto', sans-serif;
        font-weight: 600;
        line-height: 22.55px;
        white-space: nowrap;
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

      /* Footer — pinned to the bottom of the page, independent of content length above */
      .footer {
        width: 681px;
        left: 63px;
        bottom: 40px;
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
      <img class="watermark" src="${escapeHtml(companyLogo)}" alt="${escapeHtml(companyName)} Logo" />

      <!-- Registered trademark glyph -->
      <div class="reg-mark">®</div>

      <!-- Header -->
      <div class="header">
        <div class="company-name">${escapeHtml(companyName)}</div>
        <div class="doc-title">Payment Receipt</div>
      </div>

      <!-- Main: greeting + table -->
      <div class="main">
        <div class="greeting">${escapeHtml(thankYouMessage)}</div>

        <div class="table-wrap">
          <div class="table-outer">
            <div class="table">
              <!-- Row 1: Payment Date -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Payment Date</div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-text">${escapeHtml(paymentDateTime)}</div>
                  </div>
                </div>
              </div>

              <!-- Row 2: Receipt No. -->
              <div class="row">
                <div class="cell left">
                  <div class="cell-inner">
                    <div class="cell-text">Receipt No. </div>
                  </div>
                </div>
                <div class="cell right">
                  <div class="cell-inner">
                    <div class="cell-value">${escapeHtml(receiptNo)}</div>
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
                    <div class="cell-value">${escapeHtml(paymentMode)}</div>
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
                    <div class="cell-value">${escapeHtml(customerName)}</div>
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
                    <div class="cell-value">${escapeHtml(paymentType)} </div>
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
            >For any discrepancy in this receipt, please email us at<br
          /></span>
          <span class="support-line-2">reach@peko.one</span>
          <span class="support-line-1"> or call </span>
          <span class="support-line-2">+91 22 4893 0373.</span>
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
          ${escapeHtml(companyName)}, ${escapeHtml(companyAddress)}<br />
          ${escapeHtml(companyPhone)} | ${escapeHtml(companyEmail)} | ${escapeHtml(companyWebsite)}
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
  const {
    name: companyName = PEKO_COMPANY_DETAILS.name,
    logo: companyLogo = PEKO_COMPANY_DETAILS.logo,
    addressLine1 = PEKO_COMPANY_DETAILS.addressLine1,
    addressLine2 = PEKO_COMPANY_DETAILS.addressLine2,
    taxId = PEKO_COMPANY_DETAILS.gstin,
    phone: companyPhone = PEKO_COMPANY_DETAILS.phone,
    email: companyEmail = PEKO_COMPANY_DETAILS.email,
    website: companyWebsite = PEKO_COMPANY_DETAILS.website
  } = templateData || {};

  const {
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
    documentTitle = 'Tax Invoice',
    numberLabel = 'Invoice Number',
    againstInvoiceNumber = '',
  } = invoiceData || {};

  const {
    companyName: billedCompanyName = '',
    address: billedAddress = '',
    cityCountry: billedCityCountry = '',
    gstin: billedGstin = ''
  } = billedTo;

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
      <title>${escapeHtml(documentTitle)}</title>
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
            <h1>${escapeHtml(documentTitle)}</h1>
            <div class="company-info">
              <div class="company-name">${escapeHtml(companyName)}</div>
              <div>${escapeHtml(addressLine1)}</div>
              <div>${escapeHtml(addressLine2)}</div>
              ${taxId ? `<div class="tax-id">GSTIN ${escapeHtml(taxId)}</div>` : 'GSTIN: (Not Applicable)'}
            </div>
          </div>
          <div class="footer-logo">
            <img src="${escapeHtml(companyLogo)}" alt="${escapeHtml(companyName)} Logo" />
          </div>
        </div>

        <!-- Invoice Number -->
        <div class="invoice-number-section">
          <div class="label">${escapeHtml(numberLabel)}: ${escapeHtml(invoiceNumber)}</div>
          ${againstInvoiceNumber ? `<div class="label">Against Invoice: ${escapeHtml(againstInvoiceNumber)}</div>` : ''}
        </div>

        <!-- Dates and Billing Section -->
        <div class="dates-billing-section">
          <div class="dates-column">
            <div class="date-group">
              <div class="label">Issue Date</div>
              <div class="value">${escapeHtml(issuedDate)}</div>
            </div>
            ${placeOfSupply ? `<div class="date-group">
              <div class="label">Place of Supply</div>
              <div class="value">${escapeHtml(placeOfSupply)}</div>
            </div>` : ''}
          </div>
          <div class="billing-column">
            <div class="label">Billed to</div>
            <div class="billing-info">
              <div class="billing-company-name">${escapeHtml(billedCompanyName)}</div>
              <div>${escapeHtml(billedAddress)}</div>
              <div>${escapeHtml(billedCityCountry)}</div>
              ${billedGstin ? `<div>GSTIN ${escapeHtml(billedGstin)}</div>` : '<div>GSTIN: (Not Applicable)</div>'}
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
              <span class="value">₹ ${escapeHtml(formatNumberWithLocalString(subtotal))}</span>
            </div>${taxRows}
            <div class="totals-row total">
              <span class="label">Total</span>
              <span class="value">₹ ${escapeHtml(formatNumberWithLocalString(total))}</span>
            </div>
          </div>
        </div>


        <!-- Footer -->
        <div class="footer">
          ${escapeHtml(companyPhone)} | ${escapeHtml(companyEmail)} | ${escapeHtml(companyWebsite)}
        </div>
      </div>
    </body>
  </html>`;
};

exports.PEKO_COMPANY_DETAILS = PEKO_COMPANY_DETAILS;