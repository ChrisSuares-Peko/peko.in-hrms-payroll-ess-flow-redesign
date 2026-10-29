import {
    AmendmentRow,
    B2BRow,
    B2CRow,
    Business,
    DocumentRow,
    Gstr1MonthStatus,
    GstrMonth,
    GstTool,
    GstWorkflowStep,
    HsnRow,
    ImsHistoryEntry,
    ImsSupplier,
    MonthData,
    ReviewSummaryRow,
    SalesInvoice,
    SaveSummaryRow,
    SoftwareOption,
    TaxService,
    UpcomingDeadline,
} from '../types';

export const DUMMY_BUSINESSES: Business[] = [
    {
        id: '1',
        name: 'Peko Tech Pvt Ltd',
        gstin: '27ABCDE1234G1ZV',
        status: 'Active',
        location: 'Mumbai, India',
        regDate: '12/03/2015',
        type: 'Private Limited Company',
    },
    {
        id: '2',
        name: 'Peko Tech Delhi',
        gstin: '07ABCDE1234G1ZV',
        status: 'Active',
        location: 'Delhi, India',
        regDate: '18/05/1998',
        type: 'Private Limited Company',
    },
    {
        id: '3',
        name: 'Peko Tech Bangalore',
        gstin: '29ABCDE1234G1ZV',
        status: 'Active',
        location: 'Bengaluru, India',
        regDate: '04/09/2010',
        type: 'Limited Liability Partnership',
    },
];

const _fyStart = (() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
})();
export const FINANCIAL_YEARS: string[] = [
    `${_fyStart}-${String(_fyStart + 1).slice(2)}`,
    `${_fyStart - 1}-${String(_fyStart).slice(2)}`,
];

export const GST_WORKFLOW_STEPS: GstWorkflowStep[] = [
    {
        step: 1,
        title: 'Upload Sales Invoices',
        description:
            'Import all sales bills you raised this month from Tally, Zoho Books, Vyapar, Busy or Marg. Peko checks for missing fields.',
        badge: 'Next',
    },
    {
        step: 2,
        title: 'File GSTR-1',
        description:
            'Tell the government about every sale — B2B invoices, B2C sales, exports, credit/debit notes. Your buyers can see these in their GSTR-2A.',
        badge: 'Locked',
        dueDate: 'Due 11 Dec 2024',
    },
    {
        step: 3,
        title: 'Review IMS',
        description:
            'Check bills your suppliers filed in your name. Accept the correct ones (they become eligible ITC), reject wrong ones, ignore the rest.',
        badge: 'Overdue',
        dueDate: 'Due 14 Dec 2024',
    },
    {
        step: 4,
        title: 'Reconcile GSTR-2B',
        description:
            'The GST portal sends you a static statement of your tax credit on the 14th. Verify it matches your purchase records before filing GSTR-3B.',
        badge: 'Overdue',
        dueDate: 'Due 14 Dec 2024',
    },
    {
        step: 5,
        title: 'File GSTR-3B',
        description:
            'Pay your monthly GST. Use your ITC credit (from GSTR-2B) to offset your tax liability and pay the balance in cash.',
        badge: 'Locked',
        dueDate: 'Due 14 Dec 2024',
    },
    {
        step: 6,
        title: 'Check Ledger',
        description:
            'Confirm your ITC and cash ledger balances on the GST portal are correct after your payment goes through.',
        badge: 'Locked',
    },
];

export const UPCOMING_DEADLINES: UpcomingDeadline[] = [
    {
        id: '1',
        day: '11',
        month: 'DEC',
        title: 'GSTR-1',
        status: 'Overdue 492d',
        period: 'Nov 2024',
    },
    {
        id: '2',
        day: '11',
        month: 'DEC',
        title: 'IMS Review',
        status: 'Overdue 492d',
        period: 'Nov 2024',
    },
    {
        id: '3',
        day: '11',
        month: 'DEC',
        title: 'GSTR-3B',
        status: 'Overdue 492d',
        period: 'Nov 2024',
    },
    {
        id: '4',
        day: '11',
        month: 'DEC',
        title: 'GSTR-9 Annual',
        status: 'Overdue 492d',
        period: 'Nov 2024',
    },
];

