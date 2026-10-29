'use strict'

const KOB_OPTIONS = [
  { label: 'Permanent/Temporary Stall holder',          keywords: ['stall holder', 'permanent', 'temporary stall'] },
  { label: 'Hawker (Itinerant / Mobile food vendor)',   keywords: ['hawker', 'itinerant', 'mobile food vendor'] },
  { label: 'Home based canteens/dabba wallas',          keywords: ['home based', 'dabba'] },
  { label: 'Petty Retailer of snacks/tea shops',        keywords: ['petty retailer', 'tea shop', 'snack'] },
  { label: 'Manufacturer/Processor',                    keywords: ['manufacturer', 'processor'] },
  { label: 'Re Packer',                                 keywords: ['repacker', 're packer', 're-packer', 'relabeller', 're-labeller', 'relabeler'] },
  { label: 'Food stalls/arrangements in Religious gatherings, fairs etc', keywords: ['food stall', 'religious', 'fair'] },
  { label: 'Milk producers (who are not member of dairy co operative society)/ milk vendor', keywords: ['milk'] },
  { label: 'Dhaba',                                     keywords: ['dhaba'] },
  { label: 'Fish/meat/poultry shop/seller',             keywords: ['fish', 'meat', 'poultry'] },
]

const KNOWN_KOB_KEYWORDS = KOB_OPTIONS.flatMap(o => o.keywords)

