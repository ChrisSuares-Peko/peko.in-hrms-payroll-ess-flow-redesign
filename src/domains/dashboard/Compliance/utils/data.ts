import { paths } from '@src/routes/paths';

import iconManageDoc from '../assets/icons/icon-manage-doc.svg';
import iconOneTime from '../assets/icons/icon-one-time.svg';
import iconRecurring from '../assets/icons/icon-recurring.svg';
import type { ComplianceFormType, ComplianceItem } from '../types';
import type { ComplianceDocSubmission, DocSubmissionStatus } from '../types/docReupload';

export const COMPLIANCE_STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
    completed:  { bg: '#ecfdf3', color: '#027a48', label: 'Completed'  },
    pending:    { bg: '#fef2f2', color: '#ef4444', label: 'Pending'    },
    overdue:    { bg: '#fef2f2', color: '#ef4444', label: 'Pending'    },
    upcoming:   { bg: '#f9f4fd', color: '#6d71d5', label: 'Upcoming'   },
    processing: { bg: '#f9f4fd', color: '#6d71d5', label: 'Processing' },
    draft:      { bg: '#fef2f2', color: '#ef4444', label: 'Pending'    },
};

export const SUBMISSION_STATUS_CONFIG: Record<DocSubmissionStatus, { label: string; color: string; bg: string }> = {
    pending:       { label: 'Pending',       color: '#ef4444', bg: '#fef2f2' },
    due_soon:      { label: 'Due soon',      color: '#d97706', bg: '#fffbeb' },
    under_review:  { label: 'Under Review',  color: '#2563eb', bg: '#eff6ff' },
    approved:      { label: 'Completed',     color: '#027a48', bg: '#ecfdf3' },
    rejected:      { label: 'Rejected',      color: '#ef4444', bg: '#fef2f2' },
    reopened:      { label: 'Re-upload',     color: '#7c3aed', bg: '#f5f3ff' },
};

export const MY_COMPLIANCES_PAGE_SIZE = 10;

export const formatComplianceDate = (date: string | Date): string =>
    new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });


export const quickAccess = [
    {
        label: 'View one-time compliance',
        highlight: true,
        icon: iconOneTime,
        iconSize: 32,
        path: `${paths.dashboard.compliance}/${paths.compliance.health}?tab=one-time`,
    },
    {
        label: 'View recurring compliance',
        highlight: false,
        icon: iconRecurring,
        iconSize: 25,
        path: `${paths.dashboard.compliance}/${paths.compliance.health}?tab=recurring`,
    },
    {
        label: 'Manage document',
        highlight: false,
        icon: iconManageDoc,
        iconSize: 32,
        path: `${paths.dashboard.compliance}/${paths.compliance.documents}`,
    },
];

export type ComplianceCardType = 'pending' | 'recurring' | 'completed';
export type ComplianceStatusType = 'overdue' | 'upcoming' | 'completed' | 'processing';
export type ComplianceCategory = 'all' | 'one-time' | 'recurring';
export type ComplianceSection = 'tax-financial' | 'corporate-governance';

export interface ComplianceSectionMeta {
    key: ComplianceSection;
    label: string;
    iconType: 'percentage' | 'building' | 'briefcase';
}

export const complianceSections: ComplianceSectionMeta[] = [
    { key: 'tax-financial', label: 'Tax & Financial', iconType: 'percentage' },
    { key: 'corporate-governance', label: 'Corporate Governance', iconType: 'building' },
];

export interface ComplianceHealthItem {
    id: string;
    title: string;
    organization: string;
    description: string;
    due: string;
    daysLeft: string;
    cardType: ComplianceCardType;
    statusType: ComplianceStatusType;
    isHighPriority?: boolean;
    frequency?: string;
    penalty: string;
    category: ComplianceCategory;
    section: ComplianceSection;
    lastCompleted?: string;
    whatIsThis?: string;
    whyRequired?: string;
    complianceType?: ComplianceFormType;
    applicationId?: string;
    /** Only shown in the grouped one-time section view, not in the flat all/recurring list */
    sectionOnly?: boolean;
}

