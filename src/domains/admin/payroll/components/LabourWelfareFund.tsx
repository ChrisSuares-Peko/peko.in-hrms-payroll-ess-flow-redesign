import React from 'react';

import { Button, Flex, Form, Skeleton } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

// import { payrollSettingsSchema } from '../../schema/hrSettings';

type LWFProps = {
    setActiveTabKey?: any;
    data: any;
};

const AddLabWelfare: React.FC<LWFProps> = ({ setActiveTabKey, data }) => {
    const isLoading = false;
    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical gap={20} className="pt-6">
            <Formik
                initialValues={{
                    deductionCycle: data?.deductionCycle || '',
                    employeeContribution: data?.employeeContribution || 0,
                    employerContribution: data?.employerContribution || 0,
                }}
                enableReinitialize
                // validationSchema={labWelfareSchema}
                onSubmit={async (values, { resetForm }) => {}}
            >
                {({ handleSubmit, isSubmitting, setFieldValue, values }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Flex vertical>
                            <Flex>
                                <TextInput
                                    name="employeeContribution"
                                    placeholder="Enter employees contribution"
                                    label="Employees Contribution"
                                    type="text"
                                    classes="w-full md:w-[18rem]"
                                    allowNumbersAndDots
                                />
                            </Flex>
                            <Flex>
                                <TextInput
                                    name="employerContribution"
                                    placeholder="Enter employer's contribution"
                                    label="Employer Contribution"
                                    type="text"
                                    classes="w-full md:w-[18rem]"
                                    allowNumbersAndDots
                                />
                            </Flex>
                        </Flex>

                        <Flex className="mt-12">
                            <Button className="px-4 mr-4" type="primary" danger htmlType="submit">
                                Save
                            </Button>
                            <Button type="default" htmlType="button" className="px-4">
                                Cancel
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default AddLabWelfare;
