import { Button, Col, Flex, Form, Row, Skeleton } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import useEmployeeInfoApi from '../../hooks/employeeOnboardingHooks/useUpdateEmployeeApi';
import { bankSchema } from '../../schema/employeeProfile';

type Props = {
    nextTab: (key: string) => void;
    formData: any;
    setFormData: (data: any) => void;
    // setLoading: (loading: boolean) => void;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loading: boolean;
};

const BankDetails = ({ nextTab, formData, setFormData, setLoading, loading }: Props) => {
    const { updateBankInformation } = useEmployeeInfoApi();

    const { bankDetails, isLoading } = useAppSelector(state => state.reducer.employeeSettings);

    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical className=" my-8">
            <Formik
                initialValues={{
                    accountName: bankDetails?.accountName || '',
                    accountNumber: bankDetails?.accountNumber || '',
                    bankName: bankDetails?.bankName || '',
                    ifscCode: bankDetails?.ifscCode || '',
                }}
                onSubmit={async (values, { resetForm }) => {
                    await updateBankInformation(values);
                }}
                validationSchema={bankSchema}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Flex justify="center">
                            <Col span={16}>
                                <Row>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Account Holder Name"
                                            name="accountName"
                                            placeholder="Account Holder Name"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            minLength={3}
                                            isRequired
                                        />
                                    </Col>

                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Account Number"
                                            name="accountNumber"
                                            placeholder="Account Number"
                                            type="text"
                                            allowNumbersOnly
                                            maxLength={16}
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Bank Name"
                                            name="bankName"
                                            placeholder="Bank Name"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            minLength={3}
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="IFSC Code"
                                            name="ifscCode"
                                            placeholder="IFSC Code"
                                            type="text"
                                            allowAlphabetsAndNumbersOnly
                                            maxLength={11}
                                            allowUpperCaseOnly
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                                <Flex justify="space-between" className=" mt-4 mx-8">
                                    <Button
                                        onClick={() => nextTab('4')}
                                        type="default"
                                        danger
                                        className=" font-semibold w-[8rem] "
                                    >
                                        Back
                                    </Button>

                                    <Button
                                        htmlType="submit"
                                        type="primary"
                                        danger
                                        className=" font-semibold w-[8rem] "
                                    >
                                        Create
                                    </Button>
                                </Flex>
                            </Col>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default BankDetails;