function kobChecked(option, kobArray) {
  return kobArray.some(v => option.keywords.some(k => v.toLowerCase().includes(k)))
}
function getOtherKOB(kobArray) {
  return kobArray.filter(v => !KNOWN_KOB_KEYWORDS.some(k => v.toLowerCase().includes(k))).join(', ')
}
function designationOption(des, option) {
  if (!des) return false
  const n = des.toLowerCase()
  if (option === 'Individual')  return n.includes('individual')
  if (option === 'Partner')     return n.includes('partner')
  if (option === 'Proprietor')  return n.includes('proprietor')
  if (option === 'Secretary')   return n.includes('secretary')
  if (option === 'Others')      return !['individual','partner','proprietor','secretary'].some(k => n.includes(k))
  return false
}
function waterOption(src, option) {
  if (!src) return false
  const n = src.toLowerCase()
  if (option === 'public')  return n.includes('public')
  if (option === 'private') return n.includes('private')
  if (option === 'other')   return !n.includes('public') && !n.includes('private')
  return false
}
function getCategoryQtyKey(cat) {
  return 'quantity' + cat.split(' ')[0]
}
function chk(v) { return v ? '&#9745;' : '&#9744;' }
function esc(v) { return v != null ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

module.exports = function fssaiBasicRegistrationTemplate(formData) {
  const s1  = formData.step1 || {}
  const s2  = formData.step2 || {}
  const s3  = formData.step3 || {}
  const kob = Array.isArray(s2.kindOfBusinessKOB) ? s2.kindOfBusinessKOB : []

  const photoUrl   = s3['Recent Passport-size Photograph'] || ''
  const otherKOB   = getOtherKOB(kob)
  const electricYes = val(s2.electricPowerUsed).toLowerCase() === 'yes'
  const electricNo  = val(s2.electricPowerUsed).toLowerCase() === 'no'

  const address = [s1.addressLine1, s1.addressLine2, s1.city, s1.stateUT, s1.pinCode]
    .filter(Boolean).map(esc).join(', ')

  const categories = Array.isArray(s2.foodCategoriesHandled)
    ? s2.foodCategoriesHandled
    : (s2.foodCategoriesHandled ? [s2.foodCategoriesHandled] : [])

  const foodRows = categories.length
    ? categories.map((cat, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(cat)}</td>
          <td>${val(s2[getCategoryQtyKey(cat)])}</td>
        </tr>`).join('')
    : Array(4).fill(`<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('')

  const photoBlock = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:7.5pt;text-align:center;color:#333;line-height:1.5;padding:6px;">Photograph<br/>of the<br/>Applicant</div>`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #000;
    background: #fff;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 20mm;
    margin: 0 auto;
  }

  /* Header */
  .hdr { text-align: center; margin-bottom: 22px; }
  .hdr .sch   { font-size: 10.5pt; font-weight: bold; line-height: 2; }
  .hdr .reg   { font-size: 10pt; line-height: 2; }
  .hdr .form  { font-size: 11pt; font-weight: bold; margin-top: 4px; line-height: 2; }
  .hdr .title { font-size: 11.5pt; font-weight: bold; margin-top: 10px; line-height: 1.6; }

  /* Photo + KOB two-column: photo LEFT, KOB RIGHT */
  .top-row { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 22px; }
  .photo-col { width: 110px; flex-shrink: 0; }
  .photo-box { width: 110px; height: 140px; border: 1px solid #000; overflow: hidden; }
  .kob-col { flex: 1; }
  .kob-title { font-weight: bold; font-size: 10.5pt; margin-bottom: 9px; }
  .kob-item { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 8px; font-size: 10pt; line-height: 1.4; }
  .cb { flex-shrink: 0; font-size: 11pt; line-height: 1.1; }

  /* Sections */
  .sec { margin-bottom: 20px; }
  .lbl { font-weight: bold; font-size: 10pt; }

  /* Underline fields */
  .ul {
    display: inline-block;
    border-bottom: 1px solid #000;
    min-height: 20px;
    padding: 2px 4px;
    vertical-align: bottom;
    font-size: 10pt;
    line-height: 1.4;
  }
  .ul-block {
    display: block;
    border-bottom: 1px solid #000;
    min-height: 20px;
    padding: 2px 4px;
    width: 100%;
    margin-top: 8px;
    font-size: 10pt;
    line-height: 1.4;
  }

  /* Checkbox rows */
  .cb-row { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 8px; font-size: 10pt; line-height: 1.4; }
  .cb-sym { flex-shrink: 0; font-size: 11pt; line-height: 1.1; }

  /* Inline row (water) */
  .inline-row { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; margin-top: 9px; font-size: 10pt; }

  /* Note text */
  .note { font-size: 8.5pt; font-style: italic; margin-top: 6px; line-height: 1.5; }

  /* Food table */
  table.ft { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 10pt; }
  table.ft th, table.ft td { border: 1px solid #000; padding: 7px 8px; vertical-align: top; }
  table.ft th { background: #f0f0f0; font-weight: bold; }
  table.ft td:first-child { width: 50px; text-align: center; }
  table.ft td:last-child  { width: 185px; }

  /* Signature */
  .sig { margin-top: 40px; text-align: right; font-size: 10pt; }
</style>
</head>
<body>
<div class="page">

  <!-- ── Header ── -->
  <div class="hdr">
    <div class="sch">Schedule 2</div>
    <div class="reg">[See Regulation 2.1.1 and Regulation 2.1.7]</div>
    <div class="form">Form &lsquo;A&rsquo;</div>
    <div class="title">Application for Registration / Renewal of Registration under Food Safety<br/>and Standards Act, 2006</div>
  </div>

  <!-- ── Photo (LEFT) + KOB (RIGHT) ── -->
  <div class="top-row">
    <div class="photo-col">
      <div class="photo-box">${photoBlock}</div>
    </div>
    <div class="kob-col">
      <div class="kob-title">Kind of business:</div>
      ${KOB_OPTIONS.map(opt => `
      <div class="kob-item">
        <span class="cb">${chk(kobChecked(opt, kob))}</span>
        <span>${esc(opt.label)}</span>
      </div>`).join('')}
      <div class="kob-item">
        <span class="cb">${chk(otherKOB.length > 0)}</span>
        <span>Other(s), please specify:<span class="ul" style="min-width:100px;margin-left:4px;">${esc(otherKOB)}</span></span>
      </div>
    </div>
  </div>

  <!-- ── (a) Name ── -->
  <div class="sec">
    <span class="lbl">(a). Name of the Applicant/Company: -</span><br/>
    <span class="ul" style="min-width:340px;margin-top:4px;">${val(s1.legalBusinessName)}</span>
  </div>

  <!-- ── (b) Designation ── -->
  <div class="sec">
    <div class="lbl">(b). Designation:</div>
    <div style="margin-top:6px;">
    ${[
      ['Individual',  'Individual'],
      ['Partner',     'Partner'],
      ['Proprietor',  'Proprietor'],
      ['Secretary',   'Secretary of dairy co-operative society.'],
      ['Others',      'Others (Please specify)'],
    ].map(([opt, label]) => {
      const checked = designationOption(s1.designation, opt)
      const knownMatched = ['Individual','Partner','Proprietor','Secretary'].some(o => designationOption(s1.designation, o))
      const isOther = opt === 'Others'
      return `<div class="cb-row">
        <span class="cb-sym">${chk(checked)}</span>
        <span>${label}${isOther && !knownMatched ? ': <span class="ul" style="min-width:120px;">' + val(s1.designation) + '</span>' : ''}</span>
      </div>`
    }).join('')}
    </div>
  </div>

  <!-- ── (c) Proof of Identity ── -->
  <div class="sec">
    <span class="lbl">(c). Proof of Identity of applicant:</span>
    <span class="ul" style="min-width:260px;margin-left:4px;">PAN: ${val(s1.signatoryPAN)}</span><br/>
    <span class="note">[Note: Please submit a copy of photo ID like Driving License, Passport, Ration Card or Election ID card]</span>
  </div>

  <!-- ── (d) Correspondence address ── -->
  <div class="sec">
    <div class="lbl">(d). Correspondence address:</div>
    <div class="ul-block">${address}</div>
    <div class="ul-block">&nbsp;</div>
    <div style="margin-top:10px;">
      Tel No:<span class="ul" style="min-width:110px;margin-right:20px;">&nbsp;</span>
      Mobile No.:<span class="ul" style="min-width:120px;">${val(s1.mobileNumber)}</span>
    </div>
    <div style="margin-top:8px;">
      Fax No.:<span class="ul" style="min-width:110px;margin-right:20px;">&nbsp;</span>
      Email:<span class="ul" style="min-width:165px;">${val(s1.emailId)}</span>
    </div>
    <div class="note">[Note: In case the number(s) are a PP or common number(s), please specify the name of the contact person as well]</div>
  </div>

  <!-- ── (e) Premises address ── -->
  <div class="sec">
    <div class="lbl">(e). Area or Location where food business is to be conducted/Address of the premises:</div>
    <div class="ul-block">${address}</div>
    <div class="ul-block">&nbsp;</div>
  </div>

  <!-- ── (f) Food items ── -->
  <div class="sec">
    <div class="lbl">(f). Description of the food items proposed to be Manufactured or sold:</div>
    <table class="ft">
      <thead>
        <tr>
          <th>S.No.</th>
          <th>Name of Food category</th>
          <th>Quantity in Kg per day or M.T. per annum</th>
        </tr>
      </thead>
      <tbody>${foodRows}</tbody>
    </table>
    <div class="note" style="margin-top:4px;">Please attach separate sheet if required</div>
  </div>

  <!-- ── (g) Turnover ── -->
  <div class="sec">
    <div class="lbl">(g). Total Annual turnover from the food business, if existing, along with any supporting document(s) showing proof of income (*In case of renewal):</div>
    <div class="ul-block">${val(s2.premisesCapacityTurnover)}</div>
  </div>

  <!-- ── (h) Date of start ── -->
  <div class="sec">
    <span class="lbl">(h) In case of new business - intended date of start:</span>
    <span class="ul" style="min-width:155px;margin-left:4px;">${val(s2.dateOfCommencement)}</span>
  </div>

  <!-- ── (i) Seasonal ── -->
  <div class="sec">
    <span class="lbl">(i) In case of seasonal business, state the opening and closing period of the year:</span>
    <span class="ul" style="min-width:130px;margin-left:4px;">${val(s2.isSeasonalBusiness, '').toLowerCase() === 'yes' ? val(s2.seasonalPeriod) : ''}</span>
  </div>

  <!-- ── (j) Water supply ── -->
  <div class="sec">
    <div class="lbl">(j) Source of water supply:</div>
    <div class="inline-row">
      <span>${chk(waterOption(s2.sourceOfWaterSupply,'public'))}&nbsp;&nbsp;Public supply</span>
      <span>${chk(waterOption(s2.sourceOfWaterSupply,'private'))}&nbsp;&nbsp;Private supply</span>
      <span>${chk(waterOption(s2.sourceOfWaterSupply,'other'))}&nbsp;&nbsp;Any other source</span>
    </div>
  </div>

  <!-- ── (k) Electric power ── -->
  <div class="sec">
    <div class="lbl">(k) Whether any electric power is used in manufacture of the food items:</div>
    <div style="margin-top:9px;">
      <div class="cb-row"><span class="cb-sym">${chk(electricYes)}</span><span>Yes</span></div>
      <div class="cb-row"><span class="cb-sym">${chk(electricNo)}</span><span>No</span></div>
    </div>
    <div style="margin-top:8px;">
      If yes, please state the exact HP used or sanctioned Electricity load:
      <span class="ul" style="min-width:130px;margin-left:4px;">${electricYes ? val(s2.electricPowerLoad) : ''}</span>
    </div>
  </div>

  <!-- ── (l) Fee ── -->
  <div class="sec">
    <div class="lbl">(l) I/We have forwarded a sum of Rs&hellip;&hellip;&hellip;towards registration fees according to the provision of the Food Safety and Standards (Licensing and Registration) Regulations, 2011 vide:</div>
    <div style="margin-top:9px;">
      <div class="cb-row"><span class="cb-sym">${chk(false)}</span><span>Demand Draft no. (payable to &mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;)</span></div>
      <div class="cb-row"><span class="cb-sym">${chk(false)}</span><span>Cash</span></div>
    </div>
  </div>

  <div class="sig">(Signature of the Applicant)</div>

</div>
</body>
</html>`
}
