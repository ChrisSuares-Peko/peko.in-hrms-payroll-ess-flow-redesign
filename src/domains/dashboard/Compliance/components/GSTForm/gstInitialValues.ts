import { GSTFormValues } from './gstTypes';
import { emptySignatory } from '../ComplianceShared/AuthorisedSignatorySection';
import { companyDetailsInitialValues } from '../ComplianceShared/CompanyDetailsSection';
import { declarationInitialValues } from '../ComplianceShared/DeclarationSection';
import { emptyDirector } from '../ComplianceShared/DirectorsSection';
import { officeUseInitialValues } from '../ComplianceShared/OfficeUseSection';

export const gstInitialValues: GSTFormValues = {
    ...officeUseInitialValues,
    ...companyDetailsInitialValues,
    ...declarationInitialValues,

    gst_directors: [emptyDirector()],
    gst_signatories: [emptySignatory()],

    gst_selectedTypes: [],

    // GST Registration
    reg_reason: '',
    reg_expectedTurnover: '',
    reg_nature: '',
    reg_principalAddress: '',
    reg_additionalAddress: '',
    reg_hsnGoods: '',
    reg_sacServices: '',
    reg_liabilityDate: '',
    reg_bankAccountNo: '',
    reg_ifscCode: '',
    reg_state: '',

    // GST Return
    ret_gstin: '',
    ret_period: '',
    ret_frequency: '',
    ret_returnTypes: [],
    ret_outwardSupplies: '',
    ret_inwardSupplies: '',
    ret_dataSource: '',
    ret_itc: '',
    ret_rcmLiability: '',
    ret_hasAmendments: '',

    // Documents
    doc_companyPan: '',
    doc_coi: '',
    doc_moaAoa: '',
    doc_boardResolution: '',
    doc_signatoryKyc: '',
    doc_addressProof: '',
    doc_cancelledCheque: '',
    doc_dsc: '',
    doc_salesInvoices: '',
    doc_purchaseInvoices: '',
    doc_gstrReports: '',
};
