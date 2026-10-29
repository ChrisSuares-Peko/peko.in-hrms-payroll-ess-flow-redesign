export interface Business {
    id: string;
    name: string;
    gstin: string;
    status: 'Active' | 'Inactive';
    location?: string;
    regDate?: string;
    type?: string;
}

export interface TaxService {
    id: string;
    title: string;
    description: string;
    features: string[];
    ctaLabel: string;
    available: boolean;
}

export interface KycBusiness {
    gstin: string;
    legalName: string | null;
    tradeName: string | null;
    status: string;
    taxpayerType: string | null;
    registrationDate: string | null;
    state: string | null;
}

export interface TaxMoreState {
    panNumber: string;
    fullName: string;
    dob: string;
    panVerified: boolean;
    selectedBusinessId: string | null;
    selectedFinancialYear: string | null;
    kycComplete: boolean;
    activeSetup: GstSetup | null;
    kycBusinesses: KycBusiness[];
    gstPortalUsername: string;
}

export interface GstWorkflowStep {
    step: number;
    title: string;
    description: string;
    badge: 'Next' | 'Locked' | 'Overdue';
    dueDate?: string;
}

export interface UpcomingDeadline {
    id: string;
    day: string;
    month: string;
    title: string;
    status: string;
    period: string;
}

export interface GstTool {
    id: string;
    title: string;
    description: string;
}

export type MonthStatus = 'uploaded' | 'missing' | 'not_started';

export interface MonthData {
    key: string;
    label: string;
    year: string;
    count: number;
    status: MonthStatus;
}

export interface SalesInvoice {
    id: string;
    invoiceNo: string;
    date: string;
    partyName: string;
    gstin: string;
    hsnSac: string;
    placeOfSupply: string;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    status: 'okay' | 'fix';
}

export interface SoftwareOption {
    id: string;
    initial: string;
    name: string;
    description: string;
    color: string;
}

// ─── GSTR-1 Filing ───────────────────────────────────────────────────────────

export type GstrMonthStatus = 'filed' | 'selected' | 'not_started';

export interface GstrMonth {
    key: string;
    label: string;
    year: string;
    status: GstrMonthStatus;
}

export interface B2BRow {
    id: string;
    receiverGstin: string;
    name: string;
    invoiceNo: string;
    date: string;
    taxable: number;
    rate: number;
    igst: number;
    cgst: number;
    sgst: number;
    pos: number;
    rc: string;
}

export interface B2CRow {
    id: string;
    invoiceNo: string;
    date: string;
    pos: number;
    taxable: number;
    rate: number;
    igst: number;
}

export interface HsnRow {
    id: string;
    hsnCode: string;
    description: string;
    uqc: string;
    qty: number;
    taxable: number;
    rate: number;
    igst: number;
    cgst: number;
    sgst: number;
}

export interface DocumentRow {
    id: string;
    documentType: string;
    serialFrom: string;
    serialTo: string;
    totalIssued: number;
    cancelled: number;
    netIssued: number;
}

export type AmendType = 'B2BA' | 'B2CLA' | 'B2CSA' | 'CDNRA' | 'CDNURA' | 'EXPA';

export interface AmendSectionSummary {
    count: number;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalTax: number;
    invoices: AmendmentRow[];
}

export interface AmendmentRow {
    id: string;
    amendType: AmendType;
    origInvNo: string;
    origPeriod: string;
    receiverGstin: string;
    receiverName: string;
    placeOfSupply?: string;
    noteType?: string;
    portCode?: string;
    revisedInvNo: string;
    revisedDate: string;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
}

export interface AmendmentPayload {
    amendType: AmendType;
    origInvNo: string;
    origPeriod: string;
    receiverGstin?: string;
    receiverName?: string;
    placeOfSupply?: string;
    noteType?: string;
    portCode?: string;
    shippingBillNo?: string;
    shippingBillDate?: string;
    revisedInvNo?: string;
    revisedDate?: string;
    taxableAmount: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
}

export interface SaveSummaryRow {
    section: string;
    entries: number;
    taxable: number;
}

