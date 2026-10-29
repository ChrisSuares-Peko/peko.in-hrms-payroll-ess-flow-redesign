import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Grid, Input, Row, Table, Typography, Skeleton, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { bulkBalanceDataArray, limitData } from '../utils/data';
import { beneficiaryBalanceColumn } from '../utils/tableColumn';

const { Text } = Typography;

const BulkPayReview = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const navigate = useNavigate();
    const { useBreakpoint } = Grid;
    const totalAmount = 1000;
    const screens = useBreakpoint();

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[], selectedRows: any[]) => {
            const activeRowKeys = selectedRows
                .filter(row => row.isActive)
                .map(row => row.key) as React.Key[];
            setSelectedRowKeys(activeRowKeys);
        },
        getCheckboxProps: (record: any) => ({
            disabled: !record.isActive,
        }),
    };

    return (
        <Row gutter={[20, 20]}>
            <Col span={24}>
                <Text className="font-medium text-lg sm:text-xl">Electricity Bill</Text>
            </Col>

            <Col span={24} className="w-full h-[30rem] sm:h-[26rem] overflow-x-auto">
                <Row justify="end" className="mb-5">
                    <Col sm={12} lg={10} xl={8} xs={24}>
                        <Input
                            placeholder="Search beneficiary"
                            allowClear
                            suffix={<SearchOutlined />}
                            variant="outlined"
                            // value={searchValue}
                            // onChange={e => handleSearch(e.target.value)}
                        />
                        {/* <Input
                        placeholder="Search beneficiary"
                        className="text-sm sm:text-base"
                        addonAfter={<SearchOutlined />}
                        allowClear
                        type="text"
                        minLength={8}
                        maxLength={20}
                        value={searchValue}
                        onChange={e => handleSearch(e.target.value)}
                    /> */}
                    </Col>
                </Row>
                {limitData && bulkBalanceDataArray ? (
                    <Table
                        rowSelection={rowSelection}
                        columns={beneficiaryBalanceColumn(screens, limitData)}
                        dataSource={bulkBalanceDataArray.map(data => ({
                            ...data,
                            key: data.data.id,
                        }))}
                        pagination={false}
                        rowClassName={record =>
                            !record.status ? 'cursor-not-allowed  opacity-50' : ''
                        }
                    />
                ) : (
                    <Skeleton paragraph={{ rows: 8 }} className="mt-10" />
                )}
            </Col>
            <Flex className="w-full px-5 mt-3" justify="space-between">
                <Typography.Text className="text-lg sm:text-2xl font-semibold">
                    Amount
                </Typography.Text>
                <Typography.Text className="text-lg sm:text-2xl font-semibold ">
                    ₹ {formatNumberWithLocalString(totalAmount)}
                </Typography.Text>
            </Flex>
            <Divider />
            <Flex justify="start" className="w-full mt-5" gap={30}>
                <Button
                    key="submit"
                    type="primary"
                    htmlType="submit"
                    danger
                    className="px-8 md:px-10 h-10"
                    // loading={isbulkLoading}
                    // onClick={() =>
                    //     bulkPaymentApi(totalAmount, amounts, selectedRows, inputValidity)
                    // }
                >
                    Pay ₹ {formatNumberWithLocalString(totalAmount)}
                </Button>
                <Button className="px-8 md:px-14 h-10" onClick={() => navigate(-1)}>
                    Cancel
                </Button>
            </Flex>
        </Row>
    );
};

export default BulkPayReview;
