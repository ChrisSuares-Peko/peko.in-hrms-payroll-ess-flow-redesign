import type { INC20AFormValues } from './inc20aTypes';
import { emptySignatory } from '../ComplianceShared/AuthorisedSignatorySection';
import { companyDetailsInitialValues } from '../ComplianceShared/CompanyDetailsSection';
import { declarationInitialValues } from '../ComplianceShared/DeclarationSection';
import { emptyDirector } from '../ComplianceShared/DirectorsSection';
import { officeUseInitialValues } from '../ComplianceShared/OfficeUseSection';
import { emptyShareholder } from '../ComplianceShared/ShareholdersSection';

export const inc20aInitialValues: INC20AFormValues = {
    ...officeUseInitialValues,
    ...companyDetailsInitialValues,
    ...declarationInitialValues,

    inc20a_directors: [emptyDirector()],
    inc20a_shareholders: [emptyShareholder()],
    inc20a_signatories: [emptySignatory()],

    filing_hasShareCapital: '',
    filing_rocVerified: '',
    filing_accountOpened: '',
    filing_bankName: '',
    filing_branchName: '',
    filing_accountNumber: '',
    filing_totalSubscribedCapital: '',
    filing_totalMoneyReceived: '',
    filing_moneyReceivedDates: '',
    filing_onlySubscriptionTransactions: '',
    filing_signingDirector: '',
    filing_certifyingProfessional: '',

    doc_bankStatement: '',
    doc_boardResolution: '',
    doc_officeExterior: '',
    doc_officeInterior: '',
    doc_coi: '',
    doc_moaAoa: '',
    doc_sectoralApproval: '',
};
