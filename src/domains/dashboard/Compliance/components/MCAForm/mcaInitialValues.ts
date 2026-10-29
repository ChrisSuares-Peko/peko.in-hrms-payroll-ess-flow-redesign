import { MCAFormValues } from './mcaTypes';
import { emptySignatory } from '../ComplianceShared/AuthorisedSignatorySection';
import { companyDetailsInitialValues } from '../ComplianceShared/CompanyDetailsSection';
import { declarationInitialValues } from '../ComplianceShared/DeclarationSection';
import { emptyDirector } from '../ComplianceShared/DirectorsSection';
import { officeUseInitialValues } from '../ComplianceShared/OfficeUseSection';
import { emptyShareholder } from '../ComplianceShared/ShareholdersSection';

export const mcaInitialValues: MCAFormValues = {
    ...officeUseInitialValues,
    ...companyDetailsInitialValues,
    ...declarationInitialValues,

    mca_selectedFilings: [],
    mca_directors: [emptyDirector()],
    mca_shareholders: [emptyShareholder()],
    mca_signatories: [emptySignatory()],

    // Internal serialised JSON (populated on submit)
    mca_directorsJson: '',
    mca_shareholdersJson: '',
    mca_signatoriesJson: '',

    // ADT-1
    adt1_appointed: '',
    adt1_appointmentDate: '',
    adt1_boardMeetingDate: '',
    adt1_auditorName: '',
    adt1_membershipNo: '',
    adt1_auditorPan: '',
    adt1_auditorAddress: '',
    adt1_auditorEmail: '',
    adt1_auditorPhone: '',
    adt1_appointmentPeriod: '',
    adt1_agmDate: '',

    // Annual filing
    annual_financialYear: '',
    annual_agmDate: '',
    annual_accountsAudited: '',
    annual_expectedAuditDate: '',
    annual_isFirstFiling: '',
    annual_isSmallCompany: '',
    annual_boardMeetingsCount: '',
    annual_hasChanges: '',

    // DIR-3 KYC
    dir3_directorsForKyc: '',
    dir3_kycType: '',
    dir3_mobileChanged: '',
    dir3_emailChanged: '',

    // DPT-3
    dpt3_financialYear: '',
    dpt3_outstandingAmount: '',
    dpt3_loanBreakup: '',
    dpt3_publicDeposits: '',

    // MSME-1
    msme_halfYear: '',
    msme_outstandingAmount: '',
    msme_vendorCount: '',
    msme_delayReason: '',

    // Other ROC Filing
    other_filingType: '',
    other_eventDate: '',
    other_details: '',
    other_amounts: '',

    // Documents
    doc_coi: '',
    doc_moaAoa: '',
    doc_adt1_boardResolution: '',
    doc_adt1_consentLetter: '',
    doc_financialStatements: '',
    doc_auditorReport: '',
    doc_directorsReport: '',
    doc_agmNoticeMinutes: '',
    doc_shareholdingPattern: '',
    doc_dir3_directorKyc: '',
    doc_dpt3_loanAgreements: '',
    doc_msme_vendorInvoices: '',
};
