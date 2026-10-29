'use strict'

function chk(v) { return v ? '&#9745;' : '&#9744;' }
function esc(v) { return v != null ? String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '' }
function val(v) { return (v != null && v !== '') ? esc(v) : '' }

function formatDate(d) {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return esc(d)
}

function applicantNatureChecked(applicantType, option) {
  if (!applicantType) return false
  const t = applicantType.toLowerCase()
  if (option === 'Individual')       return t.includes('individual') || t.includes('sole proprietor')
  if (option === 'Partnership')      return t.includes('partner')
  if (option === 'BodyIncorporate')  return t.includes('private limited') || t.includes('public limited') || t.includes('pvt') || t.includes('ltd') || t.includes('company')
  if (option === 'LLP')              return t.includes('llp') || t.includes('limited liability partnership')
  if (option === 'Society')          return t.includes('society')
  if (option === 'Trust')            return t.includes('trust')
  if (option === 'GovtDept')         return t.includes('government') || t.includes('govt')
  if (option === 'Statutory')        return t.includes('statutory')
  if (option === 'Association')      return t.includes('association')
  if (option === 'HUF')              return t.includes('huf') || t.includes('hindu undivided')
  return false
}

function trademarkCategoryChecked(trademarkType, option) {
  if (!trademarkType) return false
  const t = trademarkType.toLowerCase()
  if (option === 'Word')   return t.includes('word')
  if (option === 'Device') return t.includes('device') || t.includes('logo') || t.includes('pattern') || t.includes('label') || t.includes('monogram') || t.includes('sticker')
  if (option === 'Colour') return t.includes('colour') || t.includes('color')
  if (option === '3D')     return t.includes('3d') || t.includes('three dimensional') || t.includes('shape') || t.includes('packaging')
  if (option === 'Sound')  return t.includes('sound')
  return false
}

function filedAsChecked(reducedFeeEligibility, option) {
  if (!reducedFeeEligibility) return option === 'Others'
  const t = reducedFeeEligibility.toLowerCase()
  if (option === 'Individual')     return t.includes('individual')
  if (option === 'Startup')        return t.includes('startup') || t.includes('start-up') || t.includes('dpiit')
  if (option === 'SmallEnterprise') return t.includes('small enterprise') || t.includes('msme')
  if (option === 'Others')         return !['individual','startup','start-up','dpiit','small enterprise','msme'].some(k => t.includes(k))
  return false
}

