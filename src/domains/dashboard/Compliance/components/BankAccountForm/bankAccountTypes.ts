import { SignatoryRow } from '../ComplianceShared/AuthorisedSignatorySection';
import { DirectorRow } from '../ComplianceShared/DirectorsSection';

export interface BankAccountFormValues {
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

    // Array fields
    bank_directors: DirectorRow[];
    bank_signatories: SignatoryRow[];

    // Bank account requirements
    bank_preferredBanks: string[];
    bank_preferredBranch: string;
    bank_accountType: string;
    bank_initialDeposit: string;
    bank_monthlyVolume: string;
    bank_additionalFacilities: string[];
    bank_operatingSignatories: string;
    bank_modeOfOperation: string;
    bank_boardResolutionRequired: boolean;
    bank_hasExistingResolution: boolean;
    bank_beneficialOwnershipRequired: boolean;
    bank_kycEnclosed: boolean;

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
    doc_companyPan: string;
    doc_boardResolution: string;
    doc_directorKyc: string;
    doc_addressProof: string;
    doc_directorList: string;
    doc_specimenSignatures: string;

    [key: string]: any;
}

export interface BankAccountSubmitProps {
    item: any;
    onSubmit: (payload: {
        companyInfo: Record<string, string>;
        documents: { key: string; base64: string; fileName: string }[];
    }) => Promise<void>;
}
