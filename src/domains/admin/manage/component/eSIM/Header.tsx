import React from 'react';

import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    setSearchText: (e: any) => void;
    searchText: string;
    setOpenModal: (e: any) => void;
    downloadReport: (type: string) => void;
    setOpenBulkModal: (e: boolean) => void;
    accessPermission: any;
    onSyncingPlans: () => void;
    syncPlansLoading: boolean;
};

const OperatorHeader = ({
    searchText,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    setOpenModal,
    downloadReport,
    setOpenBulkModal,
    accessPermission,
    onSyncingPlans,
    syncPlansLoading,
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
            <Button
                icon={<SyncOutlined />}
                loading={syncPlansLoading}
                onClick={onSyncingPlans}
                className="w-full sm:w-fit"
                disabled={syncPlansLoading}
            >
                Update Plans
            </Button>
            {accessPermission && accessPermission.write && (
                <>
                    <Button
                        type="primary"
                        className="w-full sm:w-fit "
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Plans
                    </Button>
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenBulkModal(true)}
                    >
                        Bulk Upload
                    </Button>
                </>
            )}
            <Input
                value={searchText}
                placeholder="Search For Plans..."
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
export default OperatorHeader;
