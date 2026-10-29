import { paths } from '@src/routes/paths';

import activePurchaseOrders from '../assets/icons/activePurchaseOrder.svg';
import invoicing from '../assets/icons/invoicing.svg';
import openRFQs from '../assets/icons/openRFQs.svg';
import proposals from '../assets/icons/proposals.svg';
import purchaseOrders from '../assets/icons/purchaseOrders.svg';
import purchaseRequest from '../assets/icons/purchaseRequest.svg';
import recentActivityIcon from '../assets/icons/recentActivityIcon.svg';
import recentActivitySendTo  from '../assets/icons/recentActivitySendTo.svg';
import requestForQuoteIcon from '../assets/icons/requestForQuoteIcon.svg';
import unpaidInvoice from '../assets/icons/unpaidInvoice.svg';
import vendor from '../assets/icons/vendor.svg';

export const UPLOAD_PROPOSAL_STEP_LABELS = ['Select RFQ', 'Select Vendor', 'Enter Details'];

export const VENDOR_TIPS = [
    "Use the exact name as registered on the vendor's GST certificate.",
    'GSTIN: 15-character format (e.g. 27ABCDE1234F1Z5).',
    'IFSC: 11-character code (e.g. HDFC0001234).',
];

export const VENDOR_STEPS = [
    'Vendor is added to your directory.',
    'Select them when creating RFQs or POs.',
    'Bank details are required to make invoice payments.',
];

export const INVOICE_ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const recentActivityItems = [
    { id: 1, text: 'Invoice EMT-INR-2603-014 received for PO-2026-002 and queued for review', date: '6 Mar 2026', color: '#ff7a45', icon: recentActivityIcon },
    { id: 2, text: 'PO-2026-002 sent to Emitac Digital Solutions for signing', date: '5 Mar 2026', color: '#52c41a', icon: recentActivitySendTo },
    { id: 3, text: 'New proposal received from Triton IT for Network Infrastructure RFQ', date: '6 Mar 2026', color: '#722ed1', icon: recentActivitySendTo },
    { id: 4, text: 'Draft PO-2026-006 created for Triton IT – Cybersecurity Audit', date: '6 Mar 2026', color: '#ffa940', icon: recentActivityIcon },
    { id: 5, text: 'New proposal received from Emitac for Network Infrastructure RFQ', date: '6 Mar 2026', color: '#ff7a45', icon: recentActivityIcon },
    { id: 6, text: 'New proposal received from Emitac for Network Infrastructure RFQ', date: '6 Mar 2026', color: '#52c41a', icon: recentActivityIcon },
    { id: 7, text: 'New proposal received from Emitac for Network Infrastructure RFQ', date: '6 Mar 2026', color: '#ffa940', icon: recentActivityIcon },
];

const base = paths.dashboard.procure;

export const browseItems = [
    { label: 'Purchase Requests', path: `${base}/${paths.procure.purchaseRequests.index}`, icon: purchaseRequest },
    { label: 'Requests for Quotes', path: `${base}/${paths.procure.rfq.index}`, icon: requestForQuoteIcon },
    { label: 'Proposals', path: `${base}/${paths.procure.proposals.index}`, icon: proposals },
    { label: 'Purchase Orders', path: `${base}/${paths.procure.purchaseOrders.index}`, icon: purchaseOrders },
    { label: 'Invoicing', path: `${base}/${paths.procure.invoicing.index}`, icon: invoicing },
    { label: 'Vendor Directory', path: `${base}/${paths.procure.vendor.index}`, icon: vendor },
];

export type PurchaseRequestStatus = 'Converted to RFQ' | 'Converted to PO' | 'Open';

export const purchaseRequestsData = [
    { id: 1, date: 'Jan 9, 2026',  ref: 'PR-2026-001', requestedBy: 'Ahmed Al Mansouri', initials: 'AA', department: 'IT',         category: 'IT',        budget: '₹ 185,000', needBy: '31 Mar 2026', status: 'Converted to RFQ' as PurchaseRequestStatus, description: 'Network infrastructure upgrade for floors 11–13 including switches, routers, and cabling.', notes: 'Must follow updated brand guidelines v3.1.' },
    { id: 2, date: 'Jan 9, 2026',  ref: 'PR-2026-002', requestedBy: 'Noura Al Ketbi',    initials: 'NK', department: 'Marketing',  category: 'Marketing', budget: '₹ 185,000', needBy: '31 Mar 2026', status: 'Converted to PO'  as PurchaseRequestStatus, description: 'Marketing collateral for Q1 campaign including banners, brochures, and digital assets.', notes: '' },
    { id: 3, date: 'Jan 9, 2026',  ref: 'PR-2026-003', requestedBy: 'Priya Nair',        initials: 'PN', department: 'Finance',    category: 'Finance',   budget: '₹ 185,000', needBy: '31 Mar 2026', status: 'Open'             as PurchaseRequestStatus, description: 'Financial software license renewal for 25 users for the upcoming fiscal year.', notes: '' },
   
];

