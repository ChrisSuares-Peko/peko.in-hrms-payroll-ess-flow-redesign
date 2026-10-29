import React, { useRef, useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik, FormikProps } from 'formik';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { RootState } from '@store/store';

import { checkBusinessPanApi } from '../api';
import DeliveryCard from '../components/details/DeliveryCard';
import DeliveryCardSm from '../components/details/DeliveryCardSm';
import ShipmentFormContent from '../components/details/ShipmentFormContent';
import ShipmentFormContentSm from '../components/details/ShipmentFormContentSm';
import UploadBusinessPanModal from '../components/details/UploadBusinessPanModal';
import usePayment from '../hooks/usePayment';
import { getShipmentDetailsSchema } from '../schema';

const { Text } = Typography;
const ShipmentDetails = () => {
    const { isLoading, handleLogisticsSubmission } = usePayment();
    const {
        selectedDeliveryCompany: selectedCompany,
        originAddress,
        destinationAddress,
        shipmentType,
    } = useAppSelector((state: RootState) => state.reducer.logisticsV3);
    const { role, id } = useAppSelector((state: RootState) => state.reducer.auth);
    const isInternational = shipmentType === 'international';
    const { xs } = useScreenSize();
    const formikRef = useRef<FormikProps<any>>(null);
    const [panModalOpen, setPanModalOpen] = useState(false);
    const [isCheckingPan, setIsCheckingPan] = useState(false);
    const pendingValuesRef = useRef<any>(null);
    const { shipmentDetails: details } = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3
    );
    const { height, length, weight, width, destinationCity, originCity } = details;

    return (
        <Content className="px-0 mb-8 w-full xl:w-[80%] xxl:w-[70%]">
            <Flex>
                <Text className="text-xl font-medium">Create Shipment</Text>
            </Flex>
            {selectedCompany && xs ? (
                <DeliveryCardSm company={selectedCompany} />
            ) : (
                selectedCompany && <DeliveryCard company={selectedCompany} />
            )}
            <UploadBusinessPanModal
                open={panModalOpen}
                onCancel={() => setPanModalOpen(false)}
                onContinue={(panUrl) => {
                    setPanModalOpen(false);
                    if (pendingValuesRef.current) {
                        handleLogisticsSubmission({ ...pendingValuesRef.current, businessPanUrl: panUrl });
                        pendingValuesRef.current = null;
                    }
                }}
            />

            <Formik
                innerRef={formikRef}
                initialValues={{
                    senderAddressId: originAddress.senderAddressId || null,
                    senderName: originAddress.senderName || '',
                    senderPhone: originAddress.senderPhone || '',
                    senderEmail: originAddress.senderEmail || '',
                    senderAddressLine: originAddress.senderAddressLine || '',
                    senderAddressLine2: originAddress.senderAddressLine2 || '',
                    senderZipCode: originAddress.senderZipCode || '',
                    receiverAddressId: destinationAddress.receiverAddressId || null,
                    receiverName: destinationAddress.receiverName || '',
                    receiverPhone: destinationAddress.receiverPhone || '',
                    receiverEmail: destinationAddress.receiverEmail || '',
                    receiverAddressLine: destinationAddress.receiverAddressLine || '',
                    receiverAddressLine2: destinationAddress.receiverAddressLine2 || '',
                    receiverZipCode: destinationAddress.receiverZipCode || '',
                    receiverPhoneCode: destinationAddress.receiverPhoneCode || '+91',
                    items: [
                        {
                            name: '',
                            price: '',
                            quantity: '',
                            hsn: '',
                        },
                    ],
                    senderSaveAddress: false,
                    recieverSaveAddress: false,
                    consentAgreed: false,
                }}
                enableReinitialize
                onSubmit={async values => {
                    const serviceDetails = {
                        vendor_name: selectedCompany?.courierName,
                        origin_city: originCity?.city,
                        destination_city: destinationCity?.city,
                        width,
                        weight,
                        length,
                        height,
                        price: selectedCompany?.price,
                    };
                    sessionStorage.setItem(
                        'service_details',
                        JSON.stringify({ serviceDetails })
                    );
                    setIsCheckingPan(true);
                    const panAlreadyUploaded = await checkBusinessPanApi({ userType: role, userId: id });
                    setIsCheckingPan(false);
                    if (!panAlreadyUploaded) {
                        pendingValuesRef.current = values;
                        setPanModalOpen(true);
                    } else {
                        handleLogisticsSubmission(values);
                    }
                }}
                validationSchema={getShipmentDetailsSchema(isInternational)}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" className="w-full" onFinish={handleSubmit}>
                        {xs ? (
                            <ShipmentFormContentSm isLoading={isLoading || isCheckingPan} />
                        ) : (
                            <ShipmentFormContent isLoading={isLoading || isCheckingPan} />
                        )}
                    </Form>
                )}
            </Formik>
        </Content>
    );
};

export default ShipmentDetails;
