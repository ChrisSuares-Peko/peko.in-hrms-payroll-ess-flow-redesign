'use strict'

function esc(v) { return v != null ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }
function chk(condition) { return condition ? '&#9745;' : '&#9744;' }
function matchVal(field, option) {
  if (!field) return false
  return field.toString().toLowerCase().includes(option.toLowerCase())
}

function commonCSS() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; }
    .page { width: 210mm; padding: 16mm 18mm; margin: 0 auto; }
    .pb { page-break-before: always; }
    .hdr { text-align: center; margin-bottom: 16px; }
    .hdr .form-name { font-size: 13pt; font-weight: bold; }
    .hdr .rule-ref  { font-size: 10pt; margin: 3px 0; }
    .hdr .title     { font-size: 11.5pt; font-weight: bold; margin-top: 4px; line-height: 1.4; }
    .hdr .act-ref   { font-size: 10pt; margin-top: 3px; }
    .to-box { border: 1px solid #000; padding: 8px 10px; margin-bottom: 12px; font-size: 10pt; line-height: 1.7; }
    .sir { margin-bottom: 10px; font-size: 10pt; line-height: 1.6; }
    .part-hdr {
      font-weight: bold;
      text-decoration: underline;
      font-size: 10.5pt;
      margin: 16px 0 8px 0;
    }
    table.form-t {
      border-collapse: collapse;
      width: 100%;
      font-size: 10pt;
    }
    table.form-t td {
      border: 1px solid #000;
      padding: 7px 9px;
      vertical-align: top;
      line-height: 1.6;
    }
    table.form-t td.label {
      width: 40%;
      font-weight: bold;
    }
    table.form-t td.label-wide {
      width: 100%;
      font-weight: bold;
    }
    table.doc-t {
      border-collapse: collapse;
      width: 100%;
      font-size: 10pt;
      margin-top: 4px;
    }
    table.doc-t th, table.doc-t td {
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: top;
    }
    table.doc-t th { font-weight: bold; background: #f0f0f0; }
    .ul { display: inline-block; border-bottom: 1px solid #000; min-width: 120px; min-height: 17px; padding: 0 3px; vertical-align: bottom; }
    .ul-sm { display: inline-block; border-bottom: 1px solid #000; min-width: 70px; min-height: 17px; padding: 0 3px; vertical-align: bottom; }
    .decl-hdr { font-weight: bold; text-decoration: underline; font-size: 10.5pt; margin: 18px 0 8px 0; }
    .decl-text { font-size: 10pt; line-height: 1.7; margin-bottom: 16px; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 10px; }
    .office-hdr { font-weight: bold; text-decoration: underline; font-size: 10.5pt; margin: 18px 0 8px 0; }
    .notes-hdr { font-weight: bold; font-size: 10.5pt; margin: 16px 0 6px 0; }
    .notes-list { font-size: 9.5pt; font-style: italic; line-height: 1.7; }
  `
}

// ─── Form No. 1 ────────────────────────────────────────────────────────────────
function renderForm1(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}

  const appType = val(s2.typeOfApplication)
  const power   = val(s2.powerUsingFactory)
  const hazard  = val(s2.hazardousProcessUnderSection2cb)

  const totalWorkers = (parseInt(s2.numberOfMaleWorkers || 0) + parseInt(s2.numberOfWomenWorkers || 0) + parseInt(s2.numberOfChildWorkers || 0)) || ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM No. 1</div>
    <div class="rule-ref">[See Rule 3]</div>
    <div class="title">APPLICATION FOR APPROVAL OF SITE AND CONSTRUCTION OR<br/>EXTENSION OF A FACTORY</div>
    <div class="act-ref">[Under Section 6 of the Factories Act, 1948]</div>
  </div>

  <div class="to-box">
    To,<br/>
    <strong>The Chief Inspector of Factories,</strong><br/>
    State of: <span class="ul" style="min-width:200px;">${val(s1.stateUT)}</span>
  </div>

  <div class="sir">
    Sir / Madam,<br/>
    I / We hereby apply for approval of plans for the site and construction / extension of a factory as per
    the particulars given below:
  </div>

  <!-- PART I -->
  <div class="part-hdr">PART I &mdash; DETAILS OF THE APPLICANT</div>
  <table class="form-t">
    <tr>
      <td class="label">1. Name of Applicant /<br/>Occupier</td>
      <td>${val(s2.occupierName) || val(s1.legalBusinessName)}</td>
    </tr>
    <tr>
      <td class="label">2. Father&rsquo;s / Husband&rsquo;s Name</td>
      <td>&nbsp;</td>
    </tr>
    <tr>
      <td class="label">3. Designation</td>
      <td>${val(s2.occupierDesignation) || val(s1.designation)}</td>
    </tr>
    <tr>
      <td class="label">4. Address of Applicant</td>
      <td>
        House/Flat No.: <span class="ul">${val(s1.addressLine1)}</span><br/>
        Street/Area: <span class="ul" style="min-width:180px;">${val(s1.addressLine2)}</span><br/>
        City: <span class="ul">${val(s1.city)}</span>&ensp; Pin: <span class="ul">${val(s1.pinCode)}</span><br/>
        State: <span class="ul" style="min-width:180px;">${val(s1.stateUT)}</span>
      </td>
    </tr>
    <tr>
      <td class="label">5. Phone / Mobile No.</td>
      <td>${val(s1.mobileNumber)}</td>
    </tr>
    <tr>
      <td class="label">6. Email Address</td>
      <td>${val(s1.emailId)}</td>
    </tr>
  </table>

  <!-- PART II -->
  <div class="part-hdr">PART II &mdash; DETAILS OF THE FACTORY</div>
  <table class="form-t">
    <tr>
      <td class="label">7. Name of the Factory /<br/>Proposed Factory</td>
      <td>${val(s1.legalBusinessName) || val(s1.tradeBrandName)}</td>
    </tr>
    <tr>
      <td class="label">8. Site / Location of Factory</td>
      <td>
        Plot/Survey No.: <span class="ul" style="min-width:160px;">${val(s2.plotSurveyNo)}</span><br/>
        Street/Village: <span class="ul" style="min-width:180px;">${val(s1.addressLine2)}</span><br/>
        Town/City: <span class="ul">${val(s1.city)}</span>&ensp; District: <span class="ul">${val(s2.district)}</span><br/>
        State: <span class="ul" style="min-width:160px;">${val(s1.stateUT)}</span><br/>
        Pin Code: <span class="ul">${val(s1.pinCode)}</span>
      </td>
    </tr>
    <tr>
      <td class="label">9. Nature of Industry /<br/>Manufacturing Process</td>
      <td>${val(s2.natureOfIndustryManufacturingProcess)}</td>
    </tr>
    <tr>
      <td class="label">10. Type of Application</td>
      <td>
        ${chk(matchVal(appType,'new site'))} New Site &ensp;
        ${chk(matchVal(appType,'construction'))} Construction &ensp;
        ${chk(matchVal(appType,'extension'))} Extension &ensp;
        ${chk(matchVal(appType,'change of occupier') || matchVal(appType,'change occupier'))} Change of Occupier
      </td>
    </tr>
  </table>

  <!-- PART III -->
  <div class="part-hdr">PART III &mdash; LAND AND BUILDING DETAILS</div>
  <table class="form-t">
    <tr>
      <td class="label">11. Total Area of Land (in sq. metres)</td>
      <td>${val(s2.plotAreaSqM)}</td>
    </tr>
    <tr>
      <td class="label">12. Total Covered Area (in sq. metres)</td>
      <td>${val(s2.builtUpAreaSqM)}</td>
    </tr>
    <tr>
      <td class="label">13. No. of Floors / Storeys</td>
      <td>${val(s2.numberOfFloorsStoreys)}</td>
    </tr>
    <tr>
      <td class="label">14. Height of Building (in metres)</td>
      <td>${val(s2.heightOfBuildingM)}</td>
    </tr>
    <tr>
      <td class="label">15. Construction Material</td>
      <td>
        ${chk(matchVal(s2.constructionMaterial,'rcc'))} RCC &ensp;
        ${chk(matchVal(s2.constructionMaterial,'steel'))} Steel &ensp;
        ${chk(matchVal(s2.constructionMaterial,'brick'))} Brick &amp; Mortar &ensp;
        ${chk(!matchVal(s2.constructionMaterial,'rcc') && !matchVal(s2.constructionMaterial,'steel') && !matchVal(s2.constructionMaterial,'brick') && val(s2.constructionMaterial))} Other: <span class="ul-sm">${(!matchVal(s2.constructionMaterial,'rcc') && !matchVal(s2.constructionMaterial,'steel') && !matchVal(s2.constructionMaterial,'brick')) ? val(s2.constructionMaterial) : ''}</span>
      </td>
    </tr>
    <tr>
      <td class="label">16. Type of Roof</td>
      <td>
        ${chk(matchVal(s2.typeOfRoof,'rcc'))} RCC &ensp;
        ${chk(matchVal(s2.typeOfRoof,'asbestos'))} Asbestos Sheet &ensp;
        ${chk(matchVal(s2.typeOfRoof,'gi sheet') || matchVal(s2.typeOfRoof,'gi'))} GI Sheet &ensp;
        ${chk(!matchVal(s2.typeOfRoof,'rcc') && !matchVal(s2.typeOfRoof,'asbestos') && !matchVal(s2.typeOfRoof,'gi') && val(s2.typeOfRoof))} Other: <span class="ul-sm">${(!matchVal(s2.typeOfRoof,'rcc') && !matchVal(s2.typeOfRoof,'asbestos') && !matchVal(s2.typeOfRoof,'gi')) ? val(s2.typeOfRoof) : ''}</span>
      </td>
    </tr>
  </table>

</div>

<!-- Page 2 -->
<div class="pb">
<div class="page">

  <!-- PART IV -->
  <div class="part-hdr">PART IV &mdash; WORKERS AND POWER</div>
  <table class="form-t">
    <tr>
      <td class="label">17. Maximum No. of Workers<br/>proposed to be employed</td>
      <td>
        Male: <span class="ul-sm">${val(s2.numberOfMaleWorkers)}</span>&ensp;
        Female: <span class="ul-sm">${val(s2.numberOfWomenWorkers)}</span>&ensp;
        Total: <span class="ul-sm">${totalWorkers}</span>
      </td>
    </tr>
    <tr>
      <td class="label">18. Whether power is to be used?</td>
      <td>
        ${chk(power.toLowerCase() === 'yes')} Yes &ensp;
        ${chk(power.toLowerCase() === 'no')} No
      </td>
    </tr>
    <tr>
      <td class="label">19. If Yes, total connected load (in KW/HP)</td>
      <td>${val(s2.totalConnectedLoadHP)}</td>
    </tr>
    <tr>
      <td class="label">20. Source of Power</td>
      <td>
        ${chk(matchVal(s2.sourceOfPower,'state electricity') || matchVal(s2.sourceOfPower,'seb'))} State Electricity Board &ensp;
        ${chk(matchVal(s2.sourceOfPower,'generator'))} Generator &ensp;
        ${chk(matchVal(s2.sourceOfPower,'solar'))} Solar &ensp;
        ${chk(!!s2.sourceOfPower && !matchVal(s2.sourceOfPower,'state electricity') && !matchVal(s2.sourceOfPower,'seb') && !matchVal(s2.sourceOfPower,'generator') && !matchVal(s2.sourceOfPower,'solar'))} Other
      </td>
    </tr>
  </table>

  <!-- PART V -->
  <div class="part-hdr">PART V &mdash; HAZARDOUS PROCESSES / SPECIAL REQUIREMENTS</div>
  <table class="form-t">
    <tr>
      <td class="label">21. Does the factory involve<br/>any hazardous process<br/>(Schedule 1)?</td>
      <td>
        ${chk(hazard.toLowerCase() === 'yes')} Yes &ensp;
        ${chk(hazard.toLowerCase() === 'no')} No
      </td>
    </tr>
    <tr>
      <td class="label">22. If Yes, name the hazardous process</td>
      <td>${val(s2.hazardousProcessName)}</td>
    </tr>
    <tr>
      <td class="label">23. Dangerous / Flammable<br/>substances to be stored</td>
      <td>${val(s2.dangerousFlammableSubstances)}</td>
    </tr>
    <tr>
      <td class="label">24. Waste disposal arrangement</td>
      <td>${val(s2.wasteDisposalArrangement)}</td>
    </tr>
  </table>

  <!-- PART VI -->
  <div class="part-hdr">PART VI &mdash; DOCUMENTS / PLANS SUBMITTED</div>
  <table class="doc-t">
    <thead>
      <tr>
        <th style="width:7%;">S.No.</th>
        <th>Document / Plan</th>
        <th style="width:18%;">Enclosed (Yes/No)</th>
        <th style="width:14%;">No. of Copies</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Site Plan (showing boundaries, roads, neighbours)</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>2</td><td>Building Plan (floor-wise layout, to scale)</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>3</td><td>Elevation and Section Drawings</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>4</td><td>Machinery Layout Plan</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>5</td><td>Plan showing fire escape routes and fire-fighting equipment</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>6</td><td>Drainage and Sanitation Plan</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>7</td><td>Effluent Treatment Plant (ETP) Plan (if applicable)</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>8</td><td>Proof of Ownership / Lease Agreement of Land</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>9</td><td>Title / Address Proof of Applicant</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>10</td><td>Any other (specify): <span class="ul" style="min-width:160px;">&nbsp;</span></td><td>&nbsp;</td><td>&nbsp;</td></tr>
    </tbody>
  </table>

</div>
</div>

<!-- Page 3 -->
<div class="pb">
<div class="page">

  <!-- Declaration -->
  <div class="decl-hdr">DECLARATION BY APPLICANT</div>
  <div class="decl-text">
    I / We hereby declare that the information given above and in the plans / documents submitted
    herewith is true and correct to the best of my / our knowledge and belief, and that the construction /
    extension of the factory shall be carried out in accordance with the approved plans and in conformity
    with the provisions of the Factories Act, 1948, and the Rules made thereunder.
  </div>

  <div class="sig-row">
    <div>
      Place: <span class="ul" style="min-width:180px;">&nbsp;</span><br/><br/>
      Date: <span class="ul" style="min-width:180px;">&nbsp;</span>
    </div>
    <div style="text-align:center;">
      Signature of Applicant / Occupier<br/>
      <em>(with seal, if applicable)</em><br/><br/>
      Name: <span class="ul" style="min-width:160px;">${val(s2.occupierName) || val(s1.signatoryFullName)}</span><br/>
      Designation: <span class="ul" style="min-width:130px;">${val(s2.occupierDesignation) || val(s1.designation)}</span>
    </div>
  </div>

  <!-- Office Use Only -->
  <div class="office-hdr">FOR OFFICE USE ONLY</div>
  <table class="form-t">
    <tr><td class="label" style="width:45%;">Date of Receipt</td><td>&nbsp;</td></tr>
    <tr><td class="label">Application / Reference No.</td><td>&nbsp;</td></tr>
    <tr><td class="label">Fee Paid (Rs.)</td><td>&nbsp;</td></tr>
    <tr><td class="label">Receipt No. &amp; Date</td><td>&nbsp;</td></tr>
    <tr><td class="label">Plans received (No. of sets)</td><td>&nbsp;</td></tr>
    <tr><td class="label">Remarks / Deficiencies</td><td style="min-height:50px;">&nbsp;</td></tr>
    <tr>
      <td colspan="2" style="text-align:center;padding:10px;">
        Signature of Receiving Officer: <span class="ul" style="min-width:180px;">&nbsp;</span><br/>
        Date: <span class="ul" style="min-width:140px;">&nbsp;</span>
      </td>
    </tr>
  </table>

  <!-- Important Notes -->
  <div class="notes-hdr">IMPORTANT NOTES:</div>
  <div class="notes-list">
    <em>1. This application should be submitted in triplicate along with plans in triplicate.</em><br/>
    <em>2. Plans must be drawn to a suitable scale (not less than 1:100) and duly signed by a licensed / registered architect or engineer.</em><br/>
    <em>3. The application should be accompanied by the prescribed fee as per the State Factories Rules.</em><br/>
    <em>4. Approval under this form does not constitute a Licence to work the factory. A separate application in Form 2 must be submitted after completion of construction.</em><br/>
    <em>5. Any change in the approved plans requires fresh approval before commencement of such change.</em><br/>
    <em>6. The Chief Inspector may call for additional documents or require modifications at his discretion.</em>
  </div>

</div>
</div>

</body>
</html>`
}

// ─── Form No. 2 placeholder ────────────────────────────────────────────────────
function renderForm2(formData) {
  // Form 2 (Licence) — to be implemented
  return renderForm1(formData)
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────
module.exports = function factoryLicenseTemplate(formData) {
  const forms = formData.step2 && Array.isArray(formData.step2.formFiled)
    ? formData.step2.formFiled
    : [formData.step2 && formData.step2.formFiled || 'Form 1']

  const parts = []
  for (const f of forms) {
    const fl = f.toLowerCase()
    if (fl.includes('form 1') || fl.includes('plan approval')) {
      parts.push(renderForm1(formData))
    } else if (fl.includes('form 2') || fl.includes('license') || fl.includes('licence')) {
      parts.push(renderForm2(formData))
    }
  }

  if (parts.length === 0) return renderForm1(formData)
  if (parts.length === 1) return parts[0]

  // Both forms: embed Form 2 pages after Form 1 pages in one HTML document
  const combined = parts[0].replace('</body>\n</html>', '') +
    parts.slice(1).map(p => p.replace(/<!DOCTYPE html>[\s\S]*?<body>/, '<div class="pb">').replace('</body>\n</html>', '</div>')).join('') +
    '\n</body>\n</html>'
  return combined
}