export const GST_TOOLS: GstTool[] = [
    {
        id: 'invoice',
        title: 'Invoice Management',
        description: 'Review bills your suppliers sent you — accept or reject each one',
    },
    {
        id: 'purchases',
        title: 'Purchases',
        description: 'Match what your suppliers filed vs. what you recorded in your books',
    },
    {
        id: 'ledger',
        title: 'Ledger',
        description: 'See how much tax credit you have available to use',
    },
    {
        id: 'annual',
        title: 'Annual Return (GSTR-9)',
        description: 'Once a year — summarise all your GST activity for the full financial year',
    },
    {
        id: 'verify',
        title: 'Verify GSTIN',
        description: "Check if a supplier's GST number is real and active before paying them",
    },
    // {
    //     id: 'compliance',
    //     title: 'Supplier Compliance',
    //     description: 'Get alerted if any of your suppliers stop filing their returns on time',
    // },
    {
        id: 'filings',
        title: 'Past Filings',
        description: 'View receipts and details of every return you have filed so far',
    },
];

export const TAX_SERVICES: TaxService[] = [
    {
        id: 'gst',
        title: 'GST Filing',
        description:
            'End-to-end GST compliance — File GSTR-1, 3B, 9, manage ITC and reconcile purchases.',
        features: [
            'GSTR-1, 3B & 9 filing',
            'Auto GSTR-2A reconciliation',
            'Cash & ITC ledger',
            'GSTIN verification',
        ],
        ctaLabel: 'Open GST Filing',
        available: true,
    },
    {
        id: 'tds',
        title: 'TDS Filing',
        description:
            'Complete TDS compliance — File 24Q, 26Q returns, generate Form 16 and reconcile 26AS.',
        features: [
            '24Q, 26Q & 27Q returns',
            'Form 16 / 16A generation',
            'OLTAS challan payment',
            '26AS reconciliation',
        ],
        ctaLabel: 'Open TDS Filing',
        available: false,
    },
];

export const FY_MONTHS: MonthData[] = [
    { key: 'APR-2024', label: 'APR', year: '2024', count: 12, status: 'missing' },
    { key: 'MAY-2024', label: 'MAY', year: '2024', count: 10, status: 'missing' },
    { key: 'JUN-2024', label: 'JUN', year: '2024', count: 14, status: 'missing' },
    { key: 'JUL-2024', label: 'JUL', year: '2024', count: 9, status: 'missing' },
    { key: 'AUG-2024', label: 'AUG', year: '2024', count: 11, status: 'missing' },
    { key: 'SEP-2024', label: 'SEP', year: '2024', count: 8, status: 'missing' },
    { key: 'OCT-2024', label: 'OCT', year: '2024', count: 10, status: 'missing' },
    { key: 'NOV-2024', label: 'NOV', year: '2024', count: 0, status: 'not_started' },
    { key: 'DEC-2024', label: 'DEC', year: '2024', count: 0, status: 'not_started' },
    { key: 'JAN-2025', label: 'JAN', year: '2025', count: 0, status: 'not_started' },
    { key: 'FEB-2025', label: 'FEB', year: '2025', count: 0, status: 'not_started' },
    { key: 'MAR-2025', label: 'MAR', year: '2025', count: 0, status: 'not_started' },
];

const inv = (id: string, invoiceNo: string, status: 'okay' | 'fix'): SalesInvoice => ({
    id,
    invoiceNo,
    date: '20/03/2026',
    partyName: 'SEZ Enterprise Ltd',
    gstin: '11261000401400013',
    hsnSac: '998313',
    placeOfSupply: 'Maharashtra',
    taxable: 17200,
    cgst: 17200,
    sgst: 17200,
    igst: 17200,
    total: 17200,
    status,
});

