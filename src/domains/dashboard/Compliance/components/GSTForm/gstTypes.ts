import { SignatoryRow } from '../ComplianceShared/AuthorisedSignatorySection';
import { DirectorRow } from '../ComplianceShared/DirectorsSection';

export type { DirectorRow, SignatoryRow };

export interface GSTFormValues {
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

    // Dynamic rows
    gst_directors: DirectorRow[];
    gst_signatories: SignatoryRow[];

    // Type selection
    gst_selectedTypes: string[]; // ['GST_REG', 'GST_RETURN']

    // GST Registration
    reg_reason: string;
    reg_expectedTurnover: string;
    reg_nature: string;
    reg_principalAddress: string;
    reg_additionalAddress: string;
    reg_hsnGoods: string;
    reg_sacServices: string;
    reg_liabilityDate: string;
    reg_bankAccountNo: string;
    reg_ifscCode: string;
    reg_state: string;

    // GST Return
    ret_gstin: string;
    ret_period: string;
    ret_frequency: string;
    ret_returnTypes: string[];
    ret_outwardSupplies: string;
    ret_inwardSupplies: string;
    ret_dataSource: string;
    ret_itc: string;
    ret_rcmLiability: string;
    ret_hasAmendments: string;

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
    doc_companyPan: string;
    doc_coi: string;
    doc_moaAoa: string;
    doc_boardResolution: string;
    doc_signatoryKyc: string;
    doc_addressProof: string;
    doc_cancelledCheque: string;
    doc_dsc: string;
    doc_salesInvoices: string;
    doc_purchaseInvoices: string;
    doc_gstrReports: string;
}

export interface GSTSubmitProps {
    item: any;
    onSubmit: (payload: {
        companyInfo: Record<string, string>;
        documents: { key: string; base64: string; fileName: string }[];
    }) => Promise<void>;
}
