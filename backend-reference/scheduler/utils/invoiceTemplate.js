const { formatNumberWithLocalString } = require('./formatter');

exports.invoicingTemplete = (data) => {
  let {recipientDetails, productDetails, invoiceDetails, paymentDetails} = data
  recipientDetails = JSON.parse(recipientDetails)
  productDetails = JSON.parse(productDetails)
  invoiceDetails = JSON.parse(invoiceDetails)
  paymentDetails = JSON.parse(paymentDetails)
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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
  height: 3rem;
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
                ${
                  invoiceDetails.logo != '' ?
                  `<img src="${invoiceDetails.logo}" class="h-12" />` : ``
                }
                </div>
              </td>

              <td class="align-top">
                <div class="text-sm">
                  <table class="border-collapse border-spacing-0">
                    <tbody>
                      <tr>
                        <td class="border-r pr-4">
                            <p class="font-bold" style="font-size: 35px; text-align: end;"> ${invoiceDetails.invoiceName}</p>
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
              <td class=" align-top" style="width: 30%;">
                <div class="text-sm text-neutral-600">
                  <p class="font-bold">From</p>
                  <p class="font-bold" style="margin-top: 10px;">${recipientDetails.billerName}</p>
                  <p>${recipientDetails.billerCompanyAddress}</p>
                  <p>${recipientDetails.billerPhone}</p>
                  ${recipientDetails.billerGST !=='' ? `<p>${recipientDetails.billerGST}</p>`:``}
                  <p class="font-bold">${recipientDetails.billerEmail}</p>
                </div>
              </td>
              <td class=" align-top " style="width: 30%;">
                <div class="text-sm text-neutral-600">
                    <p class="font-bold">To</p>
                    <p class="font-bold" style="margin-top: 10px;">${recipientDetails.customerName}</p>
                    <p>${recipientDetails.customerAddress}</p>
                    <p>${recipientDetails.customerPhone}</p>
                    <p class="font-bold">${recipientDetails.customerEmail}</p>
                </div>
              </td>
              <td class=" align-top " style="width: 40%;">
                <div class="text-sm text-neutral-600">
                  <p style="margin-top: 25px;" class="font-bold">Invoice No: ${invoiceDetails.invoiceNo}</p>
                  <table class="w-full border-collapse border-spacing-0">
                <tbody>
                  <tr>
                    <td class=" align-top">
                        <div style="margin-top: 10px;">
                            <p>Invoice Date:</p>
                            <p>Due Date:</p>
                        </div>
                    </td>
      
                    <td class="align-top">
                        <div style="margin-top: 10px; ">
                            <p class="font-bold">${new Date(invoiceDetails.invoiceDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} </p>
                         ${invoiceDetails.dueDate != '' ? `<p class="font-bold"> ${new Date(invoiceDetails.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} </p>`: ``}
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

      <div class="px-14 pb-3 text-sm text-neutral-700">
        <table class="w-full border-collapse border-spacing-0">
          <thead>
            <tr>
              <td class="border-b-2 border-main p-3 pl-3 font-bold text-white bg-main1 ">No.</td>
              <td class="border-b-2 border-main p-3 pl-2 font-bold text-white bg-main1 ">Description</td>
              <td class="border-b-2 border-main p-3 pl-2 text-center font-bold text-white bg-main1 ">Quantity</td>
              <td class="border-b-2 border-main p-3 pl-2 text-center font-bold text-white bg-main1 ">Price</td>
              <td class="border-b-2 border-main p-3 pl-2 pr-3 text-right font-bold text-white bg-main1 ">Amount</td>
            </tr>
          </thead>
          <tbody>
            ${productDetails
              .map(
                (product, index) => `
                                  <tr style="border-bottom: 1px solid #E7EBF4;">
                                      <td class="border-b py-3 pl-3 font-bold">${index + 1}</td>
                                      <td class="border-b py-3 pl-2 font-bold">${product.item}</td>
                                      <td class="border-b py-3 pl-2 text-center font-bold">${product.quantity}</td>
                                      <td class="border-b py-3 pl-2 text-center font-bold">₹ ${formatNumberWithLocalString(product.price)}</td>
                                      <td class="border-b py-3 pl-2 pr-3 text-right font-bold">₹ ${formatNumberWithLocalString(parseFloat(product.price)*parseFloat(product.quantity))}</td>
                                  </tr>
                                  `
              )
              .join("")}
            
            <tr>
              <td colspan="7">
                <table class="w-full border-collapse border-spacing-0">
                  <tbody>
                    <tr>
                      <td class="w-full"></td>
                      <td>
                        <table class="w-full border-collapse border-spacing-0">
                          <tbody>
                            <tr style="border-bottom: 1px solid #E7EBF4;">
                              <td class="border-b p-3">
                                <div class="whitespace-nowrap text-main">Sub Total:</div>
                              </td>
                              <td class="border-b p-3 text-right">
                                <div class="whitespace-nowrap  text-main">₹ ${formatNumberWithLocalString(paymentDetails.subTotal)}</div>
                              </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #E7EBF4;">
                              <td class="p-3">
                                <div class="whitespace-nowrap text-main">GST:</div>
                              </td>
                              <td class="p-3 text-right">
                                <div class="whitespace-nowrap  text-main">₹ ${formatNumberWithLocalString(paymentDetails.gst)}</div>
                              </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #E7EBF4;">
                              <td class="p-3">
                                <div class="whitespace-nowrap text-main">Discount:</div>
                              </td>
                              <td class="p-3 text-right">
                                <div class="whitespace-nowrap  text-main">₹ ${formatNumberWithLocalString(paymentDetails.discount)}</div>
                              </td>
                            </tr>
                            ${paymentDetails.shipping != '' ?
                           `<tr style="border-bottom: 1px solid #E7EBF4;">
                              <td class="p-3">
                                <div class="whitespace-nowrap text-main">Shipping:</div>
                              </td>
                              <td class="p-3 text-right">
                                <div class="whitespace-nowrap  text-main">₹ ${paymentDetails.shipping}</div>
                              </td>
                            </tr>`: ``
                            }
                            <tr style="border-bottom: 1px solid #E7EBF4;">
                              <td class="p-3">
                                <div class="whitespace-nowrap text-main">Total:</div>
                              </td>
                              <td class="p-3 text-right">
                                <div class="whitespace-nowrap  text-main">₹ ${formatNumberWithLocalString(paymentDetails.total)}</div>
                              </td>
                            </tr>
                            <tr>
                            ${ paymentDetails?.amountPaid != '' ?
                            `<tr style="border-bottom: 1px solid #E7EBF4;">
                               <td class="p-3">
                                 <div class="whitespace-nowrap text-main">Amount Paid:</div>
                               </td>
                               <td class="p-3 text-right">
                                 <div class="whitespace-nowrap  text-main">₹ ${formatNumberWithLocalString(paymentDetails?.amountPaid)}</div>
                               </td>
                             </tr>`: ``
                             }
                              <td class="bg-main2 p-3">
                                <div class="whitespace-nowrap font-bold text-main">Amount Due:</div>
                              </td>
                              <td class="bg-main2 p-3 text-right">
                                <div class="whitespace-nowrap font-bold font-bold text-main">₹ ${formatNumberWithLocalString(paymentDetails.amountDue)}</div>
                              </td>
                            </tr>
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
      ${data.termsConditions ?
        `<div class="px-14 py-3 text-sm text-neutral-700">
        <p class="text-main font-bold">Terms & Conditions</p>
        <p>${data.termsConditions}.</p>
      </div>`:``
      }
      ${JSON.parse(data.comments) ?
        `<div class="px-14 py-3 text-sm text-neutral-700">
        <p class="text-main font-bold">Notes</p>
        <p>${JSON.parse(data.comments)}.</p>
      </div>`:``
      }
     

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

    const {
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
              <td>${item.description || ''}</td>
              <td>${item.quantity || ''}</td>
              <td>${item.price ? formatNumberWithLocalString(item.price) : ''}</td>
              <td>${item.taxableAmount ? formatNumberWithLocalString(item.taxableAmount) : ''}</td>
              <td>${item.vat ? formatNumberWithLocalString(item.vat) : ''}</td>
              <td>${item.lineTotal ? formatNumberWithLocalString(item.lineTotal) : ''}</td>
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
              <span class="label">${line.label || ''}</span>
              <span class="value">₹ ${formatNumberWithLocalString(line.amount)}</span>
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
