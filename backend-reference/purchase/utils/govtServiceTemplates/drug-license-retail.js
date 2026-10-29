'use strict'

function esc(v) { return v != null ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

function buildAddress(s1) {
  return [s1.addressLine1, s1.addressLine2, s1.city, s1.stateUT, s1.pinCode]
    .filter(Boolean).map(esc).join(', ')
}

function categoriesText(s2) {
  if (Array.isArray(s2.categoriesToBeSold)) return esc(s2.categoriesToBeSold.join(', '))
  return val(s2.categoriesToBeSold)
}

function storageText(s2) {
  const parts = []
  if (s2.premisesAreaSqM) parts.push(`Floor area: ${val(s2.premisesAreaSqM)} sq.m.`)
  if (s2.premisesHasRefrigerator) parts.push(`Refrigerator: ${val(s2.premisesHasRefrigerator)}`)
  if (s2.premisesHasAC) parts.push(`Air Conditioner: ${val(s2.premisesHasAC)}`)
  return parts.join(', ')
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
    .hdr { text-align: center; margin-bottom: 30px; }
    .hdr .form-name { font-size: 13pt; font-weight: bold; }
    .hdr .rule-ref  { font-size: 10.5pt; font-style: italic; margin-top: 3px; }
    .hdr .subtitle  { font-size: 11pt; font-style: italic; margin-top: 8px; line-height: 1.6; }
    .hdr .subtitle-bold { font-size: 11pt; font-weight: bold; margin-top: 8px; line-height: 1.6; }
    .hdr .subtitle-para { font-size: 11pt; margin-top: 12px; line-height: 1.7; text-align: left; }
    .item { margin-bottom: 20px; line-height: 1.8; }
    .sub-item { margin-left: 20px; margin-top: 6px; line-height: 1.8; }
    .ul {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-height: 20px;
      padding: 0 3px;
      vertical-align: bottom;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      font-style: italic;
    }
    .footnotes {
      margin-top: 26px;
      font-size: 9.5pt;
      font-style: italic;
      line-height: 1.7;
    }
  `
}

// ─── Form 19 ───────────────────────────────────────────────────────────────────
function renderForm19(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  const pharmacist1Name = val(s2.registeredPharmacistName)
  const pharmacist1Qual = val(s2.registeredPharmacistQualification)
  const pharmacist2Name = val(s2.secondPharmacistName)
  const pharmacist2Qual = val(s2.secondPharmacistQualification)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM 19</div>
    <div class="rule-ref">[See Rule 59(2)]</div>
    <div class="subtitle">Application for grant [* *] of a [licence to sell, stock, exhibit or offer for sale, or<br/>distribute] drugs other than those specified in Schedule X</div>
  </div>

  <div class="item">
    1.&nbsp; I/We <span class="ul" style="min-width:180px;">${val(s1.legalBusinessName)}</span>
    of <span class="ul" style="min-width:280px;">${address}</span> hereby
    apply for licence to sell by wholesale/retail drugs specified in Schedules C and
    C(1) excluding those specified in Schedule X* and/or drugs other than those
    specified in Schedules C, C(1) and X to the Drugs and Cosmetics Rules, 1945*
    and also to operate a pharmacy on the premises situated at
    <span class="ul" style="min-width:300px;">${address}</span>
  </div>

  <div class="item">
    2.&nbsp; $ The sale and dispensing of drugs will be made under the personal supervision of
    the qualified persons namely :&mdash;
    <div class="sub-item">
      <span class="ul" style="min-width:160px;">${pharmacist1Name}</span>
      (Name)&ensp;
      <span class="ul" style="min-width:160px;">${pharmacist1Qual}</span>
      (Qualification).
    </div>
    <div class="sub-item">
      <span class="ul" style="min-width:160px;">${pharmacist2Name}</span>
      (Name)&ensp;
      <span class="ul" style="min-width:160px;">${pharmacist2Qual}</span>
      (Qualification).
    </div>
  </div>

  <div class="item">
    3.&nbsp; Categories of drugs to be sold.
    <span class="ul" style="min-width:320px;margin-left:4px;">${categoriesText(s2)}</span>
  </div>

  <div class="item">
    4.&nbsp; + Particulars for special storage accommodation.
    <span class="ul" style="min-width:260px;margin-left:4px;">${storageText(s2)}</span>
  </div>

  <div class="item">
    5.&nbsp; A fee of rupees <span class="ul" style="min-width:120px;">&nbsp;</span> has been credited to the Government account
    under the head of account <span class="ul" style="min-width:180px;">&nbsp;</span>
  </div>

  <div class="sig-row">
    <span>Date&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;</span>
    <span>Signature&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;.</span>
  </div>

  <div class="footnotes">
    * <em>Delete</em> whichever is not applicable.<br/>
    ** The word&lsquo; or renewal&rsquo; is <em>omitted</em> by GSR 1337 (E) dt. 27.10.2017<br/>
    $ To be <em>deleted</em> if drugs will be sold only by wholesale.<br/>
    + Required only if products requiring special storage are to be sold.
  </div>

</div>
</body>
</html>`
}

// ─── Form 19-A ─────────────────────────────────────────────────────────────────
function renderForm19A(formData) {
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
    <div class="form-name">FORM 19-A</div>
    <div class="rule-ref">[See Rule 59 (2)]</div>
    <div class="subtitle-bold">Application for the grant [* *] of a restricted licence to sell, stock<br/>or exhibit or offer for sale, or distribute drugs by retail by<br/>dealers&nbsp; who do not engage the service of a qualified person</div>
  </div>

  <div class="item">
    1.&nbsp; I/We <span class="ul" style="min-width:180px;">${val(s1.legalBusinessName)}</span>
    of <span class="ul" style="min-width:280px;">${address}</span> hereby apply for a
    licence to sell by retail
    <div class="sub-item">
      (i)&nbsp; [Drugs other than those specified in Schedules C, C(1) and X on the premises situated
      at <span class="ul" style="min-width:320px;">${address}</span>.
    </div>
    <div class="sub-item" style="margin-top:10px;">
      (ii)&nbsp; Drugs specified in [Schedule C(1)], on the premises situated at <span class="ul" style="min-width:260px;">&nbsp;</span><br/>
      &emsp;&emsp;&emsp;<span class="ul" style="min-width:380px;">&nbsp;</span>
    </div>
    <div class="sub-item" style="margin-top:6px;">
      &emsp; Drugs specified in [Schedule C(1)], as vendor in the area <span class="ul" style="min-width:160px;">&nbsp;</span>
    </div>
  </div>

  <div class="item">
    2.&nbsp; Sales shall be restricted to such drugs as can be sold without the supervision of a
    qualified person under the Drugs and Cosmetics Rules.
  </div>

  <div class="item">
    3.&nbsp; Names or classes of drugs proposed to be sold
    <span class="ul" style="min-width:260px;margin-left:4px;">${categoriesText(s2)}</span>
  </div>

  <div class="item">
    *4.&nbsp; Particulars of the storage accommodation for the storage of [Schedule C(1)] drugs on
    the premises referred to above.
    <span class="ul" style="min-width:240px;margin-left:4px;">${storageText(s2)}</span>
  </div>

  <div class="item">
    +5.&nbsp; The drugs for sale will be purchased from the following dealers and such other dealers
    as may be endorsed on the licence by the licensing authority from time to time.<br/>
    <div class="sub-item" style="margin-top:8px;">
      Name of the dealers <span class="ul" style="min-width:200px;">&nbsp;</span>&emsp;
      Licence No <span class="ul" style="min-width:120px;">&nbsp;</span>
    </div>
  </div>

  <div class="item">
    6.&nbsp; A fee of rupees <span class="ul" style="min-width:120px;">&nbsp;</span> has been credited to Government under the
    head of account <span class="ul" style="min-width:180px;">&nbsp;</span>
  </div>

  <div class="sig-row">
    <span>Date&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;..</span>
    <span>Signature&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;..</span>
  </div>

  <div class="footnotes">
    &nbsp;&nbsp;*&emsp; Delete if not required.<br/>
    &nbsp;**&emsp; The word&lsquo; or renewal&rsquo; is <em>omitted</em> by GSR 1337 (E) dt. 27.10.2017<br/>
    &nbsp;&nbsp;+&emsp; Applies only to an itinerant vendor.<br/>
    ++&emsp; Rupees five for itinerant vendors and applicants from a village or town having a
    population of 5000 or less, and Rupees twenty for other restricted licence.
  </div>

</div>
</body>
</html>`
}

// ─── Form 19-C ─────────────────────────────────────────────────────────────────
function renderForm19C(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  const pharmacist1Name = val(s2.registeredPharmacistName)
  const pharmacist1Qual = val(s2.registeredPharmacistQualification)
  const pharmacist2Name = val(s2.secondPharmacistName)
  const pharmacist2Qual = val(s2.secondPharmacistQualification)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM 19-C</div>
    <div class="rule-ref">[See Rule 59 (2)]</div>
    <div class="subtitle-para">
      Application for grant or renewal of a [license to sell, stock, exhibit or offer
      for sale, or distribute] drugs specified in Schedule X
    </div>
  </div>

  <div class="item">
    1.&nbsp; I/We <span class="ul" style="min-width:180px;">${val(s1.legalBusinessName)}</span>
    of <span class="ul" style="min-width:280px;">${address}</span> hereby
    apply for a licence to sell by wholesale/retail drugs specified in
    Schedule X to the Drugs and Cosmetics Rules, 1945. We operate a
    pharmacy on the premises, situated at
    <span class="ul" style="min-width:300px;">${address}</span>.
  </div>

  <div class="item">
    2.&nbsp; The sale and dispensing of drugs will be made under the personal
    supervision of the qualified persons mentioned below:
    <div class="sub-item" style="margin-top:12px;">
      Name <span class="ul" style="min-width:200px;">${pharmacist1Name}</span>&emsp;&emsp;
      Qualification <span class="ul" style="min-width:160px;">${pharmacist1Qual}</span>
    </div>
    <div class="sub-item" style="margin-top:10px;">
      Name <span class="ul" style="min-width:200px;">${pharmacist2Name}</span>&emsp;&emsp;
      Qualification <span class="ul" style="min-width:160px;">${pharmacist2Qual}</span>
    </div>
  </div>

  <div class="item">
    3.&nbsp; Name of drugs to be sold <span class="ul" style="min-width:300px;">${categoriesText(s2)}</span>
  </div>

  <div class="item">
    4.&nbsp; Particulars of storage accommodation <span class="ul" style="min-width:240px;">${storageText(s2)}</span>
  </div>

  <div class="item">
    5.&nbsp; A fee of rupees <span class="ul" style="min-width:120px;">&nbsp;</span> has been credited to
    Government account under the head of account <span class="ul" style="min-width:160px;">&nbsp;</span>.
  </div>

  <div class="sig-row">
    <span>Date: <span class="ul" style="min-width:140px;font-style:normal;">&nbsp;</span></span>
    <span>Signature: <span class="ul" style="min-width:140px;font-style:normal;">&nbsp;</span></span>
  </div>

</div>
</body>
</html>`
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────
module.exports = function drugLicenseRetailTemplate(formData) {
  const type = ((formData.step2 || {}).applicationFormType || '').toLowerCase()
  if (type.includes('19-a') || type.includes('19a')) return renderForm19A(formData)
  if (type.includes('19-c') || type.includes('19c')) return renderForm19C(formData)
  return renderForm19(formData)
}