export interface ReviewSummaryRow {
    section: string;
    table: string;
    entries: number;
    taxable: number;
    igst: number;
    cgst: number;
    sgst: number;
}

// ─── IMS Supplier ─────────────────────────────────────────────────────────────

export type ImsCustomerAction = 'A' | 'R' | 'N' | string;

export interface ImsSupplierInvoice {
    invoiceNo: string;
    invoiceDate: string;
    invoiceType: string;
    customerGstin: string;
    customerName: string | null;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalTax: number;
    customerAction: ImsCustomerAction | null;
    nextStep: string | null;
}

export interface ImsSupplierCustomer {
    customerGstin: string;
    customerName: string;
    accepted: number;
    pending: number;
    rejected: number;
    noResponse: number;
    invoices: ImsSupplierInvoice[];
}

export interface ImsSupplierApiSummary {
    totalInvoices: number;
    totalTaxable: number;
    totalTax: number;
    acceptedCount: number;
    rejectedCount: number;
    pendingCount: number;
    noResponseCount: number;
}

export interface ImsSupplierResponse {
    customers: ImsSupplierCustomer[];
    summary: ImsSupplierApiSummary;
    hasRejected: boolean;
}

// ─── IMS ─────────────────────────────────────────────────────────────────────

export type ImsInvoiceStatus = 'accepted' | 'pending' | 'rejected' | 'to-review';
export interface ImsInvoice {
    id: string;
    type: string;
    invoiceNo: string;
    date: string;
    taxable: number;
    tax: number;
    status: ImsInvoiceStatus;
}

export type ImsSupplierFlag = 'Irregular' | 'GSTR-1 not filed' | 'ITC Blocked';

export interface ImsSupplier {
    id: string;
    name: string;
    gstin: string;
    flags: ImsSupplierFlag[];
    accepted: number;
    pending: number;
    rejected: number;
    total: number;
    invoices: ImsInvoice[];
}

