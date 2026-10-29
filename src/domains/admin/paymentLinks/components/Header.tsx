import React from 'react';

import { SearchOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Flex, Input, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import { DownloadType } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';

interface PaymentLinksHeaderProps {
    searchText: string;
    handleSearch: any;
    accessPermission: any;
    downloadReport: (type: string) => void;
    from: string;
    to: string;
    handleDateChange: (dates: any, dateStrings: any) => void;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
}
const PaymentLinksHeader: React.FC<PaymentLinksHeaderProps> = ({
    searchText,
    handleSearch,
    accessPermission,
    downloadReport,
    from,
    to,
    handleDateChange,
    handleFromChange,
    handleToChange,
}) => {
    const dateFormat = 'YYYY-MM-DD';
    const disabledDate = (current: any) => current && current > dayjs().endOf('day');
    const { xs } = useScreenSize();
    return (
        <Row justify="space-between" align="middle" gutter={[20, 20]} className="w-full">
            <Col xs={24} md={12} xl={5}>
                <Typography.Text className="text-3xl font-normal">Payment Links</Typography.Text>
            </Col>

            <Col xs={24} md={12} xl={5}>
                <Flex gap={16} className="xl:justify-end">
                    <Button danger onClick={() => downloadReport(DownloadType.Excel)}>
                        Excel
                    </Button>

                    <Button danger onClick={() => downloadReport(DownloadType.Csv)}>
                        CSV
                    </Button>

                    <Button danger onClick={() => downloadReport(DownloadType.Pdf)}>
                        PDF
                    </Button>
                </Flex>
            </Col>
            <Col xs={24} md={12} xl={5}>
                {xs ? (
                    <Flex className="w-full" justify="space-between" align="center">
                        <DatePicker
                            className="w-full"
                            onChange={handleFromChange}
                            format={dateFormat}
                            defaultValue={dayjs(from, dateFormat)}
                            disabledDate={disabledDate}
                        />

                        <SwapRightOutlined />

                        <DatePicker
                            className="w-full"
                            onChange={handleToChange}
                            format={dateFormat}
                            defaultValue={dayjs(to, dateFormat)}
                            disabledDate={disabledDate}
                        />
                    </Flex>
                ) : (
                    <DatePicker.RangePicker
                        onChange={handleDateChange}
                        format={dateFormat}
                        value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                        className="w-full"
                        disabledDate={disabledDate}
                    />
                )}
            </Col>
            <Col xs={24} md={12} xl={5}>
                <Input
                    value={searchText}
                    placeholder="Search"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    maxLength={100}
                    className="w-full md:w-auto min-w-52" // Responsive design
                />
            </Col>
            {accessPermission && accessPermission.write && (
                // <Link
                //     className="w-full sm:w-fit border border-[#FF3A3A] flex justify-center items-center px-4 py-2"
                //     to="create-payment-link"
                // >
                //     <Typography.Text style={{ color: colorPrimary }}>
                //         Create Payment Link
                //     </Typography.Text>
                // </Link>
                <Col xs={24} md={12} xl={4}>
                    <Button type="default" danger className="border-[#FF3A3A] text-[#FF3A3A]">
                        <Link to="create-payment-link">Create Payment Link</Link>
                    </Button>
                </Col>
            )}
        </Row>
    );
};

export default PaymentLinksHeader;
