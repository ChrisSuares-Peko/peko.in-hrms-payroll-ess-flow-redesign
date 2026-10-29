import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Col, Flex, Typography, Button, Image, Row } from 'antd';
import { ReactSVG } from 'react-svg';

import clipBoard from '@domains/dashboard/PekoCloud/assets/icons/clip-board.svg';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import bankAccount from '../../assets/images/bankaccount.jpg';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { copyToClipboard } from '../../utils/useCopyToClipboard';

interface BankDocProps {
    owner: any;
    setOpenOwnerBankDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedBankDetails: (values: any) => void;
}
const BankDocCard = ({
    owner,
    setOpenOwnerBankDetailsModal,
    setSelectedBankDetails,
}: BankDocProps) => {
    const dispatch = useAppDispatch();
    const { handleDocumentDownload, isLoading } = useDownloadDocument();
    const handleDocDownload = (record: any) => {
        handleDocumentDownload(record, 'Bank Account Details');
    };
    const displayCopiedMessage = () => {
        dispatch(showToast({ variant: 'success', description: 'Copied to clip board' }));
    };

    return (
        <Row className="p-6 h-1/3" justify="space-between">
            <Col span={24} md={19} className="flex items-center gap-2">
                <Flex className="bg-white " align="center">
                    <Image width={45} preview={false} src={bankAccount} />
                </Flex>
                <Col>
                    <Typography.Text className="text-base font-medium">
                        Bank Account Details
                    </Typography.Text>
                    <Row className="flex gap-2">
                        <Typography.Text className="text-xs">
                            Name: {(owner.bankDetails.name && owner.bankDetails.name) || 'N/A'}
                        </Typography.Text>
                        <Typography.Text className="text-xs">
                            Swift Code:{' '}
                            {(owner.bankDetails.swiftcode && owner.bankDetails.swiftcode) || 'N/A'}
                        </Typography.Text>
                    </Row>
                    <Flex align="center" gap={2}>
                        <Typography.Text className="text-xs">
                            IBAN:
                            {(owner.bankDetails.iban && owner.bankDetails.iban) || 'N/A'}{' '}
                        </Typography.Text>
                        {/* clipboard icon */}
                        {owner.bankDetails.iban && (
                            <ReactSVG
                                src={clipBoard}
                                className="cursor-pointer"
                                onClick={() => {
                                    copyToClipboard(owner.bankDetails.iban);
                                    displayCopiedMessage();
                                }}
                            />
                        )}
                    </Flex>
                </Col>
            </Col>
            <Col
                span={24}
                md={5}
                xl={24}
                xxl={5}
                className="hidden mt-1 md:block xl:hidden 2xl:block"
            >
                <Flex vertical gap="small" align="center" justify="center">
                    <Button
                        type="default"
                        danger
                        size="small"
                        className="w-full text-xs"
                        onClick={() => {
                            setOpenOwnerBankDetailsModal(true);
                            setSelectedBankDetails({
                                ...owner.bankDetails,

                                ownerId: owner.id,
                                documentType: 'bankDetails',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.bankDetails?.document && (
                        // <a
                        //     href={owner.bankDetails?.document || ''}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     download
                        // >
                        <Button
                            onClick={() => handleDocDownload(owner.bankDetails?.document)}
                            loading={isLoading}
                            className="w-full text-xs text-center text-green-400"
                            type="link"
                            icon={<DownloadOutlined />}
                            size="small"
                            style={{ color: 'rgb(74 222 128)' }}
                        >
                            Download
                        </Button>
                    )}
                </Flex>
            </Col>
            <Col
                span={24}
                md={5}
                xl={24}
                xxl={5}
                className="mt-5 xs:block sm:block md:hidden lg:hidden xl:block 2xl:hidden"
            >
                <Flex align="center" justify="center">
                    <Button
                        type="default"
                        danger
                        size="small"
                        className="px-5 text-xs"
                        onClick={() => {
                            setOpenOwnerBankDetailsModal(true);
                            setSelectedBankDetails({
                                ...owner.bankDetails,

                                ownerId: owner.id,
                                documentType: 'bankDetails',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.bankDetails?.document && (
                        <Button
                            onClick={() => handleDocDownload(owner.bankDetails?.document)}
                            loading={isLoading}
                            className="px-5 text-xs"
                            type="link"
                            icon={<DownloadOutlined />}
                            size="small"
                            style={{ color: 'rgb(74 222 128)' }}
                        >
                            Download
                        </Button>
                    )}
                </Flex>
            </Col>
        </Row>
    );
};

export default BankDocCard;