export const DUMMY_INVOICES: Record<string, SalesInvoice[]> = {
    'OCT-2024': [
        inv('1', 'INVC-001', 'okay'),
        inv('2', 'INVC-002', 'fix'),
        inv('3', 'INVC-003', 'okay'),
        inv('4', 'INVC-004', 'fix'),
        inv('5', 'INVC-005', 'okay'),
        inv('6', 'INVC-006', 'okay'),
        inv('7', 'INVC-007', 'fix'),
        inv('8', 'INVC-008', 'okay'),
        inv('9', 'INVC-009', 'okay'),
        inv('10', 'INVC-010', 'fix'),
    ],
};

export const SOFTWARE_OPTIONS: SoftwareOption[] = [
    {
        id: 'tally',
        initial: 'T',
        name: 'TallyPrime',
        description: 'Used by 70%+ of Indian businesses',
        color: '#16a34a',
    },
    {
        id: 'zoho',
        initial: 'Z',
        name: 'Zoho Books',
        description: 'Cloud-based, popular with tech businesses',
        color: '#2563eb',
    },
    {
        id: 'busy',
        initial: 'B',
        name: 'Busy Accounting',
        description: '600,000+ businesses, strong inventory',
        color: '#1e40af',
    },
    {
        id: 'marg',
        initial: 'M',
        name: 'MARG ERP 9+',
        description: 'Popular among Indian distributors & retailers',
        color: '#e65c00',
    },
];

// ─── GSTR-1 Filing ───────────────────────────────────────────────────────────

export const GSTR1_FY_MONTHS: GstrMonth[] = [
    { key: 'APR-2024', label: 'Apr', year: '2024', status: 'filed' },
    { key: 'MAY-2024', label: 'May', year: '2024', status: 'filed' },
    { key: 'JUN-2024', label: 'Jun', year: '2024', status: 'filed' },
    { key: 'JUL-2024', label: 'Jul', year: '2024', status: 'filed' },
    { key: 'AUG-2024', label: 'Aug', year: '2024', status: 'filed' },
    { key: 'SEP-2024', label: 'Sep', year: '2024', status: 'filed' },
    { key: 'OCT-2024', label: 'Oct', year: '2024', status: 'not_started' },
    { key: 'NOV-2024', label: 'Nov', year: '2024', status: 'not_started' },
    { key: 'DEC-2024', label: 'Dec', year: '2024', status: 'not_started' },
    { key: 'JAN-2025', label: 'Jan', year: '2025', status: 'not_started' },
    { key: 'FEB-2025', label: 'Feb', year: '2025', status: 'not_started' },
    { key: 'MAR-2025', label: 'Mar', year: '2025', status: 'not_started' },
];

const b2b = (id: string, invoiceNo: string): B2BRow => ({
    id,
    invoiceNo,
    receiverGstin: '11261004014001',
    name: 'SEZ Enterprise Ltd',
    date: '20/03/2026',
    taxable: 17200,
    rate: 18,
    igst: 17200,
    cgst: 17200,
    sgst: 17200,
    pos: 21,
    rc: 'N',
});

export const DUMMY_B2B_ROWS: B2BRow[] = [
    b2b('1', 'INV-001'),
    b2b('2', 'INV-002'),
    b2b('3', 'INV-003'),
    b2b('4', 'INV-004'),
];

const b2c = (id: string, invoiceNo: string): B2CRow => ({
    id,
    invoiceNo,
    date: '20/03/2026',
    pos: 21,
    taxable: 17200,
    rate: 18,
    igst: 17200,
});

export const DUMMY_B2C_ROWS: Record<string, B2CRow[]> = {
    'b2c-large': [b2c('1', 'INV-001'), b2c('2', 'INV-002'), b2c('3', 'INV-003')],
    'b2c-small': [b2c('4', 'INV-004'), b2c('5', 'INV-005'), b2c('6', 'INV-006')],
    exports: [b2c('7', 'INV-007'), b2c('8', 'INV-008'), b2c('9', 'INV-009')],
    cdnr: [b2c('10', 'INV-010'), b2c('11', 'INV-011'), b2c('12', 'INV-012')],
    cdnur: [b2c('13', 'INV-013'), b2c('14', 'INV-014'), b2c('15', 'INV-015')],
    'nil-exempt': [b2c('16', 'INV-016'), b2c('17', 'INV-017'), b2c('18', 'INV-018')],
    advances: [b2c('19', 'INV-019'), b2c('20', 'INV-020'), b2c('21', 'INV-021')],
};

