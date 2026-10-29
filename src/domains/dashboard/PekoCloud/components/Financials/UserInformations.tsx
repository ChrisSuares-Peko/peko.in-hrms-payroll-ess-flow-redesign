import { useState } from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { retrieveAssetData } from '../../utils/assetDetails';
import { formatDate } from '../../utils/helperFunctions';
import ChequeLeafModal from '../Modals/ChequeLeafModal';

type Props = {
    setRefState: (num: number) => void;
    isLoading?: boolean;
    chequeLeafDetails: any;
};

const UserInformation = ({ setRefState, isLoading, chequeLeafDetails }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dataLeft = [
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.payeeName),
            subTitle: 'Payee Name',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.bankAccount),
            subTitle: 'Bank Name',
        },
        {
            title: retrieveAssetData(formatDate(chequeLeafDetails?.data?.dueDate)),
            subTitle: 'Due Date',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.status),
            subTitle: 'Status',
            isStatus: true,
            status: chequeLeafDetails?.data?.status,
        },
        {
            title: retrieveAssetData(formatNumberWithLocalString(chequeLeafDetails?.data?.amount)),
            subTitle: 'Amount',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.signedBy),
            subTitle: 'Signed by',
        },
    ];

    const dataRight = [
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.chequeBookNumber),
            subTitle: 'Cheque Book No',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.dateOfCheque.split('T')[0]),
            subTitle: 'Cheque Date',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.chequeNumber),
            subTitle: 'Cheque Number',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.remarks),
            subTitle: 'Remarks',
        },
        {
            title: retrieveAssetData(chequeLeafDetails?.data?.voucherReferance),
            subTitle: 'Voucher Referance',
        },
    ];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <Flex vertical>
            <Flex className="mt-6" justify="start">
                <Typography.Text className="text-textGrey">Cheque Information</Typography.Text>
                <Typography.Text
                    className="text-iconRed ms-6 cursor-pointer"
                    onClick={() => toggleModal()}
                >
                    Edit Cheque
                </Typography.Text>
            </Flex>
            <Row className="mt-3 w-3/5">
                <Col span={10}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataLeft.map((item, index) => (
                            <Flex vertical key={index}>
                                {isLoading ? (
                                    <Skeleton active avatar />
                                ) : (
                                    <Flex className="w-full" vertical align="start">
                                        <Skeleton active avatar loading={isLoading}>
                                            <Typography.Text
                                                className="text-textBlack font-medium"
                                                style={
                                                    item.isStatus && item.status === 'Pending'
                                                        ? { color: '#BEAB05' }
                                                        : {}
                                                }
                                            >
                                                {item.title}
                                            </Typography.Text>
                                            <Typography.Text className="text-textGrey">
                                                {item.subTitle}
                                            </Typography.Text>
                                        </Skeleton>
                                    </Flex>
                                )}
                            </Flex>
                        ))}
                    </Flex>
                </Col>
                <Col span={10}>
                    <Flex vertical gap={20} className="mt-6">
                        {dataRight.map((item, index) => (
                            <Flex vertical key={index}>
                                <Flex className="w-full" vertical align="start">
                                    <Skeleton active avatar loading={isLoading}>
                                        <Typography.Text className="text-textBlack font-medium">
                                            {item.title}
                                        </Typography.Text>
                                        <Typography.Text className="text-textGrey">
                                            {item.subTitle}
                                        </Typography.Text>
                                    </Skeleton>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Col>
            </Row>
            <ChequeLeafModal
                handleCancel={toggleModal}
                open={isModalOpen}
                setRefState={setRefState}
                selectedRecordData={chequeLeafDetails?.data}
            />
        </Flex>
    );
};

export default UserInformation;
