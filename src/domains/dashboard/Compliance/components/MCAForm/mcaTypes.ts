import { SignatoryRow } from '../ComplianceShared/AuthorisedSignatorySection';
import { DirectorRow } from '../ComplianceShared/DirectorsSection';
import { ShareholderRow } from '../ComplianceShared/ShareholdersSection';

export interface MCAFormValues {
    // Office use
    office_fileNo: string;
    office_dateReceived: string;
    office_receivedBy: string;
    office_engagementPartner: string;
    office_personResponsible: string;
    office_targetDate: string;

    // Company details
    company_name: string;
    company_cin: string;
    company_incorporationDate: string;
    company_type: string;
    company_pan: string;
    company_tan: string;
    company_gstin: string;
    company_registeredAddress: string;
    company_email: string;
    company_mobile: string;
    company_authorisedCapital: string;
    company_paidUpCapital: string;
    company_businessActivity: string;
    company_financialYear: string;
    contact_name: string;
    contact_designation: string;
    contact_mobile: string;
    contact_email: string;

    // MCA filing selections (array in form, serialised to JSON on submit)
    mca_selectedFilings: string[];

    // Array fields
    mca_directors: DirectorRow[];
    mca_shareholders: ShareholderRow[];
    mca_signatories: SignatoryRow[];

    // Serialised JSON strings stored in companyInfo
    // (used internally; the arrays above are the source of truth)
    mca_directorsJson: string;
    mca_shareholdersJson: string;
    mca_signatoriesJson: string;

    // ADT-1
    adt1_appointed: string;
    adt1_appointmentDate: string;
    adt1_boardMeetingDate: string;
    adt1_auditorName: string;
    adt1_membershipNo: string;
    adt1_auditorPan: string;
    adt1_auditorAddress: string;
    adt1_auditorEmail: string;
    adt1_auditorPhone: string;
    adt1_appointmentPeriod: string;
    adt1_agmDate: string;

    // Annual filing (AOC-4 / MGT-7)
    annual_financialYear: string;
    annual_agmDate: string;
    annual_accountsAudited: string;
    annual_expectedAuditDate: string;
    annual_isFirstFiling: string;
    annual_isSmallCompany: string;
    annual_boardMeetingsCount: string;
    annual_hasChanges: string;

    // DIR-3 KYC
    dir3_directorsForKyc: string;
    dir3_kycType: string;
    dir3_mobileChanged: string;
    dir3_emailChanged: string;

    // DPT-3
    dpt3_financialYear: string;
    dpt3_outstandingAmount: string;
    dpt3_loanBreakup: string;
    dpt3_publicDeposits: string;

    // MSME-1
    msme_halfYear: string;
    msme_outstandingAmount: string;
    msme_vendorCount: string;
    msme_delayReason: string;

    // Other ROC Filing
    other_filingType: string;
    other_eventDate: string;
    other_details: string;
    other_amounts: string;

    // Declaration
    decl_agreed: boolean;
    decl_signatoryName: string;
    decl_designation: string;
    decl_dinOrPan: string;
    decl_place: string;
    decl_date: string;
    decl_signature: string;
    decl_companySeal: string;

    // Documents (base64 strings)
    doc_coi: string;
    doc_moaAoa: string;
    doc_adt1_boardResolution: string;
    doc_adt1_consentLetter: string;
    doc_financialStatements: string;
    doc_auditorReport: string;
    doc_directorsReport: string;
    doc_agmNoticeMinutes: string;
    doc_shareholdingPattern: string;
    doc_dir3_directorKyc: string;
    doc_dpt3_loanAgreements: string;
    doc_msme_vendorInvoices: string;

    [key: string]: any;
}

export interface MCASubmitProps {
    item: any;
    onSubmit: (payload: {
        companyInfo: Record<string, string>;
        documents: { key: string; base64: string; fileName: string }[];
    }) => Promise<void>;
}