export const DUMMY_HSN_ROWS: HsnRow[] = [
    {
        id: '1',
        hsnCode: 'INV-001',
        description: 'Automatic data processing machines',
        uqc: 'PCS',
        qty: 12,
        taxable: 17200,
        rate: 18,
        igst: 17200,
        cgst: 17200,
        sgst: 17200,
    },
    {
        id: '2',
        hsnCode: 'INV-002',
        description: 'Telephone sets & parts',
        uqc: 'PCS',
        qty: 6,
        taxable: 17200,
        rate: 18,
        igst: 17200,
        cgst: 17200,
        sgst: 17200,
    },
    {
        id: '3',
        hsnCode: 'INV-003',
        description: 'IT & software services',
        uqc: 'NOS',
        qty: 7,
        taxable: 17200,
        rate: 18,
        igst: 17200,
        cgst: 17200,
        sgst: 17200,
    },
];

export const DUMMY_DOCUMENT_ROWS: DocumentRow[] = [
    {
        id: '1',
        documentType: 'Invoices for outward supply',
        serialFrom: 'INV-001',
        serialTo: 'INV-001',
        totalIssued: 55,
        cancelled: 55,
        netIssued: 55,
    },
    {
        id: '2',
        documentType: 'Revised Invoice',
        serialFrom: 'INV-001',
        serialTo: 'INV-001',
        totalIssued: 33,
        cancelled: 33,
        netIssued: 33,
    },
    {
        id: '3',
        documentType: 'Debit Note',
        serialFrom: 'INV-001',
        serialTo: 'INV-001',
        totalIssued: 2,
        cancelled: 2,
        netIssued: 2,
    },
    {
        id: '4',
        documentType: 'Credit Note',
        serialFrom: 'INV-001',
        serialTo: 'INV-001',
        totalIssued: 89,
        cancelled: 89,
        netIssued: 89,
    },
];

const amend = (id: string, origInvNo: string): AmendmentRow => ({
    id,
    amendType: 'B2BA',
    origInvNo,
    origPeriod: '092024',
    receiverGstin: '27AAACQ3770E000',
    receiverName: '',
    revisedInvNo: 'INV-008',
    revisedDate: '05-09-2024',
    taxableAmount: 85000,
    igst: 0,
    cgst: 17200,
    sgst: 17200,
});

export const DUMMY_AMENDMENT_ROWS: Record<string, AmendmentRow[]> = {
    b2ba: [amend('1', 'INV-001'), amend('2', 'INV-002'), amend('3', 'INV-003')],
    b2cla: [amend('4', 'INV-004'), amend('5', 'INV-005'), amend('6', 'INV-006')],
    b2csa: [amend('7', 'INV-007'), amend('8', 'INV-008'), amend('9', 'INV-009')],
    cdnra: [amend('10', 'INV-010'), amend('11', 'INV-011'), amend('12', 'INV-012')],
    cdnura: [amend('13', 'INV-013'), amend('14', 'INV-014'), amend('15', 'INV-015')],
    expa: [amend('16', 'INV-016'), amend('17', 'INV-017'), amend('18', 'INV-018')],
};

export const SAVE_VALIDATE_ROWS: SaveSummaryRow[] = [
    { section: 'B2B Invoices', entries: 5, taxable: 85000 },
    { section: 'B2C Large', entries: 4, taxable: 320000 },
    { section: 'B2C Small', entries: 7, taxable: 550000 },
    { section: 'Exports', entries: 3, taxable: 120000 },
    { section: 'CDNR', entries: 8, taxable: 475000 },
    { section: 'CDNUR', entries: 1, taxable: 200000 },
    { section: 'Advances (AT)', entries: 6, taxable: 680000 },
    { section: 'B2B Amendments', entries: 2, taxable: 900000 },
];

