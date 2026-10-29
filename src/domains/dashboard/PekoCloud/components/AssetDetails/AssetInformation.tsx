import { useState } from 'react';

import { Flex, Typography, Skeleton } from 'antd';
import { ReactSVG } from 'react-svg';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import AmountSVG from '../../assets/icons/amount1-red.svg';
import BatchSVG from '../../assets/icons/batch-red.svg';
import CalenderSVG from '../../assets/icons/calendar-red.svg';
import CalenderDateSVG from '../../assets/icons/calendarDate-red.svg';
import HomeSVG from '../../assets/icons/home-red.svg';
import PurchaseSVG from '../../assets/icons/purchase-red.svg';
import SuitcaseSVG from '../../assets/icons/suitcase-red.svg';
import UserArrowSVG from '../../assets/icons/userArrow-red.svg';
import { retrieveAssetData } from '../../utils/assetDetails';
import { formatDate } from '../../utils/helperFunctions';
import AssetInformationModal from '../Modals/AssetInformationModal';

type Props = {
    assetData: any;
    setRefState: (num: number) => void;
    isLoading: boolean;
};

const AssetInformation = ({ assetData, setRefState, isLoading }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const assetInfo = [
        {
            icon: CalenderDateSVG,
            title: retrieveAssetData(
                (assetData?.data?.purchasedDate && formatDate(assetData?.data?.purchasedDate)) ||
                    'N/A'
            ),
            subTitle: 'Purchased Date',
        },
        {
            icon: PurchaseSVG,
            title: retrieveAssetData(assetData?.data?.assetType || 'N/A'),
            subTitle: 'Asset Type',
        },
        {
            icon: HomeSVG,
            title: retrieveAssetData(assetData?.data?.serialNumber),
            subTitle: 'Serial Number',
        },
        {
            icon: SuitcaseSVG,
            title: retrieveAssetData(assetData?.data?.vendor || 'N/A'),
            subTitle: 'Vendor',
        },
        {
            icon: AmountSVG,
            title: retrieveAssetData(formatNumberWithLocalString(assetData?.data?.amount) || 'N/A'),
            subTitle: 'Amount',
        },
        {
            icon: CalenderSVG,
            title: retrieveAssetData(assetData?.data?.amountRecurring || 'N/A'),
            subTitle: 'Amount Recurring',
        },
        {
            icon: SuitcaseSVG,
            title: retrieveAssetData(assetData?.data?.warranty || 'N/A'),
            subTitle: 'Warranty',
        },
        {
            icon: BatchSVG,
            title: retrieveAssetData(assetData?.data?.batchNumber || 'N/A'),
            subTitle: 'Batch No',
        },
        {
            icon: UserArrowSVG,
            title: (
                <Typography.Text className="text-[#05BE63]">
                    {retrieveAssetData(assetData?.data?.status)}
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
                            Device Information
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
            <AssetInformationModal
                handleCancel={toggleModal}
                open={isModalOpen}
                setRefState={setRefState}
                initialValues={null}
                assetData={assetData}
            />
        </Flex>
    );
};

export default AssetInformation;
