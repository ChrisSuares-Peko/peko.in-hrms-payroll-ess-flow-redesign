import { EPFESIFormValues } from './epfEsiTypes';
import { emptySignatory } from '../ComplianceShared/AuthorisedSignatorySection';
import { companyDetailsInitialValues } from '../ComplianceShared/CompanyDetailsSection';
import { declarationInitialValues } from '../ComplianceShared/DeclarationSection';
import { officeUseInitialValues } from '../ComplianceShared/OfficeUseSection';

export const epfEsiInitialValues: EPFESIFormValues = {
    ...officeUseInitialValues,
    ...companyDetailsInitialValues,
    ...declarationInitialValues,

    epf_signatories: [emptySignatory()],
    epf_selectedTypes: [],

    // Registration fields
    reg_alreadyAllotted: '',
    reg_epfCode: '',
    reg_esicCode: '',
    reg_totalEmployees: '',
    reg_empBelow15k: '',
    reg_empBelow21k: '',
    reg_thresholdDate: '',
    reg_voluntaryEpf: '',
    reg_coverageDate: '',
    reg_natureOfBusiness: '',

    // Return fields
    ret_returnType: '',
    ret_period: '',
    ret_financialYear: '',
    ret_employeeCount: '',
    ret_totalWages: '',
    ret_joinerExits: '',
    ret_dataSource: '',

    // Employee details
    epf_employees: [
        {
            employeeName: '',
            uanOrIpNumber: '',
            grossWages: '',
            epfWages: '',
            esiWages: '',
        },
    ],

    // Documents
    doc_employeeMaster: '',
    doc_employeeKyc: '',
    doc_uanIpList: '',
    doc_salaryRegister: '',
    doc_dsc: '',
};
