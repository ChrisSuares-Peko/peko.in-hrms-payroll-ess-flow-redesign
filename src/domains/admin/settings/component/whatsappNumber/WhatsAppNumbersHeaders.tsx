import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import WhatsAppNumberModal from './WhatsAppNumberModal'; // Update this if necessary
import { refresh } from '../../types/refferalCode';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    setRefresh: (refresh: boolean) => void;
    accessPermission: any;
    handleDownloadReport: (type: string) => void;
};

const WhatsAppNumbersHeaders = ({
    searchText,
    handleSearch,
    setRefresh,
    accessPermission,
    handleDownloadReport,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);

    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Button danger onClick={() => handleDownloadReport(DownloadType.Excel)}>
                    Excel
                </Button>
                <Button danger onClick={() => handleDownloadReport(DownloadType.Csv)}>
                    CSV
                </Button>
                <Button danger onClick={() => handleDownloadReport(DownloadType.Pdf)}>
                    PDF
                </Button>
            </Flex>
            <Flex className="flex-col justify-end gap-3 px-0 md:flex-row">
                {accessPermission && accessPermission.write && (
                    <Button type="primary" danger onClick={() => setOpenModal(true)}>
                        Add New WhatsApp Number
                    </Button>
                )}
                <Input
                    value={searchText}
                    placeholder="Search"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {openModal && (
                <WhatsAppNumberModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};

export default WhatsAppNumbersHeaders;
