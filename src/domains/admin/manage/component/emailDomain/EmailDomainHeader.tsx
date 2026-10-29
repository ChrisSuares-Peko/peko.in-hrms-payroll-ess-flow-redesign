import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import EmailDomainModal from './EmailDomainModal';

interface modalProps {
    searchText: string;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleSearch: any;
    downloadReport: (type: string) => void;
    accessPermission: any;
}
const EmailDomainHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    downloadReport,
    accessPermission,
}: modalProps) => {
    const [openModal, setOpenModal] = useState(false);
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3 ">
                <Flex className="flex justify-start gap-3">
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
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Business Emails
                    </Button>
                )}
                <Input
                    value={searchText}
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {openModal && (
                <EmailDomainModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                    mode="add"
                />
            )}
        </Row>
    );
};

export default EmailDomainHeader;
