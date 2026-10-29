import React from 'react';

import { Button, Card, Checkbox, Form, Input, Typography } from 'antd';
import { useFormikContext } from 'formik';


import { useAppSelector } from '@src/hooks/store';
import { RootState } from '@store/store';

import PackageDetails from './PackageDetails';
import { ShipmentFormValues } from '../../types';

const { Text } = Typography;

const AddressField = ({ label, value }: { label: string; value?: string }) => (
    <Form.Item label={<span className="text-xs text-gray-500">{label}</span>} className="mb-3">
        <Input value={value || ''} disabled />
    </Form.Item>
);

type Props = {
    isLoading: boolean;
};

const ShipmentFormContentSm = ({ isLoading }: Props) => {
    const { values, setFieldValue, errors, touched } = useFormikContext<ShipmentFormValues>();
    const { originAddress, destinationAddress, shipmentDetails } = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3
    );
    const { originCity, destinationCity } = shipmentDetails;

    return (
        <>
            <Card
                title={<Text className="font-semibold text-base">Origin Address</Text>}
                className="rounded-2xl shadow-sm mt-4"
                styles={{ body: { padding: '16px 20px' } }}
            >
                <Form layout="vertical">
                    <AddressField label="Full Name*" value={originAddress.senderName} />
                    <AddressField label="Email" value={values.senderEmail} />
                    <AddressField label="Mobile Number" value={originAddress.senderPhone} />
                    <AddressField label="PIN Code" value={originAddress.senderZipCode} />
                    <AddressField label="State" value={originCity?.state} />
                    <AddressField label="City" value={originCity?.city} />
                    <AddressField label="Address Line 1" value={originAddress.senderAddressLine} />
                    {values.senderAddressLine2 && <AddressField label="Address Line 2" value={values.senderAddressLine2} />}
                </Form>
            </Card>

            <Card
                title={<Text className="font-semibold text-base">Destination Address</Text>}
                className="rounded-2xl shadow-sm mt-4"
                styles={{ body: { padding: '16px 20px' } }}
            >
                <Form layout="vertical">
                    <AddressField label="Full Name*" value={destinationAddress.receiverName} />
                    <AddressField label="Email" value={values.receiverEmail} />
                    <AddressField label="Mobile Number" value={destinationAddress.receiverPhone} />
                    <AddressField label="PIN Code" value={destinationAddress.receiverZipCode} />
                    <AddressField label="State" value={destinationCity?.state} />
                    <AddressField label="City" value={destinationCity?.city} />
                    <AddressField label="Address Line 1" value={destinationAddress.receiverAddressLine} />
                    {values.receiverAddressLine2 && <AddressField label="Address Line 2" value={values.receiverAddressLine2} />}
                </Form>
            </Card>

            <hr className="mt-6 mb-0" />

            <PackageDetails />

            <div className="mt-4">
                <Checkbox
                    checked={values.consentAgreed}
                    onChange={e => setFieldValue('consentAgreed', e.target.checked)}
                >
                    <span className="text-sm text-gray-700">
                        By clicking on Continue, I accept the{' '}
                        <a href="https://www.shiprocket.in/merchant-agreement/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Terms &amp; Conditions
                        </a>
                        {' '}and{' '}
                        <a href="https://www.shiprocket.in/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </a>
                        .
                    </span>
                </Checkbox>
                {touched.consentAgreed && errors.consentAgreed && (
                    <div className="text-red-500 text-xs mt-1">{errors.consentAgreed}</div>
                )}
            </div>

            <Button danger type="primary" htmlType="submit" loading={isLoading} className="w-full mt-4">
                Pay Now
            </Button>
        </>
    );
};

export default ShipmentFormContentSm;
