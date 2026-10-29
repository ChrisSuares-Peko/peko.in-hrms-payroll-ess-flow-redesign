import { Button, Col, Flex, Form, Row } from 'antd';
import { Formik } from 'formik';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useModification from '../../hooks/airline/useModification';
import { airlinePriceUpdateSchema } from '../../schema/airline';

const Additional = ({
    data,
    bookingId,
    getAllTableData,
}: {
    data: any;
    bookingId: string | number;
    getAllTableData: () => void;
}) => {
    const dispatch = useAppDispatch();
    const {
        flightBooking: {
            fare: { totalFare },
        },
        modificationStatus,
        credential: { email },
    } = data || {};
    const { isLoading, saveUpdatedTicketPrice } = useModification(getAllTableData);
    const handlePriceUpdate = async (values: any) => {
        const res = await saveUpdatedTicketPrice({ bookingId, ...values });
        if (res) {
            dispatch(
                showToast({
                    description: 'Price quote updated and payment link sent.',
                    variant: 'success',
                })
            );
            getAllTableData();
        }
    };
    const newPrice = parseFloat(data.additionalPayment) + parseFloat(totalFare);
    const readonly = modificationStatus !== 'MODIFICATION_REQUESTED';
    return (
        <Formik
            initialValues={{
                oldPrice: totalFare || '',
                newPrice: newPrice || '',
                additionalPayment: parseFloat(data.additionalPayment) || '',
                email: email || '',
                adminComments: data.adminComments || '',
            }}
            validationSchema={airlinePriceUpdateSchema}
            onSubmit={handlePriceUpdate}
        >
            {({ handleSubmit, setFieldValue }) => (
                <Form
                    onFinish={handleSubmit}
                    layout="vertical"
                    className="w-full"
                    style={{ padding: '20px' }}
                >
                    <Row gutter={[20, 5]}>
                        <Col span={24} sm={12} lg={9}>
                            <TextInput
                                label="Old Price"
                                name="oldPrice"
                                placeholder="Old Price"
                                type="text"
                                maxLength={12}
                                isDisabled
                                allowTwoDecimalsOnly
                                isRequired
                            />
                        </Col>
                        <Col span={24} sm={12} lg={9}>
                            <TextInput
                                label="New Price"
                                name="newPrice"
                                placeholder="New Price"
                                type="text"
                                maxLength={12}
                                allowTwoDecimalsOnly
                                handleChange={v => {
                                    const additionalPayment2 = (
                                        parseFloat(v) - parseFloat(totalFare)
                                    ).toFixed(2);
                                    setFieldValue(
                                        'additionalPayment',
                                        Math.max(0, parseFloat(additionalPayment2)) || ''
                                    );
                                }}
                                isDisabled={readonly}
                                isRequired
                            />
                        </Col>
                        <Col span={24} sm={12} lg={9}>
                            <TextInput
                                label="Additional Payment"
                                name="additionalPayment"
                                placeholder="Additional Payment"
                                type="text"
                                allowTwoDecimalsOnly
                                maxLength={12}
                                handleChange={v => {
                                    const newPrice2 = (
                                        parseFloat(totalFare) + parseFloat(v)
                                    ).toFixed(2);
                                    setFieldValue('newPrice', parseFloat(newPrice2) || '');
                                }}
                                isDisabled={readonly}
                                isRequired
                            />
                        </Col>
                        <Col span={24} sm={12} lg={9}>
                            <TextInput
                                label="Customer Email ID"
                                name="email"
                                placeholder="Email ID"
                                type="text"
                                allowEmailsOnly
                                maxLength={50}
                                isDisabled={readonly}
                                isRequired
                            />
                        </Col>
                        <Col span={24} lg={18}>
                            <TextAreaInput
                                name="adminComments"
                                label="Admin Comments (Optional)"
                                placeholder="Comments"
                                maxLength={10000} // large number because admin need to updatre
                                minRows={6}
                                isDisabled={readonly}
                            />
                        </Col>
                    </Row>
                    <Flex gap={10} justify="" className="mt-3">
                        <Button
                            type="primary"
                            danger
                            htmlType="submit"
                            loading={isLoading}
                            disabled={readonly}
                        >
                            Send Modified Price Quote
                        </Button>
                    </Flex>
                </Form>
            )}
        </Formik>
    );
};

export default Additional;
