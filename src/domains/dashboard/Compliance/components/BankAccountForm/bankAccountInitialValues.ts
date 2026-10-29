import { BankAccountFormValues } from './bankAccountTypes';
import { emptySignatory } from '../ComplianceShared/AuthorisedSignatorySection';
import { companyDetailsInitialValues } from '../ComplianceShared/CompanyDetailsSection';
import { declarationInitialValues } from '../ComplianceShared/DeclarationSection';
import { emptyDirector } from '../ComplianceShared/DirectorsSection';
import { officeUseInitialValues } from '../ComplianceShared/OfficeUseSection';

export const bankAccountInitialValues: BankAccountFormValues = {
    ...officeUseInitialValues,
    ...companyDetailsInitialValues,
    ...declarationInitialValues,

    // Array fields
    bank_directors: [emptyDirector()],
    bank_signatories: [emptySignatory()],

    // Bank account requirements
    bank_preferredBanks: [],
    bank_preferredBranch: '',
    bank_accountType: '',
    bank_initialDeposit: '',
    bank_monthlyVolume: '',
    bank_additionalFacilities: [],
    bank_operatingSignatories: '',
    bank_modeOfOperation: '',
    bank_boardResolutionRequired: false,
    bank_hasExistingResolution: false,
    bank_beneficialOwnershipRequired: false,
    bank_kycEnclosed: false,

    // Documents
    doc_coi: '',
    doc_moaAoa: '',
    doc_companyPan: '',
    doc_boardResolution: '',
    doc_directorKyc: '',
    doc_addressProof: '',
    doc_directorList: '',
    doc_specimenSignatures: '',
};
