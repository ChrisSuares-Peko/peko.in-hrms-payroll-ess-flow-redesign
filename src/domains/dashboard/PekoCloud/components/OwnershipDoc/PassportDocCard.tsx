import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Col, Flex, Typography, Button, Image, Row } from 'antd';
import { ReactSVG } from 'react-svg';

import clipBoard from '@domains/dashboard/PekoCloud/assets/icons/clip-board.svg';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import passport from '../../assets/images/passport.jpg';
import useDownloadDocument from '../../hooks/useDownloadDocumentApi';
import { formatDate } from '../../utils/helperFunctions';
import { copyToClipboard } from '../../utils/useCopyToClipboard';

interface PassportDocProps {
    owner: any;
    setOpenOwnerDocumentModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedDocument: (values: any) => void;
}
const PassportDocCard = ({
    owner,
    setOpenOwnerDocumentModal,
    setSelectedDocument,
}: PassportDocProps) => {
    const dispatch = useAppDispatch();
    const { handleDocumentDownload, isLoading } = useDownloadDocument();
    const handleDocDownload = (record: any) => {
        handleDocumentDownload(record, 'Passport');
    };
    const displayCopiedMessage = () => {
        dispatch(showToast({ variant: 'success', description: 'Copied to clip board' }));
    };

    return (
        <Row className="p-6 border-t border-b md:border-t-0 h-1/3" justify="space-between">
            <Col span={24} md={19} className="flex items-center gap-2">
                <Flex className="bg-white " align="center">
                    <Image width={40} height={44} preview={false} src={passport} />
                </Flex>
                <Col>
                    <Typography.Text className="text-base font-medium">Passport</Typography.Text>
                    <Row className="flex gap-2">
                        <Typography.Text className="text-xs">
                            Issued Date:{' '}
                            {(owner.passport.issueDate && formatDate(owner.passport?.issueDate)) ||
                                'N/A'}
                        </Typography.Text>
                        <Typography.Text className="text-xs">
                            Expiry Date:{' '}
                            {(owner.passport.expireDate &&
                                formatDate(owner.passport?.expireDate)) ||
                                'N/A'}
                        </Typography.Text>
                    </Row>
                    <Flex align="center" gap={2}>
                        <Typography.Text className="text-xs">
                            Passport No. {owner.passport?.documentNumber || 'N/A'}
                        </Typography.Text>
                        {/* clipboard icon */}
                        {owner.passport?.documentNumber && (
                            <ReactSVG
                                src={clipBoard}
                                className="cursor-pointer"
                                onClick={() => {
                                    copyToClipboard(owner.passport?.documentNumber);
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
                                ...owner.passport,

                                ownerId: owner.id,
                                documentType: 'passport',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.passport?.document && (
                        // <a
                        //     href={owner.passport?.document || ''}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     download
                        // >
                        <Button
                            onClick={() => handleDocDownload(owner.passport?.document)}
                            className="w-full text-xs text-green-400"
                            type="link"
                            loading={isLoading}
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
                className="mt-5 xs:block sm:block md:hidden lg:hidden xl:block 2xl:hidden mb-14"
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
                                ...owner.passport,

                                ownerId: owner.id,
                                documentType: 'passport',
                            });
                        }}
                    >
                        Update
                    </Button>
                    {owner.passport?.document && (
                        // <a
                        //     href={owner.passport?.document || ''}
                        //     target="_blank"
                        //     rel="noopener noreferrer"
                        //     download
                        // >
                        <Button
                            onClick={() => handleDocDownload(owner.passport?.document)}
                            className="px-5 text-xs"
                            type="link"
                            loading={isLoading}
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

export default PassportDocCard;
