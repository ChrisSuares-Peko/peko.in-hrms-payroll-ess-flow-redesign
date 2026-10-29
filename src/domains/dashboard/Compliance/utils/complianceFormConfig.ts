import type { ComplianceTypeConfig } from '../types/formConfig';

export const complianceFormConfig: Record<string, ComplianceTypeConfig> = {
    EPF_ESI_REGISTRATION: {
        fields: [
            // Part 1 — Company Details
            { key: 'epf_companyName', label: 'Full Name of the Company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'epf_cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'e.g. U74999MH2024PTC123456', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_incorporationDate', label: 'Date of Incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select', section: 'Part 1 — Company Details', colSpan: 1, options: [
                { label: 'Private Ltd', value: 'Private Ltd' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Ltd', value: 'Public Ltd' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ]},
            { key: 'epf_companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'e.g. ABCDE1234F', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'e.g. 27AAAAA0000A1Z5', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_registeredAddress', label: 'Registered Office Address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'epf_email', label: 'Official Email ID of the Company', type: 'text', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_mobile', label: 'Official Mobile / Phone Number', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_authorisedCapital', label: 'Authorised Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter authorised capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter paid-up capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_businessActivity', label: 'Main Business Activity', type: 'text', required: true, placeholder: 'Nature of goods or services, industry', allowAlphabetsAndSpace: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_financialYear', label: 'Financial Year Followed', type: 'select', required: true, placeholder: 'Select financial year', optionsSource: 'financialYears', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'epf_contactName', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact person name', prefillFrom: 'user.contactPersonName', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'epf_contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Primary Contact Person for This Engagement', allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'epf_contactMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'epf_contactEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised Signatory
            { key: 'epf_signatoryName', label: 'Authorised Signatory Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Part 2 — Authorised Signatory', colSpan: 1, validation: 'fullName' },
            { key: 'epf_signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'epf_signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Part 2 — Authorised Signatory',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'epf_signatoryMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'epf_signatoryEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'epf_signatoryDsc', label: 'DSC Available?', type: 'select', required: true, placeholder: 'Select', section: 'Part 2 — Authorised Signatory', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            // Part 3 — Registration
            { key: 'epf_reg_note', type: 'note', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 2, description: 'EPF registration is mandatory once the establishment employs 20 or more persons. ESI once it employs 10 or more (20 in some states). Newly incorporated companies are usually allotted EPF and ESIC numbers at incorporation, but monthly compliance begins only once the relevant employee threshold is reached (EPF coverage can also be taken voluntarily). EPF contribution is 12% each from employer and employee. ESI is 3.25% employer and 0.75% employee. Monthly dues are payable by the 15th of the following month.' },
            { key: 'epf_numbersAllotted', label: 'Were EPF / ESI Numbers Allotted at Incorporation?', type: 'select', required: true, placeholder: 'Select', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1, options: [
                { label: 'Yes — give the codes if available', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            { key: 'epf_establishmentCode', label: 'EPF Establishment Code (if any)', type: 'text', placeholder: 'Enter EPF code', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_esicCode', label: 'ESIC Code (if any)', type: 'text', placeholder: 'Enter ESIC code', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_totalEmployees', label: 'Current Total Number of Employees', type: 'text', required: true, placeholder: 'Enter count', allowNumbersOnly: true, minValue: 0, section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_employeesUnder15k', label: 'Number of Employees Drawing Wages up to ₹15,000 / Month', type: 'text', required: true, placeholder: 'Relevant for mandatory EPF coverage', allowNumbersOnly: true, minValue: 0, section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_employeesUnder21k', label: 'Number of Employees Drawing Wages up to ₹21,000 / Month', type: 'text', required: true, placeholder: 'Relevant for ESI coverage', allowNumbersOnly: true, minValue: 0, section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_thresholdCrossedDate', label: 'Date on Which the Employee Threshold Was / Will Be Crossed', type: 'date', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_voluntaryCoverage', label: 'Is Voluntary EPF Coverage Desired?', type: 'select', placeholder: 'Select', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            { key: 'epf_coverageEffectiveDate', label: 'Date from Which Coverage Should Be Effective', type: 'date', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 1 },
            { key: 'epf_businessNature', label: 'Business Activity / Nature of Establishment', type: 'textarea', required: true, placeholder: 'Describe the nature of business', section: 'Part 3 — EPF / ESI Registration or Activation', colSpan: 2, minRows: 2 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'epf_coi', label: 'Certificate of Incorporation', required: true },
            { key: 'epf_panCard', label: 'Company PAN Card', required: true },
            { key: 'epf_cancelledCheque', label: 'Cancelled Cheque of Company Bank Account', required: true },
            { key: 'epf_dsc', label: 'Digital Signature Certificate (DSC) of Authorised Signatory', required: true },
            { key: 'epf_employeeMaster', label: 'Employee Master - Names, DOB, DOJ, Designation, Wages', required: true },
            { key: 'epf_aadhaarPanBank', label: 'Aadhaar, PAN and Bank Details of Each Employee', required: true },
            { key: 'epf_uanNumbers', label: 'UAN / IP Numbers, Where Already Allotted' },
        ],
    },

    EPF_ESI_RETURN_FILING: {
        fields: [
            // Part 1 — Company Details
            { key: 'epf_companyName', label: 'Full Name of the Company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'epf_cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'e.g. U74999MH2024PTC123456', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_incorporationDate', label: 'Date of Incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select', section: 'Part 1 — Company Details', colSpan: 1, options: [
                { label: 'Private Ltd', value: 'Private Ltd' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Ltd', value: 'Public Ltd' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ]},
            { key: 'epf_companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'e.g. ABCDE1234F', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'e.g. 27AAAAA0000A1Z5', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_registeredAddress', label: 'Registered Office Address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'epf_email', label: 'Official Email ID of the Company', type: 'text', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_mobile', label: 'Official Mobile / Phone Number', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_authorisedCapital', label: 'Authorised Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter authorised capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter paid-up capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_businessActivity', label: 'Main Business Activity', type: 'text', required: true, placeholder: 'Nature of goods or services, industry', allowAlphabetsAndSpace: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'epf_financialYear', label: 'Financial Year Followed', type: 'select', required: true, placeholder: 'Select financial year', optionsSource: 'financialYears', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'epf_contactName', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact person name', prefillFrom: 'user.contactPersonName', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'epf_contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'epf_contactMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'epf_contactEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised Signatory
            { key: 'epf_signatoryName', label: 'Authorised Signatory Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Part 2 — Authorised Signatory', colSpan: 1, validation: 'fullName' },
            { key: 'epf_signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'epf_signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Part 2 — Authorised Signatory',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'epf_signatoryMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'epf_signatoryEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'epf_signatoryDsc', label: 'DSC Available?', type: 'select', required: true, placeholder: 'Select', section: 'Part 2 — Authorised Signatory', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            // Part 3 — Return Filing
            { key: 'epf_ret_note', type: 'note', section: 'Part 3 — EPF / ESI Return Filing', colSpan: 2, description: 'EPF: the ECR (Electronic Challan-cum-Return) is filed monthly by the 15th; an annual return is also required. ESI contributions are paid monthly, and returns are filed half-yearly — for April-September by 11/12 November and for October-March by 11/12 May.' },
            { key: 'epf_returnType', label: 'Return Type', type: 'multiselect', required: true, placeholder: 'Select all that apply', section: 'Part 3 — EPF / ESI Return Filing', colSpan: 2, options: [
                { label: 'EPF monthly ECR', value: 'EPF_ECR' },
                { label: 'EPF annual return', value: 'EPF_ANNUAL' },
                { label: 'ESI monthly', value: 'ESI_MONTHLY' },
                { label: 'ESI half-yearly', value: 'ESI_HALF_YEARLY' },
            ]},
            { key: 'epf_returnPeriod', label: 'Month / Period & Financial Year', type: 'text', required: true, placeholder: 'e.g. April 2025 / 2025-26', section: 'Part 3 — EPF / ESI Return Filing', colSpan: 1 },
            { key: 'epf_employeesCovered', label: 'Number of Employees Covered This Period', type: 'text', required: true, placeholder: 'Enter count', allowNumbersOnly: true, section: 'Part 3 — EPF / ESI Return Filing', colSpan: 1 },
            { key: 'epf_totalWages', label: 'Total Wages for the Period (₹)', type: 'text', required: true, placeholder: 'Enter total wages amount', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — EPF / ESI Return Filing', colSpan: 1 },
            { key: 'epf_joinerExits', label: 'New Joiners / Exits During the Period', type: 'textarea', placeholder: 'Give names and dates', section: 'Part 3 — EPF / ESI Return Filing', colSpan: 2, minRows: 2 },
            { key: 'epf_payrollSource', label: 'Source of Payroll Data', type: 'text', placeholder: 'Software / Excel - specify and attach', section: 'Part 3 — EPF / ESI Return Filing', colSpan: 1 },
            { key: 'epf_employeeDetails', type: 'repeatable-table', section: 'Part 3 — EPF / ESI Return Filing', colSpan: 2, columns: [
                { key: 'serialNumber', label: '#', type: 'serial', width: 40 },
                { key: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'Enter name', minWidth: 160 },
                { key: 'uanIpNo', label: 'UAN / IP No.', type: 'text', placeholder: 'Enter UAN or IP number', minWidth: 140 },
                { key: 'grossWages', label: 'Gross Wages (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12, minWidth: 110 },
                { key: 'epfWages', label: 'EPF Wages (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minWidth: 110 },
                { key: 'esiWages', label: 'ESI Wages (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minWidth: 110 },
            ]},
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'epf_employeeMaster', label: 'Employee Master - Names, DOB, DOJ, Designation, Wages', required: true },
            { key: 'epf_aadhaarPanBank', label: 'Aadhaar, PAN and Bank Details of Each Employee', required: true },
            { key: 'epf_uanNumbers', label: 'UAN / IP Numbers, Where Already Allotted' },
            { key: 'epf_salaryRegister', label: 'Salary Register / Payroll for the Period', required: true },
            { key: 'epf_dsc', label: 'Digital Signature Certificate (DSC) of Authorised Signatory (for EPFO portal)', required: true },
        ],
    },

    GST_REGISTRATION: {
        fields: [
            // ── PART 1 — COMPANY DETAILS ────────────────────────────────────
            { key: 'gst_companyName', label: 'Full Name of the Company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 1, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'gst_cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'e.g. U74999MH2024PTC123456', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_incorporationDate', label: 'Date of Incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select', section: 'Part 1 — Company Details', colSpan: 1, options: [
                { label: 'Private Ltd', value: 'Private Ltd' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Ltd', value: 'Public Ltd' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ]},
            { key: 'gst_companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'e.g. ABCDE1234F', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'e.g. 27AAAAA0000A1Z5', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_registeredAddress', label: 'Registered Office Address', type: 'text', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2 },
            { key: 'gst_email', label: 'Official Email ID of the Company', type: 'text', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_mobile', label: 'Official Mobile / Phone Number', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_authorisedCapital', label: 'Authorised Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter authorised capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter paid-up capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_businessActivity', label: 'Main Business Activity', type: 'text', required: true, placeholder: 'Nature of goods or services, industry', allowAlphabetsAndSpace: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_financialYear', label: 'Financial Year Followed', type: 'select', required: true, placeholder: 'Select financial year', optionsSource: 'financialYears', section: 'Part 1 — Company Details', colSpan: 1 },

            // ── PRIMARY CONTACT ──────────────────────────────────────────────
            { key: 'gst_contactName', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact person name', prefillFrom: 'user.contactPersonName', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'gst_contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'gst_contactMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'gst_contactEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },

            // ── PART 2 — DIRECTORS & AUTHORISED SIGNATORY ───────────────────
            { key: 'gst_directors', type: 'repeatable-table', section: 'Part 2 — Directors', colSpan: 2, selectable: true, selectFills: [
                { sourceKey: 'name', targetKey: 'gst_signatoryName' },
                { sourceKey: 'din', targetKey: 'gst_signatoryDinPan' },
                { sourceKey: 'designation', targetKey: 'gst_signatoryDesignation' },
                { sourceKey: 'mobile', targetKey: 'gst_signatoryMobile' },
                { sourceKey: 'email', targetKey: 'gst_signatoryEmail' },
                { sourceKey: 'dsc', targetKey: 'gst_signatoryDsc' },
            ], columns: [
                { key: 'name', label: 'Name of Director', type: 'text', minWidth: 160, required: true },
                { key: 'din', label: 'DIN', type: 'text', convertToUppercase: true, validation: 'din', minWidth: 110, required: true },
                { key: 'pan', label: 'PAN', type: 'text', convertToUppercase: true, validation: 'pan', minWidth: 120, required: true },
                { key: 'designation', label: 'Designation', type: 'select', minWidth: 150, required: true, options: [
                    { label: 'Director', value: 'Director' },
                    { label: 'Managing Director', value: 'Managing Director' },
                    { label: 'Whole-time Director', value: 'Whole-time Director' },
                    { label: 'CEO', value: 'CEO' },
                    { label: 'CFO', value: 'CFO' },
                    { label: 'Company Secretary', value: 'Company Secretary' },
                ] },
                { key: 'mobile', label: 'Mobile', type: 'text', validation: 'mobile', allowNumbersOnly: true, maxLength: 10, minWidth: 120, required: true },
                { key: 'email', label: 'Email', type: 'text', validation: 'email', minWidth: 180, required: true },
                { key: 'dsc', label: 'DSC?', type: 'select', minWidth: 90, required: true, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
            ]},
            { key: 'gst_signatoryName', label: 'Authorised Signatory Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Part 2 — Authorised Signatory', colSpan: 1, validation: 'fullName' },
            { key: 'gst_signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryDesignation', label: 'Signatory Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryMobile', label: 'Signatory Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryEmail', label: 'Signatory Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryDsc', label: 'DSC Available?', type: 'select', required: true, placeholder: 'Select', section: 'Part 2 — Authorised Signatory', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},

            // ── PART 3 — NEW GST REGISTRATION ────────────────────────────────
            { key: 'gst_3a_note', type: 'note', section: 'Part 3 — GST Registration Details', colSpan: 2, description: 'Registration is mandatory once aggregate turnover crosses ₹40 lakh for goods or ₹20 lakh for services (₹20 lakh / ₹10 lakh respectively in special-category states, which include Jammu & Kashmir). It is compulsory regardless of turnover for inter-state supply of goods, e-commerce operators and suppliers, casual / non-resident taxable persons, persons liable under reverse charge, input service distributors, and persons required to deduct TDS / collect TCS under GST.' },
            { key: 'gst_reasonForRegistration', label: 'Reason for Registration', type: 'select', required: true, placeholder: 'Select', section: 'Part 3 — GST Registration Details', colSpan: 1, options: [
                { label: 'Mandatory (turnover threshold)', value: 'Mandatory' },
                { label: 'Inter-state supply', value: 'InterState' },
                { label: 'E-commerce', value: 'Ecommerce' },
                { label: 'Voluntary', value: 'Voluntary' },
                { label: 'RCM applicability', value: 'RCM' },
            ]},
            { key: 'gst_annualTurnover', label: 'Expected Annual Turnover (₹)', type: 'text', required: true, placeholder: 'Enter expected turnover amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 3 — GST Registration Details', colSpan: 1 },
            { key: 'gst_natureOfRegistration', label: 'Nature of Registration', type: 'select', required: true, placeholder: 'Select', section: 'Part 3 — GST Registration Details', colSpan: 1, options: [
                { label: 'Regular Taxpayer', value: 'Regular' },
                { label: 'Composition Scheme', value: 'Composition' },
            ]},
            { key: 'gst_principalPlace', label: 'Principal Place of Business', type: 'text', required: true, placeholder: 'Full address with PIN', section: 'Part 3 — GST Registration Details', colSpan: 2, allowAlphabetsSpaceAndNumbers: true },
            { key: 'gst_additionalPlaces', label: 'Additional Place(s) of Business, if any', type: 'textarea', placeholder: 'Enter additional place(s) of business', maxLength: 500, minRows: 2, section: 'Part 3 — GST Registration Details',allowAlphabetsSpaceAndNumbers: true, colSpan: 2 },
            { key: 'gst_hsnCodes', label: 'Main Goods Supplied with HSN Code(s)', type: 'textarea', placeholder: 'Enter goods and HSN codes', maxLength: 500, minRows: 2, section: 'Part 3 — GST Registration Details', colSpan: 1 },
            { key: 'gst_sacCodes', label: 'Main Services Supplied with SAC Code(s)', type: 'textarea', placeholder: 'Enter services and SAC codes', maxLength: 500, minRows: 2, section: 'Part 3 — GST Registration Details', colSpan: 1 },
            { key: 'gst_liabilityDate', label: 'Date on Which Liability to Register Arose', type: 'date', section: 'Part 3 — GST Registration Details', colSpan: 1 },
            { key: 'gst_bankAccountDetails', label: 'Bank Account Details for GST', type: 'text', placeholder: 'Account number & IFSC — cancelled cheque required', section: 'Part 3 — GST Registration Details', colSpan: 1 },
            { key: 'gst_stateJurisdiction', label: 'State / Jurisdiction', type: 'select', required: true, placeholder: 'Select state', optionsSource: 'indianStates', section: 'Part 3 — GST Registration Details', colSpan: 1 },
        ],
        docs: [
            { key: 'gst_panCardOfCompany', label: 'Company PAN Card', required: true },
            { key: 'gst_coi', label: 'Certificate of Incorporation', required: true },
            { key: 'gst_moaAoa', label: 'MOA & AOA', required: true },
            { key: 'gst_boardResolution', label: 'Board Resolution / Authorisation Letter for the Authorised Signatory', required: true },
            { key: 'gst_signatoryKyc', label: 'PAN, Aadhaar and Photograph of the Authorised Signatory & Directors', required: true },
            { key: 'gst_addressProof', label: 'Proof of Principal (and Additional) Place of Business', required: true },
            { key: 'gst_bankProof', label: 'Bank Proof (Cancelled Cheque or First Page of Passbook)', required: true },
            { key: 'gst_dsc', label: 'Digital Signature Certificate (DSC) of Authorised Signatory', required: true },
        ],
    },

    GST_RETURN_FILING: {
        fields: [
            // ── PART 1 — COMPANY DETAILS ────────────────────────────────────
            { key: 'gst_companyName', label: 'Full Name of the Company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 1, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'gst_cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'e.g. U74999MH2024PTC123456', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_incorporationDate', label: 'Date of Incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select', section: 'Part 1 — Company Details', colSpan: 1, options: [
                { label: 'Private Ltd', value: 'Private Ltd' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Ltd', value: 'Public Ltd' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ]},
            { key: 'gst_companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'e.g. ABCDE1234F', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_gstin', label: 'GSTIN', type: 'text', required: true, placeholder: 'e.g. 27AAAAA0000A1Z5', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_registeredAddress', label: 'Registered Office Address', type: 'text', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2 },
            { key: 'gst_email', label: 'Official Email ID of the Company', type: 'text', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_mobile', label: 'Official Mobile / Phone Number', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_authorisedCapital', label: 'Authorised Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter authorised capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter paid-up capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_businessActivity', label: 'Main Business Activity', type: 'text', required: true, placeholder: 'Nature of goods or services, industry', allowAlphabetsAndSpace: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gst_financialYear', label: 'Financial Year Followed', type: 'select', required: true, placeholder: 'Select financial year', optionsSource: 'financialYears', section: 'Part 1 — Company Details', colSpan: 1 },

            // ── PRIMARY CONTACT ──────────────────────────────────────────────
            { key: 'gst_contactName', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact person name', prefillFrom: 'user.contactPersonName', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'gst_contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'gst_contactMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'gst_contactEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },

            // ── PART 2 — DIRECTORS & AUTHORISED SIGNATORY ───────────────────
            { key: 'gst_directors', type: 'repeatable-table', section: 'Part 2 — Directors', colSpan: 2, selectable: true, selectFills: [
                { sourceKey: 'name', targetKey: 'gst_signatoryName' },
                { sourceKey: 'din', targetKey: 'gst_signatoryDinPan' },
                { sourceKey: 'designation', targetKey: 'gst_signatoryDesignation' },
                { sourceKey: 'mobile', targetKey: 'gst_signatoryMobile' },
                { sourceKey: 'email', targetKey: 'gst_signatoryEmail' },
                { sourceKey: 'dsc', targetKey: 'gst_signatoryDsc' },
            ], columns: [
                { key: 'name', label: 'Name of Director', type: 'text', minWidth: 160, required: true },
                { key: 'din', label: 'DIN', type: 'text', convertToUppercase: true, validation: 'din', minWidth: 110, required: true },
                { key: 'pan', label: 'PAN', type: 'text', convertToUppercase: true, validation: 'pan', minWidth: 120, required: true },
                { key: 'designation', label: 'Designation', type: 'select', minWidth: 150, required: true, options: [
                    { label: 'Director', value: 'Director' },
                    { label: 'Managing Director', value: 'Managing Director' },
                    { label: 'Whole-time Director', value: 'Whole-time Director' },
                    { label: 'CEO', value: 'CEO' },
                    { label: 'CFO', value: 'CFO' },
                    { label: 'Company Secretary', value: 'Company Secretary' },
                ] },
                { key: 'mobile', label: 'Mobile', type: 'text', validation: 'mobile', allowNumbersOnly: true, maxLength: 10, minWidth: 120, required: true },
                { key: 'email', label: 'Email', type: 'text', validation: 'email', minWidth: 180, required: true },
                { key: 'dsc', label: 'DSC?', type: 'select', minWidth: 90, required: true, options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
            ]},
            { key: 'gst_signatoryName', label: 'Authorised Signatory Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Part 2 — Authorised Signatory', colSpan: 1, validation: 'fullName' },
            { key: 'gst_signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryDesignation', label: 'Signatory Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryMobile', label: 'Signatory Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryEmail', label: 'Signatory Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'gst_signatoryDsc', label: 'DSC Available?', type: 'select', required: true, placeholder: 'Select', section: 'Part 2 — Authorised Signatory', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},

            // ── PART 3 — GST RETURN FILING DETAILS ───────────────────────────
            { key: 'gst_returnPeriod', label: 'Return Period', type: 'text', required: true, placeholder: 'Month / quarter & financial year', section: 'Part 3 — GST Return Filing Details', colSpan: 1 },
            { key: 'gst_filingFrequency', label: 'Filing Frequency', type: 'select', required: true, placeholder: 'Select', section: 'Part 3 — GST Return Filing Details', colSpan: 1, options: [
                { label: 'Monthly', value: 'Monthly' },
                { label: 'Quarterly (QRMP)', value: 'Quarterly' },
                { label: 'Composition', value: 'Composition' },
            ]},
            { key: 'gst_returnsToFile', label: 'Returns to be Filed', type: 'multiselect', required: true, placeholder: 'Select all that apply', section: 'Part 3 — GST Return Filing Details', colSpan: 2, options: [
                { label: 'GSTR-1 (outward supplies)', value: 'GSTR-1' },
                { label: 'CMP-08 (composition taxpayer statement)', value: 'CMP-08' },
                { label: 'GSTR-4 (composition annual return)', value: 'GSTR-4' },
                { label: 'GSTR-3B (summary return & tax payment)', value: 'GSTR-3B' },
                { label: 'GSTR-9 / 9C (annual return / reconciliation)', value: 'GSTR-9/9C' },
                { label: 'Nil return', value: 'Nil' },
            ]},
            { key: 'gst_totalOutwardSupplies', label: 'Total Outward Supplies / Sales for the Period (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — GST Return Filing Details', colSpan: 1 },
            { key: 'gst_totalInwardSupplies', label: 'Total Inward Supplies / Purchases for the Period (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — GST Return Filing Details', colSpan: 1 },
            { key: 'gst_sourceOfData', label: 'Source of Sales & Purchase Data', type: 'textarea', placeholder: 'Tally / Excel / ERP / Invoices - specify and attach', maxLength: 300, minRows: 2, section: 'Part 3 — GST Return Filing Details', colSpan: 2 },
            { key: 'gst_itcToClaim', label: 'Input Tax Credit to be Claimed', type: 'text', placeholder: 'Approximate amount', section: 'Part 3 — GST Return Filing Details', colSpan: 1 },
            { key: 'gst_rcmLiability', label: 'Any RCM (Reverse Charge) Liability?', type: 'select', placeholder: 'Select', section: 'Part 3 — GST Return Filing Details', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            { key: 'gst_rcmDetails', label: 'RCM Details', type: 'textarea', placeholder: 'Yes / No - details', maxLength: 300, minRows: 2, section: 'Part 3 — GST Return Filing Details', colSpan: 2 },
            { key: 'gst_amendmentsToEarlierReturns', label: 'Are There Any Amendments to Earlier Returns?', type: 'select', placeholder: 'Select', section: 'Part 3 — GST Return Filing Details', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            { key: 'gst_amendmentDetails', label: 'Amendment Details', type: 'textarea', placeholder: 'If yes, provide details', maxLength: 300, minRows: 2, section: 'Part 3 — GST Return Filing Details', colSpan: 2 },
        ],
        docs: [
            { key: 'gst_panCardOfCompany', label: 'Company PAN Card', required: true },
            { key: 'gst_coi', label: 'Certificate of Incorporation', required: true },
            { key: 'gst_boardResolution', label: 'Board Resolution / Authorisation Letter for the Authorised Signatory', required: true },
            { key: 'gst_signatoryKyc', label: 'PAN, Aadhaar and Photograph of the Authorised Signatory & Directors', required: true },
            { key: 'gst_salesPurchaseData', label: 'Sales & Purchase Data (Tally / Excel / ERP exports)', required: true },
            { key: 'gst_challanDetails', label: 'GST Payment Challan Details (if any tax paid)', required: false },
        ],
    },

    TDS_REGISTRATION: {
        fields: [
            // Part 1 — Company Details
            { key: 'tds_companyName', label: 'Full Name of the Company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'tds_cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'e.g. U74999MH2024PTC123456', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_incorporationDate', label: 'Date of Incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select', section: 'Part 1 — Company Details', colSpan: 1, options: [
                { label: 'Private Ltd', value: 'Private Ltd' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Ltd', value: 'Public Ltd' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ]},
            { key: 'tds_companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'e.g. ABCDE1234F', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'e.g. 27AAAAA0000A1Z5', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_registeredAddress', label: 'Registered Office Address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'tds_email', label: 'Official Email ID of the Company', type: 'text', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_mobile', label: 'Official Mobile / Phone Number', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_authorisedCapital', label: 'Authorised Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter authorised capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter paid-up capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_businessActivity', label: 'Main Business Activity', type: 'text', required: true, placeholder: 'Nature of goods or services, industry', allowAlphabetsAndSpace: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_financialYear', label: 'Financial Year Followed', type: 'select', required: true, placeholder: 'Select financial year', optionsSource: 'financialYears', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'tds_contactName', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact person name', prefillFrom: 'user.contactPersonName', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'tds_contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'tds_contactMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'tds_contactEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised Signatory
            { key: 'tds_signatoryName', label: 'Authorised Signatory Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Part 2 — Authorised Signatory', colSpan: 1, validation: 'fullName' },
            { key: 'tds_signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryDsc', label: 'DSC Available?', type: 'select', required: true, placeholder: 'Select', section: 'Part 2 — Authorised Signatory', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            // Part 3 — TAN Registration
            { key: 'tds_reg_note', type: 'note', section: 'Part 3 — TAN Registration', colSpan: 2, description: 'A TAN (Tax Deduction and Collection Account Number) is mandatory for every entity that deducts or collects tax at source. TDS deducted must be deposited by the 7th of the following month using challan ITNS-281.' },
            { key: 'tds_hasTan', label: 'Does the company already have a TAN?', type: 'select', required: true, placeholder: 'Select', section: 'Part 3 — TAN Registration', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            { key: 'tds_deductionReason', label: 'Reason TDS Deduction is Expected', type: 'select', required: true, placeholder: 'Select reason', section: 'Part 3 — TAN Registration', colSpan: 1, options: [
                { label: 'Salary / contractor', value: 'Salary' },
                { label: 'Professional fees', value: 'Professional Fees' },
                { label: 'Rent', value: 'Rent' },
                { label: 'Interest', value: 'Interest' },
                { label: 'Commission', value: 'Commission' },
            ]},
            { key: 'tds_tanAddress', label: 'Address for TAN Registration', type: 'textarea', required: true, placeholder: 'Usually the registered office address', section: 'Part 3 — TAN Registration', colSpan: 2, minRows: 2 },
            { key: 'tds_responsiblePersonName', label: 'Person Responsible for TDS / Contact', type: 'text', required: true, placeholder: 'Name, designation, PAN, mobile', section: 'Part 3 — TAN Registration', colSpan: 1 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'tds_coi', label: 'Certificate of Incorporation', required: true },
            { key: 'tds_panCard', label: 'Company PAN Card', required: true },
            { key: 'tds_registeredOfficeProof', label: 'Registered Office Address Proof', required: true },
            { key: 'tds_responsiblePersonPan', label: 'PAN of Person Responsible for TDS', required: true },
            { key: 'tds_responsiblePersonAadhaar', label: 'Aadhaar of Person Responsible for TDS', required: true },
            { key: 'tds_dsc', label: 'Digital Signature Certificate (DSC) of Authorised Signatory', required: true },
        ],
    },

    TDS_RETURN_FILING: {
        fields: [
            // Part 1 — Company Details
            { key: 'tds_companyName', label: 'Full Name of the Company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'tds_cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'e.g. U74999MH2024PTC123456', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_incorporationDate', label: 'Date of Incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select', section: 'Part 1 — Company Details', colSpan: 1, options: [
                { label: 'Private Ltd', value: 'Private Ltd' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Ltd', value: 'Public Ltd' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ]},
            { key: 'tds_companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'e.g. ABCDE1234F', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_companyTan', label: 'Company TAN', type: 'text', required: true, placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'e.g. 27AAAAA0000A1Z5', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_registeredAddress', label: 'Registered Office Address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'tds_email', label: 'Official Email ID of the Company', type: 'text', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_mobile', label: 'Official Mobile / Phone Number', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_authorisedCapital', label: 'Authorised Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter authorised capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'text', required: true, placeholder: 'Enter paid-up capital', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_businessActivity', label: 'Main Business Activity', type: 'text', required: true, placeholder: 'Nature of goods or services, industry', allowAlphabetsAndSpace: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'tds_financialYear', label: 'Financial Year Followed', type: 'select', required: true, placeholder: 'Select financial year', optionsSource: 'financialYears', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'tds_contactName', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact person name', prefillFrom: 'user.contactPersonName', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'tds_contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'tds_contactMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'tds_contactEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised Signatory
            { key: 'tds_signatoryName', label: 'Authorised Signatory Name', type: 'text', required: true, placeholder: 'Enter full name', section: 'Part 2 — Authorised Signatory', colSpan: 1, validation: 'fullName' },
            { key: 'tds_signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryMobile', label: 'Mobile', type: 'text', required: true, placeholder: 'Enter 10-digit mobile number', validation: 'mobile', maxLength: 10, allowNumbersOnly: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryEmail', label: 'Email', type: 'text', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'tds_signatoryDsc', label: 'DSC Available?', type: 'select', required: true, placeholder: 'Select', section: 'Part 2 — Authorised Signatory', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            // Part 3 — TDS Return Filing
            { key: 'tds_ret_note', type: 'note', section: 'Part 3 — TDS Return Filing Details', colSpan: 2, description: 'Quarterly returns are due on 31 July (Q1), 31 October (Q2), 31 January (Q3) and 31 May (Q4). Late filing attracts ₹200 per day under Section 234E (capped at the TDS amount of the quarter). TDS certificates (Form 16 / 16A) are issued from the TRACES portal after the return is processed.' },
            { key: 'tds_tan', label: 'TAN', type: 'text', required: true, placeholder: 'e.g. ABCD12345E', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 3 — TDS Return Filing Details', colSpan: 1 },
            { key: 'tds_quarter', label: 'Quarter & Financial Year for the Return', type: 'select', required: true, placeholder: 'Select quarter', section: 'Part 3 — TDS Return Filing Details', colSpan: 1, options: [
                { label: 'Q1 - April to June', value: 'Q1' },
                { label: 'Q2 - July to September', value: 'Q2' },
                { label: 'Q3 - October to December', value: 'Q3' },
                { label: 'Q4 - January to March', value: 'Q4' },
            ]},
            { key: 'tds_returnFinancialYear', label: 'Financial Year', type: 'text', required: true, placeholder: 'e.g. 2024-25', section: 'Part 3 — TDS Return Filing Details', colSpan: 1 },
            { key: 'tds_returnForms', label: 'Return Form(s) Required', type: 'multiselect', required: true, placeholder: 'Tick all that apply', section: 'Part 3 — TDS Return Filing Details', colSpan: 2, options: [
                { label: 'Form 24Q - TDS on salary payments (Section 192)', value: 'FORM_24Q' },
                { label: 'Form 26Q - TDS on resident non-salary payments', value: 'FORM_26Q' },
                { label: 'Form 27Q - TDS on payments to non-residents / foreign companies', value: 'FORM_27Q' },
                { label: 'Form 27EQ - TCS (tax collected at source)', value: 'FORM_27EQ' },
                { label: 'Nil return / nil declaration', value: 'NIL' },
            ]},
            { key: 'tds_numberOfDeductees', label: 'Number of Deductees in the Quarter', type: 'text', placeholder: 'Employees and / or vendors', allowNumbersOnly: true, section: 'Part 3 — TDS Return Filing Details', colSpan: 1 },
            { key: 'tds_paymentNatures', label: 'Nature of Payments & Sections Involved', type: 'multiselect', placeholder: 'Select sections', section: 'Part 3 — TDS Return Filing Details', colSpan: 1, options: [
                { label: '194C - Contractor', value: '194C' },
                { label: '194J - Professional Fees', value: '194J' },
                { label: '194I - Rent', value: '194I' },
                { label: '194A - Interest', value: '194A' },
                { label: '194H - Commission', value: '194H' },
                { label: '194T - Partner Payments', value: '194T' },
            ]},
            { key: 'tds_totalAmountPaid', label: 'Total Amount Paid / Credited in the Quarter (₹)', type: 'text', placeholder: 'Enter total amount', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — TDS Return Filing Details', colSpan: 1 },
            { key: 'tds_totalTdsDeducted', label: 'Total TDS Deducted in the Quarter (₹)', type: 'text', placeholder: 'Enter total TDS amount', allowTwoDecimalsOnly: true, maxLength: 12, section: 'Part 3 — TDS Return Filing Details', colSpan: 1 },
            { key: 'tds_challanDetails', label: 'TDS Challan Details', type: 'textarea', placeholder: 'Challan numbers, dates and amounts — attach challans', section: 'Part 3 — TDS Return Filing Details', colSpan: 2, minRows: 3 },
            { key: 'tds_dataSource', label: 'Source of Deduction Data', type: 'select', placeholder: 'Select source', section: 'Part 3 — TDS Return Filing Details', colSpan: 1, options: [
                { label: 'Payroll', value: 'Payroll' },
                { label: 'Accounting Software', value: 'Accounting Software' },
                { label: 'Excel', value: 'Excel' },
            ]},
            { key: 'tds_form16Required', label: 'Are Form 16 / 16A Certificates Required After Filing?', type: 'select', placeholder: 'Select', section: 'Part 3 — TDS Return Filing Details', colSpan: 1, options: [
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
            ]},
            { key: 'tds_deducteeDetails', type: 'repeatable-table', section: 'Part 3 — TDS Return Filing Details', colSpan: 2, columns: [
                { key: 'serialNumber', label: '#', type: 'serial', width: 40 },
                { key: 'deducteeName', label: 'Deductee Name', type: 'text', placeholder: 'Enter name', minWidth: 160, requiredIfAnyOtherFilled: true },
                { key: 'pan', label: 'PAN', type: 'text', placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', minWidth: 120, requiredIfAnyOtherFilled: true },
                { key: 'section', label: 'Section', type: 'text', placeholder: 'e.g. 194C', minWidth: 90, requiredIfAnyOtherFilled: true },
                { key: 'amountPaid', label: 'Amount Paid (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minWidth: 110, requiredIfAnyOtherFilled: true },
                { key: 'tdsDeducted', label: 'TDS Deducted (₹)', type: 'text', placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minWidth: 110, requiredIfAnyOtherFilled: true },
            ]},
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'tds_tanAllotmentLetter', label: 'TAN Allotment Letter', required: true },
            { key: 'tds_challans', label: 'TDS Challans (ITNS-281)', required: true },
            { key: 'tds_payrollReports', label: 'Payroll / Salary Reports' },
            { key: 'tds_deducteePanDetails', label: 'Deductee PAN Details', required: true },
            { key: 'tds_form16Files', label: 'Form 16 / Form 16A Files' },
        ],
    },

    // ── SHARED MCA PART 1 + 2 FIELDS (inlined per type below) ──────────────

    MCA_ADT1: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Select type', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'Enter TAN', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'Enter GSTIN', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'authorisedShareCapital', label: 'Authorised share capital (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'paidUpCapital', label: 'Paid-up / subscribed share capital (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'mainBusinessActivity', label: 'Main business activity', type: 'textarea', required: true, placeholder: 'Nature of goods or services; industry', section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'financialYear', label: 'Financial year followed', type: 'text', required: true, placeholder: 'Normally 1 April - 31 March', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact Person for This Engagement', allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Directors
            { key: 'directorsTable', title: 'Directors', type: 'repeatable-table', section: 'Part 2 — Directors & Authorised Signatory', description: 'List every current director. Mark (✓) in the last column if a valid DSC is available and registered on the MCA portal.', defaultRows: 4, columns: [{ key: 'serialNumber', label: '#', type: 'serial', width: 40 }, { key: 'directorName', label: 'Name of director', type: 'text', required: true, placeholder: 'Enter director name', minWidth: 160 }, { key: 'din', label: 'DIN', type: 'text', required: true, placeholder: 'Enter DIN', maxLength: 8, allowNumbersOnly: true, validation: 'din', minWidth: 110 }, { key: 'pan', label: 'PAN', type: 'text', required: true, placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', minWidth: 120 }, { key: 'mobileEmail', label: 'Mobile & email', type: 'textarea', required: true, placeholder: 'Enter mobile & email', minWidth: 180 }, { key: 'dscAvailable', label: 'DSC?', type: 'checkbox', minWidth: 60 }] },
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            // Part 3 — ADT-1
            { key: 'adt1Note', type: 'note', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 2, description: 'The first statutory auditor must be appointed by the Board within 30 days of incorporation. ADT-1 is filed within 15 days of the auditor\'s appointment at the AGM.' },
            { key: 'adt1_auditorAppointed', label: 'Has the first auditor been appointed?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'Yes / No - with date of board meeting', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 1 },
            { key: 'adt1_boardMeetingDate', label: 'Date of board meeting', type: 'date', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 1 },
            { key: 'adt1_auditorNameReg', label: 'Name & membership / firm registration no. of the auditor', type: 'textarea', required: true, placeholder: 'Enter auditor name and registration number', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 2, minRows: 2 },
            { key: 'adt1_auditorPanAddressContact', label: 'Auditor PAN, address, email & phone', type: 'textarea', required: true, placeholder: 'Enter PAN, address, email and phone', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 2, minRows: 2 },
            { key: 'adt1_appointmentPeriod', label: 'Period for which the auditor is appointed', type: 'text', placeholder: 'e.g. till conclusion of first / sixth AGM', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 1 },
            { key: 'adt1_agmDate', label: 'Date of AGM at which auditor is appointed / ratified', type: 'date', section: 'Part 3 — Appointment of First Auditor & Form ADT-1', colSpan: 1 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
            { key: 'moaAoa', label: 'MOA & AOA', required: true },
            { key: 'panCard', label: 'Company PAN Card', required: true },
            { key: 'digitalSignatureCertificate', label: 'Digital Signature Certificate (DSC) of signing director', required: true },
            { key: 'boardResolutionAuditor', label: 'Board resolution for appointment of auditor', required: true },
            { key: 'auditorConsentLetter', label: 'Auditor consent letter / certificate of eligibility', required: true },
        ],
    },

    MCA_ANNUAL: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Select type', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'Enter TAN', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'Enter GSTIN', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'authorisedShareCapital', label: 'Authorised share capital (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'paidUpCapital', label: 'Paid-up / subscribed share capital (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'mainBusinessActivity', label: 'Main business activity', type: 'textarea', required: true, placeholder: 'Nature of goods or services; industry', section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'financialYear', label: 'Financial year followed', type: 'text', required: true, placeholder: 'Normally 1 April - 31 March', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Directors & Shareholders
            { key: 'directorsTable', title: 'Directors', type: 'repeatable-table', section: 'Part 2 — Directors & Shareholders', description: 'List every current director. Mark (✓) in the last column if a valid DSC is available and registered on the MCA portal.', defaultRows: 4, columns: [{ key: 'serialNumber', label: '#', type: 'serial', width: 40 }, { key: 'directorName', label: 'Name of director', type: 'text', required: true, placeholder: 'Enter director name', minWidth: 160 }, { key: 'din', label: 'DIN', type: 'text', required: true, placeholder: 'Enter DIN', maxLength: 8, allowNumbersOnly: true, validation: 'din', minWidth: 110 }, { key: 'pan', label: 'PAN', type: 'text', required: true, placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', minWidth: 120 }, { key: 'mobileEmail', label: 'Mobile & email', type: 'textarea', required: true, placeholder: 'Enter mobile & email', minWidth: 180 }, { key: 'dscAvailable', label: 'DSC?', type: 'checkbox', minWidth: 60 }] },
            { key: 'shareholdersTable', title: 'Shareholders / subscribers to the memorandum', type: 'repeatable-table', section: 'Part 2 — Directors & Shareholders', defaultRows: 4, columns: [{ key: 'serialNumber', label: '#', type: 'serial', width: 40 }, { key: 'shareholderName', label: 'Name of shareholder', type: 'text', required: true, placeholder: 'Enter name', minWidth: 160 }, { key: 'pan', label: 'PAN', type: 'text', required: true, placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', minWidth: 120 }, { key: 'sharesHeld', label: 'Shares held', type: 'text', required: true, placeholder: 'Enter number', allowNumbersOnly: true, minWidth: 110 }, { key: 'subscribedAmount', label: 'Subscribed (₹)', type: 'text', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minWidth: 110 }, { key: 'paidAmount', label: 'Paid (₹)', type: 'text', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minWidth: 110 }] },
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Shareholders', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Directors & Shareholders', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Shareholders', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Directors & Shareholders', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Directors & Shareholders', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Directors & Shareholders', colSpan: 1 },
            // Part 3 — Annual Filing
            { key: 'annualNote', type: 'note', section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 2, description: 'AOC-4 is filed within 30 days and MGT-7 / MGT-7A within 60 days of the AGM. A small company / OPC files MGT-7A. First AGM within 9 months of close of first financial year; later AGMs within 6 months. Late filing fee ₹100 per day per form with no upper cap.' },
            { key: 'annual_financialYear', label: 'Financial year to be filed', type: 'text', required: true, placeholder: 'e.g. 2025-26', section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 1 },
            { key: 'annual_agmDate', label: 'Date of the Annual General Meeting (AGM)', type: 'date', section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 1 },
            { key: 'annual_accountsAudited', label: 'Are the accounts audited and signed?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'Yes / No - expected date if pending', section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 1 },
            { key: 'annual_isFirstFiling', label: 'Is this the company\'s first annual filing?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 1 },
            { key: 'annual_isSmallCompany', label: 'Does the company qualify as a \'small company\'?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'Decides MGT-7 vs MGT-7A', section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 1 },
            { key: 'annual_boardMeetingsCount', label: 'Number of board meetings held during the year', type: 'number', placeholder: 'Enter count', allowNumbersOnly: true, section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 1 },
            { key: 'annual_directorShareholderChanges', label: 'Were there any changes in directors or shareholding?', type: 'textarea', placeholder: 'If yes, give brief details', section: 'Part 3 — Annual Filing: AOC-4 & MGT-7 / MGT-7A', colSpan: 2, minRows: 2 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
            { key: 'moaAoa', label: 'MOA & AOA', required: true },
            { key: 'panCard', label: 'Company PAN Card', required: true },
            { key: 'digitalSignatureCertificate', label: 'Digital Signature Certificate (DSC) of signing director', required: true },
            { key: 'financialStatements', label: 'Audited financial statements - Balance Sheet, P&L, cash flow, notes', required: true },
            { key: 'auditorReport', label: "Auditor's Report", required: true },
            { key: 'directorsReport', label: "Directors' Report with annexures", required: true },
            { key: 'agmNoticeMinutes', label: 'Notice and minutes of the AGM', required: true },
            { key: 'boardMeetingList', label: 'List of board meetings held with dates', required: true },
            { key: 'shareholdingPattern', label: 'Shareholding pattern / register of members' },
        ],
    },

    MCA_DIR3KYC: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Select type', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Directors
            { key: 'directorsTable', title: 'Directors', type: 'repeatable-table', section: 'Part 2 — Directors & Authorised Signatory', description: 'List every current director. Mark (✓) in the last column if a valid DSC is available and registered on the MCA portal.', defaultRows: 4, columns: [{ key: 'serialNumber', label: '#', type: 'serial', width: 40 }, { key: 'directorName', label: 'Name of director', type: 'text', required: true, placeholder: 'Enter director name', minWidth: 160 }, { key: 'din', label: 'DIN', type: 'text', required: true, placeholder: 'Enter DIN', maxLength: 8, allowNumbersOnly: true, validation: 'din', minWidth: 110 }, { key: 'pan', label: 'PAN', type: 'text', required: true, placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', minWidth: 120 }, { key: 'mobileEmail', label: 'Mobile & email', type: 'textarea', required: true, placeholder: 'Enter mobile & email', minWidth: 180 }, { key: 'dscAvailable', label: 'DSC?', type: 'checkbox', minWidth: 60 }] },
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Directors & Authorised Signatory', colSpan: 1 },
            // Part 3 — DIR-3 KYC
            { key: 'dir3kycNote', type: 'note', section: 'Part 3 — DIR-3 KYC of Directors', colSpan: 2, description: 'Every person holding a DIN as on 31 March must complete DIR-3 KYC by 30th June, or whenever there is a change in mobile number, email ID or residential address. Missing it deactivates the DIN. Fee: ₹5,000 per director.' },
            { key: 'dir3kyc_directorsForKyc', label: 'Director(s) for whom KYC is to be filed', type: 'textarea', required: true, placeholder: 'Full name, DIN, first-time or annual update', section: 'Part 3 — DIR-3 KYC of Directors', colSpan: 2, minRows: 2 },
            { key: 'dir3kyc_isFirstTime', label: 'First-time DIR-3 KYC, or web-based update?', type: 'select', options: [{ label: 'First-time (e-KYC)', value: 'first_time' }, { label: 'Web-based update', value: 'web_based' }], section: 'Part 3 — DIR-3 KYC of Directors', colSpan: 1 },
            { key: 'dir3kyc_mobileEmailChanged', label: 'Have the mobile number and email been changed since last KYC?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'OTP verification is done on these', section: 'Part 3 — DIR-3 KYC of Directors', colSpan: 1 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
            { key: 'panCard', label: 'Company PAN Card', required: true },
            { key: 'directorPanAadhaar', label: 'PAN & Aadhaar of each director requiring KYC', required: true },
            { key: 'directorPhoto', label: 'Passport-size photograph of each director', required: true },
            { key: 'digitalSignatureCertificate', label: 'Digital Signature Certificate (DSC) of signing director', required: true },
        ],
    },

    MCA_DPT3: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Select type', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact Person for This Engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised signatory
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            // Part 3 — DPT-3
            { key: 'dpt3Note', type: 'note', section: 'Part 3 — DPT-3: Return of Deposits & Outstanding Loans', colSpan: 2, description: 'Filed once by 30 June reporting deposits and amounts not treated as deposits (e.g. loans from directors) outstanding as on 31 March.' },
            { key: 'dpt3_financialYear', label: 'Financial year of the return', type: 'text', required: true, placeholder: 'e.g. 2024-25', section: 'Part 3 — DPT-3: Return of Deposits & Outstanding Loans', colSpan: 1 },
            { key: 'dpt3_outstandingLoans', label: 'Outstanding loans / balances as on 31 March (₹)', type: 'textarea', required: true, placeholder: 'Banks, lending companies, directors, related parties…', section: 'Part 3 — DPT-3: Return of Deposits & Outstanding Loans', allowTwoDecimalsOnly: true,maxLength: 12, colSpan: 2, minRows: 2 },
            { key: 'dpt3_depositsAccepted', label: 'Has the company accepted any deposits from the public?', type: 'select', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 3 — DPT-3: Return of Deposits & Outstanding Loans', colSpan: 1 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
            { key: 'panCard', label: 'Company PAN Card', required: true },
            { key: 'digitalSignatureCertificate', label: 'Digital Signature Certificate (DSC) of signing director', required: true },
            { key: 'loanStatements', label: 'Loan / deposit statements as on 31 March', required: true },
            { key: 'auditedBalanceSheet', label: 'Audited Balance Sheet for the relevant year', required: true },
        ],
    },

    MCA_MSME1: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Select type', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact Person for This Engagement', allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised signatory
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            // Part 3 — MSME-1
            { key: 'msme1_reportingHalfYear', label: 'Reporting half year', type: 'select', required: true, options: [{ label: 'April - September (due 30 October)', value: 'apr_sep' }, { label: 'October - March (due 30 April)', value: 'oct_mar' }], section: 'Part 3 — MSME-1: Half-Yearly Return of Dues to MSME Vendors', colSpan: 1 },
            { key: 'msme1_totalOutstanding', label: 'Total amount outstanding to MSME vendors beyond 45 days (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — MSME-1: Half-Yearly Return of Dues to MSME Vendors', colSpan: 1 },
            { key: 'msme1_vendorCount', label: 'Number of MSME vendors involved', type: 'number', required: true, placeholder: 'Enter count', allowNumbersOnly: true, section: 'Part 3 — MSME-1: Half-Yearly Return of Dues to MSME Vendors', colSpan: 1 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
            { key: 'panCard', label: 'Company PAN Card', required: true },
            { key: 'digitalSignatureCertificate', label: 'Digital Signature Certificate (DSC) of signing director', required: true },
            { key: 'msmeVendorDetails', label: 'Party-wise MSME vendor outstanding details (beyond 45 days)', required: true },
        ],
    },

    MCA_OTHER: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Select type', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            // Primary contact
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact Person for This Engagement', allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary Contact Person for This Engagement', colSpan: 1 },
            // Part 2 — Authorised signatory
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Authorised Signatory', colSpan: 1 },
            // Part 3 — Other event-based
            { key: 'other_eventDescription', label: 'Describe the event / filing', type: 'textarea', required: true, placeholder: 'e.g. INC-22A office change, DIR-12 director changes, CHG-1 charges, SH-7 change of capital, GNL-1 resolutions…', section: 'Part 3 — Other Event-Based ROC Filing', colSpan: 2, minRows: 3 },
            { key: 'other_eventDate', label: 'Date of the event', type: 'date', required: true, section: 'Part 3 — Other Event-Based ROC Filing', colSpan: 1 },
            { key: 'other_relevantDetails', label: 'Relevant details / amounts', type: 'textarea', placeholder: 'Enter relevant details and amounts', maxLength: 500, minRows: 2, section: 'Part 3 — Other Event-Based ROC Filing', colSpan: 2 },
            { key: 'description', label: 'Additional details / remarks', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3, section: 'Additional Remarks', colSpan: 2 },
        ],
        docs: [
            { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
            { key: 'panCard', label: 'Company PAN Card', required: true },
            { key: 'digitalSignatureCertificate', label: 'Digital Signature Certificate (DSC) of signing director', required: true },
            { key: 'eventSupportingDocuments', label: 'Supporting documents for event-based ROC filing', required: true },
        ],
    },

    INC20A: {
        fields: [
            // Part 1 — Company Details
            { key: 'companyName', label: 'Full name of the company', type: 'text', required: true, placeholder: 'Exactly as on the Certificate of Incorporation', section: 'Part 1 — Company Details', colSpan: 2, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
            { key: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'incorporationDate', label: 'Date of incorporation', type: 'date', required: true, placeholder: 'Select date', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyType', label: 'Type of company', type: 'select', required: true, options: [{ label: 'Private Ltd', value: 'private_ltd' }, { label: 'OPC', value: 'opc' }, { label: 'Public Ltd', value: 'public_ltd' }, { label: 'Section 8', value: 'section_8' }, { label: 'Other', value: 'other' }], placeholder: 'Private Ltd / OPC / Public Ltd / Section 8 / other', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'companyTan', label: 'Company TAN (if already allotted)', type: 'text', placeholder: 'Enter TAN', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'gstin', label: 'GSTIN (if already registered)', type: 'text', placeholder: 'Enter GSTIN', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'registeredOfficeAddress', label: 'Registered office address', type: 'textarea', required: true, placeholder: 'Full address with city, state and PIN code', allowAlphabetsSpaceAndNumbers: true, section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'officialEmail', label: 'Official email ID of the company', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'officialMobile', label: 'Official mobile / phone number', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'authorisedShareCapital', label: 'Authorised share capital (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'paidUpCapital', label: 'Paid-up / subscribed share capital (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, section: 'Part 1 — Company Details', colSpan: 1 },
            { key: 'mainBusinessActivity', label: 'Main business activity', type: 'textarea', required: true, placeholder: 'Nature of goods or services; industry', section: 'Part 1 — Company Details', colSpan: 2, minRows: 2 },
            { key: 'financialYear', label: 'Financial year followed', type: 'text', placeholder: 'Normally 1 April - 31 March', section: 'Part 1 — Company Details', colSpan: 1 },

            // Part 1 — Primary contact person
            { key: 'contactName', label: 'Name', type: 'text', required: true, placeholder: 'Enter contact name', allowAlphabetsAndSpace: true, section: 'Primary contact person for this engagement', colSpan: 1 },
            { key: 'contactDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary contact person for this engagement',allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'contactMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Primary contact person for this engagement', colSpan: 1 },
            { key: 'contactEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Primary contact person for this engagement', colSpan: 1 },

            // Part 2 — Directors table
            {
                key: 'directorsTable',
                title: 'Directors',
                type: 'repeatable-table',
                section: 'Part 2 — Directors & Subscribers',
                description: 'List every current director. Mark (✓) in the last column if a valid DSC is available and registered on the MCA portal.',
                defaultRows: 3,
                columns: [
                    { key: 'serialNumber', label: '#', type: 'serial', width: 40 },
                    { key: 'directorName', label: 'Name of director', type: 'text', required: true, placeholder: 'Enter director name' },
                    { key: 'din', label: 'DIN', type: 'text', required: true, placeholder: 'Enter DIN', maxLength: 8, allowNumbersOnly: true, validation: 'din' },
                    { key: 'pan', label: 'PAN', type: 'text', required: true, placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan' },
                    { key: 'mobileEmail', label: 'Mobile & email', type: 'textarea', required: true, placeholder: 'Enter mobile & email' },
                    { key: 'dscAvailable', label: 'DSC?', type: 'checkbox' },
                ],
            },

            // Part 2 — Shareholders table
            {
                key: 'shareholdersTable',
                title: 'Shareholders / subscribers to the memorandum',
                type: 'repeatable-table',
                section: 'Part 2 — Directors & Subscribers',
                defaultRows: 4,
                columns: [
                    { key: 'serialNumber', label: '#', type: 'serial', width: 40 },
                    { key: 'shareholderName', label: 'Name of shareholder', type: 'text', required: true, placeholder: 'Enter name' },
                    { key: 'pan', label: 'PAN', type: 'text', required: true, placeholder: 'Enter PAN', convertToUppercase: true, maxLength: 10, validation: 'pan' },
                    { key: 'sharesHeld', label: 'Shares held', type: 'text', required: true, placeholder: 'Enter number', allowNumbersOnly: true },
                    { key: 'subscribedAmount', label: 'Subscribed (₹)', type: 'text', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12 },
                    { key: 'paidAmount', label: 'Paid (₹)', type: 'text', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12 },
                ],
            },

            // Part 2 — Authorised signatory
            { key: 'signatoryName', label: 'Name', type: 'text', required: true, placeholder: 'Enter name', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Subscribers', colSpan: 1 },
            { key: 'signatoryDinPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Part 2 — Directors & Subscribers', colSpan: 1 },
            { key: 'signatoryDesignation', label: 'Designation', type: 'text', required: true, placeholder: 'Enter designation', allowAlphabetsAndSpace: true, section: 'Part 2 — Directors & Subscribers', colSpan: 1 },
            { key: 'signatoryMobile', label: 'Mobile', type: 'phone', required: true, placeholder: 'Enter 10-digit number', allowNumbersOnly: true, maxLength: 10, validation: 'mobile', section: 'Part 2 — Directors & Subscribers', colSpan: 1 },
            { key: 'signatoryEmail', label: 'Email', type: 'email', required: true, placeholder: 'Enter email', validation: 'email', section: 'Part 2 — Directors & Subscribers', colSpan: 1 },
            { key: 'signatoryDscAvailable', label: 'DSC available?', type: 'select', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 2 — Directors & Subscribers', colSpan: 1 },

            // Part 3 — Eligibility & timeline
            { key: 'inc20aPenaltyNote', type: 'note', description: 'Late / non-filing attracts a penalty of ₹50,000 on the company and ₹1,000 per day on each officer in default (maximum ₹1,00,000), and the ROC may strike off the company.', section: 'Part 3 — Eligibility & Timeline', colSpan: 2 },
            { key: 'incorporationDatePart3', label: 'Date of incorporation', type: 'date', required: true, placeholder: 'Select date', section: 'Part 3 — Eligibility & Timeline', colSpan: 1 },
            { key: 'dueDateInc20A', label: '180-day due date for INC-20A', type: 'date', placeholder: 'Date of incorporation + 180 days', section: 'Part 3 — Eligibility & Timeline', colSpan: 1 },
            { key: 'registeredOfficeVerified', label: 'Has the registered office been verified with the ROC?', type: 'select', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'Through SPICe+ Part B or Form INC-22', section: 'Part 3 — Eligibility & Timeline', colSpan: 2 },
            { key: 'hasShareCapital', label: 'Does the company have share capital?', type: 'select', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'INC-20A applies only to companies with share capital', section: 'Part 3 — Eligibility & Timeline', colSpan: 1 },

            // Part 3 — Share subscription & bank account
            { key: 'currentAccountOpened', label: 'Has the company current account been opened?', type: 'select', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], placeholder: 'If not, the account must be opened first', section: 'Part 3 — Share Subscription & Bank Account', colSpan: 1 },
            { key: 'bankNameBranchAccount', label: 'Bank name, branch & account number', type: 'textarea', required: true, placeholder: 'Enter bank name, branch and account number', section: 'Part 3 — Share Subscription & Bank Account', colSpan: 2, minRows: 2 },
            { key: 'totalSubscribedCapitalMoa', label: 'Total subscribed capital as per MOA (₹)', type: 'number', required: true, placeholder: 'Enter amount', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — Share Subscription & Bank Account', colSpan: 1 },
            { key: 'totalSubscriptionReceived', label: 'Total subscription money actually received (₹)', type: 'number', required: true, placeholder: 'Must equal the paid-up capital', allowTwoDecimalsOnly: true,maxLength: 12, section: 'Part 3 — Share Subscription & Bank Account', colSpan: 1 },
            { key: 'subscriptionReceivedDates', label: 'Date(s) on which subscription money was received', type: 'textarea', required: true, placeholder: 'Capital may be received in parts within 60 days of incorporation', section: 'Part 3 — Share Subscription & Bank Account', colSpan: 2, minRows: 2 },
            { key: 'noOtherTransactions', label: 'Confirm the account has no transactions other than receipt of subscription money', type: 'select', required: true, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], section: 'Part 3 — Share Subscription & Bank Account', colSpan: 1 },
        ],
       docs: [
        {
            key: 'bankStatement',
            label: 'Bank statement / passbook showing receipt of subscription money',
            required: true,
        },

        {
            key: 'boardResolution',
            label: 'Board resolution authorising filing of INC-20A',
            required: true,
        },

        {
            key: 'registeredOfficeExterior',
            label: 'Photograph of registered office - exterior building',
            required: true,
        },

        {
            key: 'registeredOfficeInterior',
            label: 'Photograph of registered office - interior with at least one director / KMP',
            required: true,
        },

        {
            key: 'certificateOfIncorporationMoaAoa',
            label: 'Certificate of Incorporation and MOA / AOA',
            required: true,
        },

        {
            key: 'sectoralRegulatorApproval',
            label: 'Sectoral regulator approval, if applicable',
            required: false,
        },
    ],
    },

    BANK_ACCOUNT: {
    fields: [
        // Company Details
        { key: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name as per COI', section: 'Company Details', colSpan: 1, allowAlphabetsNumberAndSpecialCharacters: [' ', ',', '.', '/', '-', '&', '(', ')'] },
        { key: 'cin', label: 'CIN Number', type: 'text', required: true, placeholder: 'Enter 21-character CIN', convertToUppercase: true, maxLength: 21, validation: 'cin', section: 'Company Details', colSpan: 1 },
        { key: 'dateOfIncorporation', label: 'Date of Incorporation', type: 'date', required: true, section: 'Company Details', colSpan: 1 },
        {
            key: 'companyType', label: 'Type of Company', type: 'select', required: true, placeholder: 'Select company type', section: 'Company Details', colSpan: 1,
            options: [
                { label: 'Private Limited', value: 'Private Limited' },
                { label: 'OPC', value: 'OPC' },
                { label: 'Public Limited', value: 'Public Limited' },
                { label: 'Section 8', value: 'Section 8' },
                { label: 'Other', value: 'Other' },
            ],
        },
        { key: 'companyPan', label: 'Company PAN', type: 'text', required: true, placeholder: 'Enter company PAN', convertToUppercase: true, maxLength: 10, validation: 'pan', section: 'Company Details', colSpan: 1 },
        { key: 'companyTan', label: 'Company TAN', type: 'text', placeholder: 'Enter TAN number', convertToUppercase: true, maxLength: 10, validation: 'tan', section: 'Company Details', colSpan: 1 },
        { key: 'gstin', label: 'GSTIN', type: 'text', placeholder: 'Enter GSTIN', convertToUppercase: true, maxLength: 15, validation: 'gst', section: 'Company Details', colSpan: 1 },

        // Registered Office Details
        { key: 'registeredOfficeAddress', label: 'Registered Office Address', type: 'textarea', required: true, placeholder: 'Enter full registered office address', allowAlphabetsSpaceAndNumbers: true, section: 'Registered Office' },
        { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'Enter city', section: 'Registered Office', colSpan: 1 },
        { key: 'state', label: 'State', type: 'text', required: true, placeholder: 'Enter state', section: 'Registered Office', colSpan: 1 },
        { key: 'pinCode', label: 'PIN Code', type: 'text', required: true, placeholder: 'Enter PIN code', maxLength: 6, allowNumbersOnly: true, section: 'Registered Office', colSpan: 1 },

        // Contact Details
        { key: 'officialEmail', label: 'Official Email ID', type: 'email', required: true, placeholder: 'Enter official email', validation: 'email', section: 'Contact Details', colSpan: 1 },
        { key: 'officialMobile', label: 'Official Mobile Number', type: 'text', required: true, placeholder: 'Enter mobile number', maxLength: 10, allowNumbersOnly: true, validation: 'mobile', section: 'Contact Details', colSpan: 1 },

        // Capital & Business Details
        { key: 'authorizedShareCapital', label: 'Authorised share capital (₹)', type: 'number', required: true, placeholder: 'Enter authorised share capital', section: 'Capital & Business',allowTwoDecimalsOnly: true,maxLength: 12, minValue: 0, colSpan: 1 },
        { key: 'paidUpCapital', label: 'Paid-up / Subscribed Share Capital (₹)', type: 'number', required: true, placeholder: 'Enter paid-up capital', section: 'Capital & Business', allowTwoDecimalsOnly: true, maxLength: 12, minValue: 0, colSpan: 1 },
        { key: 'mainBusinessActivity', label: 'Main Business Activity', type: 'textarea', required: true, placeholder: 'Enter nature of goods/services', maxLength: 500, minRows: 3, section: 'Capital & Business' },
        { key: 'financialYear', label: 'Financial Year', type: 'text', required: true, placeholder: '1 April - 31 March', prefillDefault: '1 April - 31 March', section: 'Capital & Business', colSpan: 1 },

        // Primary Contact Person
        { key: 'primaryContactName', label: 'Primary Contact Person Name', type: 'text', required: true, placeholder: 'Enter contact person name', allowAlphabetsAndSpace: true, section: 'Primary Contact', colSpan: 1 },
        { key: 'primaryContactDesignation', label: 'Primary Contact Designation', type: 'text', required: true, placeholder: 'Enter designation', section: 'Primary Contact',allowAlphabetsAndSpace: true, colSpan: 1 },
        { key: 'primaryContactMobile', label: 'Primary Contact Mobile', type: 'text', required: true, placeholder: 'Enter mobile number', maxLength: 10, allowNumbersOnly: true, validation: 'mobile', section: 'Primary Contact', colSpan: 1 },
        { key: 'primaryContactEmail', label: 'Primary Contact Email', type: 'email', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Primary Contact', colSpan: 1 },

        // Bank Preferences
        {
            key: 'preferredBank', label: 'Preferred Bank', type: 'select', required: true, placeholder: 'Select bank', section: 'Bank Preferences', colSpan: 1,
            options: [
                { label: 'SBI', value: 'SBI' },
                { label: 'HDFC Bank', value: 'HDFC' },
                { label: 'ICICI Bank', value: 'ICICI' },
                { label: 'Axis Bank', value: 'Axis' },
                { label: 'Kotak Mahindra Bank', value: 'Kotak' },
                { label: 'Yes Bank', value: 'Yes' },
                { label: 'Other', value: 'Other' },
            ],
        },
        { key: 'preferredBranch', label: 'Preferred Branch / Location', type: 'text', required: true, placeholder: 'Enter preferred branch/location', section: 'Bank Preferences', colSpan: 1 },
        {
            key: 'accountType', label: 'Account Type', type: 'select', required: true, placeholder: 'Select account type', section: 'Bank Preferences', colSpan: 1,
            options: [
                { label: 'Current Account', value: 'Current' },
                { label: 'Savings Account', value: 'Savings' },
                { label: 'Escrow Account', value: 'Escrow' },
            ],
        },
        { key: 'estimatedInitialDeposit', label: 'Estimated Initial Deposit', type: 'number', placeholder: 'Enter initial deposit amount', section: 'Bank Preferences', colSpan: 1 },
        { key: 'monthlyTransactionVolume', label: 'Expected Monthly Transaction Volume', type: 'textarea', placeholder: 'Approximate value and number of transactions', section: 'Bank Preferences' },
        {
            key: 'additionalFacilities', label: 'Additional Facilities Required', type: 'multiselect', section: 'Bank Preferences', colSpan: 1,
            options: [
                { label: 'Cheque Book', value: 'Cheque Book' },
                { label: 'Debit Card', value: 'Debit Card' },
                { label: 'Net Banking', value: 'Net Banking' },
                { label: 'UPI / Payment Gateway', value: 'UPI / Payment Gateway' },
                { label: 'OD / CC Limit', value: 'OD / CC Limit' },
            ],
        },
        {
            key: 'modeOfOperation', label: 'Mode of Operation', type: 'select', required: true, placeholder: 'Select mode', section: 'Bank Preferences', colSpan: 1,
            options: [
                { label: 'Singly', value: 'Singly' },
                { label: 'Jointly', value: 'Jointly' },
                { label: 'Either or Survivor', value: 'Either-or-Survivor' },
                { label: 'As per Board Resolution', value: 'Board Resolution' },
            ],
        },
// PART 2 — DIRECTORS & AUTHORISED SIGNATORIES

{
    key: 'directorsTable',
    title: 'Directors',
    type: 'repeatable-table',
    section: 'Directors',

    description:
        'List every current director. Mark (✓) in the last column if a valid DSC is available and registered on the MCA portal.',

    defaultRows: 4,

    columns: [
        {
            key: 'serialNumber',
            label: '#',
            type: 'serial',
            width: 60,
        },

        {
            key: 'directorName',
            label: 'Name of director',
            type: 'text',
            required: true,
            placeholder: 'Enter director name',
            minWidth: 160,
        },

        {
            key: 'din',
            label: 'DIN',
            type: 'text',
            required: true,
            placeholder: 'Enter DIN',
            maxLength: 8,
            allowNumbersOnly: true,
            validation: 'din',
            minWidth: 110,
        },

        {
            key: 'pan',
            label: 'PAN',
            type: 'text',
            required: true,
            placeholder: 'Enter PAN',
            convertToUppercase: true,
            maxLength: 10,
            validation: 'pan',
            minWidth: 120,
        },

        {
            key: 'mobileEmail',
            label: 'Mobile & email',
            type: 'textarea',
            required: true,
            placeholder: 'Enter mobile & email',
            minWidth: 180,
        },

        {
            key: 'dscAvailable',
            label: 'DSC?',
            type: 'checkbox',
        },
    ],
},
        // Authorised Signatory
        { key: 'authorizedSignatoryName', label: 'Authorized Signatory Name', type: 'text', required: true, placeholder: 'Enter signatory name', allowAlphabetsAndSpace: true, section: 'Authorised Signatory', colSpan: 1 },
        { key: 'authorizedSignatoryDinOrPan', label: 'DIN / PAN', type: 'text', required: true, placeholder: 'Enter DIN or PAN', convertToUppercase: true, validation: 'dinPan', section: 'Authorised Signatory', colSpan: 1 },
        { key: 'signatoryDesignation', label: 'Signatory Designation', type: 'text', required: true, placeholder: 'e.g. Director', prefillDefault: 'Director', allowAlphabetsAndSpace: true, section: 'Authorised Signatory', colSpan: 1 },
        { key: 'authorizedSignatoryMobile', label: 'Authorized Signatory Mobile', type: 'text', required: true, placeholder: 'Enter mobile number', maxLength: 10, allowNumbersOnly: true, validation: 'mobile', section: 'Authorised Signatory', colSpan: 1 },
        { key: 'authorizedSignatoryEmail', label: 'Authorized Signatory Email', type: 'email', required: true, placeholder: 'Enter email address', validation: 'email', section: 'Authorised Signatory', colSpan: 1 },
        { key: 'dscAvailable', label: 'DSC Available', type: 'checkbox', section: 'Authorised Signatory', colSpan: 1 },

        // Compliance Checkboxes
        { key: 'boardResolutionRequired', label: 'Board Resolution Required From Us', type: 'checkbox', section: 'Compliance', colSpan: 1 },
        { key: 'alreadyHasBoardResolution', label: 'Company Already Has Board Resolution', type: 'checkbox', section: 'Compliance', colSpan: 1 },
        { key: 'beneficialOwnershipDeclaration', label: 'Beneficial Ownership Declaration To Be Prepared By Us', type: 'checkbox', section: 'Compliance', colSpan: 1 },
        { key: 'kycEnclosed', label: 'KYC of All Signatories Enclosed', type: 'checkbox', section: 'Compliance', colSpan: 1 },
       
    ],

    docs: [
        {
            key: 'certificateOfIncorporation',
            label: 'Certificate of Incorporation (COI)',
            required: true,
        },
        {
            key: 'moaAoa',
            label: 'MOA & AOA',
            required: true,
        },
        {
            key: 'panCardOfCompany',
            label: 'Company PAN Card',
            required: true,
        },
        {
            key: 'boardResolution',
            label: 'Board Resolution',
            required: true,
        },
        {
            key: 'directorKyc',
            label: 'PAN / Aadhaar / Photos of Directors',
            required: true,
        },
        {
            key: 'addressProof',
            label: 'Registered Office Address Proof',
            required: true,
        },
        {
            key: 'latestDirectorShareholding',
            label: 'Latest List of Directors / Shareholding',
            required: true,
        },
        {
            key: 'specimenSignatures',
            label: 'Specimen Signatures of Signatories',
            required: true,
        },
    ],
},

    PT: {
        fields: [
            { key: 'state', label: 'State', type: 'select', optionsSource: 'indianStates', required: true, placeholder: 'Select state', colSpan: 1 },
            { key: 'employeeCount', label: 'Employee Count', type: 'number', required: true, placeholder: 'Enter employee count', allowNumbersOnly: true, colSpan: 1 },
            { key: 'salarySlab', label: 'Salary Slab', type: 'text', required: true, placeholder: 'e.g. ₹10,001 - ₹15,000', colSpan: 1 },
            { key: 'ptRegistrationNumber', label: 'PT Registration Number', type: 'text', placeholder: 'Enter PT registration number', colSpan: 1 },
            { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3 },
        ],
        docs: [
            { key: 'salaryRegister', label: 'Salary Register', required: true },
            { key: 'employeeList', label: 'Employee List', required: true },
        ],
    },

    AUDIT: {
        fields: [
            { key: 'auditorName', label: 'Auditor Name', type: 'text', required: true, placeholder: 'Enter auditor name', allowAlphabetsAndSpace: true, colSpan: 1 },
            { key: 'auditPeriod', label: 'Audit Period', type: 'text', required: true, placeholder: 'e.g. Apr 2024 - Mar 2025', colSpan: 1 },
            { key: 'financialYear', label: 'Financial Year', type: 'text', required: true, placeholder: 'e.g. 2024-25', colSpan: 1 },
            {
                key: 'auditType',
                label: 'Audit Type',
                type: 'select',
                required: true,
                placeholder: 'Select audit type',
                colSpan: 1,
                options: [
                    { label: 'Statutory Audit', value: 'Statutory Audit' },
                    { label: 'Tax Audit (44AB)', value: 'Tax Audit (44AB)' },
                    { label: 'Internal Audit', value: 'Internal Audit' },
                    { label: 'Concurrent Audit', value: 'Concurrent Audit' },
                ],
            },
            { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter any additional details', maxLength: 500, minRows: 3 },
        ],
        docs: [
            { key: 'financialStatements', label: 'Financial Statements', required: true },
            { key: 'auditReport', label: 'Audit Report', required: true },
            { key: 'ledgerReports', label: 'Ledger Reports' },
        ],
    },
};