export const REVIEW_SUMMARY_ROWS: ReviewSummaryRow[] = [
    {
        section: 'B2B Invoices',
        table: '4A,4B,6B,6C',
        entries: 5,
        taxable: 85000,
        igst: 85000,
        cgst: 85000,
        sgst: 85000,
    },
    {
        section: 'B2C Large',
        table: '5A,5B',
        entries: 4,
        taxable: 320000,
        igst: 320000,
        cgst: 320000,
        sgst: 320000,
    },
    {
        section: 'B2C Small',
        table: '6A',
        entries: 7,
        taxable: 550000,
        igst: 550000,
        cgst: 550000,
        sgst: 550000,
    },
    {
        section: 'Exports',
        table: '7A,7B',
        entries: 3,
        taxable: 120000,
        igst: 120000,
        cgst: 120000,
        sgst: 120000,
    },
    {
        section: 'CDNR',
        table: '9A,9B,9C',
        entries: 8,
        taxable: 475000,
        igst: 475000,
        cgst: 475000,
        sgst: 475000,
    },
    {
        section: 'CDNUR',
        table: '9A',
        entries: 1,
        taxable: 200000,
        igst: 200000,
        cgst: 200000,
        sgst: 200000,
    },
    {
        section: 'Advances (AT)',
        table: '10A,10B',
        entries: 6,
        taxable: 680000,
        igst: 680000,
        cgst: 680000,
        sgst: 680000,
    },
    {
        section: 'B2B Amendments',
        table: '11A,11B,11C,11D',
        entries: 2,
        taxable: 900000,
        igst: 900000,
        cgst: 900000,
        sgst: 900000,
    },
];

// ─── IMS ─────────────────────────────────────────────────────────────────────

export const DUMMY_IMS_SUPPLIERS: ImsSupplier[] = [
    {
        id: 's1',
        name: 'TechCorp Pvt Ltd',
        gstin: '27AABCT1234A1Z5',
        flags: [],
        accepted: 2,
        pending: 2,
        rejected: 4,
        total: 17200,
        invoices: [
            {
                id: 'i1',
                type: 'B2B',
                invoiceNo: 'TC/2024/1021',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'accepted',
            },
            {
                id: 'i2',
                type: 'Debit Note',
                invoiceNo: 'TC/2024/1022',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'pending',
            },
            {
                id: 'i3',
                type: 'B2B',
                invoiceNo: 'TC/2024/1023',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'rejected',
            },
        ],
    },
    {
        id: 's2',
        name: 'Reliance Industries',
        gstin: '27AAACR5055K1Z5',
        flags: [],
        accepted: 2,
        pending: 2,
        rejected: 4,
        total: 17200,
        invoices: [
            {
                id: 'i4',
                type: 'B2B',
                invoiceNo: 'TC/2024/1021',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'to-review',
            },
            {
                id: 'i5',
                type: 'Debit Note',
                invoiceNo: 'TC/2024/1021',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'to-review',
            },
            {
                id: 'i6',
                type: 'B2B',
                invoiceNo: 'TC/2024/1021',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'to-review',
            },
        ],
    },
    {
        id: 's3',
        name: 'Chennai Corp Pvt Ltd',
        gstin: '33AABCC2345B1Z8',
        flags: [],
        accepted: 2,
        pending: 2,
        rejected: 4,
        total: 17200,
        invoices: [
            {
                id: 'i7',
                type: 'B2B',
                invoiceNo: 'TC/2024/1024',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'accepted',
            },
            {
                id: 'i8',
                type: 'Credit Note',
                invoiceNo: 'TC/2024/1025',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'rejected',
            },
        ],
    },
    {
        id: 's4',
        name: 'H-TECH Pvt Ltd',
        gstin: '24AABCH5678D1Z2',
        flags: [],
        accepted: 2,
        pending: 2,
        rejected: 4,
        total: 17200,
        invoices: [
            {
                id: 'i9',
                type: 'B2B',
                invoiceNo: 'TC/2024/1026',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'pending',
            },
        ],
    },
    {
        id: 's5',
        name: 'GreenLeaf Solutions',
        gstin: '29AABCG9876F1Z4',
        flags: ['Irregular', 'GSTR-1 not filed'],
        accepted: 2,
        pending: 2,
        rejected: 4,
        total: 17200,
        invoices: [
            {
                id: 'i10',
                type: 'B2B',
                invoiceNo: 'TC/2024/1027',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'to-review',
            },
        ],
    },
    {
        id: 's6',
        name: 'Sunrise Ventures',
        gstin: '09AABCS3456G1Z1',
        flags: ['ITC Blocked'],
        accepted: 2,
        pending: 2,
        rejected: 4,
        total: 17200,
        invoices: [
            {
                id: 'i11',
                type: 'B2B',
                invoiceNo: 'TC/2024/1028',
                date: '20/03/2026',
                taxable: 17200,
                tax: 3096,
                status: 'rejected',
            },
        ],
    },
];

