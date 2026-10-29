'use strict'

function esc(v) { return v != null ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

function buildAddress(s1) {
  return [s1.addressLine1, s1.addressLine2, s1.city, s1.stateUT, s1.pinCode]
    .filter(Boolean).map(esc).join(', ')
}

function drugsText(s2) {
  if (val(s2.drugsToManufacture)) return val(s2.drugsToManufacture)
  if (Array.isArray(s2.drugCategories)) return esc(s2.drugCategories.join(', '))
  return val(s2.drugCategories)
}

function techStaffText(s2) {
  const lines = []
  if (s2.technicalStaffProductionChemist)   lines.push(`Production Chemist: ${val(s2.technicalStaffProductionChemist)}`)
  if (s2.technicalStaffAnalyticalChemist)   lines.push(`Analytical Chemist: ${val(s2.technicalStaffAnalyticalChemist)}`)
  if (s2.technicalStaffQAManufacturingChemist) lines.push(`QA/Manufacturing Chemist: ${val(s2.technicalStaffQAManufacturingChemist)}`)
  if (s2.technicalStaffExperience)          lines.push(`Experience: ${val(s2.technicalStaffExperience)}`)
  return lines.join('; ')
}

function commonCSS() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 22mm 26mm;
      margin: 0 auto;
    }
    .hdr { text-align: center; margin-bottom: 28px; }
    .hdr .form-name  { font-size: 13pt; font-weight: bold; }
    .hdr .rule-ref   { font-size: 10.5pt; margin-top: 3px; }
    .hdr .subtitle-i { font-size: 11pt; font-style: italic; margin-top: 8px; line-height: 1.6; }
    .hdr .subtitle-b { font-size: 11pt; font-weight: bold; margin-top: 8px; line-height: 1.6; }
    .item { margin-bottom: 20px; line-height: 1.8; }
    .sub-item { margin-left: 24px; margin-top: 6px; line-height: 1.8; }
    .ul {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-height: 20px;
      padding: 0 3px;
      vertical-align: bottom;
    }
    .ul-block {
      display: block;
      border-bottom: 1px solid #000;
      min-height: 20px;
      padding: 0 3px;
      width: 100%;
      margin-top: 4px;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      font-style: italic;
    }
    .note { margin-top: 24px; font-size: 10pt; line-height: 1.7; }
    .footnotes { margin-top: 20px; font-size: 9.5pt; font-style: italic; line-height: 1.7; }
  `
}

// ─── Form 24 ───────────────────────────────────────────────────────────────────
function renderForm24(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM 24</div>
    <div class="subtitle-i">Application for the grant of or renewal of a <sup>1</sup>[licence to manufacture for sale or for distribution]<br/>of drugs other than those specified in <sup>2</sup>[Schedules C and C (1) and X]</div>
  </div>

  <div class="item">
    1 .&nbsp; I / We <span class="ul" style="min-width:180px;">${val(s1.legalBusinessName)}</span>
    of <span class="ul" style="min-width:240px;">${address}</span> hereby apply for the
    grant / renewal of a licence to manufacture on the premises situated at
    <span class="ul" style="min-width:280px;">${address}</span> the
    following drugs being drugs other than those specified in <sup>2</sup>[Schedules C and C (1) and X] of the
    Drugs and Cosmetics Rules, 1945.
  </div>

  <div class="item">
    2.&nbsp; Names of drugs categorized according to Schedule M.<br/>
    <span class="ul-block">${drugsText(s2)}</span>
  </div>

  <div class="item">
    3.&nbsp; Names, qualifications and experience of technical staff employed for manufacture
    and testing.<br/>
    <span class="ul-block">${techStaffText(s2)}</span>
  </div>

  <div class="item">
    4.&nbsp; A fee of rupees <span class="ul" style="min-width:180px;">&nbsp;</span> has been credited to Government
    under the head of account <span class="ul" style="min-width:220px;">&nbsp;</span>
  </div>

  <div class="sig-row">
    <span>Date....................................&emsp;</span>
    <span>Signature ....................</span>
  </div>

  <div class="note">
    <strong>Note:</strong> The application should be accompanied by a plan of the premises.
  </div>

</div>
</body>
</html>`
}

