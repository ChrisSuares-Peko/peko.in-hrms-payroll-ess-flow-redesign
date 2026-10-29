import React, { useState } from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import BankDocCard from './BankDocCard';
import EjariDocCard from './EjariDocCard';
import EmirateDocCard from './EmirateDocCard';
import InsuranceDocCard from './InsuranceDocCard';
import PassportDocCard from './PassportDocCard';
import PersonalInfoCard from './PersonalInfoCard';
import VisaDocCard from './VisaDocCard';
import OwnerBankDetailsModal from '../Modals/OwnerBankDetailsModal';
import OwnerDetailsModal from '../Modals/OwnerDetailsModal';
import OwnerDocModal from '../Modals/OwnerDocModal';

interface OwnerCardProps {
    owner: any;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    index: number;
}
const OwnerCard = ({ owner, index, reloadTable }: OwnerCardProps) => {
    const [openOwnerDetailsModal, setOpenOwnerDetailsModal] = useState(false);
    const [openOwnerDocumentModal, setOpenOwnerDocumentModal] = useState(false);
    const [openOwnerBankDetailsModal, setOpenOwnerBankDetailsModal] = useState(false);
    const [selectedBankDetails, setSelectedBankDetails] = useState<string>('');
    const [selectedDocument, setSelectedDocument] = useState<string>('');

    return (
        <Col className="my-2 min-w-full">
            <Flex gap="middle" vertical>
                <Typography.Text className="text-xl font-medium ">Owner {index}</Typography.Text>
            </Flex>
            <Row className="mt-4 border rounded-2xl w-full h-fit" justify="space-between">
                <PersonalInfoCard
                    owner={owner}
                    setOpenOwnerDetailsModal={setOpenOwnerDetailsModal}
                    reloadTable={reloadTable}
                />
                <Col span={24} md={12} xl={9} xxl={9} className="md:border-r">
                    <PassportDocCard
                        owner={owner}
                        setOpenOwnerDocumentModal={setOpenOwnerDocumentModal}
                        setSelectedDocument={setSelectedDocument}
                    />
                    <VisaDocCard
                        owner={owner}
                        setOpenOwnerDocumentModal={setOpenOwnerDocumentModal}
                        setSelectedDocument={setSelectedDocument}
                    />
                    <InsuranceDocCard
                        owner={owner}
                        setOpenOwnerDocumentModal={setOpenOwnerDocumentModal}
                        setSelectedDocument={setSelectedDocument}
                    />
                </Col>
                <Col span={24} md={12} xl={9} xxl={9} className="  ">
                    <EmirateDocCard
                        owner={owner}
                        setOpenOwnerDocumentModal={setOpenOwnerDocumentModal}
                        setSelectedDocument={setSelectedDocument}
                    />
                    <EjariDocCard
                        owner={owner}
                        setOpenOwnerDocumentModal={setOpenOwnerDocumentModal}
                        setSelectedDocument={setSelectedDocument}
                    />
                    <BankDocCard
                        owner={owner}
                        setOpenOwnerBankDetailsModal={setOpenOwnerBankDetailsModal}
                        setSelectedBankDetails={setSelectedBankDetails}
                    />
                </Col>
            </Row>
            {openOwnerDetailsModal && (
                <OwnerDetailsModal
                    selectedData={owner}
                    open={openOwnerDetailsModal}
                    handleCancel={() => setOpenOwnerDetailsModal(false)}
                    reloadTable={reloadTable}
                />
            )}
            {openOwnerDocumentModal && (
                <OwnerDocModal
                    selectedData={selectedDocument}
                    open={openOwnerDocumentModal}
                    handleCancel={() => setOpenOwnerDocumentModal(false)}
                    reloadTable={reloadTable}
                />
            )}
            {openOwnerBankDetailsModal && (
                <OwnerBankDetailsModal
                    selectedData={selectedBankDetails}
                    open={openOwnerBankDetailsModal}
                    handleCancel={() => setOpenOwnerBankDetailsModal(false)}
                    reloadTable={reloadTable}
                />
            )}
        </Col>
    );
};

export default OwnerCard;
