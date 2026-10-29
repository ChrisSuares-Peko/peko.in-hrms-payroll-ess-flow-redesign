import { Flex, Skeleton, Typography } from 'antd';

import { VendorServiceDocument } from '../../apis';
import { UploadedVendorDocument } from '../../hooks/useIecApplicationData';
import ObjectionDocumentUploadField from '../objection/ObjectionDocumentUploadField';

const { Text } = Typography;

interface IecDocumentsStepProps {
    vendorDocuments: VendorServiceDocument[];
    isLoadingDocuments: boolean;
    uploadedDocuments: Record<string, UploadedVendorDocument>;
    uploadingDocNids: Record<string, boolean>;
    documentErrors: Record<string, string>;
    onFileSelect: (doc: VendorServiceDocument, file: File) => void;
}

// Same vendor "documents list" call the business-creation page (ServiceDetail.tsx) uses for its
// own Required Documents list — one upload field per document_Nid the vendor's own catalog
// returns, rather than an internal entity-type table.
const IecDocumentsStep = ({
    vendorDocuments,
    isLoadingDocuments,
    uploadedDocuments,
    uploadingDocNids,
    documentErrors,
    onFileSelect,
}: IecDocumentsStepProps) => {
    if (isLoadingDocuments) {
        return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    return (
        <Flex vertical gap={16}>
            <Text strong className="!text-[16px]">
                Please upload the required documents
            </Text>
            {vendorDocuments.map((doc) => {
                const nid = String(doc.document_Nid);
                return (
                    <ObjectionDocumentUploadField
                        key={nid}
                        label={doc.doc_name}
                        required
                        fileName={uploadedDocuments[nid]?.fileName}
                        isUploading={uploadingDocNids[nid]}
                        error={documentErrors[nid]}
                        onFileSelect={(file) => onFileSelect(doc, file)}
                        onRemove={() => {}}
                    />
                );
            })}
        </Flex>
    );
};

export default IecDocumentsStep;