export const complianceHealthItems: ComplianceHealthItem[] = [
    {
        id: '1',
        title: 'PF Registration (EPFO)',
        organization: "Employees' Provident Fund Organisation",
        description: 'Register your company with EPFO if you have 20 or more employees',
        due: '28 Feb 2026',
        daysLeft: '44 days left',
        cardType: 'pending',
        statusType: 'overdue',
        isHighPriority: true,
        penalty: 'Penalty up to ₹1,00,000 and imprisonment up to 3 years',
        category: 'one-time',
        section: 'tax-financial',
        sectionOnly: true,
        complianceType: 'EPF_ESI_REGISTRATION',
        whatIsThis: 'PF Registration is mandatory for every establishment employing 20 or more persons. It requires registering with the Employees\' Provident Fund Organisation (EPFO) to provide social security benefits to employees, including provident fund, pension, and insurance.',
        whyRequired: 'Mandatory under the Employees\' Provident Funds & Miscellaneous Provisions Act, 1952 for all establishments with 20 or more employees. Ensures employees receive retirement, disability, and death benefits.',
    },
    {
        id: '2',
        title: 'ESI Registration',
        organization: 'Employees State Insurance Corporation',
        description: 'Register under ESI if you have 10+ employees earning less than ₹21,000/month',
        due: '28 Feb 2026',
        daysLeft: '44 days left',
        cardType: 'pending',
        statusType: 'overdue',
        penalty: '₹100 per day of delay',
        category: 'one-time',
        section: 'tax-financial',
        sectionOnly: true,
        complianceType: 'EPF_ESI_REGISTRATION',
    },
    {
        id: '3',
        title: 'ESI Registration',
        organization: 'Employees State Insurance Corporation',
        description: 'Register under ESI if you have 10+ employees earning less than ₹21,000/month',
        due: '28 Feb 2026',
        daysLeft: '44 days left',
        cardType: 'pending',
        statusType: 'overdue',
        penalty: '₹100 per day of delay',
        category: 'one-time',
        section: 'corporate-governance',
        sectionOnly: true,
        complianceType: 'EPF_ESI_REGISTRATION',
    },
    {
        id: '4',
        title: 'GST Registration',
        organization: 'GST Department',
        description: 'Register your company for Goods & Services Tax (GST) with the tax authorities',
        due: '30 Dec 2026',
        daysLeft: '45 days left',
        cardType: 'pending',
        statusType: 'overdue',
        isHighPriority: true,
        frequency: 'One-time',
        penalty: '₹10,000 or 10% of tax due, whichever is higher',
        category: 'one-time',
        section: 'tax-financial',
        complianceType: 'GST_REGISTRATION',
    },
    {
        id: '4b',
        title: 'GST Annual Return (GSTR-9)',
        organization: 'GST Department',
        description: 'Annual return consolidating all monthly/quarterly returns filed during the year',
        due: '30 Dec 2026',
        daysLeft: '45 days left',
        cardType: 'pending',
        statusType: 'overdue',
        isHighPriority: true,
        frequency: 'Annual',
        penalty: '₹100 per day of delay',
        category: 'recurring',
        section: 'tax-financial',
        lastCompleted: '28 May 2025',
        complianceType: 'GST_RETURN_FILING',
        applicationId: 'GSTR9-2026-10458',
    },
    {
        id: '5',
        title: 'Income Tax Return (ITR-6)',
        organization: 'Income Tax Department',
        description: 'Annual income tax return for companies',
        due: '30 Dec 2026',
        daysLeft: '3 days',
        cardType: 'pending',
        statusType: 'overdue',
        frequency: 'Annual',
        penalty: '₹100 per day of delay',
        category: 'recurring',
        section: 'tax-financial',
        lastCompleted: '28 May 2025',
        complianceType: 'AUDIT',
    },
    {
        id: '6',
        title: 'Income Tax Audit',
        organization: 'Income Tax Department',
        description: 'Tax audit under Section 44AB for businesses with turnover exceeding ₹1 Cr',
        due: '30 Dec 2026',
        daysLeft: '-12 days',
        cardType: 'recurring',
        statusType: 'overdue',
        isHighPriority: true,
        frequency: 'Annual',
        penalty: '₹100 per day of delay',
        category: 'recurring',
        section: 'tax-financial',
        lastCompleted: '28 May 2025',
        complianceType: 'AUDIT',
    },
    {
        id: '7',
        title: 'TDS Quarterly Return Filing',
        organization: 'Income Tax Department',
        description: 'Quarterly TDS return filing (Forms 24Q, 26Q, 27Q and 27EQ)',
        due: '30 Dec 2026',
        daysLeft: '321 days',
        cardType: 'recurring',
        statusType: 'processing',
        isHighPriority: true,
        frequency: 'Quarterly',
        penalty: '₹200 per day under Section 234E',
        category: 'recurring',
        section: 'tax-financial',
        lastCompleted: '28 May 2025',
        complianceType: 'TDS_RETURN_FILING',
    },
    {
        id: '8',
        title: 'AOC-4 & MGT-7 Annual Filing',
        organization: 'Ministry of Corporate Affairs',
        description: 'Filing of financial statements (AOC-4) and annual return (MGT-7 / MGT-7A) with ROC',
        due: '30 Dec 2026',
        daysLeft: '-2 days',
        cardType: 'pending',
        statusType: 'overdue',
        frequency: 'Annual',
        penalty: '₹100 per day of delay per form',
        category: 'recurring',
        section: 'corporate-governance',
        lastCompleted: '28 May 2025',
        complianceType: 'MCA_ANNUAL',
    },
    {
        id: '9',
        title: 'MGT-7 Annual Return',
        organization: 'Ministry of Corporate Affairs',
        description: 'Annual return to be filed with ROC within 60 days of AGM',
        due: '30 Dec 2026',
        daysLeft: '132 days left',
        cardType: 'pending',
        statusType: 'overdue',
        frequency: 'Annual',
        penalty: '₹100 per day of delay',
        category: 'recurring',
        section: 'corporate-governance',
        lastCompleted: '28 May 2025',
        complianceType: 'MCA_ANNUAL',
    },
    {
        id: '10',
        title: 'Opening Bank Account',
        organization: 'RBI & Bank',
        description: 'Open a current account under your company name for business transactions.',
        due: '28 Feb 2026',
        daysLeft: '45 days left',
        cardType: 'pending',
        statusType: 'processing',
        penalty: '',
        category: 'one-time',
        section: 'corporate-governance',
        sectionOnly: true,
        complianceType: 'BANK_ACCOUNT',
    },
    {
        id: '11',
        title: 'INC-20A - Commencement of Business',
        organization: 'Ministry of Corporate Affairs',
        description: 'Declaration of commencement of business to be filed within 180 days of incorporation',
        due: '30 Jun 2026',
        daysLeft: '45 days left',
        cardType: 'pending',
        statusType: 'overdue',
        isHighPriority: true,
        frequency: 'One-time',
        penalty: '₹50,000 penalty on company; ₹1,000/day on every officer in default',
        category: 'one-time',
        section: 'corporate-governance',
        complianceType: 'INC20A',
        whatIsThis: 'INC-20A is a declaration filed by the directors of a company with the Registrar of Companies confirming that every subscriber to the memorandum has paid the value of shares agreed to be taken by them. It must be filed within 180 days of the date of incorporation.',
        whyRequired: 'Mandatory under Section 10A of the Companies Act, 2013. A company cannot commence business or exercise borrowing powers until this declaration is filed.',
    },
    {
        id: '12',
        title: 'Professional Tax (PT) Return',
        organization: 'State Tax Department',
        description: 'Monthly/annual professional tax deduction and payment for employees',
        due: '30 Jun 2026',
        daysLeft: '45 days left',
        cardType: 'pending',
        statusType: 'overdue',
        frequency: 'Monthly',
        penalty: '₹300 per month of delay',
        category: 'recurring',
        section: 'tax-financial',
        complianceType: 'PT',
        whatIsThis: 'Professional Tax is a state-level tax levied on individuals earning income through employment or practice of a profession. Employers are required to deduct professional tax from employees\' salaries and remit it to the state government.',
        whyRequired: 'Mandatory under state-specific Professional Tax Acts. Applicable in states like Maharashtra, Karnataka, West Bengal, and others. Non-compliance attracts penalties and interest.',
    },
];

