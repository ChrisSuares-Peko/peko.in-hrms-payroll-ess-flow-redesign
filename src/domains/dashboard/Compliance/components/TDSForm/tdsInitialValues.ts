import { TDSFormValues } from './tdsTypes';
import { emptySignatory } from '../ComplianceShared/AuthorisedSignatorySection';
import { companyDetailsInitialValues } from '../ComplianceShared/CompanyDetailsSection';
import { declarationInitialValues } from '../ComplianceShared/DeclarationSection';
import { officeUseInitialValues } from '../ComplianceShared/OfficeUseSection';

export const tdsInitialValues: TDSFormValues = {
    ...officeUseInitialValues,
    ...companyDetailsInitialValues,
    ...declarationInitialValues,

    tds_signatories: [emptySignatory()],
    tds_selectedTypes: [],

    // TAN Registration
    tan_hasTan: '',
    tan_existingTan: '',
    tan_deductionReason: '',
    tan_address: '',
    tan_personName: '',
    tan_personDesignation: '',
    tan_personPan: '',
    tan_personMobile: '',
    tan_personEmail: '',

    // TDS Return
    ret_tan: '',
    ret_quarter: '',
    ret_financialYear: '',
    ret_returnTypes: [],
    ret_paymentNatures: [],
    ret_deducteeCount: '',
    ret_totalAmount: '',
    ret_totalTds: '',
    ret_challanDetails: '',
    ret_dataSource: '',
    ret_form16Required: '',

    // Deductees
    tds_deductees: [
        { deducteeName: '', pan: '', section: '', amountPaid: '', tdsDeducted: '' },
    ],

    // Documents
    doc_tanLetter: '',
    doc_challans: '',
    doc_payrollReports: '',
    doc_vendorReports: '',
    doc_deducteePan: '',
    doc_form16Files: '',
};
