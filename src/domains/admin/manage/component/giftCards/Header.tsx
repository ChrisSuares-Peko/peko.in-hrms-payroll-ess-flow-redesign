import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    setSearchText: (e: any) => void;
    searchText: string;
    setOpenModal: (e: any) => void;
    setOpenUpdateModal: (e: any) => void;
    downloadReport: (type: string) => void;
    accessPermission: any;
};

const GiftCardHeader = ({
    searchText,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    setOpenModal,
    setOpenUpdateModal,
    downloadReport,
    accessPermission,
}: Props) => (
    <Row justify="space-between" className="w-full gap-5">
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
        <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
            {/* <Button
                type="primary"
                className="w-full sm:w-fit"
                danger
                onClick={() => setOpenModal(true)}
            >
                Add Gift Card
            </Button> */}
            {accessPermission && accessPermission.update && (
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={() => setOpenUpdateModal(true)}
                >
                    Auto Update
                </Button>
            )}
            <Input
                value={searchText}
                placeholder="Search For Gift Cards"
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                maxLength={100}
            />
        </Flex>
    </Row>
);
export default GiftCardHeader;
