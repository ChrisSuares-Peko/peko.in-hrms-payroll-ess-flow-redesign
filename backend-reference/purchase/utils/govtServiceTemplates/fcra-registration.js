'use strict'

function esc(v) { return v != null ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

function buildAddress(s1) {
  return [s1.addressLine1, s1.addressLine2, s1.city, s1.stateUT, s1.pinCode]
    .filter(Boolean).map(esc).join(', ')
}

function commonCSS() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #fff; }
    .page { width: 210mm; padding: 18mm 20mm; margin: 0 auto; }
    .pb { page-break-before: always; }
    .hdr { text-align: center; margin-bottom: 18px; }
    .hdr .form-name { font-size: 12pt; font-weight: bold; }
    .hdr .rule-ref  { font-size: 10pt; margin-top: 2px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .ul { display: inline-block; border-bottom: 1px solid #000; min-height: 18px; padding: 0 3px; vertical-align: bottom; min-width: 100px; }
    .ul-sm { display: inline-block; border-bottom: 1px solid #000; min-height: 18px; padding: 0 3px; vertical-align: bottom; min-width: 60px; }
    .address-block { margin: 14px 0 10px 0; font-size: 10pt; line-height: 1.6; }
    .subject { margin-bottom: 10px; line-height: 1.6; }
    .sir { margin-bottom: 8px; }
    .intro { margin-bottom: 16px; line-height: 1.7; text-align: justify; }
    .item { margin-bottom: 14px; line-height: 1.7; }
    .item-label { font-weight: bold; }
    .sub { margin-left: 20px; margin-top: 4px; line-height: 1.7; }
    .sub2 { margin-left: 40px; margin-top: 4px; line-height: 1.7; }
    .ans { display: inline-block; border-bottom: 1px solid #000; min-height: 18px; min-width: 160px; padding: 0 3px; vertical-align: bottom; }
    .ans-lg { display: block; border-bottom: 1px solid #000; min-height: 18px; padding: 2px 3px; width: 100%; margin-top: 2px; }
    table.t { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 9pt; }
    table.t th, table.t td { border: 1px solid #000; padding: 5px 6px; vertical-align: top; }
    table.t th { font-weight: bold; text-align: center; background: #f5f5f5; }
    table.t td.center { text-align: center; }
    .closing { margin-top: 30px; text-align: right; line-height: 1.8; }
    .decl-hdr { text-align: center; font-weight: bold; margin-bottom: 14px; font-size: 11pt; }
    .decl-item { margin-bottom: 12px; line-height: 1.7; text-align: justify; }
    .place-date { margin-top: 20px; line-height: 2; }
    .note-block { margin-top: 20px; font-size: 9.5pt; line-height: 1.7; text-align: justify; }
  `
}

// ─── Shared table components ───────────────────────────────────────────────────

function officeBearersTable(details) {
  return `
    <table class="t">
      <thead>
        <tr>
          <th style="width:9%">Name<br/>(1)</th>
          <th style="width:9%">Name of father/spouse<br/>(2)</th>
          <th style="width:8%">Nationality<br/>(3)</th>
          <th style="width:9%">Aadhaar number<br/>(4)</th>
          <th style="width:7%">PAN<br/>(5)</th>
          <th style="width:9%">Occupation<br/>(6)</th>
          <th style="width:11%">Designation in the person/association<br/>(7)</th>
          <th style="width:13%">Relationship with other member(s) of the executive council / governing body / office bearers<br/>(8)</th>
          <th style="width:25%">Contact details: Office address; residential address; e-mail address; landline no.; mobile no.<br/>(9)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="9" style="min-height:50px;">${val(details)}</td>
        </tr>
        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      </tbody>
    </table>`
}

function foreignerTable() {
  return `
    <table class="t">
      <thead>
        <tr>
          <th>Name<br/>(1)</th>
          <th>Date and place of birth<br/>(2)</th>
          <th>Passport number<br/>(3)</th>
          <th>Address in the foreign country<br/>(4)</th>
          <th>Whether a person of Indian origin<br/>(5)</th>
          <th>PIO/OCI card number, if any<br/>(6)</th>
          <th>If resident in India, date from which Residing in India<br/>(7)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      </tbody>
    </table>`
}

function fcraAccountTable(s1, s2) {
  return `
    <table class="t">
      <thead>
        <tr>
          <th>Name of the Bank<br/>(1)</th>
          <th>Branch address (with PIN code)<br/>(2)</th>
          <th><em>e</em>-mail<br/>(3)</th>
          <th>IFSC Code<br/>(4)</th>
          <th>Account Number<br/>(5)</th>
          <th>Date of account opening<br/>(6)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>State Bank of India</td>
          <td>New Delhi Main Branch, 11, Sansad Marg, New Delhi-110001.</td>
          <td>${val(s2.fcraAccountEmail)}</td>
          <td>${val(s2.ifscOfDesignatedBank)}</td>
          <td>${val(s2.fcraDesignatedBankSBINewDelhiMainBranchAcNo)}</td>
          <td>${val(s2.fcraAccountOpeningDate)}</td>
        </tr>
        <tr>
          <td>Another &ldquo;FCRA Account&rdquo;, if any</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>${val(s2.utilisationAccountIFSC)}</td>
          <td>${val(s2.utilisationAccountBankAc)}</td>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </table>`
}

function declarationAndUndertaking(s1, s2, isFC3B) {
  const name = val(s1.legalBusinessName)
  const enclosureNote = isFC3B
    ? `&ldquo;Note: Applicant seeking prior permission shall enclose the following documents, namely: -
      <br/>(a) commitment letter from the donor, with the amount committed in the letter matching the donation amount mentioned in this Form;
      <br/>(b) project report including a detailed breakup of proposed expenses to be incurred from the foreign contribution to be received, along with a declaration that administrative expenses shall not exceed 20% of the foreign contribution;
      <br/>(c) letter from Chief Functionary, in the format available on the website of Ministry of Home Affairs at https://fcraonline.nic.in, providing point wise details in respect of each item of guidelines for prior permission issued by the Ministry of Home Affairs.
      <br/>(d) undertaking to adhere to the Good Practice Guidelines of the Financial Action Task Force (FATF), in the format available on the website of Ministry of Home Affairs at https://fcraonline.nic.in.&rdquo;`
    : `&ldquo;Note: Applicant seeking registration shall enclose the following documents, namely: -
      <br/>(a) financial statements and audit reports of the last three financial years, including the statement of assets and liabilities, receipts and payments account, and income and expenditure account;
      <br/>(b) if the audit reports and financial statements do not contain activity-wise expenditure for the last three financial years, a chartered accountant&rsquo;s certificate in the format available on the website of Ministry of Home Affairs at https://fcraonline.nic.in specifying the activity-wise amount spent by the association, duly reconciled with the income and expenditure account and the receipt and payment account;
      <br/>(c) year-wise activity reports of last three years;
      <br/>(d) affidavit in proforma &ldquo;AA&rdquo; for each person mentioned in serial number 6 above;
      <br/>(e) in case the association is engaged in publication-related activities or if publication activities are among its aims and objectives as stated in the Memorandum of Association or trust deed, an undertaking from the Chief Functionary regarding compliance with section 3(1)(g) of the Foreign Contribution (Regulation) Act, 2010 (42 of 2010), in the format available on the website of Ministry of Home Affairs at https://fcraonline.nic.in;
      <br/>(f) if the publication of the association is registered with the Registrar of Newspaper for India, a &ldquo;Not a Newspaper&rdquo; certificate from the Registrar of the Newspaper for India shall be submitted in the format available on the website of Ministry of Home Affairs at https://fcraonline.nic.in;&rdquo;`

  return `
  <div class="pb">
    <div class="page">
      <div class="decl-hdr">Declaration and Undertaking</div>
      <div class="decl-item">
        <em>(a)</em> I/We (name of person/association) <span class="ul">${name}</span>, hereby declare that the information furnished above is true and correct;
      </div>
      <div class="decl-item">
        <em>(b)</em> I/We (name of person/association) <span class="ul">${name}</span>, undertake that the receipt of foreign contribution and its utilisation shall not be violative of any of the provisions of the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) and the rules, notifications or orders issued thereunder from time to time;${isFC3B ? '' : ' and'}
      </div>
      <div class="decl-item">
        <em>(c)</em> I/We (name of person/association) <span class="ul">${name}</span>, hereby certify that the office bearers and key functionaries and members fulfill all the eligibility criteria laid out in sub-section (4) of section 12 of the Foreign Contribution (Regulation) Act, 2010 and an affidavit executed by each office bearer and key functionary and member in Proforma &lsquo;AA&rsquo; is uploaded with this application form${isFC3B ? '.' : ''}
      </div>
      <div class="place-date">
        Place:<br/>
        Date:
      </div>
      <div class="closing">
        [Name of the chief functionary<br/>
        (Chairperson/President/Secretary/CEO/MD) <em>in block letters</em>]<br/>
        (Seal of the Organisation/Person/association)
      </div>
      <div class="note-block">${enclosureNote}</div>
    </div>
  </div>`
}

// ─── Form FC-3A ────────────────────────────────────────────────────────────────
function renderFC3A(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)
  const name = val(s1.legalBusinessName)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>

<div class="page">
  <div class="hdr">
    <div class="form-name">FORM FC&ndash;3A</div>
    <div class="rule-ref">(See clause <em>(a)</em> of sub-rule <em>(1)</em> of rule 9)</div>
  </div>

  <div class="meta-row">
    <span>No. <span class="ul-sm">&nbsp;</span></span>
    <span>Date <span class="ul-sm">&nbsp;</span></span>
  </div>
  <div>Darpan ID <span class="ul">${val(s2.darpanIDNITIAayog)}</span></div>

  <div class="address-block">
    The Secretary to the Government of India, Ministry of Home Affairs,<br/>
    Foreigners Division (FCRA Wing)<br/>
    New Delhi-110002
  </div>

  <div class="subject">
    Subject: &ndash; Application for &lsquo;registration&rsquo; under sub-section (1) of section 11 of the Foreign Contribution (Regulation)
    Act, 2010 (42 of 2010) for the acceptance of foreign contribution by an Person/association having definite cultural,
    economic, educational, religious or social programme:
  </div>

  <div class="sir">Sir,</div>

  <div class="intro">
    I/We (name of person/association) <span class="ul">${name}</span>, as an individual/ Hindu undivided family / person/association / company registered
    under Companies Act 1956 / Companies Act, 2013, furnish the following details and apply for approval of the Central
    Government for the acceptance of foreign contribution under sub-section (1) of section 11 of the Act for registration.
  </div>

  <div class="item">
    <span class="item-label">1.</span>&emsp;Expenditure incurred in last three years towards activities for which registration applied for [See
    clause <em>(b)</em> of sub-section <em>(4)</em> of section 12 of the Act]: (Rs): <span class="ans">${val(s2.expenditureOnAimsLast3FYs)}</span>
  </div>

  <div class="item">
    <span class="item-label">2.</span>&emsp;Details of the applicant/person/association:
    <div class="sub"><em>(a)</em>&emsp;Name in full: <span class="ans">${name}</span></div>
    <div class="sub"><em>(b)</em>&emsp;Address: <span class="ans">${address}</span></div>
    <div class="sub"><em>(c)</em>&emsp;Telephone number of the person/association (with STD code): <span class="ans">${val(s2.telephoneOfAssociation)}</span></div>
    <div class="sub"><em>(d)</em>&emsp;<em>e</em>-mail address of the person/association: <span class="ans">${val(s1.emailId)}</span></div>
    <div class="sub"><em>(e)</em>&emsp;official website address, if any: <span class="ans">${val(s2.officialWebsite)}</span></div>
    <div class="sub"><em>(f)</em>&emsp;Telephone number (with STD code) and mobile number of the chief functionary: <span class="ans">${val(s1.mobileNumber)}</span></div>
  </div>

  <div class="item">
    <span class="item-label">3.</span>&emsp;Details of registration:
    <div class="sub"><em>(a)</em>&emsp;Name of the Act (<em>i.e.</em> the Societies Registration Act, 1860, the Indian Trust Act, 1882, the Companies Act, 1956 / the Companies Act, 2013) under which the person/association is registered: <span class="ans">${val(s2.registrationActName)}</span></div>
    <div class="sub"><em>(b)</em>&emsp;Number, date and place of registration: <span class="ans">${val(s2.registrationNumberDatePlace)}</span><br/>
      <div style="margin-top:4px;font-style:italic;">(self-<em>certified copy of the registration certificate to be enclosed</em>):</div>
    </div>
    <div class="sub"><em>(c)</em>&emsp;PAN (Permanent Account Number) of the person/association: <span class="ans">${val(s1.panOfBusiness)}</span></div>
  </div>

  <div class="item">
    <span class="item-label">4.</span>&emsp;Nature of the person/association:
    <div class="sub"><em>(a)</em> religious &emsp;<em>(b)</em> cultural &emsp;<em>(c)</em> economic &emsp;<em>(d)</em> educational &emsp;<em>(e)</em> social</div>
    <div class="sub">Selected: <span class="ans">${val(s2.natureOfAssociation)}</span></div>
    <div class="sub" style="font-style:italic;font-size:9.5pt;"><strong>Note:</strong> <em>If a religious person/association, state whether (a) Hindu (b) Sikh (c) Muslim (d) Christian (e) Buddhist (f) Others.</em>${s2.religiousSubType ? ' Sub-type: <span class="ans" style="font-style:normal;">' + val(s2.religiousSubType) + '</span>' : ''}</div>
  </div>

  <div class="item">
    <span class="item-label">5.</span>&emsp;Main aim(s) and object(s) of the person/association<br/>
    <div style="font-style:italic;font-size:9.5pt;margin-top:2px;">(<em>enclose self-certified copy of the memorandum of person/association and/or the articles of person/association</em>):</div>
    <span class="ans-lg">${val(s2.mainAimAndObject)}</span>
  </div>
</div>

<!-- Page 2 -->
<div class="pb">
<div class="page">
  <div class="item">
    <span class="item-label">6.</span>&emsp;<em>(a)</em>&emsp;Details of all office bearers or directors or other key functionaries of the person/association:
    ${officeBearersTable(s2.officeBearersExecutiveCommitteeDetails)}
  </div>
  <div class="item">
    <em>(a)</em>&emsp;If any of the above is a foreigner (including PIO/OCI card holder), details thereof:
    ${foreignerTable()}
  </div>
  <div class="item">
    <span class="item-label">7.</span>&emsp;Amount of fee paid (Rs.): <span class="ans">&nbsp;</span>
  </div>
  <div class="item">
    <span class="item-label">8.</span>&emsp;Whether any current office bearers or directors or other key functionaries of the person/association
    has, in the discharge of his/her official functions or private conduct:
    <div class="sub"><em>(a)</em>&emsp;been convicted by any court of law: <span class="ans">${val(s2.anyFunctionaryConvicted)}</span></div>
    <div class="sub"><em>(b)</em>&emsp;under prosecution for any offence pending against him: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(c)</em>&emsp;been found guilty of diversion or mis-utilisation of funds of the person/association or any other Person/association in the past: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(d)</em>&emsp;has been prohibited from accepting foreign contribution: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(e)</em>&emsp;is a current key functionary of any other person/association: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(f)</em>&emsp;is a current key functionary of any other person/association against whom an order under sections 13 or 14 of the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) has been passed: <span class="ans">&nbsp;</span></div>
    <div class="sub" style="font-style:italic;font-size:9.5pt;"><strong>Note:</strong> If any of the replies to <em>(a)</em> to <em>(f)</em> above is &ldquo;yes&rdquo;, then full details of the case must be given.</div>
    ${s2.anyFunctionaryConvicted && s2.anyFunctionaryConvicted.toLowerCase() === 'yes'
      ? `<div class="sub">Details: <span class="ans-lg">${val(s2.functionaryConvictionDetails)}</span></div>` : ''}
  </div>
  <div class="item">
    <span class="item-label">9.</span>&emsp;Whether the applicant person/association:
    <div class="sub"><em>(a)</em>&emsp;is a branch / unit / associate of a foreign based organisation or another person/association already registered or granted prior permission under the Act. If so, name, address of the organisation and registration number/ prior permission number and date: <span class="ans">${val(s2.isBranchOfForeignOrg)}</span>
    ${s2.isBranchOfForeignOrg && s2.isBranchOfForeignOrg.toLowerCase() === 'yes'
      ? `<div style="margin-top:4px;">Details: <span class="ans-lg">${val(s2.branchOfForeignOrgDetails)}</span></div>` : ''}</div>
    <div class="sub"><em>(b)</em>&emsp;attracts section 10 of the Act and if so, details of the order passed by the Central Government under sub-section <em>(3)</em> of section 11 of the Act: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(c)</em>&emsp;has been directed in terms of clause <em>(d)</em> of section 9 of the Act to seek prior permission by the Central Government. If so, the number and date of the relevant order: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(d)</em>&emsp;had earlier been proceeded against as per provision of the Foreign Contribution (Regulation) Act, 1976 (49 of 1976) or the Foreign Contribution (Regulation) Act, 2010 (42 of 2010), if so, the details thereof: <span class="ans">&nbsp;</span></div>
  </div>
</div>
</div>

<!-- Page 3 -->
<div class="pb">
<div class="page">
  <div class="item">
    <span class="item-label">10.</span>&emsp;Details of &ldquo;FCRA Account&rdquo; for receipt of foreign contribution:
    ${fcraAccountTable(s1, s2)}
  </div>
  <div class="item">
    <span class="item-label">11.</span>&emsp;<em>(i) (a)</em>&emsp;If granted prior permission in past to receive foreign contribution, number and date of sanction: <span class="ans">${val(s2.priorPermissionGrantedPast)}</span>
    ${s2.priorPermissionGrantedPast && s2.priorPermissionGrantedPast.toLowerCase() === 'yes'
      ? `<div class="sub">Details: <span class="ans-lg">${val(s2.priorPermissionDetails)}</span></div>` : ''}
    <div class="sub"><em>(b)</em>&emsp;Date of submission of yearly accounts thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(ii)</em>&emsp;Whether:
      <div class="sub2"><em>(a)</em>&emsp;the person/association has received foreign contribution without prior permission in the past. If so, furnish full particulars: <span class="ans">${val(s2.receivedFCWithoutPermission)}</span>
      ${s2.receivedFCWithoutPermission && s2.receivedFCWithoutPermission.toLowerCase() === 'yes'
        ? `<div style="margin-top:4px;">Details: <span class="ans-lg">${val(s2.fcReceivedWithoutPermissionDetails)}</span></div>` : ''}</div>
      <div class="sub2"><em>(b)</em>&emsp;said violation has been condoned/ compounded by the Central Government, if so, the number and date of the relevant order: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(c)</em>&emsp;person/association has been prohibited from accepting foreign contribution, if so, details thereof: <span class="ans">&nbsp;</span></div>
    </div>
  </div>
  <div class="item">
    <span class="item-label">12.</span>&emsp;Whether:
    <div class="sub"><em>(i)</em>&emsp;the person/association had applied for registration under the Foreign Contribution (Regulation) Act, 1976 (49 of 1976) or the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) in the past, and if so details thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(ii)</em>&emsp;the person/association had applied for prior permission under the Foreign Contribution (Regulation) Act, 1976 (49 of 1976) or the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) in the past, and if so, details thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(iii)</em>&emsp;the person/association has close links with any another person/association, or its unit or branch, which has been:
      <div class="sub2"><em>(a)</em>&emsp;refused registration / prior permission: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(b)</em>&emsp;prohibited from accepting foreign contribution: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(c)</em>&emsp;suspended or whose registration has been cancelled: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(d)</em>&emsp;if answer to any of (a) to (c) is yes, please give full particulars: <span class="ans">&nbsp;</span></div>
    </div>
    <div class="sub"><em>(iv)</em>&emsp;the person/association was already registered under the Foreign Contribution (Regulation) Act, 2010 and the registration is cancelled/ deemed to have been ceased, if so, details thereof:
      <div class="sub2"><em>(a)</em>&emsp;Registration No. <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(b)</em>&emsp;Date of registration <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(c)</em>&emsp;Annual returns submitted (year-wise): <span class="ans">&nbsp;</span></div>
    </div>
  </div>
  <div class="closing">
    Yours faithfully,<br/>
    [Name of the chief functionary<br/>
    (Chairperson/President/Secretary/CEO/MD) <em>in block letters</em>]<br/>
    (Seal of the person/association)
  </div>
</div>
</div>

${declarationAndUndertaking(s1, s2, false)}

</body>
</html>`
}

// ─── Form FC-3B ────────────────────────────────────────────────────────────────
function renderFC3B(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)
  const name = val(s1.legalBusinessName)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>${commonCSS()}</style>
</head>
<body>

<div class="page">
  <div class="hdr">
    <div class="form-name">FORM FC&ndash;3B</div>
    <div class="rule-ref">(See clause <em>(a)</em> of sub-rule <em>(1)</em> of rule 9)</div>
  </div>

  <div class="meta-row">
    <span>No. <span class="ul-sm">&nbsp;</span></span>
    <span>Date <span class="ul-sm">&nbsp;</span></span>
  </div>
  <div>Darpan ID <span class="ul">${val(s2.darpanIDNITIAayog)}</span></div>

  <div class="address-block">
    The Secretary to the Government of India, Ministry of Home Affairs,<br/>
    Foreigners Division (FCRA Wing)<br/>
    New Delhi-110002
  </div>

  <div class="subject">
    Subject: &ndash;Application for &lsquo;prior permission&rsquo; under sub-section <em>(2)</em> of section 11 of the Foreign Contribution
    (Regulation) Act, 2010 (42 of 2010) for the acceptance of foreign contribution by a person/association having
    definite cultural, economic, educational, religious or social programme:
  </div>

  <div class="sir">Sir,</div>

  <div class="intro">
    I/ We (name of person/association) <span class="ul">${name}</span>, as an individual/ Hindu undivided family /
    person/association / company registered under the Companies Act 1956 or the Companies Act, 2013, furnish
    the following details and apply for approval of the Central Government for the acceptance of foreign
    contribution under sub-section (2) of section 11 of the Act for prior permission.
  </div>

  <div class="item">
    <span class="item-label">1.</span>&emsp;Details of the applicant/person/association:
    <div class="sub"><em>(a)</em>&emsp;Name in full: <span class="ans">${name}</span></div>
    <div class="sub"><em>(b)</em>&emsp;Address: <span class="ans">${address}</span></div>
    <div class="sub"><em>(c)</em>&emsp;Telephone No. of the person/association (with STD code): <span class="ans">${val(s2.telephoneOfAssociation)}</span></div>
    <div class="sub"><em>(d)</em>&emsp;e-mail address of the person/association: <span class="ans">${val(s1.emailId)}</span></div>
    <div class="sub"><em>(e)</em>&emsp;official Website address, if any: <span class="ans">${val(s2.officialWebsite)}</span></div>
    <div class="sub"><em>(f)</em>&emsp;Telephone and mobile (with STD code) of the chief functionary: <span class="ans">${val(s1.mobileNumber)}</span></div>
  </div>

  <div class="item">
    <span class="item-label">2.</span>&emsp;Details of registration:
    <div class="sub"><em>(a)</em>&emsp;Name of the Act (<em>i.e.</em> the Societies Registration Act, 1860, the Indian Trust Act, 1882, the Companies Act, 1956 / the Companies Act, 2013) under which the person/association is registered: <span class="ans">${val(s2.registrationActName)}</span></div>
    <div class="sub"><em>(b)</em>&emsp;Number, date and place of registration: <span class="ans">${val(s2.registrationNumberDatePlace)}</span><br/>
      <div style="margin-top:4px;font-style:italic;">(self-<em>certified copy of the registration certificate to be enclosed</em>):</div>
    </div>
    <div class="sub"><em>(c)</em>&emsp;PAN (Permanent Account Number) of the person/association: <span class="ans">${val(s1.panOfBusiness)}</span></div>
  </div>

  <div class="item">
    <span class="item-label">3.</span>&emsp;Nature of person/association:
    <div class="sub"><em>a.</em> religious &emsp;<em>(b)</em> cultural &emsp;<em>(c)</em> economic &emsp;<em>(d)</em> educational &emsp;<em>(e)</em> social</div>
    <div class="sub">Selected: <span class="ans">${val(s2.natureOfAssociation)}</span></div>
    <div class="sub" style="font-style:italic;font-size:9.5pt;"><strong>Note:</strong> <em>If a religious person/association, state whether (a) Hindu (b) Sikh (c) Muslim (d) Christian (e) Buddhist (f) Others.</em>${s2.religiousSubType ? ' Sub-type: <span class="ans" style="font-style:normal;">' + val(s2.religiousSubType) + '</span>' : ''}</div>
  </div>

  <div class="item">
    <span class="item-label">4.</span>&emsp;Main aim and object of the person/association<br/>
    <div style="font-style:italic;font-size:9.5pt;margin-top:2px;">(<em>enclose self-certified copy the memorandum of Person/association and/or the articles of person/association</em>):</div>
    <span class="ans-lg">${val(s2.mainAimAndObject)}</span>
  </div>

  <div class="item">
    <span class="item-label">5.</span>&emsp;<em>(a)</em>&emsp;Details of all office bearers or directors or other key functionaries of the person/association:
    ${officeBearersTable(s2.officeBearersExecutiveCommitteeDetails)}
  </div>
</div>

<!-- Page 2 -->
<div class="pb">
<div class="page">
  <div class="item">
    <em>(b)</em>&emsp;If any of the above is a foreigner (including PIO/OCI card holder), details thereof:
    ${foreignerTable()}
  </div>
  <div class="item">
    <span class="item-label">6.</span>&emsp;Amount of fee paid (Rs.): <span class="ans">&nbsp;</span>
  </div>
  <div class="item">
    <span class="item-label">7.</span>&emsp;Whether any current office bearers or directors or other key functionaries of the person/association has, in the discharge of his official functions or private conduct:
    <div class="sub"><em>(a)</em>&emsp;been convicted by any court of law: <span class="ans">${val(s2.anyFunctionaryConvicted)}</span></div>
    <div class="sub"><em>(b)</em>&emsp;under prosecution for any offence pending against him: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(c)</em>&emsp;been found guilty of diversion or misutilisation of funds of the Person/association or any other person/association in the past: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(d)</em>&emsp;has been prohibited from accepting foreign contribution: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(e)</em>&emsp;is a current key functionary of any other person/association: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(f)</em>&emsp;is a current key functionary of any other person/association against whom an order under sections 13 or 14 of the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) has been passed: <span class="ans">&nbsp;</span></div>
    <div class="sub" style="font-style:italic;font-size:9.5pt;"><strong>Note:</strong> If any of the replies to <em>(a)</em> to <em>(f)</em> above is &ldquo;yes&rdquo;, then full details of the case must be given:</div>
    ${s2.anyFunctionaryConvicted && s2.anyFunctionaryConvicted.toLowerCase() === 'yes'
      ? `<div class="sub">Details: <span class="ans-lg">${val(s2.functionaryConvictionDetails)}</span></div>` : ''}
  </div>
  <div class="item">
    <span class="item-label">8.</span>&emsp;Whether the applicant person/association:
    <div class="sub"><em>(a)</em>&emsp;is a branch / unit / associate of a foreign based organisation or another person/association already registered or granted prior permission under the Act. If so, name, address of the organisation and registration number/ prior permission number and date: <span class="ans">${val(s2.isBranchOfForeignOrg)}</span>
    ${s2.isBranchOfForeignOrg && s2.isBranchOfForeignOrg.toLowerCase() === 'yes'
      ? `<div style="margin-top:4px;">Details: <span class="ans-lg">${val(s2.branchOfForeignOrgDetails)}</span></div>` : ''}</div>
    <div class="sub"><em>(b)</em>&emsp;attracts section 10 of the Act and if so, details of the order passed by the Central Government under sub-section <em>(3)</em> of section 11 of the Act: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(c)</em>&emsp;has been directed in terms of clause <em>(d)</em> of section 9 of the Act to seek prior permission by the Central Government. If so, the number and date of the relevant order: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(d)</em>&emsp;had earlier been proceeded against as per provision of the Foreign Contribution (Regulation) Act, 1976 (49 of 1976) or the Foreign Contribution (Regulation) Act, 2010 (42 of 2010), if so, the details thereof: <span class="ans">&nbsp;</span></div>
  </div>
  <div class="item">
    <span class="item-label">9.</span>&emsp;Details of FCRA bank account for receipt of foreign contribution:
    ${fcraAccountTable(s1, s2)}
  </div>
</div>
</div>

<!-- Page 3 -->
<div class="pb">
<div class="page">
  <div class="item">
    <span class="item-label">10.</span>&emsp;<em>(i) (a)</em>&emsp;If granted prior permission in past to receive foreign contribution, number and date of sanction: <span class="ans">${val(s2.priorPermissionGrantedPast)}</span>
    ${s2.priorPermissionGrantedPast && s2.priorPermissionGrantedPast.toLowerCase() === 'yes'
      ? `<div class="sub">Details: <span class="ans-lg">${val(s2.priorPermissionDetails)}</span></div>` : ''}
    <div class="sub"><em>(b)</em>&emsp;Date of submission of yearly accounts thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(ii)</em>&emsp;Whether:</div>
  </div>
  <div class="item">
    <span class="item-label">11.</span>&emsp;Whether:
    <div class="sub"><em>(a)</em>&emsp;the person/association has received foreign contribution without prior permission in the past. If so, furnish full particulars: <span class="ans">${val(s2.receivedFCWithoutPermission)}</span>
    ${s2.receivedFCWithoutPermission && s2.receivedFCWithoutPermission.toLowerCase() === 'yes'
      ? `<div style="margin-top:4px;">Details: <span class="ans-lg">${val(s2.fcReceivedWithoutPermissionDetails)}</span></div>` : ''}</div>
    <div class="sub"><em>(b)</em>&emsp;said violation has been condoned/ compounded by the Central Government, if so, the number and date of the relevant order: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(c)</em>&emsp;Person/association has been prohibited from accepting foreign contribution, if so, details thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(i)</em>&emsp;the person/association had applied for registration under the Foreign Contribution (Regulation) Act, 1976 (49 of 1976) or the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) in the past, and if so details thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(ii)</em>&emsp;the person/association had applied for prior permission under the Foreign Contribution (Regulation) Act, 1976 (49 of 1976) or the Foreign Contribution (Regulation) Act, 2010 (42 of 2010) in the past, and if so, details thereof: <span class="ans">&nbsp;</span></div>
    <div class="sub"><em>(iii)</em>&emsp;the person/association has close links with any another person/association, or its unit or branch, which has been:
      <div class="sub2"><em>(a)</em>&emsp;refused registration / prior permission: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(b)</em>&emsp;prohibited from accepting foreign contribution: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(c)</em>&emsp;suspended or whose registration has been cancelled: <span class="ans">&nbsp;</span></div>
      <div class="sub2"><em>(d)</em>&emsp;if answer to any of (a) to (c) is yes, please give full particulars: <span class="ans">&nbsp;</span></div>
    </div>
  </div>
  <div class="item">
    <span class="item-label">12.</span>&emsp;Details of commitment of foreign contribution from donor:
    <table class="t" style="margin-top:8px;">
      <thead>
        <tr>
          <th>Nature of the foreign contribution<br/>(1)</th>
          <th>Value (including name of currency)<br/>(2)</th>
          <th>Name of the project/ Activity; address of implementation with brief details of the project and budget break-up<br/>(3)</th>
          <th>Purpose (Cultural/ economic/ educational/ religious/ social)<br/>(4)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${val(s2.natureOfContribution)}</td>
          <td>${s2.contributionValue ? val(s2.contributionValue) + (s2.contributionCurrency ? ' ' + val(s2.contributionCurrency) : '') : '&nbsp;'}</td>
          <td>${val(s2.projectDescriptionFC3B)}${s2.projectActivityAddress ? '<br/>' + val(s2.projectActivityAddress) : ''}</td>
          <td>${val(s2.natureOfAssociation)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="item">
    <span class="item-label">13.</span>&emsp;Details of foreign source(s) from which the foreign contribution is proposed to be received:
    <table class="t" style="margin-top:8px;">
      <thead>
        <tr>
          <th rowspan="2">Name of foreign source<br/>(1)</th>
          <th rowspan="2">Office address; official <em>e</em>-mail address<br/>(2)</th>
          <th colspan="3" style="text-align:center;">In case of individual donor<br/>(3)</th>
        </tr>
        <tr>
          <th>Name of father/spouse</th>
          <th>Nationality and passport number</th>
          <th>Occupation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${val(s2.foreignDonorName)}</td>
          <td>${val(s2.foreignDonorOfficeAddress)}${s2.foreignDonorEmail ? '<br/>' + val(s2.foreignDonorEmail) : ''}</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="closing">
    Yours faithfully,<br/>
    [Name of the chief functionary<br/>
    (Chairperson/President/Secretary/CEO/MD) <em>in block letters</em>]<br/>
    (Seal of the person/association)
  </div>
</div>
</div>

${declarationAndUndertaking(s1, s2, true)}

</body>
</html>`
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────
module.exports = function fcraRegistrationTemplate(formData) {
  const type = ((formData.step2 || {}).applicationType || '').toLowerCase()
  if (type.includes('fc-3b') || type.includes('fc3b') || type.includes('prior permission')) return renderFC3B(formData)
  return renderFC3A(formData)
}
