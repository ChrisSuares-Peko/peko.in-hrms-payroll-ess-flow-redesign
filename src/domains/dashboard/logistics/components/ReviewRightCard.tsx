import { Button, Divider, Flex, Form, Typography, theme } from 'antd';
import { Formik } from 'formik';
import { Link } from 'react-router-dom';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';

import { BoldText, GrayText } from './CustomText';
import useForm from '../hooks/useForm';
import { agreementSchema } from '../schema/index';
import { shippingAmount as shippingAmountType } from '../types/index';
import { formalTextFormatter } from '../utils/helperFunctions';

const { Text } = Typography;

const ReviewRightCard = ({ charges, city }: shippingAmountType) => {
    const { handleLogisticsSubmission } = useForm();
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <Flex gap={20} vertical justify="space-between" className="h-full mt-4 sm:mt-0 ">
            <Flex
                justify="center"
                className="px-3 py-3 rounded-sm sm:rounded-md border-[1px] border-green-200 bg-green-50 "
            >
                <Text className="text-[.9rem] text-left font-normal text-textGreenTitle px-3">
                    Note: Book Now and an agent will pick up the parcel/document from your address
                </Text>
            </Flex>

            <Formik
                enableReinitialize
                initialValues={{
                    agreementOne: false,
                    agreementTwo: false,
                }}
                validationSchema={agreementSchema}
                onSubmit={values => {
                    handleLogisticsSubmission();
                }}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
                        <CheckboxInput name="agreementOne" isRequired classes="">
                            <Text className="text-xs text-neutral-500">
                                {' '}
                                I have read and prepared all the documents required to send this
                                order to {formalTextFormatter(city)}
                            </Text>
                        </CheckboxInput>
                        <CheckboxInput name="agreementTwo" isRequired>
                            <Text className="text-xs text-neutral-500">
                                I accept the shipping{' '}
                                <Link
                                    className="text-gray-500"
                                    style={{
                                        color: 'gray',
                                        textDecoration: 'underline',
                                        WebkitTextUnderlinePosition: 'under',
                                    }}
                                    target="_blank"
                                    to="https://www.aramex.com/nl/en/aramex-conditions-of-carriage-terms-and-conditions"
                                >
                                    terms & conditions
                                </Link>{' '}
                                and the shield
                            </Text>
                        </CheckboxInput>

                        <Flex
                            gap={20}
                            vertical
                            className="px-8 py-6 border rounded-md border-stone-300 sm:rounded-xl"
                        >
                            <Text className="text-lg font-medium text-zinc-900">Total Amount</Text>
                            <Flex justify="space-between">
                                <GrayText text="Sub-total" />
                                <BoldText text={`₹ ${charges}`} />
                            </Flex>
                            <Divider />
                            <Flex justify="space-between">
                                <BoldText text="Total" />
                                <BoldText text={`₹ ${charges}`} />
                            </Flex>

                            <Button
                                style={{ backgroundColor: colorPrimary, color: 'white' }}
                                htmlType="submit"
                                type="primary"
                                className="w-full"
                            >
                                Pay Now
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default ReviewRightCard;
