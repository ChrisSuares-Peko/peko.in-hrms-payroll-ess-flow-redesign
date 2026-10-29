import React, { useState } from 'react';

import { DownOutlined, LoadingOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Empty, Flex, Image, Tag, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { capitalize } from 'lodash';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import TrackingTimeline from './TrackerStatus';
import defaultImage from '../../assets/images/defaultImage.png';
import { Shipment } from '../../types/tracking';

const { Text } = Typography;
type TrackingMobileProps = {
    shipmentDetails: Shipment;
    handleDownloadInvoice: (trackingNumber: string, amount: number) => Promise<any>;
    isDownloading: boolean;
    handleDownloadLabel: (trackingNumber: string) => Promise<any>;
    isDownloadingLabel: boolean;
    handleReturnShipment: () => void;
    isCancelLoading: boolean;
    isReturnConfirmationModalOpen: boolean;
    setIsReturnConfirmationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConfirmationModalOpen: boolean;
    cancelOrder: (orderId: string) => Promise<void>;
    setIsConfirmationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
const TrackingMobile = ({
    shipmentDetails,
    handleDownloadInvoice: _handleDownloadInvoice,
    isDownloading: _isDownloading,
    handleDownloadLabel,
    isDownloadingLabel,
    handleReturnShipment,
    isCancelLoading,
    isReturnConfirmationModalOpen,
    setIsReturnConfirmationModalOpen,
    cancelOrder,
    isConfirmationModalOpen,
    setIsConfirmationModalOpen,
}: TrackingMobileProps) => {
    const orderDetails = [
        { label: 'Order ID', value: shipmentDetails.corporateTxnId },
        { label: 'Total Weight', value: `${shipmentDetails.weight} Kg` },
        { label: 'No. of Items', value: shipmentDetails.items.length },
        {
            label: 'Total Amount',
            value: `₹${formatNumberWithLocalString(shipmentDetails.amount)}`,
        },
    ];
    const returnData = shipmentDetails?.returnDetails;
    const returnDetails = returnData && [
        { label: 'Order ID', value: returnData.corporateTxnId },
        { label: 'Total Weight', value: `${shipmentDetails.weight} Kg` },
        { label: 'No. of Items', value: shipmentDetails.items.length },
        {
            label: 'Total Amount',
            value: `₹${formatNumberWithLocalString(returnData.amount)}`,
        },
    ];
    const shipper = {
        Name: shipmentDetails.senderAddress?.name,
        Line1: shipmentDetails.senderAddress?.addressLine,
        City: shipmentDetails.senderAddress?.city,
        CountryName: shipmentDetails.senderAddress?.countryName || 'United Arab Emirates',
        PostCode: shipmentDetails.senderAddress?.postCode || '',
        Mobile: shipmentDetails.senderAddress?.mobile,
        Email: shipmentDetails.senderAddress?.email || '',
    };
    const receiver = {
        Name: shipmentDetails.receiverAddress?.name,
        Line1: shipmentDetails.receiverAddress?.addressLine,
        City: shipmentDetails.receiverAddress?.city,
        CountryName: shipmentDetails.receiverAddress?.countryName,
        PostCode: shipmentDetails.receiverAddress?.postCode || '',
        Mobile: shipmentDetails.receiverAddress?.mobile,
        Email: shipmentDetails.receiverAddress?.email || '',
    };
    const { items } = shipmentDetails;
    const [showMore, setshowMore] = useState<boolean>(false);
    return (
        <Content>
            <Card className="rounded-lg  border border-[#EAEAEA]">
                <Flex vertical gap={10}>
                    <Text className="text-base font-semibold">Order Details</Text>
                    {orderDetails.map(item => (
                        <Flex key={item.label} justify="space-between" align="start">
                            <Text className="text-textGrey">{item.label}</Text>
                            <Flex vertical className="text-right">
                                {String(item.value)
                                    .split(',')
                                    .map((val, idx) => (
                                        <Text
                                            key={idx}
                                            className={`${
                                                item.label === 'Total Amount'
                                                    ? 'text-lg font-semibold'
                                                    : 'text-textGrey'
                                            }`}
                                        >
                                            {val.trim()}
                                        </Text>
                                    ))}
                            </Flex>
                        </Flex>
                    ))}
                    {returnData && (
                        <>
                            <Text className="text-base font-semibold">Return Details</Text>
                            {returnDetails &&
                                returnDetails.map(item => (
                                    <Flex key={item.label} justify="space-between" align="start">
                                        <Text className="text-textGrey">{item.label}</Text>
                                        <Flex vertical className="text-right">
                                            {String(item.value)
                                                .split(',')
                                                .map((val, idx) => (
                                                    <Text
                                                        key={idx}
                                                        className={`${
                                                            item.label === 'Total Amount'
                                                                ? 'text-lg font-semibold'
                                                                : 'text-textGrey'
                                                        }`}
                                                    >
                                                        {val.trim()}
                                                    </Text>
                                                ))}
                                        </Flex>
                                    </Flex>
                                ))}
                        </>
                    )}

                    {shipmentDetails.shipmentDetails.deliveryPartnerData && (
                        <Flex vertical gap={10}>
                            <Text className="text-base font-medium">Shipment Details</Text>
                            <Card
                                hoverable
                                styles={{ body: { padding: 0 } }}
                                className="rounded-2xl overflow-hidden border-0"
                            >
                                <Flex vertical className="h-full w-full p-4" gap={5}>
                                    <Flex>
                                        <Image
                                            preview={false}
                                            loading="lazy"
                                            src={
                                                shipmentDetails.shipmentDetails.deliveryPartnerData
                                                    .logo
                                            }
                                            fallback={defaultImage}
                                            alt={
                                                shipmentDetails.shipmentDetails.deliveryPartnerData
                                                    .courierName
                                            }
                                            style={{
                                                height: '40px',
                                                // width: '100px',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </Flex>
                                    <Text className="text-sm font-medium">
                                        {
                                            shipmentDetails.shipmentDetails.deliveryPartnerData
                                                .courierName
                                        }
                                    </Text>
                                    {/* deliveryType hidden — only accepting prepaid */}
                                    <Tag className="mt-1 w-fit rounded-full border-none bg-red-50 px-3 text-xs text-red-500">
                                        {
                                            shipmentDetails.shipmentDetails.deliveryPartnerData
                                                ?.serviceType
                                        }
                                        {
                                            // eslint-disable-next-line no-nested-ternary
                                            shipmentDetails.shipmentDetails.deliveryPartnerData
                                                ?.serviceType &&
                                            shipmentDetails.shipmentDetails.deliveryPartnerData
                                                ?.avgDeliveryTime
                                                ? ` - ${shipmentDetails.shipmentDetails.deliveryPartnerData.avgDeliveryTime}`
                                                : !shipmentDetails.shipmentDetails
                                                        .deliveryPartnerData?.serviceType &&
                                                    shipmentDetails.shipmentDetails
                                                        .deliveryPartnerData?.avgDeliveryTime
                                                  ? shipmentDetails.shipmentDetails
                                                        .deliveryPartnerData.avgDeliveryTime
                                                  : ''
                                        }
                                    </Tag>
                                </Flex>
                            </Card>
                        </Flex>
                    )}
                    {items?.map(
                        (item, index) =>
                            item && (
                                <Flex
                                    vertical
                                    className="mt-2 p-4 bg-bgLightestblue rounded-xl"
                                    key={index}
                                >
                                    <Text className="font-medium text-base">{item.name}</Text>
                                    {item.price && (
                                        <Flex className="mb-1 mt-2" justify="space-between">
                                            <Text className="text-textGrey ">
                                                Declared Item Value
                                            </Text>
                                            <Text className="">
                                                ₹
                                                {formatNumberWithLocalString(Number(item.price))}
                                            </Text>
                                        </Flex>
                                    )}
                                    {item.quantity && (
                                        <Flex className="mb-1" justify="space-between">
                                            <Text className="text-textGrey ">Item Quantity</Text>
                                            <Text className="">{item.quantity}</Text>
                                        </Flex>
                                    )}
                                </Flex>
                            )
                    )}
                    <Divider className="border-solid" />
                    <Text className="text-base font-medium">Sender Address</Text>
                    <Text className="text-textGrey leading-tight ">
                        {capitalize(shipper?.Name)}
                    </Text>
                    {shipper?.Mobile && (
                        <Text className="text-textGrey leading-tight">
                            Mobile: +91{shipper?.Mobile}
                        </Text>
                    )}
                    <Text className="text-textGrey leading-tight">
                        {shipper?.City}, {shipper?.CountryName}
                    </Text>
                    <Text className="text-textGrey leading-tight">{shipper?.Line1}</Text>
                    {shipper?.PostCode && (
                        <Text className="text-textGrey leading-tight">
                            P.O. Box or ZIP / PIN Code: {shipper?.PostCode}
                        </Text>
                    )}
                    <Text className="text-base font-medium mt-2">Receiver Address</Text>
                    <Text className="text-textGrey leading-tight">
                        {capitalize(receiver?.Name)}
                    </Text>
                    {receiver?.Mobile && (
                        <Text className="text-textGrey leading-tight">
                            Mobile: {receiver?.Mobile}
                        </Text>
                    )}
                    <Text className="text-textGrey leading-tight">
                        {receiver?.City}, {receiver?.CountryName}
                    </Text>
                    <Text className="text-textGrey leading-tight">{receiver?.Line1}</Text>
                    {receiver?.PostCode && (
                        <Text className="text-textGrey leading-tight">
                            P.O. Box or ZIP / PIN Code: {receiver?.PostCode}
                        </Text>
                    )}

                    <Flex align="center" gap={10} justify="center" className="mt-5">
                        {shipmentDetails.isReturnAllowed && (
                            <Button
                                className="w-full"
                                danger
                                onClick={() => setIsReturnConfirmationModalOpen(true)}
                            >
                                Return Shipment
                            </Button>
                        )}
                        {shipmentDetails.isCancelAllowed && (
                            <Button
                                className="w-full"
                                danger
                                onClick={() => setIsConfirmationModalOpen(true)}
                            >
                                Cancel order
                            </Button>
                        )}
                        {shipmentDetails.trackingUrl && (
                            <Button
                                danger
                                className="w-full"
                                onClick={() => window.open(shipmentDetails.trackingUrl, '_blank')}
                            >
                                Track
                            </Button>
                        )}
                        {(shipmentDetails.shipmentId || shipmentDetails.vendorOrderId) && (
                            <Button
                                danger
                                className="w-full"
                                loading={isDownloadingLabel}
                                onClick={() => handleDownloadLabel(shipmentDetails.corporateTxnId)}
                            >
                                Download Label
                            </Button>
                        )}
                    </Flex>
                </Flex>
            </Card>
            {_isDownloading && (
                <Flex
                    justify="center"
                    align="center"
                    className="fixed inset-0 bg-white bg-opacity-70 z-50"
                >
                    <LoadingOutlined spin className="text-4xl text-brandColor" />
                </Flex>
            )}

            <Flex
                justify="space-between"
                align="center"
                className="mt-10 mb-5 bg-bgLightestGrey py-4 px-6  -mx-5"
            >
                <Flex vertical align="start">
                    <Flex className="text-lg font-medium sm:text-lg ">Shipment Tracking</Flex>
                    <Flex>
                        <Flex className="font-normal text-neutral-900 text-xs">
                            Tracking Number:
                        </Flex>
                        <Flex className="font-semibold text-red-500 text-xs ps-1">
                            {shipmentDetails.trackingNo || 'N/A'}
                        </Flex>
                    </Flex>
                </Flex>
                {!showMore ? (
                    <DownOutlined className="text-lg" onClick={() => setshowMore(true)} />
                ) : (
                    <UpOutlined className="text-lg" onClick={() => setshowMore(false)} />
                )}
            </Flex>
            {showMore && (
                <Flex vertical>
                    {Array.isArray(shipmentDetails?.trackingDetails) &&
                    shipmentDetails!.trackingDetails!.length > 0 ? (
                        <TrackingTimeline trackerData={shipmentDetails.trackingDetails} />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No updates" />
                    )}
                </Flex>
            )}
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                handleCancel={() => setIsConfirmationModalOpen(false)}
                title="Order Cancellation"
                description="Are you sure you want to cancel your order?"
                handleSubmit={async () => {
                    await cancelOrder(shipmentDetails.corporateTxnId || '');
                    setIsConfirmationModalOpen(false);
                }}
                isLoading={isCancelLoading}
            />
            <ConfirmationModal
                isOpen={isReturnConfirmationModalOpen}
                handleCancel={() => setIsReturnConfirmationModalOpen(false)}
                title="Return Shipment"
                description="Are you sure you want to return the shipment?"
                handleSubmit={async () => {
                    handleReturnShipment();
                    setIsReturnConfirmationModalOpen(false);
                }}
                isLoading={isCancelLoading}
            />
        </Content>
    );
};

export default TrackingMobile;
