import { useState } from 'react';

import { Flex, Typography, Skeleton } from 'antd';
import { ReactSVG } from 'react-svg';

import amount from '@domains/dashboard/PekoCloud/assets/icons/amount.svg';
import chasisNo from '@domains/dashboard/PekoCloud/assets/icons/chasisNo.svg';
import modelYear from '@domains/dashboard/PekoCloud/assets/icons/modelYear.svg';
import monthly from '@domains/dashboard/PekoCloud/assets/icons/monthly.svg';
import odoMeter from '@domains/dashboard/PekoCloud/assets/icons/odoMeter.svg';
import purchasedDate from '@domains/dashboard/PekoCloud/assets/icons/purchasedDate.svg';
import registration from '@domains/dashboard/PekoCloud/assets/icons/registration.svg';
import rent from '@domains/dashboard/PekoCloud/assets/icons/rent.svg';
import status from '@domains/dashboard/PekoCloud/assets/icons/status.svg';
import transmission from '@domains/dashboard/PekoCloud/assets/icons/transmission.svg';
import vehicleNo from '@domains/dashboard/PekoCloud/assets/icons/vehicleNo.svg';
import vendor from '@domains/dashboard/PekoCloud/assets/icons/vendor.svg';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { retrieveVehicleData } from '../../utils/fleet/fleetManagementData';
import { formatDate } from '../../utils/helperFunctions';
import VehicleInformationModal from '../Modals/VehicleInformationModal';

type Props = {
    setRefState: (num: number) => void;
    isLoading?: boolean;
    vehicleData: any;
};

const VehicleInformation = ({ setRefState, isLoading, vehicleData }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const vehicleInfo = [
        {
            icon: purchasedDate,
            title: retrieveVehicleData(vehicleData?.data?.purchasedDate.split('T')[0]),
            subTitle: 'Purchased Date',
        },
        {
            icon: rent,
            title: retrieveVehicleData(vehicleData?.data?.assetType || ''),
            subTitle: 'Asset Type',
        },
        {
            icon: vehicleNo,
            title: retrieveVehicleData(vehicleData?.data?.vehicleNumber || ''),
            subTitle: 'Vehicle Number',
        },
        {
            icon: vendor,
            title: retrieveVehicleData(vehicleData?.data?.vendor || ''),
            subTitle: 'Vendor',
        },
        {
            icon: amount,
            title: retrieveVehicleData(
                formatNumberWithLocalString(vehicleData?.data?.amount) || ''
            ),
            subTitle: 'Amount',
        },
        {
            icon: monthly,
            title: retrieveVehicleData(vehicleData?.data?.amountRecurring || ''),
            subTitle: 'Amount Recurring',
        },
        {
            icon: modelYear,
            title: retrieveVehicleData(vehicleData?.data?.modelYear || ''),
            subTitle: 'Model Year',
        },
        {
            icon: chasisNo,
            title: retrieveVehicleData(vehicleData?.data?.chassisNumber || ''),
            subTitle: 'Chassis Number',
        },
        {
            icon: transmission,
            title: retrieveVehicleData(vehicleData?.data?.engineTransmission || ''),
            subTitle: 'Engine Transmission',
        },
        {
            icon: odoMeter,
            title: retrieveVehicleData(vehicleData?.data?.odoMeter || ''),
            subTitle: 'ODO Meter',
        },
        {
            icon: registration,
            title: retrieveVehicleData(formatDate(vehicleData?.data?.dateOfRenewal) || ''),
            subTitle: 'Registration Renewal Date',
        },
        {
            icon: status,
            title: retrieveVehicleData(vehicleData?.data?.status || ''),
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
                            Vehicle Information
                        </Typography.Text>
                        <Typography.Text
                            className="cursor-pointer text-iconRed ms-6"
                            onClick={() => toggleModal()}
                        >
                            Edit Info
                        </Typography.Text>
                    </>
                )}
            </Flex>
            <Flex className="w-4/5 mt-10" gap={25} vertical>
                {vehicleInfo.map((item, i) => (
                    <Flex gap={25} justify="space-between" key={i}>
                        <Flex
                            className="w-10 h-10 p-2 rounded-md bg-red-50"
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
                            className="w-full h-full"
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

                                    <Typography.Text className="text-sm text-textGrey">
                                        {item.subTitle}
                                    </Typography.Text>
                                </>
                            )}
                        </Flex>
                    </Flex>
                ))}
                <VehicleInformationModal
                    handleCancel={toggleModal}
                    open={isModalOpen}
                    setRefState={setRefState}
                    initialValues={null}
                    vehicleData={vehicleData}
                />
            </Flex>
        </Flex>
    );
};

export default VehicleInformation;