export type RFQType = 'RFQ' | 'RFI' | 'RFP';
export type RFQStatus = 'Active' | 'Open' | 'Closed';
export type ProposalStatus = 'Accepted' | 'Rejected' | 'Under review' | 'Shortlisted';

export interface Proposal {
    id: string;
    vendorName: string;
    submittedDate: string;
    channel: string;
    amount: string;
    status: ProposalStatus;
}

export const rfqData = [
    {
        id: 1, date: 'Jan 9, 2026', ref: 'RFQ-2026-001', title: 'Annual Software License Renewal 2026',
        type: 'RFQ' as RFQType, vendors: 1, deadline: '31 Mar 2026', proposalCount: 0, status: 'Active' as RFQStatus,
        type_label: 'RFP', created: '28 Feb 2026', requestedBy: 'Omar Al Hashimi',
        notes: 'Certified Adobe and Microsoft partner in UAE. 2-year support agreement included.',
        termsAndConditions: 'Vendor must hold SIRA license in Dubai. All guards must have valid UAE security license. Monthly invoicing.',
        attachments: [{ name: 'Tax Residency Certificate', url: '#' }],
        lineItems: [
            { key: '1', description: 'Security guard (24/7, 2 guards per shift)', qty: 6, unit: 'Guard/month', unitCost: '₹17,280', total: '₹17,280' },
            { key: '2', description: 'Security guard (24/7, 2 guards per shift)', qty: 6, unit: 'Guard/month', unitCost: '₹17,280', total: '₹17,280' },
        ],
        invitedVendors: [
            { name: 'Emitac Digital Solutions', email: 'rami.khalil@emitac.ae', status: 'Submitted' },
            { name: 'Arabian Computer Maintenance', email: 'faris@acm-uae.ae', status: 'Pending' },
        ],
        proposals: [
            { id: 'p1', vendorName: 'Emitac Digital Solutions', submittedDate: '6 Mar 2026', channel: 'Online', amount: '₹17,200', status: 'Accepted'     as ProposalStatus },
            { id: 'p2', vendorName: 'Emitac Digital Solutions', submittedDate: '6 Mar 2026', channel: 'Online', amount: '₹17,200', status: 'Rejected'     as ProposalStatus },
            { id: 'p3', vendorName: 'Emitac Digital Solutions', submittedDate: '6 Mar 2026', channel: 'Online', amount: '₹17,200', status: 'Under review'  as ProposalStatus },
            { id: 'p4', vendorName: 'Emitac Digital Solutions', submittedDate: '6 Mar 2026', channel: 'Online', amount: '₹17,200', status: 'Shortlisted'  as ProposalStatus },
        ],
    },
    {
        id: 2, date: 'Jan 9, 2026', ref: 'RFQ-2026-002', title: 'Annual Software License Renewal 2026',
        type: 'RFI' as RFQType, vendors: 3, deadline: '9d left', proposalCount: 4, status: 'Active' as RFQStatus,
        type_label: 'RFI', created: '10 Jan 2026', requestedBy: 'Noura Al Ketbi',
        notes: 'Certified Adobe and Microsoft partner in UAE. 2-year support agreement included.', termsAndConditions: 'Standard procurement terms apply.',
        attachments: [],
        lineItems: [
            { key: '1', description: 'Software license (25 users)', qty: 25, unit: 'License/year', unitCost: '₹ 500', total: '₹ 12,500' },
        ],
        invitedVendors: [
            { name: 'Triton IT Solutions', email: 'procurement@triton-it.ae', status: 'Submitted' },
            { name: 'Emitac Digital Solutions', email: 'rfq@emitac.ae', status: 'Pending' },
            { name: 'Al Futtaim Logistics LLC', email: 'tariq@alfuttaim-logistics.ae', status: 'Pending' },
        ],
        proposals: [
            { id: 'p1', vendorName: 'Triton IT Solutions', submittedDate: '5 Mar 2026', channel: 'Online', amount: '₹12,500', status: 'Under review' as ProposalStatus },
            { id: 'p2', vendorName: 'Emitac Digital Solutions', submittedDate: '6 Mar 2026', channel: 'Online', amount: '₹11,200', status: 'Shortlisted' as ProposalStatus },
        ],
    },
    {
        id: 3, date: 'Jan 9, 2026', ref: 'RFQ-2026-003', title: 'Annual Software License Renewal 2026',
        type: 'RFP' as RFQType, vendors: 2, deadline: '9d left', proposalCount: 3, status: 'Open' as RFQStatus,
        type_label: 'RFP', created: '15 Jan 2026', requestedBy: 'Priya Nair',
        notes: '', termsAndConditions: 'Vendor must be ISO 27001 certified.',
        attachments: [],
        lineItems: [
            { key: '1', description: 'Cybersecurity audit', qty: 1, unit: 'Service', unitCost: '₹ 22,000', total: '₹ 22,000' },
        ],
        invitedVendors: [
            { name: 'Triton IT Solutions', email: 'procurement@triton-it.ae', status: 'Submitted' },
            { name: 'Arabian Computer Maintenance', email: 'faris@acm-uae.ae', status: 'Pending' },
        ],
        proposals: [
            { id: 'p1', vendorName: 'Triton IT Solutions', submittedDate: '4 Mar 2026', channel: 'Online', amount: '₹22,000', status: 'Accepted' as ProposalStatus },
            { id: 'p2', vendorName: 'Arabian Computer Maintenance', submittedDate: '5 Mar 2026', channel: 'Online', amount: '₹19,500', status: 'Rejected' as ProposalStatus },
        ],
    },
];

