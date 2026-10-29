const puppeteer = require('puppeteer');

const esc = val => {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

const field = (label, value) => {
    if (value === null || value === undefined || value === '') return '';
    return `<div class="field"><span class="label">${esc(label)}</span><span class="value">${esc(value)}</span></div>`;
};

const section = (title, innerHtml) => `
    <div class="section">
        <h2>${esc(title)}</h2>
        <div class="section-body">${innerHtml}</div>
    </div>`;

const ENTITY_LABELS = {
    private_limited: 'Private Limited Company',
    public_limited: 'Public Limited Company',
    opc: 'One Person Company (OPC)',
    llp: 'Limited Liability Partnership (LLP)',
};

const generateHtml = (app) => {
    const {
        applicationId,
        entityType,
        applicantDetails = {},
        proposedNames = {},
        registeredOffice = {},
        directors = [],
        nominee,
        capital = {},
        businessActivity = {},
        moaAoa,
        llpAgreement,
        documents = [],
        createdAt,
    } = app;

    const directorsHtml = directors.map((d, i) => {
        const isIndian = d.nationality === 'Indian';
        return `
        <div class="director-block">
            <div class="subsection-title">Director ${i + 1}${d.name ? ` — ${esc(d.name)}` : ''}</div>
            ${field('Email', d.email)}
            ${field('Mobile', d.mobile)}
            ${field('Nationality', d.nationality)}
            ${isIndian ? field('PAN', d.panNumber) : field('Passport', d.passportNumber)}
            ${isIndian && d.aadhaar ? field('Aadhaar', d.aadhaar) : ''}
            ${d.din ? field('DIN', d.din) : ''}
            ${field('Has DIN', d.hasDIN ? 'Yes' : 'No')}
            ${field('Has DSC', d.hasDSC ? 'Yes' : 'No')}
            ${field('Needs DIN from Peko', d.requestDINfromPeko ? 'Yes' : 'No')}
            ${field('Needs DSC from Peko', d.requestDSCfromPeko ? 'Yes' : 'No')}
            ${field('Education Qualification', d.educationQualification)}
            ${field('Occupation', d.occupation)}
            ${isIndian && d.placeOfBirth ? field('Place of Birth (State)', d.placeOfBirth.state) : ''}
            ${isIndian && d.placeOfBirth ? field('Place of Birth (District)', d.placeOfBirth.district) : ''}
        </div>`;
    }).join('');

    const shareholderRows = (capital.shareholders || []).map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(s.name)}</td>
            <td>${esc(s.shareholding)}%</td>
            <td>${esc(s.email) || '-'}</td>
            <td>${s.nationality === 'Indian' ? (esc(s.panNumber) || '-') : '-'}</td>
            <td>${s.nationality !== 'Indian' ? (esc(s.passportNumber) || '-') : '-'}</td>
            <td>${esc(s.nationality) || '-'}</td>
        </tr>`).join('');

    const OFFICE_DOC_TYPES = new Set([
        'noc_from_owner', 'utility_bill', 'rent_or_lease_deed', 'title_or_utility_doc',
        'name_availability_certificate', 'trademark_certificate',
    ]);
    const LEGAL_DOC_TYPES = new Set([
        'moa_draft', 'aoa_draft', 'moa_custom', 'aoa_custom',
        'llp_agreement_draft', 'llp_agreement_custom',
    ]);
    const DOC_LABELS = {
        noc_from_owner: 'NOC from Owner',
        utility_bill: 'Utility Bill (≤2 months old)',
        rent_or_lease_deed: 'Rent Deed / Lease Deed',
        title_or_utility_doc: 'Title Document / Utility Bill (≤2 months old)',
        name_availability_certificate: 'Name Availability Certificate',
        trademark_certificate: 'Trademark Certificate',
        moa_draft: 'MOA Draft (Standard)',
        aoa_draft: 'AOA Draft (Standard)',
        moa_custom: 'MOA (Custom)',
        aoa_custom: 'AOA (Custom)',
        llp_agreement_draft: 'LLP Agreement Draft (Standard)',
        llp_agreement_custom: 'LLP Agreement (Custom)',
        photo: 'Photograph',
        proof_of_identity: 'Proof of Identity (Passport / DL / Election ID)',
        proof_of_address: 'Proof of Address (Bank Statement / Utility Bill)',
        aadhaar: 'Aadhaar Card',
        pan: 'PAN Card',
        phone_bill: 'Phone Bill',
        bank_statement: 'Bank Statement',
        din_certificate: 'DIN Certificate',
        dsc_proof: 'DSC Proof',
        signature: 'Signature',
    };
    const DIRECTOR_PATTERN = /^director_(\d+)_(.+)$/;

    const officeDocs = documents.filter(d => OFFICE_DOC_TYPES.has(d.docType));
    const legalDocs = documents.filter(d => LEGAL_DOC_TYPES.has(d.docType));
    const directorDocMap = {};
    documents.forEach(d => {
        const m = d.docType.match(DIRECTOR_PATTERN);
        if (m) {
            const idx = parseInt(m[1], 10);
            if (!directorDocMap[idx]) directorDocMap[idx] = [];
            directorDocMap[idx].push({ ...d, kindLabel: DOC_LABELS[m[2]] || m[2] });
        }
    });

    const docLink = d => {
        const link = d.vendorFileRefUrl || d.vendorUrl;
        return link ? `<a href="${esc(link)}" style="color:#FF3A3A;">View</a>` : '-';
    };
    const miniTable = rows => `
        <table>
          <thead><tr><th>Document</th><th>File Name</th><th>Link</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    const docRow = (label, d) => `
        <tr>
            <td>${esc(label)}</td>
            <td>${esc(d.fileName)}</td>
            <td>${docLink(d)}</td>
        </tr>`;

    const officeSection = officeDocs.length > 0
        ? `<div class="subsection-title">Office &amp; KYC Documents</div>${miniTable(officeDocs.map(d => docRow(DOC_LABELS[d.docType] || d.docType, d)).join(''))}`
        : '';

    const directorDocSections = Object.keys(directorDocMap)
        .sort((a, b) => Number(a) - Number(b))
        .map(idx => {
            const dirName = directors[Number(idx)]?.name || `Director ${Number(idx) + 1}`;
            const rows = directorDocMap[idx].map(d => docRow(d.kindLabel, d)).join('');
            return `<div class="subsection-title">Director ${Number(idx) + 1} — ${esc(dirName)}</div>${miniTable(rows)}`;
        }).join('');

    const legalSection = legalDocs.length > 0
        ? `<div class="subsection-title">MOA / AOA &amp; Agreement Documents</div>${miniTable(legalDocs.map(d => docRow(DOC_LABELS[d.docType] || d.docType, d)).join(''))}`
        : '';

    const RIGHTS_LABELS = {
        accessBooks: 'Inspect & access books of accounts',
        receiveShares: 'Receive share of profits and remuneration',
        participateVotes: 'Participate in management and vote',
        indemnified: 'Be indemnified by LLP for acts in good faith',
        separateBusiness: 'Carry on separate business',
    };
    const DUTIES_LABELS = {
        accountBenefits: 'Account for personal benefits derived from LLP business',
        indemnifyFraud: 'Indemnify LLP for loss caused by fraud or negligence',
        renderAccounts: 'Render proper accounts and information',
        actInBestInterest: 'Act in the best interest of the LLP',
        noCompeting: 'Not carry on competing business without consent',
        maintainConfidentiality: 'Maintain confidentiality of LLP information',
    };
    const enabledRights = llpAgreement?.partnerRights
        ? Object.entries(llpAgreement.partnerRights).filter(([, v]) => v).map(([k]) => RIGHTS_LABELS[k] || k)
        : [];
    const enabledDuties = llpAgreement?.partnerDuties
        ? Object.entries(llpAgreement.partnerDuties).filter(([, v]) => v).map(([k]) => DUTIES_LABELS[k] || k)
        : [];

    const fmtTemplateType = t => t === 'customized' || t === 'custom' ? 'Custom' : t === 'standard' ? 'Standard' : esc(t || '');

    const moaAoaSection = entityType !== 'llp'
        ? section('MOA & AOA', `
            ${field('MOA Template', fmtTemplateType(moaAoa?.moaType))}
            ${field('AOA Template', fmtTemplateType(moaAoa?.aoaType))}`)
        : section('LLP Agreement', `
            ${field('Agreement Type', fmtTemplateType(llpAgreement?.agreementType))}
            ${field('Meeting Quorum', llpAgreement?.meetingQuorum)}
            ${field('Voting Threshold', llpAgreement?.votingThreshold)}
            ${field('Dispute Resolution Method', llpAgreement?.disputeResolution?.method)}
            ${llpAgreement?.disputeResolution?.jurisdiction ? field('Dispute Jurisdiction', llpAgreement.disputeResolution.jurisdiction) : ''}
            ${enabledRights.length > 0 ? `<div class="subsection-title">Partner Rights</div><ul style="margin:4px 0 8px 16px;font-size:11px;">${enabledRights.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
            ${enabledDuties.length > 0 ? `<div class="subsection-title">Partner Duties</div><ul style="margin:4px 0 8px 16px;font-size:11px;">${enabledDuties.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}`);

    const formattedDate = new Date(createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; border-bottom: 2px solid #FF3A3A; padding-bottom: 14px; }
  .header h1 { font-size: 18px; color: #FF3A3A; }
  .header .subtitle { font-size: 11px; color: #666; margin-top: 3px; }
  .app-meta { text-align: right; font-size: 11px; color: #666; }
  .app-meta strong { display: block; font-size: 14px; color: #222; margin-bottom: 2px; }
  .section { margin-bottom: 16px; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; page-break-inside: avoid; }
  .section h2 { background: #f7f7f7; font-size: 12px; font-weight: bold; padding: 7px 12px; color: #333; border-bottom: 1px solid #e0e0e0; text-transform: uppercase; letter-spacing: 0.4px; }
  .section-body { padding: 10px 12px; }
  .field { display: flex; margin-bottom: 5px; line-height: 1.4; }
  .label { font-weight: bold; min-width: 210px; width: 210px; color: #555; flex-shrink: 0; }
  .value { color: #222; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  th { background: #f2f2f2; padding: 6px 7px; text-align: left; border: 1px solid #ddd; font-size: 10px; overflow-wrap: anywhere; word-break: break-word; }
  td { padding: 5px 7px; border: 1px solid #ddd; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
  tr:nth-child(even) td { background: #fafafa; }
  .subsection-title { font-weight: bold; font-size: 11px; color: #555; margin: 10px 0 6px; }
  .director-block { page-break-inside: avoid; }
  .director-block:not(:last-child) { border-bottom: 1px dashed #e0e0e0; margin-bottom: 8px; padding-bottom: 6px; }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Company Incorporation Application</h1>
    <div class="subtitle">${esc(ENTITY_LABELS[entityType] || entityType)}</div>
  </div>
  <div class="app-meta">
    <strong>${esc(applicationId)}</strong>
    ${esc(formattedDate)}
  </div>
</div>

${section('Applicant Details', `
    ${field('Full Name', applicantDetails.fullName)}
    ${field('Email', applicantDetails.email)}
    ${field('Mobile', applicantDetails.mobile)}
    ${field('State', applicantDetails.state)}`)}

${section('Proposed Company Names', `
    ${field('First Choice', proposedNames.firstChoice)}
    ${field('Second Choice', proposedNames.secondChoice || '-')}
    ${field('Third Choice', proposedNames.thirdChoice || '-')}`)}

${section('Registered Office', `
    ${field('Availability', registeredOffice.availability === 'have' ? 'Already have an office' : 'Need office assistance')}
    ${registeredOffice.availability === 'have' ? field('Office Type', { rented: 'Rented', owned: 'Owned', shared_office: 'Shared Office' }[registeredOffice.officeType] || registeredOffice.officeType) : ''}
    ${registeredOffice.availability === 'have' ? field('Address', registeredOffice.address) : ''}
    ${field('Has ID Proof', registeredOffice.hasIdProof ? 'Yes' : 'No')}`)}

${section('Directors', directorsHtml)}

${nominee ? section('Nominee', `
    ${field('Name', nominee.name)}
    ${field('Email', nominee.email)}
    ${field('Mobile', nominee.mobile)}
    ${field('Nationality', nominee.nationality)}
    ${nominee.nationality === 'Indian' ? field('PAN Number', nominee.panNumber) : field('Passport Number', nominee.passportNumber)}
    ${nominee.nationality === 'Indian' && nominee.aadhaar ? field('Aadhaar', nominee.aadhaar) : ''}
    ${nominee.din ? field('DIN', nominee.din) : ''}
    ${field('Education Qualification', nominee.educationQualification)}
    ${field('Occupation', nominee.occupation)}
    ${nominee.nationality === 'Indian' ? field('Place of Birth (State)', nominee.placeOfBirth && nominee.placeOfBirth.state) : ''}
    ${nominee.nationality === 'Indian' ? field('Place of Birth (District)', nominee.placeOfBirth && nominee.placeOfBirth.district) : ''}
`) : ''}

${section('Capital Structure', `
    ${field('Authorized Capital (₹)', Number(capital.authorizedCapital).toLocaleString('en-IN'))}
    ${field('Paid-up Capital (₹)', Number(capital.paidUpCapital).toLocaleString('en-IN'))}
    ${capital.faceValuePerShare ? field('Face Value Per Share (₹)', Number(capital.faceValuePerShare).toLocaleString('en-IN')) : ''}
    ${(capital.shareholders || []).length > 0 ? `
    <div class="subsection-title">Shareholders</div>
    <table>
      <thead>
        <tr><th>#</th><th>Name</th><th>Shareholding</th><th>Email</th><th>PAN</th><th>Passport</th><th>Nationality</th></tr>
      </thead>
      <tbody>${shareholderRows}</tbody>
    </table>` : ''}`)}

${section('Business Activity', `
    ${field('Description', businessActivity.description)}
    ${businessActivity.secondaryActivity ? field('Secondary Activity', businessActivity.secondaryActivity) : ''}
    ${businessActivity.otherActivities ? field('Other Activities', businessActivity.otherActivities) : ''}
    <div class="subsection-title">NIC Classification</div>
    ${field('Section', businessActivity.section)}
    ${field('Division', businessActivity.division)}
    ${businessActivity.group ? field('Group', businessActivity.group) : ''}
    ${businessActivity.class ? field('Class', businessActivity.class) : ''}
    ${businessActivity.subclass ? field('Sub-class', businessActivity.subclass) : ''}`)}

${moaAoaSection}

${section('Uploaded Documents', `
    ${officeSection}
    ${directorDocSections}
    ${legalSection}
`)}

</body>
</html>`;
};

exports.generateApplicationPdf = async (application) => {
    let browser;
    try {
        const html = generateHtml(application);
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBytes = await page.pdf({
            format: 'A4',
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        });
        return Buffer.from(pdfBytes);
    } finally {
        if (browser) await browser.close();
    }
};
