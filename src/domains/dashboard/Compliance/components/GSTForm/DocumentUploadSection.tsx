import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { GSTFormValues } from './gstTypes';
import DocUploadField from '../ComplianceDetail/DocUploadField';
import MultiDocUploadField from '../ComplianceShared/MultiDocUploadField';

const { Text } = Typography;

interface DocSlot {
    name: keyof GSTFormValues;
    label: string;
    multiple: boolean;
}

const REG_DOCS: DocSlot[] = [
    { name: 'doc_companyPan', label: 'Company PAN Card', multiple: false },
    { name: 'doc_coi', label: 'Certificate of Incorporation (COI)', multiple: false },
    { name: 'doc_moaAoa', label: 'MOA & AOA', multiple: true },
    { name: 'doc_boardResolution', label: 'Board Resolution', multiple: false },
    { name: 'doc_signatoryKyc', label: 'Authorised Signatory KYC (Aadhaar / Passport)', multiple: true },
    { name: 'doc_addressProof', label: 'Address Proof of Principal Place', multiple: true },
    { name: 'doc_cancelledCheque', label: 'Cancelled Cheque / Bank Statement', multiple: false },
    { name: 'doc_dsc', label: 'DSC (Digital Signature Certificate)', multiple: false },
];

const RETURN_DOCS: DocSlot[] = [
    { name: 'doc_salesInvoices', label: 'Sales Invoices / Outward Supply Data', multiple: true },
    { name: 'doc_purchaseInvoices', label: 'Purchase Invoices / Inward Supply Data', multiple: true },
    { name: 'doc_gstrReports', label: 'Existing GSTR Reports / Previous Filings', multiple: true },
];

const DocumentUploadSection: React.FC = () => {
    const { values } = useFormikContext<GSTFormValues>();
    const hasReg = values.gst_selectedTypes.includes('GST_REG');
    const hasReturn = values.gst_selectedTypes.includes('GST_RETURN');

    // Build deduplicated merged list
    const slots: DocSlot[] = [];
    const seen = new Set<string>();

    if (hasReg) {
        REG_DOCS.forEach((doc) => {
            if (!seen.has(doc.name as string)) {
                slots.push(doc);
                seen.add(doc.name as string);
            }
        });
    }

    if (hasReturn) {
        RETURN_DOCS.forEach((doc) => {
            if (!seen.has(doc.name as string)) {
                slots.push(doc);
                seen.add(doc.name as string);
            }
        });
    }

    if (slots.length === 0) return null;

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Document Upload</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Upload supporting documents (PDF, JPG, PNG — max 5 MB each)
                </Text>
            </Flex>

            <Row gutter={[16, 20]}>
                {slots.map((slot) => (
                    <Col xs={24} sm={12} key={slot.name as string}>
                        {slot.multiple ? (
                            <MultiDocUploadField
                                name={slot.name as string}
                                label={slot.label}
                                multiple
                            />
                        ) : (
                            <DocUploadField
                                name={slot.name as string}
                                label={slot.label}
                            />
                        )}
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default DocumentUploadSection;
