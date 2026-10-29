import { Button, Card, Checkbox, Col, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { useAppSelector } from '@src/hooks/store';
import { RootState } from '@store/store';

import PackageDetails from './PackageDetails';
import { ShipmentFormValues } from '../../types';


const { Text } = Typography;

const AddressRow = ({ label, value, odd }: { label: string; value?: string; odd: boolean }) => (
    <div className={`flex items-center px-4 py-3 ${odd ? 'bg-gray-50' : 'bg-white'}`}>
        <span className="w-2/5 text-sm text-gray-500 shrink-0">{label}</span>
        <span className="w-3/5 text-sm text-gray-800 font-medium">{value || '—'}</span>
    </div>
);

const AddressCard = ({ title, rows }: { title: string; rows: { label: string; value?: string }[] }) => (
    <Card
        title={<Text className="font-semibold text-base">{title}</Text>}
        className="rounded-2xl shadow-sm overflow-hidden"
    >
        <div className="divide-y divide-gray-100">
            {rows.map((row, i) => (
                <AddressRow key={row.label} label={row.label} value={row.value} odd={i % 2 === 0} />
            ))}
        </div>
    </Card>
);

type Props = {
    isLoading: boolean;
};

const ShipmentFormContent = ({ isLoading }: Props) => {
    const { values, setFieldValue, errors, touched } = useFormikContext<ShipmentFormValues>();
    const { originAddress, destinationAddress, shipmentDetails } = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3
    );
    const { originCity, destinationCity } = shipmentDetails;

    return (
        <>
            <Row gutter={[40, 24]} className="mt-4">
                <Col xs={24} md={12}>
                    <AddressCard
                        title="Origin Address"
                        rows={[
                            { label: 'Full Name', value: originAddress.senderName },
                            { label: 'Email', value: values.senderEmail },
                            { label: 'Mobile Number', value: originAddress.senderPhone },
                            { label: 'PIN Code', value: originAddress.senderZipCode },
                            { label: 'State', value: originCity?.state },
                            { label: 'City', value: originCity?.city },
                            { label: 'Address Line 1', value: originAddress.senderAddressLine },
                            ...(values.senderAddressLine2 ? [{ label: 'Address Line 2', value: values.senderAddressLine2 }] : []),
                        ]}
                    />
                </Col>

                <Col xs={24} md={12}>
                    <AddressCard
                        title="Destination Address"
                        rows={[
                            { label: 'Full Name', value: destinationAddress.receiverName },
                            { label: 'Email', value: values.receiverEmail },
                            { label: 'Mobile Number', value: destinationAddress.receiverPhone },
                            { label: 'PIN Code', value: destinationAddress.receiverZipCode },
                            { label: 'State', value: destinationCity?.state },
                            { label: 'City', value: destinationCity?.city },
                            { label: 'Address Line 1', value: destinationAddress.receiverAddressLine },
                            ...(values.receiverAddressLine2 ? [{ label: 'Address Line 2', value: values.receiverAddressLine2 }] : []),
                        ]}
                    />
                </Col>
            </Row>

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

            <Button danger type="primary" htmlType="submit" loading={isLoading} className="mt-4">
                Pay Now
            </Button>
        </>
    );
};

export default ShipmentFormContent;
