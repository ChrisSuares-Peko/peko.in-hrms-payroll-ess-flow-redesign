'use strict'

function esc(v) { return v != null ? String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

function formatDate(d) {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return esc(d)
}

function charBoxes(value, count) {
  const chars = (value || '').toUpperCase().replace(/\s+/g, ' ').split('')
  let html = ''
  for (let i = 0; i < count; i++) {
    html += `<span class="cb">${chars[i] ? esc(chars[i]) : '&nbsp;'}</span>`
  }
  return html
}

function tickBox(checked) {
  return `<span class="tick-box">${checked ? '&#10003;' : '&nbsp;'}</span>`
}

function getCategorySection(category) {
  if (!category) return 'c'
  const c = category.toLowerCase()
  if (c.includes('branch') && (c.includes('firm') || c.includes('aop') || c.includes('association') || c.includes('body of'))) return 'h'
  if (c.includes('branch') && (c.includes('individual') || c.includes('huf') || c.includes('hindu'))) return 'f'
  if (c.includes('branch') && (c.includes('company') || c.includes('corporation'))) return 'd'
  if (c.includes('central government') || c.includes('state government') || c.includes('local authority')) return 'a'
  if (c.includes('statutory') || c.includes('autonomous')) return 'b'
  if (c.includes('company') || c.includes('corporation')) return 'c'
  if (c.includes('individual') || c.includes('huf') || c.includes('hindu undivided')) return 'e'
  if (c.includes('firm') || c.includes('association') || c.includes('body of') || c.includes('artificial juridical')) return 'g'
  return 'c'
}

module.exports = function tanRegistrationTemplate(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}

  const section = getCategorySection(s1.categoryOfDeductor)
  const cat = val(s1.categoryOfDeductor).toLowerCase()

  const isIndian  = val(s2.nationalityOfDeductor).toLowerCase() === 'indian'
  const isForeign = val(s2.nationalityOfDeductor).toLowerCase() === 'foreign'

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 12mm 16mm; margin: 0 auto; }

  .site   { text-align: center; font-size: 8pt; color: #555; margin-bottom: 8px; }
  .hdr    { text-align: center; margin-bottom: 12px; }
  .hdr .fn  { font-size: 12pt; font-weight: bold; }
  .hdr .ref { font-size: 8.5pt; font-style: italic; margin-top: 2px; }
  .hdr .ttl { font-size: 9pt; margin-top: 4px; line-height: 1.5; }

  .dash  { border-top: 1px dashed #000; margin: 5px 0; }

  table.ao { border-collapse: collapse; margin: 8px 0 12px 0; }
  table.ao td { border: 1px solid #000; padding: 4px 8px; font-size: 9pt; min-width: 160px; }
  table.ao td:first-child { min-width: 200px; }

  .preamble { font-size: 9pt; line-height: 1.7; margin-bottom: 10px; }

  .sno { font-weight: bold; font-size: 9.5pt; margin: 10px 0 5px 0; }
  .note-i { font-style: italic; font-size: 8.5pt; }
  .lbl { font-weight: bold; }

  /* character boxes */
  .cb {
    display: inline-block;
    width: 15px; height: 17px;
    border: 1px solid #000;
    text-align: center;
    line-height: 17px;
    font-size: 8pt;
    margin-right: 1px;
    vertical-align: middle;
  }

  /* tick box */
  .tick-box {
    display: inline-block;
    width: 13px; height: 13px;
    border: 1px solid #000;
    text-align: center;
    line-height: 13px;
    font-size: 9pt;
    vertical-align: middle;
  }

  .name-row { display: flex; align-items: flex-start; margin-bottom: 6px; gap: 8px; }
  .name-lbl { width: 210px; flex-shrink: 0; font-size: 9pt; line-height: 1.4; }
  .name-val { flex: 1; }

  .tick-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 6px; font-size: 9pt; }
  .tick-item { display: flex; align-items: center; gap: 4px; }

  .subsec { margin: 6px 0 10px 14px; }
  .subsec-ttl { font-weight: bold; margin-bottom: 6px; font-size: 9pt; }

  .ul  { display: inline-block; border-bottom: 1px solid #000; min-width: 120px; min-height: 16px; padding: 1px 3px; vertical-align: bottom; }
  .ulb { display: block; border-bottom: 1px solid #000; min-height: 16px; padding: 1px 3px; margin-top: 3px; width: 100%; }

  .addr-row { display: flex; align-items: flex-start; margin-bottom: 5px; gap: 8px; font-size: 9pt; }
  .addr-lbl { width: 210px; flex-shrink: 0; }

  .pin-box { display: inline-block; width: 18px; height: 18px; border: 1px solid #000; text-align: center; line-height: 18px; font-size: 9pt; margin-right: 2px; vertical-align: middle; }

  .cbr { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; font-size: 9pt; }

  .verification { margin-top: 18px; font-size: 9pt; line-height: 1.6; }
  .ver-line { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; vertical-align: bottom; }
  .sig-right { text-align: right; margin-top: 36px; }
  .sig-label { border-top: 1px solid #000; display: inline-block; padding-top: 4px; min-width: 160px; text-align: center; font-size: 9pt; }
</style>
</head>
<body>
<div class="page">

  <div class="site">visit www.challan.in</div>

  <!-- Header -->
  <div class="hdr">
    <div class="fn">Form No. 49B</div>
    <div class="ref">[See section 203A and rule 114A]</div>
    <div class="ttl">Form of application for allotment of Tax Deduction and Collection Account Number under Section 203A of the Income Tax Act, 1961</div>
  </div>

  <div style="font-size:9pt; margin-bottom:6px;">To,<br/>Assessing Officer (TDS / TCS)</div>
  <div class="dash"></div>
  <div class="dash" style="margin-bottom:10px;"></div>

  <!-- AO Code -->
  <table class="ao">
    <tr><td colspan="2"><strong>Assessing Officer Code (TDS / TCS)</strong></td></tr>
    <tr><td>Area code</td><td>${val(s2.aoCode)}</td></tr>
    <tr><td>AO Type</td><td>${val(s2.aoType)}</td></tr>
    <tr><td>Range Code</td><td>${val(s2.aoRangeCode)}</td></tr>
    <tr><td>AO Number</td><td>${val(s2.aoNumber)}</td></tr>
  </table>

  <!-- Preamble -->
  <div class="preamble">
    Sir,<br/><br/>
    &emsp;Whereas *I / we *am / are liable to *deduct / collect or deduct tax and collect tax in accordance with Chapter XVII under the heading *&lsquo;B. &ndash; Deduction at source&rsquo; or &lsquo;BB. -Collection at source&rsquo; of the Income-tax Act, 1961;<br/><br/>
    &emsp;And whereas no Tax Deduction Account Number / Tax Collection Account Number or Tax Deduction Account Number and Tax Collection Account Number has been allotted to *me/us;<br/><br/>
    &emsp;*I / We give below the necessary particulars:<br/><br/>
    &emsp;<em>[ Please refer to instructions before filling up the form ]</em>
  </div>

  <!-- Section 1 -->
  <div class="sno">1 &nbsp;<span class="lbl">Name -</span> <span class="note-i">(Fill only one of the columns &lsquo;a&rsquo; to &lsquo;h&rsquo;, whichever is applicable.)</span></div>

  <!-- (a) Central / State Government -->
  <div class="subsec">
    <div class="subsec-ttl">(a) Central / State Government:</div>
    <div class="tick-row">
      <span>Tick the appropriate entry</span>
      <span class="tick-item">${tickBox(section === 'a' && cat.includes('central government'))} Central Government</span>
      <span class="tick-item">${tickBox(section === 'a' && cat.includes('state government'))} State Government</span>
      <span class="tick-item">${tickBox(section === 'a' && cat.includes('local authority') && cat.includes('central'))} Local Authority (Central Govt.)</span>
    </div>
    <div class="tick-row">
      <span class="tick-item">${tickBox(section === 'a' && cat.includes('local authority') && cat.includes('state'))} Local Authority (State Govt.)</span>
    </div>
    <div class="name-row"><span class="name-lbl">Name of Office</span><span class="name-val">${charBoxes(section === 'a' ? '' : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name of Organisation</span><span class="name-val">${charBoxes(section === 'a' ? s1.legalBusinessName : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name of Department</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name of Ministry</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Designation of the person responsible for * making payment / collecting tax</span><span class="name-val">${charBoxes(section === 'a' ? s1.designation : '', 25)}</span></div>
  </div>

  <!-- (b) Statutory / Autonomous Bodies -->
  <div class="subsec">
    <div class="subsec-ttl">(b) Statutory / Autonomous Bodies :</div>
    <div class="tick-row">
      <span>Tick the appropriate entry</span>
      <span class="tick-item">${tickBox(section === 'b' && cat.includes('statutory'))} Statutory Body</span>
      <span class="tick-item">${tickBox(section === 'b' && cat.includes('autonomous'))} Autonomous Body</span>
    </div>
    <div class="name-row"><span class="name-lbl">Name of Office</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name of Organisation</span><span class="name-val">${charBoxes(section === 'b' ? s1.legalBusinessName : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Designation of the person responsible for * making payment / collecting tax</span><span class="name-val">${charBoxes(section === 'b' ? s1.designation : '', 25)}</span></div>
  </div>

  <!-- (c) Company -->
  <div class="subsec">
    <div class="subsec-ttl">(c) Company (See Note 1) :</div>
    <div class="tick-row">
      <span>Tick the appropriate entry</span>
      <span class="tick-item">${tickBox(section === 'c' && (cat.includes('government company') || cat.includes('corporation')) && cat.includes('central'))} Government Company / Corporation established by a Central Act</span>
      <span class="tick-item">${tickBox(section === 'c' && (cat.includes('government company') || cat.includes('corporation')) && cat.includes('state'))} Government Company / Corporation established by a State Act</span>
      <span class="tick-item">${tickBox(section === 'c' && cat.includes('other company'))} Other Company</span>
    </div>
    <div class="tick-row">
      <span>Title (M/s)</span>
      ${tickBox(section === 'c')}
      <span style="margin-left:4px;">(tick if applicable)</span>
    </div>
    <div class="name-row"><span class="name-lbl">Name of Company</span><span class="name-val">${charBoxes(section === 'c' ? s1.legalBusinessName : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Designation of the person responsible for * making payment / collecting tax</span><span class="name-val">${charBoxes(section === 'c' ? s1.designation : '', 25)}</span></div>
  </div>

  <!-- (d) Branch/Division of a Company -->
  <div class="subsec">
    <div class="subsec-ttl">(d) Branch/Division of a Company:</div>
    <div class="tick-row">
      <span>Tick the appropriate entry</span>
      <span class="tick-item">${tickBox(section === 'd' && cat.includes('central'))} Government Company / Corporation established by a Central Act</span>
      <span class="tick-item">${tickBox(section === 'd' && cat.includes('state'))} Government Company / Corporation established by a State Act</span>
      <span class="tick-item">${tickBox(section === 'd' && cat.includes('other'))} Other Company</span>
    </div>
    <div class="tick-row">
      <span>Title (M/s)</span>
      ${tickBox(section === 'd')}
      <span style="margin-left:4px;">(tick if applicable)</span>
    </div>
    <div class="name-row"><span class="name-lbl">Name of Company</span><span class="name-val">${charBoxes(section === 'd' ? s1.legalBusinessName : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Designation of the person responsible for * making payment / collecting tax</span><span class="name-val">${charBoxes(section === 'd' ? s1.designation : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name of Division</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name/Location of Branch</span><span class="name-val">${charBoxes('', 25)}</span></div>
  </div>

  <!-- (e) Individual / HUF -->
  <div class="subsec">
    <div class="subsec-ttl">(e) Individual / Hindu Undivided Family (Karta) - (See Note 2) :</div>
    <div class="tick-row">
      <span>Tick the appropriate entry</span>
      <span class="tick-item">${tickBox(section === 'e' && cat.includes('individual'))} Individual</span>
      <span class="tick-item">${tickBox(section === 'e' && (cat.includes('huf') || cat.includes('hindu')))} Hindu Undivided Family</span>
    </div>
    <div class="name-row">
      <span class="name-lbl">Last Name / Surname</span>
      <span class="name-val">${charBoxes(section === 'e' ? (s1.legalBusinessName || '').split(' ').pop() : '', 25)}</span>
    </div>
    <div class="tick-row">
      <span>Title (tick the appropriate entry for individual)</span>
      <span class="tick-item">${tickBox(false)} Shri</span>
      <span class="tick-item">${tickBox(false)} Smt.</span>
      <span class="tick-item">${tickBox(false)} Kumari</span>
    </div>
    <div class="name-row"><span class="name-lbl">First Name</span><span class="name-val">${charBoxes(section === 'e' ? (s1.legalBusinessName || '').split(' ')[0] : '', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Middle Name</span><span class="name-val">${charBoxes('', 25)}</span></div>
  </div>

  <!-- (f) Branch of Individual / HUF -->
  <div class="subsec">
    <div class="subsec-ttl">(f) Branch of Individual Business (Sole proprietorship concern) / Hindu Undivided Family (Karta)</div>
    <div class="tick-row">
      <span>Tick the appropriate entry</span>
      <span class="tick-item">${tickBox(section === 'f' && cat.includes('individual'))} Branch of Individual business</span>
      <span class="tick-item">${tickBox(section === 'f' && (cat.includes('huf') || cat.includes('hindu')))} Branch of Hindu Undivided Family</span>
    </div>
    <div class="name-row"><span class="name-lbl">Individual/ Hindu Undivided Family (Karta):</span><span class="name-val">${charBoxes(section === 'f' ? s1.legalBusinessName : '', 25)}</span></div>
    <div class="tick-row">
      <span>Title (tick the appropriate entry for individual)</span>
      <span class="tick-item">${tickBox(false)} Shri</span>
      <span class="tick-item">${tickBox(false)} Smt.</span>
      <span class="tick-item">${tickBox(false)} Kumari</span>
    </div>
    <div class="name-row"><span class="name-lbl">Last Name / Surname</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">First Name</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Middle Name</span><span class="name-val">${charBoxes('', 25)}</span></div>
    <div class="name-row"><span class="name-lbl">Name / Location of branch</span><span class="name-val">${charBoxes('', 25)}</span></div>
  </div>

  <!-- (g) Firm / AOP / BOI -->
  <div class="subsec">
    <div class="subsec-ttl">(g) Firm / Association of Persons / Association of Persons (Trusts) / Body of Individuals / Artificial Juridical Person (See Note 3) :</div>
    <div class="name-row"><span class="name-lbl">Name</span><span class="name-val">${charBoxes(section === 'g' ? s1.legalBusinessName : '', 25)}</span></div>
  </div>

  <!-- (h) Branch of Firm / AOP / BOI -->
  <div class="subsec">
    <div class="subsec-ttl">(h) Branch of Firm / Association of Persons / Association of Persons (Trusts) / Body of Individuals / Artificial Juridical Person:</div>
    <div class="name-row">
      <span class="name-lbl">Name of Firm / Association of Persons / Association of Persons (Trusts) / Body of Individuals / Artificial Juridical Person:</span>
      <span class="name-val">${charBoxes(section === 'h' ? s1.legalBusinessName : '', 25)}</span>
    </div>
    <div class="name-row"><span class="name-lbl">Name / Location of branch</span><span class="name-val">${charBoxes('', 25)}</span></div>
  </div>

  <!-- Section 2: Address -->
  <div class="sno">2 &nbsp;<span class="lbl">Address</span></div>
  <div style="margin-left:14px; margin-top:6px;">
    <div class="addr-row"><span class="addr-lbl">Flat / Door / Block No.</span><span>${charBoxes(s1.addressLine1, 25)}</span></div>
    <div class="addr-row"><span class="addr-lbl">Name of Premises / Building / Village</span><span>${charBoxes('', 25)}</span></div>
    <div class="addr-row"><span class="addr-lbl">Road / Street / Lane / Post Office</span><span>${charBoxes(s1.addressLine2, 25)}</span></div>
    <div class="addr-row"><span class="addr-lbl">Area / Locality / Taluka / Sub-Division</span><span>${charBoxes('', 25)}</span></div>
    <div class="addr-row"><span class="addr-lbl">Town / City / District</span><span>${charBoxes(s1.city, 25)}</span></div>
    <div class="addr-row"><span class="addr-lbl">State / Union Territory</span><span>${charBoxes(s1.stateUT, 25)}</span></div>
    <div class="addr-row">
      <span class="addr-lbl">PIN code</span>
      <span>${(val(s1.pinCode) || '      ').split('').slice(0, 6).map(c => `<span class="pin-box">${c || '&nbsp;'}</span>`).join('')}</span>
    </div>
    <div class="addr-row">
      <span class="addr-lbl">Telephone No.</span>
      <span>STD Code&nbsp;${charBoxes('', 4)}&nbsp;&nbsp;Phone No.&nbsp;${charBoxes('', 8)}</span>
    </div>
    <div class="addr-row">
      <span class="addr-lbl">e-mail IDs &nbsp;&nbsp; a)</span>
      <span>${charBoxes(s1.emailId, 25)}</span>
    </div>
    <div class="addr-row" style="margin-top:4px;">
      <span class="addr-lbl">&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; b)</span>
      <span>${charBoxes('', 25)}</span>
    </div>
  </div>

  <!-- Section 3: Nationality -->
  <div class="sno" style="margin-top:10px;">3 &nbsp;<span class="lbl">Nationality of Deductor (Tick the appropriate entry)</span></div>
  <div style="margin-left:14px; margin-top:6px;">
    <div class="cbr">${tickBox(isIndian)}&nbsp; Indian</div>
    <div class="cbr">${tickBox(isForeign)}&nbsp; Foreign</div>
  </div>

  <!-- Section 4: PAN -->
  <div class="sno" style="margin-top:10px;">4 &nbsp;<span class="lbl">Permanent Account Number (PAN) -</span> <span class="note-i">(specify wherever applicable)</span></div>
  <div style="margin-left:14px; margin-top:6px;">${charBoxes(s1.panOfDeductor, 10)}</div>

  <!-- Section 5: Existing TAN -->
  <div class="sno" style="margin-top:10px;">5 &nbsp;<span class="lbl">Existing Tax Deduction Account Number</span> <span class="note-i">(if any)</span></div>
  <div style="margin-left:14px; margin-top:6px;">${charBoxes(s2.existingTAN, 10)}</div>

  <!-- Section 6: Existing TCS Number -->
  <div class="sno" style="margin-top:10px;">6 &nbsp;<span class="lbl">Existing Tax Collection Account Number</span> <span class="note-i">(if any)</span></div>
  <div style="margin-left:14px; margin-top:6px;">${charBoxes('', 10)}</div>

  <!-- Section 7: Date + Signature -->
  <div class="sno" style="margin-top:10px;">7 &nbsp;<span class="lbl">Date (DD-MM-YYYY)</span></div>
  <div style="margin-left:14px; margin-top:6px; display:flex; justify-content:space-between; align-items:flex-end;">
    <div>
      ${charBoxes(formatDate(s2.dateOfDeduction).split('-')[0], 2)}
      <span style="font-size:11pt; margin:0 2px;">-</span>
      ${charBoxes(formatDate(s2.dateOfDeduction).split('-')[1], 2)}
      <span style="font-size:11pt; margin:0 2px;">-</span>
      ${charBoxes(formatDate(s2.dateOfDeduction).split('-')[2], 4)}
    </div>
    <div class="sig-right">
      <div style="border:1px solid #000; width:160px; height:50px; display:flex; align-items:center; justify-content:center; font-size:8.5pt; color:#555;">Signed (Applicant)</div>
    </div>
  </div>

  <!-- Verification -->
  <div class="verification" style="margin-top:18px;">
    <div style="text-align:center; font-weight:bold; font-size:10pt; margin-bottom:10px;">Verification</div>
    <div>
      *I / We, <span class="ver-line">${val(s1.signatoryFullName)}</span> in my / our capacity as <span class="ver-line">${val(s1.designation)}</span>
    </div>
    <div style="margin-top:6px;">
      do hereby declare that what is stated above is true to the best of my / our knowledge and belief.
    </div>
    <div style="margin-top:14px; display:flex; align-items:flex-end; gap:8px;">
      <span>Verified today the</span>
      ${charBoxes(formatDate(s2.dateOfDeduction).split('-')[0], 2)}
      <span style="font-size:11pt;">-</span>
      ${charBoxes(formatDate(s2.dateOfDeduction).split('-')[1], 2)}
      <span style="font-size:11pt;">-</span>
      ${charBoxes(formatDate(s2.dateOfDeduction).split('-')[2], 4)}
    </div>
    <div style="margin-top:6px; font-size:8.5pt;">d&nbsp;&nbsp;d&emsp;&emsp;m&nbsp;&nbsp;m&emsp;&emsp;y&nbsp;&nbsp;y&nbsp;&nbsp;y&nbsp;&nbsp;y</div>
    <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:flex-end;">
      <div>at&nbsp;&nbsp;<span class="ver-line" style="min-width:200px;">&nbsp;</span></div>
      <div style="text-align:center;">
        <div style="border-bottom:1px dashed #000; min-width:220px; height:40px;"></div>
        <div style="font-size:8.5pt; margin-top:3px;">(Signature / Left Thumb Impression of Applicant)</div>
      </div>
    </div>
  </div>

  <!-- Notes -->
  <div style="margin-top:14px; font-size:8pt; line-height:1.6;">
    <div><strong>Notes:</strong></div>
    <div>1&emsp;This column is applicable only if a single TAN is applied for the whole company. If separate TANs are applied for different divisions/branches, please fill details in (d).</div>
    <div>2&emsp;For branch of Individual business/Hindu Undivided Family, please fill details in (f).</div>
    <div>3&emsp;For branch of firm/Association Of Persons/Association Of Persons (Trust) / Body Of Individuals/Artificial Juridical Person, please fill details in (h).</div>
    <div>4&emsp;* Delete whichever is inapplicable.</div>
  </div>

  <div class="site" style="margin-top:14px;">visit www.challan.in</div>

</div>
</body>
</html>`
}
