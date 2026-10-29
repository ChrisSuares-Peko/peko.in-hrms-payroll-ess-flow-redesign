import { SignatoryRow } from '../ComplianceShared/AuthorisedSignatorySection';

export interface DeducteeRow {
    deducteeName: string;
    pan: string;
    section: string;
    amountPaid: string;
    tdsDeducted: string;
}

export interface TDSFormValues {
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

    // Contact
    contact_name: string;
    contact_designation: string;
    contact_mobile: string;
    contact_email: string;

    // Signatories
    tds_signatories: SignatoryRow[];

    // Type selection
    tds_selectedTypes: string[]; // ['TAN_REG', 'TDS_RETURN']

    // TAN Registration
    tan_hasTan: string;
    tan_existingTan: string;
    tan_deductionReason: string;
    tan_address: string;
    tan_personName: string;
    tan_personDesignation: string;
    tan_personPan: string;
    tan_personMobile: string;
    tan_personEmail: string;

    // TDS Return
    ret_tan: string;
    ret_quarter: string;
    ret_financialYear: string;
    ret_returnTypes: string[];
    ret_paymentNatures: string[];
    ret_deducteeCount: string;
    ret_totalAmount: string;
    ret_totalTds: string;
    ret_challanDetails: string;
    ret_dataSource: string;
    ret_form16Required: string;

    // Deductees
    tds_deductees: DeducteeRow[];

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
    doc_tanLetter: string;
    doc_challans: string;
    doc_payrollReports: string;
    doc_vendorReports: string;
    doc_deducteePan: string;
    doc_form16Files: string;
}

export interface TDSSubmitProps {
    item: any;
    onSubmit: (payload: {
        companyInfo: Record<string, string>;
        documents: { key: string; base64: string; fileName: string }[];
    }) => Promise<void>;
}
