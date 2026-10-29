import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { TDSFormValues } from './tdsTypes';
import DocUploadField from '../ComplianceDetail/DocUploadField';
import MultiDocUploadField from '../ComplianceShared/MultiDocUploadField';

const { Text } = Typography;

const DocumentUploadSection: React.FC = () => {
    const { values } = useFormikContext<TDSFormValues>();
    const selectedTypes = values.tds_selectedTypes;
    const returnTypes = values.ret_returnTypes;
    const form16Required = values.ret_form16Required === 'Yes';

    const isTanReg = selectedTypes.includes('TAN_REG');
    const isTdsReturn = selectedTypes.includes('TDS_RETURN');
    const hasForm24Q = returnTypes.includes('FORM_24Q');
    const hasForm26QOr27Q = returnTypes.includes('FORM_26Q') || returnTypes.includes('FORM_27Q');

    const hasAnyDoc = isTanReg || isTdsReturn;

    if (!hasAnyDoc) {
        return (
            <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
                <Flex vertical gap={4} className="mb-2">
                    <Text className="!text-[14px] !font-semibold !text-black">Document Upload</Text>
                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                        Select a service type above to see required documents
                    </Text>
                </Flex>
            </div>
        );
    }

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Document Upload</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Upload required supporting documents (PDF, JPG, PNG — Max 5 MB each)
                </Text>
            </Flex>

            <Row gutter={[16, 24]}>
                {/* TAN Registration docs */}
                {isTanReg && (
                    <Col xs={24} sm={12}>
                        <DocUploadField name="doc_tanLetter" label="TAN Allotment Letter (if already registered)" />
                    </Col>
                )}

                {/* TDS Return docs */}
                {isTdsReturn && (
                    <>
                        <Col xs={24} sm={12}>
                            <MultiDocUploadField
                                name="doc_challans"
                                label="TDS Challans"
                                multiple
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <MultiDocUploadField
                                name="doc_deducteePan"
                                label="Deductee PAN Details"
                                multiple
                            />
                        </Col>
                    </>
                )}

                {/* Form 24Q docs */}
                {isTdsReturn && hasForm24Q && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_payrollReports"
                            label="Payroll Reports"
                            multiple
                        />
                    </Col>
                )}

                {/* Form 26Q / 27Q docs */}
                {isTdsReturn && hasForm26QOr27Q && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_vendorReports"
                            label="Vendor Payment Reports"
                            multiple
                        />
                    </Col>
                )}

                {/* Form 16/16A docs */}
                {isTdsReturn && form16Required && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_form16Files"
                            label="Form 16/16A Supporting Files"
                            multiple
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default DocumentUploadSection;
