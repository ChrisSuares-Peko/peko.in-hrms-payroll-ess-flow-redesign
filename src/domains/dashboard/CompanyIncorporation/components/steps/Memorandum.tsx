import { Row, Col, Alert } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';

import { EntityType } from '../../types';

interface MemorandumProps {
    entityType?: string;
}

const Memorandum = ({ entityType }: MemorandumProps) => {
    const isLLP = entityType === EntityType.LLP;

    return (
        <div>
            <Alert
                type="info"
                message="Document Requirements"
                description={
                    <ul className="ml-4 mt-2 space-y-1 text-[14px]">
                        <li>• Documents must be in PDF format</li>
                        <li>• Maximum file size: 5MB per document</li>
                        <li>• Ensure all required sections are included</li>
                    </ul>
                }
                className="mb-6"
            />

            <div className="p-6 border border-zinc-200 rounded-[22px] space-y-6">
                <Row gutter={[24, 0]}>
                    {!isLLP && (
                        <>
                            <Col xs={24} md={12}>
                                <CustomFileUploadInput
                                    label="Memorandum of Association (MOA)"
                                    name="memorandum.memorandumPath"
                                    // accept=".pdf"
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <CustomFileUploadInput
                                    label="Articles of Association (AOA)"
                                    name="memorandum.articlePath"
                                    // accept=".pdf"
                                />
                            </Col>
                        </>
                    )}
                    {isLLP && (
                        <Col xs={24}>
                            <CustomFileUploadInput
                                label="LLP Agreement"
                                name="memorandum.llpAgreementPath"
                                // accept=".pdf"
                            />
                        </Col>
                    )}
                </Row>
            </div>
        </div>
    );
};

export default Memorandum;