module.exports = function trademarkRegistrationTemplate(formData) {
  const s1 = formData.step1 || {}
  const s2 = formData.step2 || {}

  const classes       = Array.isArray(s2.classesUnderNiceClassification) ? s2.classesUnderNiceClassification : []
  const proposedToBeUsed = val(s2.proposedToBeUsed).toLowerCase() === 'yes'
  const alreadyUsed      = val(s2.proposedToBeUsed).toLowerCase() === 'no'

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000; background: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 14mm 18mm; margin: 0 auto; }

  .hdr { text-align: center; margin-bottom: 16px; }
  .hdr .form-name  { font-size: 13pt; font-weight: bold; }
  .hdr .act-name   { font-size: 10.5pt; font-weight: bold; margin-top: 3px; }
  .hdr .title      { font-size: 10.5pt; font-weight: bold; margin-top: 3px; }
  .hdr .subtitle   { font-size: 8.5pt; font-style: italic; margin-top: 5px; }

  table.fm { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
  table.fm td { border: 1px solid #000; padding: 7px 9px; vertical-align: top; }
  .sno { width: 26px; font-weight: bold; text-align: center; white-space: nowrap; }
  .lbl { font-weight: bold; }
  .note { font-size: 8pt; font-style: italic; color: #333; margin-top: 4px; line-height: 1.45; }
  .green { background: #d9ead3; }

  .ul  { display: inline-block; border-bottom: 1px solid #000; min-width: 140px; min-height: 18px; padding: 1px 4px; vertical-align: bottom; }
  .ulb { display: block; border-bottom: 1px solid #000; min-height: 18px; padding: 1px 4px; margin-top: 5px; width: 100%; }

  .cbr { display: flex; align-items: flex-start; gap: 5px; margin-bottom: 5px; line-height: 1.4; }
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="form-name">FORM TM-A</div>
    <div class="act-name">The Trade Marks Act, 1999</div>
    <div class="title">Application for registration of a trademark</div>
    <div class="subtitle">[The relevant information must be filled up in coloured box against the respective head]</div>
  </div>

  <table class="fm">

    <!-- 1. Nature of Application -->
    <tr>
      <td class="sno">1.</td>
      <td colspan="2">
        <div class="lbl">NATURE OF THE APPLICATION:</div>
        <div class="note">[(a) The applicant must choose either of the following categories&mdash;</div>
        <div style="margin-top:6px;">
          <div class="cbr"><span>${chk(true)}</span><span>1. Standard trademark</span></div>
          <div class="cbr"><span>${chk(false)}</span><span>2. Collective Mark</span></div>
          <div class="cbr"><span>${chk(false)}</span><span>3. Certification Mark</span></div>
          <div class="cbr"><span>${chk(false)}</span><span>4. Series Marks</span></div>
        </div>
        <div class="note">Standard trademark here means an application for registration of a trademark not being a Collective or Certification trademark or Series of marks<br/>
        (b) In case of Collective Mark or Certification Mark the draft regulations with form TM-M must be submitted.]</div>
      </td>
    </tr>

    <!-- 2. Filed as + Fee -->
    <tr>
      <td class="sno">2.</td>
      <td style="width:55%;">
        <div class="lbl">Whether application filed as <span style="font-weight:normal;">(Please choose and specify)</span></div>
        <div style="margin-top:6px;">
          <div class="cbr"><span>${chk(filedAsChecked(s1.reducedFeeEligibility, 'Individual'))}</span><span>Individual</span></div>
          <div class="cbr"><span>${chk(filedAsChecked(s1.reducedFeeEligibility, 'Startup'))}</span><span>startup</span></div>
          <div class="cbr"><span>${chk(filedAsChecked(s1.reducedFeeEligibility, 'SmallEnterprise'))}</span><span>Small Enterprise</span></div>
          <div class="cbr"><span>${chk(filedAsChecked(s1.reducedFeeEligibility, 'Others'))}</span><span>others</span></div>
        </div>
        <div class="note">In case of startup/ Small Enterprise, requisite certificate should be provided.</div>
      </td>
      <td class="green">
        <div class="lbl">FEE:</div>
        <div class="note">(See First Schedule for Appropriate Fee)</div>
      </td>
    </tr>

    <!-- 3. Applicant -->
    <tr>
      <td class="sno">3.</td>
      <td colspan="2">
        <div class="lbl">APPLICANT</div>
        <div style="margin-top:8px;">
          <span class="lbl">Name: *</span>
          <span class="ul" style="min-width:320px;">${val(s1.legalNameOfApplicant)}</span>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">Trading as:</span>
          <span class="ul" style="min-width:320px;">&nbsp;</span>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">Address: *</span>
          <div class="ulb">${esc(s1.addressOfApplicant).replace(/\n/g, '<br/>')}</div>
        </div>
        <div style="margin-top:7px; display:flex; gap:24px;">
          <span>(State)&nbsp;<span class="ul" style="min-width:130px;">${val(s1.stateUT)}</span></span>
          <span>(Country)&nbsp;<span class="ul" style="min-width:130px;">${val(s1.nationality)}</span></span>
        </div>
        <div class="note">[ This address should be the address of the applicant&rsquo;s principal place of business in India ]</div>

        <div style="margin-top:10px;">
          <span class="lbl">Address for service:</span>
          <div class="ulb">&nbsp;</div>
        </div>
        <div style="margin-top:7px; display:flex; gap:24px;">
          <span>(State)&nbsp;<span class="ul" style="min-width:130px;">&nbsp;</span></span>
          <span>(Country)&nbsp;<span class="ul" style="min-width:130px;">&nbsp;</span></span>
        </div>
        <div class="note">[(a) Unless otherwise specifically stated, the applicant&rsquo;s address shall be the address for service of the applicant who has principal place of business in India.
        <br/>(b) The address for service in India must be provided, in case the applicant does not carry business in India]</div>

        <div style="margin-top:10px;">
          <span class="lbl">Mobile No.:</span>
          <span class="ul" style="min-width:180px;">${val(s1.mobileNumber)}</span>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">E-mail address *:</span>
          <span class="ul" style="min-width:220px;">${val(s1.email)}</span>
        </div>

        <div style="margin-top:10px;">
          <div class="lbl">Nature of the applicant:</div>
          <div class="note">[The applicant must choose either of the following categories&mdash;</div>
          <div style="margin-top:6px; display:grid; grid-template-columns:1fr 1fr; gap:3px 20px;">
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'Individual'))}</span><span>1. Individual</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'Partnership'))}</span><span>2. Partnership Firm</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'BodyIncorporate'))}</span><span>3. Body-incorporate including Private Limited/limited Company</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'LLP'))}</span><span>4. Limited Liability Partnership</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'Society'))}</span><span>5. Society</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'Trust'))}</span><span>6. Trust</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'GovtDept'))}</span><span>7. Government Department</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'Statutory'))}</span><span>8. Statutory Organization</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'Association'))}</span><span>9. Association of persons</span></div>
            <div class="cbr"><span>${chk(applicantNatureChecked(s1.applicantType, 'HUF'))}</span><span>10. Hindu Undivided Family</span></div>
          </div>
        </div>
      </td>
    </tr>

    <!-- 4. Applicant's Agent -->
    <tr>
      <td class="sno">4.</td>
      <td colspan="2">
        <div class="lbl">APPLICANT&rsquo;S AGENT (if any):</div>
        <div style="margin-top:8px;">
          <span class="lbl">Name *:</span>
          <span class="ul" style="min-width:320px;">&nbsp;</span>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">Address *:</span>
          <div class="ulb">&nbsp;</div>
        </div>
        <div class="note">[In case of authorization of agent, the address of the agent may be mentioned as the applicant&rsquo;s address for service]</div>
        <div style="margin-top:7px;">
          <span class="lbl">Mobile No. *:</span>
          <span class="ul" style="min-width:180px;">&nbsp;</span>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">E-mail address *:</span>
          <span class="ul" style="min-width:220px;">&nbsp;</span>
        </div>
        <div style="margin-top:10px;">
          <div class="lbl">Nature of the Agent:</div>
          <div class="note">[The applicant must choose either of the following categories&mdash;</div>
          <div style="margin-top:6px;">
            <div class="cbr"><span>${chk(false)}</span><span>1. Registered Trade Marks Agent</span></div>
            <div class="cbr"><span>${chk(false)}</span><span>2. Advocate</span></div>
            <div class="cbr"><span>${chk(false)}</span><span>3. Constituted Attorney]</span></div>
          </div>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">Registration No.:</span>
          <span class="ul" style="min-width:220px;">&nbsp;</span>
        </div>
      </td>
    </tr>

    <!-- 5. Trademark -->
    <tr>
      <td class="sno">5.</td>
      <td style="width:55%;">
        <div class="lbl">TRADEMARK:</div>
        <div style="margin-top:10px;">
          <div class="lbl">Category of mark:</div>
          <div class="note">[The applicant must choose either of the following categories&mdash;</div>
          <div style="margin-top:6px;">
            <div class="cbr"><span>${chk(trademarkCategoryChecked(s2.trademarkType, 'Word'))}</span><span>1. <strong>Word mark</strong> (it includes one or more words, letters, numerals or anything written in standard character)</span></div>
            <div class="cbr"><span>${chk(trademarkCategoryChecked(s2.trademarkType, 'Device'))}</span><span>2. <strong>Device mark</strong> (it includes any label, sticker, monogram, logo or any geometrical figure other than word mark)</span></div>
            <div class="cbr"><span>${chk(trademarkCategoryChecked(s2.trademarkType, 'Colour'))}</span><span>3. <strong>Colour</strong> (when the distinctiveness is claimed in the combination of colours with or without device)</span></div>
            <div class="cbr"><span>${chk(trademarkCategoryChecked(s2.trademarkType, '3D'))}</span><span>4. <strong>Three dimensional trademark</strong> (it includes shape or packaging of goods)</span></div>
            <div class="cbr"><span>${chk(trademarkCategoryChecked(s2.trademarkType, 'Sound'))}</span><span>4. <strong>Sound</strong></span></div>
          </div>
        </div>
        <div style="margin-top:10px;">
          <div class="lbl">Description of the mark:</div>
          <div class="ulb">&nbsp;</div>
          <div class="ulb">&nbsp;</div>
          <div class="note">[(a) Description of mark must be provided in terms of Rule 26.<br/>
          (b) In case of trademarks submitted in specific combination of colours other than black and white, it shall be presumed that the distinctiveness of the mark is claimed in that combination of colours and application will be considered accordingly.<br/>
          (c) In case of colour marks the description may be like &ldquo;The trade mark consists of three vertical stripes in the colours PURPLE, GREEN and YELLOW applied to the fascias of buildings and to doors as shown in the representation of the mark.&rdquo;<br/>
          (d) In case of sound marks representation of specific musical notes must be submitted at the place provided for the trademark. The applicant is also required to submit sound clipping in MP3]</div>
        </div>
      </td>
      <td class="green" style="text-align:center; vertical-align:middle; font-style:italic; color:#444; font-size:9pt;">
        (trademark to be mentioned here)
      </td>
    </tr>

    <!-- 6. Mark in language other than Hindi or English -->
    <tr>
      <td class="sno">6.</td>
      <td colspan="2">
        <div class="lbl">IF MARK IN A LANGUAGE OTHER THAN HINDI OR ENGLISH:</div>
        <div style="margin-top:8px;">
          <span class="lbl">Language:</span>
          <span class="ul" style="min-width:220px;">&nbsp;</span>
        </div>
        <div style="margin-top:7px;">
          <span class="lbl">Transliteration of the mark in roman script:</span>
          <span class="ul" style="min-width:200px;">${val(s2.translationTransliteration)}</span>
        </div>
        <div class="note">[Transliteration of the mark in roman script must be provided in case the mark is in a language other than Hindi or English]</div>
        <div style="margin-top:7px;">
          <span class="lbl">Translation of the mark in English:</span>
          <span class="ul" style="min-width:200px;">${val(s2.translationTransliteration)}</span>
        </div>
        <div class="note">[Translation of the mark in English must be provided in case the mark is in a language other than Hindi or English]</div>
      </td>
    </tr>

    <!-- 7. Conditions or Limitations -->
    <tr>
      <td class="sno">7.</td>
      <td colspan="2">
        <span class="lbl">Conditions or Limitations</span> to use the trademark, if any
        <div class="ulb">&nbsp;</div>
        <div class="ulb">&nbsp;</div>
      </td>
    </tr>

    <!-- 8. Class of Goods or Service -->
    <tr>
      <td class="sno">8.</td>
      <td>
        <div class="lbl">CLASS OF GOODS OR SERVICE:</div>
        <div style="margin-top:6px;">
          ${classes.map(c => `<div style="margin-bottom:3px;">Class ${esc(c)}</div>`).join('')}
        </div>
      </td>
      <td>
        <div class="lbl">DESCRIPTION OF GOODS AND SERVICE:</div>
        <div style="margin-top:6px;">${val(s2.listOfGoodsServicesPerClass)}</div>
      </td>
    </tr>

    <!-- 9. Statement as to Use of Mark -->
    <tr>
      <td class="sno">9.</td>
      <td>
        <div class="lbl">STATEMENT AS TO USE OF MARK:</div>
      </td>
      <td class="green">
        <div class="cbr"><span>${chk(proposedToBeUsed)}</span><span>Proposed to be used</span></div>
        <div class="cbr"><span>${chk(alreadyUsed)}</span><span>The mark is used by the applicant or its predecessor in title</span></div>
        <div style="margin-top:5px;">
          Since&nbsp;<span class="ul" style="min-width:110px;">${alreadyUsed ? formatDate(s2.dateOfFirstUse) : ''}</span>&nbsp;in respect of all the goods and/or service mentioned in the application.
        </div>
        <div class="note">[(a) The applicant must select either of the above<br/>
        (b) The date of use must be given in the format (DD/MM/YYYY) and shall refer to all items mentioned in the application.<br/>
        (c) In case the use of the Trade Mark is claimed prior to the date of application, the applicant shall file an affidavit testifying to such use along with supporting documents<br/>
        (d) The statement as to use of the mark once made shall be final]</div>
      </td>
    </tr>

    <!-- 10. Priority Claim -->
    <tr>
      <td class="sno">10.</td>
      <td colspan="2">
        <div class="lbl">PRIORITY CLAIM, IF ANY:</div>
        <div style="margin-top:8px; display:flex; gap:16px; flex-wrap:wrap;">
          <div>
            <span class="lbl">Priority claimed since</span>&nbsp;
            <span class="ul" style="min-width:100px;">&nbsp;</span>&nbsp;
            <span style="font-size:8.5pt;">DD/MM/YYYY</span>
          </div>
          <div>
            Priority claim based on application filed in the <span class="lbl">Convention Country or organization</span>
          </div>
        </div>
        <div style="margin-top:7px; display:flex; gap:16px; flex-wrap:wrap;">
          <div>
            Name of the country or organization&nbsp;<span class="ul" style="min-width:130px;">&nbsp;</span>
          </div>
          <div>
            <span class="lbl">Priority Application No.</span>&nbsp;<span class="ul" style="min-width:130px;">&nbsp;</span>
          </div>
        </div>
        <div class="note">[The priority must be claimed in respect of all goods and services mentioned in the application]</div>
      </td>
    </tr>

    <!-- 11. Any Other Important Information -->
    <tr>
      <td class="sno">11.</td>
      <td colspan="2">
        <div class="lbl">ANY OTHER IMPORTANT INFORMATION OR STATEMENT:</div>
        <div class="note">[Applicant may provide here any other information or statement in relation to his application]</div>
        <div class="ulb">&nbsp;</div>
        <div class="ulb" style="margin-top:4px;">&nbsp;</div>
      </td>
    </tr>

    <!-- 12. Verification -->
    <tr>
      <td class="sno">12.</td>
      <td><div class="lbl">VERIFICATION:</div></td>
      <td class="green">
        I hereby verify that above mentioned facts are true and correct to best of my knowledge and belief.
      </td>
    </tr>

    <!-- 13. Detail of Person Submitting -->
    <tr>
      <td class="sno">13.</td>
      <td colspan="2">
        <div class="lbl">DETAIL OF THE PERSON SUBMITTING THE APPLICATION:</div>
        <div style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px;">
          <div>
            <div class="lbl">Signature:</div>
            <div class="ulb" style="margin-top:36px;">&nbsp;</div>
          </div>
          <div>
            <div class="lbl">Name:</div>
            <div class="ulb" style="margin-top:36px;">${val(s1.legalNameOfApplicant)}</div>
          </div>
          <div>
            <div class="lbl">Authority:</div>
            <div class="ulb" style="margin-top:36px;">&nbsp;</div>
          </div>
        </div>
      </td>
    </tr>

  </table>

</div>
</body>
</html>`
}