export const MOCK_SUBMISSIONS: Record<string, ComplianceDocSubmission> = {
    '1': {
        submissionStatus: null,
        rejectionReason: 'Please upload an updated Certificate of Incorporation',
        lastUploadedFileName: 'pf_registration_draft.pdf',
        submittedDate: 'Jan 20, 2026',
        history: [
            { status: 'pending', timestamp: '20 Jan 2026, 10:00 AM', fileName: 'pf_registration_draft.pdf' },
        ],
    },
    '4': {
        submissionStatus: 'approved',
        lastUploadedFileName: 'gstr9_annual_return.pdf',
        submittedDate: 'Jan 10, 2026',
        history: [
            { status: 'pending',      timestamp: '10 Jan 2026, 09:00 AM', fileName: 'gstr9_annual_return.pdf' },
            { status: 'under_review', timestamp: '11 Jan 2026, 03:45 PM' },
            { status: 'approved',     timestamp: '12 Jan 2026, 10:00 AM' },
        ],
    },
    '5': {
        submissionStatus: 'due_soon',
        lastUploadedFileName: 'itr6_return.pdf',
        submittedDate: 'Feb 2, 2026',
        history: [
            { status: 'pending', timestamp: '2 Feb 2026, 10:00 AM', fileName: 'itr6_return.pdf' },
        ],
    },
    '6': {
        submissionStatus: 'rejected',
        rejectionReason: 'The submitted audit report is missing the auditor\'s signature. Please upload a corrected copy.',
        lastUploadedFileName: 'income_tax_audit.pdf',
        submittedDate: 'Jan 5, 2026',
        history: [
            { status: 'pending',      timestamp: '5 Jan 2026, 11:00 AM', fileName: 'income_tax_audit.pdf' },
            { status: 'under_review', timestamp: '6 Jan 2026, 01:00 PM' },
            { status: 'rejected',     timestamp: '7 Jan 2026, 10:00 AM', remarks: 'The submitted audit report is missing the auditor\'s signature.' },
        ],
    },
    '7': {
        submissionStatus: 'approved',
        lastUploadedFileName: 'tds_monthly_deposit.pdf',
        submittedDate: 'Dec 5, 2025',
        history: [
            { status: 'pending',      timestamp: '5 Dec 2025, 11:00 AM', fileName: 'tds_deposit_dec.pdf' },
            { status: 'under_review', timestamp: '6 Dec 2025, 01:00 PM' },
            { status: 'approved',     timestamp: '10 Dec 2025, 11:00 AM' },
        ],
    },
    '8': {
        submissionStatus: null,
        rejectionReason: 'Please upload the AOC-4 filing document to proceed with processing.',
        lastUploadedFileName: 'aoc4_filing_draft.pdf',
        submittedDate: 'Mar 2, 2026',
        history: [
            { status: 'pending', timestamp: '2 Mar 2026, 09:00 AM', fileName: 'aoc4_filing_draft.pdf' },
        ],
    },
};

export type MyComplianceRow = ComplianceHealthItem & {
    apiRecord?: ComplianceItem;
    isDraft?: boolean;
};