// ─── Form 24-A ─────────────────────────────────────────────────────────────────
function renderForm24A(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM 24-A</div>
    <div class="rule-ref">(SEE RULE 69-A)</div>
    <div class="subtitle-b">Application for grant or renewal of a loan licence to manufacture for sale 22(or for<br/>distribution of) drugs other than those specified in 23[Schedule C, C(1) and X]</div>
  </div>

  <div class="item">
    1.&nbsp; I/We <span class="ul" style="min-width:200px;">${val(s1.legalBusinessName)}</span>
    of* <span class="ul" style="min-width:240px;">${address}</span> hereby apply
    for the grant/renewal of a loan licence to manufacture on the premises situated at
    <span class="ul" style="min-width:280px;">${address}</span>
    C/o** <span class="ul" style="min-width:200px;">${val(s2.manufacturingConcernName)}</span> the
    under mentioned drugs, other than those specified on 23[Schedule C, C(1) and X] to
    the Drugs and Cosmetics Rules.<br/>
    <div style="margin-top:8px;">Name of drugs (each substance to be separately specified).</div>
    <span class="ul-block">${drugsText(s2)}</span>
  </div>

  <div class="item">
    2.&nbsp; The names, qualifications and experience of the expert staff actually connected with
    the manufacture and testing of the specified products in the manufacturing premises.<br/>
    <span class="ul-block">${techStaffText(s2)}</span>
  </div>

  <div class="item">
    3.&nbsp; I/We enclose
    <div class="sub-item">
      (a)&nbsp; A true copy of letter from me/us to the manufacturing concern whose
      manufacturing capacity is intended to be utilized by me/us.
    </div>
    <div class="sub-item">
      (b)&nbsp; A true copy of letter from the manufacturing concern that they agree to lend the
      services their expert staff, equipment and premise for the manufacture of each
      item required by me/us and that they will analyse every batch of finished product
      and maintain the registers of raw material, finished product and reports of analysis
      separately in this behalf.
    </div>
    <div class="sub-item">
      (c)&nbsp; Specimens of the labels, cartons of the products proposed to be manufactured.
    </div>
  </div>

  <div class="item">
    4.&nbsp; A fee of rupees <span class="ul" style="min-width:180px;">&nbsp;</span> has been credited to the
    Government under the head of account <span class="ul" style="min-width:200px;">&nbsp;</span>
  </div>

  <div class="sig-row">
    <span>Date&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;.</span>
    <span>Signature&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;.</span>
  </div>

  <div class="footnotes">
    &nbsp;&nbsp;*&emsp; Enter here the name of the proprietor, partners or Managing Director as the case may be<br/>
    **&emsp; Enter here the name of the applicant firm and the address of the principal place of business
  </div>

</div>
</body>
</html>`
}

// ─── Form 24-B ─────────────────────────────────────────────────────────────────
function renderForm24B(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  const repackDrugs = val(s2.drugsToBeRepacked)
    || (Array.isArray(s2.drugCategories) ? esc(s2.drugCategories.join(', ')) : val(s2.drugCategories))

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM-24-B</div>
    <div class="rule-ref">(See Rule 69)</div>
    <div class="subtitle-b">Application for grant or renewal of licence for repack for sale or distribution drugs, being<br/>drugs other than those specified in schedule C and C(1)(Excluding those specified in<br/>Schedule X)</div>
  </div>

  <div class="item">
    1.&nbsp; I/We <span class="ul" style="min-width:100%;">${val(s1.legalBusinessName)}</span>
    <span class="ul-block">${address}</span>
    hereby apply for grant/renewal of a licence to repack the following drugs at the premises situated
    of <span class="ul" style="min-width:100%;">${address}</span>
  </div>

  <div class="item">
    2.&nbsp; Name of the drugs to be repacked<br/>
    <span class="ul-block">${repackDrugs}</span>
    <span class="ul-block">&nbsp;</span>
  </div>

  <div class="item">
    3.&nbsp; Name, qualification and experience of competent staff<br/>
    <span class="ul-block">${techStaffText(s2)}</span>
    <span class="ul-block">&nbsp;</span>
  </div>

  <div class="item">
    4.&nbsp; A fee of Rs <span class="ul" style="min-width:100px;">&nbsp;</span> has been credited to Government under the head of account 0210
    Medical A. Allopathy Fee under the Drugs and Cosmetics Rules, 1945 , vide treasury receipt
    attached.
  </div>

  <div class="sig-row">
    <span>Dated:</span>
    <span>Signature of applicant</span>
  </div>

  <div class="note">
    Note : The application shall be accompanied by a plan of the premises.
  </div>

</div>
</body>
</html>`
}

