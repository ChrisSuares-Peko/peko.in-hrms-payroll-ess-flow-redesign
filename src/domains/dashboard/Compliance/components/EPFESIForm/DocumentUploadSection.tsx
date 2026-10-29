import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { EPFESIFormValues } from './epfEsiTypes';
import DocUploadField from '../ComplianceDetail/DocUploadField';
import MultiDocUploadField from '../ComplianceShared/MultiDocUploadField';

const { Text } = Typography;

const DocumentUploadSection: React.FC = () => {
    const { values } = useFormikContext<EPFESIFormValues>();
    const selectedTypes = values.epf_selectedTypes ?? [];
    const isReg = selectedTypes.includes('EPF_ESI_REG');
    const isReturn = selectedTypes.includes('EPF_ESI_RETURN');

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Documents</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Upload supporting documents — PDF, JPG, PNG (max 5 MB each)
                </Text>
            </Flex>

            <Row gutter={[16, 20]}>
                {/* Always shown */}
                <Col xs={24} sm={12}>
                    <MultiDocUploadField
                        name="doc_employeeMaster"
                        label="Employee Master Data"
                        multiple
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <DocUploadField
                        name="doc_dsc"
                        label="DSC of Authorised Signatory"
                    />
                </Col>

                {/* Registration docs */}
                {isReg && (
                    <Col xs={24} sm={12}>
                        <MultiDocUploadField
                            name="doc_employeeKyc"
                            label="Aadhaar / PAN / Bank Details (Employee KYC)"
                            multiple
                        />
                    </Col>
                )}

                {/* Return docs */}
                {isReturn && (
                    <>
                        <Col xs={24} sm={12}>
                            <MultiDocUploadField
                                name="doc_uanIpList"
                                label="UAN / IP Numbers List"
                                multiple
                            />
                        </Col>

                        <Col xs={24} sm={12}>
                            <MultiDocUploadField
                                name="doc_salaryRegister"
                                label="Salary Register / Payroll"
                                multiple
                            />
                        </Col>
                    </>
                )}
            </Row>
        </div>
    );
};

export default DocumentUploadSection;