export const DUMMY_IMS_HISTORY: ImsHistoryEntry[] = [
    {
        id: 1,
        corporateUserId: 101,
        reconciliationId: 5,
        gstin: '27AAACJ2440E1ZY',
        financialYear: '2024-25',
        month: 11,
        action: 'save',
        invoiceCount: 8,
        acceptedCount: 2,
        pendingCount: 2,
        rejectedCount: 4,
        noactionCount: 0,
        referenceId: 'IMS-A3F7C2',
        status: 'confirmed',
        createdAt: '2024-11-15T09:02:00.000Z',
        updatedAt: '2024-11-15T09:02:00.000Z',
    },
    {
        id: 2,
        corporateUserId: 101,
        reconciliationId: 5,
        gstin: '27AAACJ2440E1ZY',
        financialYear: '2024-25',
        month: 11,
        action: 'reset',
        invoiceCount: 2,
        acceptedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        noactionCount: 2,
        referenceId: 'IMS-8DA83F',
        status: 'confirmed',
        createdAt: '2024-11-15T10:15:00.000Z',
        updatedAt: '2024-11-15T10:15:00.000Z',
    },
];

// ─── GSTR-1 Filing constants ──────────────────────────────────────────────────

export const GSTR1_STEPS = [
    { id: 1, label: 'Select Period' },
    { id: 2, label: 'B2B Invoices' },
    { id: 3, label: 'B2C & Others' },
    { id: 4, label: 'HSN & Documents' },
    { id: 5, label: 'Amendments' },
    { id: 6, label: 'Save & Validate' },
    { id: 7, label: 'Review & Proceed' },
    { id: 8, label: 'File Return' },
] as const;

export const B2C_TABS = [
    { key: 'b2c-large', label: 'B2C Large' },
    { key: 'b2c-small', label: 'B2C Small' },
    { key: 'exports', label: 'Exports' },
    { key: 'cdnr', label: 'CDNR' },
    { key: 'cdnur', label: 'CDNUR' },
    { key: 'nil-exempt', label: 'Nil/Exempt' },
    { key: 'advances', label: 'Advances' },
] as const;

export type B2CTabKey = (typeof B2C_TABS)[number]['key'];

export const AMENDMENT_TABS = [
    { key: 'b2ba', label: 'B2BA' },
    { key: 'b2cla', label: 'B2CLA' },
    { key: 'b2csa', label: 'B2CSA' },
    { key: 'cdnra', label: 'CDNRA' },
    { key: 'cdnura', label: 'CDNURA' },
    { key: 'expa', label: 'EXPA' },
] as const;

export type AmendTabKey = (typeof AMENDMENT_TABS)[number]['key'];

export const MONTH_LABELS = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
];
export const MONTH_LABELS_SHORT = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

export const INDIAN_STATES = [
    { code: '01', name: 'Jammu & Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Daman & Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' },
];

export const TAX_RATES = [0, 0.1, 0.25, 1, 3, 5, 6, 7.5, 12, 18, 28];

export const DOC_TYPES = [
    'Invoices for outward supply',
    'Invoices for inward supply (import)',
    'Revised Invoice',
    'Debit Note',
    'Credit Note',
    'Receipt Voucher',
    'Payment Voucher',
    'Refund Voucher',
    'Delivery Challan',
];