// ─── Form 24-C ─────────────────────────────────────────────────────────────────
function renderForm24C(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  const preparations = val(s2.homeopathicPreparations)
    || (Array.isArray(s2.drugCategories) ? esc(s2.drugCategories.join(', ')) : val(s2.drugCategories))

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">Form 24-C</div>
    <div class="rule-ref">[See Rule 85-B]</div>
    <div class="subtitle-i" style="margin-top:10px;">
      Application for the grant [ * * ] of a licence to manufacture for sale [or for
      <strong>distribution] of Homoeopathic medicines or a licence to manufacture potentised<br/>
      preparations from back potencies by licensees holding licence in Form 20-C</strong>
    </div>
  </div>

  <div class="item">
    1.&nbsp; I/We <span class="ul" style="min-width:280px;">${val(s1.legalBusinessName)}</span><br/>
    of <span class="ul" style="min-width:320px;">${address}</span><br/>
    holder of licence No <span class="ul" style="min-width:140px;">${val(s2.existingForm20CLicenceNo)}</span>
    in Form 20-C hereby apply for
    grant [ * * ] &nbsp;of&nbsp; licence to manufacture the under mentioned
    Homoeopathic Mother Tincture/Potentised and other preparations on the
    premises situated at <span class="ul" style="min-width:280px;">${address}</span><br/>
    <span class="ul-block">&nbsp;</span>
    <span class="ul-block">&nbsp;</span>
    <div style="margin-top:10px;">
      Names of the Homoeopathic preparations <span class="ul" style="min-width:240px;">${preparations}</span><br/>
      <span class="ul-block">&nbsp;</span>
      <span style="font-style:italic;font-size:10pt;">(Each item to be separately specified).</span>
    </div>
  </div>

  <div class="item">
    2.&nbsp; Names, qualifications and experience of technical staff employed for
    manufacture and testing of Homoeopathic Medicines.<br/>
    <span class="ul-block">${techStaffText(s2)}</span>
  </div>

  <div class="item">
    3.&nbsp; A fee of rupees <span class="ul" style="min-width:240px;">&nbsp;</span><br/>
    has been credited to Government under head of account <span class="ul" style="min-width:200px;">&nbsp;</span><br/>
    <span class="ul" style="min-width:160px;">&nbsp;</span>
  </div>

  <div class="sig-row">
    <span>Date...............</span>
    <span>Signature.................</span>
  </div>

  <div class="note">
    Note 1. Delete whichever portion is not applicable.<br/>
    &emsp;&emsp;&emsp; 2. The application should be accompanied by a plan of the premises.
  </div>

  <div class="footnotes" style="margin-top:16px;">
    **Omitted by GSR 1337 (E) dt. 27.10.2017
  </div>

</div>
</body>
</html>`
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────
module.exports = function drugManufacturingLicenseTemplate(formData) {
  const form = ((formData.step2 || {}).manufacturingForm || '').toLowerCase()
  if (form.includes('24-a') || form.includes('24a')) return renderForm24A(formData)
  if (form.includes('24-b') || form.includes('24b')) return renderForm24B(formData)
  if (form.includes('24-c') || form.includes('24c')) return renderForm24C(formData)
  return renderForm24(formData)
}
