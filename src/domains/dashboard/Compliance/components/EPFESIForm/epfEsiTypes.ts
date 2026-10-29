import { SignatoryRow } from '../ComplianceShared/AuthorisedSignatorySection';

export interface EmployeeRow {
    employeeName: string;
    uanOrIpNumber: string;
    grossWages: string;
    epfWages: string;
    esiWages: string;
}

export interface EPFESIFormValues {
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

    // Signatories
    epf_signatories: SignatoryRow[];

    // Type selection
    epf_selectedTypes: string[]; // ['EPF_ESI_REG', 'EPF_ESI_RETURN']

    // Registration fields
    reg_alreadyAllotted: string;
    reg_epfCode: string;
    reg_esicCode: string;
    reg_totalEmployees: string;
    reg_empBelow15k: string;
    reg_empBelow21k: string;
    reg_thresholdDate: string;
    reg_voluntaryEpf: string;
    reg_coverageDate: string;
    reg_natureOfBusiness: string;

    // Return fields
    ret_returnType: string;
    ret_period: string;
    ret_financialYear: string;
    ret_employeeCount: string;
    ret_totalWages: string;
    ret_joinerExits: string;
    ret_dataSource: string;

    // Employee details
    epf_employees: EmployeeRow[];

    // Declaration
    decl_agreed: boolean;
    decl_signatoryName: string;
    decl_designation: string;
    decl_dinOrPan: string;
    decl_place: string;
    decl_date: string;
    decl_signature: string;
    decl_companySeal: string;

    // Documents
    doc_employeeMaster: string;
    doc_employeeKyc: string;
    doc_uanIpList: string;
    doc_salaryRegister: string;
    doc_dsc: string;

    [key: string]: any;
}

export interface EPFESISubmitProps {
    item: any;
    onSubmit: (payload: {
        companyInfo: Record<string, string>;
        documents: { key: string; base64: string; fileName: string }[];
    }) => Promise<void>;
}