export type POStatus = 'Draft' | 'Sent' | 'Acknowledged' | 'In Progress' | 'Completed' | 'Cancelled' | 'Delivered';

const PO_STATUS_DISPLAY_MAP: Record<string, string> = {
    'Sent':                  'PO Issued',
    'Acknowledged':          'PO Issued',
    'Acknowledged & Signed': 'PO Issued',
    'In Progress':           'PO Issued',
    'Delivered':             'PO Issued',
    'Completed':             'Closed',
};

export const normalizePOStatus = (s: string): string => PO_STATUS_DISPLAY_MAP[s] ?? s;
export type ESignStatus = 'Completed' | 'Partially Signed' | 'Pending' | 'Not Required' | 'Not Initiated' | 'Initiated' | 'Signed by Vendor' | 'Signed by Buyer';

export const PO_STATUS_ACTION: Record<string, { label: string; nextStatus: string; color: string; bg?: string }> = {
    'Draft':     { label: 'Issue PO to vendor', nextStatus: 'send',  color: '#FF4F4F', bg: '#FFF5F5' },
    'PO Issued': { label: 'Close PO',           nextStatus: 'close', color: '#FF4F4F', bg: undefined },
    'Closed':    { label: 'Re-open PO',          nextStatus: 'send',  color: '#FF4F4F', bg: undefined },
};

export const PO_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
    'Draft':     { color: '#535353', bg: '#f2f2f2' },
    'PO Issued': { color: '#2c46f0', bg: '#ecf1fd' },
    'Closed':    { color: '#03a254', bg: '#ecfdf5' },
    'Cancelled': { color: '#d4380d', bg: '#fff2e8' },
};

export const PO_CANCELLABLE_STATUSES = ['Draft', 'Sent', 'Acknowledged', 'In Progress'];

export const purchaseOrdersData = [
    { id: 1, ref: 'PO-2026-001', vendor: 'Emitac Digital Solutions', total: '₹17,200', created: '30 Apr 2026', status: 'Acknowledged' as POStatus, eSign: 'Completed' as ESignStatus },
    { id: 2, ref: 'PO-2026-001', vendor: 'Emitac Digital Solutions', total: '₹17,200', created: '30 Apr 2026', status: 'Sent'                   as POStatus, eSign: 'Partially Signed'  as ESignStatus },
    { id: 3, ref: 'PO-2026-001', vendor: 'Emitac Digital Solutions', total: '₹17,200', created: '30 Apr 2026', status: 'In Progress'             as POStatus, eSign: 'Completed'         as ESignStatus },
];

export type InvoiceStatus  = 'Paid' | 'Pending' | 'Overdue' | 'Disputed';
export type PaymentStatus  = 'Completed' | 'Pending' | 'Failed' | 'Partially Paid';

export const invoicingData = [
    { id: 1, invoiceRef: '2026-001', vendor: 'Emitac Digital Solutions', poRef: 'PO-2026-001', invoiceDate: '30 Apr 2026', amount: '₹17,200', invoiceStatus: 'Paid'    as InvoiceStatus, paymentStatus: 'Completed'     as PaymentStatus },
    { id: 2, invoiceRef: '2026-001', vendor: 'Emitac Digital Solutions', poRef: 'PO-2026-001', invoiceDate: '30 Apr 2026', amount: '₹17,200', invoiceStatus: 'Pending' as InvoiceStatus, paymentStatus: 'Pending'        as PaymentStatus },
    { id: 3, invoiceRef: '2026-001', vendor: 'Emitac Digital Solutions', poRef: 'PO-2026-001', invoiceDate: '30 Apr 2026', amount: '₹17,200', invoiceStatus: 'Overdue' as InvoiceStatus, paymentStatus: 'Partially Paid' as PaymentStatus },
];

