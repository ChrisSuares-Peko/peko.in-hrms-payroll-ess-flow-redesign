import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import DocUploadField from '../ComplianceDetail/DocUploadField';
import MultiDocUploadField from '../ComplianceShared/MultiDocUploadField';

const { Text } = Typography;

const DocumentUploadSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">Documents Required</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Upload all required supporting documents</Text>
        </Flex>
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
                <MultiDocUploadField name="doc_bankStatement" label="Bank Statement / Passbook (subscription receipt) *" multiple />
            </Col>
            <Col xs={24} sm={12}>
                <DocUploadField name="doc_boardResolution" label="Board Resolution (authorising INC-20A) *" />
            </Col>
            <Col xs={24} sm={12}>
                <MultiDocUploadField name="doc_officeExterior" label="Registered Office Exterior Photo *" multiple />
            </Col>
            <Col xs={24} sm={12}>
                <MultiDocUploadField name="doc_officeInterior" label="Registered Office Interior Photo (with Director/KMP) *" multiple />
            </Col>
            <Col xs={24} sm={12}>
                <DocUploadField name="doc_coi" label="Certificate of Incorporation (COI) *" />
            </Col>
            <Col xs={24} sm={12}>
                <MultiDocUploadField name="doc_moaAoa" label="MOA & AOA *" multiple />
            </Col>
            <Col xs={24} sm={12}>
                <MultiDocUploadField name="doc_sectoralApproval" label="Sectoral Regulator Approval (optional)" multiple />
            </Col>
        </Row>
    </div>
);

export default DocumentUploadSection;