export const UQC_OPTIONS = ['Pcs', 'Kg', 'Ltr', 'Nos', 'Mtr', 'Box', 'Set', 'Hr', 'Non'];

export const NIL_EXEMPT_ROWS = [
    { key: 'intra-reg', label: 'Intra-state Supplies to Registered Persons' },
    { key: 'intra-unreg', label: 'Intra-state Supplies to Unregistered Persons' },
    { key: 'inter-reg', label: 'Inter-state Supplies to Registered Persons' },
    { key: 'inter-unreg', label: 'Inter-state Supplies to Unregistered Persons' },
] as const;

export type NilExemptKey = (typeof NIL_EXEMPT_ROWS)[number]['key'];
export type NilExemptField = 'nilRated' | 'exempted' | 'nonGst';
export type NilExemptValues = Record<NilExemptKey, Record<NilExemptField, number>>;

export const defaultNilExempt = (): NilExemptValues =>
    Object.fromEntries(
        NIL_EXEMPT_ROWS.map(r => [r.key, { nilRated: 0, exempted: 0, nonGst: 0 }])
    ) as NilExemptValues;

export const AMEND_SUBTITLES: Record<AmendTabKey, string> = {
    b2ba: 'Amendments to B2B invoices from prior periods',
    b2cla: 'Amendments to B2C Large invoices from prior periods',
    b2csa: 'Amendments to B2C Small invoices from prior periods',
    cdnra: 'Amendments to Credit/Debit Notes (Registered) from prior periods',
    cdnura: 'Amendments to Credit/Debit Notes (Unregistered) from prior periods',
    expa: 'Amendments to Export invoices from prior periods',
};

export const B2C_SUBTITLES: Record<B2CTabKey, string> = {
    'b2c-large': 'Inter-state invoices > ₹2.5 lakh to unregistered buyers (Table 5A, 5B)',
    'b2c-small': 'Consolidated intra-state supplies to unregistered buyers (Table 7)',
    exports: 'Export of goods or services with/without payment of tax (Table 6A)',
    cdnr: 'Credit/Debit notes issued to registered taxpayers (Table 9B, 9C)',
    cdnur: 'Credit/Debit notes issued to unregistered buyers (Table 9B)',
    'nil-exempt': 'Nil rated, exempted and non-GST outward supplies (Table 8)',
    advances: 'Tax liability on advance received and adjusted (Table 11)',
};

export const PLACE_OF_SUPPLY_OPTIONS = INDIAN_STATES.map(s => ({ value: s.name, label: s.name }));
export const TAX_RATE_OPTIONS = TAX_RATES.map(r => ({ value: r, label: `${r}%` }));
export const NOTE_TYPE_OPTIONS = [
    { value: 'C', label: 'Credit Note (C)' },
    { value: 'D', label: 'Debit Note (D)' },
];
export const EXPORT_TYPE_OPTIONS = [
    { value: 'WPAY', label: 'With Tax' },
    { value: 'WOPAY', label: 'Without Tax' },
];

export const CDNUR_SUPPLY_TYPE_OPTIONS = [
    { value: 'B2CL', label: 'B2CL' },
    { value: 'EXPWP', label: 'EXPWP' },
    { value: 'EXPWOP', label: 'EXPWOP' },
];

export const buildGstrMonths = (apiMonths: Gstr1MonthStatus[], fy: string): GstrMonth[] => {
    const startYear = parseInt(fy.split('-')[0], 10);
    const FY_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const statusMap = new Map<number, 'filed' | 'not_started'>();
    apiMonths.forEach(m => statusMap.set(m.month, m.status));
    return FY_ORDER.map(m => {
        const calYear = m >= 4 ? startYear : startYear + 1;
        return {
            key: `${MONTH_LABELS[m - 1]}-${calYear}`,
            label: MONTH_LABELS_SHORT[m - 1],
            year: String(calYear),
            status: statusMap.get(m) ?? 'not_started',
        };
    });
};

export const buildEmptyMonths = (fy: string): GstrMonth[] => buildGstrMonths([], fy);
