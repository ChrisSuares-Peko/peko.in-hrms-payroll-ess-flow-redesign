import React from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Flex, Pagination } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';

import { TABLE_HEADER_STYLE } from '../constants/style';
import useConvertToEInvoice from '../hooks/useConvertToEInvoice';
import { ConvertToEInvoiceRow } from '../types/convertToEInvoice';
import convertToEInvoiceColumns from '../utils/table_column/convertToEInvoiceColumns';

const ConvertToEInvoice: React.FC = () => {
    const navigate = useNavigate();
    const { rows, isLoading, isRowLoading, totalRecords, page, setPage, itemsPerPage, handleRowClick } = useConvertToEInvoice();

    const handleCancel = () => {
        navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicing}`);
    };

    const handleStartFresh = () => {
        navigate(`/${paths.invoice.index}/${paths.invoice.generateIrn}`);
    };

    return (
        <Content className="px-0 pt-6">
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                gap={12}
                className="mb-8 flex-col md:flex-row md:items-center"
            >
                <Flex vertical gap={4}>
                    <TypographyText className="text-xl md:text-2xl font-semibold leading-8">
                        Convert your current invoice to E-Invoice
                    </TypographyText>
                    <TypographyText className="text-[#475467] text-sm md:text-base font-normal leading-6">
                        Select the invoices below to generate IRNs and register them with GSTN.
                    </TypographyText>
                </Flex>
                <Flex gap={10} className="flex-shrink-0">
                    <Button
                        type="primary"
                        loading={false}
                        onClick={handleStartFresh}
                        icon={<EditOutlined />}
                        danger
                    >
                        Start Fresh
                    </Button>
                    <Button onClick={handleCancel} className="border-[#FF4F4F] text-[#FF4F4F]">
                        Cancel
                    </Button>
                </Flex>
            </Flex>

            {/* Table */}
            <Flex
                vertical
                className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
            >
                <GenericTable
                    dataSource={rows}
                    columns={convertToEInvoiceColumns}
                    rowKey="id"
                    loading={isLoading || isRowLoading}
                    pagination={false}
                    onRow={(record: ConvertToEInvoiceRow) => ({
                        onClick: () => handleRowClick(record),
                        style: { cursor: 'pointer' },
                    })}
                    components={{
                        header: {
                            cell: ({
                                style,
                                ...rest
                            }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                            ),
                        },
                    }}
                />
                <Flex justify="end">
                    <Pagination
                        current={page}
                        pageSize={itemsPerPage}
                        total={totalRecords}
                        onChange={setPage}
                        showSizeChanger={false}
                        className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                    />
                </Flex>
            </Flex>
        </Content>
    );
};

export default ConvertToEInvoice;
