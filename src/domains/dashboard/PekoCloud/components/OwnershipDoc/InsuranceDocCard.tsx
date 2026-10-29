import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Col, Flex, Typography, Button, Image, Row } from 'antd';
import { ReactSVG } from 'react-svg';

import clipBoard from '@domains/dashboard/PekoCloud/assets/icons/clip-board.svg';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import insurance from '../../assets/images/insurance.jpg';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { formatDate } from '../../utils/helperFunctions';
import { copyToClipboard } from '../../utils/useCopyToClipboard';

interface InsuranceDocProps {
    owner: any;
    setOpenOwnerDocumentModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedDocument: (values: any) => void;
}
const InsuranceDocCard = ({
    owner,
    setOpenOwnerDocumentModal,
    setSelectedDocument,
}: InsuranceDocProps) => {
    const dispatch = useAppDispatch();
    const { handleDocumentDownload, isLoading } = useDownloadDocument();
    const handleDocDownload = (record: any) => {
        handleDocumentDownload(record, 'Insurance');
    };
    const displayCopiedMessage = () => {
        dispatch(showToast({ variant: 'success', description: 'Copied to clip board' }));
    };

    return (
        <Row className="p-6 h-1/3" justify="space-between">
            <Col span={24} md={19} className="flex items-center gap-2">
                <Flex className="bg-white " align="center">
                    <Image width={45} preview={false} src={insurance} />
                </Flex>
                <Col>
                    <Typography.Text className="text-base font-medium">Insurance</Typography.Text>
                    <Row className="flex gap-2">
                        <Typography.Text className="text-xs">
                            Issued Date:{' '}
                            {(owner.insurance.issueDate &&
                                formatDate(owner.insurance?.issueDate)) ||
                                'N/A'}
                        </Typography.Text>
                        <Typography.Text className="text-xs">
                            Expiry Date:{' '}
                            {(owner.insurance.expireDate &&
                                formatDate(owner.insurance?.expireDate)) ||
                                'N/A'}
                        </Typography.Text>
                    </Row>
                    <Flex align="center" gap={2}>
                        <Typography.Text className="text-xs">
                            Insurance No. {owner.insurance?.documentNumber || 'N/A'}
                        </Typography.Text>
                        {/* clipboard icon */}
                        {owner.insurance?.documentNumber && (
                            <ReactSVG
                                src={clipBoard}
                                className="cursor-pointer"
                                onClick={() => {
                                    copyToClipboard(owner.insurance?.documentNumber);
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
                            setOpenOwnerDocumentModal(true);
                            setSelectedDocument({
                                ...owner.insurance,

                                ownerId: owner.id,
                                documentType: 'insurance',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.insurance?.document && (
                        // <a
                        //     href={owner.insurance?.document || ''}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     download
                        // >
                        <Button
                            onClick={() => handleDocDownload(owner.insurance?.document)}
                            loading={isLoading}
                            className="w-full text-xs text-green-400"
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
                            setOpenOwnerDocumentModal(true);
                            setSelectedDocument({
                                ...owner.insurance,

                                ownerId: owner.id,
                                documentType: 'insurance',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.insurance?.document && (
                        <Button
                            onClick={() => handleDocDownload(owner.insurance?.document)}
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

export default InsuranceDocCard;
