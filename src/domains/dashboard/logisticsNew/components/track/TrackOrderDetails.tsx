import React from 'react';

import { Card, Col, Divider, Empty, Flex, Image, Row, Tag, Typography } from 'antd';
import { capitalize } from 'lodash';

import ItemsTable from './ItemsTable';
import ReturnTable from './ReturnTable';
import TrackingTimeline from './TrackerStatus';
import TrackingTable from './TrackingTable';
import defaultImage from '../../assets/images/defaultImage.png';
import { Shipment } from '../../types/tracking';

const { Text } = Typography;
interface TrackOrderDetailsProps {
    shipmentDetails: Shipment;
    mobileNumberFormatter: (mobileNumber?: string | undefined) => string | null
}

const TrackOrderDetails: React.FC<TrackOrderDetailsProps> = ({ shipmentDetails,mobileNumberFormatter }) => {
    const shipper = {
        Name: shipmentDetails?.senderAddress?.name,
        Line1: shipmentDetails?.senderAddress?.addressLine,
        City: shipmentDetails?.senderAddress?.city,
        CountryName: shipmentDetails?.senderAddress?.countryName || 'United Arab Emirates',
        PostCode: shipmentDetails?.senderAddress?.postCode || '',
        Mobile: shipmentDetails?.senderAddress?.mobile,
    };
    const receiver = {
        Name: shipmentDetails?.receiverAddress?.name,
        Line1: shipmentDetails?.receiverAddress?.addressLine,
        City: shipmentDetails?.receiverAddress?.city,
        CountryName: shipmentDetails?.receiverAddress?.countryName,
        PostCode: shipmentDetails?.receiverAddress?.postCode || '',
        Mobile: shipmentDetails?.receiverAddress?.mobile,
    };
    return (
        <Row align="top" gutter={[40, 40]}>
            <Col sm={24} xl={16} className="mt-2">
                <TrackingTable data={shipmentDetails} />
                <ItemsTable data={shipmentDetails.items} />
                {shipmentDetails?.returnDetails && (
                    <ReturnTable
                        Shipmentdata={shipmentDetails}
                        Returndata={shipmentDetails?.returnDetails}
                    />
                )}
                <Flex vertical>
                    <Flex className="text-sm font-medium sm:text-lg">Shipment Tracking</Flex>
                    <Flex className="mt-5 mb-7">
                        <Flex className="font-normal text-neutral-900 text-4">
                            Tracking Number:
                        </Flex>
                        <Flex className="font-semibold text-red-500 text-4 ps-1">
                            {shipmentDetails.trackingNo || 'N/A'}
                        </Flex>
                    </Flex>
                    {Array.isArray(shipmentDetails?.trackingDetails) &&
                    shipmentDetails!.trackingDetails!.length > 0 ? (
                        <TrackingTimeline trackerData={shipmentDetails.trackingDetails} />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No updates" />
                    )}
                </Flex>
            </Col>

            {/* Right Box */}
            <Col sm={24} xl={8} className="mt-6">
                <Flex
                    vertical
                    style={{ backgroundColor: '#FAFAFA' }}
                    className="px-6 border rounded-md py-5 border-stone-200"
                >
                    {shipmentDetails.shipmentDetails.deliveryPartnerData && (
                        <Flex vertical>
                            <Text className="text-base font-medium">Shipment Details</Text>
                            <Card
                                styles={{ body: { padding: 0 } }}
                                className="mt-5 rounded-xl overflow-hidden border-0"
                            >
                                <Flex vertical align="center" className="h-full w-full p-4" gap={8}>
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

                    <Text className="text-base mt-3 font-medium">Address Details</Text>
                    <Flex vertical className="mt-3 p-4 bg-white rounded-xl">
                        <Text className="font-medium text-base">Sender Address</Text>
                        <Text className="text-textGrey leading-tight ">
                            {capitalize(shipper?.Name)}
                        </Text>
                        {shipper?.Mobile && (
                            <Text className="text-textGrey leading-tight">
                                Mobile: {mobileNumberFormatter(shipper?.Mobile)}
                            </Text>
                        )}
                        <Text className="text-textGrey leading-tight">
                            {shipper?.City}
                            {shipper?.City && ','} {shipper?.CountryName}
                        </Text>
                        <Text className="text-textGrey leading-tight">{shipper?.Line1}</Text>
                        {shipper?.PostCode && (
                            <Text className="text-textGrey leading-tight">
                                P.O. Box or ZIP / PIN Code: {shipper?.PostCode}
                            </Text>
                        )}

                        <Divider />
                        <Text className="font-medium text-base">Receiver Address</Text>
                        <Text className="text-textGrey leading-tight ">
                            {capitalize(receiver?.Name)}
                        </Text>
                        {receiver?.Mobile && (
                            <Text className="text-textGrey leading-tight">
                                Mobile: {mobileNumberFormatter(receiver?.Mobile)}
                            </Text>
                        )}
                        <Text className="text-textGrey leading-tight">
                            {receiver?.City}
                            {shipper?.City && ','} {receiver?.CountryName}
                        </Text>
                        <Text className="text-textGrey leading-tight">{receiver?.Line1}</Text>
                        {receiver?.PostCode && (
                            <Text className="text-textGrey leading-tight">
                                P.O. Box or ZIP / PIN Code: {receiver?.PostCode}
                            </Text>
                        )}
                    </Flex>
                </Flex>
            </Col>
        </Row>
    );
};

export default TrackOrderDetails;
