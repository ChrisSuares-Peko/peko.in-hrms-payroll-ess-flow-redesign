import React from 'react';

import { Button, Flex, Form } from 'antd';
import { Formik } from 'formik';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';

import truckDeliveryIcon from '../../assets/icons/eInvoice/truck-delivery.svg';
import { eWaybillInitialValues, E_WAYBILL_RULES } from '../../constants/eWaybill';
import EWaybillForm from '../../forms/EWaybillForm';
import { eWaybillSchema } from '../../schema/eWaybillSchema';
import { EWaybillFormValues } from '../../types/eWaybill';
import AlertCard from '../shared/AlertCard';
import LeftHeader from '../shared/LeftHeader';

interface Props {
    onCancel?: () => void;
    onSubmit?: (values: EWaybillFormValues) => void | Promise<void>;
    submitDisabled?: boolean;
}

const TransportDetailsCard: React.FC<Props> = ({ onCancel, onSubmit, submitDisabled }) => (
    <Formik
        initialValues={eWaybillInitialValues}
        validationSchema={eWaybillSchema}
        onSubmit={async (values, helpers) => {
            await onSubmit?.(values);
            helpers.setSubmitting(false);
        }}
    >
        {({ handleSubmit, isSubmitting }) => (
            <Form layout="vertical" onFinish={() => handleSubmit()} className="w-full">
                <Flex
                    vertical
                    gap={16}
                    className="w-full p-5 md:p-6 bg-white rounded-2xl border border-[#E4E4E7]"
                >
                    <LeftHeader title="Transport Details" />

                    <EWaybillForm />

                    <AlertCard
                        variant="info"
                        title="E-Waybill Rules:"
                        description={
                            <Flex vertical>
                                {E_WAYBILL_RULES.map(rule => (
                                    <Flex key={rule} gap={6} align="flex-start">
                                        <TypographyText className="leading-5 flex-shrink-0 text-[#F59E0B]">
                                            •
                                        </TypographyText>
                                        <TypographyText className="leading-5 text-[#F59E0B]">
                                            {rule}
                                        </TypographyText>
                                    </Flex>
                                ))}
                            </Flex>
                        }
                    />

                    <Flex gap={10} className='flex-col xs375:flex-row'>
                        <Button
                            block
                            onClick={onCancel}
                            className="border-[#FF4F4F] text-[#FF4F4F]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            danger
                            loading={isSubmitting}
                            disabled={submitDisabled}
                            className='!flex items-center justify-center'
                        >
                           <ReactSVG src={truckDeliveryIcon} /> Generate E-Waybill
                        </Button>
                    </Flex>
                </Flex>
            </Form>
        )}
    </Formik>
);

export default TransportDetailsCard;
