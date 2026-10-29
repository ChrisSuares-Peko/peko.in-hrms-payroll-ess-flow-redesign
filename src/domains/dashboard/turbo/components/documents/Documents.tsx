import React, { useState } from 'react';

import { Button, Card, Col, Flex, Row, Typography } from 'antd';

import DocModal from './DocModal';
import DocUpload from './DocUpload';

const mandatoryDocs = [
    { label: 'Registration Certificate', type: 'RC' },
    { label: 'Permit Certificate', type: 'Permit' },
    { label: 'Insurance Certificate', type: 'Insurance' },
    { label: 'Pollution Under Control (PUC)', type: 'PUC' },
];

const extraDocLabels: Record<string, string> = {
    Fitness: 'Fitness',
    RoadTax: 'Road Tax',
    Other: 'Other vehicle docs',
};

const Documents = ({ item, createDoc, deteteDoc, updateDoc }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    // Separate mandatory and extra documents
    const existingDocs = item.data || [];

    const extraDocs = existingDocs.filter(
        (doc: any) => !mandatoryDocs.some(mandatory => mandatory.type === doc.type)
    );

    return (
        <Card variant="borderless" className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
            <Flex justify="space-between" className="flex-col gap-3 sm:flex-row sm:items-start">
                <Flex vertical>
                    <Typography.Text className="text-xl font-medium">{item.model}</Typography.Text>
                    <Typography.Text className="mt-1 text-base md:text-[17px] font-medium text-[#565656]">
                        {item.vehicleNumber}
                    </Typography.Text>
                </Flex>

                <Button
                    type="default"
                    danger
                    size="middle"
                    className="self-start text-xs md:px-5 md:text-sm"
                    onClick={() => {
                        setIsOpen(true);
                    }}
                >
                    Add Document
                </Button>
            </Flex>

            <Row gutter={[20, 10]} className="mt-5">
                {/* Render mandatory 4 documents */}
                {mandatoryDocs.map((doc, index) => (
                    <Col xs={24} xl={12} key={`mandatory-${index}`}>
                        <DocUpload
                            label={doc.label}
                            type={doc.type}
                            existingData={existingDocs.find((d: any) => d.type === doc.type)}
                            vehicleId={item.vehicleId}
                            createDoc={createDoc}
                            deteteDoc={deteteDoc}
                            updateDoc={updateDoc}
                        />
                    </Col>
                ))}

                {/* Render additional uploaded documents */}
                {extraDocs.map((doc: any, index: any) => (
                    <Col xs={24} xl={12} key={`extra-${index}`}>
                        <DocUpload
                            label={extraDocLabels[doc.type] ?? doc.type}
                            type={doc.type}
                            existingData={doc}
                            vehicleId={item.vehicleId}
                            createDoc={createDoc}
                            deteteDoc={deteteDoc}
                            updateDoc={updateDoc}
                        />
                    </Col>
                ))}
            </Row>
            {isOpen && (
                <DocModal
                    vehicleId={item.vehicleId}
                    handleCancel={() => setIsOpen(false)}
                    open={isOpen}
                    createDoc={createDoc}
                    existingDocs={existingDocs}
                />
            )}
        </Card>
    );
};

export default Documents;
