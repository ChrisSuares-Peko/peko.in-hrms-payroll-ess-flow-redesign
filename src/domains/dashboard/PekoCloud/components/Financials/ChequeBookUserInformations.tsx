import { useState } from 'react';

import { Flex, Typography, Skeleton } from 'antd';
import { ReactSVG } from 'react-svg';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import accountHolderName from '../../assets/icons/account-holder-name.svg';
import accountBalance from '../../assets/icons/accountBalance.svg';
import accountNumber from '../../assets/icons/accountNumber.svg';
import bankName from '../../assets/icons/bankName.svg';
import ChequeId from '../../assets/icons/cheque-id.svg';
import chequeNumberStarting from '../../assets/icons/chequeNumberStarting.svg';
import chequeStatus from '../../assets/icons/chequeStatus.svg';
import currency from '../../assets/icons/currency.svg';
import files from '../../assets/icons/files.svg';
import numberOfLeaf from '../../assets/icons/numberOfLeaf.svg';
import { retrieveChequeBookData } from '../../utils/financial';
import ChequeBookModal from '../Modals/ChequeBookModal';

type Props = {
    chequeBookData?: any;
    setRefState: (num: number) => void;
    isLoading: boolean;
};

const CheckBookUserInformations = ({ chequeBookData, setRefState, isLoading }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const assetInfo = [
        {
            icon: ChequeId,
            title: retrieveChequeBookData(chequeBookData?.data?.bookId),
            subTitle: 'Cheque Book ID',
        },
        {
            icon: accountHolderName,
            title: retrieveChequeBookData(chequeBookData?.data?.accountName),
            subTitle: 'Account Name',
        },
        {
            icon: accountNumber,
            title: retrieveChequeBookData(chequeBookData?.data?.accountNumber),
            subTitle: 'Account Number',
        },
        {
            icon: bankName,
            title: retrieveChequeBookData(chequeBookData?.data?.bankName),
            subTitle: 'Bank Name',
        },
        {
            icon: currency,
            title: retrieveChequeBookData(chequeBookData?.data?.currency),
            subTitle: 'Currency',
        },
        {
            icon: files,
            title: retrieveChequeBookData(chequeBookData?.data?.currencyDivision),
            subTitle: 'Currency Division',
        },
        {
            icon: chequeNumberStarting,
            title: retrieveChequeBookData(chequeBookData?.data?.chequeStarting),
            subTitle: 'Cheque Number Starting',
        },
        {
            icon: numberOfLeaf,
            title: retrieveChequeBookData(chequeBookData?.data?.numberOfLeaves),
            subTitle: 'Number of Leafs',
        },
        {
            icon: accountBalance,
            title: retrieveChequeBookData(
                formatNumberWithLocalString(chequeBookData?.data?.accountBalance)
            ),
            subTitle: 'Account Balance',
        },
        {
            icon: chequeStatus,
            title: (
                <Typography.Text className="text-[#05BE63]">
                    {retrieveChequeBookData(chequeBookData?.data?.status)}
                </Typography.Text>
            ),
            subTitle: 'Status',
        },
    ];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <Flex vertical>
            <Flex className="mt-6">
                {isLoading ? (
                    <Skeleton.Input style={{ width: 200 }} active size="small" />
                ) : (
                    <>
                        <Typography.Text className="text-textGrey">
                            Cheque Book Information
                        </Typography.Text>
                        <Typography.Text
                            className="text-iconRed ms-6 cursor-pointer"
                            onClick={() => toggleModal()}
                        >
                            Edit Info
                        </Typography.Text>
                    </>
                )}
            </Flex>
            <Flex className="mt-10 w-4/5" gap={25} vertical>
                {assetInfo.map((item, i) => (
                    <Flex gap={25} justify="space-between" key={i}>
                        <Flex
                            className="bg-red-50 p-2 h-10 w-10 rounded-md"
                            justify="center"
                            align="center"
                        >
                            <ReactSVG
                                src={item.icon}
                                beforeInjection={svg => {
                                    svg.setAttribute('style', 'width: 19px; height: 19px;');
                                }}
                            />
                        </Flex>
                        <Flex
                            vertical
                            className="h-full w-full"
                            justify="space-between"
                            align="start"
                        >
                            {isLoading ? (
                                <Skeleton
                                    active
                                    title={false}
                                    paragraph={{ rows: 2, width: ['100%', '50%'] }}
                                />
                            ) : (
                                <>
                                    <Typography.Text className="text-base text-textBlack">
                                        {item.title}
                                    </Typography.Text>

                                    <Typography.Text className="text-textGrey text-sm">
                                        {item.subTitle}
                                    </Typography.Text>
                                </>
                            )}
                        </Flex>
                    </Flex>
                ))}
            </Flex>
            <ChequeBookModal
                handleCancel={toggleModal}
                open={isModalOpen}
                setRefState={setRefState}
                selectedRecordData={chequeBookData?.data}
            />
        </Flex>
    );
};

export default CheckBookUserInformations;
