import React, { useState } from 'react';

import { Button, Flex, Skeleton, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import TrackingMobile from '../components/track/TrackingMobile';
import TrackOrderDetails from '../components/track/TrackOrderDetails';
import { useDownloadInvoice } from '../hooks/track/useDownloadInvoice';
import { useDownloadLabel } from '../hooks/track/useDownloadLabel';
import { useTrackShipmentApi } from '../hooks/track/useTrackShipmentApi';
import { updateSearchDetails, updateShipmentDetails } from '../slice/logisticsSlice';

const TrackShipment = () => {
    const location = useLocation();
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isReturnConfirmationModalOpen, setIsReturnConfirmationModalOpen] = useState(false);
    const searchParams = new URLSearchParams(location.search);
    const trackingNo = searchParams.get('trackingNo') || '';
    const { xs } = useScreenSize();
    const {
        cancelOrder,
        isCancelLoading,
        isLoading: trackShipmentLoading,
        shipmentDetails,
        mobileNumberFormatter
    } = useTrackShipmentApi(trackingNo);
    const { isLoading, handleDownloadInvoice } = useDownloadInvoice();
    const { isLoading: isDownloadingLabel, handleDownloadLabel } = useDownloadLabel();

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleReturnShipment = () => {
        if (!shipmentDetails) {
            return;
        }
        const { boxDimensions } = shipmentDetails.shipmentDetails;
        dispatch(
            updateShipmentDetails({
                originCity: {
                    city: shipmentDetails.receiverAddress.city,
                    countryName: shipmentDetails.receiverAddress.countryName,
                    countryCode: shipmentDetails.receiverAddress.countryCode,
                },
                destinationCity: {
                    city: shipmentDetails.senderAddress.city,
                    countryName: shipmentDetails.senderAddress.countryName,
                    countryCode: shipmentDetails.senderAddress.countryCode,
                },
                weight: boxDimensions.weight,
                length: boxDimensions.length,
                width: boxDimensions.width,
                height: boxDimensions.height,
                isReturn: true,
                deliveredTxnId: shipmentDetails.corporateTxnId,
            })
        );
        dispatch(
            updateSearchDetails({
                originCity: {
                    searchtext: shipmentDetails.receiverAddress.city,
                },
                destinationCity: {
                    searchtext: shipmentDetails.senderAddress.city,
                },
            })
        );
        setTimeout(() => {
            navigate(
                `/${paths.logistics.index}/${paths.logistics.orderHistory}/${paths.logistics.returnShipment}`
            );
        }, 100);
    };

    if (trackShipmentLoading || !shipmentDetails) {
        return <Skeleton active />;
    }

    if (xs) {
        return (
            <TrackingMobile
                shipmentDetails={shipmentDetails}
                handleDownloadInvoice={handleDownloadInvoice}
                isDownloading={isLoading}
                handleDownloadLabel={handleDownloadLabel}
                isDownloadingLabel={isDownloadingLabel}
                handleReturnShipment={handleReturnShipment}
                isCancelLoading={isCancelLoading}
                isReturnConfirmationModalOpen={isReturnConfirmationModalOpen}
                setIsReturnConfirmationModalOpen={setIsReturnConfirmationModalOpen}
                isConfirmationModalOpen={isConfirmationModalOpen}
                cancelOrder={cancelOrder}
                setIsConfirmationModalOpen={setIsConfirmationModalOpen}
            />
        );
    }
    return (
        <Flex style={{ position: 'relative' }} vertical gap={20} className="px-0 mb-8">
            {(isLoading || !shipmentDetails) && (
                <Flex className="absolute inset-0 items-center justify-center bg-white bg-opacity-50 z-10">
                    <Spin />
                </Flex>
            )}
            <Flex vertical gap={20} className="px-0 mb-8">
                <Flex vertical>
                    <Flex justify="space-between" align="end">
                        <Flex className="text-sm font-medium sm:text-lg">Order Details</Flex>
                        <Flex gap={10}>
                            {shipmentDetails.isReturnAllowed && (
                                <Button
                                    danger
                                    onClick={() => setIsReturnConfirmationModalOpen(true)}
                                >
                                    Return Shipment
                                </Button>
                            )}
                            {shipmentDetails.isCancelAllowed && (
                                <Button danger onClick={() => setIsConfirmationModalOpen(true)}>
                                    Cancel This Order
                                </Button>
                            )}
                            {shipmentDetails.trackingUrl && (
                                <Button
                                    danger
                                    onClick={() => window.open(shipmentDetails.trackingUrl, '_blank')}
                                >
                                    Track
                                </Button>
                            )}
                            {(shipmentDetails.shipmentId || shipmentDetails.vendorOrderId) && (
                                <Button
                                    danger
                                    loading={isDownloadingLabel}
                                    onClick={() =>
                                        handleDownloadLabel(shipmentDetails.corporateTxnId)
                                    }
                                >
                                    Download Label
                                </Button>
                            )}
                        </Flex>
                    </Flex>
                    <TrackOrderDetails shipmentDetails={shipmentDetails} mobileNumberFormatter={mobileNumberFormatter}/>
                </Flex>
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
            </Flex>
        </Flex>
    );
};

export default TrackShipment;
