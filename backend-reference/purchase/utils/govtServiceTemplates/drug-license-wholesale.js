'use strict'

function esc(v) { return v != null ? String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

function buildAddress(s1) {
  return [s1.addressLine1, s1.addressLine2, s1.city, s1.stateUT, s1.pinCode]
    .filter(Boolean).map(esc).join(', ')
}

function drugCategories(s2) {
  if (Array.isArray(s2.drugCategoriesToBeDistributed)) return esc(s2.drugCategoriesToBeDistributed.join(', '))
  return val(s2.drugCategoriesToBeDistributed)
}

module.exports = function drugLicenseWholesaleTemplate(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}
  const address = buildAddress(s1)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
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
  .hdr .form-name  { font-size: 14pt; font-weight: bold; text-decoration: underline; }
  .hdr .rule-ref   { font-size: 10.5pt; font-style: italic; margin-top: 2px; }
  .hdr .subtitle   { font-size: 11pt; margin-top: 8px; line-height: 1.7; }
  .hdr .subtitle u { text-decoration: underline; }

  .item { margin-bottom: 22px; line-height: 1.9; text-align: justify; }
  .item-italic { font-style: italic; line-height: 1.7; margin-bottom: 22px; text-align: justify; }

  .ul {
    display: inline-block;
    border-bottom: 1px solid #000;
    min-height: 20px;
    padding: 0 3px;
    vertical-align: bottom;
  }

  .exp-box {
    border: 1px solid #000;
    width: 260px;
    min-height: 140px;
    margin: 10px auto;
    padding: 8px 10px;
    font-size: 11pt;
    line-height: 1.8;
  }
  .exp-box .exp-title { text-align: center; font-size: 10.5pt; margin-bottom: 4px; }

  .licence-info { margin-top: 18px; font-size: 11pt; line-height: 2; }
  .licence-info .ul { min-width: 80px; }

  .auth-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;
  }
  .auth-label {
    font-weight: bold;
    text-decoration: underline;
    font-size: 11pt;
  }

  .conditions { margin-top: 36px; }
  .conditions-title {
    text-align: center;
    font-weight: bold;
    text-decoration: underline;
    font-size: 11pt;
    margin-bottom: 14px;
  }
  .cond-item { margin-bottom: 12px; line-height: 1.8; text-align: justify; }
  .cond-sub  { margin-left: 24px; margin-top: 6px; line-height: 1.8; text-align: justify; }

  .stars { text-align: center; margin-top: 28px; font-size: 11pt; letter-spacing: 4px; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="hdr">
    <div class="form-name">FORM 21-B</div>
    <div class="rule-ref">(See Rule 61 (3)</div>
    <div class="subtitle">
      Licence to sell, stock or exhibit for sale or distribute by wholesale drugs specified in <u>Schedules C</u><br/>
      <u>and C (1)</u>
    </div>
  </div>

  <!-- Para 1 -->
  <div class="item">
    1.&nbsp; Shri./Smt. <span class="ul" style="min-width:180px;">${val(s1.signatoryFullName)}</span>,
    Proprietor of M/s. <span class="ul" style="min-width:180px;">${val(s1.legalBusinessName)}</span>
    is hereby licensed to sell, stock or exhibit for sale or distribute by wholesale in the premises at
    <span class="ul" style="min-width:300px;">${address}</span>
    <em>of</em> the following categories of drugs specified in Schedules C and C (1) of the Drugs and Cosmetics Rules, 1945.
  </div>

  <!-- Para 2 -->
  <div class="item">
    <strong>2.</strong>&nbsp;&nbsp;Categories of Drugs: <strong><em>Drugs Specified in Schedules C &amp; C(I)${drugCategories(s2) ? ' &mdash; ' + drugCategories(s2) : ''}</em></strong>
  </div>

  <!-- Italic validity note -->
  <div class="item-italic">
    &emsp;<em>The Licence unless sooner suspended or cancelled, shall remain valid perpetually. However, the
    compliance with the conditions of licence and the provisions of the Drugs and Cosmetics Act,
    1940 (23 of 1940) and the Drugs and Cosmetics Rules, 1945 shall be assessed not less than once
    in three years or as needed as per risk based approach.</em>
  </div>

  <!-- Para 3 -->
  <div class="item">
    3.&nbsp;&nbsp;The licence shall be in force from <span class="ul" style="min-width:80px;">&nbsp;</span>.
  </div>

  <!-- Experienced Person Box -->
  <div class="exp-box">
    <div class="exp-title">Experienced Person</div>
    <div>Shri./Smt. <span class="ul" style="min-width:140px;">${val(s2.competentPersonName)}</span></div>
    ${val(s2.competentPersonType) ? `<div style="margin-top:6px; font-size:10pt;">${val(s2.competentPersonType)}</div>` : ''}
    ${val(s2.competentPersonQualification) ? `<div style="font-size:10pt;">${val(s2.competentPersonQualification)}</div>` : ''}
  </div>

  <!-- Subject to conditions -->
  <div class="item" style="margin-top:22px;">
    &emsp;The licence is subject to the conditions stated below and to the provisions of the Drugs
    and Cosmetics Act, 1940 and the rules there under.
  </div>

  <!-- Licence No & Date -->
  <div class="licence-info">
    <div>Licence No. <span class="ul" style="min-width:80px;">&nbsp;</span>.</div>
    <div>Date: <span class="ul" style="min-width:80px;">&nbsp;</span>.</div>
  </div>

  <!-- Licensing Authority -->
  <div class="auth-row">
    <span class="auth-label">Licensing Authority</span>
  </div>

  <!-- Conditions of Licence -->
  <div class="conditions">
    <div class="conditions-title">CONDITIONS OF LICENCE</div>

    <div class="cond-item">
      1.&emsp;This licence shall be displayed in a prominent place in a part of the premises open to the public.
    </div>

    <div class="cond-item">
      2.&emsp;No drug to which this licence applies shall be sold or stocked and exhibited for sale unless the
      precautions as are published by the Licensing Authority from time to time in the Gazette have
      been observed throughout the period during which it has been in the possession of the licensee.
    </div>

    <div class="cond-item">
      3.&emsp;If the licensee wants to sell, stock and exhibit for sale, or distribute, during the currency of the
      licence additional categories of drugs listed in Schedules C and C (1) but not included in this
      licence, he should apply to the Licensing Authority for the permission. This licence will be
      deemed to extend to the categories of drugs in respect of which such permission is given. This
      permission shall be endorsed on the licence by the Licensing Authority.
    </div>

    <div class="cond-item">
      4. (i)&emsp;No drug shall be sold unless such drugs purchased under a cash or credit memo from a duly
      licensed dealer or a duly licensed manufacturer.
      <div class="cond-sub">
        (ii)&emsp;No sale of any drug shall be made for purposes of resale to a person not holding the requisite
        licence to sell, stock or exhibit for sale or distribute the drug.
        <div style="margin-top:6px;">
          &emsp;Provided that this condition shall not apply to the sale of any drug to :&ndash;
        </div>
        <div style="margin-top:4px; margin-left:16px;">(a)&ensp;an officer or authority purchasing on behalf of Government, or</div>
        <div style="margin-top:4px; margin-left:16px;">
          (b)&ensp;a hospital, medical, educational or research institution, or a registered medical practitioner for the
          purpose of supply to his patients.
        </div>
      </div>
    </div>

    <div class="cond-item">
      4.&emsp;The licensee shall inform the Licensing Authority in writing in the event of any change in the
      constitution of the firm operating under the licence. Where any change in the constitution of the
      firm takes place, the current licence shall be deemed to be valid for a maximum period of three
      months from the date on which the change takes place unless, in the meantime, a fresh licence has
      been taken from the Licensing Authority in the name of the firm with the changed constitution.
    </div>

  </div>

  <div class="stars">*******</div>

</div>
</body>
</html>`
}
