import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Form, Typography, Button, Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

interface TDSModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
}

const TDSModal = ({ open, handleCancel, selectedRecordData }: TDSModalProps) => {
    const {
        name,
        email,
        taxRegime,
        taxableIncome,
        exemptions,
        netTaxableIncome,
        totalTaxPayable,
        monthlyTDSDeduction,
    } = selectedRecordData || {};

    const handleFormSubmit = async (_values: any) => {
        handleCancel();
    };

    return (
        <CustomModalWithForm
            modalTitle={
                <Flex justify="space-between" align="center">
                    <Typography.Text className="text-[#000000D9] font-semibold text-[1.2rem]">
                        TDS Details
                    </Typography.Text>
                    <Button
                        type="text"
                        icon={<CloseOutlined size={13} className="text-[#3F3F3F]" />}
                        onClick={handleCancel}
                    />
                </Flex>
            }
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{}}
            reinitialise
            hideFooter
        >
            {() => (
                <Form layout="vertical">
                    <Typography.Text className="font-medium text-[1.1rem]">
                        Employee Details
                    </Typography.Text>
                    <Flex vertical gap="small" className="my-3">
                        <Flex justify="space-between">
                            <Typography.Text className=" text-[#101828]">Name:</Typography.Text>
                            <Typography.Text className=" text-[#101828]">
                                {name || '-'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className=" text-[#101828]">Email:</Typography.Text>
                            <Typography.Text className=" text-[#101828]">
                                {email || '-'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className=" text-[#101828]">
                                Tax Regime:
                            </Typography.Text>
                            <Typography.Text className=" text-[#101828]">
                                {taxRegime || '-'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className=" text-[#101828]">
                                Taxable Income:
                            </Typography.Text>
                            <Typography.Text className=" text-[#101828]">
                                ₹{taxableIncome || '0'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className=" text-[#101828]">
                                Exemptions:
                            </Typography.Text>
                            <Typography.Text className=" text-[#101828]">
                                ₹{exemptions || '0'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className=" text-[#101828]">
                                Net Taxable Income:
                            </Typography.Text>
                            <Typography.Text className=" text-[#101828]">
                                ₹{netTaxableIncome || '0'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className="font-medium text-[#101828]">
                                Total Tax Payable (Annual):
                            </Typography.Text>
                            <Typography.Text className="font-medium text-[#101828]">
                                ₹{totalTaxPayable || '0'}
                            </Typography.Text>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className="font-medium text-[#101828]">
                                Monthly TDS Deduction:
                            </Typography.Text>
                            <Typography.Text className="font-medium text-[#101828]">
                                ₹{monthlyTDSDeduction || '0'}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <Flex vertical className="bg-[#FAFAFA] p-3 rounded-2xl">
                        <Typography.Text className="font-medium text-[1.1rem] text-[#494949]">
                            Tax Calculation
                        </Typography.Text>
                        <Flex vertical gap="small">
                            <Flex vertical className="p-3 bg-[#FFFFFF] rounded-xl">
                                <Flex justify="space-between">
                                    <Typography.Text className="text-[#101828]">
                                        ₹0 – ₹3,00,000 @ 0%:
                                    </Typography.Text>
                                    <Typography.Text className="text-[#101828]">₹0</Typography.Text>
                                </Flex>
                                <Flex justify="space-between">
                                    <Typography.Text className="text-[#101828]">
                                        ₹3,00,001 – ₹4,00,000 @ 5%:
                                    </Typography.Text>
                                    <Typography.Text className="text-[#101828]">
                                        ₹5,000
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                            <Flex justify="space-between">
                                <Typography.Text className="text-[#101828]">
                                    Total Tax (before cess):
                                </Typography.Text>
                                <Typography.Text className="text-[#101828]">₹5,000</Typography.Text>
                            </Flex>
                            <Flex justify="space-between">
                                <Typography.Text className="text-[#101828]">
                                    Add: 4% Health & Education Cess:
                                </Typography.Text>
                                <Typography.Text className="text-[#101828]">₹200</Typography.Text>
                            </Flex>
                            <Flex justify="space-between">
                                <Typography.Text className="text-[#101828]">
                                    Total Tax Payable (Annual):
                                </Typography.Text>
                                <Typography.Text className="text-[#101828]">₹5,200</Typography.Text>
                            </Flex>
                            <Flex justify="space-between">
                                <Typography.Text className="font-medium text-[#101828]">
                                    Monthly TDS Deduction:
                                </Typography.Text>
                                <Typography.Text className="font-medium text-[#101828]">
                                    ₹433.33
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Flex>
                    <Flex justify="end" className="mt-3">
                        <Button className="px-6" danger onClick={handleCancel}>
                            Close
                        </Button>
                    </Flex>
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default TDSModal;
