import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Col, Flex, Typography, Button, Image, Row } from 'antd';
import { ReactSVG } from 'react-svg';

import clipBoard from '@domains/dashboard/PekoCloud/assets/icons/clip-board.svg';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import visa from '../../assets/images/visa.jpg';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { formatDate } from '../../utils/helperFunctions';
import { copyToClipboard } from '../../utils/useCopyToClipboard';

interface VisaDocProps {
    owner: any;
    setOpenOwnerDocumentModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedDocument: (values: any) => void;
}
const VisaDocCard = ({ owner, setOpenOwnerDocumentModal, setSelectedDocument }: VisaDocProps) => {
    const dispatch = useAppDispatch();
    const { handleDocumentDownload, isLoading } = useDownloadDocument();
    const handleDocDownload = (record: any) => {
        handleDocumentDownload(record, 'Visa');
    };
    const displayCopiedMessage = () => {
        dispatch(showToast({ variant: 'success', description: 'Copied to clip board' }));
    };

    return (
        <Row className="p-6 border-b h-1/3" justify="space-between">
            <Col span={24} md={19} className="flex items-center gap-2">
                <Flex className="bg-white " align="center">
                    <Image width={45} preview={false} src={visa} />
                </Flex>
                <Col>
                    <Typography.Text className="text-base font-medium">Visa</Typography.Text>
                    <Row className="flex gap-2">
                        <Typography.Text className="text-xs">
                            Issued Date:{' '}
                            {(owner.visa.issueDate && formatDate(owner.visa?.issueDate)) || 'N/A'}
                        </Typography.Text>
                        <Typography.Text className="text-xs">
                            Expiry Date:
                            {(owner.visa.expireDate && formatDate(owner.visa?.expireDate)) || 'N/A'}
                        </Typography.Text>
                    </Row>
                    <Flex align="center" gap={2}>
                        <Typography.Text className="text-xs">
                            Visa No. {owner.visa?.documentNumber || 'N/A'}
                        </Typography.Text>
                        {/* clipboard icon */}
                        {owner.visa?.documentNumber && (
                            <ReactSVG
                                src={clipBoard}
                                className="cursor-pointer"
                                onClick={() => {
                                    copyToClipboard(owner.visa?.documentNumber);
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
                                ...owner.visa,

                                ownerId: owner.id,
                                documentType: 'visa',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.visa?.document && (
                        // <a
                        //     href={owner.visa?.document || ''}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     download
                        // >
                        <Button
                            onClick={() => handleDocDownload(owner.visa?.document)}
                            loading={isLoading}
                            className="w-full text-xs text-green-400"
                            type="link"
                            icon={<DownloadOutlined />}
                            size="small"
                            style={{ color: 'rgb(74 222 128)' }}
                        >
                            Download
                        </Button>
                        // </a>
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
                                ...owner.visa,

                                ownerId: owner.id,
                                documentType: 'visa',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.visa?.document && (
                        // <a
                        //     href={owner.visa?.document || ''}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     download
                        // >
                        <Button
                            onClick={() => handleDocDownload(owner.visa?.document)}
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

export default VisaDocCard;
