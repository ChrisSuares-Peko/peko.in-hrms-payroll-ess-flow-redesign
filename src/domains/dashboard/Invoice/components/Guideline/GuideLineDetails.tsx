import { useCallback, useEffect, useState } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

// import { ReactSVG } from 'react-svg';
// import add from '@domains/dashboard/Invoice/assets/add.svg';
import { showToast } from '@src/slices/apiSlice';

import GuideLineForm2 from './GuideLineForm2';
import useGetAllGuidelines from '../../hooks/useGetAllGuidelines';
import { DaysSchema } from '../../schema';

type Props = {
    invoiceId: number;
    trackerData: any;
};
const { Text } = Typography;

const GuideLineDetails = ({ invoiceId, trackerData }: Props) => {
    const dispatch = useDispatch();
    const { guideline, updateGuideline, updateLoading } = useGetAllGuidelines(invoiceId);
  
    const createGuidelineObject = useCallback(
        (data?: any) => {
            const guidelineObject: any = {
                id: data?.id,
                actionDate: data?.actionDate || undefined,
                days: data?.days || '',
                sms: Boolean(data?.sms),
                email: Boolean(data?.email),
                notification: Boolean(data?.notification),
                invoiceId,
                status: data?.status,
            };
            if (data && data.templet) {
                guidelineObject.templet = data.templet;
            }
            return guidelineObject;
        },
        [invoiceId]
    );

    const [initialData, setInitialData] = useState([createGuidelineObject()]);

    useEffect(() => {
        if (guideline && guideline.length) {
            setInitialData(guideline.map(createGuidelineObject));
        }
    }, [guideline, createGuidelineObject]);

    const validateTemplates = (values: any) => {
        const isInvalid = values.data.some((item: any) => {
            if (!item.templet) return true;
            if (
                (item.email &&
                    (!item.templet.email ||
                        !item.templet.email.subject ||
                        !item.templet.email.body)) ||
                (item.sms && (!item.templet.sms || !item.templet.sms.body))
            ) {
                return true;
            }
            return false;
        });
        return isInvalid;
    };

    const isValidate = (values: any) => {
        const isvalid = values.data.some((item: any) => !item.sms && !item.email);
        return isvalid;
    };

    return (
        <Flex vertical>
            <Flex className="w-full mt-5" justify="space-between" align="center">
                <Text className="text-xl font-medium">Invoice Reminders</Text>
            </Flex>
            <Flex vertical>
                <Content className="hidden py-4 rounded-sm bg-gray-50 xl:block">
                    <Row>
                        <Col span={8} className="pl-2">
                            <Text className="text-sm font-medium ">Days</Text>
                        </Col>
                        <Col span={10} className="pl-2">
                            <Text className="text-sm font-medium">Action</Text>
                        </Col>
                        <Col span={4} className="pl-2">
                            <Text className="text-sm font-medium ">Template</Text>
                        </Col>
                        <Col span={2} className="pl-2">
                            <Text className="text-sm font-medium ">Status</Text>
                        </Col>
                    </Row>
                </Content>
                <Formik
                    initialValues={{ data: initialData }}
                    enableReinitialize
                    onSubmit={values => {
                        const isInvalid = validateTemplates(values);
                        const isValid = isValidate(values);
                        if (isValid) {
                            dispatch(
                                showToast({
                                    description: 'Please select the SMS or Email.',
                                    variant: 'error',
                                })
                            );
                        } else if (!isValid && isInvalid) {
                            dispatch(
                                showToast({
                                    description:
                                        'Please fill in at least one template(SMS or Email) for each item',
                                    variant: 'error',
                                })
                            );
                        } else {
                            // remove id from newly added guideline
                            values.data = values.data.map((curr: any) => {
                                if (typeof curr.id !== 'number') {
                                    delete curr.id;
                                }
                                return curr;
                            });
                            updateGuideline(values);
                        }
                    }}
                    validationSchema={DaysSchema}
                >
                    {({ handleSubmit }) => (
                        <GuideLineForm2
                            guideline={guideline}
                            handleSubmit={handleSubmit}
                            invoiceId={invoiceId}
                            loading={updateLoading}
                            dueDate={trackerData?.invoiceDetails?.dueDate}
                            status={trackerData?.status}
                        />
                    )}
                </Formik>
            </Flex>
        </Flex>
    );
};

export default GuideLineDetails;
