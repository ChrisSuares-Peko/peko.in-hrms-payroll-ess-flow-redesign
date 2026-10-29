import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';

import DocumentUploadCell from './DocumentUploadCell';

const InsurancePucCard = ({
    insuranceAndPucDetails,
    onRequestQuote,
    insuranceDoc,
    pucDoc,
    insuranceExpiry,
    pucExpiry,
    saveDoc,
}: any) => {
    const getDoc = (docType: string) => (docType === 'Insurance' ? insuranceDoc : pucDoc);
    const getExpiry = (docType: string) =>
        docType === 'Insurance' ? insuranceExpiry : pucExpiry;

    return (
        <Col xs={24} md={12}>
            <div className="h-full p-6 border rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                <Flex justify="space-between" align="center" className="w-full">
                    <Typography.Text className="text-sm font-semibold">
                        Insurance & PUC
                    </Typography.Text>
                    <Button
                        size="small"
                        danger
                        icon={<SafetyCertificateOutlined />}
                        onClick={onRequestQuote}
                        className="mb-2"
                    >
                        Request a Quote
                    </Button>
                </Flex>
                <Row gutter={[20, 20]} className="mt-4">
                    {insuranceAndPucDetails.map((item: any, index: number) => (
                        <Col xs={12} xl={6} key={index}>
                            {item.isUpload ? (
                                <DocumentUploadCell
                                    label={item.label}
                                    existingDoc={getDoc(item.docType)}
                                    onUpload={({ documentBase, documentFormat }) =>
                                        saveDoc?.({
                                            docType: item.docType,
                                            expiryDate: getExpiry(item.docType),
                                            documentBase,
                                            documentFormat,
                                            existingDocId: getDoc(item.docType)?.id,
                                        })
                                    }
                                />
                            ) : (
                                <Flex gap={5} className="flex-col justify-between h-full">
                                    <Typography.Text type="secondary" className="text-xs">
                                        {item.label}
                                    </Typography.Text>

                                    <Flex flex={1}>
                                        <Typography.Text className="text-base font-medium">
                                            {item.value || 'N/A'}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            )}
                        </Col>
                    ))}
                </Row>
            </div>
        </Col>
    );
};

export default InsurancePucCard;
