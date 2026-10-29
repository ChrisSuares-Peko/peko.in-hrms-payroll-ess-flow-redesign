import React, { useState } from 'react';

import { Button, Col, ConfigProvider, Divider, Flex, Skeleton, Table, Typography } from 'antd';

import SalaryPayrollTab from './SalaryPayrollTab';
import { salaryTableData } from '../../types/salaryProfileTypes/ProfileTypes';
import { getMonthName } from '../../utils/general/formatter';
import {
    SalarySectionColumns,
    generateSalaryTableData,
} from '../../utils/salaryProfileColumns/Data';
import SalaryProcessingModal from '../modals/SalaryProcessingModal';

interface profiledataProps {
    profileData?: salaryTableData;
    loading: any;
}
const SalaryPaySlip = ({ profileData, loading }: profiledataProps) => {
    const monthName = profileData ? getMonthName(profileData.month) : '';
    const [openSalaryProcessingModal, setOpenSalaryProcessingModal] = useState(false);
    const tableDatas = generateSalaryTableData(profileData);
    const themeConfig = {
        components: {
            Table: {
                rowHoverBg: 'inherit',
                // headerBg: '#EAECF0',
            },
        },
    };
    return (
        <>
            <Col span={24} md={18} className="h-full xs:mt-4 md:mt-0">
                <Flex gap="small" vertical>
                    <Flex gap="small" vertical className="p-5">
                        {loading ? (
                            <Skeleton />
                        ) : (
                            <>
                                <Flex justify="space-between">
                                    <Flex align="center" justify="flex-start">
                                        <Typography.Text
                                            className="me-3 text-textBlack "
                                            style={{ fontSize: '0.880rem' }}
                                        >
                                            {monthName} {profileData?.year} Salary Info
                                        </Typography.Text>

                                        <Flex
                                            justify="space-around"
                                            className={`flex justify-center items-center m-1 font-medium py-1 px-2 rounded-full ${
                                                profileData?.salaryStatus === 'PENDING'
                                                    ? 'text-red-500 bg-red-100 '
                                                    : 'text-[#DAAA01] bg-[#FFFAEA] '
                                            }`}
                                        >
                                            <Flex
                                                className={`text-transparent ${
                                                    profileData?.salaryStatus === 'PENDING'
                                                        ? 'bg-red-500'
                                                        : 'bg-[#DAAA01]'
                                                } w-1 h-1 rounded-full me-1`}
                                            >
                                                .
                                            </Flex>
                                            <Flex className="text-xs font-normal leading-none max-w-full">
                                                {profileData?.salaryStatus}
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                    <Flex className="m-3" align="center">
                                        <Button
                                            onClick={() => setOpenSalaryProcessingModal(true)}
                                            type="primary"
                                            danger
                                            size="large"
                                        >
                                            Process Salary
                                        </Button>
                                    </Flex>
                                </Flex>
                                <ConfigProvider theme={themeConfig}>
                                    <Table
                                        className="mt-6"
                                        columns={SalarySectionColumns()}
                                        dataSource={tableDatas}
                                        size="small"
                                        scroll={{ x: 568 }}
                                        pagination={false}
                                    />
                                </ConfigProvider>
                            </>
                        )}
                    </Flex>
                    <Divider type="horizontal" className="w-[50vw] xs:hidden md:inline" />
                    <SalaryPayrollTab />
                </Flex>
            </Col>
            <SalaryProcessingModal
                open={openSalaryProcessingModal}
                handleCancel={() => setOpenSalaryProcessingModal(false)}
            />
        </>
    );
};

export default SalaryPaySlip;