export type VendorStatus = 'Active' | 'Inactive' | 'Blacklisted';

export const vendorData = [
    { id: 1, vendor: 'Emitac Digital Solutions', code: 'TL-DXB-2019-004224', status: 'Active' as VendorStatus, categories: ['Logistics', 'Facilities'], totalSpends: '₹17,200', pos: 17, lastActivity: '24 March 2025' },
    { id: 2, vendor: 'Emitac Digital Solutions', code: 'TL-DXB-2019-004224', status: 'Active' as VendorStatus, categories: ['Logistics', 'Facilities'], totalSpends: '₹17,200', pos: 19, lastActivity: '24 March 2025' },
    { id: 3, vendor: 'Emitac Digital Solutions', code: 'TL-DXB-2019-004224', status: 'Active' as VendorStatus, categories: ['Logistics', 'Facilities'], totalSpends: '₹17,200', pos: 15, lastActivity: '24 March 2025' },
];

export const CATEGORY_OPTIONS = [
    { label: 'IT & Software', value: 'IT & Software' },
    { label: 'Professional Services', value: 'Professional Services' },
    { label: 'Facilities & Maintenance', value: 'Facilities & Maintenance' },
    { label: 'Office Supplies', value: 'Office Supplies' },
    { label: 'Marketing & Events', value: 'Marketing & Events' },
    { label: 'Logistics & Transport', value: 'Logistics & Transport' },
    { label: 'Travel & Accommodation', value: 'Travel & Accommodation' },
    { label: 'HR & Recruitment', value: 'HR & Recruitment' },
    { label: 'Finance & Insurance', value: 'Finance & Insurance' },
    { label: 'Utilities & Telecoms', value: 'Utilities & Telecoms' },
    { label: 'Construction & Engineering', value: 'Construction & Engineering' },
    { label: 'Healthcare & Wellbeing', value: 'Healthcare & Wellbeing' },
    { label: 'Other', value: 'Other' },
];

export const UNIT_OPTIONS = [
    { value: 'Unit', label: 'Unit' },
    { value: 'Each', label: 'Each' },
    { value: 'Box', label: 'Box' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Litre', label: 'Litre' },
    { value: 'Hour', label: 'Hour' },
];

export const PAYMENT_TERMS = [
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 60', label: 'Net 60' },
    { value: 'Net 90', label: 'Net 90' },
    { value: 'Immediate', label: 'Immediate' },
];

export const VENDOR_TAG_OPTIONS = ['IT & Software', 'Professional Services', 'Facilities & Maintenance', 'Office Supplies', 'Marketing & Events', 'Logistics & Transport', 'Travel & Accommodation', 'HR & Recruitment', 'Finance & Insurance', 'Utilities & Telecoms', 'Construction & Engineering', 'Healthcare & Wellbeing', 'Other'];

export const VENDOR_STATUS_OPTIONS = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
];

export const CURRENCY_OPTIONS = [
    { value: 'INR', label: 'INR' },
];

export const PO_TIPS = [
    'Link to a Purchase Request for a complete audit trail.',
    'Verify all details in PO before creating them.',
    'Bank details from the vendor directory will be used for payout.',
];

export const PO_STEPS = [
    'PO is saved as Draft — review before sending.',
    'Issue PO to vendor.',
    'Vendor acknowledges by uploading invoice and shares bank details.',
];

export const statCards = [
    { label: 'Active Purchase Orders', value: 12, trend: '↑ 2 vs last month', bg: '#FDF6F0', trendColor: '#05be63', icon: activePurchaseOrders },
    { label: 'Unpaid Invoices', value: 12, trend: '₹ 41K Unpaid', bg: '#ECF0FC', trendColor: '#05be63', icon: unpaidInvoice },
    { label: 'Open RFQs', value: 12, trend: '↑ 2 vs last month', bg: '#F6EBEF', trendColor: '#05be63', icon: openRFQs },
    { label: 'Committed Spend', value: '₹17,200', trend: '↑ 2 vs last month', bg: '#EBF6F1', trendColor: '#05be63', icon: openRFQs },
];


export const TIPS = [
    'Be specific about what you need - it helps when comparing vendor quotes.',
    'Attach any pre-approval email or reference document.',
    'The budget is an estimate - vendors will provide actual quotes via RFQ.',
];

export const STEPS = [
    'Request is logged and visible to procurement.',
    'Convert to an RFQ to collect vendor quotes.',
    'Accept the best proposal to auto-generate a Purchase Order.',
];