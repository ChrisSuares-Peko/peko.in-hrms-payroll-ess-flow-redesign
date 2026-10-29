import type { SignatoryRow } from '../ComplianceShared/AuthorisedSignatorySection';
import type { DirectorRow } from '../ComplianceShared/DirectorsSection';
import type { ShareholderRow } from '../ComplianceShared/ShareholdersSection';

export interface INC20AFormValues {
    // Office use (matches officeUseInitialValues)
    office_fileNo: string;
    office_dateReceived: string;
    office_receivedBy: string;
    office_engagementPartner: string;
    office_personResponsible: string;
    office_targetDate: string;

    // Company details (matches companyDetailsInitialValues)
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

    // Directors, shareholders, signatories
    inc20a_directors: DirectorRow[];
    inc20a_shareholders: ShareholderRow[];
    inc20a_signatories: SignatoryRow[];

    // Filing fields
    filing_hasShareCapital: string;
    filing_rocVerified: string;
    filing_accountOpened: string;
    filing_bankName: string;
    filing_branchName: string;
    filing_accountNumber: string;
    filing_totalSubscribedCapital: string;
    filing_totalMoneyReceived: string;
    filing_moneyReceivedDates: string;
    filing_onlySubscriptionTransactions: string;
    filing_signingDirector: string;
    filing_certifyingProfessional: string;

    // Declaration (matches declarationInitialValues)
    decl_agreed: boolean;
    decl_signatoryName: string;
    decl_designation: string;
    decl_dinOrPan: string;
    decl_place: string;
    decl_date: string;
    decl_signature: string;
    decl_companySeal: string;

    // Documents
    doc_bankStatement: string;
    doc_boardResolution: string;
    doc_officeExterior: string;
    doc_officeInterior: string;
    doc_coi: string;
    doc_moaAoa: string;
    doc_sectoralApproval: string;
}

export interface INC20ASubmitProps {
    item: any;
    onSubmit: (payload: {
        companyInfo: Record<string, string>;
        documents: { key: string; base64: string; fileName: string }[];
    }) => Promise<void>;
}