export interface ImsHistoryEntry {
    id: number;
    corporateUserId: number;
    reconciliationId: number;
    gstin: string;
    financialYear: string;
    month: number;
    action: string;
    invoiceCount: number;
    acceptedCount: number;
    pendingCount: number;
    rejectedCount: number;
    noactionCount: number;
    referenceId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface AddedBackLiability {
    type: string;
    noteType: string | null;
    invoiceNo: string;
    invoiceDate: string;
    originalInvoiceNo: string | null;
    originalInvoiceDate: string | null;
    customerGstin: string;
    customerName: string | null;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalTax: number;
    supplyPeriod: string;
    form: string;
    remarks: string | null;
}

export interface AddedBackLiabilitiesResponse {
    totalCount: number;
    liabilities: AddedBackLiability[];
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface GstSetup {
    id: number;
    corporateUserId: number;
    gstin: string;
    financialYear: string;
    legalName: string | null;
    tradeName: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface GstSetupPayload {
    gstin: string;
    financialYear: string;
}

export interface TaxServiceApi {
    id: string;
    title: string;
    description: string;
    features: string[];
    available: boolean;
}

export interface TaxOverviewData {
    kycRequired: boolean;
    activeSetups: GstSetup[];
    services: TaxServiceApi[];
}

export interface SalesInvoiceRow {
    id: number;
    corporateUserId: number;
    gstin: string;
    financialYear: string;
    month: number;
    invoiceType: string;
    invoiceNo: string;
    invoiceDate: string;
    hsnCode: string | null;
    placeOfSupply: string | null;
    buyerGstin: string | null;
    buyerName: string | null;
    portCode: string | null;
    shippingBillNo: string | null;
    shippingBillDate: string | null;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalTax: number;
    status: 'uploaded' | 'missing_fields' | 'filed';
}

export interface MonthSummaryItem {
    month: number;
    invoiceCount: number;
    status: 'not_started' | 'uploaded' | 'missing_fields';
}

export interface SalesInvoicesResponse {
    invoices: { count: number; rows: SalesInvoiceRow[] };
    monthSummary: MonthSummaryItem[];
}

export interface AddSalesInvoiceItem {
    invoiceType?: string;
    invoiceNo: string;
    invoiceDate: string;
    hsnCode?: string;
    placeOfSupply?: string;
    buyerGstin?: string;
    buyerName?: string;
    portCode?: string;
    shippingBillNo?: string;
    shippingBillDate?: string;
    taxableAmount?: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
    noteType?: string;
    exportType?: string;
    taxRate?: number;
    supplyType?: string;
}

export interface AddSalesInvoicesPayload {
    gstin: string;
    financialYear: string;
    month: number;
    invoices: AddSalesInvoiceItem[];
}

export interface UpdateSalesInvoicePayload {
    invoiceNo?: string;
    invoiceDate?: string;
    buyerGstin?: string;
    buyerName?: string;
    hsnCode?: string;
    placeOfSupply?: string;
    portCode?: string;
    shippingBillNo?: string;
    shippingBillDate?: string;
    taxableAmount?: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
}

export interface SubmitImsPayload {
    gstin: string;
    financialYear: string;
    month: number;
    reconciliationCriteria?: string;
}

export interface ImsReconciliationInfo {
    id: number;
    status: 'pending' | 'created' | 'queued' | 'in_progress' | 'succeeded' | 'failed';
    sandboxJobId: string | null;
    reconciliationReportUrl: string | null;
    validationReportUrl: string | null;
}

export interface ImsInvoiceApi {
    id: number;
    corporateUserId: number;
    reconciliationId: number;
    gstin: string;
    financialYear: string;
    month: number;
    supplierGstin: string;
    supplierName: string;
    invoiceNo: string;
    invoiceDate: string | null;
    invoiceType: string;
    taxableAmount: string;
    igst: string;
    cgst: string;
    sgst: string;
    totalTax: string;
    imsAction: 'pending' | 'accepted' | 'rejected' | 'noaction';
    isAutoAccepted: number;
    rawData: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface ImsSupplierGroup {
    supplierGstin: string;
    supplierName: string | null;
    gstr1NotFiled: boolean;
    isItcBlocked: boolean;
    accepted: number;
    pending: number;
    rejected: number;
    noaction: number;
    totalTax: number;
    invoices: ImsInvoiceApi[];
}

export interface ItcEstimate {
    accepted: number;
    autoAccepted: number;
    pending: number;
    rejected: number;
    blocked: number;
    netClaimable: number;
    totalCount: number;
    reviewedCount: number;
    pendingCount: number;
}

export interface ImsTabCounts {
    all: number;
    b2b: number;
    amendments: number;
    notes: number;
    ecom: number;
}

export interface ImsActionCounts {
    accepted: number;
    rejected: number;
    pending: number;
    noaction: number;
}

export interface ImsPagination {
    page: number;
    limit: number;
    totalSuppliers: number;
    totalPages: number;
}

export interface ImsDataResponse {
    reconciliationId: number;
    tabCounts: ImsTabCounts;
    actionCounts: ImsActionCounts;
    pagination: ImsPagination;
    suppliers: ImsSupplierGroup[];
    totalInvoices: number;
    itcEstimate: ItcEstimate;
    deadline: string;
}

export interface GstinSearchResult {
    lgnm: string;
    tradeNam: string;
    gstin: string;
    sts: string;
    ctb: string;
    rgdt: string;
    stj: string;
    pradr?: {
        addr?: {
            bnm?: string;
            bno?: string;
            flno?: string;
            st?: string;
            loc?: string;
            pncd?: string;
            stcd?: string;
        };
    };
}

export interface Gstr1MonthStatus {
    month: number;
    status: 'filed' | 'not_started';
}

export interface Gstr1SectionSummary {
    count: number;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalTax: number;
    invoices: SalesInvoiceRow[];
}

export interface HsnSummaryRow {
    id?: number;
    hsnCode: string;
    description?: string;
    uqc: string;
    rate: number;
    qty: number;
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalTax: number;
}

export interface Gstr1Amendments {
    b2ba: AmendSectionSummary;
    b2cla: AmendSectionSummary;
    b2csa: AmendSectionSummary;
    cdnra: AmendSectionSummary;
    cdnura: AmendSectionSummary;
    expa: AmendSectionSummary;
}

export interface Gstr1Summary {
    b2b: Gstr1SectionSummary;
    b2c: Gstr1SectionSummary;
    b2cSmall: Gstr1SectionSummary;
    export: Gstr1SectionSummary;
    cdn: Gstr1SectionSummary;
    cdnr: Gstr1SectionSummary;
    cdnur: Gstr1SectionSummary;
    nil: Gstr1SectionSummary;
    advance: Gstr1SectionSummary;
    total: Gstr1SectionSummary;
    hsn: HsnSummaryRow[];
    documents: DocumentRow[];
    amendments: Gstr1Amendments;
}

export interface AddGstr1HsnPayload {
    gstin: string;
    financialYear: string;
    month: number;
    hsnCode: string;
    description?: string;
    uqc?: string;
    qty?: number;
    taxableAmount: number;
    rate: number;
    igst: number;
    cgst: number;
    sgst: number;
}

export interface AddGstr1DocumentPayload {
    gstin: string;
    financialYear: string;
    month: number;
    documentType: string;
    serialFrom?: string;
    serialTo?: string;
    totalIssued: number;
    cancelled: number;
}

// ─── GSTR-1 Portal Filing ─────────────────────────────────────────────────────

// ─── GSTR-3B ─────────────────────────────────────────────────────────────────

export interface Gstr3bSupSection {
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
}

export interface Gstr3bItcEntry {
    ty: string;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
}

export interface Gstr3bFormData {
    ret_period: string;
    gstin: string;
    sup_details: {
        osup_det: Gstr3bSupSection;
        osup_zero: Gstr3bSupSection;
        osup_nil_exmp: Gstr3bSupSection;
        osup_nongst: Gstr3bSupSection;
        isup_rev: Gstr3bSupSection;
    };
    itc_elg: {
        itc_avl: Gstr3bItcEntry[];
        itc_rev: Gstr3bItcEntry[];
        itc_net: { iamt: number; camt: number; samt: number; csamt: number };
        itc_inelg: Gstr3bItcEntry[];
    };
    inward_sup: {
        isup_details: Array<{ ty: string; intra: number; inter: number }>;
    };
    inter_sup: {
        unreg_details: Array<{ pos: string; txval: number; iamt: number }>;
        comp_details: Array<{ pos: string; txval: number; iamt: number }>;
        uin_details: unknown[];
    };
    intr_ltfee: {
        intr_details: { iamt: number; camt: number; samt: number; csamt: number };
        ltfee_details: { iamt: number; camt: number; samt: number; csamt: number };
    };
    eco_dtls?: {
        eco_sup: Gstr3bSupSection;
        eco_reg_sup: Gstr3bSupSection;
    };
    tx_pmt?: Record<string, unknown>;
}

export type Gstr3bStatus = 'draft' | 'saved' | 'validated' | 'filed';

export interface Gstr3bFiling {
    id?: number;
    formData: Gstr3bFormData | null;
    retPeriod: string | null;
    autoLiability: Record<string, unknown> | null;
    status: Gstr3bStatus;
    ackNum: string | null;
    filedAt: string | null;
}

export interface Gstr3bLedgers {
    cashLedger: Record<string, unknown> | null;
    itcLedger: Record<string, unknown> | null;
    liabilityLedger: Record<string, unknown> | null;
}

// ─── GSTR-2B ─────────────────────────────────────────────────────────────────

export interface Gstr2bB2bItem {
    supplierName: string;
    supplierGstin: string;
    invoiceNo: string;
    date: string;
    value: number;
    taxableValue: number;
    reverseCharge: boolean;
    itcAvailable: boolean;
    imsStatus: string;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
}

export interface Gstr2bB2baItem extends Gstr2bB2bItem {
    origInvoiceNo: string;
    origInvoiceDate: string;
}

export interface Gstr2bCdnItem {
    supplierName: string;
    supplierGstin: string;
    noteType: string;
    noteNo: string;
    date: string;
    value: number;
    taxableValue: number;
    reverseCharge: boolean;
    itcAvailable: boolean;
    imsStatus: string;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
}

export interface Gstr2bImpgItem {
    referenceDate: string;
    receivedDate: string;
    portCode: string;
    boeNumber: string;
    boeDate: string;
    isAmended: boolean;
    taxableValue: number;
    cess: number;
    igst: number;
    supplierGstin: string | null;
    supplierName: string | null;
}

export interface Gstr2bIsdItem {
    supplierGstin: string;
    supplierName: string;
    docType: string;
    docNo: string;
    date: string;
    origInvNo: string;
    origInvDate: string;
    itcEligible: boolean;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
}

export interface Gstr2bTdsItem {
    deducteeGstin: string;
    deductorName?: string;
    period?: string;
    amountDeducted: number;
    igst: number;
    cgst: number;
    sgst: number;
}

export interface Gstr2bTcsItem {
    supplierGstin: string;
    supplierName: string;
    invoiceNo: string;
    date: string;
    value: number;
    taxableValue: number;
    reverseCharge: boolean;
    itcAvailable: boolean;
    placeOfSupply: string;
    invoiceType: string;
    imsStatus: string;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
}

interface ItcTaxAmounts {
    igst?: number;
    cgst?: number;
    sgst?: number;
    cess?: number;
    txval?: number;
}

export interface Gstr2bItcSummary {
    itcavl?: {
        nonrevsup?: {
            b2b?: ItcTaxAmounts;
            impg?: ItcTaxAmounts;
            isd?: ItcTaxAmounts;
            tds?: ItcTaxAmounts;
            cdn?: ItcTaxAmounts;
            igst?: number;
            cgst?: number;
            sgst?: number;
            cess?: number;
        };
    };
}

export interface Gstr2bApiResponse {
    b2b: Gstr2bB2bItem[];
    b2ba: Gstr2bB2baItem[];
    cdn: Gstr2bCdnItem[];
    impg: Gstr2bImpgItem[];
    isd: Gstr2bIsdItem[];
    tds: Gstr2bTdsItem[];
    tcs: Gstr2bTcsItem[];
    amd: unknown[];
    itcSummary: Gstr2bItcSummary;
    itcAvailable?: number;
    itcNotAvailable?: number;
    generatedDate?: string;
}

export interface Gstr1FilingRecord {
    referenceId: string | null;
    ackNum: string | null;
    status: 'saved' | 'filed' | null;
}

export interface Gstr1SecSumEntry {
    sec_nm: string;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
}

export interface Gstr1PortalSummary {
    secSum: Gstr1SecSumEntry[];
    chksum: string;
    retPeriod: string;
}

// ─── Cash & ITC Balance Ledger ────────────────────────────────────────────────

export interface ItcLedgerTransaction {
    date: string;
    refNo: string;
    supplierGstin: string;
    desc: string;
    taxHead: string;
    type: string;
    amount: number;
    balanceAfter: number;
}

export interface ItcLedgerData {
    gstin: string;
    credits: number;
    debits: number;
    transactions: ItcLedgerTransaction[];
}

export interface CashLedgerTransaction {
    date: string;
    refNo: string;
    desc: string;
    taxHead: string;
    type: string;
    amount: number;
    balanceAfter: number;
}

export interface CashLedgerData {
    gstin: string;
    credits: number;
    debits: number;
    transactions: CashLedgerTransaction[];
}

export interface TaxHeadBreakdown {
    tx: number;
    fee: number;
    intr: number;
    pen: number;
    oth: number;
}

export interface TaxHeadBalance {
    igst: number;
    sgst: number;
    cgst: number;
    cess: number;
    total: number;
}

export interface ReturnLiabilityTransaction {
    date: string;
    desc: string;
    refNo: string;
    type: string;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
}

export interface ReturnLiabilityData {
    gstin: string;
    closingBalance: {
        igst: number;
        cgst: number;
        sgst: number;
        cess: number;
        total: number;
    };
    transactions: ReturnLiabilityTransaction[];
}

export interface CashItcBalanceData {
    gstin: string;
    cashBalance: TaxHeadBalance;
    cashBreakdown: {
        igst: TaxHeadBreakdown;
        sgst: TaxHeadBreakdown;
        cgst: TaxHeadBreakdown;
        cess: TaxHeadBreakdown;
    };
    itcBalance: TaxHeadBalance;
    itcBlockedBalance: TaxHeadBalance;
    availableBalance: {
        igst: number;
        sgst: number;
        cgst: number;
        cess: number;
    };
}

export interface AddCustomerPayload {
    name: string;
    gstin?: string;
    phoneNumber?: string;
    email?: string;
    primaryAddress: string;
    primaryCity: string;
    primaryState: string;
    primaryPincode: string;
    primaryCountry: string;
}

export interface AddVendorPayload {
    businessName: string;
    gstin?: string;
    contactPerson: string;
    email?: string;
    phone?: string;
    tags: string[];
    paymentTerms: string;
    status: string;
}

export interface PanSearchBusiness {
    gstin: string;
    legalName: string | null;
    tradeName: string | null;
    status: string;
    taxpayerType: string | null;
    registrationDate: string | null;
    state: string | null;
    primaryAddress: string;
    primaryCity: string;
    primaryPincode: string;
}

export interface PanSearchResponse {
    pan: string;
    businesses: PanSearchBusiness[];
}

// ─── GSTR-9 ───────────────────────────────────────────────────────────────────

export interface Gstr9Warning {
    code: string;
    type: 'warning' | 'error';
    message: string;
    detail: string;
}

export type Gstr9Status = 'draft' | 'saved' | 'filed' | null;

export interface Gstr9SecSumEntry {
    sec_nm: string;
    ttl_igst?: number;
    ttl_cgst?: number;
    ttl_sgst?: number;
    ttl_cess?: number;
    ttl_tax?: number;
    ttl_val?: number;
    ttl_rec?: number;
    sub_sections?: Gstr9SecSumEntry[];
    // NIL section
    ttl_nilsup_amt?: number;
    ttl_expt_amt?: number;
    ttl_ngsup_amt?: number;
    // DOC_ISSUE section
    ttl_doc_issued?: number;
    net_doc_issued?: number;
    ttl_doc_cancelled?: number;
    // Amendment/actual fields
    act_igst?: number;
    act_cgst?: number;
    act_sgst?: number;
    act_cess?: number;
    act_tax?: number;
    act_val?: number;
    // CDNUR sub-section type
    typ?: string;
    chksum?: string;
}

// ─── GSTR-9 Structured Table Types ────────────────────────────────────────────

export interface Gstr9TaxEntry {
    iamt?: number; // IGST
    camt?: number; // CGST
    samt?: number; // SGST/UTGST
    csamt?: number; // CESS
    txval?: number; // Taxable value
}

export interface Gstr9Table4 {
    b2b?: Gstr9TaxEntry;
    b2c?: Gstr9TaxEntry;
    exp?: Gstr9TaxEntry;
    sez?: Gstr9TaxEntry;
    deemed?: Gstr9TaxEntry;
    at?: Gstr9TaxEntry;
    rchrg?: Gstr9TaxEntry;
    cr_nt?: Gstr9TaxEntry;
    dr_nt?: Gstr9TaxEntry;
    amd_pos?: Gstr9TaxEntry;
    amd_neg?: Gstr9TaxEntry;
}

export interface Gstr9Table5 {
    zero_rtd?: { txval?: number };
    sez?: { txval?: number };
    rchrg?: { txval?: number };
    exmt?: { txval?: number };
    nil?: { txval?: number };
    non_gst?: { txval?: number };
    cr_nt?: { txval?: number };
    dr_nt?: { txval?: number };
    amd_pos?: { txval?: number };
    amd_neg?: { txval?: number };
}

export interface Gstr9Table6 {
    itc_3b?: Gstr9TaxEntry;
    isd?: Gstr9TaxEntry;
    tran1?: Gstr9TaxEntry;
    tran2?: Gstr9TaxEntry;
}

export interface Gstr9Table8 {
    itc_2b?: Gstr9TaxEntry;
}

export interface Gstr9Table9TaxHead {
    txpyble?: number;
    tax_paid_itc_iamt?: number;
    tax_paid_itc_camt?: number;
    tax_paid_itc_samt?: number;
    txpaid_cash?: number;
}

export interface Gstr9Table9 {
    iamt?: Gstr9Table9TaxHead;
    camt?: Gstr9Table9TaxHead;
    samt?: Gstr9Table9TaxHead;
    csamt?: Gstr9Table9TaxHead;
    intr?: Gstr9Table9TaxHead;
    fee?: Gstr9Table9TaxHead;
}

export interface Gstr9FormData {
    ret_period: string;
    gstin: string;
    newSumFlag?: boolean;
    sec_sum: Gstr9SecSumEntry[];
    chksum?: string;
    aggTurnover?: number;
    hsnMinLen?: number;
    table4?: Gstr9Table4;
    table5?: Gstr9Table5;
    table6?: Gstr9Table6;
    table8?: Gstr9Table8;
    table9?: Gstr9Table9;
}

export interface Gstr9Section8ADocument {
    inum?: string;
    oinum?: string;
    idt?: string;
    oidt?: string;
    val?: number;
    txval?: number;
    iamt?: number;
    camt?: number;
    samt?: number;
    csamt?: number;
    inv_typ?: string;
    pos?: string;
    rchrg?: string;
    iseligible?: string;
    reason?: string;
}

export interface Gstr9Section8ASupplier {
    stin?: string;
    filingdt?: string;
    rtnPrd?: string;
    documents?: Gstr9Section8ADocument[];
}

export interface Gstr9Section8AData {
    formData?: {
        fy?: string;
        b2b?: Gstr9Section8ASupplier[];
        b2ba?: Gstr9Section8ASupplier[];
    };
}

export interface Gstr9SaveTable6Entry {
    itc_typ: 'cg' | 'ip' | 'is';
    iamt: number;
    camt: number;
    samt: number;
    csamt: number;
}

export interface Gstr9SavePayload {
    gstin: string;
    fp: string;
    table4: Gstr9Table4;
    table5: Gstr9Table5;
    table6: {
        supp_non_rchrg: Gstr9SaveTable6Entry[];
        isd: { iamt: number; camt: number; samt: number; csamt: number };
        tran1: { camt: number; samt: number };
        tran2: { camt: number; samt: number };
    };
    table9: {
        iamt: { txpyble: number };
        camt: { txpyble: number };
        samt: { txpyble: number };
        csamt: { txpyble: number };
        intr: { txpyble: number };
        fee: { txpyble: number };
    };
}

export interface Gstr9DraftData {
    status: Gstr9Status;
    ackNum?: string | null;
    filedAt?: string | null;
    warnings?: Gstr9Warning[];
    infoPoints?: string[];
    gstr1AllFiled?: boolean;
    portalSessionActive?: boolean;
    aggregateTurnover?: number | null;
    formData: Gstr9FormData | null;
    retPeriod?: string;
}

// ─── Filing History ───────────────────────────────────────────────────────────

export interface FilingHistoryMonthStatus {
    status: string;
    ackNum: string | null;
    filedAt: string | null;
    retPeriod: string | null;
}

export interface FilingHistoryEntry {
    month: number;
    year: number;
    gstr1: FilingHistoryMonthStatus | null;
    gstr3b: FilingHistoryMonthStatus | null;
}

export interface FilingConfirmationData {
    arn: string;
    filedAt: string;
    retPeriod: string; // e.g. "032024" — MMYYYY
    financialYear: string; // e.g. "2023-24"
    gstin: string;
    legalName: string;
    aggTurnover: number;
    igstPayable: number;
    igstItcAvailed: number;
    igstCashPaid: number;
}
