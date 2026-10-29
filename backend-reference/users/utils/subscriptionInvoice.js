exports.subscriptionInvoiceTemplete = (data, userData) => {

  let addressLine3 = ''
  let city = ''
  let country = ''

  if (userData.city != '' && userData.city != null) {
    city = userData.city
  }
  if (userData.country != '' && userData.country != null) {
    country = userData.country
  }
  if (city != '' && country != '') {
    addressLine3 = city + ', ' + country + '.'
  }
  const billingType = data.billingType.charAt(0).toUpperCase() + data.billingType.slice(1).toLowerCase();

  // For addon subscriptions, show service name + units instead of plan package name
  const serviceProvider = data.serviceOperator?.serviceProvider;
  const isAddon = data.isCustom && data.serviceOperatorId;
  const descriptionLabel = isAddon
    ? `Add On (${serviceProvider || data.package.packageName}) - ${data.maxLimit} unit${data.maxLimit > 1 ? 's' : ''} ${billingType}`
    : `${data.package.packageName} ${billingType}`;
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
                      <img src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09" class="h-12" />
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
                      <p>${userData.mobile}</p>
                      ${addressLine3 != '' ? `<p>${addressLine3}</p>` : ``}
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
                                <p class="text-left">Payment Reference No:</p>
                                <p class="text-left">Invoice Date:</p>
                                <p class="text-left">Transaction ID:</p>
                            </div>
                        </td>
          
                        <td class="align-top">
                            <div style="margin-top: 10px;padding-left: 10px;">
                                <p class="font-bold text-right">${data.subscriptionPaymentRefId}</p>
                            <p class="font-bold text-right">${new Date(data.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} </p>
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
                  <td class="border-b-2 border-main p-3 pl-2 pr-3 text-right font-bold text-white bg-main1 ">Amount</td>
                </tr>
              </thead>
              <tbody>
              
                                      <tr style="border-bottom: 1px solid #E7EBF4;">
                                          <td class="border-b py-3 pl-2 font-bold text-main">${descriptionLabel}</td>
                                          <td class="border-b py-3 pl-2 pr-3 text-right font-bold text-main">₹ ${parseFloat(data.subscriptionPrice).toFixed(2)}</td>
                                      </tr>       
                                      <tr style="border-bottom: 1px solid #E7EBF4;">
                                    ${parseFloat(data.discount) > 0 ? `
                                        <tr>
                                          <td class="border-b py-3 pl-2 font-bold text-main">Discount</td>
                                          <td class="border-b py-3 pl-2 pr-3 text-right font-bold text-main">
                                            ₹ ${parseFloat(data.discount).toFixed(2)}
                                          </td>
                                        </tr>
                                      ` : ''}                                      
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
                                <tr>
                                  <td class="border-b p-3">
                                    <div class="whitespace-nowrap text-main">Sub Total:</div>
                                  </td>
                                  <td class="border-b p-3 text-right">
                                    <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.taxAmount != null ? data.taxableAmount : data.subscriptionAmountPaid).toFixed(2)}</div>
                                  </td>
                                </tr>
                                ${data.taxAmount != null && parseFloat(data.taxAmount) > 0 ? `
                                <tr>
                                  <td class="border-b p-3">
                                    <div class="whitespace-nowrap text-main">GST${parseFloat(data.taxRate) > 0 ? ` (${parseFloat(data.taxRate)}%)` : ''}:</div>
                                  </td>
                                  <td class="border-b p-3 text-right">
                                    <div class="whitespace-nowrap text-main">₹ ${parseFloat(data.taxAmount).toFixed(2)}</div>
                                  </td>
                                </tr>
                                ` : ''}
                                <tr>
                                  <td class="bg-main2 p-3">
                                    <div class="whitespace-nowrap font-bold text-main">Total:</div>
                                  </td>
                                  <td class="bg-main2 p-3 text-right">
                                    <div class="whitespace-nowrap font-bold text-main">₹ ${parseFloat(data.subscriptionAmountPaid).toFixed(2)}</div>
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