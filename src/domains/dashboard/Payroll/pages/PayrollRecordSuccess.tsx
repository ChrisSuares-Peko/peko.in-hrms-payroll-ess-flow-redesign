import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useLocation, useNavigate } from 'react-router-dom';

import otherSuccess from '@assets/animation/paymentSuccess2.json';
import { paths } from '@src/routes/paths';

import { useGetExcelProcessSalaryApi } from '../hooks/employeeSalaryHooks/salaryTableHooks/useGetExcelProcessSalaryApi';

const { Title, Text } = Typography;

const PayrollRecordSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { month, year } = location.state || {};

    const { getExcelProcessSalaryList, isLoading } = useGetExcelProcessSalaryApi();
    const defaultOptions = {
        loop: false,
        autoplay: true,
        animationData: otherSuccess,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <Flex align="center" justify="center" vertical className="h-full w-full bg-white px-4">
            <Flex vertical align="center" className="w-full max-w-[560px] text-center">
                <Lottie options={defaultOptions} height={154} width={154} />
                <Title level={3} className="!mt-5 !mb-2 !text-[34px] !font-medium !text-[#1F2937]">
                    You have successfully completed payroll record
                </Title>
                <Text className="mb-7 text-[15px] text-[#6B7280]">
                    Your payroll record has been completed successfully. It is now saved and ready
                    for review.
                </Text>

                <Flex gap={12} wrap="wrap" justify="center">
                    <Button
                        type="primary"
                        danger
                        className="!h-[38px] min-w-[170px] px-4 text-[14px]"
                        onClick={() =>
                            navigate(`/${paths.payroll.index}/${paths.payroll.employeesSalary}`,{replace:true})
                        }
                    >
                        View Payroll Record
                    </Button>
                    <Button
                        className="!h-[38px] min-w-[170px] px-4 text-[14px]"
                        icon={<DownloadOutlined />}
                        onClick={() => getExcelProcessSalaryList(month, year)}
                        loading={isLoading}
                        disabled={!month || !year}
                    >
                        Download Excel File
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PayrollRecordSuccess;
