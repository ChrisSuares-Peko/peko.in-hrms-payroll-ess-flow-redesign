import React from 'react';

import { Flex, Typography } from 'antd';

import DocUploadField from '../ComplianceDetail/DocUploadField';
import MultiDocUploadField from '../ComplianceShared/MultiDocUploadField';

const { Text } = Typography;

const DocumentUploadSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">Documents Required</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Upload all required documents in PDF, JPG, or PNG format (max 5 MB each)</Text>
        </Flex>

        <Flex vertical gap={20}>
            <DocUploadField
                name="doc_coi"
                label="Certificate of Incorporation"
            />
            <MultiDocUploadField
                name="doc_moaAoa"
                label="MOA &amp; AOA"
                multiple
            />
            <DocUploadField
                name="doc_companyPan"
                label="Company PAN Card"
            />
            <DocUploadField
                name="doc_boardResolution"
                label="Board Resolution"
            />
            <MultiDocUploadField
                name="doc_directorKyc"
                label="PAN / Aadhaar / Photo of Directors"
                multiple
            />
            <MultiDocUploadField
                name="doc_addressProof"
                label="Registered Office Address Proof"
                multiple
            />
            <DocUploadField
                name="doc_directorList"
                label="Latest List of Directors / Shareholding"
            />
            <MultiDocUploadField
                name="doc_specimenSignatures"
                label="Specimen Signatures"
                multiple
            />
        </Flex>
    </div>
);

export default DocumentUploadSection;
